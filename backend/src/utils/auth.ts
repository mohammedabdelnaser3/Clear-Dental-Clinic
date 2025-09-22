import jwt, { SignOptions } from 'jsonwebtoken';
import { StringValue } from 'ms';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { IUser } from '../types';

// Generate JWT token
export const generateToken = (userId: string): string => {
  const options: SignOptions = {
    expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as StringValue
  };
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET!,
    options
  );
};

// Generate refresh token
export const generateRefreshToken = (userId: string): string => {
  const options: SignOptions = {
    expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '30d') as StringValue
  };
  return jwt.sign(
    { id: userId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET!,
    options
  );
};

// Verify JWT token
export const verifyToken = (token: string): any => {
  return jwt.verify(token, process.env.JWT_SECRET!);
};

// Verify refresh token
export const verifyRefreshToken = (token: string): any => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET!);
};

// Hash password
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = await bcrypt.genSaltSync(10);
  return await bcrypt.hash(password, saltRounds);
};

// Compare password
export const comparePassword = async (
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> => {
  return await bcrypt.compare(plainPassword, hashedPassword);
};

// Generate random token for password reset
export const generateResetToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

// Hash reset token
export const hashResetToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

// Generate OTP for two-factor authentication
export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Create token response object
export const createTokenResponse = (user: IUser) => {
  const token = generateToken(user._id.toString());
  const refreshToken = generateRefreshToken(user._id.toString());
  
  return {
    token,
    refreshToken,
    user: {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      profileImage: user.profileImage,
      preferredClinicId: user.preferredClinicId,
      assignedClinics: user.assignedClinics
    }
  };
};

// Extract user ID from token
export const extractUserIdFromToken = (token: string): string | null => {
  try {
    const decoded = verifyToken(token) as any;
    return decoded.id;
  } catch (error) {
    return null;
  }
};

// Check if token is expired
export const isTokenExpired = (token: string): boolean => {
  try {
    const decoded = jwt.decode(token) as any;
    if (!decoded || !decoded.exp) {
      return true;
    }
    
    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
  } catch (error) {
    return true;
  }
};

// Generate secure random string
export const generateSecureRandom = (length: number = 32): string => {
  return crypto.randomBytes(length).toString('hex');
};

// Create password reset URL
export const createPasswordResetURL = (token: string): string => {
  const frontendURL = process.env.FRONTEND_URL || 'http://localhost:3000';
  return `${frontendURL}/reset-password?token=${token}`;
};

// Create email verification URL
export const createEmailVerificationURL = (token: string): string => {
  const frontendURL = process.env.FRONTEND_URL || 'http://localhost:3000';
  return `${frontendURL}/verify-email?token=${token}`;
};

// Validate password strength
export const validatePasswordStrength = (password: string): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[@$!%*?&]/.test(password)) {
    errors.push('Password must contain at least one special character (@$!%*?&)');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Generate API key
export const generateApiKey = (): string => {
  const prefix = 'dk_'; // dental clinic key prefix
  const randomPart = crypto.randomBytes(24).toString('hex');
  return `${prefix}${randomPart}`;
};

// Hash API key for storage
export const hashApiKey = (apiKey: string): string => {
  return crypto.createHash('sha256').update(apiKey).digest('hex');
};                                          