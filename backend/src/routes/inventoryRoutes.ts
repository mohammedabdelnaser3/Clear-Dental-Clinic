import { Router } from 'express';
import {
  getInventoryItems,
  getInventoryItem,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  updateStock,
  getStockMovements,
  getLowStockItems,
  getExpiringItems,
  getInventoryDashboard,
  generateInventoryReport
} from '../controllers/inventoryController';
import { authenticate, staffOrAdmin } from '../middleware/auth';
import { validateMongoId, handleValidationErrors } from '../middleware/validation';
import { body, param, query } from 'express-validator';

const router = Router();

// All inventory routes require authentication
router.use(authenticate);

// Validation rules
const createInventoryValidation = [
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ max: 100 })
    .withMessage('Name cannot exceed 100 characters'),
  body('category')
    .isIn(['supplies', 'materials', 'equipment', 'medications', 'instruments', 'other'])
    .withMessage('Invalid category'),
  body('sku')
    .notEmpty()
    .withMessage('SKU is required')
    .isLength({ max: 20 })
    .withMessage('SKU cannot exceed 20 characters'),
  body('clinic')
    .isMongoId()
    .withMessage('Valid clinic ID is required'),
  body('currentStock')
    .isFloat({ min: 0 })
    .withMessage('Current stock must be a positive number'),
  body('minimumStock')
    .isFloat({ min: 0 })
    .withMessage('Minimum stock must be a positive number'),
  body('unit')
    .notEmpty()
    .withMessage('Unit is required'),
  body('costPrice')
    .isFloat({ min: 0 })
    .withMessage('Cost price must be a positive number')
];

const updateStockValidation = [
  param('id')
    .isMongoId()
    .withMessage('Valid inventory item ID is required'),
  body('type')
    .isIn(['in', 'out', 'adjustment'])
    .withMessage('Type must be in, out, or adjustment'),
  body('quantity')
    .isFloat({ min: 0.01 })
    .withMessage('Quantity must be greater than 0'),
  body('reason')
    .isIn(['purchase', 'usage', 'adjustment', 'expired', 'damaged', 'transfer', 'return', 'other'])
    .withMessage('Invalid reason')
];

// Routes

// GET /api/v1/inventory - Get all inventory items
router.get('/', getInventoryItems);

// GET /api/v1/inventory/dashboard - Get dashboard data (admin/staff only)
router.get('/dashboard', staffOrAdmin, getInventoryDashboard);

// GET /api/v1/inventory/low-stock - Get low stock items (admin/staff only)
router.get('/low-stock', staffOrAdmin, getLowStockItems);

// GET /api/v1/inventory/expiring - Get expiring items (admin/staff only)
router.get('/expiring', staffOrAdmin, getExpiringItems);

// GET /api/v1/inventory/movements - Get stock movements (admin/staff only)
router.get('/movements', staffOrAdmin, getStockMovements);

// GET /api/v1/inventory/report - Generate inventory report (admin/staff only)
router.get('/report', staffOrAdmin, generateInventoryReport);

// GET /api/v1/inventory/:id - Get single inventory item
router.get('/:id', 
  param('id').isMongoId().withMessage('Valid inventory item ID is required'),
  handleValidationErrors,
  getInventoryItem
);

// POST /api/v1/inventory - Create new inventory item (admin/staff only)
router.post('/',
  staffOrAdmin,
  createInventoryValidation,
  handleValidationErrors,
  createInventoryItem
);

// PUT /api/v1/inventory/:id - Update inventory item (admin/staff only)
router.put('/:id',
  staffOrAdmin,
  param('id').isMongoId().withMessage('Valid inventory item ID is required'),
  handleValidationErrors,
  updateInventoryItem
);

// DELETE /api/v1/inventory/:id - Delete inventory item (admin only)
router.delete('/:id',
  staffOrAdmin, // Consider restricting to admin only
  param('id').isMongoId().withMessage('Valid inventory item ID is required'),
  handleValidationErrors,
  deleteInventoryItem
);

// POST /api/v1/inventory/:id/stock - Update stock (admin/staff only)
router.post('/:id/stock',
  staffOrAdmin,
  updateStockValidation,
  handleValidationErrors,
  updateStock
);

export default router;





