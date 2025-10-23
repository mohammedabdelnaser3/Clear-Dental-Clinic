import React, { useState } from 'react';
import ResponsiveImage from './ResponsiveImage';

interface AvatarProps {
  src?: string;
  alt?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fallback?: string;
  className?: string;
  onClick?: () => void;
  // Responsive image sources for different sizes
  sources?: {
    small?: string;
    medium?: string;
    large?: string;
    webp?: {
      small?: string;
      medium?: string;
      large?: string;
    };
  };
  loading?: 'lazy' | 'eager';
}

const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = 'Avatar',
  size = 'md',
  fallback,
  className = '',
  onClick,
  sources,
  loading = 'lazy'
}) => {
  const [imageError, setImageError] = useState(false);
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-12 h-12 text-base',
    lg: 'w-16 h-16 text-lg',
    xl: 'w-24 h-24 text-xl'
  };

  const baseClasses = `
    relative inline-flex items-center justify-center
    rounded-full bg-gray-100 text-gray-600 font-medium
    overflow-hidden border-2 border-gray-200
    ${sizeClasses[size]}
    ${onClick ? 'cursor-pointer hover:bg-gray-200 transition-colors' : ''}
    ${className}
  `;

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div className={baseClasses} onClick={handleClick}>
      {src && !imageError ? (
        <ResponsiveImage
          src={src}
          alt={alt}
          sources={sources}
          loading={loading}
          onError={handleImageError}
          className="w-full h-full object-cover rounded-full"
          sizes="(max-width: 768px) 64px, (max-width: 1024px) 96px, 128px"
        />
      ) : (
        <span className="select-none">
          {fallback ? getInitials(fallback) : '?'}
        </span>
      )}
    </div>
  );
};

export default Avatar;