/**
 * Tests for dentist service API error scenarios
 * Covers 404 errors, network failures, and malformed data handling
 */

import axios from 'axios';
import { dentistService } from '../dentistService';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock console methods
const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

describe('dentistService API Error Scenarios', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy.mockClear();
    consoleWarnSpy.mockClear();
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  describe('getDentistById', () => {
    it('should handle 404 errors gracefully', async () => {
      const error404 = {
        response: {
          status: 404,
          data: { message: 'Dentist not found' }
        }
      };

      mockedAxios.get.mockRejectedValueOnce(error404);

      await expect(dentistService.getDentistById('nonexistent-id')).rejects.toThrow();
    });

    it('should handle network errors', async () => {
      const networkError = {
        code: 'ERR_NETWORK',
        message: 'Network Error'
      };

      mockedAxios.get.mockRejectedValueOnce(networkError);

      await expect(dentistService.getDentistById('test-id')).rejects.toThrow();
    });

    it('should handle malformed response data', async () => {
      const malformedResponse = {
        status: 200,
        data: {
          // Missing 'data' property
          message: 'Success'
        }
      };

      mockedAxios.get.mockResolvedValueOnce(malformedResponse);

      // Should handle malformed data gracefully
      const result = await dentistService.getDentistById('test-id').catch(e => e);
      expect(result).toBeInstanceOf(Error);
    });

    it('should handle response with null data', async () => {
      const nullDataResponse = {
        status: 200,
        data: {
          data: null
        }
      };

      mockedAxios.get.mockResolvedValueOnce(nullDataResponse);

      const result = await dentistService.getDentistById('test-id').catch(e => e);
      expect(result).toBeInstanceOf(Error);
    });

    it('should handle response with invalid data structure', async () => {
      const invalidDataResponse = {
        status: 200,
        data: {
          data: 'invalid-string-instead-of-object'
        }
      };

      mockedAxios.get.mockResolvedValueOnce(invalidDataResponse);

      const result = await dentistService.getDentistById('test-id').catch(e => e);
      expect(result).toBeInstanceOf(Error);
    });
  });

  describe('updateDentist', () => {
    const updateData = {
      firstName: 'John',
      lastName: 'Doe'
    };

    it('should handle 422 validation errors', async () => {
      const validationError = {
        response: {
          status: 422,
          data: { message: 'Invalid data provided' }
        }
      };

      mockedAxios.put.mockRejectedValueOnce(validationError);

      await expect(dentistService.updateDentist('test-id', updateData)).rejects.toThrow();
    });

    it('should handle server errors during update', async () => {
      const serverError = {
        response: {
          status: 500,
          data: { message: 'Internal server error' }
        }
      };

      mockedAxios.put.mockRejectedValueOnce(serverError);

      await expect(dentistService.updateDentist('test-id', updateData)).rejects.toThrow();
    });

    it('should handle malformed update response', async () => {
      const malformedResponse = {
        status: 200,
        data: {
          // Missing updated data
          message: 'Updated successfully'
        }
      };

      mockedAxios.put.mockResolvedValueOnce(malformedResponse);

      const result = await dentistService.updateDentist('test-id', updateData).catch(e => e);
      expect(result).toBeInstanceOf(Error);
    });
  });

  describe('getDentistClinics', () => {
    it('should handle 404 errors and return empty array', async () => {
      const error404 = {
        response: {
          status: 404,
          data: { message: 'Clinics not found' }
        }
      };

      mockedAxios.get.mockRejectedValueOnce(error404);

      const result = await dentistService.getDentistClinics('test-id');

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('404 error when fetching dentist clinics'),
        expect.any(Object)
      );
    });

    it('should handle network errors gracefully', async () => {
      const networkError = {
        code: 'ERR_NETWORK',
        message: 'Network Error'
      };

      mockedAxios.get.mockRejectedValueOnce(networkError);

      await expect(dentistService.getDentistClinics('test-id')).rejects.toThrow();
    });

    it('should handle malformed clinics data', async () => {
      const malformedResponse = {
        status: 200,
        data: {
          data: 'not-an-array'
        }
      };

      mockedAxios.get.mockResolvedValueOnce(malformedResponse);

      const result = await dentistService.getDentistClinics('test-id');

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid clinics data format'),
        expect.any(Object)
      );
    });

    it('should handle null clinics data', async () => {
      const nullDataResponse = {
        status: 200,
        data: {
          data: null
        }
      };

      mockedAxios.get.mockResolvedValueOnce(nullDataResponse);

      const result = await dentistService.getDentistClinics('test-id');

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  describe('getDentistAppointments', () => {
    it('should handle 404 errors and return empty result', async () => {
      const error404 = {
        response: {
          status: 404,
          data: { message: 'Appointments not found' }
        }
      };

      mockedAxios.get.mockRejectedValueOnce(error404);

      const result = await getDentistAppointments('test-id');

      expect(result).toEqual({
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0
      });
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('404 error when fetching dentist appointments'),
        expect.any(Object)
      );
    });

    it('should handle malformed appointments data', async () => {
      const malformedResponse = {
        status: 200,
        data: {
          data: 'invalid-data'
        }
      };

      mockedAxios.get.mockResolvedValueOnce(malformedResponse);

      const result = await getDentistAppointments('test-id');

      expect(result).toEqual({
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0
      });
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid appointments data format'),
        expect.any(Object)
      );
    });

    it('should handle missing response data', async () => {
      const emptyResponse = {
        status: 200,
        data: null
      };

      mockedAxios.get.mockResolvedValueOnce(emptyResponse);

      const result = await getDentistAppointments('test-id');

      expect(result).toEqual({
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0
      });
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('No response data received for appointments'),
        expect.any(Object)
      );
    });

    it('should handle appointments data that is not an array', async () => {
      const invalidArrayResponse = {
        status: 200,
        data: {
          data: { appointments: 'not-an-array' }
        }
      };

      mockedAxios.get.mockResolvedValueOnce(invalidArrayResponse);

      const result = await getDentistAppointments('test-id');

      expect(result).toEqual({
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0
      });
    });

    it('should handle timeout errors', async () => {
      const timeoutError = {
        code: 'ETIMEDOUT',
        message: 'Request timed out'
      };

      mockedAxios.get.mockRejectedValueOnce(timeoutError);

      await expect(getDentistAppointments('test-id')).rejects.toThrow();
    });
  });

  describe('getDentistAvailability', () => {
    it('should handle 404 errors and return empty array', async () => {
      const error404 = {
        response: {
          status: 404,
          data: { message: 'Availability not found' }
        }
      };

      mockedAxios.get.mockRejectedValueOnce(error404);

      const result = await getDentistAvailability('test-id');

      expect(result).toEqual([]);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('404 error when fetching dentist availability'),
        expect.any(Object)
      );
    });

    it('should handle malformed availability data', async () => {
      const malformedResponse = {
        status: 200,
        data: {
          data: 'not-an-array'
        }
      };

      mockedAxios.get.mockResolvedValueOnce(malformedResponse);

      const result = await getDentistAvailability('test-id');

      expect(result).toEqual([]);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid availability data format'),
        expect.any(Object)
      );
    });

    it('should handle server errors', async () => {
      const serverError = {
        response: {
          status: 500,
          data: { message: 'Server error' }
        }
      };

      mockedAxios.get.mockRejectedValueOnce(serverError);

      await expect(getDentistAvailability('test-id')).rejects.toThrow();
    });
  });

  describe('Edge cases and boundary conditions', () => {
    it('should handle extremely large response data', async () => {
      const largeArray = new Array(10000).fill(0).map((_, i) => ({ id: i, name: `Item ${i}` }));
      const largeResponse = {
        status: 200,
        data: {
          data: largeArray
        }
      };

      mockedAxios.get.mockResolvedValueOnce(largeResponse);

      const result = await getDentistClinics('test-id');

      expect(result.data).toHaveLength(10000);
      expect(result.total).toBe(10000);
    });

    it('should handle response with circular references', async () => {
      const circularData: any = { id: 1, name: 'Test' };
      circularData.self = circularData;

      const circularResponse = {
        status: 200,
        data: {
          data: [circularData]
        }
      };

      mockedAxios.get.mockResolvedValueOnce(circularResponse);

      // Should not throw an error due to circular reference
      const result = await getDentistClinics('test-id');

      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe(1);
    });

    it('should handle concurrent API calls with mixed success/failure', async () => {
      // Mock different responses for concurrent calls
      mockedAxios.get
        .mockResolvedValueOnce({ status: 200, data: { data: { id: 1, name: 'Test' } } })
        .mockRejectedValueOnce({ response: { status: 404 } })
        .mockResolvedValueOnce({ status: 200, data: { data: [] } });

      const [profileResult, clinicsResult, availabilityResult] = await Promise.allSettled([
        getDentistProfile('test-id'),
        getDentistClinics('test-id'),
        getDentistAvailability('test-id')
      ]);

      expect(profileResult.status).toBe('fulfilled');
      expect(clinicsResult.status).toBe('fulfilled');
      expect(availabilityResult.status).toBe('fulfilled');
    });
  });
});