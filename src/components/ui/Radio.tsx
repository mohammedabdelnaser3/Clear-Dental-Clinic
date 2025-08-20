import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';

interface RadioOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  options: RadioOption[];
  error?: string;
  helperText?: string;
  inline?: boolean;
  containerClassName?: string;
}

const Radio = forwardRef<HTMLInputElement, RadioProps>((
  {
    label,
    options,
    error,
    helperText,
    inline = false,
    containerClassName = '',
    className = '',
    id,
    name,
    ...rest
  },
  ref
) => {
  const groupId = id || `radio-group-${Math.random().toString(36).substring(2, 9)}`;
  const groupName = name || groupId;
  const hasError = !!error;

  return (
    <div className={containerClassName}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <div className={`${inline ? 'flex flex-wrap gap-4' : 'space-y-2'}`}>
        {options.map((option, index) => {
          const optionId = `${groupId}-${index}`;
          return (
            <div key={optionId} className="flex items-center">
              <input
                ref={index === 0 ? ref : undefined}
                id={optionId}
                name={groupName}
                type="radio"
                value={option.value}
                disabled={option.disabled}
                className={`
                  h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500
                  ${hasError ? 'border-red-300 focus:ring-red-500' : ''}
                  ${className}
                `}
                aria-invalid={hasError ? 'true' : 'false'}
                aria-describedby={hasError ? `${groupId}-error` : helperText ? `${groupId}-description` : undefined}
                {...rest}
              />
              <label htmlFor={optionId} className="ml-3 block text-sm font-medium text-gray-700">
                {option.label}
              </label>
            </div>
          );
        })}
      </div>
      {helperText && !hasError && (
        <p className="mt-1 text-sm text-gray-500" id={`${groupId}-description`}>
          {helperText}
        </p>
      )}
      {hasError && (
        <p className="mt-1 text-sm text-red-600" id={`${groupId}-error`}>
          {error}
        </p>
      )}
    </div>
  );
});

Radio.displayName = 'Radio';

export default Radio;