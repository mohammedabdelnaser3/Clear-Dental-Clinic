import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import { Request as _Request } from 'express';
import path from 'path';
import fs from 'fs';
import { AppError } from '../middleware/errorHandler';

// Configure Cloudinary
const isCloudinaryConfigured = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

// File filter function
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Allowed file types
  const allowedTypes = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'application/pdf': 'pdf',
    'text/plain': 'txt'
  };

  if (allowedTypes[file.mimetype as keyof typeof allowedTypes]) {
    cb(null, true);
  } else {
    cb(new AppError('Invalid file type. Only JPEG, PNG, GIF, PDF, and TXT files are allowed.', 400));
  }
};

// Multer configuration for memory storage
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880'), // 5MB default
    files: 5 // Maximum 5 files per request
  },
  fileFilter: fileFilter as any
});

// Single file upload middleware
export const uploadSingle = (fieldName: string) => upload.single(fieldName);

// Upload to local storage (fallback when Cloudinary is not configured)
const uploadToLocal = async (
  file: Express.Multer.File,
  folder: string = 'dental-clinic'
): Promise<{
  public_id: string;
  secure_url: string;
  format: string;
  bytes: number;
}> => {
  try {
    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'uploads', folder);
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = path.extname(file.originalname);
    const filename = `${timestamp}-${randomString}${fileExtension}`;
    const filePath = path.join(uploadsDir, filename);

    // Write file to disk
    fs.writeFileSync(filePath, file.buffer);

    // Return URL that can be served by the backend
    const baseUrl = process.env.CLIENT_URL || 'http://localhost:5000';
    const fileUrl = `${baseUrl}/uploads/${folder}/${filename}`;

    return {
      public_id: `${folder}/${filename}`,
      secure_url: fileUrl,
      format: fileExtension.substring(1),
      bytes: file.buffer.length
    };
  } catch (error) {
    throw new AppError('Failed to save file locally', 500);
  }
};

// Upload single file to Cloudinary or local storage
export const uploadToCloudinary = async (
  file: Express.Multer.File,
  folder: string = 'dental-clinic'
): Promise<{
  public_id: string;
  secure_url: string;
  format: string;
  bytes: number;
}> => {
  // Use local storage if Cloudinary is not configured
  if (!isCloudinaryConfigured) {
    console.log('Cloudinary not configured, using local storage');
    return uploadToLocal(file, folder);
  }

  try {
    return new Promise((resolve, reject) => {
      const uploadOptions = {
        folder,
        resource_type: 'auto' as const,
        quality: 'auto',
        fetch_format: 'auto'
      };

      cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            reject(new AppError('Failed to upload file to cloud storage', 500));
          } else if (result) {
            resolve({
              public_id: result.public_id,
              secure_url: result.secure_url,
              format: result.format,
              bytes: result.bytes
            });
          } else {
            reject(new AppError('Upload failed - no result returned', 500));
          }
        }
      ).end(file.buffer);
    });
  } catch (error) {
    console.error('Upload error:', error);
    throw new AppError('File upload failed', 500);
  }
};

// Upload multiple files to Cloudinary
export const uploadMultipleToCloudinary = async (
  files: Express.Multer.File[],
  folder: string = 'dental-clinic'
): Promise<Array<{
  public_id: string;
  secure_url: string;
  format: string;
  bytes: number;
  originalName: string;
}>> => {
  try {
    const uploadPromises = files.map(async (file) => {
      const result = await uploadToCloudinary(file, folder);
      return {
        ...result,
        originalName: file.originalname
      };
    });

    return await Promise.all(uploadPromises);
  } catch (error) {
    throw new AppError('Failed to upload multiple files', 500);
  }
};

// Delete file from Cloudinary
export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Failed to delete file from Cloudinary:', error);
    throw new AppError('Failed to delete file from cloud storage', 500);
  }
};

// Delete multiple files from Cloudinary
export const deleteMultipleFromCloudinary = async (publicIds: string[]): Promise<void> => {
  try {
    await cloudinary.api.delete_resources(publicIds);
  } catch (error) {
    console.error('Failed to delete multiple files from Cloudinary:', error);
    throw new AppError('Failed to delete files from cloud storage', 500);
  }
};

// Generate optimized image URL
export const getOptimizedImageUrl = (
  publicId: string,
  options: {
    width?: number;
    height?: number;
    crop?: string;
    quality?: string;
    format?: string;
  } = {}
): string => {
  const {
    width = 800,
    height = 600,
    crop = 'fill',
    quality = 'auto',
    format = 'auto'
  } = options;

  return cloudinary.url(publicId, {
    width,
    height,
    crop,
    quality,
    fetch_format: format
  });
};

// Generate thumbnail URL
export const getThumbnailUrl = (publicId: string, size: number = 150): string => {
  return cloudinary.url(publicId, {
    width: size,
    height: size,
    crop: 'fill',
    quality: 'auto',
    fetch_format: 'auto'
  });
};

// Validate file size
export const validateFileSize = (file: Express.Multer.File, maxSize?: number): boolean => {
  const maxFileSize = maxSize || parseInt(process.env.MAX_FILE_SIZE || '5242880');
  return file.size <= maxFileSize;
};

// Get file extension
export const getFileExtension = (filename: string): string => {
  return path.extname(filename).toLowerCase();
};

// Generate unique filename
export const generateUniqueFilename = (originalName: string): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  const extension = getFileExtension(originalName);
  const nameWithoutExt = path.basename(originalName, extension);
  
  return `${nameWithoutExt}_${timestamp}_${random}${extension}`;
};

// Check if file is image
export const isImageFile = (mimetype: string): boolean => {
  return mimetype.startsWith('image/');
};

// Check if file is PDF
export const isPdfFile = (mimetype: string): boolean => {
  return mimetype === 'application/pdf';
};

// Get file type category
export const getFileTypeCategory = (mimetype: string): 'image' | 'document' | 'other' => {
  if (isImageFile(mimetype)) {
    return 'image';
  } else if (isPdfFile(mimetype) || mimetype === 'text/plain') {
    return 'document';
  } else {
    return 'other';
  }
};

// Format file size
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Upload profile image
export const uploadProfileImage = async (file: Express.Multer.File, userId: string) => {
  if (!isImageFile(file.mimetype)) {
    throw new AppError('Only image files are allowed for profile pictures', 400);
  }

  const folder = `dental-clinic/profiles/${userId}`;
  return await uploadToCloudinary(file, folder);
};

// Upload treatment attachment
export const uploadTreatmentAttachment = async (
  file: Express.Multer.File,
  patientId: string,
  treatmentId: string
) => {
  const folder = `dental-clinic/treatments/${patientId}/${treatmentId}`;
  return await uploadToCloudinary(file, folder);
};

// Upload clinic image
export const uploadClinicImage = async (file: Express.Multer.File, clinicId: string) => {
  if (!isImageFile(file.mimetype)) {
    throw new AppError('Only image files are allowed for clinic images', 400);
  }

  const folder = `dental-clinic/clinics/${clinicId}`;
  return await uploadToCloudinary(file, folder);
};

// Clean up orphaned files (files uploaded but not saved to database)
export const cleanupOrphanedFiles = async (publicIds: string[]): Promise<void> => {
  try {
    if (publicIds.length > 0) {
      await deleteMultipleFromCloudinary(publicIds);
      console.log(`Cleaned up ${publicIds.length} orphaned files`);
    }
  } catch (error) {
    console.error('Failed to cleanup orphaned files:', error);
  }
};

// Get file info from Cloudinary
export const getFileInfo = async (publicId: string) => {
  try {
    return await cloudinary.api.resource(publicId);
  } catch (error) {
    throw new AppError('Failed to get file information', 500);
  }
};