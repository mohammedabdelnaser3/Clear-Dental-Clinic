import axios from 'axios';
import type { AuthUser } from '../types';
import type { LoginCredentials, RegisterData } from '../types';
import { API_URL } from '../config/constants';

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Try to refresh token
      const refreshResult = await refreshToken();
      if (refreshResult?.token) {
        // Update the authorization header and retry the request
        originalRequest.headers.Authorization = `Bearer ${refreshResult.token}`;
        return api(originalRequest);
      } else {
        // Refresh failed, redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// Login user
export const loginUser = async (credentials: LoginCredentials): Promise<AuthUser> => {
  try {
    const response = await api.post('/api/v1/auth/login', credentials);
    
    const { user, token, refreshToken } = response.data.data;
    
    if (token) {
      // Store token in localStorage and set default header
      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }
    }
    
    const result = { ...user, token };
    return result;
      } catch (_error: any) {
      if (import.meta.env.DEV) {
        console.error('Full error:', _error.response?.data, _error.stack);
      }
      const errorMessage = _error.response?.data?.message || _error.message || 'Login failed';
    throw new Error(errorMessage);
  }
};

// Register user
export const registerUser = async (data: RegisterData): Promise<AuthUser> => {
  try {
    const response = await api.post('/api/v1/auth/register', data);
    const { token, refreshToken: refreshTokenValue, user } = response.data.data; // Extract from nested data structure
    
    // Store tokens in localStorage
    if (token) {
      localStorage.setItem('token', token);
    }
    if (refreshTokenValue) {
      localStorage.setItem('refreshToken', refreshTokenValue);
    }
    
    return { ...user, token };
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'Registration failed';
    throw new Error(errorMessage);
  }
};

// Logout user
export const logoutUser = async (): Promise<void> => {
  try {
    await api.post('/api/v1/auth/logout');
  } catch (_error: unknown) {
    if (import.meta.env.DEV) {
      console.error('Logout error:', _error);
    }
  } finally {
    // Always remove token
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
  }
};

// Get current user
export const getCurrentUser = async (): Promise<AuthUser> => {
  try {
    const response = await api.get('/api/v1/auth/me');
    return response.data.data.user; // Fix: Extract from nested data structure
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to get user data';
    throw new Error(errorMessage);
  }
};

// Reset password request
export const requestPasswordReset = async (email: string): Promise<void> => {
  try {
    await api.post('/api/v1/auth/request-password-reset', { email });
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to request password reset';
    throw new Error(errorMessage);
  }
};

// Reset password with token
export const resetPassword = async (token: string, newPassword: string): Promise<void> => {
  try {
    await api.post('/api/v1/auth/reset-password', { token, newPassword });
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to reset password';
    throw new Error(errorMessage);
  }
};

// Change password for authenticated user
export const changePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
  try {
    await api.post('/api/v1/auth/change-password', { currentPassword, newPassword });
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to change password';
    throw new Error(errorMessage);
  }
};

// Validate token (lightweight check with client-side expiration check)
export const validateToken = async (): Promise<boolean> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return false;
    
    // First check token expiration client-side to avoid unnecessary API calls
    try {
      const tokenPayload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      
      // If token is expired, don't make API call
      if (tokenPayload.exp < currentTime) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        return false;
      }
      
      // If token expires in the next 5 minutes, consider it as requiring refresh
      const fiveMinutesFromNow = currentTime + (5 * 60);
      if (tokenPayload.exp < fiveMinutesFromNow) {
        // Try to refresh token proactively
        const refreshResult = await refreshToken();
        return !!refreshResult?.token;
      }
      
    } catch (_decodeError) {
      // If token is malformed, remove it and make API call to be sure
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      return false;
    }
    
    // Use the lightweight validate endpoint for server-side validation
    await api.get('/api/v1/auth/validate');
    return true;
  } catch (_error) {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    return false;
  }
};

// Refresh token
export const refreshToken = async (): Promise<{ token: string; user: any } | null> => {
  try {
    const storedRefreshToken = localStorage.getItem('refreshToken');
    if (!storedRefreshToken) {
      return null;
    }
    
    const response = await api.post('/api/v1/auth/refresh-token', {
      refreshToken: storedRefreshToken
    });
    const { token, refreshToken: newRefreshToken, user } = response.data.data;
    
    if (token) {
      localStorage.setItem('token', token);
    }
    if (newRefreshToken) {
      localStorage.setItem('refreshToken', newRefreshToken);
    }
    
    return { token, user };
  } catch (_error) {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    return null;
  }
};

export default api;