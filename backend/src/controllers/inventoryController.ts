import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { InventoryItem, Supplier, StockMovement } from '../models';
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
import mongoose from 'mongoose';

// Get all inventory items with filtering and pagination
export const getInventoryItems = catchAsync(async (req: Request, res: Response) => {
  const { page, limit } = getPaginationParams(req);
  const { 
    category,
    isLowStock,
    isActive,
    search,
    clinic,
    sortBy = 'name',
    sortOrder = 'asc'
  } = req.query;

  // Build query
  const query: any = {};
  
  if (category) query.category = category;
  if (isLowStock !== undefined) query.isLowStock = isLowStock === 'true';
  if (isActive !== undefined) query.isActive = isActive === 'true';
  if (clinic) query.clinic = clinic;
  
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { sku: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { barcode: { $regex: search, $options: 'i' } }
    ];
  }

  // Build sort object
  const sort: any = {};
  sort[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

  const [items, total] = await Promise.all([
    (InventoryItem as any).find(query)
      .populate('clinic', 'name')
      .populate('supplier', 'name contactPerson')
      .populate('createdBy', 'firstName lastName')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit),
    (InventoryItem as any).countDocuments(query)
  ]);

  const paginatedResponse = createPaginatedResponse(items, total, page, limit);
  res.json({
    message: 'Inventory items retrieved successfully',
    ...paginatedResponse
  });
});

// Get single inventory item
export const getInventoryItem = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const item = await (InventoryItem as any).findById(id)
    .populate('clinic', 'name address phone')
    .populate('supplier', 'name contactPerson email phone')
    .populate('createdBy updatedBy', 'firstName lastName');

  if (!item) {
    throw createNotFoundError('Inventory item');
  }

  // Get recent stock movements
  const recentMovements = await StockMovement.find({ inventoryItem: id })
    .populate('performedBy', 'firstName lastName')
    .sort({ createdAt: -1 })
    .limit(10);

  res.json({
    success: true,
    message: 'Inventory item retrieved successfully',
    data: {
      item,
      recentMovements
    }
  });
});

// Create new inventory item
export const createInventoryItem = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const itemData = {
    ...req.body,
    createdBy: req.user!.id
  };

  // Check if SKU already exists
  const existingSku = await (InventoryItem as any).findOne({ sku: itemData.sku });
  if (existingSku) {
    throw createValidationError('sku', 'SKU already exists');
  }

  const item = await (InventoryItem as any).create(itemData);
  
  // If initial stock is provided, record it as a stock movement
  if (itemData.currentStock > 0) {
    await (StockMovement as any).recordMovement({
      inventoryItem: item._id.toString(),
      clinic: item.clinic.toString(),
      type: 'in',
      quantity: item.currentStock,
      previousStock: 0,
      newStock: item.currentStock,
      reason: 'adjustment',
      description: 'Initial stock entry',
      performedBy: req.user!.id
    });
  }

  await item.populate('clinic supplier createdBy', 'name firstName lastName');

  res.status(201).json({
    success: true,
    message: 'Inventory item created successfully',
    data: { item }
  });
});

// Update inventory item
export const updateInventoryItem = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  
  const item = await (InventoryItem as any).findById(id);
  if (!item) {
    throw createNotFoundError('Inventory item');
  }

  // Check if SKU is being changed and if it already exists
  if (req.body.sku && req.body.sku !== item.sku) {
    const existingSku = await (InventoryItem as any).findOne({ 
      sku: req.body.sku, 
      _id: { $ne: id } 
    });
    if (existingSku) {
      throw createValidationError('sku', 'SKU already exists');
    }
  }

  const updateData = {
    ...req.body,
    updatedBy: req.user!.id
  };

  const updatedItem = await (InventoryItem as any).findByIdAndUpdate(
    id,
    updateData,
    { new: true, runValidators: true }
  ).populate('clinic supplier createdBy updatedBy', 'name firstName lastName');

  res.json({
    success: true,
    message: 'Inventory item updated successfully',
    data: { item: updatedItem }
  });
});

// Delete inventory item (soft delete)
export const deleteInventoryItem = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const item = await (InventoryItem as any).findById(id);
  if (!item) {
    throw createNotFoundError('Inventory item');
  }

  // Check if item has stock movements
  const hasMovements = await StockMovement.exists({ inventoryItem: id });
  if (hasMovements) {
    // Soft delete - just mark as inactive
    await (InventoryItem as any).findByIdAndUpdate(id, { 
      isActive: false,
      updatedBy: req.user!.id
    });
  } else {
    // Hard delete if no movements exist
    await (InventoryItem as any).findByIdAndDelete(id);
  }

  res.json({
    success: true,
    message: 'Inventory item deleted successfully'
  });
});

// Update stock (add or remove)
export const updateStock = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { 
    type, // 'in' or 'out' or 'adjustment'
    quantity,
    reason,
    description,
    reference,
    unitCost,
    batchNumber,
    expiryDate,
    notes
  } = req.body;

  if (!['in', 'out', 'adjustment'].includes(type)) {
    throw createValidationError('type', 'Invalid stock movement type');
  }

  if (!quantity || quantity <= 0) {
    throw createValidationError('quantity', 'Quantity must be greater than 0');
  }

  const item = await (InventoryItem as any).findById(id);
  if (!item) {
    throw createNotFoundError('Inventory item');
  }

  const previousStock = item.currentStock;
  let newStock: number;

  if (type === 'in') {
    newStock = previousStock + quantity;
  } else if (type === 'out') {
    if (quantity > previousStock) {
      throw createValidationError('quantity', 'Cannot remove more stock than available');
    }
    newStock = previousStock - quantity;
  } else { // adjustment
    newStock = quantity; // For adjustments, quantity is the new stock level
  }

  // Start transaction
  const session = await mongoose.startSession();
  await session.withTransaction(async () => {
    // Update inventory item
    await (InventoryItem as any).findByIdAndUpdate(
      id,
      {
        currentStock: newStock,
        isLowStock: newStock <= item.minimumStock,
        lastRestocked: type === 'in' ? new Date() : item.lastRestocked,
        lastUsed: type === 'out' ? new Date() : item.lastUsed,
        updatedBy: req.user!.id
      },
      { session }
    );

    // Record stock movement
    await StockMovement.create([{
      inventoryItem: id,
      clinic: item.clinic,
      type,
      quantity: type === 'adjustment' ? Math.abs(newStock - previousStock) : quantity,
      previousStock,
      newStock,
      reason: reason || (type === 'in' ? 'purchase' : type === 'out' ? 'usage' : 'adjustment'),
      description,
      reference,
      unitCost,
      batchNumber,
      expiryDate,
      performedBy: req.user!.id,
      notes
    }], { session });
  });

  await session.endSession();

  const updatedItem = await (InventoryItem as any).findById(id)
    .populate('clinic supplier', 'name');

  res.json({
    success: true,
    message: 'Stock updated successfully',
    data: { 
      item: updatedItem,
      movement: {
        type,
        quantity,
        previousStock,
        newStock
      }
    }
  });
});

// Get stock movements history
export const getStockMovements = catchAsync(async (req: Request, res: Response) => {
  const { page, limit } = getPaginationParams(req);
  const { 
    itemId,
    clinic,
    type,
    reason,
    startDate,
    endDate,
    performedBy
  } = req.query;

  // Build query
  const query: any = {};
  
  if (itemId) query.inventoryItem = itemId;
  if (clinic) query.clinic = clinic;
  if (type) query.type = type;
  if (reason) query.reason = reason;
  if (performedBy) query.performedBy = performedBy;
  
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate as string);
    if (endDate) query.createdAt.$lte = new Date(endDate as string);
  }

  const [movements, total] = await Promise.all([
    StockMovement.find(query)
      .populate('inventoryItem', 'name sku category')
      .populate('clinic', 'name')
      .populate('performedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    StockMovement.countDocuments(query)
  ]);

  const paginatedResponse = createPaginatedResponse(movements, total, page, limit);
  res.json({
    message: 'Stock movements retrieved successfully',
    ...paginatedResponse
  });
});

// Get low stock items
export const getLowStockItems = catchAsync(async (req: Request, res: Response) => {
  const { clinic } = req.query;

  const items = await (InventoryItem as any).findLowStockItems(clinic as string);

  res.json({
    success: true,
    message: 'Low stock items retrieved successfully',
    data: { items }
  });
});

// Get expiring items
export const getExpiringItems = catchAsync(async (req: Request, res: Response) => {
  const { days = 30, clinic } = req.query;

  const items = await (InventoryItem as any).findExpiringItems(
    parseInt(days as string), 
    clinic as string
  );

  res.json({
    success: true,
    message: 'Expiring items retrieved successfully',
    data: { items }
  });
});

// Get inventory dashboard data
export const getInventoryDashboard = catchAsync(async (req: Request, res: Response) => {
  const { clinic } = req.query;

  // Get stock summary by category
  const stockSummary = await (InventoryItem as any).getStockSummary(clinic as string);
  
  // Get low stock items
  const lowStockItems = await (InventoryItem as any).findLowStockItems(clinic as string);
  
  // Get expiring items (next 30 days)
  const expiringItems = await (InventoryItem as any).findExpiringItems(30, clinic as string);
  
  // Get recent movements (last 10)
  const recentMovements = await StockMovement.find(
    clinic ? { clinic } : {}
  )
    .populate('inventoryItem', 'name sku')
    .populate('performedBy', 'firstName lastName')
    .sort({ createdAt: -1 })
    .limit(10);

  // Calculate total inventory value
  const totalValueQuery: any = { isActive: true };
  if (clinic) totalValueQuery.clinic = clinic;
  
  const inventoryValue = await (InventoryItem as any).aggregate([
    { $match: totalValueQuery },
    {
      $group: {
        _id: null,
        totalValue: { $sum: { $multiply: ['$currentStock', '$costPrice'] } },
        totalItems: { $sum: 1 }
      }
    }
  ]);

  res.json({
    success: true,
    message: 'Inventory dashboard data retrieved successfully',
    data: {
      stockSummary,
      lowStockItems: {
        items: lowStockItems,
        count: lowStockItems.length
      },
      expiringItems: {
        items: expiringItems,
        count: expiringItems.length
      },
      recentMovements,
      totalValue: inventoryValue[0]?.totalValue || 0,
      totalItems: inventoryValue[0]?.totalItems || 0
    }
  });
});

// Generate inventory report
export const generateInventoryReport = catchAsync(async (req: Request, res: Response) => {
  const { 
    startDate,
    endDate,
    clinic,
    category,
    format = 'json'
  } = req.query;

  const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const end = endDate ? new Date(endDate as string) : new Date();

  // Get movement summary
  const movementSummary = await (StockMovement as any).getMovementSummary(
    start,
    end,
    clinic as string
  );

  // Get current stock levels
  const stockQuery: any = { isActive: true };
  if (clinic) stockQuery.clinic = clinic;
  if (category) stockQuery.category = category;

  const currentStock = await (InventoryItem as any).find(stockQuery)
    .populate('clinic', 'name')
    .populate('supplier', 'name')
    .sort({ category: 1, name: 1 });

  const reportData = {
    reportPeriod: {
      startDate: start,
      endDate: end
    },
    movementSummary,
    currentStock,
    generatedAt: new Date(),
    totalItems: currentStock.length,
    totalValue: currentStock.reduce((sum, item) => sum + (item.currentStock * item.costPrice), 0)
  };

  if (format === 'csv') {
    // TODO: Implement CSV export
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=inventory-report.csv');
    res.send('CSV export not implemented yet');
  } else {
    res.json({
      success: true,
      message: 'Inventory report generated successfully',
      data: reportData
    });
  }
});





