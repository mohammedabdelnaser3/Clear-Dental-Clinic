import { Request, Response, NextFunction } from 'express';
import { Prescription, Patient, Medication } from '../models';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';
import { AuthenticatedRequest } from '../types';

// @desc    Get all prescriptions
// @route   GET /api/prescriptions
// @access  Private (Dentist, Staff, Admin)
export const getAllPrescriptions = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const { page = 1, limit = 10, status, patientId } = req.query;
  
  let query: any = {};
  
  // If user is a dentist, only show their prescriptions
  if (req.user.role === 'dentist') {
    query.dentistId = req.user._id;
  }
  
  if (status) {
    query.status = status;
  }
  
  if (patientId) {
    query.patientId = patientId;
  }
  
  const prescriptions = await Prescription.find(query)
    .populate('patientId', 'firstName lastName email phone')
    .populate('dentistId', 'firstName lastName specialization')
    .populate('clinicId', 'name address')
    .populate('medications.medicationId', 'name genericName category')
    .sort({ createdAt: -1 })
    .limit(Number(limit) * 1)
    .skip((Number(page) - 1) * Number(limit));
    
  const total = await Prescription.countDocuments(query);
  
  return res.status(200).json({
    success: true,
    data: {
      prescriptions,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      totalRecords: total
    }
  });
});

// @desc    Get prescription by ID
// @route   GET /api/prescriptions/:id
// @access  Private (Dentist, Staff, Admin, Patient - own only)
export const getPrescriptionById = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const prescription = await Prescription.findById(req.params.id)
    .populate('patientId', 'firstName lastName email phone dateOfBirth')
    .populate('dentistId', 'firstName lastName specialization licenseNumber')
    .populate('clinicId', 'name address phone')
    .populate('medications.medicationId', 'name genericName dosage category sideEffects contraindications');
  
  if (!prescription) {
    return next(new AppError('Prescription not found', 404));
  }
  
  // Check if patient is accessing their own prescription
  if (req.user.role === 'patient' && prescription.patientId.toString() !== req.user._id.toString()) {
    return next(new AppError('Access denied', 403));
  }
  
  // Check if dentist is accessing their own prescription
  if (req.user.role === 'dentist' && prescription.dentistId.toString() !== req.user._id.toString()) {
    return next(new AppError('Access denied', 403));
  }
  
  return res.status(200).json({
    success: true,
    data: prescription
  });
});

// @desc    Create new prescription
// @route   POST /api/prescriptions
// @access  Private (Dentist)
export const createPrescription = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  // Verify patient exists
  const patient = await Patient.findById(req.body.patientId);
  if (!patient) {
    return next(new AppError('Patient not found', 404));
  }
  
  // Verify medications exist
  for (const med of req.body.medications) {
    const medication = await Medication.findById(med.medicationId);
    if (!medication) {
      return next(new AppError(`Medication with ID ${med.medicationId} not found`, 404));
    }
  }
  
  const prescriptionData = {
    ...req.body,
    dentistId: req.user._id,
    issuedDate: new Date()
  };
  
  const prescription = await Prescription.create(prescriptionData);
  
  const populatedPrescription = await Prescription.findById(prescription._id)
    .populate('patientId', 'firstName lastName email')
    .populate('dentistId', 'firstName lastName')
    .populate('clinicId', 'name')
    .populate('medications.medicationId', 'name genericName');
  
  return res.status(201).json({
    success: true,
    data: populatedPrescription,
    message: 'Prescription created successfully'
  });
});

// @desc    Update prescription
// @route   PUT /api/prescriptions/:id
// @access  Private (Dentist - own only)
export const updatePrescription = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const prescription = await Prescription.findById(req.params.id);
  
  if (!prescription) {
    return next(new AppError('Prescription not found', 404));
  }
  
  // Check if dentist is updating their own prescription
  if (req.user.role === 'dentist' && prescription.dentistId.toString() !== req.user._id.toString()) {
    return next(new AppError('Access denied', 403));
  }
  
  // Verify medications exist if medications are being updated
  if (req.body.medications) {
    for (const med of req.body.medications) {
      const medication = await Medication.findById(med.medicationId);
      if (!medication) {
        return next(new AppError(`Medication with ID ${med.medicationId} not found`, 404));
      }
    }
  }
  
  const updatedPrescription = await Prescription.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  ).populate('patientId', 'firstName lastName email')
   .populate('dentistId', 'firstName lastName')
   .populate('clinicId', 'name')
   .populate('medications.medicationId', 'name genericName');
  
  return res.status(200).json({
    success: true,
    data: updatedPrescription,
    message: 'Prescription updated successfully'
  });
});

// @desc    Delete prescription
// @route   DELETE /api/prescriptions/:id
// @access  Private (Dentist - own only, Admin)
export const deletePrescription = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const prescription = await Prescription.findById(req.params.id);
  
  if (!prescription) {
    return next(new AppError('Prescription not found', 404));
  }
  
  // Check if dentist is deleting their own prescription
  if (req.user.role === 'dentist' && prescription.dentistId.toString() !== req.user._id.toString()) {
    return next(new AppError('Access denied', 403));
  }
  
  await Prescription.findByIdAndUpdate(req.params.id, { status: 'cancelled' });
  
  return res.status(200).json({
    success: true,
    message: 'Prescription cancelled successfully'
  });
});

// @desc    Get prescriptions by patient
// @route   GET /api/prescriptions/patient/:patientId
// @access  Private (Dentist, Staff, Admin, Patient - own only)
export const getPrescriptionsByPatient = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const { patientId } = req.params;
  const { page = 1, limit = 10, status } = req.query;
  
  // Check if patient is accessing their own prescriptions
  if (req.user.role === 'patient' && patientId !== req.user._id.toString()) {
    return next(new AppError('Access denied', 403));
  }
  
  const pageNum = Number(page);
  const limitNum = Number(limit);
  const skip = (pageNum - 1) * limitNum;
  
  let query: any = { patientId };
  
  if (status) {
    query.status = status;
  }
  
  const [prescriptions, total] = await Promise.all([
    Prescription.findByPatient(patientId, {
      limit: limitNum,
      skip,
      status
    }),
    Prescription.countDocuments(query)
  ]);
  
  const totalPages = Math.ceil(total / limitNum);
  
  return res.status(200).json({
    success: true,
    data: {
      prescriptions,
      totalPages,
      currentPage: pageNum,
      totalRecords: total
    }
  });
});

// @desc    Get active prescriptions
// @route   GET /api/prescriptions/active
// @access  Private (Dentist, Staff, Admin)
export const getActivePrescriptions = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const { patientId } = req.query;
  
  const prescriptions = await Prescription.findActive(patientId as string);
  
  return res.status(200).json({
    success: true,
    data: prescriptions
  });
});

// @desc    Get expiring prescriptions
// @route   GET /api/prescriptions/expiring
// @access  Private (Dentist, Staff, Admin)
export const getExpiringPrescriptions = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { days = 7 } = req.query;
  
  const prescriptions = await Prescription.findExpiring(Number(days));
  
  return res.status(200).json({
    success: true,
    data: prescriptions
  });
});

// @desc    Add refill to prescription
// @route   POST /api/prescriptions/:id/refill
// @access  Private (Dentist - own only)
export const addRefill = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const prescription = await Prescription.findById(req.params.id);
  
  if (!prescription) {
    return next(new AppError('Prescription not found', 404));
  }
  
  // Check if dentist is adding refill to their own prescription
  if (req.user.role === 'dentist' && prescription.dentistId.toString() !== req.user._id.toString()) {
    return next(new AppError('Access denied', 403));
  }
  
  const updatedPrescription = await prescription.addRefill();
  
  return res.status(200).json({
    success: true,
    data: updatedPrescription,
    message: 'Refill added successfully'
  });
});