import { Request, Response } from 'express';
import { User } from '../models';
import { AuthenticatedRequest } from '../types';
import {
  getPaginationParams,
  createPaginatedResponse,
  createSearchRegex
} from '../utils/helpers';
import {
  AppError,
  catchAsync,
  createNotFoundError,
  createValidationError
} from '../middleware/errorHandler';
import { uploadProfileImage } from '../utils/upload';

// Get all users (admin only)
export const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const { page, limit, skip } = getPaginationParams(req);
  const { search, role, isActive, clinicId } = req.query;

  // Build query
  const query: any = {};

  if (search) {
    const searchRegex = createSearchRegex(search as string);
    query.$or = [
      { firstName: searchRegex },
      { lastName: searchRegex },
      { email: searchRegex },
      { phone: searchRegex }
    ];
  }

  if (role) {
    query.role = role;
  }

  if (isActive !== undefined) {
    query.isActive = isActive === 'true';
  }

  if (clinicId) {
    query.assignedClinics = clinicId;
  }

  // Get users with pagination
  const [users, total] = await Promise.all([
    User.find(query)
      .populate('assignedClinics', 'name address')
      .populate('preferredClinicId', 'name address')
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments(query)
  ]);

  const paginatedResponse = createPaginatedResponse(users, total, page, limit);

  res.json({
    success: true,
    data: paginatedResponse
  });
});

// Get user by ID
export const getUserById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  console.log('getUserById called with ID:', id);

  const user = await User.findById(id)
    .populate('assignedClinics', 'name address phone')
    .populate('preferredClinicId', 'name address phone')
    .select('-password');

  console.log('User found:', user ? 'Yes' : 'No');
  if (user) {
    console.log('User data:', {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role
    });
  }

  if (!user) {
    throw createNotFoundError('User');
  }

  res.json({
    success: true,
    data: user
  });
});

// Update user (admin only)
export const updateUser = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    firstName,
    lastName,
    email,
    phone,
    role,
    isActive,
    assignedClinics,
    preferredClinicId,
    specialization,
    licenseNumber,
    bio
  } = req.body;

  const user = await User.findById(id);
  if (!user) {
    throw createNotFoundError('User');
  }

  // Check if email is being changed and if it's already taken
  if (email && email !== user.email) {
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw createValidationError('email', 'Email is already taken');
    }
    user.email = email.toLowerCase();
  }

  // Update fields
  if (firstName) user.firstName = firstName;
  if (lastName) user.lastName = lastName;
  if (phone) user.phone = phone;
  if (role) user.role = role;
  if (isActive !== undefined) user.isActive = isActive;
  if (assignedClinics) user.assignedClinics = assignedClinics;
  if (preferredClinicId) user.preferredClinicId = preferredClinicId;
  if (specialization) user.specialization = specialization;
  if (licenseNumber) user.licenseNumber = licenseNumber;
  if (bio) user.bio = bio;

  await user.save();

  // Populate and return updated user
  const updatedUser = await User.findById(id)
    .populate('assignedClinics', 'name address')
    .populate('preferredClinicId', 'name address')
    .select('-password');

  res.json({
    success: true,
    message: 'User updated successfully',
    data: { user: updatedUser }
  });
});

// Delete user (admin only)
export const deleteUser = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const user = await User.findById(id);
  if (!user) {
    throw createNotFoundError('User');
  }

  // Soft delete by deactivating
  user.isActive = false;
  await user.save();

  res.json({
    success: true,
    message: 'User deleted successfully'
  });
});

// Get users by role
export const getUsersByRole = catchAsync(async (req: Request, res: Response) => {
  const { role } = req.params;
  const { page, limit, skip } = getPaginationParams(req);
  const { clinicId, isActive = 'true' } = req.query;

  const query: any = {
    role,
    isActive: isActive === 'true'
  };

  if (clinicId) {
    query.assignedClinics = clinicId;
  }

  const [users, total] = await Promise.all([
    User.find(query)
      .populate('assignedClinics', 'name')
      .select('firstName lastName email phone specialization licenseNumber')
      .sort({ firstName: 1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments(query)
  ]);

  const paginatedResponse = createPaginatedResponse(users, total, page, limit);

  res.json({
    success: true,
    data: paginatedResponse
  });
});

// Get dentists with enhanced error handling
export const getDentists = catchAsync(async (req: Request, res: Response) => {
  const { clinicId } = req.query;
  
  console.log('getDentists called with clinicId:', clinicId);
  
  const query: any = {
    role: 'dentist',
    isActive: true
  };

  if (clinicId) {
    query.assignedClinics = clinicId;
  }

  console.log('Dentist query:', JSON.stringify(query, null, 2));

  const dentists = await User.find(query)
    .populate('assignedClinics', 'name')
    .select('firstName lastName email phone specialization licenseNumber profileImage')
    .sort({ firstName: 1 });

  console.log(`Found ${dentists.length} dentists for query`);

  // If specific clinic requested but no dentists found, return 404 instead of 401
  if (clinicId && dentists.length === 0) {
    // First verify the clinic exists
    const Clinic = require('../models/Clinic').default;
    const clinic = await (Clinic as any).findById(clinicId);
    
    if (!clinic) {
      return res.status(404).json({
        success: false,
        message: 'Clinic not found',
        data: { dentists: [] }
      });
    }
    
    // Clinic exists but has no dentists assigned
    return res.status(200).json({
      success: true,
      data: { dentists: [] },
      message: `No dentists are currently assigned to clinic "${clinic.name}". Please contact administration to assign dentists.`
    });
  }

  res.json({
    success: true,
    data: { dentists },
    message: dentists.length > 0 ? undefined : 'No dentists found in the system'
  });
});

// Assign clinic to user
export const assignClinicToUser = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { clinicId } = req.body;

  const user = await User.findById(userId);
  if (!user) {
    throw createNotFoundError('User');
  }

  // Add clinic to assigned clinics if not already assigned
  if (!user.assignedClinics.includes(clinicId)) {
    user.assignedClinics.push(clinicId);
    await user.save();
  }

  res.json({
    success: true,
    message: 'Clinic assigned to user successfully'
  });
});

// Remove clinic from user
export const removeClinicFromUser = catchAsync(async (req: Request, res: Response) => {
  const { userId, clinicId } = req.params;

  const user = await User.findById(userId);
  if (!user) {
    throw createNotFoundError('User');
  }

  // Remove clinic from assigned clinics
  user.assignedClinics = user.assignedClinics.filter(
    clinic => clinic.toString() !== clinicId
  );

  // If this was the preferred clinic, clear it
  if (user.preferredClinicId?.toString() === clinicId) {
    user.preferredClinicId = undefined;
  }

  await user.save();

  res.json({
    success: true,
    message: 'Clinic removed from user successfully'
  });
});

// Set preferred clinic
export const setPreferredClinic = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { clinicId } = req.body;

  const user = await User.findById(req.user._id);
  if (!user) {
    throw createNotFoundError('User');
  }

  // Check if user is assigned to this clinic
  if (!user.assignedClinics.includes(clinicId)) {
    throw createValidationError('clinicId', 'You are not assigned to this clinic');
  }

  user.preferredClinicId = clinicId;
  await user.save();

  res.json({
    success: true,
    message: 'Preferred clinic set successfully'
  });
});

// Get user's assigned clinics
export const getUserClinics = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const user = await User.findById(id).populate('assignedClinics', 'name address phone email');
  if (!user) {
    throw createNotFoundError('User');
  }

  // Transform the clinic data to match the expected frontend format
  const clinics = user.assignedClinics.map((clinic: any) => ({
    id: clinic._id,
    clinicId: clinic._id,
    name: clinic.name,
    clinicName: clinic.name,
    branchName: clinic.branchName || null,
    address: clinic.address || {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    },
    phone: clinic.phone || '',
    email: clinic.email || '',
    isPrimary: user.preferredClinicId?.toString() === clinic._id.toString()
  }));

  res.json({
    success: true,
    data: clinics,
    message: clinics.length > 0 ? undefined : 'No clinics assigned to this user'
  });
});

// Get user's availability schedule
export const getUserAvailability = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const user = await User.findById(id);
  if (!user) {
    throw createNotFoundError('User');
  }

  // For now, return empty availability since we don't have a specific availability model
  // In a real application, you would fetch from a UserAvailability or Schedule model
  const availability = [];

  res.json({
    success: true,
    data: availability,
    message: 'User availability retrieved successfully'
  });
});

// Update user's availability schedule
export const updateUserAvailability = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { availability } = req.body;

  const user = await User.findById(id);
  if (!user) {
    throw createNotFoundError('User');
  }

  // For now, just return the provided availability since we don't have a specific availability model
  // In a real application, you would save to a UserAvailability or Schedule model
  
  res.json({
    success: true,
    data: availability || [],
    message: 'User availability updated successfully'
  });
});

// Upload profile image
export const uploadUserProfileImage = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  console.log('Upload profile image called');
  console.log('File received:', req.file ? 'Yes' : 'No');
  console.log('User:', req.user ? req.user._id : 'No user');

  if (!req.file) {
    console.log('No file in request');
    throw createValidationError('file', 'Profile image is required');
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    console.log('User not found:', req.user._id);
    throw createNotFoundError('User');
  }

  console.log('Uploading file:', req.file.originalname, 'Size:', req.file.size);

  try {
    // Upload image to cloud storage
    const uploadResult = await uploadProfileImage(req.file, user._id.toString());
    console.log('Upload successful:', uploadResult.secure_url);

    // Update user profile image
    user.profileImage = uploadResult.secure_url;
    await user.save();

    res.json({
      success: true,
      message: 'Profile image uploaded successfully',
      data: {
        profileImage: uploadResult.secure_url
      }
    });
  } catch (uploadError) {
    console.error('Upload error:', uploadError);
    throw uploadError;
  }
});

// Get user statistics (admin only)
export const getUserStatistics = catchAsync(async (req: Request, res: Response) => {
  const [totalUsers, activeUsers, usersByRole] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ isActive: true }),
    User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ])
  ]);

  // Format role statistics
  const roleStats = usersByRole.reduce((acc, item) => {
    acc[item._id] = item.count;
    return acc;
  }, {});

  res.json({
    success: true,
    data: {
      totalUsers,
      activeUsers,
      inactiveUsers: totalUsers - activeUsers,
      usersByRole: roleStats
    }
  });
});

// Search users
export const searchUsers = catchAsync(async (req: Request, res: Response) => {
  const { q: searchTerm } = req.query;
  const { page, limit, skip } = getPaginationParams(req);

  if (!searchTerm) {
    throw createValidationError('q', 'Search term is required');
  }

  const searchRegex = createSearchRegex(searchTerm as string);
  const query = {
    $or: [
      { firstName: searchRegex },
      { lastName: searchRegex },
      { email: searchRegex },
      { phone: searchRegex }
    ],
    isActive: true
  };

  const [users, total] = await Promise.all([
    User.find(query)
      .select('firstName lastName email phone role profileImage')
      .sort({ firstName: 1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments(query)
  ]);

  const paginatedResponse = createPaginatedResponse(users, total, page, limit);

  res.json({
    success: true,
    data: paginatedResponse
  });
});

// Get recently registered users (admin only)
export const getRecentUsers = catchAsync(async (req: Request, res: Response) => {
  const { limit = 10 } = req.query;

  const users = await User.find({ isActive: true })
    .select('firstName lastName email role createdAt')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit as string));

  res.json({
    success: true,
    data: { users }
  });
});