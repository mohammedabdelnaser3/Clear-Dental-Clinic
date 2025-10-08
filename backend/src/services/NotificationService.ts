import { Appointment, Patient, Prescription, Notification } from '../models';
import { createAndSendNotification } from '../utils/notificationHelpers';
import { scheduleJob, cancelJob } from 'node-schedule';

export class NotificationService {
  private static instance: NotificationService;
  private scheduledJobs: Map<string, any> = new Map();

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Schedule appointment reminder
  async scheduleAppointmentReminder(appointmentId: string) {
    try {
      const appointment = await (Appointment as any).findById(appointmentId)
        .populate('patientId', 'firstName lastName userId')
        .populate('dentistId', 'firstName lastName')
        .populate('clinicId', 'name address phone');

      if (!appointment || !appointment.patientId.userId) {
        console.log(`Appointment not found or patient has no user account: ${appointmentId}`);
        return;
      }

      const appointmentDate = new Date(appointment.date);
      const [hours, minutes] = appointment.timeSlot.split(':').map(Number);
      appointmentDate.setHours(hours, minutes, 0, 0);

      // Schedule reminders based on notification preferences
      const reminderTimes = appointment.notificationPreferences.reminderTimes || [24];
      
      reminderTimes.forEach((hoursBeforeAppointment: number) => {
        const reminderTime = new Date(appointmentDate.getTime() - (hoursBeforeAppointment * 60 * 60 * 1000));
        
        // Only schedule if reminder time is in the future
        if (reminderTime > new Date()) {
          const jobName = `appointment_reminder_${appointmentId}_${hoursBeforeAppointment}h`;
          
          const job = scheduleJob(jobName, reminderTime, async () => {
            await this.sendAppointmentReminder(appointmentId, hoursBeforeAppointment);
            this.scheduledJobs.delete(jobName);
          });

          this.scheduledJobs.set(jobName, job);
          console.log(`Scheduled appointment reminder for ${appointment.patientId.firstName} ${appointment.patientId.lastName} - ${hoursBeforeAppointment}h before appointment`);
        }
      });

    } catch (error) {
      console.error('Error scheduling appointment reminder:', error);
    }
  }

  // Send appointment reminder notification
  async sendAppointmentReminder(appointmentId: string, hoursBeforeAppointment: number) {
    try {
      const appointment = await (Appointment as any).findById(appointmentId)
        .populate('patientId', 'firstName lastName userId')
        .populate('dentistId', 'firstName lastName specialization')
        .populate('clinicId', 'name address phone');

      if (!appointment || !appointment.patientId.userId) {
        console.log(`Appointment not found for reminder: ${appointmentId}`);
        return;
      }

      let timeText = '';
      if (hoursBeforeAppointment === 24) {
        timeText = 'tomorrow';
      } else if (hoursBeforeAppointment === 1) {
        timeText = 'in 1 hour';
      } else if (hoursBeforeAppointment < 24) {
        timeText = `in ${hoursBeforeAppointment} hours`;
      } else {
        timeText = `in ${Math.floor(hoursBeforeAppointment / 24)} days`;
      }

      const dentistInfo = appointment.dentistId ? 
        ` with Dr. ${appointment.dentistId.firstName} ${appointment.dentistId.lastName}` : 
        '';

      await createAndSendNotification({
        userId: appointment.patientId.userId.toString(),
        title: 'Upcoming Appointment Reminder',
        message: `Your appointment${dentistInfo} is scheduled for ${timeText} at ${appointment.timeSlot} on ${appointment.date.toDateString()}`,
        type: 'appointment_reminder',
        link: `/appointments/${appointment._id}`,
        metadata: {
          appointmentId: appointment._id,
          clinicName: appointment.clinicId.name,
          clinicAddress: appointment.clinicId.address,
          clinicPhone: appointment.clinicId.phone,
          date: appointment.date,
          time: appointment.timeSlot,
          serviceType: appointment.serviceType,
          dentistName: appointment.dentistId ? 
            `${appointment.dentistId.firstName} ${appointment.dentistId.lastName}` : 
            'To be assigned',
          hoursUntilAppointment: hoursBeforeAppointment
        }
      });

    } catch (error) {
      console.error('Error sending appointment reminder:', error);
    }
  }

  // Cancel appointment reminders
  async cancelAppointmentReminders(appointmentId: string) {
    try {
      // Find and cancel all scheduled jobs for this appointment
      const jobsToCancel = Array.from(this.scheduledJobs.keys())
        .filter(jobName => jobName.startsWith(`appointment_reminder_${appointmentId}`));

      jobsToCancel.forEach(jobName => {
        const job = this.scheduledJobs.get(jobName);
        if (job) {
          job.cancel();
          this.scheduledJobs.delete(jobName);
          console.log(`Cancelled appointment reminder job: ${jobName}`);
        }
      });

    } catch (error) {
      console.error('Error cancelling appointment reminders:', error);
    }
  }

  // Schedule medication reminders for a patient
  async scheduleMedicationReminders(patientId: string) {
    try {
      const patient = await (Patient as any).findById(patientId)
        .populate('medicationHistory.prescribedBy', 'firstName lastName');

      if (!patient || !patient.userId) {
        console.log(`Patient not found or has no user account: ${patientId}`);
        return;
      }

      // Get active medications
      const activeMedications = (patient as any).getActiveMedications();
      
      // Also get active prescriptions
      const activePrescriptions = await (Prescription as any).findActive(patientId);

      // Clear existing medication reminders for this patient
      await this.cancelMedicationReminders(patientId);

      // Schedule reminders for medications in history
      activeMedications.forEach((medication: any) => {
        if (medication.frequency) {
          this.scheduleMedicationReminderTimes(patientId, medication, 'history');
        }
      });

      // Schedule reminders for prescription medications
      activePrescriptions.forEach((prescription: any) => {
        prescription.medications.forEach((med: any) => {
          if (med.frequency) {
            this.scheduleMedicationReminderTimes(patientId, {
              ...med,
              prescriptionId: prescription._id,
              medicationName: med.medicationId.name
            }, 'prescription');
          }
        });
      });

    } catch (error) {
      console.error('Error scheduling medication reminders:', error);
    }
  }

  // Schedule individual medication reminder times
  private scheduleMedicationReminderTimes(patientId: string, medication: any, source: 'history' | 'prescription') {
    const times = this.parseFrequencyToTimes(medication.frequency);
    
    times.forEach((time: string) => {
      const jobName = `medication_reminder_${patientId}_${medication._id || medication.medicationId}_${time}`;
      
      // Schedule daily recurring job at the specified time
      const job = scheduleJob(jobName, `0 ${time.split(':')[1]} ${time.split(':')[0]} * * *`, async () => {
        await this.sendMedicationReminder(patientId, medication, time, source);
      });

      if (job) {
        this.scheduledJobs.set(jobName, job);
        console.log(`Scheduled medication reminder for patient ${patientId}: ${medication.medicationName} at ${time}`);
      }
    });
  }

  // Send medication reminder notification
  async sendMedicationReminder(patientId: string, medication: any, time: string, source: 'history' | 'prescription') {
    try {
      const patient = await (Patient as any).findById(patientId);
      if (!patient || !patient.userId) {
        console.log(`Patient not found for medication reminder: ${patientId}`);
        return;
      }

      const medicationName = medication.medicationName || medication.name;
      const dosageInfo = medication.dosage ? ` (${medication.dosage})` : '';

      await createAndSendNotification({
        userId: patient.userId.toString(),
        title: 'Medication Reminder',
        message: `Time to take your medication: ${medicationName}${dosageInfo}`,
        type: 'general',
        link: source === 'prescription' ? 
          `/prescriptions/${medication.prescriptionId}` : 
          `/medical-record/medications`,
        metadata: {
          patientId: patientId,
          medicationName: medicationName,
          dosage: medication.dosage,
          time: time,
          frequency: medication.frequency,
          instructions: medication.instructions,
          source: source,
          ...(medication.prescriptionId && { prescriptionId: medication.prescriptionId })
        }
      });

    } catch (error) {
      console.error('Error sending medication reminder:', error);
    }
  }

  // Cancel medication reminders for a patient
  async cancelMedicationReminders(patientId: string) {
    try {
      const jobsToCancel = Array.from(this.scheduledJobs.keys())
        .filter(jobName => jobName.startsWith(`medication_reminder_${patientId}`));

      jobsToCancel.forEach(jobName => {
        const job = this.scheduledJobs.get(jobName);
        if (job) {
          job.cancel();
          this.scheduledJobs.delete(jobName);
        }
      });

      console.log(`Cancelled ${jobsToCancel.length} medication reminder jobs for patient ${patientId}`);

    } catch (error) {
      console.error('Error cancelling medication reminders:', error);
    }
  }

  // Parse frequency string to specific times
  private parseFrequencyToTimes(frequency: string): string[] {
    const times: string[] = [];
    const freq = frequency.toLowerCase();
    
    if (freq.includes('once') || freq.includes('1 time') || freq.includes('daily')) {
      times.push('08:00');
    } else if (freq.includes('twice') || freq.includes('2 times') || freq.includes('bid')) {
      times.push('08:00', '20:00');
    } else if (freq.includes('three times') || freq.includes('3 times') || freq.includes('tid')) {
      times.push('08:00', '14:00', '20:00');
    } else if (freq.includes('four times') || freq.includes('4 times') || freq.includes('qid')) {
      times.push('08:00', '12:00', '16:00', '20:00');
    } else if (freq.includes('every 8 hours')) {
      times.push('08:00', '16:00', '00:00');
    } else if (freq.includes('every 6 hours')) {
      times.push('06:00', '12:00', '18:00', '00:00');
    } else if (freq.includes('every 4 hours')) {
      times.push('08:00', '12:00', '16:00', '20:00', '00:00', '04:00');
    } else {
      times.push('08:00'); // Default to morning
    }
    
    return times;
  }

  // Send notification when appointment is confirmed
  async sendAppointmentConfirmation(appointmentId: string) {
    try {
      const appointment = await (Appointment as any).findById(appointmentId)
        .populate('patientId', 'firstName lastName userId')
        .populate('dentistId', 'firstName lastName specialization')
        .populate('clinicId', 'name address phone');

      if (!appointment || !appointment.patientId.userId) {
        return;
      }

      const dentistInfo = appointment.dentistId ? 
        ` with Dr. ${appointment.dentistId.firstName} ${appointment.dentistId.lastName}` : 
        '';

      await createAndSendNotification({
        userId: appointment.patientId.userId.toString(),
        title: 'Appointment Confirmed',
        message: `Your appointment${dentistInfo} has been confirmed for ${appointment.date.toDateString()} at ${appointment.timeSlot}`,
        type: 'appointment_confirmation',
        link: `/appointments/${appointment._id}`,
        metadata: {
          appointmentId: appointment._id,
          clinicName: appointment.clinicId.name,
          date: appointment.date,
          time: appointment.timeSlot,
          serviceType: appointment.serviceType
        }
      });

      // Schedule reminders for this appointment
      await this.scheduleAppointmentReminder(appointmentId);

    } catch (error) {
      console.error('Error sending appointment confirmation:', error);
    }
  }

  // Clean up expired jobs
  async cleanupExpiredJobs() {
    try {
      const now = new Date();
      const jobsToRemove: string[] = [];

      this.scheduledJobs.forEach((job, jobName) => {
        if (job.nextInvocation() === null || job.nextInvocation() < now) {
          job.cancel();
          jobsToRemove.push(jobName);
        }
      });

      jobsToRemove.forEach(jobName => {
        this.scheduledJobs.delete(jobName);
      });

      console.log(`Cleaned up ${jobsToRemove.length} expired notification jobs`);

    } catch (error) {
      console.error('Error cleaning up expired jobs:', error);
    }
  }

  // Get active scheduled jobs count
  getActiveJobsCount(): number {
    return this.scheduledJobs.size;
  }

  // Get scheduled jobs info for debugging
  getScheduledJobsInfo(): any[] {
    const jobs: any[] = [];
    this.scheduledJobs.forEach((job, jobName) => {
      jobs.push({
        name: jobName,
        nextRun: job.nextInvocation()?.toISOString(),
        type: jobName.startsWith('appointment_') ? 'appointment' : 'medication'
      });
    });
    return jobs;
  }
}
