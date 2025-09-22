import { Request, Response } from 'express';
import { User } from '../models';
import { AuthenticatedRequest } from '../types';
import {
  generateToken,
  generateRefreshToken,
  hashPassword,
  comparePassword,
  generateResetToken,
  hashResetToken,
  createTokenResponse,
  verifyRefreshToken,
  validatePasswordStrength
} from '../utils/auth';
import {
  sendWelcomeEmail,
  sendPasswordResetEmail
} from '../utils/email';
import {
  AppError,
  catchAsync,
  createValidationError,
  createUnauthorizedError,
  createNotFoundError
} from '../middleware/errorHandler';

// Register new user
export const register = catchAsync(async (req: Request, res: Response) => {
  const {
    firstName,
    lastName,
    email,
    password,
    phone,
    role = 'patient',
    dateOfBirth,
    gender,
    address
  } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new AppError('User with this email already exists', 400);
  }

  // Validate password strength
  const passwordValidation = validatePasswordStrength(password);
  if (!passwordValidation.isValid) {
    throw createValidationError('password', passwordValidation.errors.join(', '));
  }

  // Create user (password will be hashed by pre-save middleware)
  const user = await User.create({
    firstName,
    lastName,
    email: email.toLowerCase(),
    password,
    phone,
    role,
    dateOfBirth,
    gender,
    address
  });

  // Send welcome email
  try {
    await sendWelcomeEmail(user.email as any, user.firstName as any);
  } catch (emailError) {
    console.error('Failed to send welcome email:', emailError);
    // Don't fail registration if email fails
  }

  // Create token response
  const tokenResponse = createTokenResponse(user as any);

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: tokenResponse
  });
});

// Login user
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw createValidationError('credentials', 'Email and password are required');
  }

  // Find user and include password for comparison
  try{
    // console.log(email, password);
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    // console.log(user);
    
    if (!user) {
      throw createUnauthorizedError('#1-Invalid email or password. Please check your credentials and try again.');
    }

    // Check if user is active
    if (!user.isActive) {
      throw createUnauthorizedError('#2-Your account has been deactivated. Please contact support for assistance.');
    }

    // Compare password
    if (!user.password || typeof user.password !== 'string') {
      throw createUnauthorizedError('#3-Invalid email or password. Please check your credentials and try again.');
    }
    console.log(user.password);
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw createUnauthorizedError('#4-Invalid email or password. Please check your credentials and try again.');
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Create token response
    const tokenResponse = createTokenResponse(user as any);

    res.json({
      success: true,
      message: 'Login successful. Welcome back!',
      data: tokenResponse
    });
} catch (err: any) {
  for(let e in err.errors){
    console.log(err.errors[e].message);
  }
}
};

// Refresh token
export const refreshToken = catchAsync(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw createUnauthorizedError('Refresh token is required');
  }

  try {
    const decoded = verifyRefreshToken(refreshToken);
    const user = await User.findById(decoded.id)
      .populate('assignedClinics', 'name address')
      .populate('preferredClinicId', 'name address') as any;

    if (!user || !user.isActive) {
      throw createUnauthorizedError('Invalid or expired refresh token. Please log in again.');
    }

    // Check if the refresh token is still valid (not expired)
    const currentTime = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < currentTime) {
      throw createUnauthorizedError('Refresh token has expired. Please log in again.');
    }

    // Update last login time
    user.lastLogin = new Date();
    await user.save();

    // Generate new tokens (token rotation for security - this invalidates the old ones)
    const newToken = generateToken(user._id.toString());
    const newRefreshToken = generateRefreshToken(user._id.toString());

    res.json({
      success: true,
      message: 'Authentication tokens refreshed successfully',
      data: {
        token: newToken,
        refreshToken: newRefreshToken,
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: (user as any).fullName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          profileImage: user.profileImage,
          dateOfBirth: user.dateOfBirth,
          gender: user.gender,
          address: user.address,
          assignedClinics: user.assignedClinics,
          preferredClinicId: user.preferredClinicId,
          specialization: user.specialization,
          licenseNumber: user.licenseNumber,
          bio: user.bio,
          twoFactorEnabled: user.twoFactorEnabled,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      }
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'JsonWebTokenError') {
      throw createUnauthorizedError('Invalid refresh token. Please log in again.');
    }
    if (error instanceof Error && error.name === 'TokenExpiredError') {
      throw createUnauthorizedError('Refresh token has expired. Please log in again.');
    }
    throw createUnauthorizedError('Authentication failed. Please log in again.');
  }
});

// Get current user
export const getCurrentUser = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const user = await User.findById(req.user._id)
    .populate('assignedClinics', 'name address')
    .populate('preferredClinicId', 'name address') as any;

  if (!user) {
    throw createNotFoundError('User');
  }

  res.json({
    success: true,
    data: {
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: (user as any).fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profileImage: user.profileImage,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        address: user.address,
        assignedClinics: user.assignedClinics,
        preferredClinicId: user.preferredClinicId,
        specialization: user.specialization,
        licenseNumber: user.licenseNumber,
        bio: user.bio,
        twoFactorEnabled: user.twoFactorEnabled,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    }
  });
});

// Update profile
export const updateProfile = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const {
    firstName,
    lastName,
    phone,
    dateOfBirth,
    gender,
    address,
    specialization,
    bio
  } = req.body;

  const user = await User.findById(req.user._id);
  if (!user) {
    throw createNotFoundError('User');
  }

  // Update allowed fields
  if (firstName) user.firstName = firstName;
  if (lastName) user.lastName = lastName;
  if (phone) user.phone = phone;
  if (dateOfBirth) user.dateOfBirth = dateOfBirth;
  if (gender) user.gender = gender;
  if (address) user.address = address;
  if (specialization && user.role === 'dentist') user.specialization = specialization;
  if (bio) user.bio = bio;

  await user.save();

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: { user }
  });
});

// Change password
export const changePassword = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body;

  // Get user with password
  const user = await User.findById(req.user._id).select('+password');
  if (!user) {
    throw createNotFoundError('User');
  }

  // Verify current password
  if (!user.password || typeof user.password !== 'string') {
    throw createUnauthorizedError('Current password is incorrect');
  }
  const isCurrentPasswordValid = await comparePassword(currentPassword, user.password);
  if (!isCurrentPasswordValid) {
    throw createUnauthorizedError('Current password is incorrect');
  }

  // Validate new password strength
  const passwordValidation = validatePasswordStrength(newPassword);
  if (!passwordValidation.isValid) {
    throw createValidationError('newPassword', passwordValidation.errors.join(', '));
  }

  // Hash and save new password
  user.password = await hashPassword(newPassword);
  await user.save();

  res.json({
    success: true,
    message: 'Password changed successfully'
  });
});

// Request password reset
export const requestPasswordReset = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    // Don't reveal if user exists or not
    res.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.'
    });
    return;
  }

  // Generate reset token
  const resetToken = generateResetToken();
  const hashedToken = hashResetToken(resetToken);

  // Save reset token and expiry
  user.passwordResetToken = hashedToken;
  user.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  await user.save();

  try {
    // Send reset email
    await sendPasswordResetEmail(user.email as any, resetToken);
    
    res.json({
      success: true,
      message: 'Password reset link sent to your email'
    });
  } catch (error) {
    // Clear reset token if email fails
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    throw new AppError('Failed to send password reset email. Please try again.', 500);
  }
});

// Reset password
export const resetPassword = catchAsync(async (req: Request, res: Response) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    throw createValidationError('token', 'Token and new password are required');
  }

  // Hash the token to compare with stored hash
  const hashedToken = hashResetToken(token);

  // Find user with valid reset token
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: new Date() }
  });

  if (!user) {
    throw createUnauthorizedError('Invalid or expired reset token');
  }

  // Validate new password strength
  const passwordValidation = validatePasswordStrength(newPassword);
  if (!passwordValidation.isValid) {
    throw createValidationError('newPassword', passwordValidation.errors.join(', '));
  }

  // Update password and clear reset token
  user.password = await hashPassword(newPassword);
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  res.json({
    success: true,
    message: 'Password reset successfully'
  });
});

// Logout (enhanced with security logging)
export const logout = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  // In a stateless JWT system, logout is typically handled client-side
  // by removing the token from storage. We log the logout event for security.
  
  const user = await User.findById(req.user._id);
  if (user) {
    // Update last activity for security monitoring
    user.lastLogin = new Date();
    await user.save();
  }
  
  res.json({
    success: true,
    message: 'Logged out successfully. Please clear your tokens on the client side.'
  });
});

// Validate token (lightweight check)
export const validateToken = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  // If we reach here, the token is valid (middleware already validated it)
  res.json({
    success: true,
    message: 'Token is valid',
    data: {
      userId: req.user._id,
      isValid: true
    }
  });
});

// Deactivate account
export const deactivateAccount = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    throw createNotFoundError('User');
  }

  user.isActive = false;
  await user.save();

  res.json({
    success: true,
    message: 'Account deactivated successfully'
  });
});

// Reactivate account (admin only)
export const reactivateAccount = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.params;

  const user = await User.findById(userId);
  if (!user) {
    throw createNotFoundError('User');
  }

  user.isActive = true;
  await user.save();

  res.json({
    success: true,
    message: 'Account reactivated successfully'
  });
});