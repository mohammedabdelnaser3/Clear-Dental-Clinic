import { Router } from 'express';
import {
  createPatient,
  getPatients,
  getPatientById,
  updatePatient,
  deletePatient,
  searchPatients,
  getPatientMedicalHistory,
  updatePatientMedicalHistory,
  getPatientsByUserId,
  getRecentPatients,
  getPatientStatistics
} from '../controllers/patientController';
import { getPatientMedications } from '../controllers/medicationController';
import { 
  getPatientReports, 
  createPatientReport, 
  updatePatientReport, 
  deletePatientReport, 
  getPatientReportById 
} from '../controllers/patientReportController';
import {
  authenticate,
  staffOrAdmin,
  dentistOrAdmin,
  checkClinicAccess,
  patientOwnerOrStaff,
  userOwnerOrStaff
} from '../middleware/auth';
import {
  validatePatientCreation,
  validateMongoId,
  validatePagination,
  createMongoIdValidation,
  handleValidationErrors
} from '../middleware/validation';
import { body, query } from 'express-validator';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Create patient
router.post('/', staffOrAdmin, validatePatientCreation, handleValidationErrors, createPatient);

// Get all patients
router.get('/', staffOrAdmin, [
  ...validatePagination.slice(0, -1),
  query('search')
    .optional()
    .trim()
    .custom((value) => {
      if (value && value.length > 0 && value.length < 2) {
        throw new Error('Search term must be at least 2 characters');
      }
      return true;
    })
    .withMessage('Search term must be at least 2 characters'),
  query('clinicId')
    .optional()
    .isMongoId()
    .withMessage('Invalid clinic ID'),
  query('gender')
    .optional()
    .isIn(['male', 'female', 'other'])
    .withMessage('Invalid gender'),
  query('ageMin')
    .optional()
    .isInt({ min: 0, max: 150 })
    .withMessage('Minimum age must be between 0 and 150'),
  query('ageMax')
    .optional()
    .isInt({ min: 0, max: 150 })
    .withMessage('Maximum age must be between 0 and 150')
], handleValidationErrors, getPatients);

// Search patients
router.get('/search', staffOrAdmin, [
  query('q')
    .notEmpty()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Search query must be at least 2 characters'),
  ...validatePagination.slice(0, -1)
], handleValidationErrors, searchPatients);

// Get patients by user ID (for patient users to find their own records)
router.get('/user/:userId', userOwnerOrStaff('userId'), [
  ...createMongoIdValidation('userId'),
  ...validatePagination.slice(0, -1)
], handleValidationErrors, getPatientsByUserId);

// Get recent patients
router.get('/recent', staffOrAdmin, [
  query('clinicId')
    .optional()
    .isMongoId()
    .withMessage('Invalid clinic ID'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
], handleValidationErrors, getRecentPatients);

// Get patient statistics
router.get('/statistics', staffOrAdmin, [
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
    .withMessage('End date must be a valid date')
], handleValidationErrors, getPatientStatistics);

// Get patient by ID (staff/admin or patient themselves)
router.get('/:id', patientOwnerOrStaff('id'), [
  ...createMongoIdValidation('id')
], handleValidationErrors, getPatientById);

// Update patient (staff/admin or patient themselves)
router.put('/:id', patientOwnerOrStaff('id'), [
  ...createMongoIdValidation('id'),
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Please provide a valid phone number'),
  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid date of birth'),
  body('gender')
    .optional()
    .isIn(['male', 'female', 'other'])
    .withMessage('Gender must be male, female, or other'),
  body('address')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Address must not exceed 200 characters'),
  body('emergencyContact.name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Emergency contact name must be between 2 and 100 characters'),
  body('emergencyContact.phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Please provide a valid emergency contact phone number'),
  body('emergencyContact.relationship')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Emergency contact relationship must be between 2 and 50 characters'),
  body('insurance.provider')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Insurance provider must be between 2 and 100 characters'),
  body('insurance.policyNumber')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Insurance policy number must be between 2 and 50 characters'),
  body('insurance.groupNumber')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Insurance group number must not exceed 50 characters'),
  body('userId')
    .optional()
    .isMongoId()
    .withMessage('Invalid user ID')
], handleValidationErrors, updatePatient);

// Delete patient
router.delete('/:id', staffOrAdmin, [
  ...createMongoIdValidation('id')
], handleValidationErrors, deletePatient);

// Medical history routes (staff/admin or patient themselves)
router.get('/:id/medical-history', patientOwnerOrStaff('id'), [
  ...createMongoIdValidation('id')
], handleValidationErrors, getPatientMedicalHistory);

// Update patient medical history
router.put('/:id/medical-history', dentistOrAdmin, [
  ...createMongoIdValidation('id'),
  body('medicalHistory')
    .optional()
    .isObject()
    .withMessage('Medical history must be an object'),
  body('allergies')
    .optional()
    .isArray()
    .withMessage('Allergies must be an array'),
  body('currentMedications')
    .optional()
    .isArray()
    .withMessage('Current medications must be an array')
], handleValidationErrors, updatePatientMedicalHistory);

// Patient reports routes
// Get patient reports
router.get('/:id/reports', patientOwnerOrStaff('id'), [
  ...createMongoIdValidation('id'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('search')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Search term must be at least 2 characters')
], handleValidationErrors, getPatientReports);

// Create patient report
router.post('/:id/reports', dentistOrAdmin, [
  ...createMongoIdValidation('id'),
  body('title')
    .notEmpty()
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Title must be between 2 and 200 characters'),
  body('description')
    .notEmpty()
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters'),
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Date must be a valid date'),
  body('attachments')
    .optional()
    .isArray()
    .withMessage('Attachments must be an array'),
  body('isShared')
    .optional()
    .isBoolean()
    .withMessage('isShared must be a boolean')
], handleValidationErrors, createPatientReport);

// Get specific report by ID
router.get('/reports/:reportId', [
  ...createMongoIdValidation('reportId')
], handleValidationErrors, getPatientReportById);

// Update patient report
router.put('/reports/:reportId', [
  ...createMongoIdValidation('reportId'),
  body('title')
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Title must be between 2 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters'),
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Date must be a valid date'),
  body('attachments')
    .optional()
    .isArray()
    .withMessage('Attachments must be an array'),
  body('isShared')
    .optional()
    .isBoolean()
    .withMessage('isShared must be a boolean')
], handleValidationErrors, updatePatientReport);

// Delete patient report
router.delete('/reports/:reportId', [
  ...createMongoIdValidation('reportId')
], handleValidationErrors, deletePatientReport);

export default router;