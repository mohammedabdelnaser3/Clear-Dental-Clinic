import mongoose, { Schema } from 'mongoose';
import { IPatientReport, IPatientReportModel } from '../types';

const patientReportSchema = new Schema<IPatientReport>({
  patientId: {
    type: Schema.Types.ObjectId,
    ref: 'Patient',
    required: [true, 'Patient ID is required']
  },
  dentistId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Dentist ID is required']
  },
  clinicId: {
    type: Schema.Types.ObjectId,
    ref: 'Clinic',
    required: [true, 'Clinic ID is required']
  },
  title: {
    type: String,
    required: [true, 'Report title is required'],
    trim: true,
    maxlength: [200, 'Report title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Report description is required'],
    trim: true,
    maxlength: [2000, 'Report description cannot exceed 2000 characters']
  },
  date: {
    type: Date,
    required: [true, 'Report date is required'],
    validate: {
      validator: function(value: Date) {
        return value <= new Date();
      },
      message: 'Report date cannot be in the future'
    }
  },
  attachments: [{
    id: {
      type: String,
      required: true
    },
    fileName: {
      type: String,
      required: [true, 'File name is required'],
      trim: true,
      maxlength: [255, 'File name cannot exceed 255 characters']
    },
    fileType: {
      type: String,
      required: [true, 'File type is required'],
      enum: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain'],
      trim: true
    },
    fileUrl: {
      type: String,
      required: [true, 'File URL is required'],
      trim: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isShared: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function(doc: any, ret: any) {
      ret.id = ret._id;
      if (ret._id) delete (ret as any)._id;
      if (ret.__v) delete (ret as any).__v;
      return ret;
    }
  }
});

// Indexes
patientReportSchema.index({ patientId: 1 });
patientReportSchema.index({ dentistId: 1 });
patientReportSchema.index({ clinicId: 1 });
patientReportSchema.index({ date: 1 });
patientReportSchema.index({ title: 1 });
patientReportSchema.index({ createdAt: 1 });

// Compound indexes for common queries
patientReportSchema.index({ patientId: 1, date: -1 });
patientReportSchema.index({ dentistId: 1, date: -1 });
patientReportSchema.index({ clinicId: 1, date: -1 });

// Virtual for attachment count
patientReportSchema.virtual('attachmentCount').get(function() {
  return this.attachments ? this.attachments.length : 0;
});

// Instance method to add attachment
patientReportSchema.methods.addAttachment = function(attachment: any) {
  this.attachments.push({
    id: new mongoose.Types.ObjectId().toString(),
    ...attachment,
    uploadedAt: new Date()
  });
  return this.save();
};

// Instance method to remove attachment
patientReportSchema.methods.removeAttachment = function(attachmentId: string) {
  this.attachments = this.attachments.filter((att: any) => att.id !== attachmentId);
  return this.save();
};

// Static method to find by patient
patientReportSchema.statics.findByPatient = function(patientId: string) {
  return this.find({ patientId }).sort({ date: -1 });
};

// Static method to find by dentist
patientReportSchema.statics.findByDentist = function(dentistId: string) {
  return this.find({ dentistId }).sort({ date: -1 });
};

// Static method to find by clinic
patientReportSchema.statics.findByClinic = function(clinicId: string) {
  return this.find({ clinicId }).sort({ date: -1 });
};

// Static method to find by date range
patientReportSchema.statics.findByDateRange = function(startDate: Date, endDate: Date) {
  return this.find({
    date: {
      $gte: startDate,
      $lte: endDate
    }
  }).sort({ date: -1 });
};

// Static method to search reports
patientReportSchema.statics.searchReports = function(searchTerm: string, options: {
  patientId?: string;
  dentistId?: string;
  clinicId?: string;
  skip?: number;
  limit?: number;
} = {}) {
  const searchRegex = new RegExp(searchTerm, 'i');
  const query: any = {
    $or: [
      { title: searchRegex },
      { description: searchRegex }
    ]
  };
  
  if (options.patientId) {
    query.patientId = options.patientId;
  }
  
  if (options.dentistId) {
    query.dentistId = options.dentistId;
  }
  
  if (options.clinicId) {
    query.clinicId = options.clinicId;
  }
  
  const queryBuilder = this.find(query)
    .populate('patientId', 'firstName lastName email')
    .populate('dentistId', 'firstName lastName specialization')
    .populate('clinicId', 'name address')
    .sort({ date: -1 });
    
  if (options.skip) {
    queryBuilder.skip(options.skip);
  }
  
  if (options.limit) {
    queryBuilder.limit(options.limit);
  }
  
  return queryBuilder;
};

const PatientReport = mongoose.model<IPatientReport, IPatientReportModel>('PatientReport', patientReportSchema);

export default PatientReport;
