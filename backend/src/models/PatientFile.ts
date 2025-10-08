import mongoose, { Schema, Document } from 'mongoose';

export interface IPatientFile extends Document {
  patientId: mongoose.Types.ObjectId;
  clinicId: mongoose.Types.ObjectId;
  uploadedBy: mongoose.Types.ObjectId;
  appointmentId?: mongoose.Types.ObjectId;
  fileType: 'x-ray' | 'scan' | 'note' | 'lab-result' | 'consent-form' | 'other';
  fileName: string;
  originalFileName: string;
  fileUrl: string;
  fileSize: number; // in bytes
  mimeType: string;
  title: string;
  description?: string;
  category?: string;
  tags: string[];
  uploadDate: Date;
  captureDate?: Date; // Date when the image/scan was taken
  metadata: {
    width?: number;
    height?: number;
    resolution?: string;
    device?: string;
    technician?: string;
    notes?: string;
  };
  isEncrypted: boolean;
  encryptionKey?: string;
  accessLog: Array<{
    userId: mongoose.Types.ObjectId;
    accessDate: Date;
    action: 'view' | 'download' | 'share';
    ipAddress?: string;
  }>;
  sharedWith: Array<{
    userId: mongoose.Types.ObjectId;
    sharedAt: Date;
    expiresAt?: Date;
    permissions: ('view' | 'download')[];
  }>;
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Custom statics-only typing to avoid tight coupling to Mongoose generics
export interface IPatientFileModel {
  findByPatient(patientId: string, options?: any): Promise<IPatientFile[]>;
  findByClinic(clinicId: string, options?: any): Promise<IPatientFile[]>;
  findByType(fileType: string, patientId?: string): Promise<IPatientFile[]>;
  logAccess(fileId: string, userId: string, action: string, ipAddress?: string): Promise<void>;
}

const patientFileSchema = new Schema<IPatientFile>({
  patientId: {
    type: Schema.Types.ObjectId,
    ref: 'Patient',
    required: [true, 'Patient ID is required'],
    index: true
  },
  clinicId: {
    type: Schema.Types.ObjectId,
    ref: 'Clinic',
    required: [true, 'Clinic ID is required'],
    index: true
  },
  uploadedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Uploader ID is required']
  },
  appointmentId: {
    type: Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  fileType: {
    type: String,
    enum: ['x-ray', 'scan', 'note', 'lab-result', 'consent-form', 'other'],
    required: [true, 'File type is required'],
    index: true
  },
  fileName: {
    type: String,
    required: [true, 'File name is required'],
    trim: true
  },
  originalFileName: {
    type: String,
    required: [true, 'Original file name is required'],
    trim: true
  },
  fileUrl: {
    type: String,
    required: [true, 'File URL is required']
  },
  fileSize: {
    type: Number,
    required: [true, 'File size is required'],
    min: 0
  },
  mimeType: {
    type: String,
    required: [true, 'MIME type is required']
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  category: {
    type: String,
    trim: true,
    maxlength: [100, 'Category cannot exceed 100 characters']
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  uploadDate: {
    type: Date,
    default: Date.now,
    required: true
  },
  captureDate: {
    type: Date
  },
  metadata: {
    width: Number,
    height: Number,
    resolution: String,
    device: String,
    technician: String,
    notes: String
  },
  isEncrypted: {
    type: Boolean,
    default: true
  },
  encryptionKey: {
    type: String,
    select: false // Don't return this by default
  },
  accessLog: [{
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    accessDate: {
      type: Date,
      default: Date.now,
      required: true
    },
    action: {
      type: String,
      enum: ['view', 'download', 'share'],
      required: true
    },
    ipAddress: String
  }],
  sharedWith: [{
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    sharedAt: {
      type: Date,
      default: Date.now,
      required: true
    },
    expiresAt: Date,
    permissions: [{
      type: String,
      enum: ['view', 'download']
    }]
  }],
  isDeleted: {
    type: Boolean,
    default: false,
    index: true
  },
  deletedAt: Date,
  deletedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function(doc: any, ret: any) {
      ret.id = ret._id;
      if (ret._id) delete ret._id;
      if (ret.__v) delete ret.__v;
      if (ret.encryptionKey) delete ret.encryptionKey; // Never expose encryption key
      return ret;
    }
  }
});

// Compound indexes for efficient queries
patientFileSchema.index({ patientId: 1, uploadDate: -1 });
patientFileSchema.index({ clinicId: 1, fileType: 1 });
patientFileSchema.index({ patientId: 1, fileType: 1, isDeleted: 1 });
patientFileSchema.index({ uploadedBy: 1, uploadDate: -1 });
patientFileSchema.index({ tags: 1 });
patientFileSchema.index({ captureDate: -1 });

// Text index for search
patientFileSchema.index({ 
  title: 'text', 
  description: 'text', 
  originalFileName: 'text',
  tags: 'text'
});

// Virtual for file size in readable format
patientFileSchema.virtual('fileSizeFormatted').get(function() {
  const bytes = this.fileSize;
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
});

// Virtual for checking if file is expired (for shared files)
patientFileSchema.virtual('isAccessExpired').get(function() {
  return this.sharedWith.some(share => 
    share.expiresAt && share.expiresAt < new Date()
  );
});

// Static method to find files by patient
patientFileSchema.statics.findByPatient = async function(
  patientId: string, 
  options: any = {}
) {
  const { fileType, startDate, endDate, limit = 50, skip = 0 } = options;
  
  const query: any = { 
    patientId,
    isDeleted: false
  };
  
  if (fileType) {
    query.fileType = fileType;
  }
  
  if (startDate || endDate) {
    query.uploadDate = {};
    if (startDate) query.uploadDate.$gte = new Date(startDate);
    if (endDate) query.uploadDate.$lte = new Date(endDate);
  }
  
  return this.find(query)
    .populate('uploadedBy', 'firstName lastName email')
    .populate('clinicId', 'name address')
    .populate('appointmentId', 'date timeSlot')
    .sort({ uploadDate: -1 })
    .limit(limit)
    .skip(skip);
};

// Static method to find files by clinic
patientFileSchema.statics.findByClinic = async function(
  clinicId: string,
  options: any = {}
) {
  const { fileType, startDate, endDate, limit = 100, skip = 0 } = options;
  
  const query: any = { 
    clinicId,
    isDeleted: false
  };
  
  if (fileType) {
    query.fileType = fileType;
  }
  
  if (startDate || endDate) {
    query.uploadDate = {};
    if (startDate) query.uploadDate.$gte = new Date(startDate);
    if (endDate) query.uploadDate.$lte = new Date(endDate);
  }
  
  return this.find(query)
    .populate('patientId', 'firstName lastName email')
    .populate('uploadedBy', 'firstName lastName')
    .sort({ uploadDate: -1 })
    .limit(limit)
    .skip(skip);
};

// Static method to find files by type
patientFileSchema.statics.findByType = async function(
  fileType: string,
  patientId?: string
) {
  const query: any = {
    fileType,
    isDeleted: false
  };
  
  if (patientId) {
    query.patientId = patientId;
  }
  
  return this.find(query)
    .populate('patientId', 'firstName lastName')
    .populate('uploadedBy', 'firstName lastName')
    .sort({ uploadDate: -1 });
};

// Static method to log file access
patientFileSchema.statics.logAccess = async function(
  fileId: string,
  userId: string,
  action: 'view' | 'download' | 'share',
  ipAddress?: string
) {
  return this.findByIdAndUpdate(
    fileId,
    {
      $push: {
        accessLog: {
          userId,
          accessDate: new Date(),
          action,
          ipAddress
        }
      }
    },
    { new: true }
  );
};

// Instance method to soft delete
patientFileSchema.methods.softDelete = function(userId: mongoose.Types.ObjectId) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = userId;
  return this.save();
};

// Instance method to share with user
patientFileSchema.methods.shareWith = function(
  userId: mongoose.Types.ObjectId,
  permissions: ('view' | 'download')[],
  expiresAt?: Date
) {
  this.sharedWith.push({
    userId,
    sharedAt: new Date(),
    expiresAt,
    permissions
  });
  return this.save();
};

// Pre-save middleware to set defaults
patientFileSchema.pre('save', function(next) {
  if (this.isNew && !this.uploadDate) {
    this.uploadDate = new Date();
  }
  next();
});

const PatientFile = mongoose.model('PatientFile', patientFileSchema) as any;

export default PatientFile;

