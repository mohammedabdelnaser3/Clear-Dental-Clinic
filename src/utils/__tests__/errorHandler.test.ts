/**
 * Tests for error handler utilities
 * Covers API error handling, validation errors, and error classification
 */

import toast from 'react-hot-toast';
import {
  getErrorMessage,
  getErrorDetails,
  handleApiError,
  handleValidationError,
  handleSuccess,
  withErrorHandling,
  isNetworkError,
  isAuthError,
  isValidationError
} from '../errorHandler';

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  error: jest.fn(),
  success: jest.fn()
}));

// Mock window.location
const mockLocation = {
  href: ''
};

// Store original location
const originalLocation = window.location;

// Mock location before tests
beforeAll(() => {
  delete (window as any).location;
  window.location = mockLocation as any;
});

// Restore location after tests
afterAll(() => {
  window.location = originalLocation;
});

describe('getErrorMessage', () => {
  it('should extract message from response error', () => {
    const error = {
      response: {
        data: {
          message: 'API error message'
        }
      }
    };
    
    expect(getErrorMessage(error)).toBe('API error message');
  });

  it('should extract message from error object', () => {
    const error = new Error('Direct error message');
    expect(getErrorMessage(error)).toBe('Direct error message');
  });

  it('should handle string errors', () => {
    expect(getErrorMessage('String error')).toBe('String error');
  });

  it('should return default message for unknown errors', () => {
    expect(getErrorMessage(null)).toBe('An error occurred');
    expect(getErrorMessage(undefined)).toBe('An error occurred');
    expect(getErrorMessage({})).toBe('An error occurred');
    expect(getErrorMessage(null, 'Custom default')).toBe('Custom default');
  });
});

describe('getErrorDetails', () => {
  it('should extract complete error details', () => {
    const error = {
      response: {
        status: 404,
        data: {
          message: 'Not found',
          code: 'RESOURCE_NOT_FOUND'
        }
      },
      code: 'ERR_NETWORK'
    };
    
    const details = getErrorDetails(error);
    expect(details).toEqual({
      message: 'Not found',
      status: 404,
      code: 'ERR_NETWORK',
      shouldRedirect: false
    });
  });

  it('should identify auth errors that require redirect', () => {
    const error401 = { response: { status: 401 } };
    const error403 = { response: { status: 403 } };
    
    expect(getErrorDetails(error401).shouldRedirect).toBe(true);
    expect(getErrorDetails(error403).shouldRedirect).toBe(true);
  });

  it('should handle errors without response', () => {
    const error = new Error('Network error');
    const details = getErrorDetails(error);
    
    expect(details.message).toBe('Network error');
    expect(details.status).toBeUndefined();
    expect(details.shouldRedirect).toBe(false);
  });
});

describe('handleApiError', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocation.href = '';
  });

  it('should handle 401 authentication errors', () => {
    const error = { response: { status: 401 } };
    
    const result = handleApiError(error);
    
    expect(result.message).toBe('Your session has expired. Please log in again.');
    expect(toast.error).toHaveBeenCalledWith('Your session has expired. Please log in again.');
    
    // Check redirect after timeout
    setTimeout(() => {
      expect(mockLocation.href).toBe('/login');
    }, 2100);
  });

  it('should handle 403 permission errors', () => {
    const error = { response: { status: 403 } };
    
    const result = handleApiError(error);
    
    expect(result.message).toBe('You do not have permission to perform this action.');
    expect(toast.error).toHaveBeenCalledWith('You do not have permission to perform this action.');
  });

  it('should handle 404 not found errors', () => {
    const error = { response: { status: 404 } };
    
    const result = handleApiError(error);
    
    expect(result.message).toBe('The requested resource was not found.');
    expect(toast.error).toHaveBeenCalledWith('The requested resource was not found.');
  });

  it('should handle 422 validation errors', () => {
    const error = { response: { status: 422 } };
    
    const result = handleApiError(error);
    
    expect(result.message).toBe('Invalid data provided. Please check your inputs.');
    expect(toast.error).toHaveBeenCalledWith('Invalid data provided. Please check your inputs.');
  });

  it('should handle 413 file size errors', () => {
    const error = { response: { status: 413 } };
    
    const result = handleApiError(error);
    
    expect(result.message).toBe('The file is too large. Please upload a smaller file.');
    expect(toast.error).toHaveBeenCalledWith('The file is too large. Please upload a smaller file.');
  });

  it('should handle 500 server errors', () => {
    const error = { response: { status: 500 } };
    
    const result = handleApiError(error);
    
    expect(result.message).toBe('Server error. Please try again later.');
    expect(toast.error).toHaveBeenCalledWith('Server error. Please try again later.');
  });

  it('should handle network errors', () => {
    const error = { code: 'ERR_NETWORK' };
    
    const result = handleApiError(error);
    
    expect(result.message).toBe('Network error. Please check your internet connection.');
    expect(toast.error).toHaveBeenCalledWith('Network error. Please check your internet connection.');
  });

  it('should handle connection refused errors', () => {
    const error = { code: 'ECONNREFUSED' };
    
    const result = handleApiError(error);
    
    expect(result.message).toBe('Cannot connect to server. Please try again later.');
    expect(toast.error).toHaveBeenCalledWith('Cannot connect to server. Please try again later.');
  });

  it('should handle timeout errors', () => {
    const error = { code: 'ETIMEDOUT' };
    
    const result = handleApiError(error);
    
    expect(result.message).toBe('Request timed out. Please try again.');
    expect(toast.error).toHaveBeenCalledWith('Request timed out. Please try again.');
  });

  it('should use custom error messages when provided', () => {
    const error = { response: { status: 404 } };
    
    const result = handleApiError(error, { customMessage: 'Custom not found message' });
    
    expect(result.message).toBe('Custom not found message');
    expect(toast.error).toHaveBeenCalledWith('Custom not found message');
  });

  it('should respect showToast option', () => {
    const error = { response: { status: 500 } };
    
    handleApiError(error, { showToast: false });
    
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('should respect logError option', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    const error = { response: { status: 500 } };
    
    handleApiError(error, { logError: false });
    
    expect(consoleErrorSpy).not.toHaveBeenCalled();
    
    handleApiError(error, { logError: true });
    
    expect(consoleErrorSpy).toHaveBeenCalled();
    
    consoleErrorSpy.mockRestore();
  });

  it('should respect redirectOnAuth option', () => {
    const error = { response: { status: 401 } };
    
    handleApiError(error, { redirectOnAuth: false });
    
    // Should not set timeout for redirect
    setTimeout(() => {
      expect(mockLocation.href).toBe('');
    }, 2100);
  });
});

describe('handleValidationError', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show validation error toast', () => {
    handleValidationError('Validation failed');
    
    expect(toast.error).toHaveBeenCalledWith('Validation failed');
  });

  it('should log validation errors when enabled', () => {
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    
    handleValidationError('Validation failed', { logError: true });
    
    expect(consoleWarnSpy).toHaveBeenCalledWith('Validation Error:', 'Validation failed');
    
    consoleWarnSpy.mockRestore();
  });

  it('should respect showToast option', () => {
    handleValidationError('Validation failed', { showToast: false });
    
    expect(toast.error).not.toHaveBeenCalled();
  });
});

describe('handleSuccess', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show success toast', () => {
    handleSuccess('Operation successful');
    
    expect(toast.success).toHaveBeenCalledWith('Operation successful');
  });

  it('should log success when enabled', () => {
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    
    handleSuccess('Operation successful', { logSuccess: true });
    
    expect(consoleLogSpy).toHaveBeenCalledWith('Success:', 'Operation successful');
    
    consoleLogSpy.mockRestore();
  });

  it('should respect showToast option', () => {
    handleSuccess('Operation successful', { showToast: false });
    
    expect(toast.success).not.toHaveBeenCalled();
  });
});

describe('withErrorHandling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return data on successful operation', async () => {
    const operation = jest.fn().mockResolvedValue('success data');
    
    const result = await withErrorHandling(operation);
    
    expect(result).toEqual({ data: 'success data' });
    expect(operation).toHaveBeenCalled();
  });

  it('should return error details on failed operation', async () => {
    const error = { response: { status: 500 } };
    const operation = jest.fn().mockRejectedValue(error);
    
    const result = await withErrorHandling(operation);
    
    expect(result.data).toBeUndefined();
    expect(result.error).toBeDefined();
    expect(result.error?.message).toBe('Server error. Please try again later.');
  });

  it('should pass options to error handler', async () => {
    const error = { response: { status: 500 } };
    const operation = jest.fn().mockRejectedValue(error);
    
    await withErrorHandling(operation, { showToast: false });
    
    expect(toast.error).not.toHaveBeenCalled();
  });
});

describe('error classification functions', () => {
  describe('isNetworkError', () => {
    it('should identify network errors', () => {
      expect(isNetworkError({ code: 'ERR_NETWORK' })).toBe(true);
      expect(isNetworkError({ code: 'ECONNREFUSED' })).toBe(true);
      expect(isNetworkError({ code: 'ETIMEDOUT' })).toBe(true);
      expect(isNetworkError({ message: 'Network Error' })).toBe(true);
    });

    it('should not identify non-network errors', () => {
      expect(isNetworkError({ response: { status: 500 } })).toBe(false);
      expect(isNetworkError({ code: 'OTHER_ERROR' })).toBe(false);
    });
  });

  describe('isAuthError', () => {
    it('should identify authentication errors', () => {
      expect(isAuthError({ response: { status: 401 } })).toBe(true);
      expect(isAuthError({ response: { status: 403 } })).toBe(true);
    });

    it('should not identify non-auth errors', () => {
      expect(isAuthError({ response: { status: 404 } })).toBe(false);
      expect(isAuthError({ response: { status: 500 } })).toBe(false);
    });
  });

  describe('isValidationError', () => {
    it('should identify validation errors', () => {
      expect(isValidationError({ response: { status: 422 } })).toBe(true);
    });

    it('should not identify non-validation errors', () => {
      expect(isValidationError({ response: { status: 400 } })).toBe(false);
      expect(isValidationError({ response: { status: 500 } })).toBe(false);
    });
  });
});