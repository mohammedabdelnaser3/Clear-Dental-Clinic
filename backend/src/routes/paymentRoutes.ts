import { Router } from 'express';
import {
  createPaymentIntent,
  confirmPayment,
  processManualPayment,
  getPaymentsByBilling,
  getPatientPayments,
  getClinicPayments,
  getPaymentById,
  refundPayment,
  getPaymentStatistics
} from '../controllers/paymentController';
import {
  authenticate,
  staffOrAdmin,
  adminOnly,
  checkClinicAccess
} from '../middleware/auth';
import {
  createMongoIdValidation,
  paginationValidationRules,
  handleValidationErrors
} from '../middleware/validation';
import { body, query } from 'express-validator';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Create payment intent
router.post('/intent', [
  body('billingId')
    .isMongoId()
    .withMessage('Valid billing ID is required'),
  body('paymentMethod')
    .isIn(['card', 'cash', 'check', 'bank_transfer', 'insurance'])
    .withMessage('Invalid payment method'),
  body('paymentProvider')
    .optional()
    .isIn(['stripe', 'paypal', 'square', 'manual'])
    .withMessage('Invalid payment provider')
], handleValidationErrors, createPaymentIntent);

// Confirm payment
router.post('/:paymentId/confirm', [
  ...createMongoIdValidation('paymentId'),
  body('paymentIntentId')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Payment intent ID is required for gateway payments'),
  body('transactionId')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Transaction ID may be required')
], handleValidationErrors, confirmPayment);

// Process manual payment (staff/admin only)
router.post('/manual', staffOrAdmin, [
  body('billingId')
    .isMongoId()
    .withMessage('Valid billing ID is required'),
  body('paymentMethod')
    .isIn(['cash', 'check', 'bank_transfer'])
    .withMessage('Invalid manual payment method'),
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters'),
  body('receiptNumber')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Receipt number cannot exceed 100 characters')
], handleValidationErrors, processManualPayment);

// Get payments by billing record
router.get('/billing/:billingId', [
  ...createMongoIdValidation('billingId')
], handleValidationErrors, getPaymentsByBilling);

// Get patient payments
router.get('/patient/:patientId', [
  ...createMongoIdValidation('patientId'),
  ...paginationValidationRules
], handleValidationErrors, getPatientPayments);

// Get clinic payments (staff/admin only)
router.get('/clinic/:clinicId', staffOrAdmin, checkClinicAccess, [
  ...createMongoIdValidation('clinicId'),
  query('status')
    .optional()
    .isIn(['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded', 'partially_refunded'])
    .withMessage('Invalid payment status'),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date'),
  ...paginationValidationRules
], handleValidationErrors, getClinicPayments);

// Get payment statistics (admin only)
router.get('/statistics', adminOnly, [
  query('clinicId')
    .optional()
    .isMongoId()
    .withMessage('Valid clinic ID required if provided')
], handleValidationErrors, getPaymentStatistics);

// Get payment by ID
router.get('/:id', [
  ...createMongoIdValidation('id')
], handleValidationErrors, getPaymentById);

// Refund payment (staff/admin only)
router.post('/:id/refund', staffOrAdmin, [
  ...createMongoIdValidation('id'),
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Refund amount must be greater than 0'),
  body('reason')
    .trim()
    .notEmpty()
    .isLength({ min: 5, max: 500 })
    .withMessage('Refund reason is required and must be between 5 and 500 characters')
], handleValidationErrors, refundPayment);

export default router;
