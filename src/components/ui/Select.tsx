import { type SelectHTMLAttributes, forwardRef } from 'react';
import type { SelectOption } from '../../types/common';

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  options: SelectOption[];
  error?: string;
  helperText?: string;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  containerClassName?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>((
  {
    label,
    options,
    error,
    helperText,
    size = 'md',
    fullWidth = true,
    containerClassName = '',
    className = '',
    id,
    ...rest
  },
  ref
) => {
  const selectId = id || `select-${Math.random().toString(36).substring(2, 9)}`;
  const hasError = !!error;

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'py-1 text-xs';
      case 'md':
        return 'py-2 text-sm';
      case 'lg':
        return 'py-3 text-base';
      default:
        return 'py-2 text-sm';
    }
  };

  return (
    <div className={`${fullWidth ? 'w-full' : ''} ${containerClassName}`}>
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <div className="relative rounded-md shadow-sm">
        <select
          ref={ref}
          id={selectId}
          className={`
            block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500
            ${getSizeClasses()}
            ${hasError ? 'border-red-300 text-red-900 focus:border-red-500 focus:ring-red-500' : ''}
            ${fullWidth ? 'w-full' : ''}
            ${className}
          `}
          aria-invalid={hasError ? 'true' : 'false'}
          aria-describedby={hasError ? `${selectId}-error` : helperText ? `${selectId}-description` : undefined}
          {...rest}
        >
          {options && options.length > 0 ? options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          )) : (
            <option value="">No options available</option>
          )}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </div>
      </div>
      {helperText && !hasError && (
        <p className="mt-1 text-sm text-gray-500" id={`${selectId}-description`}>
          {helperText}
        </p>
      )}
      {hasError && (
        <p className="mt-1 text-sm text-red-600" id={`${selectId}-error`}>
          {error}
        </p>
      )}
    </div>
  );
});

Select.displayName = 'Select';

export default Select;