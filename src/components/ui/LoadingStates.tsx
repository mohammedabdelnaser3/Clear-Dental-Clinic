import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
  className = '', 
  width = '100%', 
  height = '1rem',
  rounded = false 
}) => (
  <div 
    className={`bg-gray-200 animate-pulse ${rounded ? 'rounded-full' : 'rounded'} ${className}`}
    style={{ width, height }}
  />
);

interface HeroSkeletonProps {
  className?: string;
}

export const HeroSkeleton: React.FC<HeroSkeletonProps> = ({ className = '' }) => (
  <section className={`relative bg-gradient-to-br from-gray-300 to-gray-400 py-20 md:py-32 overflow-hidden ${className}`}>
    <div className="container mx-auto px-4">
      <div className="flex flex-col lg:flex-row items-center gap-12">
        {/* Left side skeleton */}
        <div className="lg:w-1/2 text-center lg:text-left space-y-8">
          <Skeleton width="60%" height="2rem" />
          <div className="space-y-4">
            <Skeleton width="100%" height="4rem" />
            <Skeleton width="80%" height="4rem" />
          </div>
          <Skeleton width="90%" height="1.5rem" />
          <div className="flex gap-4">
            <Skeleton width="150px" height="3rem" />
            <Skeleton width="150px" height="3rem" />
          </div>
          <div className="flex gap-2">
            <Skeleton width="120px" height="2rem" rounded />
            <Skeleton width="120px" height="2rem" rounded />
            <Skeleton width="120px" height="2rem" rounded />
          </div>
        </div>
        
        {/* Right side skeleton */}
        <div className="lg:w-1/2 flex justify-center">
          <div className="relative max-w-lg w-full">
            <Skeleton width="100%" height="400px" className="rounded-3xl" />
            <div className="absolute -bottom-8 -left-8">
              <Skeleton width="200px" height="80px" className="rounded-2xl" />
            </div>
            <div className="absolute -top-8 -right-8">
              <Skeleton width="120px" height="80px" className="rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ 
  size = 'md', 
  color = 'text-blue-600',
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-current ${sizeClasses[size]} ${color} ${className}`} />
  );
};

interface LoadingOverlayProps {
  isLoading: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ 
  isLoading, 
  children, 
  fallback 
}) => {
  if (isLoading) {
    return (
      <div className="relative">
        {fallback || <HeroSkeleton />}
      </div>
    );
  }

  return <>{children}</>;
};

interface ProgressBarProps {
  progress: number;
  className?: string;
  showPercentage?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ 
  progress, 
  className = '',
  showPercentage = false 
}) => (
  <div className={`w-full bg-gray-200 rounded-full h-2 ${className}`}>
    <div 
      className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
      style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
    />
    {showPercentage && (
      <div className="text-sm text-gray-600 mt-1 text-center">
        {Math.round(progress)}%
      </div>
    )}
  </div>
);

export default {
  Skeleton,
  HeroSkeleton,
  Spinner,
  LoadingOverlay,
  ProgressBar
};