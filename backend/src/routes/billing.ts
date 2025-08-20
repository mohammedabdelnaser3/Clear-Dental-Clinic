import express from 'express';
import {
  getAllBillingRecords,
  getBillingRecordById,
  createBillingRecord,
  updateBillingRecord,
  deleteBillingRecord,
  getBillingRecordsByPatient,
  getOverdueBillingRecords,
  addPayment,
  getRevenueStats,
  getBillingSummary
} from '../controllers/billingController';
import { protect, authorize, patientOwnerOrStaff } from '../middleware/auth';
import { handleValidationErrors } from '../middleware/validation';
import { body, param, query } from 'express-validator';

const router = express.Router();

// Protect all routes
router.use(protect);

// Get billing summary
router.get('/summary',
  authorize('dentist', 'staff', 'admin'),
  getBillingSummary
);

// Get overdue billing records
router.get('/overdue',
  [
    query('clinicId').optional().isMongoId().withMessage('Invalid clinic ID')
  ],
  handleValidationErrors,
  authorize('dentist', 'staff', 'admin'),
  getOverdueBillingRecords
);

// Get revenue statistics
router.get('/stats/revenue',
  [
    query('clinicId').isMongoId().withMessage('Valid clinic ID is required'),
    query('startDate').optional().isISO8601().withMessage('Invalid start date'),
    query('endDate').optional().isISO8601().withMessage('Invalid end date')
  ],
  handleValidationErrors,
  authorize('dentist', 'staff', 'admin'),
  getRevenueStats
);

// Get billing records by patient (staff/admin or patient themselves)
router.get('/patient/:patientId',
  [
    param('patientId').isMongoId().withMessage('Invalid patient ID'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('status').optional().isIn(['pending', 'partial', 'paid', 'overdue', 'cancelled'])
      .withMessage('Invalid payment status')
  ],
  handleValidationErrors,
  patientOwnerOrStaff('patientId'),
  getBillingRecordsByPatient
);

// Get all billing records
router.get('/',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('status').optional().isIn(['pending', 'partial', 'paid', 'overdue', 'cancelled'])
      .withMessage('Invalid payment status'),
    query('patientId').optional().isMongoId().withMessage('Invalid patient ID'),
    query('clinicId').optional().isMongoId().withMessage('Invalid clinic ID')
  ],
  handleValidationErrors,
  authorize('dentist', 'staff', 'admin'),
  getAllBillingRecords
);

// Create new billing record
router.post('/',
  [
    body('patientId').isMongoId().withMessage('Valid patient ID is required'),
    body('clinicId').isMongoId().withMessage('Valid clinic ID is required'),
    body('appointmentId').optional().isMongoId().withMessage('Invalid appointment ID'),
    body('treatmentRecordId').optional().isMongoId().withMessage('Invalid treatment record ID'),
    body('items').isArray({ min: 1 }).withMessage('At least one billing item is required'),
    body('items.*.description').notEmpty().withMessage('Item description is required'),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('Item quantity must be a positive integer'),
    body('items.*.unitPrice').isFloat({ min: 0 }).withMessage('Unit price must be a non-negative number'),
    body('items.*.totalPrice').isFloat({ min: 0 }).withMessage('Total price must be a non-negative number'),
    body('items.*.category').isIn(['consultation', 'treatment', 'medication', 'equipment', 'other'])
      .withMessage('Invalid item category'),
    body('subtotal').isFloat({ min: 0 }).withMessage('Subtotal must be a non-negative number'),
    body('taxAmount').optional().isFloat({ min: 0 }).withMessage('Tax amount must be a non-negative number'),
    body('discountAmount').optional().isFloat({ min: 0 }).withMessage('Discount amount must be a non-negative number'),
    body('totalAmount').isFloat({ min: 0 }).withMessage('Total amount must be a non-negative number'),
    body('paidAmount').optional().isFloat({ min: 0 }).withMessage('Paid amount must be a non-negative number'),
    body('paymentMethod').optional().isIn(['cash', 'credit_card', 'debit_card', 'insurance', 'bank_transfer', 'check', 'other'])
      .withMessage('Invalid payment method'),
    body('paymentStatus').optional().isIn(['pending', 'partial', 'paid', 'overdue', 'cancelled'])
      .withMessage('Invalid payment status'),
    body('insuranceInfo.provider').optional().isString().withMessage('Insurance provider must be a string'),
    body('insuranceInfo.policyNumber').optional().isString().withMessage('Policy number must be a string'),
    body('insuranceInfo.coverageAmount').optional().isFloat({ min: 0 }).withMessage('Coverage amount must be a non-negative number'),
    body('insuranceInfo.claimNumber').optional().isString().withMessage('Claim number must be a string'),
    body('dueDate').optional().isISO8601().withMessage('Invalid due date'),
    body('notes').optional().isString().withMessage('Notes must be a string')
  ],
  handleValidationErrors,
  authorize('dentist', 'staff'),
  createBillingRecord
);

// Add payment to billing record
router.post('/:id/payment',
  [
    param('id').isMongoId().withMessage('Invalid billing record ID'),
    body('amount').isFloat({ min: 0.01 }).withMessage('Payment amount must be greater than 0'),
    body('method').optional().isIn(['cash', 'credit_card', 'debit_card', 'insurance', 'bank_transfer', 'check', 'other'])
      .withMessage('Invalid payment method')
  ],
  handleValidationErrors,
  authorize('dentist', 'staff', 'admin'),
  addPayment
);

// Get billing record by ID (staff/admin or patient if it's their billing record)
router.get('/:id',
  [
    param('id').isMongoId().withMessage('Invalid billing record ID')
  ],
  handleValidationErrors,
  authorize('dentist', 'staff', 'admin', 'patient'),
  getBillingRecordById
);

// Update billing record
router.put('/:id',
  [
    param('id').isMongoId().withMessage('Invalid billing record ID'),
    body('patientId').optional().isMongoId().withMessage('Invalid patient ID'),
    body('clinicId').optional().isMongoId().withMessage('Invalid clinic ID'),
    body('appointmentId').optional().isMongoId().withMessage('Invalid appointment ID'),
    body('treatmentRecordId').optional().isMongoId().withMessage('Invalid treatment record ID'),
    body('items').optional().isArray({ min: 1 }).withMessage('At least one billing item is required'),
    body('items.*.description').optional().notEmpty().withMessage('Item description cannot be empty'),
    body('items.*.quantity').optional().isInt({ min: 1 }).withMessage('Item quantity must be a positive integer'),
    body('items.*.unitPrice').optional().isFloat({ min: 0 }).withMessage('Unit price must be a non-negative number'),
    body('items.*.totalPrice').optional().isFloat({ min: 0 }).withMessage('Total price must be a non-negative number'),
    body('items.*.category').optional().isIn(['consultation', 'treatment', 'medication', 'equipment', 'other'])
      .withMessage('Invalid item category'),
    body('subtotal').optional().isFloat({ min: 0 }).withMessage('Subtotal must be a non-negative number'),
    body('taxAmount').optional().isFloat({ min: 0 }).withMessage('Tax amount must be a non-negative number'),
    body('discountAmount').optional().isFloat({ min: 0 }).withMessage('Discount amount must be a non-negative number'),
    body('totalAmount').optional().isFloat({ min: 0 }).withMessage('Total amount must be a non-negative number'),
    body('paidAmount').optional().isFloat({ min: 0 }).withMessage('Paid amount must be a non-negative number'),
    body('paymentMethod').optional().isIn(['cash', 'credit_card', 'debit_card', 'insurance', 'bank_transfer', 'check', 'other'])
      .withMessage('Invalid payment method'),
    body('paymentStatus').optional().isIn(['pending', 'partial', 'paid', 'overdue', 'cancelled'])
      .withMessage('Invalid payment status'),
    body('insuranceInfo.provider').optional().isString().withMessage('Insurance provider must be a string'),
    body('insuranceInfo.policyNumber').optional().isString().withMessage('Policy number must be a string'),
    body('insuranceInfo.coverageAmount').optional().isFloat({ min: 0 }).withMessage('Coverage amount must be a non-negative number'),
    body('insuranceInfo.claimNumber').optional().isString().withMessage('Claim number must be a string'),
    body('dueDate').optional().isISO8601().withMessage('Invalid due date'),
    body('paidDate').optional().isISO8601().withMessage('Invalid paid date'),
    body('notes').optional().isString().withMessage('Notes must be a string')
  ],
  handleValidationErrors,
  authorize('dentist', 'staff', 'admin'),
  updateBillingRecord
);

// Delete billing record
router.delete('/:id',
  [
    param('id').isMongoId().withMessage('Invalid billing record ID')
  ],
  handleValidationErrors,
  authorize('admin'),
  deleteBillingRecord
);

export default router;