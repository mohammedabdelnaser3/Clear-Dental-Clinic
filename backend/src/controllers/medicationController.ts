import { Request, Response, NextFunction } from 'express';
import { Medication } from '../models';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';
import { AuthenticatedRequest } from '../types';

// @desc    Get all medications
// @route   GET /api/medications
// @access  Private (Dentist, Staff, Admin)
export const getAllMedications = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const { page = 1, limit = 10, search, category } = req.query;
  
  let query: any = { isActive: true };
  
  if (search) {
    query = {
      ...query,
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { genericName: { $regex: search, $options: 'i' } }
      ]
    };
  }
  
  if (category) {
    query.category = category;
  }
  
  const medications = await Medication.find(query)
    .sort({ name: 1 })
    .limit(Number(limit) * 1)
    .skip((Number(page) - 1) * Number(limit));
    
  const total = await Medication.countDocuments(query);
  
  return res.status(200).json({
    success: true,
    data: medications,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit))
    }
  });
});

// @desc    Get medication by ID
// @route   GET /api/medications/:id
// @access  Private (Dentist, Staff, Admin)
export const getMedicationById = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const medication = await Medication.findById(req.params.id);
  
  if (!medication) {
    return next(new AppError('Medication not found', 404));
  }
  
  return res.status(200).json({
    success: true,
    data: medication
  });
});

// @desc    Create new medication
// @route   POST /api/medications
// @access  Private (Admin)
export const createMedication = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const medication = await Medication.create(req.body);
  
  return res.status(201).json({
    success: true,
    data: medication,
    message: 'Medication created successfully'
  });
});

// @desc    Update medication
// @route   PUT /api/medications/:id
// @access  Private (Admin)
export const updateMedication = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const medication = await Medication.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );
  
  if (!medication) {
    return next(new AppError('Medication not found', 404));
  }
  
  return res.status(200).json({
    success: true,
    data: medication,
    message: 'Medication updated successfully'
  });
});

// @desc    Delete medication (soft delete)
// @route   DELETE /api/medications/:id
// @access  Private (Admin)
export const deleteMedication = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const medication = await Medication.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true }
  );
  
  if (!medication) {
    return next(new AppError('Medication not found', 404));
  }
  
  return res.status(200).json({
    success: true,
    message: 'Medication deleted successfully'
  });
});

// @desc    Search medications
// @route   GET /api/medications/search
// @access  Private (Dentist, Staff, Admin)
export const searchMedications = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { q } = req.query;
  
  if (!q) {
    return next(new AppError('Search query is required', 400));
  }
  
  const medications = await Medication.searchMedications(q as string);
  
  return res.status(200).json({
    success: true,
    data: medications
  });
});

// @desc    Get medications by category
// @route   GET /api/medications/category/:category
// @access  Private (Dentist, Staff, Admin)
export const getMedicationsByCategory = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { category } = req.params;
  
  const medications = await Medication.findByCategory(category);
  
  return res.status(200).json({
    success: true,
    data: medications
  });
});

// @desc    Get patient medications (prescribed medications)
// @route   GET /api/patients/:patientId/medications
// @access  Private (Patient themselves, Dentist, Staff, Admin)
export const getPatientMedications = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { patientId } = req.params;
  const { page = 1, limit = 10, search, category, status = 'active' } = req.query;
  
  // Import Prescription model
  const Prescription = require('../models/Prescription').default;
  
  // Build query for prescriptions
  const prescriptionQuery: any = { patientId };
  if (status && status !== 'all') {
    prescriptionQuery.status = status;
  }
  
  // Get prescriptions with populated medication data
  const prescriptions = await Prescription.find(prescriptionQuery)
    .populate({
      path: 'medications.medicationId',
      model: 'Medication',
      match: {
        isActive: true,
        ...(category && category !== 'all' && { category }),
        ...(search && {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { genericName: { $regex: search, $options: 'i' } }
          ]
        })
      }
    })
    .populate('dentistId', 'firstName lastName')
    .populate('clinicId', 'name')
    .sort({ issuedDate: -1 })
    .limit(Number(limit))
    .skip((Number(page) - 1) * Number(limit));
  
  // Transform prescriptions to medication format
  const medications = prescriptions.reduce((acc: any[], prescription: any) => {
    prescription.medications.forEach((med: any) => {
      if (med.medicationId) { // Only include if medication exists and matches filters
        acc.push({
          _id: med.medicationId._id,
          name: med.medicationId.name,
          genericName: med.medicationId.genericName,
          dosage: med.dosage,
          frequency: med.frequency,
          duration: med.duration,
          instructions: med.instructions,
          sideEffects: med.medicationId.sideEffects || [],
          contraindications: med.medicationId.contraindications || [],
          category: med.medicationId.category,
          isActive: med.medicationId.isActive,
          prescribedDate: prescription.issuedDate,
          startDate: med.startDate,
          endDate: med.endDate,
          prescriptionId: prescription._id,
          dentist: prescription.dentistId,
          clinic: prescription.clinicId,
          prescriptionStatus: prescription.status
        });
      }
    });
    return acc;
  }, []);
  
  // Get total count for pagination
  const totalPrescriptions = await Prescription.countDocuments(prescriptionQuery);
  
  return res.status(200).json({
    success: true,
    data: {
      medications,
      totalRecords: medications.length,
      totalPages: Math.ceil(totalPrescriptions / Number(limit)),
      currentPage: Number(page)
    }
  });
});

// @desc    Get medication statistics
// @route   GET /api/medications/stats
// @access  Private (Dentist, Staff, Admin)
export const getMedicationStats = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // Get total medications count
    const totalMedications = await Medication.countDocuments({ isActive: true });
    
    // Get medications by category
    const categoryStats = await Medication.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);
    
    // Get most prescribed medications (from prescriptions)
    const Prescription = require('../models/Prescription').default;
    const popularMedications = await Prescription.aggregate([
      { $unwind: '$medications' },
      { $group: { _id: '$medications.medicationId', count: { $sum: 1 } } },
      { $lookup: { from: 'medications', localField: '_id', foreignField: '_id', as: 'medication' } },
      { $unwind: '$medication' },
      { $match: { 'medication.isActive': true } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $project: { name: '$medication.name', count: 1 } }
    ]);
    
    // Get recent medications added
    const recentMedications = await Medication.find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name category createdAt');
    
    const stats = {
      totalMedications,
      categoryStats: categoryStats.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      popularMedications,
      recentMedications
    };
    
    return res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching medication stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching medication statistics'
    });
  }
});