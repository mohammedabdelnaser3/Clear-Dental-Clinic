import { Schema, model, Document, Types } from 'mongoose';

export interface IInsuranceClaim extends Document {
  _id: Types.ObjectId;
  
  // Basic Information
  claimNumber: string;
  insuranceId: Types.ObjectId;
  patientId: Types.ObjectId;
  providerId: Types.ObjectId;
  clinicId: Types.ObjectId;
  
  // Associated Records
  appointmentId?: Types.ObjectId;
  treatmentRecordId?: Types.ObjectId;
  billingId?: Types.ObjectId;
  
  // Claim Details
  serviceDate: Date;
  submissionDate: Date;
  claimType: 'primary' | 'secondary' | 'predetermination';
  
  // Services and Procedures
  procedures: Array<{
    code: string; // ADA procedure code
    description: string;
    tooth?: string;
    surface?: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  
  // Amounts
  totalBilled: number;
  totalAllowed: number;
  totalPaid: number;
  patientResponsibility: number;
  deductibleApplied: number;
  copayAmount: number;
  coinsuranceAmount: number;
  
  // Status and Processing
  status: 'draft' | 'submitted' | 'pending' | 'processed' | 'paid' | 'denied' | 'rejected' | 'appealed';
  submissionMethod: 'electronic' | 'paper' | 'online_portal';
  
  // Response Information
  processedDate?: Date;
  paidDate?: Date;
  explanationOfBenefits?: string;
  denialReason?: string;
  denialCode?: string;
  
  // Prior Authorization
  priorAuthNumber?: string;
  priorAuthRequired: boolean;
  priorAuthObtained: boolean;
  
  // Attachments and Documentation
  attachments?: Array<{
    filename: string;
    path: string;
    description: string;
    uploadedAt: Date;
    uploadedBy: Types.ObjectId;
  }>;
  
  // Communication
  correspondenceLog?: Array<{
    date: Date;
    type: 'email' | 'phone' | 'mail' | 'portal';
    direction: 'inbound' | 'outbound';
    subject: string;
    notes: string;
    handledBy: Types.ObjectId;
  }>;
  
  // Processing Details
  clearinghouse?: string;
  electronicClaimId?: string;
  batchNumber?: string;
  
  // Appeals
  appealHistory?: Array<{
    appealDate: Date;
    appealReason: string;
    appealStatus: 'pending' | 'approved' | 'denied';
    appealOutcome?: string;
    appealedBy: Types.ObjectId;
  }>;
  
  // Follow-up
  followUpRequired: boolean;
  followUpDate?: Date;
  followUpReason?: string;
  
  // Audit
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const insuranceClaimSchema = new Schema<IInsuranceClaim>({
  claimNumber: {
    type: String,
    required: [true, 'Claim number is required'],
    unique: true,
    trim: true,
    maxlength: [50, 'Claim number cannot exceed 50 characters']
  },
  insuranceId: {
    type: Schema.Types.ObjectId,
    ref: 'Insurance',
    required: [true, 'Insurance ID is required']
  },
  patientId: {
    type: Schema.Types.ObjectId,
    ref: 'Patient',
    required: [true, 'Patient ID is required']
  },
  providerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Provider ID is required']
  },
  clinicId: {
    type: Schema.Types.ObjectId,
    ref: 'Clinic',
    required: [true, 'Clinic ID is required']
  },
  
  // Associated Records
  appointmentId: {
    type: Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  treatmentRecordId: {
    type: Schema.Types.ObjectId,
    ref: 'TreatmentRecord'
  },
  billingId: {
    type: Schema.Types.ObjectId,
    ref: 'Billing'
  },
  
  // Claim Details
  serviceDate: {
    type: Date,
    required: [true, 'Service date is required']
  },
  submissionDate: {
    type: Date,
    required: [true, 'Submission date is required'],
    default: Date.now
  },
  claimType: {
    type: String,
    required: [true, 'Claim type is required'],
    enum: ['primary', 'secondary', 'predetermination']
  },
  
  // Services and Procedures
  procedures: [{
    code: {
      type: String,
      required: [true, 'Procedure code is required'],
      trim: true,
      maxlength: [10, 'Procedure code cannot exceed 10 characters']
    },
    description: {
      type: String,
      required: [true, 'Procedure description is required'],
      trim: true,
      maxlength: [500, 'Procedure description cannot exceed 500 characters']
    },
    tooth: {
      type: String,
      trim: true,
      maxlength: [5, 'Tooth designation cannot exceed 5 characters']
    },
    surface: {
      type: String,
      trim: true,
      maxlength: [10, 'Surface designation cannot exceed 10 characters']
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
      default: 1
    },
    unitPrice: {
      type: Number,
      required: [true, 'Unit price is required'],
      min: [0, 'Unit price cannot be negative']
    },
    totalPrice: {
      type: Number,
      required: [true, 'Total price is required'],
      min: [0, 'Total price cannot be negative']
    }
  }],
  
  // Amounts
  totalBilled: {
    type: Number,
    required: [true, 'Total billed amount is required'],
    min: [0, 'Total billed cannot be negative']
  },
  totalAllowed: {
    type: Number,
    min: [0, 'Total allowed cannot be negative'],
    default: 0
  },
  totalPaid: {
    type: Number,
    min: [0, 'Total paid cannot be negative'],
    default: 0
  },
  patientResponsibility: {
    type: Number,
    min: [0, 'Patient responsibility cannot be negative'],
    default: 0
  },
  deductibleApplied: {
    type: Number,
    min: [0, 'Deductible applied cannot be negative'],
    default: 0
  },
  copayAmount: {
    type: Number,
    min: [0, 'Copay amount cannot be negative'],
    default: 0
  },
  coinsuranceAmount: {
    type: Number,
    min: [0, 'Coinsurance amount cannot be negative'],
    default: 0
  },
  
  // Status and Processing
  status: {
    type: String,
    required: [true, 'Claim status is required'],
    enum: ['draft', 'submitted', 'pending', 'processed', 'paid', 'denied', 'rejected', 'appealed'],
    default: 'draft'
  },
  submissionMethod: {
    type: String,
    enum: ['electronic', 'paper', 'online_portal'],
    default: 'electronic'
  },
  
  // Response Information
  processedDate: {
    type: Date
  },
  paidDate: {
    type: Date
  },
  explanationOfBenefits: {
    type: String,
    trim: true,
    maxlength: [2000, 'Explanation of benefits cannot exceed 2000 characters']
  },
  denialReason: {
    type: String,
    trim: true,
    maxlength: [1000, 'Denial reason cannot exceed 1000 characters']
  },
  denialCode: {
    type: String,
    trim: true,
    maxlength: [10, 'Denial code cannot exceed 10 characters']
  },
  
  // Prior Authorization
  priorAuthNumber: {
    type: String,
    trim: true,
    maxlength: [50, 'Prior authorization number cannot exceed 50 characters']
  },
  priorAuthRequired: {
    type: Boolean,
    default: false
  },
  priorAuthObtained: {
    type: Boolean,
    default: false
  },
  
  // Attachments and Documentation
  attachments: [{
    filename: {
      type: String,
      required: true,
      trim: true
    },
    path: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Attachment description cannot exceed 500 characters']
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  }],
  
  // Communication
  correspondenceLog: [{
    date: {
      type: Date,
      required: true,
      default: Date.now
    },
    type: {
      type: String,
      required: true,
      enum: ['email', 'phone', 'mail', 'portal']
    },
    direction: {
      type: String,
      required: true,
      enum: ['inbound', 'outbound']
    },
    subject: {
      type: String,
      required: true,
      trim: true,
      maxlength: [200, 'Subject cannot exceed 200 characters']
    },
    notes: {
      type: String,
      required: true,
      trim: true,
      maxlength: [2000, 'Notes cannot exceed 2000 characters']
    },
    handledBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  }],
  
  // Processing Details
  clearinghouse: {
    type: String,
    trim: true,
    maxlength: [100, 'Clearinghouse name cannot exceed 100 characters']
  },
  electronicClaimId: {
    type: String,
    trim: true,
    maxlength: [50, 'Electronic claim ID cannot exceed 50 characters']
  },
  batchNumber: {
    type: String,
    trim: true,
    maxlength: [50, 'Batch number cannot exceed 50 characters']
  },
  
  // Appeals
  appealHistory: [{
    appealDate: {
      type: Date,
      required: true,
      default: Date.now
    },
    appealReason: {
      type: String,
      required: true,
      trim: true,
      maxlength: [1000, 'Appeal reason cannot exceed 1000 characters']
    },
    appealStatus: {
      type: String,
      required: true,
      enum: ['pending', 'approved', 'denied']
    },
    appealOutcome: {
      type: String,
      trim: true,
      maxlength: [1000, 'Appeal outcome cannot exceed 1000 characters']
    },
    appealedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  }],
  
  // Follow-up
  followUpRequired: {
    type: Boolean,
    default: false
  },
  followUpDate: {
    type: Date
  },
  followUpReason: {
    type: String,
    trim: true,
    maxlength: [500, 'Follow-up reason cannot exceed 500 characters']
  },
  
  // Audit
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'CreatedBy is required']
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
insuranceClaimSchema.index({ insuranceId: 1 });
insuranceClaimSchema.index({ patientId: 1 });
insuranceClaimSchema.index({ providerId: 1 });
insuranceClaimSchema.index({ clinicId: 1 });
insuranceClaimSchema.index({ status: 1 });
insuranceClaimSchema.index({ serviceDate: -1 });
insuranceClaimSchema.index({ submissionDate: -1 });
insuranceClaimSchema.index({ followUpRequired: 1, followUpDate: 1 });

// Pre-save middleware
insuranceClaimSchema.pre('save', function(next) {
  // Auto-generate claim number if not provided
  if (!this.claimNumber) {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.claimNumber = `CLM-${timestamp}-${random}`;
  }
  
  // Calculate total billed from procedures
  if (this.isModified('procedures')) {
    this.totalBilled = this.procedures.reduce((sum, proc) => sum + proc.totalPrice, 0);
  }
  
  // Set follow-up required for certain statuses
  if (this.isModified('status')) {
    if (['denied', 'rejected'].includes(this.status)) {
      this.followUpRequired = true;
      if (!this.followUpDate) {
        this.followUpDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
      }
    }
  }
  
  next();
});

// Static methods
insuranceClaimSchema.statics.findByPatient = function(patientId: string, options: any = {}) {
  const { skip = 0, limit = 10, status } = options;
  const query: any = { patientId };
  
  if (status) {
    query.status = status;
  }
  
  return this.find(query)
    .populate('insuranceId', 'insuranceCompany policyNumber')
    .populate('providerId', 'firstName lastName')
    .populate('clinicId', 'name')
    .sort({ serviceDate: -1 })
    .skip(skip)
    .limit(limit);
};

insuranceClaimSchema.statics.findByInsurance = function(insuranceId: string) {
  return this.find({ insuranceId })
    .populate('patientId', 'firstName lastName')
    .populate('providerId', 'firstName lastName')
    .sort({ serviceDate: -1 });
};

insuranceClaimSchema.statics.findPendingClaims = function(clinicId?: string) {
  const query: any = { status: { $in: ['submitted', 'pending'] } };
  
  if (clinicId) {
    query.clinicId = clinicId;
  }
  
  return this.find(query)
    .populate('patientId', 'firstName lastName')
    .populate('insuranceId', 'insuranceCompany')
    .sort({ submissionDate: 1 });
};

insuranceClaimSchema.statics.findClaimsNeedingFollowUp = function(clinicId?: string) {
  const query: any = { 
    followUpRequired: true,
    followUpDate: { $lte: new Date() }
  };
  
  if (clinicId) {
    query.clinicId = clinicId;
  }
  
  return this.find(query)
    .populate('patientId', 'firstName lastName')
    .populate('insuranceId', 'insuranceCompany')
    .sort({ followUpDate: 1 });
};

insuranceClaimSchema.statics.getClaimStatistics = function(clinicId?: string, dateRange?: { start: Date; end: Date }) {
  const matchStage: any = {};
  
  if (clinicId) {
    matchStage.clinicId = new Types.ObjectId(clinicId);
  }
  
  if (dateRange) {
    matchStage.serviceDate = {
      $gte: dateRange.start,
      $lte: dateRange.end
    };
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalBilled: { $sum: '$totalBilled' },
        totalPaid: { $sum: '$totalPaid' },
        averageProcessingTime: {
          $avg: {
            $cond: {
              if: { $and: ['$processedDate', '$submissionDate'] },
              then: { $subtract: ['$processedDate', '$submissionDate'] },
              else: null
            }
          }
        }
      }
    }
  ]);
};

// Instance methods
insuranceClaimSchema.methods.submit = function() {
  this.status = 'submitted';
  this.submissionDate = new Date();
  return this.save();
};

insuranceClaimSchema.methods.markAsProcessed = function(processedData: {
  totalAllowed?: number;
  totalPaid?: number;
  patientResponsibility?: number;
  explanationOfBenefits?: string;
}) {
  this.status = 'processed';
  this.processedDate = new Date();
  
  Object.assign(this, processedData);
  
  return this.save();
};

insuranceClaimSchema.methods.markAsPaid = function() {
  this.status = 'paid';
  this.paidDate = new Date();
  this.followUpRequired = false;
  return this.save();
};

insuranceClaimSchema.methods.deny = function(reason: string, code?: string) {
  this.status = 'denied';
  this.denialReason = reason;
  this.denialCode = code;
  this.processedDate = new Date();
  this.followUpRequired = true;
  return this.save();
};

insuranceClaimSchema.methods.addAppeal = function(appealData: {
  reason: string;
  appealedBy: Types.ObjectId;
}) {
  if (!this.appealHistory) {
    this.appealHistory = [];
  }
  
  this.appealHistory.push({
    appealDate: new Date(),
    appealReason: appealData.reason,
    appealStatus: 'pending',
    appealedBy: appealData.appealedBy
  });
  
  this.status = 'appealed';
  return this.save();
};

insuranceClaimSchema.methods.addCorrespondence = function(correspondenceData: {
  type: string;
  direction: string;
  subject: string;
  notes: string;
  handledBy: Types.ObjectId;
}) {
  if (!this.correspondenceLog) {
    this.correspondenceLog = [];
  }
  
  this.correspondenceLog.push({
    date: new Date(),
    ...correspondenceData
  });
  
  return this.save();
};

// Instance methods
insuranceClaimSchema.methods.submit = function() {
  this.status = 'submitted';
  this.submittedDate = new Date();
  return this.save();
};

insuranceClaimSchema.methods.markAsProcessed = function() {
  this.status = 'processed';
  this.processedDate = new Date();
  return this.save();
};

insuranceClaimSchema.methods.markAsPaid = function(amount?: number) {
  this.status = 'paid';
  this.paidDate = new Date();
  if (amount) {
    this.paidAmount = amount;
  }
  return this.save();
};

insuranceClaimSchema.methods.deny = function(reason: string) {
  this.status = 'denied';
  this.deniedDate = new Date();
  this.denialReason = reason;
  return this.save();
};

insuranceClaimSchema.methods.addAppeal = function(appealData: any) {
  this.status = 'under_review';
  this.appealDate = new Date();
  this.appealReason = appealData.reason;
  return this.save();
};

insuranceClaimSchema.methods.addCorrespondence = function(correspondence: any) {
  if (!this.correspondenceLog) {
    this.correspondenceLog = [];
  }
  this.correspondenceLog.push({
    ...correspondence,
    date: new Date()
  });
  return this.save();
};

// Static methods
insuranceClaimSchema.statics.findByPatient = function(patientId: string, options: any = {}) {
  const { skip = 0, limit = 10 } = options;
  return this.find({ patientId })
    .populate('insuranceId', 'providerName policyNumber')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

insuranceClaimSchema.statics.findByInsurance = function(insuranceId: string) {
  return this.find({ insuranceId })
    .populate('patientId', 'firstName lastName')
    .sort({ createdAt: -1 });
};

insuranceClaimSchema.statics.findPendingClaims = function() {
  return this.find({ status: { $in: ['submitted', 'under_review'] } })
    .populate('patientId', 'firstName lastName')
    .populate('insuranceId', 'providerName')
    .sort({ submittedDate: 1 });
};

insuranceClaimSchema.statics.findClaimsNeedingFollowUp = function() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  return this.find({
    status: 'submitted',
    submittedDate: { $lte: thirtyDaysAgo }
  })
    .populate('patientId', 'firstName lastName')
    .populate('insuranceId', 'providerName');
};

insuranceClaimSchema.statics.getClaimStatistics = function(insuranceId?: string) {
  const matchStage = insuranceId ? { insuranceId: new Types.ObjectId(insuranceId) } : {};
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$claimAmount' },
        avgAmount: { $avg: '$claimAmount' }
      }
    }
  ]);
};

// Instance methods
insuranceClaimSchema.methods.markAsProcessed = function() {
  this.status = 'processed';
  this.processedDate = new Date();
  return this.save();
};

insuranceClaimSchema.methods.markAsPaid = function() {
  this.status = 'paid';
  this.paidDate = new Date();
  return this.save();
};

insuranceClaimSchema.methods.deny = function(reason: string, code?: string) {
  this.status = 'denied';
  this.denialReason = reason;
  this.denialCode = code;
  return this.save();
};

insuranceClaimSchema.methods.addAppeal = function(appealData: any) {
  if (!this.appealHistory) this.appealHistory = [];
  this.appealHistory.push(appealData);
  this.status = 'appealed';
  return this.save();
};

// Static methods
insuranceClaimSchema.statics.findByPatient = function(patientId: string) {
  return this.find({ patientId });
};

insuranceClaimSchema.statics.findByInsurance = function(insuranceId: string) {
  return this.find({ insuranceId });
};

insuranceClaimSchema.statics.findPendingClaims = function() {
  return this.find({ status: { $in: ['submitted', 'pending'] } });
};

insuranceClaimSchema.statics.findClaimsNeedingFollowUp = function() {
  return this.find({ followUpRequired: true });
};

insuranceClaimSchema.statics.getClaimStatistics = function() {
  return this.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
};

const InsuranceClaim = model<IInsuranceClaim>('InsuranceClaim', insuranceClaimSchema);
export default InsuranceClaim;
