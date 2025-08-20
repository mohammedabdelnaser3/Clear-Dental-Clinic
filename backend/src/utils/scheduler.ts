import mongoose from 'mongoose';
import { IAppointment } from '../types';
import { sendAppointmentReminderEmail } from './email';
import { sendAppointmentReminderSMS } from './sms';
import logger from './logger';

// In-memory storage for scheduled reminders
// In a production environment, this should be replaced with a persistent job queue like Bull or Agenda
const scheduledReminders: Map<string, NodeJS.Timeout> = new Map();

/**
 * Schedule reminders for an appointment based on notification preferences
 * @param appointment The appointment to schedule reminders for
 */
export const scheduleAppointmentReminders = async (appointment: IAppointment, patient?: any, dentist?: any, clinic?: any): Promise<void> => {
  try {
    // Check if notification preferences exist and are enabled
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
      const now = new Date();
      
      // Only schedule if the reminder time is in the future
      if (reminderTime > now) {
        const timeoutId = setTimeout(async () => {
          try {
            // Send reminders based on enabled channels
            const notificationPromises = [];
            
            // We need to fetch the patient, dentist, and clinic data for the reminder
            try {
              // In a real implementation, we would fetch these from the database
              // For now, we'll use the data passed to the function if available
              const patientData = patient || await mongoose.model('Patient').findById(appointment.patientId);
              const dentistData = dentist || await mongoose.model('User').findById(appointment.dentistId);
              const clinicData = clinic || await mongoose.model('Clinic').findById(appointment.clinicId);
              
              // Send email reminder if enabled
              if (channels.email && patientData.email) {
                notificationPromises.push(
                  sendAppointmentReminderEmail(
                    patientData.email,
                    patientData.fullName || `${patientData.firstName} ${patientData.lastName}`,
                    {
                      date: appointment.date.toDateString(),
                      time: appointment.timeSlot,
                      dentist: dentistData ? (dentistData.fullName || `${dentistData.firstName} ${dentistData.lastName}`) : 'Assigned dentist',
                      clinic: clinicData ? clinicData.name : 'Our clinic'
                    }
                  ).catch((err: any) => logger.error(`Failed to send reminder email for appointment ${appointment._id}: ${err.message}`))
                );
              }
              
              // Send SMS reminder if enabled
              if (channels.sms && patientData.phone) {
                notificationPromises.push(
                  sendAppointmentReminderSMS(
                    patientData.phone,
                    patientData.fullName || `${patientData.firstName} ${patientData.lastName}`,
                    {
                      date: appointment.date.toDateString(),
                      time: appointment.timeSlot,
                      dentist: dentistData ? (dentistData.fullName || `${dentistData.firstName} ${dentistData.lastName}`) : 'Assigned dentist',
                      clinic: clinicData ? clinicData.name : 'Our clinic'
                    }
                  ).catch((err: any) => logger.error(`Failed to send reminder SMS for appointment ${appointment._id}: ${err.message}`))
                );
              }
            } catch (error: any) {
              logger.error(`Failed to fetch data for appointment reminder ${appointment._id}: ${error?.message || 'Unknown error'}`);
            }
            
            // Wait for all notifications to be sent
            await Promise.allSettled(notificationPromises);
            
            // Remove the scheduled reminder from the map
            scheduledReminders.delete(getReminderKey(appointment._id.toString(), reminderHours));
            
            logger.info(`Sent ${reminderHours}-hour reminder for appointment ${appointment._id}`);
          } catch (error: any) {
            logger.error(`Error processing reminder for appointment ${appointment._id}: ${error?.message || 'Unknown error'}`);
          }
        }, reminderTime.getTime() - now.getTime());
        
        // Store the timeout ID for potential cancellation
        const reminderKey = getReminderKey(appointment._id.toString(), reminderHours);
        scheduledReminders.set(reminderKey, timeoutId);
        
        logger.info(`Scheduled ${reminderHours}-hour reminder for appointment ${appointment._id} at ${reminderTime.toISOString()}`);
      } else {
        logger.info(`Skipped scheduling ${reminderHours}-hour reminder for appointment ${appointment._id} as the reminder time has passed`);
      }
    }
  } catch (error: any) {
    logger.error(`Failed to schedule reminders for appointment ${appointment._id}: ${error?.message || 'Unknown error'}`);
  }
};

/**
 * Cancel all scheduled reminders for an appointment
 * @param appointmentId The ID of the appointment
 */
export const cancelAppointmentReminders = (appointmentId: string): void => {
  try {
    // Find all reminders for this appointment and clear them
    for (const [key, timeoutId] of scheduledReminders.entries()) {
      if (key.startsWith(`${appointmentId}::`)) {
        clearTimeout(timeoutId);
        scheduledReminders.delete(key);
        logger.info(`Cancelled reminder ${key} for appointment ${appointmentId}`);
      }
    }
  } catch (error: any) {
    logger.error(`Failed to cancel reminders for appointment ${appointmentId}: ${error?.message || 'Unknown error'}`);
  }
};

/**
 * Generate a unique key for storing reminder timeouts
 * @param appointmentId The appointment ID
 * @param reminderHours Hours before the appointment to send the reminder
 * @returns A unique key string
 */
const getReminderKey = (appointmentId: string, reminderHours: number): string => {
  return `${appointmentId}::${reminderHours}`;
};