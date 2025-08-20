import mongoose, { Schema } from 'mongoose';
import { ITreatmentRecord, ITreatmentRecordModel } from '../types';

const treatmentRecordSchema = new Schema<ITreatmentRecord>({
  patientId: {
    type: Schema.Types.ObjectId,
    ref: 'Patient',
    required: [true, 'Patient ID is required']
  },
  date: {
    type: Date,
    required: [true, 'Treatment date is required'],
    validate: {
      validator: function(value: Date) {
        return value <= new Date();
      },
      message: 'Treatment date cannot be in the future'
    }
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
  procedure: {
    type: String,
    required: [true, 'Procedure is required'],
    trim: true,
    maxlength: [200, 'Procedure description cannot exceed 200 characters']
  },
  diagnosis: {
    type: String,
    required: [true, 'Diagnosis is required'],
    trim: true,
    maxlength: [500, 'Diagnosis cannot exceed 500 characters']
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [2000, 'Notes cannot exceed 2000 characters']
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
  }]
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
treatmentRecordSchema.index({ patientId: 1 });
treatmentRecordSchema.index({ dentistId: 1 });
treatmentRecordSchema.index({ clinicId: 1 });
treatmentRecordSchema.index({ date: 1 });
treatmentRecordSchema.index({ procedure: 1 });
treatmentRecordSchema.index({ createdAt: 1 });

// Compound indexes for common queries
treatmentRecordSchema.index({ patientId: 1, date: -1 });
treatmentRecordSchema.index({ dentistId: 1, date: -1 });
treatmentRecordSchema.index({ clinicId: 1, date: -1 });

// Virtual for attachment count
treatmentRecordSchema.virtual('attachmentCount').get(function() {
  return this.attachments ? this.attachments.length : 0;
});

// Instance method to add attachment
treatmentRecordSchema.methods.addAttachment = function(attachment: any) {
  this.attachments.push({
    id: new mongoose.Types.ObjectId().toString(),
    ...attachment,
    uploadedAt: new Date()
  });
  return this.save();
};

// Instance method to remove attachment
treatmentRecordSchema.methods.removeAttachment = function(attachmentId: string) {
  this.attachments = this.attachments.filter((att: any) => att.id !== attachmentId);
  return this.save();
};

// Static method to find by patient
treatmentRecordSchema.statics.findByPatient = function(patientId: string) {
  return this.find({ patientId }).sort({ date: -1 });
};

// Static method to find by dentist
treatmentRecordSchema.statics.findByDentist = function(dentistId: string) {
  return this.find({ dentistId }).sort({ date: -1 });
};

// Static method to find by clinic
treatmentRecordSchema.statics.findByClinic = function(clinicId: string) {
  return this.find({ clinicId }).sort({ date: -1 });
};

// Static method to find by date range
treatmentRecordSchema.statics.findByDateRange = function(startDate: Date, endDate: Date) {
  return this.find({
    date: {
      $gte: startDate,
      $lte: endDate
    }
  }).sort({ date: -1 });
};

// Static method to search treatment records
treatmentRecordSchema.statics.searchRecords = function(searchTerm: string, patientId?: string) {
  const searchRegex = new RegExp(searchTerm, 'i');
  const query: any = {
    $or: [
      { procedure: searchRegex },
      { diagnosis: searchRegex },
      { notes: searchRegex }
    ]
  };
  
  if (patientId) {
    query.patientId = patientId;
  }
  
  return this.find(query).sort({ date: -1 });
};

// Static method to search treatment records with pagination
treatmentRecordSchema.statics.searchTreatmentRecords = function(
  searchTerm: string,
  options: {
    patientId?: string;
    dentistId?: string;
    clinicId?: string;
    skip?: number;
    limit?: number;
  } = {}
) {
  const searchRegex = new RegExp(searchTerm, 'i');
  const query: any = {
    $or: [
      { procedure: searchRegex },
      { diagnosis: searchRegex },
      { notes: searchRegex }
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

// Static method to count search results
treatmentRecordSchema.statics.countSearchResults = function(
  searchTerm: string,
  options: {
    patientId?: string;
    dentistId?: string;
    clinicId?: string;
  } = {}
) {
  const searchRegex = new RegExp(searchTerm, 'i');
  const query: any = {
    $or: [
      { procedure: searchRegex },
      { diagnosis: searchRegex },
      { notes: searchRegex }
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
  
  return this.countDocuments(query);
};

const TreatmentRecord = mongoose.model<ITreatmentRecord, ITreatmentRecordModel>('TreatmentRecord', treatmentRecordSchema);

export default TreatmentRecord;