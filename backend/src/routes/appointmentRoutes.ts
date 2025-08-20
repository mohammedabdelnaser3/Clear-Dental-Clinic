import { Router } from 'express';
import {
  createAppointment,
  getAllAppointments,
  updateAppointment,
  cancelAppointment,
  rescheduleAppointment,
  completeAppointment,
  getAvailableTimeSlots,
  getTodayAppointments,
  getUpcomingAppointments,
  getAppointmentsByDateRange,
  getAppointmentStatistics,
  sendAppointmentReminders,
  getAppointmentById,
  getRecentAppointments,
  getRecentAppointmentsOverall
} from '../controllers/appointmentController';
import {
  authenticate,
  staffOrAdmin,
  dentistOrAdmin,
  checkClinicAccess,
  patientOwnerOrStaff
} from '../middleware/auth';
import {
  validateAppointmentCreation,
  validateAppointmentUpdate,
  validateMongoId,
  validatePagination,
  validateDateRange,
  createMongoIdValidation,
  handleValidationErrors
} from '../middleware/validation';
import { body, query } from 'express-validator';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Create appointment
router.post('/', validateAppointmentCreation, handleValidationErrors, createAppointment);

// Get all appointments
router.get('/', staffOrAdmin, [
  ...validatePagination.slice(0, -1),
  query('status')
    .optional()
    .isIn(['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'])
    .withMessage('Invalid appointment status'),
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
    .withMessage('End date must be a valid date')
], handleValidationErrors, getAllAppointments);

// Get today's appointments
router.get('/today', staffOrAdmin, [
  query('clinicId')
    .optional()
    .isMongoId()
    .withMessage('Invalid clinic ID'),
  query('dentistId')
    .optional()
    .isMongoId()
    .withMessage('Invalid dentist ID')
], handleValidationErrors, getTodayAppointments);

// Get upcoming appointments
router.get('/upcoming', staffOrAdmin, [
  query('days')
    .optional()
    .isInt({ min: 1, max: 30 })
    .withMessage('Days must be between 1 and 30'),
  query('clinicId')
    .optional()
    .isMongoId()
    .withMessage('Invalid clinic ID'),
  query('dentistId')
    .optional()
    .isMongoId()
    .withMessage('Invalid dentist ID'),
  ...validatePagination.slice(0, -1)
], handleValidationErrors, getUpcomingAppointments);

// Get appointments by date range
router.get('/date-range', staffOrAdmin, [
  ...validateDateRange.slice(0, -1),
  query('clinicId')
    .optional()
    .isMongoId()
    .withMessage('Invalid clinic ID'),
  query('dentistId')
    .optional()
    .isMongoId()
    .withMessage('Invalid dentist ID'),
  query('status')
    .optional()
    .isIn(['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'])
    .withMessage('Invalid appointment status'),
  ...validatePagination.slice(0, -1)
], handleValidationErrors, getAppointmentsByDateRange);

// Get appointment statistics
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
    .withMessage('Invalid clinic ID')
], handleValidationErrors, getAppointmentStatistics);

// Get recent appointments
router.get('/recent', staffOrAdmin, [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  query('clinicId')
    .optional()
    .isMongoId()
    .withMessage('Invalid clinic ID'),
  ...validatePagination.slice(0, -1)
], handleValidationErrors, getRecentAppointments);

// Get recent appointments across all clinics (admin only)
router.get('/recent/overall', dentistOrAdmin, [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  ...validatePagination.slice(0, -1)
], handleValidationErrors, getRecentAppointmentsOverall);

// Get available time slots
router.get('/available-slots', [
  query('date')
    .isISO8601()
    .withMessage('Date is required and must be a valid date'),
  query('dentistId')
    .isMongoId()
    .withMessage('Valid dentist ID is required'),
  query('clinicId')
    .isMongoId()
    .withMessage('Valid clinic ID is required'),
  query('duration')
    .optional()
    .isInt({ min: 15, max: 240 })
    .withMessage('Duration must be between 15 and 240 minutes')
], handleValidationErrors, getAvailableTimeSlots);

// Send appointment reminders (admin only)
router.post('/send-reminders', dentistOrAdmin, [
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Date must be a valid date'),
  body('clinicId')
    .optional()
    .isMongoId()
    .withMessage('Invalid clinic ID')
], handleValidationErrors, sendAppointmentReminders);

// Get appointment by ID (staff/admin or patient if it's their appointment)
router.get('/:id', staffOrAdmin, [
  ...createMongoIdValidation('id')
], handleValidationErrors, getAppointmentById);

// Get appointments by patient ID (staff/admin or patient themselves)
router.get('/patient/:patientId', patientOwnerOrStaff('patientId'), [
  ...createMongoIdValidation('patientId'),
  ...validatePagination.slice(0, -1),
  query('status')
    .optional()
    .isIn(['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'])
    .withMessage('Invalid appointment status'),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date')
], handleValidationErrors, getAllAppointments);

// Update appointment
router.put('/:id', staffOrAdmin, [
  ...createMongoIdValidation('id'),
  ...validateAppointmentUpdate
], handleValidationErrors, updateAppointment);

// Cancel appointment (staff/admin or patient if it's their appointment)
router.patch('/:id/cancel', staffOrAdmin, [
  ...createMongoIdValidation('id'),
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Cancellation reason must not exceed 500 characters'),
  body('sendNotification')
    .optional()
    .isBoolean()
    .withMessage('sendNotification must be a boolean')
], handleValidationErrors, cancelAppointment);

// Reschedule appointment
router.patch('/:id/reschedule', staffOrAdmin, [
  ...createMongoIdValidation('id'),
  body('newDate')
    .isISO8601()
    .withMessage('New date is required and must be a valid date'),
  body('newTime')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('New time is required and must be in HH:MM format'),
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Reschedule reason must not exceed 500 characters'),
  body('sendNotification')
    .optional()
    .isBoolean()
    .withMessage('sendNotification must be a boolean')
], handleValidationErrors, rescheduleAppointment);

// Complete appointment
router.patch('/:id/complete', dentistOrAdmin, [
  ...createMongoIdValidation('id'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes must not exceed 1000 characters'),
  body('treatmentProvided')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Treatment provided must not exceed 500 characters'),
  body('followUpRequired')
    .optional()
    .isBoolean()
    .withMessage('followUpRequired must be a boolean'),
  body('followUpDate')
    .optional()
    .isISO8601()
    .withMessage('Follow-up date must be a valid date')
], handleValidationErrors, completeAppointment);

export default router;