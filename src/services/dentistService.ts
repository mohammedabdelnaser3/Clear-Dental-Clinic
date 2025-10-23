import api from './api';
import { profileCache } from '../utils/cacheManager';
import { 
  safeAccess, 
  safeArrayMap, 
  isValidArray, 
  validateResponseStructure,
  exists 
} from '../utils/safeAccess';
import { 
  handleApiError, 
  handleSuccess
} from '../utils/errorHandler';
import type { ErrorHandlerOptions } from '../utils/errorHandler';
import { logError, logWarn, logInfo, logApiCall } from '../utils/logger';
import type {
  ApiResponse,
  PaginatedResponse,
  Appointment,
  Dentist,
  DentistClinicAssociation,
  UpdateDentistProfileRequest,
  ClinicAvailability
} from '../types';

// Dentist appointments query params
export interface DentistAppointmentsParams {
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

// Re-export types for backward compatibility
export type { Dentist, UpdateDentistProfileRequest as UpdateDentistRequest };
export type DentistClinic = DentistClinicAssociation;

// Dentist availability schedule (service-specific format)
export interface DentistAvailability {
  clinicId: string;
  clinicName?: string;
  schedule: ClinicAvailability;
}

// Transform backend dentist data
const transformDentistData = (dentist: any): Dentist => {
  return {
    id: dentist.id || dentist._id,
    firstName: dentist.firstName,
    lastName: dentist.lastName,
    email: dentist.email,
    phone: dentist.phone,
    role: 'dentist',
    specialization: dentist.specialization || '',
    licenseNumber: dentist.licenseNumber || '',
    bio: dentist.bio,
    yearsOfExperience: dentist.yearsOfExperience,
    education: dentist.education || [],
    certifications: dentist.certifications || [],
    profileImage: dentist.profileImage,
    rating: dentist.rating,
    reviewCount: dentist.reviewCount,
    isActive: dentist.isActive !== undefined ? dentist.isActive : true,
    dateOfBirth: dentist.dateOfBirth,
    gender: dentist.gender,
    address: dentist.address,
    createdAt: new Date(dentist.createdAt),
    updatedAt: new Date(dentist.updatedAt)
  };
};

// Transform appointment data
const transformAppointmentData = (appointment: any): Appointment => {
  return {
    id: appointment.id || appointment._id,
    patientId: appointment.patientId || appointment.patient?.id,
    dentistId: appointment.dentistId || appointment.dentist?.id,
    clinicId: appointment.clinicId || appointment.clinic?.id,
    clinicName: appointment.clinicName || appointment.clinic?.name,
    dentistName: appointment.dentistName ||
      (appointment.dentist ? `${appointment.dentist.firstName} ${appointment.dentist.lastName}` : undefined),
    patientName: appointment.patientName ||
      (appointment.patient ? `${appointment.patient.firstName} ${appointment.patient.lastName}` : undefined),
    serviceType: appointment.serviceType || appointment.service?.name || '',
    date: appointment.date,
    timeSlot: appointment.timeSlot || appointment.time,
    duration: appointment.duration || 30,
    status: appointment.status || 'scheduled',
    notes: appointment.notes,
    createdAt: new Date(appointment.createdAt),
    updatedAt: new Date(appointment.updatedAt)
  };
};

/**
 * Get dentist by ID
 * Fetches complete dentist profile data including professional information
 * Uses caching to improve performance
 * @param id - Dentist user ID
 * @param useCache - Whether to use cached data (default: true)
 * @returns Promise<Dentist> - Complete dentist profile
 * @throws Error if fetch fails
 */
export const getDentistById = async (id: string, useCache: boolean = true): Promise<Dentist> => {
  const startTime = Date.now();
  
  try {
    logInfo('Fetching dentist profile', { dentistId: id, useCache });

    // Check cache first if enabled
    if (useCache) {
      const cached = profileCache.getDentistProfile(id);
      if (cached) {
        logInfo('Dentist profile loaded from cache', { dentistId: id });
        return cached as Dentist;
      }
    }

    const response = await api.get<ApiResponse<any>>(`/api/v1/users/${id}`);
    const duration = Date.now() - startTime;
    
    logApiCall('GET', `/api/v1/users/${id}`, response.status, duration);

    // Validate response structure
    if (!validateResponseStructure(response.data, { data: 'object' })) {
      const error = new Error('Invalid response structure from server');
      logError('Invalid dentist profile response structure', error, { 
        dentistId: id, 
        responseKeys: Object.keys(response.data || {}) 
      });
      throw error;
    }

    const rawData = safeAccess(response.data, 'data');
    if (!exists(rawData)) {
      const error = new Error('Dentist profile not found');
      logError('No dentist data in response', error, { dentistId: id });
      throw error;
    }

    const dentistData = transformDentistData(rawData);

    // Cache the result
    if (useCache) {
      profileCache.setDentistProfile(id, dentistData);
      logInfo('Dentist profile cached', { dentistId: id });
    }

    logInfo('Dentist profile loaded successfully', { dentistId: id, duration });
    return dentistData;
  } catch (error: any) {
    const duration = Date.now() - startTime;
    logError('Failed to fetch dentist profile', error, { dentistId: id, duration });
    
    const errorOptions: ErrorHandlerOptions = {
      customMessage: 'Unable to load dentist profile. Please try again.',
      showToast: true,
      logError: false // Already logged above
    };
    
    const errorDetails = handleApiError(error, errorOptions);
    throw new Error(errorDetails.message);
  }
};

/**
 * Update dentist profile
 * Updates dentist profile information including personal and professional details
 * Invalidates cache after successful update
 * @param id - Dentist user ID
 * @param dentistData - Partial dentist data to update
 * @returns Promise<Dentist> - Updated dentist profile
 * @throws Error if update fails
 */
export const updateDentist = async (id: string, dentistData: UpdateDentistProfileRequest): Promise<Dentist> => {
  const startTime = Date.now();
  
  try {
    logInfo('Updating dentist profile', { 
      dentistId: id, 
      updateFields: Object.keys(dentistData) 
    });

    const response = await api.put<ApiResponse<any>>(`/api/v1/users/${id}`, dentistData);
    const duration = Date.now() - startTime;
    
    logApiCall('PUT', `/api/v1/users/${id}`, response.status, duration);

    // Validate response structure
    if (!validateResponseStructure(response.data, { data: 'object' })) {
      const error = new Error('Invalid response structure from server');
      logError('Invalid update response structure', error, { 
        dentistId: id, 
        responseKeys: Object.keys(response.data || {}) 
      });
      throw error;
    }

    const rawData = safeAccess(response.data, 'data');
    if (!exists(rawData)) {
      const error = new Error('No updated data returned from server');
      logError('No data in update response', error, { dentistId: id });
      throw error;
    }

    const updatedData = transformDentistData(rawData);

    // Update cache with new data
    profileCache.setDentistProfile(id, updatedData);
    
    logInfo('Dentist profile updated successfully', { dentistId: id, duration });
    handleSuccess('Profile updated successfully');

    return updatedData;
  } catch (error: any) {
    const duration = Date.now() - startTime;
    logError('Failed to update dentist profile', error, { dentistId: id, duration });
    
    const errorOptions: ErrorHandlerOptions = {
      customMessage: 'Unable to update profile. Please check your information and try again.',
      showToast: true,
      logError: false // Already logged above
    };
    
    const errorDetails = handleApiError(error, errorOptions);
    throw new Error(errorDetails.message);
  }
};

/**
 * Upload dentist profile image
 * Uploads and updates dentist profile picture
 * @param id - Dentist user ID
 * @param file - Image file to upload (jpg, png, gif, max 5MB)
 * @returns Promise<string> - URL of uploaded image
 * @throws Error if upload fails or file validation fails
 */
export const uploadDentistImage = async (id: string, file: File): Promise<string> => {
  const startTime = Date.now();
  
  try {
    logInfo('Starting profile image upload', { 
      dentistId: id, 
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    });

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      const error = new Error('Please select a valid image file (JPG, PNG, or GIF)');
      logWarn('Invalid file type for image upload', { 
        dentistId: id, 
        fileType: file.type, 
        allowedTypes 
      });
      throw error;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      const error = new Error('Image file is too large. Please select a file smaller than 5MB');
      logWarn('File size exceeds limit for image upload', { 
        dentistId: id, 
        fileSize: file.size, 
        maxSize 
      });
      throw error;
    }

    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post<ApiResponse<{ fileUrl: string }>>(`/api/v1/users/${id}/upload-image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const duration = Date.now() - startTime;
    logApiCall('POST', `/api/v1/users/${id}/upload-image`, response.status, duration);

    // Validate response structure
    const fileUrl = safeAccess(response.data, 'data.fileUrl');
    if (!exists(fileUrl) || typeof fileUrl !== 'string') {
      const error = new Error('Upload completed but no image URL was returned');
      logError('Invalid upload response structure', error, { 
        dentistId: id, 
        responseData: response.data 
      });
      throw error;
    }

    logInfo('Profile image uploaded successfully', { 
      dentistId: id, 
      fileUrl, 
      duration 
    });
    
    handleSuccess('Profile image updated successfully');
    return fileUrl;
  } catch (error: any) {
    const duration = Date.now() - startTime;
    logError('Failed to upload profile image', error, { dentistId: id, duration });
    
    // Don't show toast for validation errors as they're user-friendly already
    const isValidationError = error.message?.includes('Please select') || 
                             error.message?.includes('too large');
    
    const errorOptions: ErrorHandlerOptions = {
      customMessage: isValidationError ? error.message : 'Unable to upload image. Please try again.',
      showToast: !isValidationError, // Don't show toast for validation errors
      logError: false // Already logged above
    };
    
    const errorDetails = handleApiError(error, errorOptions);
    throw new Error(errorDetails.message);
  }
};

/**
 * Get dentist's associated clinics
 * Fetches all clinics where the dentist is affiliated
 * @param dentistId - Dentist user ID
 * @returns Promise<DentistClinicAssociation[]> - Array of associated clinics
 * @throws Never throws - returns empty array for all error cases to prevent crashes
 */
export const getDentistClinics = async (dentistId: string): Promise<DentistClinicAssociation[]> => {
  const startTime = Date.now();
  
  try {
    logInfo('Fetching dentist clinics', { dentistId });

    const response = await api.get<ApiResponse<DentistClinicAssociation[]>>(`/api/v1/users/${dentistId}/clinics`);
    const duration = Date.now() - startTime;
    
    logApiCall('GET', `/api/v1/users/${dentistId}/clinics`, response.status, duration);

    // Validate response structure using safe access
    const clinicsData = safeAccess(response.data, 'data');
    
    if (!isValidArray(clinicsData)) {
      logWarn('Invalid clinics response structure - expected array', { 
        dentistId, 
        responseKeys: Object.keys(response.data || {}),
        dataType: typeof clinicsData
      });
      return [];
    }

    logInfo('Dentist clinics loaded successfully', { 
      dentistId, 
      clinicCount: clinicsData.length, 
      duration 
    });

    return clinicsData;
  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    // Handle 404 errors gracefully - endpoint might not exist yet
    if (error.response?.status === 404) {
      logWarn('Clinics API endpoint not found - feature may not be implemented yet', { 
        dentistId, 
        duration 
      });
      return [];
    }

    // Log other errors but don't show user notifications for this non-critical feature
    logWarn('Failed to fetch dentist clinics', { 
      dentistId, 
      error: error.message,
      status: error.response?.status,
      duration
    });

    // Always return empty array to prevent application crashes
    return [];
  }
};

/**
 * Get dentist's appointments
 * Fetches appointments for a specific dentist with optional filtering
 * Uses caching for better performance
 * @param dentistId - Dentist user ID
 * @param params - Optional query parameters for filtering
 * @param useCache - Whether to use cached data (default: true)
 * @returns Promise<PaginatedResponse<Appointment>> - Paginated list of appointments
 * @throws Never throws - returns empty result for all error cases to prevent crashes
 */
export const getDentistAppointments = async (
  dentistId: string,
  params?: DentistAppointmentsParams,
  useCache: boolean = true
): Promise<PaginatedResponse<Appointment>> => {
  const startTime = Date.now();
  const defaultResult = {
    data: [],
    total: 0,
    totalPages: 0,
    page: 1,
    limit: params?.limit || 10,
    success: false
  };

  try {
    logInfo('Fetching dentist appointments', { 
      dentistId, 
      params: params || {},
      useCache 
    });

    // Create cache key based on params
    const cacheKey = `${dentistId}_${JSON.stringify(params || {})}`;

    // Check cache first if enabled and no specific filters
    if (useCache && (!params || Object.keys(params).length === 0)) {
      const cached = profileCache.getAppointments(cacheKey);
      if (cached) {
        logInfo('Appointments loaded from cache', { dentistId, cacheKey });
        return cached as PaginatedResponse<Appointment>;
      }
    }

    const response = await api.get<PaginatedResponse<any>>('/api/v1/appointments', {
      params: {
        dentistId,
        ...params
      }
    });

    const duration = Date.now() - startTime;
    logApiCall('GET', '/api/v1/appointments', response.status, duration, { dentistId });

    // Validate response structure using safe access
    if (!exists(response) || !exists(response.data)) {
      logWarn('No response data received for appointments', { dentistId, duration });
      return defaultResult;
    }

    // Validate that response.data.data exists and is an array
    const appointmentsData = safeAccess(response.data, 'data');
    
    if (!isValidArray(appointmentsData)) {
      logWarn('Invalid appointments response structure - expected array', { 
        dentistId, 
        responseKeys: Object.keys(response.data),
        dataType: typeof appointmentsData,
        duration
      });
      return defaultResult;
    }

    // Safe array mapping with individual error handling for each appointment
    const transformedData = safeArrayMap(
      appointmentsData,
      (appointment: any, index: number) => {
        if (!exists(appointment) || typeof appointment !== 'object') {
          logWarn('Invalid appointment data at index', { 
            dentistId, 
            index, 
            appointmentType: typeof appointment 
          });
          return null;
        }
        
        try {
          return transformAppointmentData(appointment);
        } catch (transformError) {
          logWarn('Failed to transform appointment data', { 
            dentistId, 
            index, 
            error: transformError 
          });
          return null;
        }
      }
    ).filter(appointment => appointment !== null) as Appointment[];

    // Safely extract pagination data
    const total = safeAccess(response.data, 'total', { fallback: 0 });
    const page = safeAccess(response.data, 'page', { fallback: 1 });
    const limit = safeAccess(response.data, 'limit', { fallback: params?.limit || 10 });

    const result = {
      data: transformedData,
      total: typeof total === 'number' ? total : 0,
      totalPages: Math.ceil((typeof total === 'number' ? total : 0) / limit),
      page: typeof page === 'number' ? page : 1,
      limit: typeof limit === 'number' ? limit : (params?.limit || 10),
      success: true
    };

    // Cache the result if no specific filters
    if (useCache && (!params || Object.keys(params).length === 0)) {
      profileCache.setAppointments(cacheKey, result);
    }

    logInfo('Appointments loaded successfully', { 
      dentistId, 
      appointmentCount: transformedData.length,
      total: result.total,
      duration 
    });

    return result;
  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    logWarn('Failed to fetch dentist appointments', { 
      dentistId, 
      error: error.message,
      status: error.response?.status,
      duration
    });

    // Always return empty result instead of throwing to prevent crashes
    return defaultResult;
  }
};

/**
 * Get dentist's availability schedule
 * Fetches working hours and availability for all associated clinics
 * @param dentistId - Dentist user ID
 * @returns Promise<DentistAvailability[]> - Array of availability schedules per clinic
 * @throws Error if fetch fails (returns empty array if endpoint not available)
 */
export const getDentistAvailability = async (dentistId: string): Promise<DentistAvailability[]> => {
  const startTime = Date.now();
  
  try {
    logInfo('Fetching dentist availability', { dentistId });

    const response = await api.get<ApiResponse<DentistAvailability[]>>(`/api/v1/users/${dentistId}/availability`);
    const duration = Date.now() - startTime;
    
    logApiCall('GET', `/api/v1/users/${dentistId}/availability`, response.status, duration);

    const availabilityData = safeAccess(response.data, 'data', { fallback: [] });
    
    if (!isValidArray(availabilityData)) {
      logWarn('Invalid availability response structure', { 
        dentistId, 
        dataType: typeof availabilityData 
      });
      return [];
    }

    logInfo('Dentist availability loaded successfully', { 
      dentistId, 
      scheduleCount: availabilityData.length, 
      duration 
    });

    return availabilityData;
  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    // If endpoint doesn't exist yet, return empty array gracefully
    if (error.response?.status === 404) {
      logWarn('Availability API endpoint not found - feature may not be implemented yet', { 
        dentistId, 
        duration 
      });
    } else {
      logWarn('Failed to fetch dentist availability', { 
        dentistId, 
        error: error.message,
        status: error.response?.status,
        duration
      });
    }
    
    return [];
  }
};

/**
 * Update dentist's availability schedule
 * Updates working hours and availability for associated clinics
 * @param dentistId - Dentist user ID
 * @param availability - Array of availability schedules to update
 * @returns Promise<DentistAvailability[]> - Updated availability schedules
 * @throws Error if update fails
 */
export const updateDentistAvailability = async (
  dentistId: string,
  availability: DentistAvailability[]
): Promise<DentistAvailability[]> => {
  const startTime = Date.now();
  
  try {
    logInfo('Updating dentist availability', { 
      dentistId, 
      scheduleCount: availability.length 
    });

    const response = await api.put<ApiResponse<DentistAvailability[]>>(
      `/api/v1/users/${dentistId}/availability`,
      { availability }
    );

    const duration = Date.now() - startTime;
    logApiCall('PUT', `/api/v1/users/${dentistId}/availability`, response.status, duration);

    // Validate response structure
    const updatedData = safeAccess(response.data, 'data');
    
    if (!isValidArray(updatedData)) {
      const error = new Error('Invalid response structure from server');
      logError('Invalid availability update response', error, { 
        dentistId, 
        responseKeys: Object.keys(response.data || {}) 
      });
      throw error;
    }

    logInfo('Dentist availability updated successfully', { 
      dentistId, 
      scheduleCount: updatedData.length, 
      duration 
    });
    
    handleSuccess('Availability schedule updated successfully');
    return updatedData;
  } catch (error: any) {
    const duration = Date.now() - startTime;
    logError('Failed to update dentist availability', error, { dentistId, duration });
    
    const errorOptions: ErrorHandlerOptions = {
      customMessage: 'Unable to update availability schedule. Please try again.',
      showToast: true,
      logError: false // Already logged above
    };
    
    const errorDetails = handleApiError(error, errorOptions);
    throw new Error(errorDetails.message);
  }
};

// Create service instance
const dentistService = {
  getDentistById,
  updateDentist,
  uploadDentistImage,
  getDentistClinics,
  getDentistAppointments,
  getDentistAvailability,
  updateDentistAvailability
};

export { dentistService };
export default dentistService;
