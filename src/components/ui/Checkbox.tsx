import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  helperText?: string;
  containerClassName?: string;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>((
  {
    label,
    error,
    helperText,
    containerClassName = '',
    className = '',
    id,
    ...rest
  },
  ref
) => {
  const checkboxId = id || `checkbox-${Math.random().toString(36).substring(2, 9)}`;
  const hasError = !!error;

  return (
    <div className={`flex items-start ${containerClassName}`}>
      <div className="flex items-center h-5">
        <input
          ref={ref}
          id={checkboxId}
          type="checkbox"
          className={`
            h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500
            ${hasError ? 'border-red-300 focus:ring-red-500' : ''}
            ${className}
          `}
          aria-invalid={hasError ? 'true' : 'false'}
          aria-describedby={hasError ? `${checkboxId}-error` : helperText ? `${checkboxId}-description` : undefined}
          {...rest}
        />
      </div>
      <div className="ml-3 text-sm">
        {label && (
          <label htmlFor={checkboxId} className="font-medium text-gray-700">
            {label}
          </label>
        )}
        {helperText && !hasError && (
          <p className="text-gray-500" id={`${checkboxId}-description`}>
            {helperText}
          </p>
        )}
        {hasError && (
          <p className="text-red-600" id={`${checkboxId}-error`}>
            {error}
          </p>
        )}
      </div>
    </div>
  );
});

Checkbox.displayName = 'Checkbox';

export default Checkbox;