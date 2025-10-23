/**
 * Image optimization utilities for profile pictures and other images
 * Provides compression, resizing, and format conversion capabilities
 */

export interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 to 1.0
  format?: 'jpeg' | 'png' | 'webp';
  maxSizeKB?: number;
}

export interface OptimizedImage {
  file: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  dimensions: { width: number; height: number };
}

/**
 * Compress and resize an image file
 * @param file - Original image file
 * @param options - Optimization options
 * @returns Promise<OptimizedImage> - Optimized image with metadata
 */
export const optimizeImage = async (
  file: File,
  options: ImageOptimizationOptions = {}
): Promise<OptimizedImage> => {
  const {
    maxWidth = 800,
    maxHeight = 800,
    quality = 0.8,
    format = 'jpeg',
    maxSizeKB = 500
  } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    img.onload = () => {
      try {
        // Calculate new dimensions while maintaining aspect ratio
        const { width: newWidth, height: newHeight } = calculateDimensions(
          img.width,
          img.height,
          maxWidth,
          maxHeight
        );

        // Set canvas dimensions
        canvas.width = newWidth;
        canvas.height = newHeight;

        // Draw and compress image
        ctx.drawImage(img, 0, 0, newWidth, newHeight);

        // Convert to blob with specified quality and format
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }

            // Check if compressed size meets requirements
            const compressedSizeKB = blob.size / 1024;
            
            if (compressedSizeKB > maxSizeKB) {
              // Try with lower quality if still too large
              const lowerQuality = Math.max(0.1, quality - 0.2);
              canvas.toBlob(
                (secondBlob) => {
                  if (!secondBlob) {
                    reject(new Error('Failed to compress image with lower quality'));
                    return;
                  }

                  const optimizedFile = new File([secondBlob], file.name, {
                    type: `image/${format}`,
                    lastModified: Date.now()
                  });

                  resolve({
                    file: optimizedFile,
                    originalSize: file.size,
                    compressedSize: secondBlob.size,
                    compressionRatio: (1 - secondBlob.size / file.size) * 100,
                    dimensions: { width: newWidth, height: newHeight }
                  });
                },
                `image/${format}`,
                lowerQuality
              );
            } else {
              const optimizedFile = new File([blob], file.name, {
                type: `image/${format}`,
                lastModified: Date.now()
              });

              resolve({
                file: optimizedFile,
                originalSize: file.size,
                compressedSize: blob.size,
                compressionRatio: (1 - blob.size / file.size) * 100,
                dimensions: { width: newWidth, height: newHeight }
              });
            }
          },
          `image/${format}`,
          quality
        );
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    // Create object URL for the image
    const objectUrl = URL.createObjectURL(file);
    img.src = objectUrl;

    // Clean up object URL after loading
    const originalOnload = img.onload;
    img.onload = (event) => {
      URL.revokeObjectURL(objectUrl);
      if (originalOnload) {
        originalOnload.call(img, event);
      }
    };
  });
};

/**
 * Calculate new dimensions while maintaining aspect ratio
 * @param originalWidth - Original image width
 * @param originalHeight - Original image height
 * @param maxWidth - Maximum allowed width
 * @param maxHeight - Maximum allowed height
 * @returns Object with new width and height
 */
const calculateDimensions = (
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } => {
  let { width, height } = { width: originalWidth, height: originalHeight };

  // Calculate scaling factor
  const widthRatio = maxWidth / width;
  const heightRatio = maxHeight / height;
  const scalingFactor = Math.min(widthRatio, heightRatio, 1); // Don't upscale

  width = Math.round(width * scalingFactor);
  height = Math.round(height * scalingFactor);

  return { width, height };
};

/**
 * Generate multiple sizes of an image for responsive display
 * @param file - Original image file
 * @param sizes - Array of size configurations
 * @returns Promise<Record<string, OptimizedImage>> - Object with size names as keys
 */
export const generateResponsiveImages = async (
  file: File,
  sizes: Array<{ name: string; width: number; height?: number; quality?: number }>
): Promise<Record<string, OptimizedImage>> => {
  const results: Record<string, OptimizedImage> = {};

  for (const size of sizes) {
    try {
      const optimized = await optimizeImage(file, {
        maxWidth: size.width,
        maxHeight: size.height || size.width,
        quality: size.quality || 0.8,
        format: 'jpeg'
      });
      results[size.name] = optimized;
    } catch (error) {
      console.error(`Failed to generate ${size.name} size:`, error);
    }
  }

  return results;
};

/**
 * Validate image file before processing
 * @param file - File to validate
 * @param options - Validation options
 * @returns Object with validation result and error message if invalid
 */
export const validateImageFile = (
  file: File,
  options: {
    maxSizeMB?: number;
    allowedTypes?: string[];
    minWidth?: number;
    minHeight?: number;
  } = {}
): { isValid: boolean; error?: string } => {
  const {
    maxSizeMB = 10,
    allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  } = options;

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`
    };
  }

  // Check file size
  const fileSizeMB = file.size / (1024 * 1024);
  if (fileSizeMB > maxSizeMB) {
    return {
      isValid: false,
      error: `File size (${fileSizeMB.toFixed(1)}MB) exceeds maximum allowed size (${maxSizeMB}MB)`
    };
  }

  return { isValid: true };
};

/**
 * Create a preview URL for an image file
 * @param file - Image file
 * @returns Object URL for preview (remember to revoke when done)
 */
export const createImagePreview = (file: File): string => {
  return URL.createObjectURL(file);
};

/**
 * Revoke an image preview URL to free memory
 * @param url - Object URL to revoke
 */
export const revokeImagePreview = (url: string): void => {
  URL.revokeObjectURL(url);
};

/**
 * Convert image to WebP format if supported by browser
 * @param file - Original image file
 * @param quality - Compression quality (0.1 to 1.0)
 * @returns Promise<File> - WebP file or original if not supported
 */
export const convertToWebP = async (file: File, quality: number = 0.8): Promise<File> => {
  // Check if browser supports WebP
  const canvas = document.createElement('canvas');
  const supportsWebP = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;

  if (!supportsWebP) {
    return file; // Return original file if WebP not supported
  }

  try {
    const optimized = await optimizeImage(file, {
      format: 'webp',
      quality
    });
    return optimized.file;
  } catch (error) {
    console.warn('Failed to convert to WebP, using original:', error);
    return file;
  }
};

/**
 * Profile image specific optimization
 * Generates standard profile image sizes and formats
 * @param file - Original profile image file
 * @returns Promise<ProfileImageSet> - Set of optimized profile images
 */
export interface ProfileImageSet {
  thumbnail: OptimizedImage; // 64x64
  small: OptimizedImage;     // 128x128
  medium: OptimizedImage;    // 256x256
  large: OptimizedImage;     // 512x512
  original?: OptimizedImage; // Original size (if under limits)
}

export const optimizeProfileImage = async (file: File): Promise<ProfileImageSet> => {
  const validation = validateImageFile(file, {
    maxSizeMB: 5,
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
  });

  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  const sizes = [
    { name: 'thumbnail', width: 64, quality: 0.9 },
    { name: 'small', width: 128, quality: 0.85 },
    { name: 'medium', width: 256, quality: 0.8 },
    { name: 'large', width: 512, quality: 0.75 }
  ];

  const optimizedImages = await generateResponsiveImages(file, sizes);

  // Include original if it's reasonably sized
  let original: OptimizedImage | undefined;
  if (file.size <= 2 * 1024 * 1024) { // 2MB limit for original
    try {
      original = await optimizeImage(file, {
        maxWidth: 1024,
        maxHeight: 1024,
        quality: 0.8
      });
    } catch (error) {
      console.warn('Failed to optimize original image:', error);
    }
  }

  return {
    thumbnail: optimizedImages.thumbnail,
    small: optimizedImages.small,
    medium: optimizedImages.medium,
    large: optimizedImages.large,
    original
  };
};