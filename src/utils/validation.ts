/**
 * Validation utility functions for form inputs
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates email format
 * @param email - Email address to validate
 * @returns ValidationResult with isValid flag and optional error message
 */
export const validateEmail = (email: string): ValidationResult => {
  if (!email || email.trim() === '') {
    return { isValid: false, error: 'Email is required' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }

  return { isValid: true };
};

/**
 * Validates phone number format
 * Accepts various formats: +1234567890, (123) 456-7890, 123-456-7890, etc.
 * @param phone - Phone number to validate
 * @returns ValidationResult with isValid flag and optional error message
 */
export const validatePhone = (phone: string): ValidationResult => {
  if (!phone || phone.trim() === '') {
    return { isValid: true }; // Phone is optional in most cases
  }

  // Remove all non-digit characters for validation
  const digitsOnly = phone.replace(/\D/g, '');
  
  // Check if it has at least 10 digits (minimum for most phone numbers)
  if (digitsOnly.length < 10) {
    return { isValid: false, error: 'Phone number must have at least 10 digits' };
  }

  // Check if it has too many digits (max 15 for international numbers)
  if (digitsOnly.length > 15) {
    return { isValid: false, error: 'Phone number is too long' };
  }

  return { isValid: true };
};

/**
 * Validates required field
 * @param value - Value to validate
 * @param fieldName - Name of the field for error message
 * @returns ValidationResult with isValid flag and optional error message
 */
export const validateRequired = (value: string, fieldName: string): ValidationResult => {
  if (!value || value.trim() === '') {
    return { isValid: false, error: `${fieldName} is required` };
  }

  return { isValid: true };
};

/**
 * Validates password strength
 * @param password - Password to validate
 * @returns ValidationResult with isValid flag and optional error message
 */
export const validatePassword = (password: string): ValidationResult => {
  if (!password || password.trim() === '') {
    return { isValid: false, error: 'Password is required' };
  }

  if (password.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters long' };
  }

  return { isValid: true };
};

/**
 * Validates that two passwords match
 * @param password - First password
 * @param confirmPassword - Confirmation password
 * @returns ValidationResult with isValid flag and optional error message
 */
export const validatePasswordMatch = (password: string, confirmPassword: string): ValidationResult => {
  if (password !== confirmPassword) {
    return { isValid: false, error: 'Passwords do not match' };
  }

  return { isValid: true };
};

/**
 * Validates date format and ensures it's not in the future
 * @param date - Date string to validate
 * @param fieldName - Name of the field for error message
 * @returns ValidationResult with isValid flag and optional error message
 */
export const validateDate = (date: string, fieldName: string = 'Date'): ValidationResult => {
  if (!date || date.trim() === '') {
    return { isValid: true }; // Date is optional in most cases
  }

  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) {
    return { isValid: false, error: `${fieldName} is not a valid date` };
  }

  // Check if date is in the future (for date of birth)
  if (fieldName.toLowerCase().includes('birth') && dateObj > new Date()) {
    return { isValid: false, error: 'Date of birth cannot be in the future' };
  }

  return { isValid: true };
};

/**
 * Validates ZIP/postal code format
 * @param zipCode - ZIP code to validate
 * @returns ValidationResult with isValid flag and optional error message
 */
export const validateZipCode = (zipCode: string): ValidationResult => {
  if (!zipCode || zipCode.trim() === '') {
    return { isValid: true }; // ZIP code is optional
  }

  // Accept various formats: 12345, 12345-6789, A1A 1A1 (Canadian), etc.
  const zipRegex = /^[A-Za-z0-9][A-Za-z0-9\s-]{2,10}$/;
  if (!zipRegex.test(zipCode)) {
    return { isValid: false, error: 'Please enter a valid ZIP/postal code' };
  }

  return { isValid: true };
};
