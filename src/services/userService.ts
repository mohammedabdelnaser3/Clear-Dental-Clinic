import api from './api';
import type { User, ApiResponse, PaginatedResponse } from '../types';
import { createSafeApiParams } from '../utils/clinicUtils';

export interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  specialization?: string;
  licenseNumber?: string;
  bio?: string;
}


export interface TokenValidationResult {
  isValid: boolean;
  isExpired: boolean;
  expiresAt?: Date;
  user?: User;
}

// Token validation and user permissions
export const validateUserToken = async (): Promise<TokenValidationResult> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      return { isValid: false, isExpired: false };
    }

    // Check token expiration by decoding JWT (basic check)
    try {
      const tokenPayload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      const isExpired = tokenPayload.exp < currentTime;
      
      if (isExpired) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        return { isValid: false, isExpired: true };
      }

      // Additional server-side validation
      const response = await api.get('/api/v1/auth/validate');
      const user = response.data?.data?.user;
      
      return {
        isValid: true,
        isExpired: false,
        expiresAt: new Date(tokenPayload.exp * 1000),
        user
      };
    } catch (_decodeError) {
      // If token is malformed, remove it
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      return { isValid: false, isExpired: false };
    }
  } catch (error: any) {
    console.error('Token validation error:', error);
    
    // Handle specific error cases
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      return { isValid: false, isExpired: true };
    }
    
    return { isValid: false, isExpired: false };
  }
};

// Check user permissions for specific actions
export const checkUserPermission = (user: User | null, requiredRole?: string, requiredPermissions?: string[]): boolean => {
  if (!user) return false;
  
  // Check if user is active
  if (!user.isActive) return false;
  
  // Check role if specified
  if (requiredRole && user.role !== requiredRole) {
    // Admin can access any role
    if (requiredRole !== 'admin' && user.role === 'admin') {
      return true;
    }
    return false;
  }
  
  // Check specific permissions if provided
  if (requiredPermissions && requiredPermissions.length > 0) {
    const userPermissions = user.permissions || [];
    return requiredPermissions.every(permission => userPermissions.includes(permission));
  }
  
  return true;
};

// Update user profile
export const updateProfile = async (profileData: UpdateProfileData): Promise<User> => {
  try {
    const response = await api.put<ApiResponse<{ user: User }>>('/api/v1/auth/profile', profileData);
    if (!response.data?.data?.user) {
      throw new Error('Invalid response from server');
    }
    return response.data.data.user;
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to update profile';
    throw new Error(errorMessage);
  }
};

// Upload profile image with optimization
export const uploadProfileImage = async (file: File): Promise<{ profileImage: string }> => {
  try {
    // Import image optimization utilities dynamically to avoid bundle bloat
    const { optimizeProfileImage, validateImageFile } = await import('../utils/imageOptimization');
    
    // Validate the image file
    const validation = validateImageFile(file, {
      maxSizeMB: 5,
      allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
    });
    
    if (!validation.isValid) {
      throw new Error(validation.error);
    }
    
    // Optimize the image for better performance
    let optimizedFile = file;
    try {
      const profileImageSet = await optimizeProfileImage(file);
      // Use the medium size for upload (good balance of quality and size)
      optimizedFile = profileImageSet.medium.file;
      
      console.log(`Image optimized: ${file.size} bytes → ${optimizedFile.size} bytes (${profileImageSet.medium.compressionRatio.toFixed(1)}% reduction)`);
    } catch (optimizationError) {
      console.warn('Image optimization failed, using original:', optimizationError);
      // Continue with original file if optimization fails
    }
    
    const formData = new FormData();
    formData.append('profileImage', optimizedFile);
    
    const response = await api.post<ApiResponse<{ profileImage: string }>>('/api/v1/users/profile-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    if (!response.data?.data) {
      throw new Error('Invalid response from server');
    }
    return response.data.data;
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to upload profile image';
    throw new Error(errorMessage);
  }
};

// Get users by role with enhanced error handling
export const getUsersByRole = async (role: string, params?: {
  clinicId?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<User>> => {
  try {
    console.log(`Fetching users with role: ${role}`, { params });
    
    if (role === 'dentist') {
      // Use dedicated dentists endpoint
      const safeParams = createSafeApiParams(params?.clinicId);
      const response = await api.get('/api/v1/users/dentists', {
        params: safeParams
      });
      
      console.log('Dentist API response:', {
        status: response.status,
        hasData: !!response.data,
        dataStructure: response.data ? Object.keys(response.data) : [],
        dentistsCount: response.data?.data?.dentists?.length || 0
      });
      
      // Transform the response to match PaginatedResponse format
      const dentists = response.data?.data?.dentists || [];
      
      // Handle case where no dentists are found
      if (dentists.length === 0) {
        console.warn(`No dentists found for clinic: ${params?.clinicId}`);
        return {
          success: true,
          data: [],
          message: `No dentists available for this clinic. Please contact administration to assign dentists.`,
          page: 1,
          limit: 0,
          total: 0,
          totalPages: 1
        };
      }
      
      return {
        success: true,
        data: dentists,
        page: 1,
        limit: dentists.length,
        total: dentists.length,
        totalPages: 1
      };
    } else {
      // Use general users endpoint for other roles
      const response = await api.get<PaginatedResponse<User>>('/api/v1/users', {
        params: {
          role,
          ...params
        }
      });
      return response.data;
    }
  } catch (error: any) {
    console.error(`Error fetching ${role}s:`, {
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.response?.data?.message,
      url: error.config?.url,
      params: error.config?.params
    });
    
    // Handle specific error cases
    if (error.response?.status === 401) {
      // Check if it's due to no dentists in clinic vs authentication issue
      const errorMsg = error.response?.data?.message || '';
      if (errorMsg.includes('dentist') || errorMsg.includes('clinic')) {
        return {
          success: false,
          data: [],
          message: `No ${role}s available for this clinic. Please contact administration.`,
          page: 1,
          limit: 0,
          total: 0,
          totalPages: 1
        };
      } else {
        throw new Error('Authentication failed. Please log in again.');
      }
    } else if (error.response?.status === 404) {
      return {
        success: true,
        data: [],
        message: `No ${role}s found.`,
        page: 1,
        limit: 0,
        total: 0,
        totalPages: 1
      };
    }
    
    const errorMessage = error.response?.data?.message || error.message || `Failed to fetch ${role}s`;
    throw new Error(errorMessage);
  }
};

export const userService = {
  updateProfile,
  uploadProfileImage,
  getUsersByRole,
  validateUserToken,
  checkUserPermission
};