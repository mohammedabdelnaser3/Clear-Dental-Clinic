import { Request, Response } from 'express';
import Patient from '../models/Patient';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';

// Get all patients
export const getPatients = asyncHandler(async (req: Request, res: Response) => {
  const { 
    page = 1, 
    limit = 10, 
    search, 
    status,
    dateFrom,
    dateTo 
  } = req.query;

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  // Build query
  const query: any = {};
  
  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } }
    ];
  }

  if (status) {
    query.status = status;
  }

  if (dateFrom || dateTo) {
    query.createdAt = {};
    if (dateFrom) query.createdAt.$gte = new Date(dateFrom as string);
    if (dateTo) query.createdAt.$lte = new Date(dateTo as string);
  }

  const [patients, total] = await Promise.all([
    (Patient as any).find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .select('-password'),
    (Patient as any).countDocuments(query)
  ]);

  res.status(200).json({
    success: true,
    data: patients,
    pagination: {
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(total / limitNum),
      total
    }
  });
});

// Get single patient by ID
export const getPatientById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const patient = await (Patient as any).findById(id).select('-password');
  
  if (!patient) {
    throw new AppError('Patient not found', 404);
  }

  res.status(200).json({
    success: true,
    data: patient
  });
});

// Create new patient
export const createPatient = asyncHandler(async (req: Request, res: Response) => {
  const {
    firstName,
    lastName,
    email,
    phone,
    dateOfBirth,
    gender,
    address,
    emergencyContact,
    medicalHistory,
    allergies,
    currentMedications,
    insuranceInfo,
    preferredClinicId,
    createdBy,
    status
  } = req.body;

  // Validate required fields
  if (!preferredClinicId) {
    throw new AppError('Preferred clinic is required', 400);
  }

  // Check if patient already exists
  const existingPatient = await (Patient as any).findOne({ 
    $or: [{ email }, { phone }] 
  });

  if (existingPatient) {
    throw new AppError('Patient with this email or phone already exists', 400);
  }

  const patient = await (Patient as any).create({
    firstName,
    lastName,
    email,
    phone,
    dateOfBirth,
    gender,
    address,
    emergencyContact,
    medicalHistory,
    allergies,
    currentMedications,
    insuranceInfo,
    preferredClinicId,
    createdBy,
    status: status || 'active',
    isActive: true
  });

  res.status(201).json({
    success: true,
    data: patient,
    message: 'Patient created successfully'
  });
});

// Update patient
export const updatePatient = asyncHandler(async (req: Request, res: Response) => {
  console.log('REQ', req);
  const { id } = req.params;
  const updateData = req.body;
  console.log('final', updateData);
  // Remove sensitive fields
  delete updateData.password;
  delete updateData.role;

  const patient = await (Patient as any).findByIdAndUpdate(
    id,
    { ...updateData, updatedAt: new Date() },
    { new: true, runValidators: true }
  ).select('-password');

  if (!patient) {
    throw new AppError('Patient not found', 404);
  }

  res.status(200).json({
    success: true,
    data: patient,
    message: 'Patient updated successfully'
  });
});

// Delete patient
export const deletePatient = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const patient = await (Patient as any).findById(id);
  
  if (!patient) {
    throw new AppError('Patient not found', 404);
  }

  // Soft delete - mark as inactive instead of removing
  await (Patient as any).findByIdAndUpdate(id, { status: 'inactive' });

  res.status(200).json({
    success: true,
    message: 'Patient deleted successfully'
  });
});

// Search patients
export const searchPatients = asyncHandler(async (req: Request, res: Response) => {
  const { q, limit = 10 } = req.query;

  if (!q) {
    return res.status(400).json({
      success: false,
      message: 'Search query is required'
    });
  }

  const patients = await (Patient as any).find({
    $or: [
      { firstName: { $regex: q, $options: 'i' } },
      { lastName: { $regex: q, $options: 'i' } },
      { email: { $regex: q, $options: 'i' } },
      { phone: { $regex: q, $options: 'i' } }
    ],
    status: 'active'
  })
  .limit(parseInt(limit as string))
  .select('firstName lastName email phone')
  .sort({ firstName: 1 });

  return res.status(200).json({
    success: true,
    data: patients
  });
});

// Get patient medical history
export const getPatientMedicalHistory = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const patient = await (Patient as any).findById(id)
    .select('medicalHistory allergies currentMedications')
    .populate('appointments')
    .populate('treatments');

  if (!patient) {
    throw new AppError('Patient not found', 404);
  }

  res.status(200).json({
    success: true,
    data: patient
  });
});

// Update patient medical history
export const updatePatientMedicalHistory = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { medicalHistory, allergies, currentMedications } = req.body;

  const patient = await (Patient as any).findByIdAndUpdate(
    id,
    {
      medicalHistory,
      allergies,
      currentMedications,
      updatedAt: new Date()
    },
    { new: true, runValidators: true }
  ).select('-password');

  if (!patient) {
    throw new AppError('Patient not found', 404);
  }

  res.status(200).json({
    success: true,
    data: patient,
    message: 'Medical history updated successfully'
  });
});

// Get patients by user ID
export const getPatientsByUserId = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { 
    page = 1, 
    limit = 10 
  } = req.query;

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  try {
    console.log(`Fetching patients for userId: ${userId}, page: ${pageNum}, limit: ${limitNum}`);
    const [patients, total] = await Promise.all([
      (Patient as any).find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('preferredClinicId', 'name'),
      (Patient as any).countDocuments({ userId })
    ]);
    console.log(`Found ${patients.length} patients for userId: ${userId}`);

    res.status(200).json({
      success: true,
      data: patients,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      message: `Found ${patients.length} patient(s) for user`
    });
  } catch (error) {
    console.error('Error fetching patients:', error);
    throw new AppError('Failed to fetch patients', 500);
  }
});

// Get recent patients
export const getRecentPatients = asyncHandler(async (req: Request, res: Response) => {
  const { clinicId, limit = 10 } = req.query;
  const limitNum = parseInt(limit as string);

  const query: any = { isActive: true };
  if (clinicId) {
    query.preferredClinicId = clinicId;
  }

  const patients = await (Patient as any).find(query)
    .sort({ createdAt: -1 })
    .limit(limitNum)
    .select('firstName lastName email phone createdAt preferredClinicId')
    .populate('preferredClinicId', 'name');

  res.json({
    success: true,
    data: patients
  });
});

// Get patient statistics
export const getPatientStatistics = asyncHandler(async (req: Request, res: Response) => {
  const { clinicId, startDate, endDate } = req.query;

  const query: any = { isActive: true };
  if (clinicId) {
    query.preferredClinicId = clinicId;
  }

  // Date range filter
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate as string);
    if (endDate) query.createdAt.$lte = new Date(endDate as string);
  }

  const [
    totalPatients,
    patientsByGender,
    patientsByAgeGroup,
    newThisMonth
  ] = await Promise.all([
    (Patient as any).countDocuments(query),
    (Patient as any).aggregate([
      { $match: query },
      { $group: { _id: '$gender', count: { $sum: 1 } } }
    ]),
    (Patient as any).aggregate([
      { $match: query },
      {
        $addFields: {
          age: {
            $divide: [
              { $subtract: [new Date(), '$dateOfBirth'] },
              365.25 * 24 * 60 * 60 * 1000
            ]
          }
        }
      },
      {
        $bucket: {
          groupBy: '$age',
          boundaries: [0, 18, 35, 50, 65, 100],
          default: '65+',
          output: { count: { $sum: 1 } }
        }
      }
    ]),
    (Patient as any).countDocuments({
      ...query,
      createdAt: {
        $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      }
    })
  ]);

  // Format gender statistics
  const genderStats = {
    male: 0,
    female: 0,
    other: 0
  };
  patientsByGender.forEach((stat: any) => {
    if (stat._id === 'male') genderStats.male = stat.count;
    else if (stat._id === 'female') genderStats.female = stat.count;
    else if (stat._id === 'other') genderStats.other = stat.count;
  });

  // Format age group statistics
  const ageGroupStats = {
    '0-18': 0,
    '19-35': 0,
    '36-50': 0,
    '51-65': 0,
    '65+': 0
  };
  patientsByAgeGroup.forEach((stat: any) => {
    if (stat._id === 0) ageGroupStats['0-18'] = stat.count;
    else if (stat._id === 18) ageGroupStats['19-35'] = stat.count;
    else if (stat._id === 35) ageGroupStats['36-50'] = stat.count;
    else if (stat._id === 50) ageGroupStats['51-65'] = stat.count;
    else if (stat._id === '65+') ageGroupStats['65+'] = stat.count;
  });

  res.json({
    success: true,
    data: {
      total: totalPatients,
      newThisMonth,
      byGender: genderStats,
      byAgeGroup: ageGroupStats
    }
  });
});
