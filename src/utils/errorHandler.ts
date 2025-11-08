/**
 * Centralized error handling utility
 * Provides consistent error handling across the application
 */

import toast from 'react-hot-toast';

export interface ErrorHandlerOptions {
  showToast?: boolean;
  logError?: boolean;
  redirectOnAuth?: boolean;
  customMessage?: string;
}

export interface ErrorDetails {
  message: string;
  status?: number;
  code?: string;
  shouldRedirect?: boolean;
}

/**
 * Extract user-friendly error message from error object
 */
export const getErrorMessage = (error: any, defaultMessage: string = 'An error occurred'): string => {
  if (!error) return defaultMessage;
  
  // Check for response error message
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  
  // Check for error message
  if (error.message) {
    return error.message;
  }
  
  // Check for string error
  if (typeof error === 'string') {
    return error;
  }
  
  return defaultMessage;
};

/**
 * Get error details including status code and error code
 */
export const getErrorDetails = (error: any): ErrorDetails => {
  const status = error.response?.status;
  const code = error.code || error.response?.data?.code;
  const message = getErrorMessage(error);
  
  // Determine if we should redirect based on error type
  const shouldRedirect = status === 401 || status === 403;
  
  return {
    message,
    status,
    code,
    shouldRedirect
  };
};

/**
 * Handle API errors with consistent behavior
 */
export const handleApiError = (
  error: any,
  options: ErrorHandlerOptions = {}
): ErrorDetails => {
  const {
    showToast = true,
    logError = true,
    redirectOnAuth = true,
    customMessage
  } = options;
  
  const details = getErrorDetails(error);
  const errorMessage = customMessage || details.message;
  
  // Log error for debugging
  if (logError) {
    console.error('API Error:', {
      message: details.message,
      status: details.status,
      code: details.code,
      error
    });
  }
  
  // Handle specific error cases
  if (details.status === 401) {
    const authMessage = 'Your session has expired. Please log in again.';
    if (showToast) {
      toast.error(authMessage);
    }
    
    if (redirectOnAuth) {
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    }
    
    return { ...details, message: authMessage };
  }
  
  if (details.status === 403) {
    const permissionMessage = 'You do not have permission to perform this action.';
    if (showToast) {
      toast.error(permissionMessage);
    }
    return { ...details, message: permissionMessage };
  }
  
  if (details.status === 404) {
    const notFoundMessage = 'The requested resource was not found.';
    if (showToast) {
      toast.error(customMessage || notFoundMessage);
    }
    return { ...details, message: customMessage || notFoundMessage };
  }
  
  if (details.status === 422) {
    const validationMessage = 'Invalid data provided. Please check your inputs.';
    if (showToast) {
      toast.error(customMessage || validationMessage);
    }
    return { ...details, message: customMessage || validationMessage };
  }
  
  if (details.status === 413) {
    const sizeMessage = 'The file is too large. Please upload a smaller file.';
    if (showToast) {
      toast.error(sizeMessage);
    }
    return { ...details, message: sizeMessage };
  }
  
  if (details.status === 500) {
    const serverMessage = 'Server error. Please try again later.';
    if (showToast) {
      toast.error(serverMessage);
    }
    return { ...details, message: serverMessage };
  }
  
  // Handle network errors
  if (details.code === 'ERR_NETWORK' || errorMessage.includes('Network Error')) {
    const networkMessage = 'Network error. Please check your internet connection.';
    if (showToast) {
      toast.error(networkMessage);
    }
    return { ...details, message: networkMessage };
  }
  
  if (details.code === 'ECONNREFUSED') {
    const connectionMessage = 'Cannot connect to server. Please try again later.';
    if (showToast) {
      toast.error(connectionMessage);
    }
    return { ...details, message: connectionMessage };
  }
  
  if (details.code === 'ETIMEDOUT') {
    const timeoutMessage = 'Request timed out. Please try again.';
    if (showToast) {
      toast.error(timeoutMessage);
    }
    return { ...details, message: timeoutMessage };
  }
  
  // Default error handling
  if (showToast) {
    toast.error(errorMessage);
  }
  
  return { ...details, message: errorMessage };
};

/**
 * Handle form validation errors
 */
export const handleValidationError = (
  message: string,
  options: ErrorHandlerOptions = {}
): void => {
  const { showToast = true, logError = true } = options;
  
  if (logError) {
    console.warn('Validation Error:', message);
  }
  
  if (showToast) {
    toast.error(message);
  }
};

/**
 * Handle success messages
 */
export const handleSuccess = (
  message: string,
  options: { showToast?: boolean; logSuccess?: boolean } = {}
): void => {
  const { showToast = true, logSuccess = false } = options;
  
  if (logSuccess) {
    console.log('Success:', message);
  }
  
  if (showToast) {
    toast.success(message);
  }
};

/**
 * Wrap async operations with error handling
 */
export const withErrorHandling = async <T>(
  operation: () => Promise<T>,
  options: ErrorHandlerOptions = {}
): Promise<{ data?: T; error?: ErrorDetails }> => {
  try {
    const data = await operation();
    return { data };
  } catch (error) {
    const errorDetails = handleApiError(error, options);
    return { error: errorDetails };
  }
};

/**
 * Check if error is a network error
 */
export const isNetworkError = (error: any): boolean => {
  if (!error) return false;
  return (
    error.code === 'ERR_NETWORK' ||
    error.code === 'ECONNREFUSED' ||
    error.code === 'ETIMEDOUT' ||
    (error.message && error.message.includes('Network Error')) ||
    false
  );
};

/**
 * Check if error is an authentication error
 */
export const isAuthError = (error: any): boolean => {
  return error.response?.status === 401 || error.response?.status === 403;
};

/**
 * Check if error is a validation error
 */
export const isValidationError = (error: any): boolean => {
  return error.response?.status === 422;
};
