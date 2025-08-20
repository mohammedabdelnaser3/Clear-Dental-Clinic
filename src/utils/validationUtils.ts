/**
 * Validate email format
 * @param email Email to validate
 * @returns True if email is valid
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number format
 * @param phone Phone number to validate
 * @returns True if phone number is valid
 */
export const isValidPhone = (phone: string): boolean => {
  // This regex allows various phone formats with optional country code
  const phoneRegex = /^\+?[0-9\s()\-.]{10,20}$/;
  return phoneRegex.test(phone);
};

/**
 * Validate password strength
 * @param password Password to validate
 * @returns Object with validation result and message
 */
export const validatePassword = (password: string): { isValid: boolean; message: string } => {
  if (password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters long' };
  }
  
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one uppercase letter' };
  }
  
  if (!/[a-z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one lowercase letter' };
  }
  
  if (!/[0-9]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one number' };
  }
  
  if (!/[^A-Za-z0-9]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one special character' };
  }
  
  return { isValid: true, message: 'Password is strong' };
};

/**
 * Validate date of birth (must be in the past and not too far back)
 * @param dateOfBirth Date of birth to validate
 * @returns Object with validation result and message
 */
export const validateDateOfBirth = (dateOfBirth: Date): { isValid: boolean; message: string } => {
  const today = new Date();
  const minDate = new Date();
  minDate.setFullYear(today.getFullYear() - 120); // Max age 120 years
  
  if (dateOfBirth > today) {
    return { isValid: false, message: 'Date of birth cannot be in the future' };
  }
  
  if (dateOfBirth < minDate) {
    return { isValid: false, message: 'Date of birth is too far in the past' };
  }
  
  return { isValid: true, message: 'Valid date of birth' };
};

/**
 * Validate zip/postal code format
 * @param zipCode Zip code to validate
 * @param country Country code (default: 'US')
 * @returns True if zip code is valid for the country
 */
export const isValidZipCode = (zipCode: string, country: string = 'US'): boolean => {
  // Different regex patterns for different countries
  const zipRegexPatterns: Record<string, RegExp> = {
    US: /^\d{5}(-\d{4})?$/,
    CA: /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/,
    UK: /^[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}$/i,
    // Add more countries as needed
  };
  
  const regex = zipRegexPatterns[country] || zipRegexPatterns.US;
  return regex.test(zipCode);
};

/**
 * Check if a string is empty or only whitespace
 * @param value String to check
 * @returns True if string is empty or only whitespace
 */
export const isEmpty = (value: string | null | undefined): boolean => {
  return value === null || value === undefined || value.trim() === '';
};

/**
 * Validate file size
 * @param fileSize File size in bytes
 * @param maxSize Maximum allowed size in bytes
 * @returns True if file size is valid
 */
export const isValidFileSize = (fileSize: number, maxSize: number): boolean => {
  return fileSize <= maxSize;
};

/**
 * Validate file type
 * @param fileType MIME type of the file
 * @param allowedTypes Array of allowed MIME types
 * @returns True if file type is allowed
 */
export const isValidFileType = (fileType: string, allowedTypes: string[]): boolean => {
  return allowedTypes.includes(fileType);
};