import mongoose, { Schema } from 'mongoose';
import { IBilling, IBillingModel } from '../types';

const billingSchema = new Schema<IBilling>({
  patientId: {
    type: Schema.Types.ObjectId,
    ref: 'Patient',
    required: [true, 'Patient ID is required']
  },
  appointmentId: {
    type: Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  treatmentRecordId: {
    type: Schema.Types.ObjectId,
    ref: 'TreatmentRecord'
  },
  clinicId: {
    type: Schema.Types.ObjectId,
    ref: 'Clinic',
    required: [true, 'Clinic ID is required']
  },
  dentistId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Dentist ID is required']
  },
  invoiceNumber: {
    type: String,
    unique: true,
    required: [true, 'Invoice number is required']
  },
  items: [{
    description: {
      type: String,
      required: [true, 'Item description is required'],
      trim: true,
      maxlength: [200, 'Description cannot exceed 200 characters']
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1']
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
    },
    category: {
      type: String,
      enum: ['consultation', 'treatment', 'medication', 'equipment', 'other'],
      default: 'treatment'
    }
  }],
  subtotal: {
    type: Number,
    required: [true, 'Subtotal is required'],
    min: [0, 'Subtotal cannot be negative']
  },
  taxAmount: {
    type: Number,
    default: 0,
    min: [0, 'Tax amount cannot be negative']
  },
  discountAmount: {
    type: Number,
    default: 0,
    min: [0, 'Discount amount cannot be negative']
  },
  totalAmount: {
    type: Number,
    required: [true, 'Total amount is required'],
    min: [0, 'Total amount cannot be negative']
  },
  paidAmount: {
    type: Number,
    default: 0,
    min: [0, 'Paid amount cannot be negative']
  },
  balanceAmount: {
    type: Number,
    default: 0
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'credit_card', 'debit_card', 'insurance', 'bank_transfer', 'check', 'other'],
    default: 'cash'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'partial', 'paid', 'overdue', 'cancelled'],
    default: 'pending'
  },
  insuranceInfo: {
    provider: {
      type: String,
      trim: true
    },
    policyNumber: {
      type: String,
      trim: true
    },
    coverageAmount: {
      type: Number,
      min: [0, 'Coverage amount cannot be negative']
    },
    claimNumber: {
      type: String,
      trim: true
    }
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required']
  },
  paidDate: {
    type: Date
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  isActive: {
    type: Boolean,
    default: true
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
billingSchema.index({ patientId: 1 });
billingSchema.index({ clinicId: 1 });
billingSchema.index({ dentistId: 1 });
// Remove: billingSchema.index({ invoiceNumber: 1 });
billingSchema.index({ paymentStatus: 1 });
billingSchema.index({ dueDate: 1 });
billingSchema.index({ createdAt: -1 });

// Virtual for checking if bill is overdue
billingSchema.virtual('isOverdue').get(function() {
  return this.paymentStatus !== 'paid' && this.dueDate < new Date();
});

// Pre-save middleware to calculate balance
billingSchema.pre('save', function(next) {
  this.balanceAmount = this.totalAmount - this.paidAmount;
  
  // Update payment status based on amounts
  if (this.paidAmount === 0) {
    this.paymentStatus = 'pending';
  } else if (this.paidAmount < this.totalAmount) {
    this.paymentStatus = 'partial';
  } else if (this.paidAmount >= this.totalAmount) {
    this.paymentStatus = 'paid';
    if (!this.paidDate) {
      this.paidDate = new Date();
    }
  }
  
  // Check if overdue
  if (this.paymentStatus !== 'paid' && this.dueDate < new Date()) {
    this.paymentStatus = 'overdue';
  }
  
  next();
});

// Instance method to add payment
billingSchema.methods.addPayment = function(amount: number, method: string = 'cash') {
  this.paidAmount += amount;
  this.paymentMethod = method;
  return this.save();
};

// Static method to find by patient
billingSchema.statics.findByPatient = function(patientId: string, options: any = {}) {
  const { status, limit = 10, skip = 0 } = options;
  const query: any = { patientId, isActive: true };
  
  if (status) {
    query.paymentStatus = status;
  }
  
  return this.find(query)
    .populate('dentistId', 'firstName lastName')
    .populate('clinicId', 'name')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);
};

// Static method to find overdue bills
billingSchema.statics.findOverdue = function(clinicId?: string) {
  const query: any = {
    paymentStatus: { $in: ['pending', 'partial', 'overdue'] },
    dueDate: { $lt: new Date() },
    isActive: true
  };
  
  if (clinicId) {
    query.clinicId = clinicId;
  }
  
  return this.find(query)
    .populate('patientId', 'firstName lastName email phone')
    .populate('clinicId', 'name')
    .sort({ dueDate: 1 });
};

// Static method to get revenue statistics
billingSchema.statics.getRevenueStats = function(clinicId: string, startDate: Date, endDate: Date) {
  return this.aggregate([
    {
      $match: {
        clinicId: clinicId as any,
        createdAt: { $gte: startDate, $lte: endDate },
        isActive: true
      }
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$totalAmount' },
        totalPaid: { $sum: '$paidAmount' },
        totalPending: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'pending'] }, '$balanceAmount', 0] } },
        totalOverdue: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'overdue'] }, '$balanceAmount', 0] } },
        billCount: { $sum: 1 }
      }
    }
  ]);
};

const Billing = mongoose.model<IBilling, IBillingModel>('Billing', billingSchema);

export default Billing;