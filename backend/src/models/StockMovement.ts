import { Schema, model, Document, Types } from 'mongoose';

export interface IStockMovement extends Document {
  _id: Types.ObjectId;
  inventoryItem: Types.ObjectId;
  clinic: Types.ObjectId;
  
  // Movement Details
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  previousStock: number;
  newStock: number;
  
  // Transaction Details
  reason: 'purchase' | 'usage' | 'adjustment' | 'expired' | 'damaged' | 'transfer' | 'return' | 'other';
  description?: string;
  reference?: string; // PO number, treatment ID, etc.
  
  // Cost Information
  unitCost?: number;
  totalCost?: number;
  
  // Related Documents
  relatedDocument?: {
    type: 'purchase_order' | 'treatment' | 'prescription' | 'adjustment';
    id: Types.ObjectId;
  };
  
  // Batch/Expiry Information
  batchNumber?: string;
  expiryDate?: Date;
  
  // Audit
  performedBy: Types.ObjectId;
  performedAt: Date;
  notes?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

const stockMovementSchema = new Schema<IStockMovement>({
  inventoryItem: {
    type: Schema.Types.ObjectId,
    ref: 'InventoryItem',
    required: [true, 'Inventory item is required']
  },
  clinic: {
    type: Schema.Types.ObjectId,
    ref: 'Clinic',
    required: [true, 'Clinic is required']
  },
  
  // Movement Details
  type: {
    type: String,
    required: [true, 'Movement type is required'],
    enum: ['in', 'out', 'adjustment']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0.01, 'Quantity must be greater than 0']
  },
  previousStock: {
    type: Number,
    required: [true, 'Previous stock is required'],
    min: [0, 'Previous stock cannot be negative']
  },
  newStock: {
    type: Number,
    required: [true, 'New stock is required'],
    min: [0, 'New stock cannot be negative']
  },
  
  // Transaction Details
  reason: {
    type: String,
    required: [true, 'Reason is required'],
    enum: ['purchase', 'usage', 'adjustment', 'expired', 'damaged', 'transfer', 'return', 'other']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  reference: {
    type: String,
    trim: true,
    maxlength: [100, 'Reference cannot exceed 100 characters']
  },
  
  // Cost Information
  unitCost: {
    type: Number,
    min: [0, 'Unit cost cannot be negative']
  },
  totalCost: {
    type: Number,
    min: [0, 'Total cost cannot be negative']
  },
  
  // Related Documents
  relatedDocument: {
    type: {
      type: String,
      enum: ['purchase_order', 'treatment', 'prescription', 'adjustment']
    },
    id: {
      type: Schema.Types.ObjectId
    }
  },
  
  // Batch/Expiry Information
  batchNumber: {
    type: String,
    trim: true,
    maxlength: [50, 'Batch number cannot exceed 50 characters']
  },
  expiryDate: {
    type: Date
  },
  
  // Audit
  performedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Performed by is required']
  },
  performedAt: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
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
stockMovementSchema.index({ inventoryItem: 1, createdAt: -1 });
stockMovementSchema.index({ clinic: 1, createdAt: -1 });
stockMovementSchema.index({ performedBy: 1, createdAt: -1 });
stockMovementSchema.index({ type: 1, createdAt: -1 });
stockMovementSchema.index({ reason: 1, createdAt: -1 });

// Virtual for movement direction
stockMovementSchema.virtual('direction').get(function() {
  return this.type === 'in' ? 'incoming' : 
         this.type === 'out' ? 'outgoing' : 'adjustment';
});

// Virtual for stock change
stockMovementSchema.virtual('stockChange').get(function() {
  return this.newStock - this.previousStock;
});

// Pre-save middleware to calculate total cost
stockMovementSchema.pre('save', function(next) {
  if (this.unitCost && this.quantity) {
    this.totalCost = this.unitCost * this.quantity;
  }
  next();
});

// Static method to get movement history for an item
stockMovementSchema.statics.getItemHistory = function(inventoryItemId: string, limit: number = 50) {
  return this.find({ inventoryItem: inventoryItemId })
    .populate('performedBy', 'firstName lastName')
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method to get movements by date range
stockMovementSchema.statics.getMovementsByDateRange = function(
  startDate: Date, 
  endDate: Date, 
  clinicId?: string,
  type?: 'in' | 'out' | 'adjustment'
) {
  const query: any = {
    createdAt: { $gte: startDate, $lte: endDate }
  };
  
  if (clinicId) query.clinic = clinicId;
  if (type) query.type = type;
  
  return this.find(query)
    .populate('inventoryItem', 'name sku category')
    .populate('performedBy', 'firstName lastName')
    .sort({ createdAt: -1 });
};

// Static method to get stock movement summary
stockMovementSchema.statics.getMovementSummary = function(
  startDate: Date,
  endDate: Date,
  clinicId?: string
) {
  const matchStage: any = {
    createdAt: { $gte: startDate, $lte: endDate }
  };
  if (clinicId) matchStage.clinic = new Types.ObjectId(clinicId);
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: {
          type: '$type',
          reason: '$reason'
        },
        count: { $sum: 1 },
        totalQuantity: { $sum: '$quantity' },
        totalValue: { $sum: '$totalCost' }
      }
    },
    {
      $group: {
        _id: '$_id.type',
        reasons: {
          $push: {
            reason: '$_id.reason',
            count: '$count',
            totalQuantity: '$totalQuantity',
            totalValue: '$totalValue'
          }
        },
        totalCount: { $sum: '$count' },
        totalQuantity: { $sum: '$totalQuantity' },
        totalValue: { $sum: '$totalValue' }
      }
    },
    { $sort: { _id: 1 } }
  ]);
};

// Static method to record a stock movement
stockMovementSchema.statics.recordMovement = async function(data: {
  inventoryItem: string;
  clinic: string;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: 'purchase' | 'usage' | 'adjustment' | 'expired' | 'damaged' | 'transfer' | 'return' | 'other';
  description?: string;
  reference?: string;
  unitCost?: number;
  relatedDocument?: { type: string; id: string };
  batchNumber?: string;
  expiryDate?: Date;
  performedBy: string;
  notes?: string;
}) {
  return this.create(data);
};

// Static methods
stockMovementSchema.statics.recordMovement = function(data: any) {
  return this.create(data);
};

stockMovementSchema.statics.getMovementSummary = function(period = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - period);
  
  return this.aggregate([
    { $match: { date: { $gte: startDate } } },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        totalQuantity: { $sum: '$quantity' }
      }
    }
  ]);
};

export default model<IStockMovement>('StockMovement', stockMovementSchema);





