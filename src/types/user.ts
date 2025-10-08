export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: UserRole;
  profileImage?: string;
  assignedClinics?: string[];
  preferredClinicId?: string; // For patients
  specialization?: string; // For dentists
  twoFactorEnabled?: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  dateOfBirth?: string;
  gender?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  licenseNumber?: string;
  bio?: string;
  permissions?: string[];
}

export type UserRole = 'patient' | 'dentist' | 'staff' | 'admin' | 'super_admin';

export interface AuthUser extends User {
  token: string;
  refreshToken?: string;
  lastLogin?: Date;
  fullName?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RefreshTokenResponse {
  token: string;
  refreshToken: string;
  user: User;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email?: string;
  gender: string;
  password: string;
  phone: string;
  role?: UserRole;
}