import { Router } from 'express';
import {
  getReminderStats,
  sendAppointmentReminder,
  cancelScheduledReminders,
  rescheduleReminders,
  getReminderConfig,
  updateReminderConfig
} from '../controllers/reminderController';
import { authenticate, staffOrAdmin } from '../middleware/auth';

const router = Router();

// All reminder routes require authentication
router.use(authenticate);

// Get reminder queue statistics (admin/staff only)
router.get('/stats', staffOrAdmin, getReminderStats);

// Send individual appointment reminder (admin/staff only)
router.post('/appointments/:appointmentId/send', staffOrAdmin, sendAppointmentReminder);

// Cancel scheduled reminders for an appointment (admin/staff only)
router.delete('/appointments/:appointmentId/scheduled', staffOrAdmin, cancelScheduledReminders);

// Reschedule reminders for an appointment (admin/staff only)
router.post('/appointments/:appointmentId/reschedule', staffOrAdmin, rescheduleReminders);

// Get reminder configuration for appointment
router.get('/appointments/:appointmentId/config', getReminderConfig);

// Update reminder configuration for appointment (admin/staff only)
router.put('/appointments/:appointmentId/config', staffOrAdmin, updateReminderConfig);

export default router;





