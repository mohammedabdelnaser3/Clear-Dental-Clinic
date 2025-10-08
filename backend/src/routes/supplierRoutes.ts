import { Router } from 'express';
import {
  getSuppliers,
  getSupplier,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  getActiveSuppliers,
  getSupplierPerformance,
  updateSupplierRating,
  getSuppliersDashboard,
  importSuppliers,
  exportSuppliers
} from '../controllers/supplierController';
import { authenticate, staffOrAdmin } from '../middleware/auth';
import { validateMongoId, handleValidationErrors } from '../middleware/validation';
import { body, param } from 'express-validator';

const router = Router();

// All supplier routes require authentication
router.use(authenticate);

// Validation rules
const createSupplierValidation = [
  body('name')
    .notEmpty()
    .withMessage('Supplier name is required')
    .isLength({ max: 100 })
    .withMessage('Supplier name cannot exceed 100 characters'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Valid email is required'),
  body('phone')
    .optional()
    .isLength({ max: 20 })
    .withMessage('Phone number cannot exceed 20 characters'),
  body('website')
    .optional()
    .isURL()
    .withMessage('Valid website URL is required'),
  body('rating')
    .optional()
    .isFloat({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('creditLimit')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Credit limit must be positive')
];

const updateRatingValidation = [
  param('id')
    .isMongoId()
    .withMessage('Valid supplier ID is required'),
  body('rating')
    .isFloat({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5')
];

// Routes

// GET /api/v1/suppliers - Get all suppliers
router.get('/', getSuppliers);

// GET /api/v1/suppliers/active - Get active suppliers (for dropdowns)
router.get('/active', getActiveSuppliers);

// GET /api/v1/suppliers/dashboard - Get suppliers dashboard data (admin/staff only)
router.get('/dashboard', staffOrAdmin, getSuppliersDashboard);

// GET /api/v1/suppliers/performance - Get all suppliers performance
router.get('/performance', staffOrAdmin, getSupplierPerformance);

// POST /api/v1/suppliers/import - Import suppliers from CSV (admin/staff only)
router.post('/import', staffOrAdmin, importSuppliers);

// GET /api/v1/suppliers/export - Export suppliers to CSV (admin/staff only)
router.get('/export', staffOrAdmin, exportSuppliers);

// GET /api/v1/suppliers/:id - Get single supplier
router.get('/:id',
  param('id').isMongoId().withMessage('Valid supplier ID is required'),
  handleValidationErrors,
  getSupplier
);

// GET /api/v1/suppliers/:supplierId/performance - Get specific supplier performance
router.get('/:supplierId/performance',
  param('supplierId').isMongoId().withMessage('Valid supplier ID is required'),
  handleValidationErrors,
  getSupplierPerformance
);

// POST /api/v1/suppliers - Create new supplier (admin/staff only)
router.post('/',
  staffOrAdmin,
  createSupplierValidation,
  handleValidationErrors,
  createSupplier
);

// PUT /api/v1/suppliers/:id - Update supplier (admin/staff only)
router.put('/:id',
  staffOrAdmin,
  param('id').isMongoId().withMessage('Valid supplier ID is required'),
  handleValidationErrors,
  updateSupplier
);

// DELETE /api/v1/suppliers/:id - Delete supplier (admin only)
router.delete('/:id',
  staffOrAdmin, // Consider restricting to admin only
  param('id').isMongoId().withMessage('Valid supplier ID is required'),
  handleValidationErrors,
  deleteSupplier
);

// PUT /api/v1/suppliers/:id/rating - Update supplier rating (admin/staff only)
router.put('/:id/rating',
  staffOrAdmin,
  updateRatingValidation,
  handleValidationErrors,
  updateSupplierRating
);

export default router;





