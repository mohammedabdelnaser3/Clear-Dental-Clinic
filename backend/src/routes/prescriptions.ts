import express from 'express';
import {
  getAllPrescriptions,
  getPrescriptionById,
  createPrescription,
  updatePrescription,
  deletePrescription,
  getPrescriptionsByPatient,
  getActivePrescriptions,
  getExpiringPrescriptions,
  addRefill,
  performSafetyCheck,
  getPatientMedicationSummary,
  getCrossClinicPrescriptions,
  getMyPrescriptions
} from '../controllers/prescriptionController';
import { protect, authorize, patientOwnerOrStaff } from '../middleware/auth';
import { handleValidationErrors } from '../middleware/validation';
import { body, param, query } from 'express-validator';

const router = express.Router();

// Protect all routes
router.use(protect);

// Medication Safety Check (must come before /:id routes)
router.post('/safety-check',
  [
    body('patientId').isMongoId().withMessage('Valid patient ID is required'),
    body('medications').isArray({ min: 1 }).withMessage('At least one medication is required'),
    body('medications.*.medicationId').isMongoId().withMessage('Valid medication ID is required'),
    body('medications.*.name').notEmpty().withMessage('Medication name is required'),
    body('medications.*.genericName').optional().isString(),
    body('medications.*.dosage').notEmpty().withMessage('Dosage is required'),
    body('medications.*.frequency').notEmpty().withMessage('Frequency is required'),
    body('medications.*.duration').notEmpty().withMessage('Duration is required')
  ],
  handleValidationErrors,
  authorize('dentist', 'admin'),
  performSafetyCheck
);

// Get patient medication summary (allergies, current meds, conditions)
router.get('/patient/:patientId/summary',
  [
    param('patientId').isMongoId().withMessage('Invalid patient ID')
  ],
  handleValidationErrors,
  authorize('dentist', 'staff', 'admin'),
  getPatientMedicationSummary
);

// Get cross-clinic prescriptions for a patient
router.get('/cross-clinic/patient/:patientId',
  [
    param('patientId').isMongoId().withMessage('Invalid patient ID'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('status').optional().isIn(['active', 'completed', 'cancelled', 'expired'])
      .withMessage('Invalid prescription status')
  ],
  handleValidationErrors,
  authorize('dentist', 'admin'),
  getCrossClinicPrescriptions
);

// Get active prescriptions
router.get('/active',
  [
    query('patientId').optional().isMongoId().withMessage('Invalid patient ID')
  ],
  handleValidationErrors,
  authorize('dentist', 'staff', 'admin'),
  getActivePrescriptions
);

// Get expiring prescriptions
router.get('/expiring',
  [
    query('days').optional().isInt({ min: 1, max: 365 }).withMessage('Days must be between 1 and 365')
  ],
  handleValidationErrors,
  authorize('dentist', 'staff', 'admin'),
  getExpiringPrescriptions
);

// Get current user's prescriptions (for patients, dentists, staff, admin)
router.get('/my-prescriptions',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('status').optional().isIn(['active', 'completed', 'cancelled', 'expired'])
      .withMessage('Invalid prescription status')
  ],
  handleValidationErrors,
  authorize('patient', 'dentist', 'staff', 'admin'),
  getMyPrescriptions
);

// Get prescriptions by patient (staff/admin or patient themselves)
router.get('/patient/:patientId',
  [
    param('patientId').isMongoId().withMessage('Invalid patient ID'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('status').optional().isIn(['active', 'completed', 'cancelled', 'expired'])
      .withMessage('Invalid prescription status')
  ],
  handleValidationErrors,
  patientOwnerOrStaff('patientId'),
  getPrescriptionsByPatient
);

// Get all prescriptions
router.get('/',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('status').optional().isIn(['active', 'completed', 'cancelled', 'expired'])
      .withMessage('Invalid prescription status'),
    query('patientId').optional().isMongoId().withMessage('Invalid patient ID')
  ],
  handleValidationErrors,
  authorize('dentist', 'staff', 'admin', 'patient'),
  getAllPrescriptions
);

// Create new prescription
router.post('/',
  [
    body('patientId').isMongoId().withMessage('Valid patient ID is required'),
    body('clinicId').isMongoId().withMessage('Valid clinic ID is required'),
    body('appointmentId').optional().isMongoId().withMessage('Invalid appointment ID'),
    body('medications').isArray({ min: 1 }).withMessage('At least one medication is required'),
    body('medications.*.medicationId').isMongoId().withMessage('Valid medication ID is required'),
    body('medications.*.dosage').notEmpty().withMessage('Medication dosage is required'),
    body('medications.*.frequency').notEmpty().withMessage('Medication frequency is required'),
    body('medications.*.duration').notEmpty().withMessage('Medication duration is required'),
    body('medications.*.instructions').optional().isString().withMessage('Instructions must be a string'),
    body('medications.*.startDate').isISO8601().withMessage('Valid start date is required'),
    body('medications.*.endDate').optional().isISO8601().withMessage('Invalid end date'),
    body('diagnosis').notEmpty().withMessage('Diagnosis is required'),
    body('notes').optional().isString().withMessage('Notes must be a string'),
    body('status').optional().isIn(['active', 'completed', 'cancelled', 'expired'])
      .withMessage('Invalid prescription status'),
    body('expiryDate').optional().isISO8601().withMessage('Invalid expiry date'),
    body('refillsAllowed').optional().isInt({ min: 0 }).withMessage('Refills allowed must be a non-negative integer'),
    body('refillsUsed').optional().isInt({ min: 0 }).withMessage('Refills used must be a non-negative integer')
  ],
  handleValidationErrors,
  authorize('dentist'),
  createPrescription
);

// Add refill to prescription
router.post('/:id/refill',
  [
    param('id').isMongoId().withMessage('Invalid prescription ID')
  ],
  handleValidationErrors,
  authorize('dentist'),
  addRefill
);

// Get prescription by ID (staff/admin or patient if it's their prescription)
router.get('/:id',
  [
    param('id').isMongoId().withMessage('Invalid prescription ID')
  ],
  handleValidationErrors,
  authorize('dentist', 'staff', 'admin', 'patient'),
  getPrescriptionById
);

// Update prescription
router.put('/:id',
  [
    param('id').isMongoId().withMessage('Invalid prescription ID'),
    body('patientId').optional().isMongoId().withMessage('Invalid patient ID'),
    body('clinicId').optional().isMongoId().withMessage('Invalid clinic ID'),
    body('appointmentId').optional().isMongoId().withMessage('Invalid appointment ID'),
    body('medications').optional().isArray({ min: 1 }).withMessage('At least one medication is required'),
    body('medications.*.medicationId').optional().isMongoId().withMessage('Invalid medication ID'),
    body('medications.*.dosage').optional().notEmpty().withMessage('Medication dosage cannot be empty'),
    body('medications.*.frequency').optional().notEmpty().withMessage('Medication frequency cannot be empty'),
    body('medications.*.duration').optional().notEmpty().withMessage('Medication duration cannot be empty'),
    body('medications.*.instructions').optional().isString().withMessage('Instructions must be a string'),
    body('medications.*.startDate').optional().isISO8601().withMessage('Invalid start date'),
    body('medications.*.endDate').optional().isISO8601().withMessage('Invalid end date'),
    body('diagnosis').optional().notEmpty().withMessage('Diagnosis cannot be empty'),
    body('notes').optional().isString().withMessage('Notes must be a string'),
    body('status').optional().isIn(['active', 'completed', 'cancelled', 'expired'])
      .withMessage('Invalid prescription status'),
    body('expiryDate').optional().isISO8601().withMessage('Invalid expiry date'),
    body('refillsAllowed').optional().isInt({ min: 0 }).withMessage('Refills allowed must be a non-negative integer'),
    body('refillsUsed').optional().isInt({ min: 0 }).withMessage('Refills used must be a non-negative integer')
  ],
  handleValidationErrors,
  authorize('dentist', 'admin'),
  updatePrescription
);

// Delete prescription (cancel)
router.delete('/:id',
  [
    param('id').isMongoId().withMessage('Invalid prescription ID')
  ],
  handleValidationErrors,
  authorize('dentist', 'admin'),
  deletePrescription
);

export default router;