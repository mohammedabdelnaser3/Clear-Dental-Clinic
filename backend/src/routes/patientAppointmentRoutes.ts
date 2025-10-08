import { Router } from 'express';
import {
  getPatientAppointments,
  modifyAppointment,
  cancelAppointment,
  getUpcomingAppointments,
  requestAppointmentReminder
} from '../controllers/patientAppointmentController';
import { authenticate } from '../middleware/auth';
import { 
  createMongoIdValidation,
  handleValidationErrors 
} from '../middleware/validation';
import { body } from 'express-validator';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get patient's appointments
router.get(
  '/patients/:patientId/appointments',
  ...createMongoIdValidation('patientId'),
  handleValidationErrors,
  getPatientAppointments
);

// Get upcoming appointments for patient
router.get(
  '/patients/:patientId/appointments/upcoming',
  ...createMongoIdValidation('patientId'),
  handleValidationErrors,
  getUpcomingAppointments
);

// Modify appointment (reschedule)
router.put(
  '/appointments/:appointmentId/modify',
  [
    ...createMongoIdValidation('appointmentId'),
    body('date')
      .optional()
      .isISO8601()
      .withMessage('Date must be in valid ISO format'),
    body('timeSlot')
      .optional()
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage('Time slot must be in HH:MM format'),
    body('notes')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Notes cannot exceed 1000 characters'),
    body('reason')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Reason cannot exceed 500 characters')
  ],
  handleValidationErrors,
  modifyAppointment
);

// Cancel appointment
router.put(
  '/appointments/:appointmentId/cancel',
  [
    ...createMongoIdValidation('appointmentId'),
    body('reason')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Reason cannot exceed 500 characters'),
    body('cancelledBy')
      .optional()
      .isIn(['patient', 'staff', 'system'])
      .withMessage('Invalid cancelledBy value')
  ],
  handleValidationErrors,
  cancelAppointment
);

// Request appointment reminder
router.put(
  '/appointments/:appointmentId/reminder',
  [
    ...createMongoIdValidation('appointmentId'),
    body('reminderTime')
      .optional()
      .isInt({ min: 1, max: 168 })
      .withMessage('Reminder time must be between 1 and 168 hours'),
    body('channels')
      .optional()
      .isObject()
      .withMessage('Channels must be an object'),
    body('channels.email')
      .optional()
      .isBoolean()
      .withMessage('Email channel must be boolean'),
    body('channels.sms')
      .optional()
      .isBoolean()
      .withMessage('SMS channel must be boolean'),
    body('channels.inApp')
      .optional()
      .isBoolean()
      .withMessage('In-app channel must be boolean')
  ],
  handleValidationErrors,
  requestAppointmentReminder
);

export default router;