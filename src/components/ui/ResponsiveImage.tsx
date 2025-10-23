import React from 'react';
import LazyImage from './LazyImage';

export interface ResponsiveImageProps {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  loading?: 'lazy' | 'eager';
  onLoad?: () => void;
  onError?: () => void;
  placeholder?: string;
  fallback?: string;
  // Responsive image sources
  sources?: {
    small?: string;   // < 768px
    medium?: string;  // 768px - 1024px
    large?: string;   // > 1024px
    webp?: {
      small?: string;
      medium?: string;
      large?: string;
    };
  };
}

/**
 * ResponsiveImage Component
 * 
 * Provides responsive images with multiple sources and formats
 * Automatically generates srcSet and sizes attributes
 * Supports WebP format with fallbacks
 */
const ResponsiveImage: React.FC<ResponsiveImageProps> = ({
  src,
  alt,
  className,
  sizes,
  loading = 'lazy',
  onLoad,
  onError,
  placeholder,
  fallback,
  sources
}) => {
  // Generate srcSet from sources
  const generateSrcSet = (format?: 'webp' | 'default'): string => {
    if (!sources) return '';

    const srcList: string[] = [];
    
    if (format === 'webp' && sources.webp) {
      if (sources.webp.small) srcList.push(`${sources.webp.small} 480w`);
      if (sources.webp.medium) srcList.push(`${sources.webp.medium} 768w`);
      if (sources.webp.large) srcList.push(`${sources.webp.large} 1024w`);
    } else {
      if (sources.small) srcList.push(`${sources.small} 480w`);
      if (sources.medium) srcList.push(`${sources.medium} 768w`);
      if (sources.large) srcList.push(`${sources.large} 1024w`);
    }
    
    return srcList.join(', ');
  };

  // Default sizes if not provided
  const defaultSizes = sizes || '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw';

  // If sources are provided, use picture element for better format support
  if (sources) {
    return (
      <picture className={className}>
        {/* WebP sources if available */}
        {sources.webp && (
          <source
            srcSet={generateSrcSet('webp')}
            sizes={defaultSizes}
            type="image/webp"
          />
        )}
        
        {/* Fallback sources */}
        <source
          srcSet={generateSrcSet('default')}
          sizes={defaultSizes}
          type="image/jpeg"
        />
        
        {/* Fallback img element */}
        <LazyImage
          src={src}
          alt={alt}
          loading={loading}
          onLoad={onLoad}
          onError={onError}
          placeholder={placeholder}
          fallback={fallback}
          className="w-full h-full object-cover"
        />
      </picture>
    );
  }

  // Simple responsive image without multiple sources
  return (
    <LazyImage
      src={src}
      alt={alt}
      className={className}
      sizes={defaultSizes}
      loading={loading}
      onLoad={onLoad}
      onError={onError}
      placeholder={placeholder}
      fallback={fallback}
    />
  );
};

export default ResponsiveImage;