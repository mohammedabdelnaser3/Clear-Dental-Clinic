// No validation utilities needed for appointment validation
import type { TFunction } from 'i18next';

export interface AppointmentFormData {
  patientId: string;
  service: string;
  date: string;
  timeSlot: string;
  notes: string;
  emergency: boolean;
  patientSearch?: string;
  clinicId?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Validates appointment form data with detailed error messages
 * @param data The appointment form data to validate
 * @param t Translation function
 * @param currentStep Current form step (optional)
 * @returns Validation result with isValid flag and error messages
 */
export const validateAppointmentForm = (
  data: AppointmentFormData,
  t: TFunction,
  currentStep?: string
): ValidationResult => {
  const errors: Record<string, string> = {};
  
  // Validate based on current step or validate all fields if no step provided
  if (!currentStep || currentStep === 'patient') {
    if (!data.patientId) {
      errors.patientId = t('appointmentForm.error_selectPatient');
    }
  }
  
  if (!currentStep || currentStep === 'service') {
    if (!data.service) {
      errors.service = t('appointmentForm.error_selectService');
    }
    // Validate clinic selection for multi-branch system
    if (!data.clinicId) {
      errors.clinicId = t('appointmentForm.error_clinicRequired') || 'Please select a clinic';
    }
  }
  
  if (!currentStep || currentStep === 'datetime') {
    if (!data.date) {
      errors.date = t('appointmentForm.error_selectDate');
    } else {
      // Check if date is in the past
      const today = new Date().toISOString().split('T')[0];
      if (data.date < today) {
        errors.date = t('appointmentForm.error_pastDate');
      }
    }
    
    if (!data.timeSlot) {
      errors.timeSlot = t('appointmentForm.error_selectTime');
    }
  }
  
  // Notes validation is optional
  if (data.notes && data.notes.length > 500) {
    errors.notes = t('appointmentForm.error_notesTooLong');
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Validates time slot availability with the server
 * @param appointmentService The appointment service instance
 * @param data The appointment data to validate
 * @param clinicId The clinic ID
 * @param appointmentId Optional appointment ID to exclude from conflict check
 * @returns Promise resolving to validation result
 */
export const validateTimeSlotAvailability = async (
  appointmentService: any,
  data: { date: string; timeSlot: string; dentistId?: string },
  clinicId: string,
  appointmentId?: string,
  fallbackDentistId?: string
): Promise<ValidationResult> => {
  try {
    // Validate required parameters before making the API call
    if (!data.date || !data.timeSlot || !clinicId) {
      return {
        isValid: false,
        errors: { timeSlot: 'Missing required information for availability check' }
      };
    }
    
    // Use dentistId from data, or fallback dentistId if provided
    const dentistId = data.dentistId || fallbackDentistId;
    
    // The improved checkTimeSlotConflict now returns a boolean
    const hasConflict = await appointmentService.checkTimeSlotConflict({
      date: data.date,
      timeSlot: data.timeSlot,
      clinicId: clinicId,
      dentistId: dentistId, // Include dentistId to prevent 400 error
      excludeAppointmentId: appointmentId
    });

    if (hasConflict) {
      return {
        isValid: false,
        errors: { timeSlot: 'This time slot is no longer available' }
      };
    }
    
    return { isValid: true, errors: {} };
  } catch (error) {
    console.error('Error validating time slot:', error);
    return {
      isValid: false,
      errors: { timeSlot: 'Error checking time slot availability' }
    };
  }
};