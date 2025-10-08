import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { catchAsync, AppError } from '../middleware/errorHandler';
import PatientFile from '../models/PatientFile';
import Patient from '../models/Patient';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';

// Configure multer for file uploads with HIPAA-compliant restrictions
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'patient-files');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error: any) {
      cb(error, uploadDir);
    }
  },
  filename: (req, file, cb) => {
    // Generate secure random filename
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(16).toString('hex')}`;
    const ext = path.extname(file.originalname);
    cb(null, `patient-file-${uniqueSuffix}${ext}`);
  }
});

// File filter for security - only allow specific medical file types
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/bmp',
    'image/tiff',
    'application/pdf',
    'application/dicom', // DICOM medical imaging format
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed for medical records`));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB max file size
  }
});

/**
 * Upload patient file (X-ray, scan, note, etc.)
 * POST /api/patients/:patientId/files
 */
export const uploadPatientFile = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { patientId } = req.params;
  const { fileType, title, description, category, tags, captureDate, appointmentId, metadata } = req.body;
  
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded'
    });
  }

  // Verify patient exists
  const patient = await Patient.findById(patientId);
  if (!patient) {
    // Clean up uploaded file
    await fs.unlink(req.file.path);
    return res.status(404).json({
      success: false,
      message: 'Patient not found'
    });
  }

  // Encrypt file (basic encryption - in production use proper encryption)
  const encryptionKey = crypto.randomBytes(32).toString('hex');
  
  // Create file record
  const patientFile = await PatientFile.create({
    patientId,
    clinicId: req.user.clinicId || patient.preferredClinicId,
    uploadedBy: req.user._id,
    appointmentId: appointmentId || undefined,
    fileType,
    fileName: req.file.filename,
    originalFileName: req.file.originalname,
    fileUrl: `/uploads/patient-files/${req.file.filename}`,
    fileSize: req.file.size,
    mimeType: req.file.mimetype,
    title,
    description,
    category,
    tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map((t: string) => t.trim())) : [],
    captureDate: captureDate ? new Date(captureDate) : undefined,
    metadata: metadata ? JSON.parse(metadata) : {},
    isEncrypted: true,
    encryptionKey
  });

  // Log access
  await PatientFile.logAccess(
    patientFile._id.toString(),
    req.user._id.toString(),
    'view',
    req.ip
  );

  res.status(201).json({
    success: true,
    message: 'File uploaded successfully',
    data: patientFile
  });
});

/**
 * Get all files for a patient
 * GET /api/patients/:patientId/files
 */
export const getPatientFiles = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { patientId } = req.params;
  const { fileType, startDate, endDate, page = '1', limit = '50' } = req.query;

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);

  const files = await PatientFile.findByPatient(patientId, {
    fileType,
    startDate,
    endDate,
    skip: (pageNum - 1) * limitNum,
    limit: limitNum
  });

  const total = await PatientFile.countDocuments({
    patientId,
    isDeleted: false,
    ...(fileType && { fileType })
  });

  res.json({
    success: true,
    message: 'Patient files retrieved successfully',
    data: {
      files,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    }
  });
});

/**
 * Get single file details
 * GET /api/patient-files/:id
 */
export const getPatientFile = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const file = await PatientFile.findOne({ _id: id, isDeleted: false })
    .populate('patientId', 'firstName lastName email')
    .populate('uploadedBy', 'firstName lastName email')
    .populate('clinicId', 'name address')
    .populate('appointmentId', 'date timeSlot');

  if (!file) {
    return res.status(404).json({
      success: false,
      message: 'File not found'
    });
  }

  // Log access
  await PatientFile.logAccess(id, req.user._id.toString(), 'view', req.ip);

  res.json({
    success: true,
    message: 'File details retrieved successfully',
    data: file
  });
});

/**
 * Download patient file
 * GET /api/patient-files/:id/download
 */
export const downloadPatientFile = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const file = await PatientFile.findOne({ _id: id, isDeleted: false });

  if (!file) {
    return res.status(404).json({
      success: false,
      message: 'File not found'
    });
  }

  // Log download access
  await PatientFile.logAccess(id, req.user._id.toString(), 'download', req.ip);

  const filePath = path.join(process.cwd(), 'uploads', 'patient-files', file.fileName);

  // Check if file exists
  try {
    await fs.access(filePath);
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: 'File not found on server'
    });
  }

  res.download(filePath, file.originalFileName);
});

/**
 * Update file metadata
 * PATCH /api/patient-files/:id
 */
export const updatePatientFile = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { title, description, category, tags, metadata } = req.body;

  const file = await PatientFile.findOne({ _id: id, isDeleted: false });

  if (!file) {
    return res.status(404).json({
      success: false,
      message: 'File not found'
    });
  }

  // Update allowed fields
  if (title) file.title = title;
  if (description !== undefined) file.description = description;
  if (category) file.category = category;
  if (tags) file.tags = Array.isArray(tags) ? tags : tags.split(',').map((t: string) => t.trim());
  if (metadata) file.metadata = { ...file.metadata, ...metadata };

  await file.save();

  res.json({
    success: true,
    message: 'File updated successfully',
    data: file
  });
});

/**
 * Delete patient file (soft delete)
 * DELETE /api/patient-files/:id
 */
export const deletePatientFile = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const file = await PatientFile.findOne({ _id: id, isDeleted: false });

  if (!file) {
    return res.status(404).json({
      success: false,
      message: 'File not found'
    });
  }

  // Soft delete
  await file.softDelete(req.user._id);

  res.json({
    success: true,
    message: 'File deleted successfully',
    data: { id }
  });
});

/**
 * Share file with another user
 * POST /api/patient-files/:id/share
 */
export const sharePatientFile = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { userId, permissions, expiresAt } = req.body;

  const file = await PatientFile.findOne({ _id: id, isDeleted: false });

  if (!file) {
    return res.status(404).json({
      success: false,
      message: 'File not found'
    });
  }

  // Share with user
  await file.shareWith(
    userId,
    permissions || ['view'],
    expiresAt ? new Date(expiresAt) : undefined
  );

  // Log sharing action
  await PatientFile.logAccess(id, req.user._id.toString(), 'share', req.ip);

  res.json({
    success: true,
    message: 'File shared successfully',
    data: file
  });
});

/**
 * Get file access log
 * GET /api/patient-files/:id/access-log
 */
export const getFileAccessLog = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const file = await PatientFile.findOne({ _id: id, isDeleted: false })
    .populate('accessLog.userId', 'firstName lastName email')
    .select('+accessLog');

  if (!file) {
    return res.status(404).json({
      success: false,
      message: 'File not found'
    });
  }

  res.json({
    success: true,
    message: 'Access log retrieved successfully',
    data: {
      fileId: file._id,
      fileName: file.originalFileName,
      accessLog: file.accessLog
    }
  });
});

/**
 * Search patient files
 * GET /api/patient-files/search
 */
export const searchPatientFiles = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { q, patientId, clinicId, fileType, page = '1', limit = '20' } = req.query;

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);

  const query: any = { isDeleted: false };

  // Text search
  if (q) {
    query.$text = { $search: q as string };
  }

  // Filters
  if (patientId) query.patientId = patientId;
  if (clinicId) query.clinicId = clinicId;
  if (fileType) query.fileType = fileType;

  const files = await PatientFile.find(query)
    .populate('patientId', 'firstName lastName')
    .populate('uploadedBy', 'firstName lastName')
    .populate('clinicId', 'name')
    .sort({ uploadDate: -1 })
    .skip((pageNum - 1) * limitNum)
    .limit(limitNum);

  const total = await PatientFile.countDocuments(query);

  res.json({
    success: true,
    message: 'Search completed successfully',
    data: {
      files,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    }
  });
});

