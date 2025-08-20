// SMS service utility for sending appointment-related SMS messages
// This is a placeholder implementation - replace with actual SMS service (Twilio, AWS SNS, etc.)

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
    
    // Placeholder implementation - replace with actual SMS service
    console.log(`SMS would be sent to ${phoneNumber}: ${message}`);
    
    // Example implementation with Twilio:
    // const client = twilio(accountSid, authToken);
    // await client.messages.create({
    //   body: message,
    //   from: process.env.TWILIO_PHONE_NUMBER,
    //   to: phoneNumber
    // });
    
    return Promise.resolve();
  } catch (error) {
    console.error('Failed to send confirmation SMS:', error);
    throw new Error(`Failed to send SMS to ${phoneNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Send appointment reminder SMS
 * @param phoneNumber Patient's phone number
 * @param patientName Patient's name
 * @param appointmentData Appointment details
 */
export const sendAppointmentReminderSMS = async (
  phoneNumber: string,
  patientName: string,
  appointmentData: SMSData
): Promise<void> => {
  try {
    const message = `Reminder: ${patientName}, you have an appointment on ${appointmentData.date} at ${appointmentData.time}${appointmentData.dentist ? ` with ${appointmentData.dentist}` : ''}. Contact: ${appointmentData.contactPhone || 'clinic'}`;
    
    // Placeholder implementation - replace with actual SMS service
    console.log(`SMS reminder would be sent to ${phoneNumber}: ${message}`);
    
    return Promise.resolve();
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
    const message = `${patientName}, your appointment for ${appointmentData.date} at ${appointmentData.time} has been cancelled${appointmentData.reason ? `: ${appointmentData.reason}` : ''}. Contact clinic for assistance.`;
    
    // Placeholder implementation - replace with actual SMS service
    console.log(`SMS cancellation would be sent to ${phoneNumber}: ${message}`);
    
    return Promise.resolve();
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
    const message = `Urgent: ${staffName}, emergency appointment scheduled for ${appointmentData.date} at ${appointmentData.time}. Please check your schedule.`;
    
    // Placeholder implementation - replace with actual SMS service
    console.log(`Urgent SMS would be sent to ${phoneNumber}: ${message}`);
    
    return Promise.resolve();
  } catch (error) {
    console.error('Failed to send urgent SMS:', error);
    throw new Error(`Failed to send urgent SMS to ${phoneNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
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
