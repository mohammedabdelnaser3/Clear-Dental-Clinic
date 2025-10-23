/* eslint-disable react-refresh/only-export-components */
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { ReactNode } from 'react';
import type { AuthUser } from '../types';
import type { LoginCredentials } from '../types';
import type { RegisterData } from '../types';
// No need to import RefreshTokenResponse as we're handling the response directly
import { loginUser, registerUser, logoutUser, getCurrentUser, changePassword as changePasswordService, validateToken, refreshToken } from '../services/authService';
import { AuthContext } from './AuthContextDefinition';

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const initializingRef = useRef<boolean>(false);
  const refreshingRef = useRef<boolean>(false);

  const validateAndSetUser = useCallback(async (token: string) => {
    try {
      // First try lightweight token validation
      const isValid = await validateToken();
      if (!isValid) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        setUser(null);
        return false;
      }
      
      // If token is valid, get full user data
      const currentUser = await getCurrentUser();
      setUser({ ...currentUser, token });
      return true;
    } catch (err) {
      try {
        // Try to refresh token if validation fails
        const refreshResult = await refreshToken();
        if (refreshResult?.token) {
          // Store the new token
          localStorage.setItem('token', refreshResult.token);
          // Handle refresh token if available in the response
          const refreshTokenValue = (refreshResult as any).refreshToken;
          if (refreshTokenValue) {
            localStorage.setItem('refreshToken', refreshTokenValue);
          }
          setUser({ ...refreshResult.user, token: refreshResult.token });
          return true;
        }
      } catch (refreshErr) {
        console.error('Token refresh failed:', refreshErr);
      }
      
      // If refresh also fails, clear everything
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      setUser(null);
      console.error('Token validation failed:', err);
      return false;
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      // Prevent multiple initialization attempts
      if (initializingRef.current || isInitialized) {
        return;
      }
      
      initializingRef.current = true;
      
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (token) {
          await validateAndSetUser(token);
        }
      } catch (err) {
        console.error('Failed to initialize auth:', err);
        // Clear tokens on initialization failure
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        setUser(null);
      } finally {
        setLoading(false);
        setIsInitialized(true);
        initializingRef.current = false;
      }
    };

    initAuth();
  }, [validateAndSetUser, isInitialized]);

  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      setLoading(true);
      setError(null);
      const response = await loginUser(credentials);
      
      // Handle nested response structure from backend
      const userData = ('user' in response ? response.user : response) as AuthUser;
      const token = response.token;
      const refreshTokenValue = response.refreshToken;
      
      if (token) {
        localStorage.setItem('token', token);
        if (refreshTokenValue) {
          localStorage.setItem('refreshToken', refreshTokenValue);
        }
        setUser({ ...userData, token, refreshToken: refreshTokenValue });
      } else {
        throw new Error('No token received from server');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed. Please check your credentials and try again.';
      setError(errorMessage);
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      setUser(null);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await registerUser(data);
      
      // Handle nested response structure from backend
      const userData = ('user' in response ? response.user : response) as AuthUser;
      const token = response.token;
      const refreshTokenValue = response.refreshToken;
      
      if (token) {
        localStorage.setItem('token', token);
        if (refreshTokenValue) {
          localStorage.setItem('refreshToken', refreshTokenValue);
        }
        setUser({ ...userData, token, refreshToken: refreshTokenValue });
      } else {
        throw new Error('No token received from server');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed. Please try again.';
      setError(errorMessage);
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      setUser(null);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      setLoading(true);
      await logoutUser();
    } catch (err: unknown) {
      console.error('Logout error:', err);
    } finally {
      // Always clear tokens and user state, even if logout request fails
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      setUser(null);
      setLoading(false);
    }
  }, []);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    try {
      setLoading(true);
      setError(null);
      await changePasswordService(currentPassword, newPassword);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to change password';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const refreshUser = useCallback(async () => {
    // Prevent multiple refresh attempts
    if (refreshingRef.current) {
      return;
    }
    
    refreshingRef.current = true;
    
    try {
      const token = localStorage.getItem('token');
      if (token && user) {
        await validateAndSetUser(token);
      }
    } catch (err) {
      console.error('Failed to refresh user:', err);
      // If refresh fails, try to get a new token
      const refreshResult = await refreshToken();
      if (refreshResult?.token) {
        setUser({ ...refreshResult.user, token: refreshResult.token });
      } else {
        // If all fails, logout user
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        setUser(null);
      }
    } finally {
      refreshingRef.current = false;
    }
  }, [user, validateAndSetUser]);

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    user,
    loading,
    error,
    isInitialized,
    login,
    register,
    logout,
    changePassword,
    clearError,
    refreshUser,
  }), [user, loading, error, isInitialized, login, register, logout, changePassword, clearError, refreshUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};