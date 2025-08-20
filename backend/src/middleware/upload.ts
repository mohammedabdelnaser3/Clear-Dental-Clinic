import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request as _Request } from 'express';
import { AppError } from '../utils/AppError';

// Ensure upload directories exist
const ensureDirectoryExists = (dirPath: string) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Create upload directories
const uploadDirs = {
  profiles: path.join(process.cwd(), 'uploads', 'profiles'),
  clinics: path.join(process.cwd(), 'uploads', 'clinics'),
  treatments: path.join(process.cwd(), 'uploads', 'treatments'),
  documents: path.join(process.cwd(), 'uploads', 'documents')
};

// Ensure all directories exist
Object.values(uploadDirs).forEach(ensureDirectoryExists);

// File filter function
const fileFilter = (allowedTypes: string[]) => {
  return (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const fileExtension = path.extname(file.originalname).toLowerCase();
    const mimeType = file.mimetype;
    
    // Check file extension
    if (allowedTypes.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new AppError(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`, 400));
    }
  };
};

// Storage configuration
const createStorage = (uploadPath: string) => {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      ensureDirectoryExists(uploadPath);
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      // Generate unique filename
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const fileExtension = path.extname(file.originalname);
      const fileName = `${file.fieldname}-${uniqueSuffix}${fileExtension}`;
      cb(null, fileName);
    }
  });
};

// Image upload configuration
const imageFilter = fileFilter(['.jpg', '.jpeg', '.png', '.gif', '.webp']);
const imageUpload = (uploadPath: string, maxSize: number = 5 * 1024 * 1024) => {
  return multer({
    storage: createStorage(uploadPath),
    fileFilter: imageFilter as any,
    limits: {
      fileSize: maxSize, // Default 5MB
      files: 10 // Maximum 10 files
    }
  });
};

// Document upload configuration
const documentFilter = fileFilter(['.pdf', '.doc', '.docx', '.txt', '.jpg', '.jpeg', '.png']);
const documentUpload = (uploadPath: string, maxSize: number = 10 * 1024 * 1024) => {
  return multer({
    storage: createStorage(uploadPath),
    fileFilter: documentFilter as any,
    limits: {
      fileSize: maxSize, // Default 10MB
      files: 5 // Maximum 5 files
    }
  });
};

// Profile image upload
export const uploadProfileImage = imageUpload(uploadDirs.profiles, 2 * 1024 * 1024).single('profileImage');

// Clinic images upload
export const uploadClinicImages = imageUpload(uploadDirs.clinics, 5 * 1024 * 1024).array('images', 10);

// Treatment attachments upload
export const uploadTreatmentAttachments = documentUpload(uploadDirs.treatments, 10 * 1024 * 1024).array('attachments', 5);

// General document upload
export const uploadDocuments = documentUpload(uploadDirs.documents, 10 * 1024 * 1024).array('documents', 5);

// Single document upload
export const uploadSingleDocument = documentUpload(uploadDirs.documents, 10 * 1024 * 1024).single('document');

// Custom upload middleware with error handling
export const handleUploadError = (uploadMiddleware: any) => {
  return (req: Request, res: any, next: any) => {
    uploadMiddleware(req, res, (error: any) => {
      if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
          return next(new AppError('File too large', 400));
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
          return next(new AppError('Too many files', 400));
        }
        if (error.code === 'LIMIT_UNEXPECTED_FILE') {
          return next(new AppError('Unexpected file field', 400));
        }
        return next(new AppError(`Upload error: ${error.message}`, 400));
      }
      if (error) {
        return next(error);
      }
      next();
    });
  };
};

// Wrapped upload middlewares with error handling
export const uploadProfileImageWithErrorHandling = handleUploadError(uploadProfileImage);
export const uploadClinicImagesWithErrorHandling = handleUploadError(uploadClinicImages);
export const uploadTreatmentAttachmentsWithErrorHandling = handleUploadError(uploadTreatmentAttachments);
export const uploadDocumentsWithErrorHandling = handleUploadError(uploadDocuments);
export const uploadSingleDocumentWithErrorHandling = handleUploadError(uploadSingleDocument);

// File cleanup utility
export const deleteFile = (filePath: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    fs.unlink(filePath, (error) => {
      if (error && error.code !== 'ENOENT') {
        reject(error);
      } else {
        resolve();
      }
    });
  });
};

// Delete multiple files
export const deleteFiles = async (filePaths: string[]): Promise<void> => {
  const deletePromises = filePaths.map(filePath => deleteFile(filePath));
  await Promise.allSettled(deletePromises);
};

// Get file URL
export const getFileUrl = (filename: string, type: 'profiles' | 'clinics' | 'treatments' | 'documents'): string => {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  return `${baseUrl}/uploads/${type}/${filename}`;
};

// Validate file existence
export const fileExists = (filePath: string): boolean => {
  return fs.existsSync(filePath);
};

// Get file info
export const getFileInfo = (filePath: string) => {
  if (!fileExists(filePath)) {
    return null;
  }
  
  const stats = fs.statSync(filePath);
  return {
    size: stats.size,
    createdAt: stats.birthtime,
    modifiedAt: stats.mtime,
    extension: path.extname(filePath),
    name: path.basename(filePath)
  };
};

// Create custom upload middleware
export const createCustomUpload = (options: {
  destination: string;
  allowedTypes: string[];
  maxSize: number;
  maxFiles: number;
  fieldName: string;
  multiple?: boolean;
}) => {
  const { destination, allowedTypes, maxSize, maxFiles, fieldName, multiple = false } = options;
  
  const storage = createStorage(destination);
  const filter = fileFilter(allowedTypes);
  
  const upload = multer({
    storage,
    fileFilter: filter as any,
    limits: {
      fileSize: maxSize,
      files: maxFiles
    }
  });
  
  return multiple ? upload.array(fieldName, maxFiles) : upload.single(fieldName);
};

// Export upload directories for reference
export { uploadDirs };