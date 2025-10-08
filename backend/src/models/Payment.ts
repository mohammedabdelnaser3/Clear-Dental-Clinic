import { Schema, model, Document, Types } from 'mongoose';

export interface IPayment extends Document {
  _id: Types.ObjectId;
  billingId: Types.ObjectId;
  patientId: Types.ObjectId;
  clinicId: Types.ObjectId;
  
  // Payment Details
  amount: number;
  currency: string;
  paymentMethod: 'card' | 'cash' | 'check' | 'bank_transfer' | 'insurance';
  
  // Payment Status
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded' | 'partially_refunded';
  
  // Payment Gateway Integration
  paymentProvider?: 'stripe' | 'paypal' | 'square' | 'manual';
  paymentIntentId?: string;
  transactionId?: string;
  gatewayResponse?: Record<string, any>;
  
  // Card Details (for card payments)
  cardDetails?: {
    last4?: string;
    brand?: string;
    expiryMonth?: number;
    expiryYear?: number;
    fingerprint?: string;
  };
  
  // Refund Information
  refunds?: Array<{
    amount: number;
    reason: string;
    refundId: string;
    refundedAt: Date;
    refundedBy: Types.ObjectId;
  }>;
  
  // Payment Metadata
  description?: string;
  receiptUrl?: string;
  receiptEmail?: string;
  
  // Processing Fees
  processingFee?: number;
  netAmount?: number;
  
  // Timestamps
  paidAt?: Date;
  failedAt?: Date;
  
  // Audit
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>({
  billingId: {
    type: Schema.Types.ObjectId,
    ref: 'Billing',
    required: [true, 'Billing ID is required']
  },
  patientId: {
    type: Schema.Types.ObjectId,
    ref: 'Patient',
    required: [true, 'Patient ID is required']
  },
  clinicId: {
    type: Schema.Types.ObjectId,
    ref: 'Clinic',
    required: [true, 'Clinic ID is required']
  },
  
  amount: {
    type: Number,
    required: [true, 'Payment amount is required'],
    min: [0, 'Payment amount cannot be negative']
  },
  currency: {
    type: String,
    required: [true, 'Currency is required'],
    default: 'USD',
    uppercase: true,
    maxlength: [3, 'Currency code must be 3 characters']
  },
  paymentMethod: {
    type: String,
    required: [true, 'Payment method is required'],
    enum: ['card', 'cash', 'check', 'bank_transfer', 'insurance']
  },
  
  status: {
    type: String,
    required: [true, 'Payment status is required'],
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded', 'partially_refunded'],
    default: 'pending'
  },
  
  // Payment Gateway Integration
  paymentProvider: {
    type: String,
    enum: ['stripe', 'paypal', 'square', 'manual']
  },
  paymentIntentId: {
    type: String,
    trim: true
  },
  transactionId: {
    type: String,
    trim: true,
    unique: true,
    sparse: true
  },
  gatewayResponse: {
    type: Schema.Types.Mixed
  },
  
  // Card Details
  cardDetails: {
    last4: {
      type: String,
      maxlength: [4, 'Last 4 digits must be 4 characters']
    },
    brand: {
      type: String,
      trim: true
    },
    expiryMonth: {
      type: Number,
      min: [1, 'Expiry month must be between 1 and 12'],
      max: [12, 'Expiry month must be between 1 and 12']
    },
    expiryYear: {
      type: Number,
      min: [2024, 'Expiry year cannot be in the past']
    },
    fingerprint: {
      type: String,
      trim: true
    }
  },
  
  // Refund Information
  refunds: [{
    amount: {
      type: Number,
      required: true,
      min: [0, 'Refund amount cannot be negative']
    },
    reason: {
      type: String,
      required: true,
      trim: true,
      maxlength: [500, 'Refund reason cannot exceed 500 characters']
    },
    refundId: {
      type: String,
      required: true,
      trim: true
    },
    refundedAt: {
      type: Date,
      required: true,
      default: Date.now
    },
    refundedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  }],
  
  // Payment Metadata
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  receiptUrl: {
    type: String,
    trim: true
  },
  receiptEmail: {
    type: String,
    trim: true,
    lowercase: true
  },
  
  // Processing Fees
  processingFee: {
    type: Number,
    min: [0, 'Processing fee cannot be negative'],
    default: 0
  },
  netAmount: {
    type: Number,
    min: [0, 'Net amount cannot be negative']
  },
  
  // Timestamps
  paidAt: {
    type: Date
  },
  failedAt: {
    type: Date
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
paymentSchema.index({ billingId: 1 });
paymentSchema.index({ patientId: 1 });
paymentSchema.index({ clinicId: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ paymentProvider: 1 });
paymentSchema.index({ createdAt: -1 });

// Virtual for total refunded amount
paymentSchema.virtual('totalRefundedAmount').get(function() {
  return this.refunds?.reduce((total, refund) => total + refund.amount, 0) || 0;
});

// Virtual for remaining refundable amount
paymentSchema.virtual('refundableAmount').get(function() {
  if (this.status !== 'completed') return 0;
  const totalRefunded = this.refunds?.reduce((total: number, refund: any) => total + refund.amount, 0) || 0;
  return Math.max(0, this.amount - totalRefunded);
});

// Virtual for refund status
paymentSchema.virtual('refundStatus').get(function() {
  const totalRefunded = this.refunds?.reduce((total: number, refund: any) => total + refund.amount, 0) || 0;
  if (totalRefunded === 0) return 'none';
  if (totalRefunded >= this.amount) return 'full';
  return 'partial';
});

// Pre-save middleware
paymentSchema.pre('save', function(next) {
  // Calculate net amount if not provided
  if (this.isModified('amount') || this.isModified('processingFee')) {
    this.netAmount = this.amount - (this.processingFee || 0);
  }
  
  // Set timestamps based on status
  if (this.isModified('status')) {
    if (this.status === 'completed' && !this.paidAt) {
      this.paidAt = new Date();
    } else if (this.status === 'failed' && !this.failedAt) {
      this.failedAt = new Date();
    }
  }
  
  next();
});

// Static methods
paymentSchema.statics.findByBilling = function(billingId: string) {
  return this.find({ billingId })
    .populate('patientId', 'firstName lastName email')
    .populate('createdBy', 'firstName lastName')
    .sort({ createdAt: -1 });
};

paymentSchema.statics.findByPatient = function(patientId: string, options: any = {}) {
  const { skip = 0, limit = 10 } = options;
  return this.find({ patientId })
    .populate('billingId', 'invoiceNumber totalAmount')
    .populate('clinicId', 'name')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

paymentSchema.statics.getPaymentStats = function(clinicId?: string) {
  const matchStage = clinicId ? { $match: { clinicId: new Types.ObjectId(clinicId) } } : { $match: {} };
  
  return this.aggregate([
    matchStage,
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        avgAmount: { $avg: '$amount' }
      }
    }
  ]);
};

paymentSchema.statics.findByPatient = function(patientId: string, options: any = {}) {
  const { skip = 0, limit = 10 } = options;
  return this.find({ patientId })
    .populate('billingId', 'invoiceNumber totalAmount')
    .populate('clinicId', 'name')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

paymentSchema.statics.findByClinic = function(clinicId: string, options: any = {}) {
  const { skip = 0, limit = 10, status } = options;
  const query: any = { clinicId };
  
  if (status) {
    query.status = status;
  }
  
  return this.find(query)
    .populate('patientId', 'firstName lastName')
    .populate('billingId', 'invoiceNumber totalAmount')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

paymentSchema.statics.getPaymentStats = function(clinicId?: string) {
  const matchStage = clinicId ? { $match: { clinicId: new Types.ObjectId(clinicId) } } : { $match: {} };
  
  return this.aggregate([
    matchStage,
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        avgAmount: { $avg: '$amount' }
      }
    }
  ]);
};

// Instance methods
paymentSchema.methods.markAsCompleted = function() {
  this.status = 'completed';
  this.paidAt = new Date();
  return this.save();
};

paymentSchema.methods.markAsFailed = function(reason?: string) {
  this.status = 'failed';
  this.failedAt = new Date();
  if (reason && this.gatewayResponse) {
    this.gatewayResponse.failureReason = reason;
  }
  return this.save();
};

paymentSchema.methods.addRefund = function(refundData: {
  amount: number;
  reason: string;
  refundId: string;
  refundedBy: Types.ObjectId;
}) {
  if (!this.refunds) {
    this.refunds = [];
  }
  
  this.refunds.push({
    ...refundData,
    refundedAt: new Date()
  });
  
  // Update status based on refund amount
  const currentRefunded = this.refunds?.reduce((total: number, refund: any) => total + refund.amount, 0) || 0;
  if (currentRefunded >= this.amount) {
    this.status = 'refunded';
  } else {
    this.status = 'partially_refunded';
  }
  
  return this.save();
};

// Instance methods
paymentSchema.methods.addRefund = function(refundData: any) {
  if (!this.refunds) this.refunds = [];
  this.refunds.push(refundData);
  return this.save();
};

// Static methods  
paymentSchema.statics.findByBilling = function(billingId: string) {
  return this.find({ billingId });
};

paymentSchema.statics.findByPatient = function(patientId: string) {
  return this.find({ patientId });
};

paymentSchema.statics.getPaymentStats = function() {
  return this.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
};

const Payment = model<IPayment>('Payment', paymentSchema);
export default Payment;
