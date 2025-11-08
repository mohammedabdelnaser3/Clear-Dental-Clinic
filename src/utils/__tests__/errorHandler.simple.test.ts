/**
 * Simplified tests for error handler utilities
 * Focuses on core error handling without complex mocking
 */

import {
  getErrorMessage,
  getErrorDetails,
  isNetworkError,
  isAuthError,
  isValidationError
} from '../errorHandler';

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  error: jest.fn(),
  success: jest.fn()
}));

describe('Error Handler Utilities', () => {
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
        expect(isNetworkError({})).toBe(false);
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
});