import { Router } from 'express';
import {
  createStaffSchedule,
  getStaffSchedules,
  getStaffScheduleById,
  updateStaffSchedule,
  deleteStaffSchedule,
  getStaffAvailability,
  getScheduleAnalytics
} from '../controllers/staffScheduleController';
import {
  authenticate,
  staffOrAdmin
} from '../middleware/auth';
import {
  body,
  query,
  param
} from 'express-validator';
import {
  handleValidationErrors,
  createMongoIdValidation,
  validatePagination
} from '../middleware/validation';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Create staff schedule
router.post('/', [
  body('staffId')
    .isMongoId()
    .withMessage('Valid staff ID is required'),
  body('clinicId')
    .isMongoId()
    .withMessage('Valid clinic ID is required'),
  body('date')
    .isISO8601()
    .withMessage('Valid date is required'),
  body('startTime')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Valid start time is required (HH:MM format)'),
  body('endTime')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Valid end time is required (HH:MM format)'),
  body('shiftType')
    .isIn(['morning', 'afternoon', 'evening', 'night', 'full-day'])
    .withMessage('Valid shift type is required'),
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters'),
  body('isRecurring')
    .optional()
    .isBoolean()
    .withMessage('isRecurring must be a boolean'),
  body('recurringPattern.frequency')
    .if(body('isRecurring').equals('true'))
    .isIn(['daily', 'weekly', 'monthly'])
    .withMessage('Valid frequency is required for recurring schedules'),
  body('recurringPattern.daysOfWeek')
    .optional()
    .isArray()
    .withMessage('Days of week must be an array'),
  body('recurringPattern.daysOfWeek.*')
    .optional()
    .isInt({ min: 0, max: 6 })
    .withMessage('Days of week must be integers between 0-6'),
  body('recurringPattern.endDate')
    .optional()
    .isISO8601()
    .withMessage('Valid end date is required')
], handleValidationErrors, staffOrAdmin, createStaffSchedule);

// Get staff schedules with filtering
router.get('/', [
  ...validatePagination,
  query('clinicId')
    .optional()
    .isMongoId()
    .withMessage('Valid clinic ID is required'),
  query('staffId')
    .optional()
    .isMongoId()
    .withMessage('Valid staff ID is required'),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Valid start date is required'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('Valid end date is required'),
  query('status')
    .optional()
    .isIn(['scheduled', 'completed', 'cancelled', 'no-show'])
    .withMessage('Valid status is required'),
  query('shiftType')
    .optional()
    .isIn(['morning', 'afternoon', 'evening', 'night', 'full-day'])
    .withMessage('Valid shift type is required')
], handleValidationErrors, getStaffSchedules);

// Get staff availability
router.get('/availability', [
  query('clinicId')
    .isMongoId()
    .withMessage('Valid clinic ID is required'),
  query('date')
    .isISO8601()
    .withMessage('Valid date is required')
], handleValidationErrors, getStaffAvailability);

// Get schedule analytics for a clinic
router.get('/analytics/:clinicId', [
  ...createMongoIdValidation('clinicId'),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Valid start date is required'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('Valid end date is required')
], handleValidationErrors, staffOrAdmin, getScheduleAnalytics);

// Get staff schedule by ID
router.get('/:id', [
  ...createMongoIdValidation('id')
], handleValidationErrors, getStaffScheduleById);

// Update staff schedule
router.put('/:id', [
  ...createMongoIdValidation('id'),
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Valid date is required'),
  body('startTime')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Valid start time is required (HH:MM format)'),
  body('endTime')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Valid end time is required (HH:MM format)'),
  body('shiftType')
    .optional()
    .isIn(['morning', 'afternoon', 'evening', 'night', 'full-day'])
    .withMessage('Valid shift type is required'),
  body('status')
    .optional()
    .isIn(['scheduled', 'completed', 'cancelled', 'no-show'])
    .withMessage('Valid status is required'),
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters')
], handleValidationErrors, staffOrAdmin, updateStaffSchedule);

// Delete staff schedule
router.delete('/:id', [
  ...createMongoIdValidation('id')
], handleValidationErrors, staffOrAdmin, deleteStaffSchedule);

export default router;