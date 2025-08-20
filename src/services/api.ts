import axios from 'axios';
import type { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import toast from 'react-hot-toast';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // Increased timeout
  headers: {
    'Content-Type': 'application/json',
  },
  // Add retry configuration
  maxRedirects: 3,
  validateStatus: (status) => {
    return status >= 200 && status < 300; // Only accept 2xx status codes
  },
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          // Unauthorized - redirect to login
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          // Don't redirect during API calls to prevent navigation loops
          // window.location.href = '/login';
          toast.error('Session expired. Please login again.');
          break;
        case 403:
          toast.error('Access denied. You don\'t have permission for this action.');
          break;
        case 404:
          // Provide more context for 404 errors
          if (data && typeof data === 'object' && 'message' in data) {
            // Check if the error is specifically about /appointments endpoint
            if ((data as any).message.includes('/appointments')) {
              toast.error("Resource not found. The appointment service is currently unavailable.");
            } else if ((data as any).url && (data as any).url.includes('/appointments/available-slots')) {
              toast.error("Error fetching time slots: The time slot service is currently unavailable.");
            } else {
              toast.error(`Resource not found: ${(data as any).message}`);
            }
          } else if (error.config && error.config.url && error.config.url.includes('/appointments/available-slots')) {
            toast.error("Error fetching time slots: The time slot service is currently unavailable.");
          } else {
            toast.error('Resource not found. The requested endpoint may not exist.');
          }
          break;
        case 422:
          // Validation errors
          if (data && typeof data === 'object' && 'errors' in data) {
            const errors = (data as any).errors;
            Object.values(errors).forEach((error: any) => {
              toast.error(error);
            });
          } else {
            toast.error('Validation failed. Please check your input.');
          }
          break;
        case 500:
          toast.error('Server error. Please try again later.');
          break;
        default:
          toast.error('An error occurred. Please try again.');
      }
    } else if (error.request) {
      // Network error - no response received
      console.error('Network error details:', {
        message: error.message,
        code: error.code,
        errno: (error as any).errno
      });
      
      // Handle ERR_ABORTED errors silently without showing toast messages
      if (error.code === 'ERR_ABORTED') {
        console.warn('Request was aborted:', error.message);
        // Return a resolved promise to prevent error propagation for aborted requests
        return Promise.resolve({ data: null, status: 'aborted' });
      } else if (error.code === 'ERR_CONNECTION_RESET') {
        toast.error('Connection was reset. Please check your internet connection and try again.');
      } else if (error.code === 'ECONNREFUSED') {
        toast.error('Cannot connect to server. Please ensure the backend server is running.');
      } else if (error.code === 'ETIMEDOUT') {
        toast.error('Request timed out. Please try again.');
      } else {
        toast.error('Network error. Please check your connection.');
      }
    } else {
      console.error('Unexpected error:', error);
      toast.error('An unexpected error occurred.');
    }
    
    return Promise.reject(error);
  }
);

// Generic API response type
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}

// Generic API methods
export const apiService = {
  // GET request
  get: async <T>(url: string, params?: any): Promise<ApiResponse<T>> => {
    try {
      const response = await api.get(url, { params });
      
      // Handle nested data structure from backend
      // Backend returns { status: "success", data: { ... } }
      if (response.data && response.data.status === 'success') {
        return {
          success: true,
          data: response.data.data, // Extract the nested data
          message: response.data.message
        };
      }
      
      // Fallback for other response formats
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to fetch data',
      };
    }
  },

  // POST request
  post: async <T>(url: string, data?: any): Promise<ApiResponse<T>> => {
    try {
      console.log('Making POST request to:', url);
      console.log('Request data:', data);
      
      const response = await api.post(url, data);
      
      console.log('POST response received:', {
        status: response.status,
        statusText: response.statusText,
        hasData: !!response.data
      });
      
      // Handle nested data structure from backend
      if (response.data && response.data.status === 'success') {
        return {
          success: true,
          data: response.data.data,
          message: response.data.message
        };
      }
      
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      console.error('POST request failed:', {
        url,
        error: error.message,
        code: error.code,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      
      // Re-throw the error to be handled by the calling function
      throw error;
    }
  },

  // PUT request
  put: async <T>(url: string, data?: any): Promise<ApiResponse<T>> => {
    try {
      const response = await api.put(url, data);
      
      // Handle nested data structure from backend
      if (response.data && response.data.status === 'success') {
        return {
          success: true,
          data: response.data.data,
          message: response.data.message
        };
      }
      
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to update resource',
      };
    }
  },

  // PATCH request
  patch: async <T>(url: string, data?: any): Promise<ApiResponse<T>> => {
    try {
      const response = await api.patch(url, data);
      
      // Handle nested data structure from backend
      if (response.data && response.data.status === 'success') {
        return {
          success: true,
          data: response.data.data,
          message: response.data.message
        };
      }
      
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to update resource',
      };
    }
  },

  // DELETE request
  delete: async <T>(url: string): Promise<ApiResponse<T>> => {
    try {
      const response = await api.delete(url);
      
      // Handle nested data structure from backend
      if (response.data && response.data.status === 'success') {
        return {
          success: true,
          data: response.data.data,
          message: response.data.message
        };
      }
      
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to delete resource',
      };
    }
  },

  // File upload
  upload: async <T>(url: string, file: File, onProgress?: (progress: number) => void): Promise<ApiResponse<T>> => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(progress);
          }
        },
      });

      // Handle nested data structure from backend
      if (response.data && response.data.status === 'success') {
        return {
          success: true,
          data: response.data.data,
          message: response.data.message
        };
      }

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to upload file',
      };
    }
  },
};

// Specific API endpoints
export const endpoints = {
  // Auth endpoints
  auth: {
    login: '/api/v1/auth/login',
    register: '/api/v1/auth/register',
    logout: '/api/v1/auth/logout',
    refresh: '/api/v1/auth/refresh',
    forgotPassword: '/api/v1/auth/forgot-password',
    resetPassword: '/api/v1/auth/reset-password',
    verifyEmail: '/api/v1/auth/verify-email',
  },

  // User endpoints
  users: {
    profile: '/api/v1/users/profile',
    update: '/api/v1/users/profile',
    changePassword: '/api/v1/users/change-password',
    uploadAvatar: '/api/v1/users/avatar',
  },

  // Appointment endpoints
  appointments: {
    list: '/api/v1/appointments',
    create: '/api/v1/appointments',
    get: (id: string) => `/api/v1/appointments/${id}`,
    update: (id: string) => `/api/v1/appointments/${id}`,
    delete: (id: string) => `/api/v1/appointments/${id}`,
    cancel: (id: string) => `/api/v1/appointments/${id}/cancel`,
    reschedule: (id: string) => `/api/v1/appointments/${id}/reschedule`,
    availableSlots: '/api/v1/appointments/available-slots',
  },

  // Patient endpoints
  patients: {
    list: '/api/v1/patients',
    create: '/api/v1/patients',
    get: (id: string) => `/api/v1/patients/${id}`,
    update: (id: string) => `/api/v1/patients/${id}`,
    delete: (id: string) => `/api/v1/patients/${id}`,
    medicalHistory: (id: string) => `/api/v1/patients/${id}/medical-history`,
  },

  // Clinic endpoints
  clinics: {
    list: '/api/v1/clinics',
    create: '/api/v1/clinics',
    get: (id: string) => `/api/v1/clinics/${id}`,
    update: (id: string) => `/api/v1/clinics/${id}`,
    delete: (id: string) => `/api/v1/clinics/${id}`,
    staff: (id: string) => `/api/v1/clinics/${id}/staff`,
    schedule: (id: string) => `/api/v1/clinics/${id}/schedule`,
  },

  // Service endpoints
  services: {
    list: '/api/v1/services',
    create: '/api/v1/services',
    get: (id: string) => `/api/v1/services/${id}`,
    update: (id: string) => `/api/v1/services/${id}`,
    delete: (id: string) => `/api/v1/services/${id}`,
  },

  // Blog endpoints
  blog: {
    posts: '/api/v1/blog/posts',
    create: '/api/v1/blog/posts',
    get: (id: string) => `/api/v1/blog/posts/${id}`,
    update: (id: string) => `/api/v1/blog/posts/${id}`,
    delete: (id: string) => `/api/v1/blog/posts/${id}`,
    categories: '/api/v1/blog/categories',
    comments: (postId: string) => `/api/v1/blog/posts/${postId}/comments`,
  },

  // Notification endpoints
  notifications: {
    list: '/api/v1/notifications',
    markRead: (id: string) => `/api/v1/notifications/${id}/read`,
    markAllRead: '/api/v1/notifications/mark-all-read',
    settings: '/api/v1/notifications/settings',
  },

  // Dashboard endpoints
  dashboard: {
    stats: '/api/v1/dashboard/stats',
    recentAppointments: '/api/v1/dashboard/recent-appointments',
    upcomingAppointments: '/api/v1/dashboard/upcoming-appointments',
    patientStats: '/api/v1/dashboard/patient-stats',
    revenueStats: '/api/v1/dashboard/revenue-stats',
  },
};

export default api;
