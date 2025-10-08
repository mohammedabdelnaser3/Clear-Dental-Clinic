import { Request, Response, NextFunction } from 'express';
import { Prescription, Patient, Medication } from '../models';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';
import { AuthenticatedRequest } from '../types';

// @desc    Get all prescriptions
// @route   GET /api/prescriptions
// @access  Private (Dentist, Staff, Admin, Patient - own only)
export const getAllPrescriptions = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const { page = 1, limit = 10, status, patientId } = req.query;
  
  let query: any = {};
  
  // If user is a patient, get their patient record and show only their prescriptions
  if (req.user.role === 'patient') {
    // Find patient record linked to this user
    const patient = await Patient.findOne({ userId: req.user._id });
    if (!patient) {
      return next(new AppError('Patient record not found', 404));
    }
    query.patientId = patient._id;
  }
  // If user is a dentist, only show their prescriptions
  else if (req.user.role === 'dentist') {
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
  if (req.user.role === 'patient') {
    // Find patient record linked to this user
    const patient = await Patient.findOne({ userId: req.user._id });
    if (!patient || prescription.patientId.toString() !== patient._id.toString()) {
      return next(new AppError('Access denied', 403));
    }
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
  const patient = await (Patient as any).findById(req.body.patientId);
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
  if (req.user.role === 'patient') {
    // Find patient record linked to this user
    const patient = await Patient.findOne({ userId: req.user._id });
    if (!patient || patientId !== patient._id.toString()) {
      return next(new AppError('Access denied', 403));
    }
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

// @desc    Perform medication safety check before prescribing
// @route   POST /api/prescriptions/safety-check
// @access  Private (Dentist, Doctor)
export const performSafetyCheck = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const { patientId, medications } = req.body;

  if (!patientId || !medications || !Array.isArray(medications) || medications.length === 0) {
    return next(new AppError('Patient ID and medications array are required', 400));
  }

  // Import safety service
  const { medicationSafetyService } = await import('../services/medicationSafetyService');

  // Perform comprehensive safety check
  const safetyCheckResult = await medicationSafetyService.performSafetyCheck(
    patientId,
    medications
  );

  return res.status(200).json({
    success: true,
    data: safetyCheckResult,
    message: safetyCheckResult.safe ? 'No critical safety issues found' : 'Safety concerns detected'
  });
});

// @desc    Get patient medication summary (allergies, current meds, conditions)
// @route   GET /api/prescriptions/patient/:patientId/summary
// @access  Private (Dentist, Doctor)
export const getPatientMedicationSummary = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const { patientId } = req.params;

  // Import safety service
  const { medicationSafetyService } = await import('../services/medicationSafetyService');

  const summary = await medicationSafetyService.getPatientMedicationSummary(patientId);

  return res.status(200).json({
    success: true,
    data: summary,
    message: 'Patient medication summary retrieved successfully'
  });
});

// @desc    Get current user's prescriptions (for patients, dentists, staff, admin)
// @route   GET /api/prescriptions/my-prescriptions
// @access  Private (Patient, Dentist, Staff, Admin)
export const getMyPrescriptions = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const { page = 1, limit = 10, status } = req.query;
  
  const pageNum = Number(page);
  const limitNum = Number(limit);
  const skip = (pageNum - 1) * limitNum;
  
  let query: any = {};
  
  // Handle different user roles
  if (req.user.role === 'patient') {
    // Find patient record linked to this user
    const patient = await Patient.findOne({ userId: req.user._id });
    if (!patient) {
      return next(new AppError('Patient record not found', 404));
    }
    query.patientId = patient._id;
  } else if (req.user.role === 'dentist') {
    // Dentists can see prescriptions they created
    query.dentistId = req.user._id;
  } else if (req.user.role === 'staff' || req.user.role === 'admin') {
    // Staff and admin can see all prescriptions (no additional filter)
    // This allows them to see all prescriptions in the system
  }
  
  if (status) {
    query.status = status;
  }
  
  const [prescriptions, total] = await Promise.all([
    Prescription.find(query)
      .populate('patientId', 'firstName lastName email phone')
      .populate('dentistId', 'firstName lastName specialization')
      .populate('clinicId', 'name address phone')
      .populate('medications.medicationId', 'name genericName category')
      .sort({ issuedDate: -1 })
      .limit(limitNum)
      .skip(skip),
    Prescription.countDocuments(query)
  ]);
  
  const totalPages = Math.ceil(total / limitNum);
  
  // Prepare response data based on user role
  let responseData: any = {
    prescriptions,
    totalPages,
    currentPage: pageNum,
    totalRecords: total
  };
  
  // Add patient info for patient users
  if (req.user.role === 'patient') {
    const patient = await Patient.findOne({ userId: req.user._id });
    if (patient) {
      responseData.patient = {
        _id: patient._id,
        firstName: patient.firstName,
        lastName: patient.lastName,
        email: patient.email
      };
    }
  }
  
  return res.status(200).json({
    success: true,
    data: responseData
  });
});

// @desc    Get prescriptions for any patient across all clinics (for doctors)
// @route   GET /api/prescriptions/cross-clinic/patient/:patientId
// @access  Private (Dentist, Doctor, Admin)
export const getCrossClinicPrescriptions = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const { patientId } = req.params;
  const { page = 1, limit = 20, status } = req.query;

  // Verify patient exists
  const patient = await Patient.findById(patientId);
  if (!patient) {
    return next(new AppError('Patient not found', 404));
  }

  let query: any = { patientId };
  
  if (status) {
    query.status = status;
  }

  // Get all prescriptions for this patient regardless of clinic
  const prescriptions = await Prescription.find(query)
    .populate('patientId', 'firstName lastName email phone dateOfBirth')
    .populate('dentistId', 'firstName lastName email specialization')
    .populate('clinicId', 'name address phone')
    .populate('medications.medicationId', 'name genericName category strength dosageForm')
    .sort({ issuedDate: -1 })
    .limit(Number(limit))
    .skip((Number(page) - 1) * Number(limit));

  const total = await Prescription.countDocuments(query);

  // Group by clinic for better organization
  const prescriptionsByClinic: any = {};
  prescriptions.forEach((prescription: any) => {
    const clinicId = prescription.clinicId._id.toString();
    const clinicName = prescription.clinicId.name;
    
    if (!prescriptionsByClinic[clinicName]) {
      prescriptionsByClinic[clinicName] = {
        clinic: prescription.clinicId,
        prescriptions: [],
        count: 0
      };
    }
    
    prescriptionsByClinic[clinicName].prescriptions.push(prescription);
    prescriptionsByClinic[clinicName].count++;
  });

  return res.status(200).json({
    success: true,
    data: {
      prescriptions,
      prescriptionsByClinic,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      },
      patient: {
        _id: patient._id,
        fullName: `${patient.firstName} ${patient.lastName}`,
        email: patient.email,
        dateOfBirth: patient.dateOfBirth
      }
    },
    message: 'Cross-clinic prescriptions retrieved successfully'
  });
});