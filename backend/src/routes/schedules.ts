import express from 'express';
import { body, param, query } from 'express-validator';
import { protect, authorize } from '../middleware/auth';
import {
  getAllSchedules,
  getScheduleById,
  getSchedulesByDoctor,
  getSchedulesByClinic,
  getAvailableDoctors,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  bulkCreateSchedules
} from '../controllers/doctorScheduleController';
import { handleValidationErrors } from '../middleware/validation';

const router = express.Router();

// Public route for getting available doctors (needed for appointment booking)
// @route   GET /api/v1/schedules/available
// @desc    Get available doctors for a specific day at a clinic
// @access  Public
router.get('/available',
  [
    query('clinicId').notEmpty().withMessage('Clinic ID is required'),
    query('dayOfWeek').optional().isInt({ min: 0, max: 6 }).withMessage('Day of week must be 0-6'),
    query('date').optional().isISO8601().withMessage('Invalid date format')
  ],
  handleValidationErrors,
  getAvailableDoctors
);

// Protect all other routes
router.use(protect);

// @route   GET /api/v1/schedules/doctor/:doctorId
// @desc    Get all schedules for a specific doctor
// @access  Private
router.get('/doctor/:doctorId',
  [
    param('doctorId').isMongoId().withMessage('Invalid doctor ID'),
    query('isActive').optional().isBoolean().withMessage('isActive must be boolean')
  ],
  handleValidationErrors,
  getSchedulesByDoctor
);

// @route   GET /api/v1/schedules/clinic/:clinicId
// @desc    Get all schedules for a specific clinic
// @access  Private
router.get('/clinic/:clinicId',
  [
    param('clinicId').isMongoId().withMessage('Invalid clinic ID'),
    query('isActive').optional().isBoolean().withMessage('isActive must be boolean')
  ],
  handleValidationErrors,
  getSchedulesByClinic
);

// @route   GET /api/v1/schedules/:id
// @desc    Get schedule by ID
// @access  Private
router.get('/:id',
  [
    param('id').isMongoId().withMessage('Invalid schedule ID')
  ],
  handleValidationErrors,
  getScheduleById
);

// @route   GET /api/v1/schedules
// @desc    Get all schedules with optional filters
// @access  Private
router.get('/',
  [
    query('doctorId').optional().isMongoId().withMessage('Invalid doctor ID'),
    query('clinicId').optional().isMongoId().withMessage('Invalid clinic ID'),
    query('dayOfWeek').optional().isInt({ min: 0, max: 6 }).withMessage('Day of week must be 0-6'),
    query('isActive').optional().isBoolean().withMessage('isActive must be boolean')
  ],
  handleValidationErrors,
  getAllSchedules
);

// @route   POST /api/v1/schedules/bulk
// @desc    Bulk create schedules
// @access  Private (Admin only)
router.post('/bulk',
  [
    body('schedules').isArray({ min: 1 }).withMessage('Schedules array is required')
  ],
  handleValidationErrors,
  authorize('admin', 'super_admin'),
  bulkCreateSchedules
);

// @route   POST /api/v1/schedules
// @desc    Create new schedule
// @access  Private (Admin only)
router.post('/',
  [
    body('doctorId').isMongoId().withMessage('Valid doctor ID is required'),
    body('clinicId').isMongoId().withMessage('Valid clinic ID is required'),
    body('dayOfWeek').isInt({ min: 0, max: 6 }).withMessage('Day of week must be 0-6'),
    body('startTime').matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Start time must be in HH:mm format'),
    body('endTime').matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('End time must be in HH:mm format'),
    body('notes').optional().isString().withMessage('Notes must be a string'),
    body('effectiveFrom').optional().isISO8601().withMessage('Invalid effectiveFrom date'),
    body('effectiveUntil').optional().isISO8601().withMessage('Invalid effectiveUntil date')
  ],
  handleValidationErrors,
  authorize('admin', 'super_admin'),
  createSchedule
);

// @route   PUT /api/v1/schedules/:id
// @desc    Update schedule
// @access  Private (Admin only)
router.put('/:id',
  [
    param('id').isMongoId().withMessage('Invalid schedule ID'),
    body('doctorId').optional().isMongoId().withMessage('Invalid doctor ID'),
    body('clinicId').optional().isMongoId().withMessage('Invalid clinic ID'),
    body('dayOfWeek').optional().isInt({ min: 0, max: 6 }).withMessage('Day of week must be 0-6'),
    body('startTime').optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Start time must be in HH:mm format'),
    body('endTime').optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('End time must be in HH:mm format'),
    body('notes').optional().isString().withMessage('Notes must be a string'),
    body('isActive').optional().isBoolean().withMessage('isActive must be boolean'),
    body('effectiveFrom').optional().isISO8601().withMessage('Invalid effectiveFrom date'),
    body('effectiveUntil').optional().isISO8601().withMessage('Invalid effectiveUntil date')
  ],
  handleValidationErrors,
  authorize('admin', 'super_admin'),
  updateSchedule
);

// @route   DELETE /api/v1/schedules/:id
// @desc    Delete schedule (soft delete)
// @access  Private (Admin only)
router.delete('/:id',
  [
    param('id').isMongoId().withMessage('Invalid schedule ID')
  ],
  handleValidationErrors,
  authorize('admin', 'super_admin'),
  deleteSchedule
);

export default router;

