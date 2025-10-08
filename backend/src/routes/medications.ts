import express from 'express';
import {
  getAllMedications,
  getMedicationById,
  createMedication,
  updateMedication,
  deleteMedication,
  searchMedications,
  getMedicationsByCategory
} from '../controllers/medicationController';
import { protect, authorize } from '../middleware/auth';
import { handleValidationErrors } from '../middleware/validation';
import { body, param, query } from 'express-validator';

const router = express.Router();

// Protect all routes
router.use(protect);

// Search medications
router.get('/search', 
  [
    query('q').notEmpty().withMessage('Search query is required')
  ],
  handleValidationErrors,
  authorize('dentist', 'staff', 'admin'),
  searchMedications
);

// Get medications by category
router.get('/category/:category',
  [
    param('category').isIn(['antibiotic', 'painkiller', 'anti-inflammatory', 'anesthetic', 'antiseptic', 'other'])
      .withMessage('Invalid medication category')
  ],
  handleValidationErrors,
  authorize('dentist', 'staff', 'admin'),
  getMedicationsByCategory
);

// Get all medications
router.get('/',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('search').optional().isString().withMessage('Search must be a string'),
    query('category').optional().isIn(['antibiotic', 'painkiller', 'anti-inflammatory', 'anesthetic', 'antiseptic', 'other'])
      .withMessage('Invalid medication category')
  ],
  handleValidationErrors,
  authorize('dentist', 'staff', 'admin'),
  getAllMedications
);

// Create new medication
router.post('/',
  [
    body('name').notEmpty().withMessage('Medication name is required'),
    body('genericName').optional().isString().withMessage('Generic name must be a string'),
    body('dosage').notEmpty().withMessage('Dosage is required'),
    body('frequency').notEmpty().withMessage('Frequency is required'),
    body('duration').notEmpty().withMessage('Duration is required'),
    body('instructions').optional().isString().withMessage('Instructions must be a string'),
    body('sideEffects').optional().isArray().withMessage('Side effects must be an array'),
    body('contraindications').optional().isArray().withMessage('Contraindications must be an array'),
    body('category').isIn(['antibiotic', 'painkiller', 'anti-inflammatory', 'anesthetic', 'antiseptic', 'other'])
      .withMessage('Invalid medication category'),
    body('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
  ],
  handleValidationErrors,
  authorize('admin','dentist'),
  createMedication
);

// Get medication by ID
router.get('/:id',
  [
    param('id').isMongoId().withMessage('Invalid medication ID')
  ],
  handleValidationErrors,
  authorize('dentist', 'staff', 'admin'),
  getMedicationById
);

// Update medication
router.put('/:id',
  [
    param('id').isMongoId().withMessage('Invalid medication ID'),
    body('name').optional().notEmpty().withMessage('Medication name cannot be empty'),
    body('genericName').optional().isString().withMessage('Generic name must be a string'),
    body('dosage').optional().notEmpty().withMessage('Dosage cannot be empty'),
    body('frequency').optional().notEmpty().withMessage('Frequency cannot be empty'),
    body('duration').optional().notEmpty().withMessage('Duration cannot be empty'),
    body('instructions').optional().isString().withMessage('Instructions must be a string'),
    body('sideEffects').optional().isArray().withMessage('Side effects must be an array'),
    body('contraindications').optional().isArray().withMessage('Contraindications must be an array'),
    body('category').optional().isIn(['antibiotic', 'painkiller', 'anti-inflammatory', 'anesthetic', 'antiseptic', 'other'])
      .withMessage('Invalid medication category'),
    body('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
  ],
  handleValidationErrors,
  authorize('admin', 'dentist'),
  updateMedication
);

// Delete medication
router.delete('/:id',
  [
    param('id').isMongoId().withMessage('Invalid medication ID')
  ],
  handleValidationErrors,
  authorize('admin','dentist'),
  deleteMedication
);

export default router;