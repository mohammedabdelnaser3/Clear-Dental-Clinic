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
    Patient.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .select('-password'),
    Patient.countDocuments(query)
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

  const patient = await Patient.findById(id).select('-password');
  
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
    insuranceInfo
  } = req.body;

  // Check if patient already exists
  const existingPatient = await Patient.findOne({ 
    $or: [{ email }, { phone }] 
  });

  if (existingPatient) {
    throw new AppError('Patient with this email or phone already exists', 400);
  }

  const patient = await Patient.create({
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
    status: 'active'
  });

  res.status(201).json({
    success: true,
    data: patient,
    message: 'Patient created successfully'
  });
});

// Update patient
export const updatePatient = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData = req.body;

  // Remove sensitive fields
  delete updateData.password;
  delete updateData.role;

  const patient = await Patient.findByIdAndUpdate(
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

  const patient = await Patient.findById(id);
  
  if (!patient) {
    throw new AppError('Patient not found', 404);
  }

  // Soft delete - mark as inactive instead of removing
  await Patient.findByIdAndUpdate(id, { status: 'inactive' });

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

  const patients = await Patient.find({
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

  const patient = await Patient.findById(id)
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

  const patient = await Patient.findByIdAndUpdate(
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
      Patient.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('preferredClinicId', 'name'),
      Patient.countDocuments({ userId })
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
    console.error(`Error in getPatientsByUserId for userId: ${userId}`, error);
    throw new AppError('Internal server error while fetching patient data', 500);
  }
});

// Get patient statistics
export const getPatientStatistics = asyncHandler(async (req: Request, res: Response) => {
  const { clinicId } = req.query;
  
  try {
    // Build base query
    const baseQuery = clinicId ? { clinicId } : {};
    
    // Get current date for time-based queries
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    
    // Parallel aggregation queries
    const [
      totalPatients,
      activePatients,
      newThisMonth,
      newLastMonth,
      genderStats,
      ageStats
    ] = await Promise.all([
      Patient.countDocuments(baseQuery),
      Patient.countDocuments({ ...baseQuery, status: 'active' }),
      Patient.countDocuments({ 
        ...baseQuery, 
        createdAt: { $gte: startOfMonth }
      }),
      Patient.countDocuments({ 
        ...baseQuery, 
        createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth }
      }),
      Patient.aggregate([
        { $match: baseQuery },
        { $group: { _id: '$gender', count: { $sum: 1 } } }
      ]),
      Patient.aggregate([
        { $match: baseQuery },
        {
          $addFields: {
            age: {
              $floor: {
                $divide: [
                  { $subtract: [new Date(), '$dateOfBirth'] },
                  365.25 * 24 * 60 * 60 * 1000
                ]
              }
            }
          }
        },
        {
          $group: {
            _id: {
              $switch: {
                branches: [
                  { case: { $lt: ['$age', 18] }, then: '0-18' },
                  { case: { $lt: ['$age', 35] }, then: '19-35' },
                  { case: { $lt: ['$age', 50] }, then: '36-50' },
                  { case: { $lt: ['$age', 65] }, then: '51-65' }
                ],
                default: '65+'
              }
            },
            count: { $sum: 1 }
          }
        }
      ])
    ]);
    
    // Format gender statistics
    const byGender = {
      male: 0,
      female: 0,
      other: 0
    };
    genderStats.forEach(stat => {
      if (stat._id && byGender.hasOwnProperty(stat._id)) {
        byGender[stat._id as keyof typeof byGender] = stat.count;
      }
    });
    
    // Format age statistics
    const byAgeGroup = {
      '0-18': 0,
      '19-35': 0,
      '36-50': 0,
      '51-65': 0,
      '65+': 0
    };
    ageStats.forEach(stat => {
      if (stat._id && byAgeGroup.hasOwnProperty(stat._id)) {
        byAgeGroup[stat._id as keyof typeof byAgeGroup] = stat.count;
      }
    });
    
    const statistics = {
      total: totalPatients,
      active: activePatients,
      newThisMonth,
      newLastMonth,
      byGender,
      byAgeGroup
    };
    
    res.status(200).json({
      success: true,
      data: statistics
    });
  } catch (error) {
    console.error('Error fetching patient statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching patient statistics'
    });
  }
});

// Get recent patients
export const getRecentPatients = asyncHandler(async (req: Request, res: Response) => {
  const { limit = 10, clinicId } = req.query;
  
  try {
    // Build query
    const query = clinicId ? { clinicId } : {};
    
    const recentPatients = await Patient.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit as string))
      .select('firstName lastName email phone createdAt status')
      .lean();
    
    res.status(200).json({
      success: true,
      data: recentPatients
    });
  } catch (error) {
    console.error('Error fetching recent patients:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching recent patients'
    });
  }
});