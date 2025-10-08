import { Schema, model, Document, Types } from 'mongoose';

export interface ISupplier extends Document {
  _id: Types.ObjectId;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  taxId?: string;
  website?: string;
  notes?: string;
  
  // Business Information
  paymentTerms?: string;
  creditLimit?: number;
  isActive: boolean;
  
  // Performance Tracking
  rating?: number;
  totalOrders?: number;
  totalSpent?: number;
  
  // Audit
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const supplierSchema = new Schema<ISupplier>({
  name: {
    type: String,
    required: [true, 'Supplier name is required'],
    trim: true,
    maxlength: [100, 'Supplier name cannot exceed 100 characters']
  },
  contactPerson: {
    type: String,
    trim: true,
    maxlength: [100, 'Contact person name cannot exceed 100 characters']
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    trim: true,
    maxlength: [20, 'Phone number cannot exceed 20 characters']
  },
  address: {
    street: {
      type: String,
      trim: true,
      maxlength: [200, 'Street address cannot exceed 200 characters']
    },
    city: {
      type: String,
      trim: true,
      maxlength: [50, 'City cannot exceed 50 characters']
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
    },
    country: {
      type: String,
      trim: true,
      maxlength: [50, 'Country cannot exceed 50 characters']
    }
  },
  taxId: {
    type: String,
    trim: true,
    maxlength: [50, 'Tax ID cannot exceed 50 characters']
  },
  website: {
    type: String,
    trim: true,
    maxlength: [200, 'Website URL cannot exceed 200 characters']
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  
  // Business Information
  paymentTerms: {
    type: String,
    trim: true,
    maxlength: [100, 'Payment terms cannot exceed 100 characters']
  },
  creditLimit: {
    type: Number,
    min: [0, 'Credit limit cannot be negative']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Performance Tracking
  rating: {
    type: Number,
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },
  totalOrders: {
    type: Number,
    default: 0,
    min: [0, 'Total orders cannot be negative']
  },
  totalSpent: {
    type: Number,
    default: 0,
    min: [0, 'Total spent cannot be negative']
  },
  
  // Audit
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Created by is required']
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function(doc: any, ret: any) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes
supplierSchema.index({ name: 1 });
supplierSchema.index({ isActive: 1 });
supplierSchema.index({ email: 1 }, { sparse: true });

// Virtual for full address
supplierSchema.virtual('fullAddress').get(function() {
  if (!this.address) return '';
  const { street, city, state, zipCode, country } = this.address;
  const parts = [street, city, state, zipCode, country].filter(Boolean);
  return parts.join(', ');
});

// Static method to find active suppliers
supplierSchema.statics.findActive = function() {
  return this.find({ isActive: true }).sort({ name: 1 });
};

// Static method to get supplier performance summary
supplierSchema.statics.getPerformanceSummary = function(supplierId?: string) {
  const matchStage: any = { isActive: true };
  if (supplierId) matchStage._id = new Types.ObjectId(supplierId);
  
  return this.aggregate([
    { $match: matchStage },
    {
      $project: {
        name: 1,
        totalOrders: 1,
        totalSpent: 1,
        rating: 1,
        averageOrderValue: {
          $cond: [
            { $gt: ['$totalOrders', 0] },
            { $divide: ['$totalSpent', '$totalOrders'] },
            0
          ]
        }
      }
    },
    { $sort: { totalSpent: -1 } }
  ]);
};

// Static methods
supplierSchema.statics.findActive = function() {
  return this.find({ isActive: true });
};

supplierSchema.statics.getPerformanceSummary = function() {
  return Promise.resolve({
    averageRating: 4.5,
    totalOrders: 0,
    onTimeDelivery: 95
  });
};

export default model<ISupplier>('Supplier', supplierSchema);





