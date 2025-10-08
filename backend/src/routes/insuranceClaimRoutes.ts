import { Router } from 'express';
import {
  createClaim,
  submitClaim,
  processClaim,
  markClaimPaid,
  denyClaim,
  appealClaim,
  getPatientClaims,
  getInsuranceClaims,
  getPendingClaims,
  getClaimsNeedingFollowUp,
  getClaimById,
  addCorrespondence,
  getClaimStatistics,
  updateFollowUp
} from '../controllers/insuranceClaimController';
import {
  authenticate,
  staffOrAdmin,
  adminOnly
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

// Create insurance claim (staff/admin only)
router.post('/', staffOrAdmin, [
  body('insuranceId')
    .isMongoId()
    .withMessage('Valid insurance ID is required'),
  body('patientId')
    .isMongoId()
    .withMessage('Valid patient ID is required'),
  body('providerId')
    .isMongoId()
    .withMessage('Valid provider ID is required'),
  body('clinicId')
    .isMongoId()
    .withMessage('Valid clinic ID is required'),
  body('serviceDate')
    .isISO8601()
    .withMessage('Valid service date is required'),
  body('claimType')
    .optional()
    .isIn(['primary', 'secondary', 'predetermination'])
    .withMessage('Invalid claim type'),
  body('procedures')
    .isArray({ min: 1 })
    .withMessage('At least one procedure is required'),
  body('procedures.*.code')
    .trim()
    .notEmpty()
    .isLength({ max: 10 })
    .withMessage('Procedure code is required and cannot exceed 10 characters'),
  body('procedures.*.description')
    .trim()
    .notEmpty()
    .isLength({ max: 500 })
    .withMessage('Procedure description is required and cannot exceed 500 characters'),
  body('procedures.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Procedure quantity must be at least 1'),
  body('procedures.*.unitPrice')
    .isFloat({ min: 0 })
    .withMessage('Procedure unit price must be a positive number'),
  body('procedures.*.totalPrice')
    .isFloat({ min: 0 })
    .withMessage('Procedure total price must be a positive number')
], handleValidationErrors, createClaim);

// Get pending claims
router.get('/pending', [
  query('clinicId')
    .optional()
    .isMongoId()
    .withMessage('Valid clinic ID required if provided')
], handleValidationErrors, getPendingClaims);

// Get claims needing follow-up
router.get('/follow-up', [
  query('clinicId')
    .optional()
    .isMongoId()
    .withMessage('Valid clinic ID required if provided')
], handleValidationErrors, getClaimsNeedingFollowUp);

// Get claim statistics (admin only)
router.get('/statistics', adminOnly, [
  query('clinicId')
    .optional()
    .isMongoId()
    .withMessage('Valid clinic ID required if provided'),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date')
], handleValidationErrors, getClaimStatistics);

// Get claims by patient
router.get('/patient/:patientId', [
  ...createMongoIdValidation('patientId'),
  query('status')
    .optional()
    .isIn(['draft', 'submitted', 'pending', 'processed', 'paid', 'denied', 'rejected', 'appealed'])
    .withMessage('Invalid claim status'),
  ...paginationValidationRules
], handleValidationErrors, getPatientClaims);

// Get claims by insurance
router.get('/insurance/:insuranceId', [
  ...createMongoIdValidation('insuranceId')
], handleValidationErrors, getInsuranceClaims);

// Get claim by ID
router.get('/:id', [
  ...createMongoIdValidation('id')
], handleValidationErrors, getClaimById);

// Submit claim (staff/admin only)
router.post('/:id/submit', staffOrAdmin, [
  ...createMongoIdValidation('id'),
  body('submissionMethod')
    .optional()
    .isIn(['electronic', 'paper', 'online_portal'])
    .withMessage('Invalid submission method'),
  body('clearinghouse')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Clearinghouse name cannot exceed 100 characters'),
  body('batchNumber')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Batch number cannot exceed 50 characters')
], handleValidationErrors, submitClaim);

// Process claim response (staff/admin only)
router.post('/:id/process', staffOrAdmin, [
  ...createMongoIdValidation('id'),
  body('totalAllowed')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Total allowed must be a positive number'),
  body('totalPaid')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Total paid must be a positive number'),
  body('patientResponsibility')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Patient responsibility must be a positive number'),
  body('deductibleApplied')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Deductible applied must be a positive number'),
  body('copayAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Copay amount must be a positive number'),
  body('coinsuranceAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Coinsurance amount must be a positive number'),
  body('explanationOfBenefits')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Explanation of benefits cannot exceed 2000 characters')
], handleValidationErrors, processClaim);

// Mark claim as paid (staff/admin only)
router.post('/:id/paid', staffOrAdmin, [
  ...createMongoIdValidation('id')
], handleValidationErrors, markClaimPaid);

// Deny claim (staff/admin only)
router.post('/:id/deny', staffOrAdmin, [
  ...createMongoIdValidation('id'),
  body('denialReason')
    .trim()
    .notEmpty()
    .isLength({ min: 5, max: 1000 })
    .withMessage('Denial reason is required and must be between 5 and 1000 characters'),
  body('denialCode')
    .optional()
    .trim()
    .isLength({ max: 10 })
    .withMessage('Denial code cannot exceed 10 characters')
], handleValidationErrors, denyClaim);

// Appeal claim (staff/admin only)
router.post('/:id/appeal', staffOrAdmin, [
  ...createMongoIdValidation('id'),
  body('appealReason')
    .trim()
    .notEmpty()
    .isLength({ min: 5, max: 1000 })
    .withMessage('Appeal reason is required and must be between 5 and 1000 characters')
], handleValidationErrors, appealClaim);

// Add correspondence (staff/admin only)
router.post('/:id/correspondence', staffOrAdmin, [
  ...createMongoIdValidation('id'),
  body('type')
    .isIn(['email', 'phone', 'mail', 'portal'])
    .withMessage('Invalid correspondence type'),
  body('direction')
    .isIn(['inbound', 'outbound'])
    .withMessage('Invalid correspondence direction'),
  body('subject')
    .trim()
    .notEmpty()
    .isLength({ max: 200 })
    .withMessage('Subject is required and cannot exceed 200 characters'),
  body('notes')
    .trim()
    .notEmpty()
    .isLength({ max: 2000 })
    .withMessage('Notes are required and cannot exceed 2000 characters')
], handleValidationErrors, addCorrespondence);

// Update follow-up (staff/admin only)
router.put('/:id/follow-up', staffOrAdmin, [
  ...createMongoIdValidation('id'),
  body('followUpRequired')
    .isBoolean()
    .withMessage('Follow-up required must be a boolean'),
  body('followUpDate')
    .optional()
    .isISO8601()
    .withMessage('Follow-up date must be a valid date'),
  body('followUpReason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Follow-up reason cannot exceed 500 characters')
], handleValidationErrors, updateFollowUp);

export default router;
