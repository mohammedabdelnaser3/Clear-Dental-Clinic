import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { Supplier, InventoryItem } from '../models';
import {
  AppError,
  catchAsync,
  createNotFoundError,
  createValidationError
} from '../middleware/errorHandler';
import {
  getPaginationParams,
  createPaginatedResponse
} from '../utils/helpers';

// Get all suppliers with filtering and pagination
export const getSuppliers = catchAsync(async (req: Request, res: Response) => {
  const { page, limit } = getPaginationParams(req);
  const { 
    isActive,
    search,
    sortBy = 'name',
    sortOrder = 'asc'
  } = req.query;

  // Build query
  const query: any = {};
  
  if (isActive !== undefined) query.isActive = isActive === 'true';
  
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { contactPerson: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  // Build sort object
  const sort: any = {};
  sort[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

  const [suppliers, total] = await Promise.all([
    (Supplier as any).find(query)
      .populate('createdBy', 'firstName lastName')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit),
    (Supplier as any).countDocuments(query)
  ]);

  const paginatedResponse = createPaginatedResponse(suppliers, total, page, limit);
  res.json({
    message: 'Suppliers retrieved successfully',
    ...paginatedResponse
  });
});

// Get single supplier
export const getSupplier = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const supplier = await (Supplier as any).findById(id)
    .populate('createdBy updatedBy', 'firstName lastName');

  if (!supplier) {
    throw createNotFoundError('Supplier');
  }

  // Get items supplied by this supplier
  const suppliedItems = await (InventoryItem as any).find({ supplier: id, isActive: true })
    .select('name sku category currentStock minimumStock')
    .sort({ name: 1 });

  // Calculate total inventory value from this supplier
  const inventoryValue = suppliedItems.reduce(
    (sum, item) => sum + (item.currentStock * item.costPrice || 0), 0
  );

  res.json({
    success: true,
    message: 'Supplier retrieved successfully',
    data: {
      supplier,
      suppliedItems: {
        items: suppliedItems,
        count: suppliedItems.length,
        totalValue: inventoryValue
      }
    }
  });
});

// Create new supplier
export const createSupplier = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const supplierData = {
    ...req.body,
    createdBy: req.user!.id,
    totalOrders: 0,
    totalSpent: 0
  };

  const supplier = await (Supplier as any).create(supplierData);

  await supplier.populate('createdBy', 'firstName lastName');

  res.status(201).json({
    success: true,
    message: 'Supplier created successfully',
    data: { supplier }
  });
});

// Update supplier
export const updateSupplier = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  
  const supplier = await (Supplier as any).findById(id);
  if (!supplier) {
    throw createNotFoundError('Supplier');
  }

  const updateData = {
    ...req.body,
    updatedBy: req.user!.id
  };

  const updatedSupplier = await (Supplier as any).findByIdAndUpdate(
    id,
    updateData,
    { new: true, runValidators: true }
  ).populate('createdBy updatedBy', 'firstName lastName');

  res.json({
    success: true,
    message: 'Supplier updated successfully',
    data: { supplier: updatedSupplier }
  });
});

// Delete supplier (soft delete)
export const deleteSupplier = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const supplier = await (Supplier as any).findById(id);
  if (!supplier) {
    throw createNotFoundError('Supplier');
  }

  // Check if supplier has inventory items
  const hasItems = await InventoryItem.exists({ supplier: id });
  if (hasItems) {
    // Soft delete - just mark as inactive
    await (Supplier as any).findByIdAndUpdate(id, { 
      isActive: false,
      updatedBy: req.user!.id
    });
    
    res.json({
      success: true,
      message: 'Supplier deactivated successfully (has existing inventory items)'
    });
  } else {
    // Hard delete if no items exist
    await (Supplier as any).findByIdAndDelete(id);
    
    res.json({
      success: true,
      message: 'Supplier deleted successfully'
    });
  }
});

// Get active suppliers (for dropdowns)
export const getActiveSuppliers = catchAsync(async (req: Request, res: Response) => {
  const suppliers = await (Supplier as any).findActive();

  res.json({
    success: true,
    message: 'Active suppliers retrieved successfully',
    data: { suppliers }
  });
});

// Get supplier performance summary
export const getSupplierPerformance = catchAsync(async (req: Request, res: Response) => {
  const { supplierId } = req.params;

  const performance = await (Supplier as any).getPerformanceSummary(supplierId);

  // Get recent orders/purchases from this supplier
  const recentItems = await (InventoryItem as any).find(
    supplierId ? { supplier: supplierId } : { supplier: { $exists: true } }
  )
    .populate('supplier', 'name')
    .sort({ lastRestocked: -1 })
    .limit(10);

  res.json({
    success: true,
    message: 'Supplier performance retrieved successfully',
    data: {
      performance,
      recentItems
    }
  });
});

// Update supplier rating
export const updateSupplierRating = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { rating, notes } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    throw createValidationError('rating', 'Rating must be between 1 and 5');
  }

  const supplier = await (Supplier as any).findById(id);
  if (!supplier) {
    throw createNotFoundError('Supplier');
  }

  const updatedSupplier = await (Supplier as any).findByIdAndUpdate(
    id,
    { 
      rating,
      notes: notes || supplier.notes,
      updatedBy: req.user!.id
    },
    { new: true, runValidators: true }
  );

  res.json({
    success: true,
    message: 'Supplier rating updated successfully',
    data: { supplier: updatedSupplier }
  });
});

// Get suppliers dashboard data
export const getSuppliersDashboard = catchAsync(async (req: Request, res: Response) => {
  // Get total suppliers count
  const totalSuppliers = await (Supplier as any).countDocuments({ isActive: true });
  
  // Get supplier performance summary
  const performance = await (Supplier as any).getPerformanceSummary();
  
  // Get top suppliers by spending
  const topSuppliers = performance.slice(0, 5);
  
  // Get suppliers without recent activity (no orders in last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  
  const inactiveSuppliers = await (Supplier as any).find({
    isActive: true,
    $or: [
      { totalOrders: 0 },
      { updatedAt: { $lt: sixMonthsAgo } }
    ]
  }).select('name contactPerson email totalOrders');

  // Get average supplier rating
  const ratingStats = await (Supplier as any).aggregate([
    { $match: { isActive: true, rating: { $exists: true } } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalRatedSuppliers: { $sum: 1 }
      }
    }
  ]);

  res.json({
    success: true,
    message: 'Suppliers dashboard data retrieved successfully',
    data: {
      totalSuppliers,
      topSuppliers,
      inactiveSuppliers: {
        suppliers: inactiveSuppliers,
        count: inactiveSuppliers.length
      },
      ratings: {
        average: ratingStats[0]?.averageRating || 0,
        totalRated: ratingStats[0]?.totalRatedSuppliers || 0
      },
      performance: performance.length > 5 ? performance.slice(0, 10) : performance
    }
  });
});

// Import suppliers from CSV
export const importSuppliers = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  // TODO: Implement CSV import functionality
  res.status(501).json({
    success: false,
    message: 'CSV import functionality not yet implemented'
  });
});

// Export suppliers to CSV
export const exportSuppliers = catchAsync(async (req: Request, res: Response) => {
  // TODO: Implement CSV export functionality
  res.status(501).json({
    success: false,
    message: 'CSV export functionality not yet implemented'
  });
});





