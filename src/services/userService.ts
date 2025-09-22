import api from './api';
import type { User, PaginatedResponse } from '../types';

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
  bio?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
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
    } catch (decodeError) {
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
    const response = await api.put<ApiResponse<{ user: User }>>('/auth/profile', profileData);
    return response.data.data.user;
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to update profile';
    throw new Error(errorMessage);
  }
};

// Upload profile image
export const uploadProfileImage = async (file: File): Promise<{ profileImage: string }> => {
  try {
    const formData = new FormData();
    formData.append('profileImage', file);
    
    const response = await api.post<ApiResponse<{ profileImage: string }>>('/users/profile-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
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
      const response = await api.get('/api/v1/users/dentists', {
        params: {
          clinicId: params?.clinicId
        }
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
          pagination: {
            page: 1,
            limit: 0,
            total: 0,
            totalPages: 1
          }
        };
      }
      
      return {
        success: true,
        data: dentists,
        pagination: {
          page: 1,
          limit: dentists.length,
          total: dentists.length,
          totalPages: 1
        }
      };
    } else {
      // Use general users endpoint for other roles
      const response = await api.get<PaginatedResponse<User>>('/users', {
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
          pagination: {
            page: 1,
            limit: 0,
            total: 0,
            totalPages: 1
          }
        };
      } else {
        throw new Error('Authentication failed. Please log in again.');
      }
    } else if (error.response?.status === 404) {
      return {
        success: true,
        data: [],
        message: `No ${role}s found.`,
        pagination: {
          page: 1,
          limit: 0,
          total: 0,
          totalPages: 1
        }
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