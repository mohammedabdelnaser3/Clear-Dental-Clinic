import React from 'react';
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  onRetry,
  className = '',
  size = 'md',
  showIcon = true
}) => {
  const sizeClasses = {
    sm: 'p-4 text-sm',
    md: 'p-6 text-base',
    lg: 'p-8 text-lg'
  };

  const iconSizes = {
    sm: 'h-5 w-5',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <div className={`
      bg-red-50 border border-red-200 rounded-lg ${sizeClasses[size]} ${className}
    `}>
      <div className="flex items-start">
        {showIcon && (
          <ExclamationTriangleIcon className={`
            ${iconSizes[size]} text-red-400 mr-3 flex-shrink-0 mt-0.5
          `} />
        )}
        <div className="flex-1">
          <h3 className="font-medium text-red-800 mb-1">
            Something went wrong
          </h3>
          <p className="text-red-700 mb-4">
            {message}
          </p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm 
                       font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 
                       focus:ring-red-500 focus:ring-offset-2 transition-colors duration-200"
            >
              <ArrowPathIcon className="h-4 w-4 mr-2" />
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorMessage;