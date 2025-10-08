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
  getRecentAppointmentsOverall,
  checkAppointmentConflicts,
  autoBookFirstAvailable,
  getNextSlotAfterLastBooking,
  getBookedSlots,
  // Unified Dashboard Endpoints
  getDoctorUnifiedAppointments,
  getAdminUnifiedAppointments,
  quickUpdateAppointment,
  cancelAppointmentWithNotification,
  rescheduleAppointmentEnhanced
} from '../controllers/appointmentController';
import {
  authenticate,
  staffOrAdmin,
  dentistOrAdmin,
  checkClinicAccess,
  patientOwnerOrStaff,
  appointmentAccessControl,
  appointmentDetailAccessControl
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

// Public routes (no authentication required)
// Test route to verify public access works
// router.get('/test-public', (req, res) => {
//   res.json({ success: true, message: 'Public route works!', timestamp: new Date().toISOString() });
// });

// Get available time slots - public endpoint for booking flow
router.get('/available-slots', [
  query('date')
    .isISO8601()
    .withMessage('Date is required and must be a valid date'),
  query('dentistId')
    .optional()
    .custom((value) => {
      if (value === '' || value === undefined || value === null) {
        return true; // Allow empty values
      }
      // If value is provided, validate it's a valid MongoDB ID
      const mongoIdRegex = /^[0-9a-fA-F]{24}$/;
      return mongoIdRegex.test(value);
    })
    .withMessage('Dentist ID must be valid if provided'),
  query('clinicId')
    .isMongoId()
    .withMessage('Valid clinic ID is required'),
  query('duration')
    .optional()
    .isInt({ min: 15, max: 240 })
    .withMessage('Duration must be between 15 and 240 minutes')
], handleValidationErrors, getAvailableTimeSlots);

// Get next slot after last booking - public endpoint for sequential booking
router.get('/next-slot-after-last', [
  query('date')
    .isISO8601()
    .withMessage('Date is required and must be a valid date'),
  query('clinicId')
    .isMongoId()
    .withMessage('Valid clinic ID is required'),
  query('duration')
    .optional()
    .isInt({ min: 15, max: 240 })
    .withMessage('Duration must be between 15 and 240 minutes')
], handleValidationErrors, getNextSlotAfterLastBooking);

// Get booked time slots - public endpoint for availability display
router.get('/booked-slots', [
  query('date')
    .isISO8601()
    .withMessage('Date is required and must be in YYYY-MM-DD format'),
  query('clinicId')
    .isMongoId()
    .withMessage('Valid clinic ID is required'),
  query('doctorId')
    .optional()
    .isMongoId()
    .withMessage('Doctor ID must be valid if provided')
], handleValidationErrors, getBookedSlots);

// Check appointment conflicts - public endpoint for booking validation
router.get('/check-conflict', [
  query('date')
    .isISO8601()
    .withMessage('Date is required and must be a valid date'),
  query('timeSlot')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Time slot must be in HH:MM format'),
  query('clinicId')
    .isMongoId()
    .withMessage('Valid clinic ID is required'),
  query('dentistId')
    .optional()
    .isMongoId()
    .withMessage('Dentist ID must be valid if provided'),
  query('duration')
    .optional()
    .isInt({ min: 15, max: 240 })
    .withMessage('Duration must be between 15 and 240 minutes'),
  query('excludeAppointmentId')
    .optional()
    .isMongoId()
    .withMessage('Exclude appointment ID must be valid if provided')
], handleValidationErrors, checkAppointmentConflicts);

// All routes below require authentication
router.use(authenticate);

// ==================== UNIFIED DASHBOARD ROUTES ====================

// Get unified appointments for doctor across all assigned clinics
router.get('/unified/doctor', dentistOrAdmin, [
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
    .withMessage('Invalid clinic ID'),
  query('patientName')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Patient name must not exceed 100 characters'),
  query('status')
    .optional()
    .isIn(['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'])
    .withMessage('Invalid appointment status'),
  query('sortBy')
    .optional()
    .isIn(['date', 'createdAt', 'status'])
    .withMessage('Invalid sort field'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Invalid sort order')
], handleValidationErrors, getDoctorUnifiedAppointments);

// Get unified appointments for admin (all appointments across all clinics)
router.get('/unified/admin', dentistOrAdmin, [
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
    .withMessage('Invalid clinic ID'),
  query('dentistId')
    .optional()
    .isMongoId()
    .withMessage('Invalid dentist ID'),
  query('patientName')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Patient name must not exceed 100 characters'),
  query('status')
    .optional()
    .isIn(['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'])
    .withMessage('Invalid appointment status'),
  query('sortBy')
    .optional()
    .isIn(['date', 'createdAt', 'status'])
    .withMessage('Invalid sort field'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Invalid sort order')
], handleValidationErrors, getAdminUnifiedAppointments);

// Quick update appointment (time/notes only)
router.patch('/:id/quick-update', dentistOrAdmin, [
  ...createMongoIdValidation('id'),
  body('timeSlot')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Time slot must be in HH:MM format'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes must not exceed 1000 characters'),
  body('duration')
    .optional()
    .isInt({ min: 15, max: 480 })
    .withMessage('Duration must be between 15 and 480 minutes')
], handleValidationErrors, quickUpdateAppointment);

// Cancel appointment with automatic notification
router.post('/:id/cancel-notify', dentistOrAdmin, [
  ...createMongoIdValidation('id'),
  body('cancellationReason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Cancellation reason must not exceed 500 characters'),
  body('notifyPatient')
    .optional()
    .isBoolean()
    .withMessage('notifyPatient must be a boolean')
], handleValidationErrors, cancelAppointmentWithNotification);

// Reschedule appointment with enhanced conflict checking
router.post('/:id/reschedule-enhanced', dentistOrAdmin, [
  ...createMongoIdValidation('id'),
  body('newDate')
    .isISO8601()
    .withMessage('New date is required and must be a valid date'),
  body('newTimeSlot')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('New time slot is required and must be in HH:MM format'),
  body('newDuration')
    .optional()
    .isInt({ min: 15, max: 480 })
    .withMessage('Duration must be between 15 and 480 minutes'),
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Reason must not exceed 500 characters')
], handleValidationErrors, rescheduleAppointmentEnhanced);

// ==================== END UNIFIED DASHBOARD ROUTES ====================

// Create appointment
router.post('/', validateAppointmentCreation, handleValidationErrors, createAppointment);

// Auto-book first available appointment for a date
router.post('/auto-book', [
  body('patientId')
    .isMongoId()
    .withMessage('Invalid patient ID'),
  body('clinicId')
    .isMongoId()
    .withMessage('Invalid clinic ID'),
  body('serviceType')
    .trim()
    .notEmpty()
    .withMessage('Service type is required'),
  body('date')
    .isISO8601()
    .withMessage('Please provide a valid date')
    .custom((value) => {
      const appointmentDate = new Date(value);
      const today = new Date();
      
      // Simple timezone-safe date comparison using date strings
      const appointmentDateStr = appointmentDate.toISOString().split('T')[0];
      const todayDateStr = today.toISOString().split('T')[0];
      
      if (appointmentDateStr < todayDateStr) {
        throw new Error('Appointment date cannot be in the past');
      }
      return true;
    }),
  body('duration')
    .optional()
    .isInt({ min: 15, max: 480 })
    .withMessage('Duration must be between 15 and 480 minutes'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes must not exceed 1000 characters'),
  body('emergency')
    .optional()
    .isBoolean()
    .withMessage('Emergency must be a boolean')
], handleValidationErrors, autoBookFirstAvailable);

// Get all appointments
router.get('/', appointmentAccessControl, [
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
router.get('/:id', appointmentDetailAccessControl, [
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