import { Request, Response } from 'express';
import { TreatmentRecord, Patient, User, Clinic } from '../models';
import { AuthenticatedRequest } from '../types';
import {
  getPaginationParams,
  createPaginatedResponse,
  createSearchRegex,
  formatDate
} from '../utils/helpers';
import {
  AppError,
  catchAsync,
  createNotFoundError,
  createValidationError
} from '../middleware/errorHandler';
import { uploadTreatmentAttachment } from '../utils/upload';

// Create new treatment record
export const createTreatmentRecord = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const {
    patientId,
    clinicId,
    procedure,
    diagnosis,
    notes,
    date
  } = req.body;

  // Verify patient and clinic exist
  const [patient, clinic] = await Promise.all([
    Patient.findById(patientId),
    Clinic.findById(clinicId)
  ]);

  if (!patient) {
    throw createNotFoundError('Patient');
  }

  if (!clinic) {
    throw createNotFoundError('Clinic');
  }

  // Verify dentist is assigned to the clinic
  const dentist = await User.findById(req.user._id);
  if (!dentist?.assignedClinics.includes(clinicId)) {
    throw createValidationError('clinicId', 'You are not assigned to this clinic');
  }

  const treatmentRecord = new TreatmentRecord({
    patientId,
    dentistId: req.user._id,
    clinicId,
    procedure,
    diagnosis,
    notes,
    date: date ? new Date(date) : new Date()
  });

  await treatmentRecord.save();

  // Add to patient's treatment records
  patient.treatmentRecords.push(treatmentRecord._id);
  await patient.save();

  // Populate and return
  await treatmentRecord.populate([
    { path: 'patientId', select: 'firstName lastName email dateOfBirth' },
    { path: 'dentistId', select: 'firstName lastName specialization' },
    { path: 'clinicId', select: 'name address' }
  ]);

  res.status(201).json({
    success: true,
    message: 'Treatment record created successfully',
    data: { treatmentRecord }
  });
});

// Get all treatment records
export const getAllTreatmentRecords = catchAsync(async (req: Request, res: Response) => {
  const { page, limit, skip } = getPaginationParams(req);
  const { patientId, dentistId, clinicId, startDate, endDate, procedure } = req.query;

  // Build query
  const query: any = {};

  if (patientId) {
    query.patientId = patientId;
  }

  if (dentistId) {
    query.dentistId = dentistId;
  }

  if (clinicId) {
    query.clinicId = clinicId;
  }

  if (procedure) {
    query.procedure = { $regex: new RegExp(procedure as string, 'i') };
  }

  // Date range filter
  if (startDate || endDate) {
    query.date = {};
    if (startDate) {
      query.date.$gte = new Date(startDate as string);
    }
    if (endDate) {
      query.date.$lte = new Date(endDate as string);
    }
  }

  // Get treatment records with pagination
  const [treatmentRecords, total] = await Promise.all([
    TreatmentRecord.find(query)
      .populate('patientId', 'firstName lastName email dateOfBirth')
      .populate('dentistId', 'firstName lastName specialization')
      .populate('clinicId', 'name address')
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit),
    TreatmentRecord.countDocuments(query)
  ]);

  const paginatedResponse = createPaginatedResponse(treatmentRecords, total, page, limit);

  res.json({
    success: true,
    data: paginatedResponse
  });
});

// Get treatment record by ID
export const getTreatmentRecordById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const treatmentRecord = await TreatmentRecord.findById(id)
    .populate('patientId', 'firstName lastName email dateOfBirth gender address medicalHistory')
    .populate('dentistId', 'firstName lastName specialization email phone')
    .populate('clinicId', 'name address phone email');

  if (!treatmentRecord) {
    throw createNotFoundError('Treatment record');
  }

  res.json({
    success: true,
    data: { treatmentRecord }
  });
});

// Update treatment record
export const updateTreatmentRecord = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const {
    procedure,
    diagnosis,
    notes,
    date
  } = req.body;

  const treatmentRecord = await TreatmentRecord.findById(id);
  if (!treatmentRecord) {
    throw createNotFoundError('Treatment record');
  }

  // Check if user is the dentist who created the record or an admin
  if (treatmentRecord.dentistId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw createValidationError('authorization', 'You can only update your own treatment records');
  }

  // Update fields
  if (procedure) treatmentRecord.procedure = procedure;
  if (diagnosis) treatmentRecord.diagnosis = diagnosis;
  if (notes) treatmentRecord.notes = notes;
  if (date) treatmentRecord.date = new Date(date);

  await treatmentRecord.save();

  // Populate and return updated record
  await treatmentRecord.populate([
    { path: 'patientId', select: 'firstName lastName email' },
    { path: 'dentistId', select: 'firstName lastName specialization' },
    { path: 'clinicId', select: 'name address' }
  ]);

  res.json({
    success: true,
    message: 'Treatment record updated successfully',
    data: { treatmentRecord }
  });
});

// Delete treatment record
export const deleteTreatmentRecord = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const treatmentRecord = await TreatmentRecord.findById(id);
  if (!treatmentRecord) {
    throw createNotFoundError('Treatment record');
  }

  // Check if user is the dentist who created the record or an admin
  if (treatmentRecord.dentistId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw createValidationError('authorization', 'You can only delete your own treatment records');
  }

  // Remove from patient's treatment records
  await Patient.findByIdAndUpdate(
    treatmentRecord.patientId,
    { $pull: { treatmentRecords: id } }
  );

  await TreatmentRecord.findByIdAndDelete(id);

  res.json({
    success: true,
    message: 'Treatment record deleted successfully'
  });
});

// Get treatment records by patient
export const getTreatmentRecordsByPatient = catchAsync(async (req: Request, res: Response) => {
  const { patientId } = req.params;
  const { page, limit, skip } = getPaginationParams(req);

  const patient = await Patient.findById(patientId);
  if (!patient) {
    throw createNotFoundError('Patient');
  }

  const [treatmentRecords, total] = await Promise.all([
    TreatmentRecord.findByPatient(patientId).skip(skip).limit(limit),
    TreatmentRecord.countDocuments({ patientId })
  ]);

  const paginatedResponse = createPaginatedResponse(treatmentRecords, total, page, limit);

  res.json({
    success: true,
    data: {
      patient: {
        _id: patient._id,
        fullName: patient.fullName,
        email: patient.email
      },
      treatmentRecords: paginatedResponse
    }
  });
});

// Get treatment records by dentist
export const getTreatmentRecordsByDentist = catchAsync(async (req: Request, res: Response) => {
  const { dentistId } = req.params;
  const { page, limit, skip } = getPaginationParams(req);

  const dentist = await User.findById(dentistId);
  if (!dentist) {
    throw createNotFoundError('Dentist');
  }

  const [treatmentRecords, total] = await Promise.all([
    TreatmentRecord.findByDentist(dentistId).skip(skip).limit(limit),
    TreatmentRecord.countDocuments({ dentistId })
  ]);

  const paginatedResponse = createPaginatedResponse(treatmentRecords, total, page, limit);

  res.json({
    success: true,
    data: {
      dentist: {
        _id: dentist._id,
        fullName: dentist.fullName,
        specialization: dentist.specialization
      },
      treatmentRecords: paginatedResponse
    }
  });
});

// Get treatment records by clinic
export const getTreatmentRecordsByClinic = catchAsync(async (req: Request, res: Response) => {
  const { clinicId } = req.params;
  const { page, limit, skip } = getPaginationParams(req);

  const clinic = await Clinic.findById(clinicId);
  if (!clinic) {
    throw createNotFoundError('Clinic');
  }

  const [treatmentRecords, total] = await Promise.all([
    TreatmentRecord.findByClinic(clinicId).skip(skip).limit(limit),
    TreatmentRecord.countDocuments({ clinicId })
  ]);

  const paginatedResponse = createPaginatedResponse(treatmentRecords, total, page, limit);

  res.json({
    success: true,
    data: {
      clinic: {
        _id: clinic._id,
        name: clinic.name,
        address: `${clinic.address.street}, ${clinic.address.city}, ${clinic.address.state} ${clinic.address.zipCode}, ${clinic.address.country}`
      },
      treatmentRecords: paginatedResponse
    }
  });
});

// Search treatment records
export const searchTreatmentRecords = catchAsync(async (req: Request, res: Response) => {
  const { q: searchTerm } = req.query;
  const { page, limit, skip } = getPaginationParams(req);

  if (!searchTerm) {
    throw createValidationError('q', 'Search term is required');
  }

  const [treatmentRecords, total] = await TreatmentRecord.searchTreatmentRecords(
    searchTerm as string,
    { skip, limit }
  );

  const paginatedResponse = createPaginatedResponse(treatmentRecords, total, page, limit);

  res.json({
    success: true,
    data: paginatedResponse
  });
});

// Add attachment to treatment record
export const addAttachment = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { description } = req.body;

  if (!req.file) {
    throw createValidationError('file', 'Attachment file is required');
  }

  const treatmentRecord = await TreatmentRecord.findById(id);
  if (!treatmentRecord) {
    throw createNotFoundError('Treatment record');
  }

  // Check if user is the dentist who created the record or an admin
  if (treatmentRecord.dentistId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw createValidationError('authorization', 'You can only add attachments to your own treatment records');
  }

  // Upload file
  const uploadResult = await uploadTreatmentAttachment(
    req.file,
    treatmentRecord.patientId.toString(),
    treatmentRecord._id.toString()
  );

  // Add attachment to treatment record
  const attachment = {
    filename: req.file.originalname,
    url: uploadResult.secure_url,
    fileType: req.file.mimetype,
    fileSize: req.file.size,
    description: description || '',
    uploadedAt: new Date()
  };

  treatmentRecord.addAttachment(attachment);
  await treatmentRecord.save();

  res.json({
    success: true,
    message: 'Attachment added successfully',
    data: { attachment }
  });
});

// Remove attachment from treatment record
export const removeAttachment = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { id, attachmentId } = req.params;

  const treatmentRecord = await TreatmentRecord.findById(id);
  if (!treatmentRecord) {
    throw createNotFoundError('Treatment record');
  }

  // Check if user is the dentist who created the record or an admin
  if (treatmentRecord.dentistId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw createValidationError('authorization', 'You can only remove attachments from your own treatment records');
  }

  treatmentRecord.removeAttachment(attachmentId);
  await treatmentRecord.save();

  res.json({
    success: true,
    message: 'Attachment removed successfully'
  });
});

// Get treatment statistics
export const getTreatmentStatistics = catchAsync(async (req: Request, res: Response) => {
  const { dentistId, clinicId, startDate, endDate } = req.query;

  const matchQuery: any = {};

  if (dentistId) {
    matchQuery.dentistId = dentistId;
  }

  if (clinicId) {
    matchQuery.clinicId = clinicId;
  }

  if (startDate && endDate) {
    matchQuery.date = {
      $gte: new Date(startDate as string),
      $lte: new Date(endDate as string)
    };
  }

  const [procedureStats, totalTreatments, recentTreatments] = await Promise.all([
    TreatmentRecord.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$procedure',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]),
    TreatmentRecord.countDocuments(matchQuery),
    TreatmentRecord.find(matchQuery)
      .populate('patientId', 'firstName lastName')
      .populate('dentistId', 'firstName lastName')
      .sort({ date: -1 })
      .limit(5)
  ]);

  // Format procedure statistics
  const procedureDistribution = procedureStats.reduce((acc, item) => {
    acc[item._id] = item.count;
    return acc;
  }, {});

  res.json({
    success: true,
    data: {
      totalTreatments,
      procedureDistribution,
      recentTreatments
    }
  });
});

// Get treatment records by date range
export const getTreatmentRecordsByDateRange = catchAsync(async (req: Request, res: Response) => {
  const { startDate, endDate } = req.query;
  const { dentistId, clinicId } = req.query;

  if (!startDate || !endDate) {
    throw createValidationError('query', 'Start date and end date are required');
  }

  const query: any = {
    date: {
      $gte: new Date(startDate as string),
      $lte: new Date(endDate as string)
    }
  };

  if (dentistId) {
    query.dentistId = dentistId;
  }

  if (clinicId) {
    query.clinicId = clinicId;
  }

  const treatmentRecords = await TreatmentRecord.find(query)
    .populate('patientId', 'firstName lastName')
    .populate('dentistId', 'firstName lastName')
    .populate('clinicId', 'name')
    .sort({ date: -1 });

  res.json({
    success: true,
    data: { treatmentRecords }
  });
});

// Get recent treatment records
export const getRecentTreatmentRecords = catchAsync(async (req: Request, res: Response) => {
  const { limit = 10, dentistId, clinicId } = req.query;

  const query: any = {};

  if (dentistId) {
    query.dentistId = dentistId;
  }

  if (clinicId) {
    query.clinicId = clinicId;
  }

  const treatmentRecords = await TreatmentRecord.find(query)
    .populate('patientId', 'firstName lastName')
    .populate('dentistId', 'firstName lastName')
    .populate('clinicId', 'name')
    .sort({ date: -1 })
    .limit(parseInt(limit as string));

  res.json({
    success: true,
    data: { treatmentRecords }
  });
});
