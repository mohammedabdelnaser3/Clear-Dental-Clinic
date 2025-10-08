import { Schema, model, Document, Types } from 'mongoose';

export interface IInsurance extends Document {
  _id: Types.ObjectId;
  patientId: Types.ObjectId;
  
  // Primary Insurance Information
  insuranceCompany: string;
  policyNumber: string;
  groupNumber?: string;
  membershipNumber?: string;
  
  // Policy Holder Information
  policyHolderName: string;
  relationshipToPolicyHolder: 'self' | 'spouse' | 'child' | 'parent' | 'other';
  policyHolderDateOfBirth?: Date;
  policyHolderSSN?: string; // Encrypted
  
  // Coverage Information
  coverageType: 'individual' | 'family' | 'group';
  effectiveDate: Date;
  expirationDate?: Date;
  isActive: boolean;
  
  // Coverage Details
  dentalCoveragePercentage?: number; // e.g., 80% coverage
  annualMaxBenefit?: number;
  annualDeductible?: number;
  usedBenefits?: number;
  remainingBenefits?: number;
  
  // Specific Coverage
  preventiveCoverage?: number; // Usually 100%
  basicCoverage?: number; // Usually 80%
  majorCoverage?: number; // Usually 50%
  orthodonticCoverage?: number;
  orthodonticLifetimeMax?: number;
  orthodonticUsed?: number;
  
  // Contact Information
  insurancePhone?: string;
  insuranceAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  
  // Verification Status
  verificationStatus: 'pending' | 'verified' | 'expired' | 'invalid';
  lastVerified?: Date;
  verificationNotes?: string;
  verifiedBy?: Types.ObjectId;
  
  // Claims Information
  eligibilityStatus: 'eligible' | 'not_eligible' | 'pending' | 'unknown';
  preAuthorizationRequired: boolean;
  waitingPeriods?: Array<{
    service: string;
    months: number;
    satisfied: boolean;
  }>;
  
  // Exclusions and Limitations
  exclusions?: string[];
  limitations?: string[];
  
  // Audit
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const insuranceSchema = new Schema<IInsurance>({
  patientId: {
    type: Schema.Types.ObjectId,
    ref: 'Patient',
    required: [true, 'Patient ID is required']
  },
  
  // Primary Insurance Information
  insuranceCompany: {
    type: String,
    required: [true, 'Insurance company name is required'],
    trim: true,
    maxlength: [200, 'Insurance company name cannot exceed 200 characters']
  },
  policyNumber: {
    type: String,
    required: [true, 'Policy number is required'],
    trim: true,
    maxlength: [100, 'Policy number cannot exceed 100 characters']
  },
  groupNumber: {
    type: String,
    trim: true,
    maxlength: [50, 'Group number cannot exceed 50 characters']
  },
  membershipNumber: {
    type: String,
    trim: true,
    maxlength: [50, 'Membership number cannot exceed 50 characters']
  },
  
  // Policy Holder Information
  policyHolderName: {
    type: String,
    required: [true, 'Policy holder name is required'],
    trim: true,
    maxlength: [200, 'Policy holder name cannot exceed 200 characters']
  },
  relationshipToPolicyHolder: {
    type: String,
    required: [true, 'Relationship to policy holder is required'],
    enum: ['self', 'spouse', 'child', 'parent', 'other']
  },
  policyHolderDateOfBirth: {
    type: Date
  },
  policyHolderSSN: {
    type: String,
    trim: true
  },
  
  // Coverage Information
  coverageType: {
    type: String,
    required: [true, 'Coverage type is required'],
    enum: ['individual', 'family', 'group']
  },
  effectiveDate: {
    type: Date,
    required: [true, 'Effective date is required']
  },
  expirationDate: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Coverage Details
  dentalCoveragePercentage: {
    type: Number,
    min: [0, 'Coverage percentage cannot be negative'],
    max: [100, 'Coverage percentage cannot exceed 100%']
  },
  annualMaxBenefit: {
    type: Number,
    min: [0, 'Annual max benefit cannot be negative']
  },
  annualDeductible: {
    type: Number,
    min: [0, 'Annual deductible cannot be negative'],
    default: 0
  },
  usedBenefits: {
    type: Number,
    min: [0, 'Used benefits cannot be negative'],
    default: 0
  },
  remainingBenefits: {
    type: Number,
    min: [0, 'Remaining benefits cannot be negative']
  },
  
  // Specific Coverage
  preventiveCoverage: {
    type: Number,
    min: [0, 'Preventive coverage cannot be negative'],
    max: [100, 'Preventive coverage cannot exceed 100%'],
    default: 100
  },
  basicCoverage: {
    type: Number,
    min: [0, 'Basic coverage cannot be negative'],
    max: [100, 'Basic coverage cannot exceed 100%'],
    default: 80
  },
  majorCoverage: {
    type: Number,
    min: [0, 'Major coverage cannot be negative'],
    max: [100, 'Major coverage cannot exceed 100%'],
    default: 50
  },
  orthodonticCoverage: {
    type: Number,
    min: [0, 'Orthodontic coverage cannot be negative'],
    max: [100, 'Orthodontic coverage cannot exceed 100%'],
    default: 0
  },
  orthodonticLifetimeMax: {
    type: Number,
    min: [0, 'Orthodontic lifetime max cannot be negative']
  },
  orthodonticUsed: {
    type: Number,
    min: [0, 'Orthodontic used cannot be negative'],
    default: 0
  },
  
  // Contact Information
  insurancePhone: {
    type: String,
    trim: true,
    match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please provide a valid phone number']
  },
  insuranceAddress: {
    street: {
      type: String,
      trim: true,
      maxlength: [200, 'Street address cannot exceed 200 characters']
    },
    city: {
      type: String,
      trim: true,
      maxlength: [100, 'City cannot exceed 100 characters']
    },
    state: {
      type: String,
      trim: true,
      maxlength: [50, 'State cannot exceed 50 characters']
    },
    zipCode: {
      type: String,
      trim: true,
      maxlength: [20, 'Zip code cannot exceed 20 characters']
    }
  },
  
  // Verification Status
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'expired', 'invalid'],
    default: 'pending'
  },
  lastVerified: {
    type: Date
  },
  verificationNotes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Verification notes cannot exceed 1000 characters']
  },
  verifiedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Claims Information
  eligibilityStatus: {
    type: String,
    enum: ['eligible', 'not_eligible', 'pending', 'unknown'],
    default: 'unknown'
  },
  preAuthorizationRequired: {
    type: Boolean,
    default: false
  },
  waitingPeriods: [{
    service: {
      type: String,
      required: true,
      trim: true
    },
    months: {
      type: Number,
      required: true,
      min: [0, 'Waiting period cannot be negative']
    },
    satisfied: {
      type: Boolean,
      default: false
    }
  }],
  
  // Exclusions and Limitations
  exclusions: [{
    type: String,
    trim: true,
    maxlength: [500, 'Each exclusion cannot exceed 500 characters']
  }],
  limitations: [{
    type: String,
    trim: true,
    maxlength: [500, 'Each limitation cannot exceed 500 characters']
  }],
  
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
insuranceSchema.index({ patientId: 1 });
insuranceSchema.index({ policyNumber: 1 });
insuranceSchema.index({ insuranceCompany: 1 });
insuranceSchema.index({ verificationStatus: 1 });
insuranceSchema.index({ eligibilityStatus: 1 });
insuranceSchema.index({ isActive: 1 });
insuranceSchema.index({ expirationDate: 1 });

// Compound indexes
insuranceSchema.index({ patientId: 1, isActive: 1 });
insuranceSchema.index({ insuranceCompany: 1, policyNumber: 1 }, { unique: true });

// Virtual for remaining orthodontic benefits
insuranceSchema.virtual('remainingOrthodonticBenefits').get(function() {
  if (!this.orthodonticLifetimeMax) return 0;
  return Math.max(0, this.orthodonticLifetimeMax - (this.orthodonticUsed || 0));
});

// Virtual for benefit year progress
insuranceSchema.virtual('benefitYearProgress').get(function() {
  if (!this.annualMaxBenefit) return 0;
  const usedPercentage = ((this.usedBenefits || 0) / this.annualMaxBenefit) * 100;
  return Math.min(100, usedPercentage);
});

// Virtual for coverage status
insuranceSchema.virtual('coverageStatus').get(function() {
  if (!this.isActive) return 'inactive';
  if (this.expirationDate && this.expirationDate < new Date()) return 'expired';
  if (this.verificationStatus === 'verified') return 'active';
  return 'pending_verification';
});

// Pre-save middleware
insuranceSchema.pre('save', function(next) {
  // Calculate remaining benefits
  if (this.isModified('usedBenefits') || this.isModified('annualMaxBenefit')) {
    if (this.annualMaxBenefit && this.usedBenefits !== undefined) {
      this.remainingBenefits = Math.max(0, this.annualMaxBenefit - this.usedBenefits);
    }
  }
  
  // Check if insurance is expired
  if (this.expirationDate && this.expirationDate < new Date() && this.isActive) {
    this.isActive = false;
    this.verificationStatus = 'expired';
  }
  
  next();
});

// Static methods
insuranceSchema.statics.findByPatient = function(patientId: string) {
  return this.find({ patientId, isActive: true })
    .populate('verifiedBy', 'firstName lastName')
    .sort({ createdAt: -1 });
};

insuranceSchema.statics.findActiveInsurance = function(patientId: string) {
  return this.findOne({ 
    patientId, 
    isActive: true,
    verificationStatus: 'verified',
    $or: [
      { expirationDate: { $gte: new Date() } },
      { expirationDate: null }
    ]
  });
};

insuranceSchema.statics.findExpiring = function(days: number = 30) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  
  return this.find({
    isActive: true,
    expirationDate: {
      $gte: new Date(),
      $lte: futureDate
    }
  }).populate('patientId', 'firstName lastName email');
};

insuranceSchema.statics.getVerificationStatistics = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$verificationStatus',
        count: { $sum: 1 },
        averageUsedBenefits: { $avg: '$usedBenefits' }
      }
    }
  ]);
};

// Instance methods
insuranceSchema.methods.calculateCoverage = function(treatmentType: string, amount: number) {
  let coveragePercentage = 0;
  
  switch (treatmentType.toLowerCase()) {
    case 'preventive':
    case 'cleaning':
    case 'exam':
      coveragePercentage = this.preventiveCoverage || 0;
      break;
    case 'basic':
    case 'filling':
    case 'extraction':
      coveragePercentage = this.basicCoverage || 0;
      break;
    case 'major':
    case 'crown':
    case 'bridge':
    case 'implant':
      coveragePercentage = this.majorCoverage || 0;
      break;
    case 'orthodontic':
      coveragePercentage = this.orthodonticCoverage || 0;
      break;
    default:
      coveragePercentage = this.dentalCoveragePercentage || 0;
  }
  
  const coveredAmount = (amount * coveragePercentage) / 100;
  const remainingBenefits = this.remainingBenefits || 0;
  
  return {
    coveragePercentage,
    coveredAmount: Math.min(coveredAmount, remainingBenefits),
    patientResponsibility: amount - Math.min(coveredAmount, remainingBenefits),
    exceedsAnnualMax: coveredAmount > remainingBenefits
  };
};

insuranceSchema.methods.markAsVerified = function(verifiedById: Types.ObjectId, notes?: string) {
  this.verificationStatus = 'verified';
  this.lastVerified = new Date();
  this.verifiedBy = verifiedById;
  if (notes) {
    this.verificationNotes = notes;
  }
  return this.save();
};

insuranceSchema.methods.updateBenefitUsage = function(amount: number) {
  this.usedBenefits = (this.usedBenefits || 0) + amount;
  if (this.annualMaxBenefit) {
    this.remainingBenefits = Math.max(0, this.annualMaxBenefit - this.usedBenefits);
  }
  return this.save();
};

insuranceSchema.methods.resetAnnualBenefits = function() {
  this.usedBenefits = 0;
  if (this.annualMaxBenefit) {
    this.remainingBenefits = this.annualMaxBenefit;
  }
  return this.save();
};

insuranceSchema.methods.updateBenefitUsage = function(amount: number) {
  this.usedBenefits = (this.usedBenefits || 0) + amount;
  if (this.annualMaxBenefit) {
    this.remainingBenefits = Math.max(0, this.annualMaxBenefit - this.usedBenefits);
  }
  return this.save();
};

// Instance methods
insuranceSchema.methods.markAsVerified = function() {
  this.verificationStatus = 'verified';
  this.lastVerified = new Date();
  return this.save();
};

insuranceSchema.methods.calculateCoverage = function(treatmentCost: number) {
  let coverageAmount = 0;
  
  if (this.coverageType === 'percentage' && this.coveragePercentage) {
    coverageAmount = (treatmentCost * this.coveragePercentage) / 100;
  } else if (this.coverageType === 'fixed' && this.fixedCoverage) {
    coverageAmount = Math.min(treatmentCost, this.fixedCoverage);
  }
  
  // Apply deductible
  if (this.deductible && this.deductibleMet !== undefined) {
    const remainingDeductible = Math.max(0, this.deductible - this.deductibleMet);
    coverageAmount = Math.max(0, coverageAmount - remainingDeductible);
  }
  
  // Apply annual limits
  if (this.remainingBenefits !== undefined) {
    coverageAmount = Math.min(coverageAmount, this.remainingBenefits);
  }
  
  return {
    coverageAmount,
    patientResponsibility: treatmentCost - coverageAmount,
    copayAmount: this.copayAmount || 0
  };
};

// Static methods
insuranceSchema.statics.findActiveInsurance = function(patientId?: string) {
  const query: any = { 
    isActive: true,
    $or: [
      { expiryDate: { $exists: false } },
      { expiryDate: { $gte: new Date() } }
    ]
  };
  
  if (patientId) {
    query.patientId = patientId;
  }
  
  return this.find(query)
    .populate('patientId', 'firstName lastName')
    .sort({ createdAt: -1 });
};

insuranceSchema.statics.findByPatient = function(patientId: string) {
  return this.find({ patientId })
    .sort({ createdAt: -1 });
};

insuranceSchema.statics.findExpiring = function(days: number = 30) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  
  return this.find({
    isActive: true,
    expiryDate: {
      $gte: new Date(),
      $lte: futureDate
    }
  })
    .populate('patientId', 'firstName lastName');
};

insuranceSchema.statics.getVerificationStatistics = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$verificationStatus',
        count: { $sum: 1 }
      }
    }
  ]);
};

// Instance methods
insuranceSchema.methods.markAsVerified = function() {
  this.verificationStatus = 'verified';
  this.verifiedAt = new Date();
  return this.save();
};

insuranceSchema.methods.calculateCoverage = function(procedureCode: string, amount: number) {
  const coveragePercent = this.planType === 'premium' ? 0.8 : 0.6;
  return {
    coveredAmount: amount * coveragePercent,
    patientResponsibility: amount * (1 - coveragePercent)
  };
};

insuranceSchema.methods.updateBenefitUsage = function(amount: number) {
  if (!this.usedBenefits) this.usedBenefits = { annual: 0, remaining: this.maxBenefit || 0 };
  this.usedBenefits.annual += amount;
  return this.save();
};

const Insurance = model<IInsurance>('Insurance', insuranceSchema);
export default Insurance;
