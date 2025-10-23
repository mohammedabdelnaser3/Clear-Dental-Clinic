import { forwardRef } from 'react';
import type { TextareaHTMLAttributes } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  containerClassName?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>((
  {
    label,
    error,
    helperText,
    fullWidth = true,
    containerClassName = '',
    className = '',
    id,
    rows = 4,
    ...rest
  },
  ref
) => {
  const textareaId = id || `textarea-${Math.random().toString(36).substring(2, 9)}`;
  const hasError = !!error;

  return (
    <div className={`${fullWidth ? 'w-full' : ''} ${containerClassName}`}>
      {label && (
        <label htmlFor={textareaId} className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative rounded-md shadow-sm">
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          className={`
            block rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 
            text-base sm:text-sm py-2.5 px-3 sm:py-2
            ${hasError ? 'border-red-300 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500' : ''}
            ${fullWidth ? 'w-full' : ''}
            ${className}
          `}
          aria-invalid={hasError ? 'true' : 'false'}
          aria-describedby={hasError ? `${textareaId}-error` : helperText ? `${textareaId}-description` : undefined}
          {...rest}
        />
      </div>
      {helperText && !hasError && (
        <p className="mt-1.5 text-xs sm:text-sm text-gray-500" id={`${textareaId}-description`}>
          {helperText}
        </p>
      )}
      {hasError && (
        <p className="mt-1.5 text-xs sm:text-sm text-red-600" id={`${textareaId}-error`}>
          {error}
        </p>
      )}
    </div>
  );
});

Textarea.displayName = 'Textarea';

export default Textarea;