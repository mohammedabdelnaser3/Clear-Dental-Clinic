import Bull from 'bull';
import Redis from 'ioredis';
import { IAppointment } from '../types';
import { sendAppointmentReminderEmail } from './email';
import { sendAppointmentReminderSMS } from './sms';
import mongoose from 'mongoose';
import logger from './logger';

// Redis connection
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  lazyConnect: true,
});

// Job queue for appointment reminders
export const appointmentReminderQueue = new Bull('appointment-reminders', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
  },
  defaultJobOptions: {
    removeOnComplete: 50, // Keep 50 completed jobs for monitoring
    removeOnFail: 100, // Keep 100 failed jobs for debugging
    attempts: 3, // Retry failed jobs up to 3 times
    backoff: {
      type: 'exponential',
      delay: 5000, // Start with 5 second delay
    },
  },
});

// Job data interfaces
interface AppointmentReminderJob {
  appointmentId: string;
  patientId: string;
  reminderType: '24h' | '2h' | '30m' | 'custom';
  customHours?: number;
  channels: {
    email: boolean;
    sms: boolean;
    inApp: boolean;
  };
}

interface DailyReminderBatchJob {
  date: string;
  clinicIds?: string[];
}

// Process appointment reminder jobs
appointmentReminderQueue.process('send-reminder', async (job) => {
  const { appointmentId, patientId, channels } = job.data as AppointmentReminderJob;
  
  try {
    logger.info(`Processing reminder for appointment ${appointmentId}`);
    
    // Fetch appointment with populated data
    const Appointment = mongoose.model('Appointment');
    const Patient = mongoose.model('Patient');
    const User = mongoose.model('User');
    const Clinic = mongoose.model('Clinic');
    const Notification = mongoose.model('Notification');
    
    const appointment = await (Appointment as any).findById(appointmentId);
    if (!appointment) {
      throw new Error(`Appointment ${appointmentId} not found`);
    }
    
    // Check if appointment is still valid for reminders
    if (['cancelled', 'completed', 'no-show'].includes(appointment.status)) {
      logger.info(`Skipping reminder for ${appointmentId} - status: ${appointment.status}`);
      return { skipped: true, reason: `Appointment status is ${appointment.status}` };
    }
    
    // Fetch related data
    const [patient, dentist, clinic] = await Promise.all([
      (Patient as any).findById(appointment.patientId),
      appointment.dentistId ? User.findById(appointment.dentistId) : null,
      (Clinic as any).findById(appointment.clinicId)
    ]);
    
    if (!patient) {
      throw new Error(`Patient ${patientId} not found`);
    }
    
    const results = { email: false, sms: false, inApp: false, errors: [] as any[] };
    
    // Send email reminder
    if (channels.email && patient.email) {
      try {
        await sendAppointmentReminderEmail(
          patient.email,
          patient.fullName || `${patient.firstName} ${patient.lastName}`,
          {
            date: appointment.date.toDateString(),
            time: appointment.timeSlot,
            dentist: dentist ? (dentist.fullName || `${dentist.firstName} ${dentist.lastName}`) : 'Assigned dentist',
            clinic: clinic ? clinic.name : 'Our clinic'
          }
        );
        results.email = true;
        logger.info(`Email reminder sent for appointment ${appointmentId}`);
      } catch (err: any) {
        results.errors.push({ type: 'email', message: err.message });
        logger.error(`Failed to send email reminder for appointment ${appointmentId}: ${err.message}`);
      }
    }
    
    // Send SMS reminder
    if (channels.sms && patient.phone) {
      try {
        await sendAppointmentReminderSMS(
          patient.phone,
          patient.fullName || `${patient.firstName} ${patient.lastName}`,
          {
            date: appointment.date.toDateString(),
            time: appointment.timeSlot,
            dentist: dentist ? (dentist.fullName || `${dentist.firstName} ${dentist.lastName}`) : 'Assigned dentist',
            clinic: clinic ? clinic.name : 'Our clinic'
          }
        );
        results.sms = true;
        logger.info(`SMS reminder sent for appointment ${appointmentId}`);
      } catch (err: any) {
        results.errors.push({ type: 'sms', message: err.message });
        logger.error(`Failed to send SMS reminder for appointment ${appointmentId}: ${err.message}`);
      }
    }
    
    // Create in-app notification
    if (channels.inApp) {
      try {
        await (Notification as any).create({
          userId: patient.userId || patient._id,
          type: 'appointment_reminder',
          title: 'Appointment Reminder',
          message: `You have an appointment scheduled for ${appointment.date.toDateString()} at ${appointment.timeSlot}`,
          appointmentId: appointment._id,
          read: false
        });
        results.inApp = true;
        logger.info(`In-app notification created for appointment ${appointmentId}`);
      } catch (err: any) {
        results.errors.push({ type: 'inApp', message: err.message });
        logger.error(`Failed to create in-app notification for appointment ${appointmentId}: ${err.message}`);
      }
    }
    
    return results;
  } catch (error: any) {
    logger.error(`Failed to process reminder for appointment ${appointmentId}: ${error.message}`);
    throw error;
  }
});

// Process daily reminder batch jobs
appointmentReminderQueue.process('daily-batch', async (job) => {
  const { date, clinicIds } = job.data as DailyReminderBatchJob;
  
  try {
    logger.info(`Processing daily reminder batch for date: ${date}`);
    
    const Appointment = mongoose.model('Appointment');
    const targetDate = new Date(date);
    
    // Build query for appointments needing reminders
    const query: any = {
      date: {
        $gte: new Date(targetDate.toDateString()),
        $lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000)
      },
      status: { $in: ['scheduled', 'confirmed'] },
      'notificationPreferences.enabled': true
    };
    
    if (clinicIds && clinicIds.length > 0) {
      query.clinicId = { $in: clinicIds };
    }
    
    const appointments = await (Appointment as any).find(query);
    let scheduledCount = 0;
    let skippedCount = 0;
    
    for (const appointment of appointments) {
      const notificationPreferences = appointment.notificationPreferences || {
        enabled: true,
        channels: { email: true, sms: true, inApp: true },
        reminderTimes: [24]
      };
      
      if (!notificationPreferences.enabled) {
        skippedCount++;
        continue;
      }
      
      // Schedule reminders based on reminder times
      for (const reminderHours of notificationPreferences.reminderTimes) {
        const appointmentDateTime = new Date(appointment.date);
        const [hours, minutes] = appointment.timeSlot.split(':').map(Number);
        appointmentDateTime.setHours(hours, minutes, 0, 0);
        
        const reminderTime = new Date(appointmentDateTime.getTime() - reminderHours * 60 * 60 * 1000);
        const delay = reminderTime.getTime() - Date.now();
        
        if (delay > 0) {
          await appointmentReminderQueue.add(
            'send-reminder',
            {
              appointmentId: appointment._id.toString(),
              patientId: appointment.patientId.toString(),
              reminderType: reminderHours === 24 ? '24h' : 
                          reminderHours === 2 ? '2h' : 
                          reminderHours === 0.5 ? '30m' : 'custom',
              customHours: reminderHours !== 24 && reminderHours !== 2 && reminderHours !== 0.5 ? reminderHours : undefined,
              channels: notificationPreferences.channels
            },
            {
              delay,
              removeOnComplete: 10,
              removeOnFail: 50
            }
          );
          scheduledCount++;
        }
      }
    }
    
    logger.info(`Daily batch complete: ${scheduledCount} reminders scheduled, ${skippedCount} skipped`);
    return {
      totalAppointments: appointments.length,
      scheduledReminders: scheduledCount,
      skippedAppointments: skippedCount
    };
  } catch (error: any) {
    logger.error(`Failed to process daily reminder batch: ${error.message}`);
    throw error;
  }
});

// Schedule appointment reminders using job queue
export const scheduleAppointmentReminders = async (appointment: IAppointment, patient?: any, dentist?: any, clinic?: any): Promise<void> => {
  try {
    const notificationPreferences = appointment.notificationPreferences;
    if (!notificationPreferences?.enabled) {
      return;
    }
    
    const { reminderTimes = [24], channels = { email: true, sms: true, inApp: true } } = notificationPreferences;
    
    // Get the appointment date and time
    const appointmentDateTime = new Date(appointment.date);
    const [hours, minutes] = appointment.timeSlot.split(':').map(Number);
    appointmentDateTime.setHours(hours, minutes, 0, 0);
    
    // Schedule reminders for each reminder time
    for (const reminderHours of reminderTimes) {
      // Calculate when to send the reminder
      const reminderTime = new Date(appointmentDateTime.getTime() - reminderHours * 60 * 60 * 1000);
      const delay = reminderTime.getTime() - Date.now();
      
      // Only schedule if the reminder time is in the future
      if (delay > 0) {
        await appointmentReminderQueue.add(
          'send-reminder',
          {
            appointmentId: appointment._id.toString(),
            patientId: appointment.patientId.toString(),
            reminderType: reminderHours === 24 ? '24h' : 
                        reminderHours === 2 ? '2h' : 
                        reminderHours === 0.5 ? '30m' : 'custom',
            customHours: reminderHours !== 24 && reminderHours !== 2 && reminderHours !== 0.5 ? reminderHours : undefined,
            channels
          },
          {
            delay,
            removeOnComplete: 10,
            removeOnFail: 50,
            jobId: `reminder-${appointment._id}-${reminderHours}h` // Unique job ID to prevent duplicates
          }
        );
        
        logger.info(`Scheduled reminder for appointment ${appointment._id} in ${reminderHours} hours`);
      }
    }
  } catch (error: any) {
    logger.error(`Failed to schedule reminders for appointment ${appointment._id}: ${error.message}`);
    throw error;
  }
};

// Cancel scheduled reminders for an appointment
export const cancelAppointmentReminders = async (appointmentId: string): Promise<void> => {
  try {
    // Get all jobs and remove those matching the appointment ID
    const jobs = await appointmentReminderQueue.getJobs(['delayed', 'waiting']);
    
    for (const job of jobs) {
      if (job.data.appointmentId === appointmentId) {
        await job.remove();
        logger.info(`Cancelled reminder job ${job.id} for appointment ${appointmentId}`);
      }
    }
  } catch (error: any) {
    logger.error(`Failed to cancel reminders for appointment ${appointmentId}: ${error.message}`);
  }
};

// Schedule daily reminder batch processing
export const scheduleDailyReminderBatch = async (targetDate?: Date, clinicIds?: string[]): Promise<void> => {
  try {
    const date = targetDate || new Date();
    date.setDate(date.getDate() + 1); // Process reminders for next day
    
    await appointmentReminderQueue.add(
      'daily-batch',
      {
        date: date.toISOString(),
        clinicIds
      },
      {
        removeOnComplete: 5,
        removeOnFail: 10,
        jobId: `daily-batch-${date.toISOString().split('T')[0]}` // One batch per day
      }
    );
    
    logger.info(`Scheduled daily reminder batch for ${date.toDateString()}`);
  } catch (error: any) {
    logger.error(`Failed to schedule daily reminder batch: ${error.message}`);
  }
};

// Get queue status and statistics
export const getQueueStats = async () => {
  try {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      appointmentReminderQueue.getJobs(['waiting'], 0, -1),
      appointmentReminderQueue.getJobs(['active'], 0, -1),
      appointmentReminderQueue.getJobs(['completed'], 0, -1),
      appointmentReminderQueue.getJobs(['failed'], 0, -1),
      appointmentReminderQueue.getJobs(['delayed'], 0, -1),
    ]);
    
    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      delayed: delayed.length,
      total: waiting.length + active.length + completed.length + failed.length + delayed.length
    };
  } catch (error: any) {
    logger.error(`Failed to get queue stats: ${error.message}`);
    return null;
  }
};

// Initialize queue monitoring
appointmentReminderQueue.on('completed', (job, result) => {
  logger.info(`Job ${job.id} completed with result:`, result);
});

appointmentReminderQueue.on('failed', (job, err) => {
  logger.error(`Job ${job.id} failed:`, err.message);
});

appointmentReminderQueue.on('stalled', (job) => {
  logger.warn(`Job ${job.id} stalled`);
});

export default appointmentReminderQueue;





