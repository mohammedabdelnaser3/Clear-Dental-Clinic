import { useContext } from 'react';
import { AuthContext } from '../context/AuthContextDefinition';

/**
 * Custom hook for accessing authentication context
 * 
 * Provides access to:
 * - user: The currently authenticated user or null
 * - loading: Boolean indicating if auth operations are in progress
 * - error: Any error messages from auth operations
 * - login: Function to log in a user
 * - register: Function to register a new user
 * - logout: Function to log out the current user
 * - clearError: Function to clear any auth errors
 * 
 * @returns The authentication context
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  // Add computed properties
  return {
    ...context,
    // Computed property to easily check if user is authenticated
    isAuthenticated: !!context.user,
  };
};