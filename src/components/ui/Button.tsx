import React from 'react';
import type { ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'light' | 'dark' | 'link' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  isFullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  isFullWidth = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  onClick,
  ...rest
}) => {
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if ((e.key === 'Enter' || e.key === ' ') && onClick && !disabled && !isLoading) {
      e.preventDefault();
      onClick(e as unknown as React.MouseEvent<HTMLButtonElement>);
    }
  };
  const getVariantClasses = (): string => {
    const disabledStyles = disabled || isLoading ? '' : '';
    switch (variant) {
      case 'primary':
        return `bg-blue-600 ${!disabled && !isLoading ? 'hover:bg-blue-700 active:bg-blue-800' : ''} text-white focus:ring-blue-500 ${disabledStyles}`;
      case 'secondary':
        return `bg-gray-600 ${!disabled && !isLoading ? 'hover:bg-gray-700 active:bg-gray-800' : ''} text-white focus:ring-gray-500 ${disabledStyles}`;
      case 'success':
        return `bg-green-600 ${!disabled && !isLoading ? 'hover:bg-green-700 active:bg-green-800' : ''} text-white focus:ring-green-500 ${disabledStyles}`;
      case 'danger':
        return `bg-red-600 ${!disabled && !isLoading ? 'hover:bg-red-700 active:bg-red-800' : ''} text-white focus:ring-red-500 ${disabledStyles}`;
      case 'warning':
        return `bg-yellow-500 ${!disabled && !isLoading ? 'hover:bg-yellow-600 active:bg-yellow-700' : ''} text-white focus:ring-yellow-500 ${disabledStyles}`;
      case 'info':
        return `bg-blue-400 ${!disabled && !isLoading ? 'hover:bg-blue-500 active:bg-blue-600' : ''} text-white focus:ring-blue-400 ${disabledStyles}`;
      case 'light':
        return `bg-gray-100 ${!disabled && !isLoading ? 'hover:bg-gray-200 active:bg-gray-300' : ''} text-gray-800 focus:ring-gray-200 ${disabledStyles}`;
      case 'dark':
        return `bg-gray-800 ${!disabled && !isLoading ? 'hover:bg-gray-900 active:bg-black' : ''} text-white focus:ring-gray-800 ${disabledStyles}`;
      case 'link':
        return `bg-transparent text-blue-600 ${!disabled && !isLoading ? 'hover:text-blue-800 hover:underline active:text-blue-900' : ''} focus:ring-blue-500 ${disabledStyles}`;
      case 'outline':
        return `bg-transparent text-gray-700 ${!disabled && !isLoading ? 'hover:bg-gray-50 active:bg-gray-100' : ''} focus:ring-blue-500 ${disabledStyles}`;
      default:
        return `bg-blue-600 ${!disabled && !isLoading ? 'hover:bg-blue-700 active:bg-blue-800' : ''} text-white focus:ring-blue-500 ${disabledStyles}`;
    }
  };

  const getSizeClasses = (): string => {
    switch (size) {
      case 'sm':
        return 'py-2 px-3 text-xs sm:py-1 sm:px-3'; // Min 44px touch target on mobile
      case 'md':
        return 'py-2.5 px-4 text-sm sm:py-2 sm:px-4'; // Min 44px touch target on mobile
      case 'lg':
        return 'py-3 px-6 text-base'; // Already meets 44px minimum
      default:
        return 'py-2.5 px-4 text-sm sm:py-2 sm:px-4';
    }
  };

  const getBorderClasses = (): string => {
    return variant === 'outline' ? 'border border-gray-300' : 'border border-transparent';
  };

  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 transform';
  const widthClass = isFullWidth ? 'w-full' : '';
  const disabledClass = disabled || isLoading ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-md active:scale-95';
  
  return (
    <button
      className={`${baseClasses} ${getBorderClasses()} ${getVariantClasses()} ${getSizeClasses()} ${widthClass} ${disabledClass} ${className}`}
      disabled={disabled || isLoading}
      tabIndex={disabled ? -1 : 0}
      role="button"
      aria-disabled={disabled || isLoading}
      onKeyDown={handleKeyDown}
      {...rest}
    >
      {isLoading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {!isLoading && leftIcon && <span className="mr-2">{leftIcon}</span>}
      {children}
      {!isLoading && rightIcon && <span className="ml-2">{rightIcon}</span>}
    </button>
  );
};

export default Button;