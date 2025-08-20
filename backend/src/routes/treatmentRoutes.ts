import { Router } from 'express';
import {
  createTreatmentRecord,
  getAllTreatmentRecords,
  getTreatmentRecordById,
  updateTreatmentRecord,
  deleteTreatmentRecord,
  getTreatmentRecordsByPatient,
  getTreatmentRecordsByDentist,
  getTreatmentRecordsByClinic,
  getTreatmentRecordsByDateRange,
  getRecentTreatmentRecords,
  searchTreatmentRecords,
  addAttachment,
  removeAttachment,
  getTreatmentStatistics
} from '../controllers/treatmentController';
import {
  authenticate,
  staffOrAdmin,
  dentistOrAdmin,
  checkClinicAccess
} from '../middleware/auth';
import {
  validateMongoId,
  validatePagination,
  validateDateRange,
  createMongoIdValidation,
  handleValidationErrors
} from '../middleware/validation';
import { body, query } from 'express-validator';
import { uploadSingle } from '../utils/upload';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Create treatment record
router.post('/', dentistOrAdmin, [
  body('patientId')
    .isMongoId()
    .withMessage('Valid patient ID is required'),
  body('date')
    .isISO8601()
    .withMessage('Treatment date is required and must be a valid date'),
  body('dentistId')
    .isMongoId()
    .withMessage('Valid dentist ID is required'),
  body('clinicId')
    .isMongoId()
    .withMessage('Valid clinic ID is required'),
  body('procedure')
    .trim()
    .notEmpty()
    .isLength({ min: 2, max: 200 })
    .withMessage('Procedure must be between 2 and 200 characters'),
  body('diagnosis')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Diagnosis must not exceed 500 characters'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes must not exceed 1000 characters')
], handleValidationErrors, createTreatmentRecord);

// Get all treatment records
router.get('/', staffOrAdmin, [
  ...validatePagination.slice(0, -1),
  query('patientId')
    .optional()
    .isMongoId()
    .withMessage('Invalid patient ID'),
  query('dentistId')
    .optional()
    .isMongoId()
    .withMessage('Invalid dentist ID'),
  query('clinicId')
    .optional()
    .isMongoId()
    .withMessage('Invalid clinic ID'),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date'),
  query('procedure')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Procedure search must be at least 2 characters')
], handleValidationErrors, getAllTreatmentRecords);

// Search treatment records
router.get('/search', staffOrAdmin, [
  query('q')
    .notEmpty()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Search query must be at least 2 characters'),
  ...validatePagination.slice(0, -1)
], handleValidationErrors, searchTreatmentRecords);

// Get treatment statistics
router.get('/statistics', staffOrAdmin, [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date'),
  query('clinicId')
    .optional()
    .isMongoId()
    .withMessage('Invalid clinic ID'),
  query('dentistId')
    .optional()
    .isMongoId()
    .withMessage('Invalid dentist ID')
], handleValidationErrors, getTreatmentStatistics);

// Get recent treatment records
router.get('/recent', staffOrAdmin, [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  query('clinicId')
    .optional()
    .isMongoId()
    .withMessage('Invalid clinic ID'),
  query('dentistId')
    .optional()
    .isMongoId()
    .withMessage('Invalid dentist ID')
], handleValidationErrors, getRecentTreatmentRecords);

// Get treatment records by date range
router.get('/date-range', staffOrAdmin, [
  ...validateDateRange.slice(0, -1),
  query('patientId')
    .optional()
    .isMongoId()
    .withMessage('Invalid patient ID'),
  query('dentistId')
    .optional()
    .isMongoId()
    .withMessage('Invalid dentist ID'),
  query('clinicId')
    .optional()
    .isMongoId()
    .withMessage('Invalid clinic ID'),
  ...validatePagination.slice(0, -1)
], handleValidationErrors, getTreatmentRecordsByDateRange);

// Get treatment records by patient
router.get('/patient/:patientId', staffOrAdmin, [
  ...createMongoIdValidation('patientId'),
  ...validatePagination.slice(0, -1),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date')
], handleValidationErrors, getTreatmentRecordsByPatient);

// Get treatment records by dentist
router.get('/dentist/:dentistId', staffOrAdmin, [
  ...createMongoIdValidation('dentistId'),
  ...validatePagination.slice(0, -1),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date'),
  query('clinicId')
    .optional()
    .isMongoId()
    .withMessage('Invalid clinic ID')
], handleValidationErrors, getTreatmentRecordsByDentist);

// Get treatment records by clinic
router.get('/clinic/:clinicId', staffOrAdmin, [
  ...createMongoIdValidation('clinicId'),
  ...validatePagination.slice(0, -1),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date'),
  query('dentistId')
    .optional()
    .isMongoId()
    .withMessage('Invalid dentist ID')
], handleValidationErrors, checkClinicAccess, getTreatmentRecordsByClinic);

// Get treatment record by ID
router.get('/:id', staffOrAdmin, [
  ...createMongoIdValidation('id')
], handleValidationErrors, getTreatmentRecordById);

// Update treatment record
router.put('/:id', dentistOrAdmin, [
  ...createMongoIdValidation('id'),
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Treatment date must be a valid date'),
  body('procedure')
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Procedure must be between 2 and 200 characters'),
  body('diagnosis')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Diagnosis must not exceed 500 characters'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes must not exceed 1000 characters')
], handleValidationErrors, updateTreatmentRecord);

// Delete treatment record
router.delete('/:id', dentistOrAdmin, [
  ...createMongoIdValidation('id')
], handleValidationErrors, deleteTreatmentRecord);

// Add attachment to treatment record
router.post('/:id/attachments', dentistOrAdmin, [
  ...createMongoIdValidation('id')
], handleValidationErrors, uploadSingle('attachment'), addAttachment);

// Remove attachment from treatment record
router.delete('/:id/attachments/:attachmentId', dentistOrAdmin, [
  ...createMongoIdValidation('id'),
  body('attachmentId')
    .notEmpty()
    .withMessage('Attachment ID is required')
], handleValidationErrors, removeAttachment);

export default router;