import React from 'react';

interface AvatarProps {
  src?: string;
  alt?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fallback?: string;
  className?: string;
  onClick?: () => void;
}

const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = 'Avatar',
  size = 'md',
  fallback,
  className = '',
  onClick
}) => {
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

  return (
    <div className={baseClasses} onClick={handleClick}>
      {src ? (
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Hide image on error and show fallback
            (e.target as HTMLImageElement).style.display = 'none';
          }}
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