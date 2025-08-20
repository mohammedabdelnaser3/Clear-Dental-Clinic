import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Clinic, User, Appointment, Patient } from '../models';
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
  createValidationError,
  createConflictError
} from '../middleware/errorHandler';
import { uploadClinicImage as uploadClinicImageToCloud } from '../utils/upload';

// Create new clinic
export const createClinic = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const {
    name,
    description,
    address,
    phone,
    email,
    website,
    emergencyContact,
    operatingHours,
    services
  } = req.body;

  // Check if clinic with same name or email already exists
  const existingClinic = await Clinic.findOne({
    $or: [
      { name: { $regex: new RegExp(`^${name}$`, 'i') } },
      { email: email.toLowerCase() }
    ]
  });

  if (existingClinic) {
    if (existingClinic.name.toLowerCase() === name.toLowerCase()) {
      throw createConflictError('Clinic with this name already exists');
    }
    if (existingClinic.email === email.toLowerCase()) {
      throw createConflictError('Clinic with this email already exists');
    }
  }

  const clinic = new Clinic({
    name,
    description,
    address,
    phone,
    email: email.toLowerCase(),
    website,
    emergencyContact,
    operatingHours,
    services,
    createdBy: req.user._id
  });

  await clinic.save();

  res.status(201).json({
    success: true,
    message: 'Clinic created successfully',
    data: { clinic }
  });
});

// Get all clinics
export const getAllClinics = catchAsync(async (req: Request, res: Response) => {
  const { page, limit, skip } = getPaginationParams(req);
  const { search, city, state, service } = req.query;

  // Build query
  const query: any = {};

  if (search) {
    const searchRegex = createSearchRegex(search as string);
    query.$or = [
      { name: searchRegex },
      { description: searchRegex },
      { 'address.street': searchRegex },
      { 'address.city': searchRegex },
      { 'address.state': searchRegex }
    ];
  }

  if (city) {
    query['address.city'] = { $regex: new RegExp(city as string, 'i') };
  }

  if (state) {
    query['address.state'] = { $regex: new RegExp(state as string, 'i') };
  }

  if (service) {
    query.services = { $in: [service] };
  }

  // Get clinics with pagination
  const [clinics, total] = await Promise.all([
    Clinic.find(query)
      .populate('staff', 'firstName lastName role specialization')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Clinic.countDocuments(query)
  ]);

  const paginatedResponse = createPaginatedResponse(clinics, total, page, limit);

  res.json({
    success: true,
    data: paginatedResponse
  });
});

// Get clinic by ID
export const getClinicById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const clinic = await Clinic.findById(id)
    .populate('staff', 'firstName lastName role specialization phone email profileImage');

  if (!clinic) {
    throw createNotFoundError('Clinic');
  }

  res.json({
    success: true,
    data: { clinic }
  });
});

// Update clinic
export const updateClinic = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    name,
    description,
    address,
    phone,
    email,
    website,
    emergencyContact,
    operatingHours,
    services
  } = req.body;

  const clinic = await Clinic.findById(id);
  if (!clinic) {
    throw createNotFoundError('Clinic');
  }

  // Check if name or email is being changed and if it's already taken
  if (name && name !== clinic.name) {
    const existingClinic = await Clinic.findOne({
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      _id: { $ne: id }
    });
    if (existingClinic) {
      throw createConflictError('Clinic name is already taken');
    }
    clinic.name = name;
  }

  if (email && email !== clinic.email) {
    const existingClinic = await Clinic.findOne({
      email: email.toLowerCase(),
      _id: { $ne: id }
    });
    if (existingClinic) {
      throw createConflictError('Email is already taken by another clinic');
    }
    clinic.email = email.toLowerCase();
  }

  // Update fields
  if (description) clinic.description = description;
  if (address) clinic.address = { ...clinic.address, ...address };
  if (phone) clinic.phone = phone;
  if (website) clinic.website = website;
  if (emergencyContact) clinic.emergencyContact = emergencyContact;
  if (operatingHours) clinic.operatingHours = { ...clinic.operatingHours, ...operatingHours };
  if (services) clinic.services = services;

  await clinic.save();

  // Populate and return updated clinic
  await clinic.populate('staff', 'firstName lastName role specialization');

  res.json({
    success: true,
    message: 'Clinic updated successfully',
    data: { clinic }
  });
});

// Delete clinic
export const deleteClinic = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const clinic = await Clinic.findById(id);
  if (!clinic) {
    throw createNotFoundError('Clinic');
  }

  // Check if clinic has any appointments or patients
  const [appointmentCount, patientCount, staffCount] = await Promise.all([
    Appointment.countDocuments({ clinicId: id }),
    Patient.countDocuments({ preferredClinicId: id }),
    User.countDocuments({ assignedClinics: id })
  ]);

  if (appointmentCount > 0 || patientCount > 0 || staffCount > 0) {
    throw createValidationError(
      'clinic',
      'Cannot delete clinic with existing appointments, patients, or staff members'
    );
  }

  await Clinic.findByIdAndDelete(id);

  res.json({
    success: true,
    message: 'Clinic deleted successfully'
  });
});

// Search clinics
export const searchClinics = catchAsync(async (req: Request, res: Response) => {
  const { q: searchTerm } = req.query;
  const { page, limit, skip } = getPaginationParams(req);

  if (!searchTerm) {
    throw createValidationError('q', 'Search term is required');
  }

  const clinics = await Clinic.searchClinics(searchTerm as string);
  const total = clinics.length;

  const paginatedResponse = createPaginatedResponse(clinics, total, page, limit);

  res.json({
    success: true,
    data: paginatedResponse
  });
});

// Get clinics by city
export const getClinicsByCity = catchAsync(async (req: Request, res: Response) => {
  const { city } = req.params;
  const { page, limit, skip } = getPaginationParams(req);

  const [clinics, total] = await Promise.all([
    Clinic.findByCity(city, { skip, limit }),
    Clinic.countDocuments({ 'address.city': { $regex: new RegExp(city, 'i') } })
  ]);

  const paginatedResponse = createPaginatedResponse(clinics, total, page, limit);

  res.json({
    success: true,
    data: paginatedResponse
  });
});

// Get clinics by service
export const getClinicsByService = catchAsync(async (req: Request, res: Response) => {
  const { service } = req.params;
  const { page, limit, skip } = getPaginationParams(req);

  const [clinics, total] = await Promise.all([
    Clinic.findByService(service, { skip, limit }),
    Clinic.countDocuments({ services: { $in: [service] } })
  ]);

  const paginatedResponse = createPaginatedResponse(clinics, total, page, limit);

  res.json({
    success: true,
    data: paginatedResponse
  });
});

// Get nearby clinics
export const getNearbyClinic = catchAsync(async (req: Request, res: Response) => {
  const { latitude, longitude, radius = 10 } = req.query;

  if (!latitude || !longitude) {
    throw createValidationError('location', 'Latitude and longitude are required');
  }

  const lat = parseFloat(latitude as string);
  const lng = parseFloat(longitude as string);
  const radiusInKm = parseFloat(radius as string);

  const clinics = await Clinic.findNearby(lat, lng, radiusInKm);

  res.json({
    success: true,
    data: { clinics }
  });
});

// Add staff to clinic
export const addStaffToClinic = catchAsync(async (req: Request, res: Response) => {
  const { clinicId } = req.params;
  const { userId } = req.body;

  const [clinic, user] = await Promise.all([
    Clinic.findById(clinicId),
    User.findById(userId)
  ]);

  if (!clinic) {
    throw createNotFoundError('Clinic');
  }

  if (!user) {
    throw createNotFoundError('User');
  }

  // Add user to clinic staff if not already added
  if (!clinic.staff.includes(userId)) {
    clinic.staff.push(userId);
    await clinic.save();
  }

  // Add clinic to user's assigned clinics if not already assigned
  const clinicObjectId = clinicId as any;
  if (!user.assignedClinics.includes(clinicObjectId)) {
    user.assignedClinics.push(clinicObjectId);
    await user.save();
  }

  res.json({
    success: true,
    message: 'Staff member added to clinic successfully'
  });
});

// Remove staff from clinic
export const removeStaffFromClinic = catchAsync(async (req: Request, res: Response) => {
  const { clinicId, userId } = req.params;

  const [clinic, user] = await Promise.all([
    Clinic.findById(clinicId),
    User.findById(userId)
  ]);

  if (!clinic) {
    throw createNotFoundError('Clinic');
  }

  if (!user) {
    throw createNotFoundError('User');
  }

  // Remove user from clinic staff
  clinic.staff = clinic.staff.filter(staff => staff.toString() !== userId);
  await clinic.save();

  // Remove clinic from user's assigned clinics
  user.assignedClinics = user.assignedClinics.filter(
    assignedClinicId => assignedClinicId.toString() !== clinicId
  );

  // If this was the user's preferred clinic, clear it
  if (user.preferredClinicId?.toString() === clinicId) {
    user.preferredClinicId = undefined;
  }

  await user.save();

  res.json({
    success: true,
    message: 'Staff member removed from clinic successfully'
  });
});

// Get clinic staff
export const getClinicStaff = catchAsync(async (req: Request, res: Response) => {
  const { clinicId } = req.params;
  const { role } = req.query;

  const clinic = await Clinic.findById(clinicId);
  if (!clinic) {
    throw createNotFoundError('Clinic');
  }

  let query: any = { _id: { $in: clinic.staff } };
  if (role) {
    query.role = role;
  }

  const staff = await User.find(query)
    .select('firstName lastName email phone role specialization profileImage')
    .sort({ firstName: 1 });

  res.json({
    success: true,
    data: { staff }
  });
});

// Upload clinic image
export const uploadClinicImage = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!req.file) {
    throw createValidationError('file', 'Clinic image is required');
  }

  const clinic = await Clinic.findById(id);
  if (!clinic) {
    throw createNotFoundError('Clinic');
  }

  // Upload image to cloud storage
  const uploadResult = await uploadClinicImageToCloud(req.file, clinic._id.toString());

  // Update clinic image (assuming we add an images field to the clinic model)
  // For now, we'll just return the uploaded image URL
  res.json({
    success: true,
    message: 'Clinic image uploaded successfully',
    data: {
      imageUrl: uploadResult.secure_url
    }
  });
});

// Get clinic statistics (for specific clinic)
export const getClinicStatistics = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const clinic = await Clinic.findById(id);
  if (!clinic) {
    throw createNotFoundError('Clinic');
  }

  const [appointmentCount, patientCount, staffCount, todayAppointments] = await Promise.all([
    Appointment.countDocuments({ clinicId: id }),
    Patient.countDocuments({ preferredClinicId: id }),
    User.countDocuments({ assignedClinics: id }),
    Appointment.countDocuments({
      clinicId: id,
      date: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0)),
        $lt: new Date(new Date().setHours(23, 59, 59, 999))
      }
    })
  ]);

  res.json({
    success: true,
    data: {
      totalAppointments: appointmentCount,
      totalPatients: patientCount,
      totalStaff: staffCount,
      todayAppointments
    }
  });
});

// Get overall statistics for all clinics (admin only)
export const getOverallStatistics = catchAsync(async (req: Request, res: Response) => {
  const today = new Date();
  const startOfDay = new Date(today.setHours(0, 0, 0, 0));
  const endOfDay = new Date(today.setHours(23, 59, 59, 999));
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

  const [
    totalClinics,
    activeClinics,
    totalAppointments,
    todayAppointments,
    upcomingAppointments,
    completedAppointments,
    cancelledAppointments,
    totalPatients,
    newPatientsThisMonth,
    totalStaff,
    thisMonthRevenue,
    lastMonthRevenue
  ] = await Promise.all([
    Clinic.countDocuments(),
    Clinic.countDocuments({ isActive: true }),
    Appointment.countDocuments(),
    Appointment.countDocuments({
      date: { $gte: startOfDay, $lte: endOfDay }
    }),
    Appointment.countDocuments({
      date: { $gt: endOfDay },
      status: 'scheduled'
    }),
    Appointment.countDocuments({ status: 'completed' }),
    Appointment.countDocuments({ status: 'cancelled' }),
    Patient.countDocuments(),
    Patient.countDocuments({
      createdAt: { $gte: startOfMonth }
    }),
    User.countDocuments({ role: { $in: ['dentist', 'staff'] } }),
    // For revenue, we'll need to implement billing aggregation
    // For now, returning 0 as placeholder
    Promise.resolve(0),
    Promise.resolve(0)
  ]);

  // Get clinic distribution by city
  const clinicsByCity = await Clinic.aggregate([
    {
      $group: {
        _id: '$address.city',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);

  // Get appointment trends for the last 7 days
  const appointmentTrends = await Appointment.aggregate([
    {
      $match: {
        date: {
          $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          $lte: new Date()
        }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$date' }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  res.json({
    success: true,
    data: {
      clinics: {
        total: totalClinics,
        active: activeClinics,
        inactive: totalClinics - activeClinics
      },
      appointments: {
        total: totalAppointments,
        today: todayAppointments,
        upcoming: upcomingAppointments,
        completed: completedAppointments,
        cancelled: cancelledAppointments
      },
      patients: {
        total: totalPatients,
        newThisMonth: newPatientsThisMonth
      },
      staff: {
        total: totalStaff
      },
      revenue: {
        thisMonth: thisMonthRevenue,
        lastMonth: lastMonthRevenue
      },
      clinicsByCity,
      appointmentTrends
    }
  });
});

// Get clinic operating hours
export const getClinicOperatingHours = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const clinic = await Clinic.findById(id).select('name operatingHours');
  if (!clinic) {
    throw createNotFoundError('Clinic');
  }

  res.json({
    success: true,
    data: {
      clinic: {
        _id: clinic._id,
        name: clinic.name,
        operatingHours: clinic.operatingHours
      }
    }
  });
});

// Check if clinic is open
export const checkClinicStatus = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const clinic = await Clinic.findById(id);
  if (!clinic) {
    throw createNotFoundError('Clinic');
  }

  // Check if clinic is currently open based on operating hours
  const now = new Date();
  const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const todayHours = clinic.operatingHours.find(hours => hours.day === currentDay);
  const isOpen = todayHours && !todayHours.closed;
  
  // You can add more sophisticated time checking logic here if needed

  res.json({
    success: true,
    data: {
      isOpen,
      todayHours,
      currentTime: new Date().toLocaleTimeString()
    }
  });
});

// Get all available services
export const getAllServices = catchAsync(async (req: Request, res: Response) => {
  const services = await Clinic.distinct('services');

  res.json({
    success: true,
    data: { services: services.sort() }
  });
});

// Get clinic dashboard data
export const getClinicDashboard = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const clinic = await Clinic.findById(id);
  if (!clinic) {
    throw createNotFoundError('Clinic');
  }

  const today = new Date();
  const startOfDay = new Date(today.setHours(0, 0, 0, 0));
  const endOfDay = new Date(today.setHours(23, 59, 59, 999));

  const [todayAppointments, upcomingAppointments, recentPatients, staffCount] = await Promise.all([
    Appointment.find({
      clinicId: id,
      date: { $gte: startOfDay, $lte: endOfDay }
    })
      .populate('patientId', 'firstName lastName')
      .populate('dentistId', 'firstName lastName')
      .sort({ 'timeSlot.start': 1 }),
    
    Appointment.find({
      clinicId: id,
      date: { $gt: endOfDay },
      status: 'scheduled'
    })
      .populate('patientId', 'firstName lastName')
      .populate('dentistId', 'firstName lastName')
      .sort({ date: 1 })
      .limit(5),
    
    Patient.find({ preferredClinicId: id })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('firstName lastName email createdAt'),
    
    User.countDocuments({ assignedClinics: id })
  ]);

  res.json({
    success: true,
    data: {
      clinic: {
        _id: clinic._id,
        name: clinic.name,
        address: clinic.address
      },
      todayAppointments,
      upcomingAppointments,
      recentPatients,
      staffCount
    }
  });
});