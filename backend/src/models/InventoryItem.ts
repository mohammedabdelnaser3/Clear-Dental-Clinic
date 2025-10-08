import { Schema, model, Document, Types } from 'mongoose';

export interface IInventoryItem extends Document {
  _id: Types.ObjectId;
  name: string;
  description?: string;
  category: 'supplies' | 'materials' | 'equipment' | 'medications' | 'instruments' | 'other';
  subcategory?: string;
  sku: string; // Stock Keeping Unit
  barcode?: string;
  clinic: Types.ObjectId;
  
  // Stock Information
  currentStock: number;
  minimumStock: number;
  maximumStock?: number;
  unit: string; // pieces, ml, kg, boxes, etc.
  
  // Pricing
  costPrice: number;
  sellingPrice?: number;
  
  // Supplier Information
  supplier?: Types.ObjectId;
  supplierItemCode?: string;
  
  // Storage Information
  location?: string;
  expiryDate?: Date;
  batchNumber?: string;
  
  // Tracking
  isActive: boolean;
  isLowStock: boolean;
  lastRestocked?: Date;
  lastUsed?: Date;
  
  // Audit
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const inventoryItemSchema = new Schema<IInventoryItem>({
  name: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true,
    maxlength: [100, 'Item name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['supplies', 'materials', 'equipment', 'medications', 'instruments', 'other']
  },
  subcategory: {
    type: String,
    trim: true,
    maxlength: [50, 'Subcategory cannot exceed 50 characters']
  },
  sku: {
    type: String,
    required: [true, 'SKU is required'],
    unique: true,
    trim: true,
    uppercase: true,
    maxlength: [20, 'SKU cannot exceed 20 characters']
  },
  barcode: {
    type: String,
    trim: true,
    maxlength: [50, 'Barcode cannot exceed 50 characters']
  },
  clinic: {
    type: Schema.Types.ObjectId,
    ref: 'Clinic',
    required: [true, 'Clinic is required']
  },
  
  // Stock Information
  currentStock: {
    type: Number,
    required: [true, 'Current stock is required'],
    min: [0, 'Current stock cannot be negative'],
    default: 0
  },
  minimumStock: {
    type: Number,
    required: [true, 'Minimum stock level is required'],
    min: [0, 'Minimum stock cannot be negative'],
    default: 0
  },
  maximumStock: {
    type: Number,
    min: [0, 'Maximum stock cannot be negative']
  },
  unit: {
    type: String,
    required: [true, 'Unit is required'],
    trim: true,
    maxlength: [20, 'Unit cannot exceed 20 characters']
  },
  
  // Pricing
  costPrice: {
    type: Number,
    required: [true, 'Cost price is required'],
    min: [0, 'Cost price cannot be negative']
  },
  sellingPrice: {
    type: Number,
    min: [0, 'Selling price cannot be negative']
  },
  
  // Supplier Information
  supplier: {
    type: Schema.Types.ObjectId,
    ref: 'Supplier'
  },
  supplierItemCode: {
    type: String,
    trim: true,
    maxlength: [50, 'Supplier item code cannot exceed 50 characters']
  },
  
  // Storage Information
  location: {
    type: String,
    trim: true,
    maxlength: [100, 'Location cannot exceed 100 characters']
  },
  expiryDate: {
    type: Date
  },
  batchNumber: {
    type: String,
    trim: true,
    maxlength: [50, 'Batch number cannot exceed 50 characters']
  },
  
  // Tracking
  isActive: {
    type: Boolean,
    default: true
  },
  isLowStock: {
    type: Boolean,
    default: false
  },
  lastRestocked: {
    type: Date
  },
  lastUsed: {
    type: Date
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
inventoryItemSchema.index({ clinic: 1, category: 1 });
inventoryItemSchema.index({ clinic: 1, isLowStock: 1 });
inventoryItemSchema.index({ clinic: 1, isActive: 1 });
inventoryItemSchema.index({ barcode: 1 }, { sparse: true });

// Virtual for stock status
inventoryItemSchema.virtual('stockStatus').get(function() {
  if (this.currentStock <= 0) return 'out_of_stock';
  if (this.currentStock <= this.minimumStock) return 'low_stock';
  if (this.maximumStock && this.currentStock >= this.maximumStock) return 'overstock';
  return 'in_stock';
});

// Virtual for days until expiry
inventoryItemSchema.virtual('daysUntilExpiry').get(function() {
  if (!this.expiryDate) return null;
  const today = new Date();
  const expiry = new Date(this.expiryDate);
  const diffTime = expiry.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Pre-save middleware to update low stock status
inventoryItemSchema.pre('save', function(next) {
  this.isLowStock = this.currentStock <= this.minimumStock;
  next();
});

// Static method to find low stock items
inventoryItemSchema.statics.findLowStockItems = function(clinicId?: string) {
  const query: any = { isLowStock: true, isActive: true };
  if (clinicId) query.clinic = clinicId;
  return this.find(query).populate('clinic', 'name').populate('supplier', 'name');
};

// Static method to find expiring items
inventoryItemSchema.statics.findExpiringItems = function(days: number = 30, clinicId?: string) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  
  const query: any = {
    expiryDate: { $exists: true, $lte: futureDate },
    isActive: true
  };
  if (clinicId) query.clinic = clinicId;
  
  return this.find(query).populate('clinic', 'name');
};

// Static method to get stock summary by category
inventoryItemSchema.statics.getStockSummary = function(clinicId?: string) {
  const matchStage: any = { isActive: true };
  if (clinicId) matchStage.clinic = new Types.ObjectId(clinicId);
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$category',
        totalItems: { $sum: 1 },
        totalValue: { $sum: { $multiply: ['$currentStock', '$costPrice'] } },
        lowStockItems: {
          $sum: { $cond: [{ $lte: ['$currentStock', '$minimumStock'] }, 1, 0] }
        },
        outOfStockItems: {
          $sum: { $cond: [{ $eq: ['$currentStock', 0] }, 1, 0] }
        }
      }
    },
    { $sort: { _id: 1 } }
  ]);
};

// Instance method to update stock
inventoryItemSchema.methods.updateStock = function(quantity: number, type: 'in' | 'out', reason?: string) {
  if (type === 'in') {
    this.currentStock += quantity;
    this.lastRestocked = new Date();
  } else {
    this.currentStock = Math.max(0, this.currentStock - quantity);
    this.lastUsed = new Date();
  }
  
  this.isLowStock = this.currentStock <= this.minimumStock;
  return this.save();
};

// Static methods
inventoryItemSchema.statics.findLowStockItems = function(clinicId?: string) {
  const query = clinicId ? { clinic: clinicId } : {};
  return this.find({ ...query, isLowStock: true });
};

inventoryItemSchema.statics.findExpiringItems = function(days = 30) {
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + days);
  return this.find({
    expirationDate: { $lte: expirationDate, $ne: null }
  });
};

inventoryItemSchema.statics.getStockSummary = function(clinicId?: string) {
  const match = clinicId ? { clinic: clinicId } : {};
  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalItems: { $sum: 1 },
        lowStockItems: { $sum: { $cond: ['$isLowStock', 1, 0] } },
        totalValue: { $sum: { $multiply: ['$currentStock', '$costPrice'] } }
      }
    }
  ]);
};

export default model<IInventoryItem>('InventoryItem', inventoryItemSchema);





