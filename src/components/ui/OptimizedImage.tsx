import React, { useState, useRef, useEffect } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  placeholder?: 'blur' | 'skeleton' | 'none';
  fallbackSrc?: string;
  onLoad?: () => void;
  onError?: () => void;
  sizes?: string;
  loading?: 'lazy' | 'eager';
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className = '',
  width,
  height,
  priority = false,
  placeholder = 'skeleton',
  fallbackSrc,
  onLoad,
  onError,
  sizes,
  loading = 'lazy'
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || isInView) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observerRef.current?.disconnect();
          }
        });
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    if (imgRef.current) {
      observerRef.current.observe(imgRef.current);
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, [priority, isInView]);

  const handleLoad = () => {
    setImageLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setImageError(true);
    onError?.();
  };

  // Generate WebP and fallback sources
  const getOptimizedSrc = (originalSrc: string, format: 'webp' | 'original' = 'original') => {
    if (format === 'webp' && originalSrc.includes('.jpg')) {
      return originalSrc.replace('.jpg', '.webp');
    }
    return originalSrc;
  };

  // Generate responsive sizes
  const getResponsiveSizes = () => {
    if (sizes) return sizes;
    return '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw';
  };

  // Skeleton placeholder
  const SkeletonPlaceholder = () => (
    <div 
      className={`bg-gray-200 animate-pulse rounded-lg ${className}`}
      style={{ width, height }}
    >
      <div className="flex items-center justify-center h-full">
        <svg 
          className="w-12 h-12 text-gray-400" 
          fill="currentColor" 
          viewBox="0 0 20 20"
        >
          <path 
            fillRule="evenodd" 
            d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" 
            clipRule="evenodd" 
          />
        </svg>
      </div>
    </div>
  );

  // Blur placeholder
  const BlurPlaceholder = () => (
    <div 
      className={`bg-gradient-to-br from-blue-100 to-indigo-100 blur-sm ${className}`}
      style={{ width, height }}
    />
  );

  if (!isInView && !priority) {
    return (
      <div ref={imgRef} className={className} style={{ width, height }}>
        {placeholder === 'skeleton' && <SkeletonPlaceholder />}
        {placeholder === 'blur' && <BlurPlaceholder />}
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`} ref={imgRef}>
      {/* Show placeholder while loading */}
      {!imageLoaded && placeholder !== 'none' && (
        <div className="absolute inset-0">
          {placeholder === 'skeleton' && <SkeletonPlaceholder />}
          {placeholder === 'blur' && <BlurPlaceholder />}
        </div>
      )}

      {/* Main image with WebP support */}
      <picture>
        <source 
          srcSet={getOptimizedSrc(src, 'webp')} 
          type="image/webp"
          sizes={getResponsiveSizes()}
        />
        <img
          src={imageError && fallbackSrc ? fallbackSrc : src}
          alt={alt}
          width={width}
          height={height}
          loading={loading}
          onLoad={handleLoad}
          onError={handleError}
          className={`transition-opacity duration-500 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          } ${className}`}
          sizes={getResponsiveSizes()}
        />
      </picture>

      {/* Loading indicator */}
      {!imageLoaded && !imageError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Error state */}
      {imageError && !fallbackSrc && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="text-sm">Failed to load image</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default OptimizedImage;