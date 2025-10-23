import React from 'react';
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface ErrorFallbackProps {
  error?: Error | string;
  onRetry?: () => void;
  title?: string;
  message?: string;
  showRetry?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: {
    container: 'p-3',
    icon: 'w-6 h-6',
    title: 'text-sm font-medium',
    message: 'text-xs',
    button: 'px-2 py-1 text-xs'
  },
  md: {
    container: 'p-4',
    icon: 'w-8 h-8',
    title: 'text-base font-medium',
    message: 'text-sm',
    button: 'px-3 py-2 text-sm'
  },
  lg: {
    container: 'p-6',
    icon: 'w-12 h-12',
    title: 'text-lg font-semibold',
    message: 'text-base',
    button: 'px-4 py-2 text-base'
  }
};

export const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  onRetry,
  title,
  message,
  showRetry = true,
  className = '',
  size = 'md'
}) => {
  const classes = sizeClasses[size];
  
  const getErrorMessage = () => {
    if (message) return message;
    if (typeof error === 'string') return error;
    if (error instanceof Error) return error.message;
    return 'Something went wrong. Please try again.';
  };

  const getTitle = () => {
    if (title) return title;
    return 'Unable to load data';
  };

  return (
    <div className={`flex flex-col items-center justify-center text-center ${classes.container} ${className}`}>
      <ExclamationTriangleIcon className={`${classes.icon} text-red-500 mb-3`} />
      
      <h3 className={`${classes.title} text-gray-900 mb-2`}>
        {getTitle()}
      </h3>
      
      <p className={`${classes.message} text-gray-600 mb-4 max-w-md`}>
        {getErrorMessage()}
      </p>
      
      {showRetry && onRetry && (
        <button
          onClick={onRetry}
          className={`
            ${classes.button}
            bg-blue-600 text-white rounded-md hover:bg-blue-700 
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            transition-colors duration-200 flex items-center gap-2
          `}
        >
          <ArrowPathIcon className="w-4 h-4" />
          Try Again
        </button>
      )}
    </div>
  );
};

interface DataErrorFallbackProps {
  onRetry?: () => void;
  entityName?: string;
  className?: string;
}

export const DataErrorFallback: React.FC<DataErrorFallbackProps> = ({
  onRetry,
  entityName = 'data',
  className = ''
}) => {
  return (
    <ErrorFallback
      title={`Unable to load ${entityName}`}
      message={`We couldn't load your ${entityName}. This might be a temporary issue.`}
      onRetry={onRetry}
      className={className}
      size="md"
    />
  );
};

interface NetworkErrorFallbackProps {
  onRetry?: () => void;
  className?: string;
}

export const NetworkErrorFallback: React.FC<NetworkErrorFallbackProps> = ({
  onRetry,
  className = ''
}) => {
  return (
    <ErrorFallback
      title="Connection Problem"
      message="Please check your internet connection and try again."
      onRetry={onRetry}
      className={className}
      size="md"
    />
  );
};

interface EmptyStateFallbackProps {
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
  icon?: React.ReactNode;
}

export const EmptyStateFallback: React.FC<EmptyStateFallbackProps> = ({
  title = 'No data available',
  message = 'There is no data to display at the moment.',
  actionLabel,
  onAction,
  className = '',
  icon
}) => {
  const classes = sizeClasses.md;
  
  return (
    <div className={`flex flex-col items-center justify-center text-center ${classes.container} ${className}`}>
      {icon || (
        <div className={`${classes.icon} bg-gray-100 rounded-full flex items-center justify-center mb-3`}>
          <ExclamationTriangleIcon className="w-6 h-6 text-gray-400" />
        </div>
      )}
      
      <h3 className={`${classes.title} text-gray-900 mb-2`}>
        {title}
      </h3>
      
      <p className={`${classes.message} text-gray-600 mb-4 max-w-md`}>
        {message}
      </p>
      
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className={`
            ${classes.button}
            bg-blue-600 text-white rounded-md hover:bg-blue-700 
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            transition-colors duration-200
          `}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default ErrorFallback;