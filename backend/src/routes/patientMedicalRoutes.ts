import { Router } from 'express';
import {
  getPatientMedicalRecord,
  updatePatientMedicalRecord,
  addMedicationToHistory,
  getActiveMedications,
  getPatientPrescriptions,
  getPrescriptionDetails,
  updateMedicationStatus,
  addAllergy,
  removeAllergy,
  getMedicationReminders
} from '../controllers/patientMedicalController';
import { authenticate } from '../middleware/auth';
import { 
  createMongoIdValidation,
  handleValidationErrors 
} from '../middleware/validation';
import { body } from 'express-validator';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get patient's medical record
router.get(
  '/patients/:patientId/medical-record',
  ...createMongoIdValidation('patientId'),
  handleValidationErrors,
  getPatientMedicalRecord
);

// Update patient's medical record
router.put(
  '/patients/:patientId/medical-record',
  [
    ...createMongoIdValidation('patientId'),
    body('allergies')
      .optional()
      .isArray()
      .withMessage('Allergies must be an array'),
    body('currentMedications')
      .optional()
      .isArray()
      .withMessage('Current medications must be an array'),
    body('medicalConditions')
      .optional()
      .isArray()
      .withMessage('Medical conditions must be an array'),
    body('surgeries')
      .optional()
      .isArray()
      .withMessage('Surgeries must be an array'),
    body('familyHistory')
      .optional()
      .isArray()
      .withMessage('Family history must be an array'),
    body('vitalSigns')
      .optional()
      .isObject()
      .withMessage('Vital signs must be an object'),
    body('notes')
      .optional()
      .trim()
      .isLength({ max: 2000 })
      .withMessage('Notes cannot exceed 2000 characters')
  ],
  handleValidationErrors,
  updatePatientMedicalRecord
);

// Add medication to patient's history
router.post(
  '/patients/:patientId/medications',
  [
    ...createMongoIdValidation('patientId'),
    body('medicationName')
      .trim()
      .notEmpty()
      .withMessage('Medication name is required'),
    body('dosage')
      .optional()
      .trim(),
    body('frequency')
      .optional()
      .trim(),
    body('duration')
      .optional()
      .trim(),
    body('startDate')
      .optional()
      .isISO8601()
      .withMessage('Start date must be valid ISO date'),
    body('notes')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Notes cannot exceed 500 characters')
  ],
  handleValidationErrors,
  addMedicationToHistory
);

// Get patient's active medications
router.get(
  '/patients/:patientId/medications/active',
  ...createMongoIdValidation('patientId'),
  handleValidationErrors,
  getActiveMedications
);

// Get patient's prescriptions
router.get(
  '/patients/:patientId/prescriptions',
  ...createMongoIdValidation('patientId'),
  handleValidationErrors,
  getPatientPrescriptions
);

// Get specific prescription details
router.get(
  '/prescriptions/:prescriptionId',
  ...createMongoIdValidation('prescriptionId'),
  handleValidationErrors,
  getPrescriptionDetails
);

// Update medication status in patient's history
router.put(
  '/patients/:patientId/medications/:medicationHistoryId/status',
  [
    ...createMongoIdValidation('patientId'),
    ...createMongoIdValidation('medicationHistoryId'),
    body('status')
      .isIn(['active', 'completed', 'discontinued', 'changed'])
      .withMessage('Invalid status value'),
    body('reason')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Reason cannot exceed 500 characters'),
    body('notes')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Notes cannot exceed 500 characters')
  ],
  handleValidationErrors,
  updateMedicationStatus
);

// Add allergy to patient's record
router.post(
  '/patients/:patientId/allergies',
  [
    ...createMongoIdValidation('patientId'),
    body('allergen')
      .trim()
      .notEmpty()
      .withMessage('Allergen is required')
      .isLength({ max: 100 })
      .withMessage('Allergen name cannot exceed 100 characters'),
    body('severity')
      .optional()
      .isIn(['mild', 'moderate', 'severe', 'critical'])
      .withMessage('Invalid severity level'),
    body('reaction')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Reaction description cannot exceed 200 characters')
  ],
  handleValidationErrors,
  addAllergy
);

// Remove allergy from patient's record
router.delete(
  '/patients/:patientId/allergies/:allergyId',
  [
    ...createMongoIdValidation('patientId'),
    ...createMongoIdValidation('allergyId')
  ],
  handleValidationErrors,
  removeAllergy
);

// Get medication reminders for patient
router.get(
  '/patients/:patientId/medication-reminders',
  ...createMongoIdValidation('patientId'),
  handleValidationErrors,
  getMedicationReminders
);

export default router;