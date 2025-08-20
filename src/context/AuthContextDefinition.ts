import { createContext } from 'react';
import type { AuthUser } from '../types';
import type { LoginCredentials, RegisterData } from '../types';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  isInitialized: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  clearError: () => void;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
export type { AuthContextType };