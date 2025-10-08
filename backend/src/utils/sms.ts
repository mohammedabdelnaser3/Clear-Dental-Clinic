/**
 * SMS Service with Twilio Integration
 * 
 * Provides SMS functionality for appointment notifications, reminders, and alerts.
 * Supports customizable templates and graceful fallback when Twilio is not configured.
 */

import twilio from 'twilio';

interface SMSData {
  date: string;
  time: string;
  dentist?: string;
  clinic?: string;
  service?: string;
  duration?: string;
  notes?: string;
  contactPhone?: string;
  reason?: string;
}

// Twilio configuration
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || '';
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || '';
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER || '';
const TWILIO_ENABLED = !!(TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_PHONE_NUMBER);

// Initialize Twilio client if credentials are provided
let twilioClient: ReturnType<typeof twilio> | null = null;
if (TWILIO_ENABLED) {
  try {
    twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    console.log('[SMS] Twilio client initialized successfully');
  } catch (error) {
    console.error('[SMS] Failed to initialize Twilio client:', error);
  }
}

/**
 * Core SMS sending function with Twilio
 */
const sendSMS = async (to: string, message: string): Promise<boolean> => {
  const formattedPhone = formatPhoneNumber(to);
  
  if (!validatePhoneNumber(formattedPhone)) {
    console.error(`[SMS] Invalid phone number: ${to}`);
    return false;
  }

  if (!TWILIO_ENABLED || !twilioClient) {
    console.log(`[SMS] Twilio not configured. Would send to ${formattedPhone}: ${message}`);
    return true; // Return true in development mode
  }

  try {
    const result = await twilioClient.messages.create({
      body: message,
      from: TWILIO_PHONE_NUMBER,
      to: formattedPhone
    });
    
    console.log(`[SMS] Sent successfully to ${formattedPhone}. SID: ${result.sid}`);
    return true;
  } catch (error: any) {
    console.error(`[SMS] Failed to send to ${formattedPhone}:`, error.message);
    return false;
  }
};

/**
 * Send appointment confirmation SMS
 * @param phoneNumber Patient's phone number
 * @param patientName Patient's name
 * @param appointmentData Appointment details
 */
export const sendAppointmentConfirmationSMS = async (
  phoneNumber: string,
  patientName: string,
  appointmentData: SMSData
): Promise<void> => {
  try {
    const message = `Hi ${patientName}, your appointment is confirmed for ${appointmentData.date} at ${appointmentData.time}${appointmentData.dentist ? ` with ${appointmentData.dentist}` : ''}. Contact: ${appointmentData.contactPhone || 'clinic'}`;
    
    await sendSMS(phoneNumber, message);
  } catch (error) {
    console.error('Failed to send confirmation SMS:', error);
    throw new Error(`Failed to send SMS to ${phoneNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Send appointment reminder SMS with customizable template
 * @param phoneNumber Patient's phone number
 * @param patientName Patient's name
 * @param appointmentData Appointment details
 * @param reminderType Type of reminder (24h, 1h, 15min)
 */
export const sendAppointmentReminderSMS = async (
  phoneNumber: string,
  patientName: string,
  appointmentData: SMSData,
  reminderType?: '24h' | '1h' | '15min'
): Promise<void> => {
  try {
    let message = '';
    
    switch (reminderType) {
      case '24h':
        message = `Reminder: ${patientName}, you have an appointment TOMORROW at ${appointmentData.time}${appointmentData.dentist ? ` with ${appointmentData.dentist}` : ''}${appointmentData.clinic ? ` at ${appointmentData.clinic}` : ''}. Reply CONFIRM or call ${appointmentData.contactPhone || 'clinic'}.`;
        break;
      case '1h':
        message = `Reminder: ${patientName}, your appointment is in 1 HOUR at ${appointmentData.time}${appointmentData.dentist ? ` with ${appointmentData.dentist}` : ''}${appointmentData.clinic ? ` at ${appointmentData.clinic}` : ''}.`;
        break;
      case '15min':
        message = `Reminder: ${patientName}, your appointment is in 15 MINUTES at ${appointmentData.time}${appointmentData.dentist ? ` with ${appointmentData.dentist}` : ''}. Please check in at reception.`;
        break;
      default:
        message = `Reminder: ${patientName}, you have an appointment on ${appointmentData.date} at ${appointmentData.time}${appointmentData.dentist ? ` with ${appointmentData.dentist}` : ''}. Contact: ${appointmentData.contactPhone || 'clinic'}`;
    }
    
    await sendSMS(phoneNumber, message);
  } catch (error) {
    console.error('Failed to send reminder SMS:', error);
    throw new Error(`Failed to send reminder SMS to ${phoneNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Send appointment cancellation SMS
 * @param phoneNumber Patient's phone number
 * @param patientName Patient's name
 * @param appointmentData Appointment details
 */
export const sendAppointmentCancellationSMS = async (
  phoneNumber: string,
  patientName: string,
  appointmentData: SMSData
): Promise<void> => {
  try {
    const message = `${patientName}, your appointment for ${appointmentData.date} at ${appointmentData.time} has been cancelled${appointmentData.reason ? `: ${appointmentData.reason}` : ''}. Please call ${appointmentData.contactPhone || 'clinic'} to reschedule.`;
    
    await sendSMS(phoneNumber, message);
  } catch (error) {
    console.error('Failed to send cancellation SMS:', error);
    throw new Error(`Failed to send cancellation SMS to ${phoneNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Send urgent appointment notification SMS to staff
 * @param phoneNumber Staff member's phone number
 * @param staffName Staff member's name
 * @param appointmentData Appointment details
 */
export const sendUrgentAppointmentSMS = async (
  phoneNumber: string,
  staffName: string,
  appointmentData: SMSData
): Promise<void> => {
  try {
    const message = `Urgent: ${staffName}, emergency appointment scheduled for ${appointmentData.date} at ${appointmentData.time}. Please check your schedule immediately.`;
    
    await sendSMS(phoneNumber, message);
  } catch (error) {
    console.error('Failed to send urgent SMS:', error);
    throw new Error(`Failed to send urgent SMS to ${phoneNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Send custom SMS message
 * @param phoneNumber Recipient's phone number
 * @param message Custom message content
 */
export const sendCustomSMS = async (phoneNumber: string, message: string): Promise<boolean> => {
  try {
    return await sendSMS(phoneNumber, message);
  } catch (error) {
    console.error('Failed to send custom SMS:', error);
    return false;
  }
};

/**
 * Check if Twilio is enabled and configured
 */
export const isTwilioEnabled = (): boolean => {
  return TWILIO_ENABLED;
};

/**
 * Validate phone number format
 * @param phoneNumber Phone number to validate
 * @returns boolean indicating if phone number is valid
 */
export const validatePhoneNumber = (phoneNumber: string): boolean => {
  // Basic phone number validation - can be enhanced based on requirements
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phoneNumber.replace(/\D/g, ''));
};

/**
 * Format phone number for SMS service
 * @param phoneNumber Raw phone number
 * @returns Formatted phone number
 */
export const formatPhoneNumber = (phoneNumber: string): string => {
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Add country code if not present (assuming US numbers)
  if (cleaned.length === 10) {
    return `+1${cleaned}`;
  }
  
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+${cleaned}`;
  }
  
  return phoneNumber; // Return as-is if already formatted or international
};
