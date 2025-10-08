import { Router } from 'express';
import {
  createInsurance,
  getPatientInsurance,
  getActiveInsurance,
  getInsuranceById,
  updateInsurance,
  verifyInsurance,
  calculateCoverage,
  getExpiringInsurance,
  getVerificationStatistics,
  deactivateInsurance,
  resetAnnualBenefits,
  updateBenefitUsage
} from '../controllers/insuranceController';
import {
  authenticate,
  staffOrAdmin,
  adminOnly
} from '../middleware/auth';
import {
  createMongoIdValidation,
  handleValidationErrors
} from '../middleware/validation';
import { body, query } from 'express-validator';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Create insurance record (staff/admin only)
router.post('/', staffOrAdmin, [
  body('patientId')
    .isMongoId()
    .withMessage('Valid patient ID is required'),
  body('insuranceCompany')
    .trim()
    .notEmpty()
    .isLength({ min: 2, max: 200 })
    .withMessage('Insurance company name is required and must be between 2 and 200 characters'),
  body('policyNumber')
    .trim()
    .notEmpty()
    .isLength({ min: 1, max: 100 })
    .withMessage('Policy number is required and cannot exceed 100 characters'),
  body('policyHolderName')
    .trim()
    .notEmpty()
    .isLength({ min: 2, max: 200 })
    .withMessage('Policy holder name is required and must be between 2 and 200 characters'),
  body('relationshipToPolicyHolder')
    .isIn(['self', 'spouse', 'child', 'parent', 'other'])
    .withMessage('Invalid relationship to policy holder'),
  body('coverageType')
    .isIn(['individual', 'family', 'group'])
    .withMessage('Invalid coverage type'),
  body('effectiveDate')
    .isISO8601()
    .withMessage('Valid effective date is required'),
  body('expirationDate')
    .optional()
    .isISO8601()
    .withMessage('Expiration date must be a valid date'),
  body('annualMaxBenefit')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Annual max benefit must be a positive number'),
  body('annualDeductible')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Annual deductible must be a positive number')
], handleValidationErrors, createInsurance);

// Get expiring insurance policies (admin only)
router.get('/expiring', adminOnly, [
  query('days')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Days must be between 1 and 365')
], handleValidationErrors, getExpiringInsurance);

// Get insurance verification statistics (admin only)
router.get('/statistics', adminOnly, getVerificationStatistics);

// Get patient insurance records
router.get('/patient/:patientId', [
  ...createMongoIdValidation('patientId')
], handleValidationErrors, getPatientInsurance);

// Get active insurance for patient
router.get('/patient/:patientId/active', [
  ...createMongoIdValidation('patientId')
], handleValidationErrors, getActiveInsurance);

// Get insurance by ID
router.get('/:id', [
  ...createMongoIdValidation('id')
], handleValidationErrors, getInsuranceById);

// Update insurance record (staff/admin only)
router.put('/:id', staffOrAdmin, [
  ...createMongoIdValidation('id'),
  body('insuranceCompany')
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Insurance company name must be between 2 and 200 characters'),
  body('policyNumber')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Policy number cannot exceed 100 characters'),
  body('annualMaxBenefit')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Annual max benefit must be a positive number'),
  body('annualDeductible')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Annual deductible must be a positive number'),
  body('preventiveCoverage')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Preventive coverage must be between 0 and 100'),
  body('basicCoverage')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Basic coverage must be between 0 and 100'),
  body('majorCoverage')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Major coverage must be between 0 and 100'),
  body('orthodonticCoverage')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Orthodontic coverage must be between 0 and 100')
], handleValidationErrors, updateInsurance);

// Verify insurance (staff/admin only)
router.post('/:id/verify', staffOrAdmin, [
  ...createMongoIdValidation('id'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters'),
  body('eligibilityStatus')
    .optional()
    .isIn(['eligible', 'not_eligible', 'pending', 'unknown'])
    .withMessage('Invalid eligibility status'),
  body('annualMaxBenefit')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Annual max benefit must be a positive number'),
  body('usedBenefits')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Used benefits must be a positive number')
], handleValidationErrors, verifyInsurance);

// Calculate coverage for treatment
router.post('/:id/calculate-coverage', [
  ...createMongoIdValidation('id'),
  body('treatmentType')
    .trim()
    .notEmpty()
    .withMessage('Treatment type is required'),
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0')
], handleValidationErrors, calculateCoverage);

// Deactivate insurance (staff/admin only)
router.post('/:id/deactivate', staffOrAdmin, [
  ...createMongoIdValidation('id'),
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Reason cannot exceed 500 characters')
], handleValidationErrors, deactivateInsurance);

// Reset annual benefits (admin only)
router.post('/:id/reset-benefits', adminOnly, [
  ...createMongoIdValidation('id')
], handleValidationErrors, resetAnnualBenefits);

// Update benefit usage (staff/admin only)
router.post('/:id/update-usage', staffOrAdmin, [
  ...createMongoIdValidation('id'),
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0')
], handleValidationErrors, updateBenefitUsage);

export default router;
