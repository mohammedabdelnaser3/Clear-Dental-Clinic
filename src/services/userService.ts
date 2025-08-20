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

// Get users by role
export const getUsersByRole = async (role: string, params?: {
  clinicId?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<User>> => {
  try {
    const response = await api.get<PaginatedResponse<User>>('/users', {
      params: {
        role,
        ...params
      }
    });
    return response.data;
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || `Failed to fetch ${role}s`;
    throw new Error(errorMessage);
  }
};

export const userService = {
  updateProfile,
  uploadProfileImage,
  getUsersByRole
};