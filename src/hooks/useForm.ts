import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';

type FormErrors<T> = Partial<Record<keyof T, string>>;

type Validator<T> = (values: T) => FormErrors<T>;

interface UseFormProps<T> {
  initialValues: T;
  onSubmit: (values: T) => void | Promise<void>;
  validate?: Validator<T>;
}

interface UseFormReturn<T> {
  values: T;
  errors: FormErrors<T>;
  touched: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
  handleChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  handleBlur: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  handleSubmit: (e: FormEvent<HTMLFormElement>) => void;
  setFieldValue: (name: keyof T, value: T[keyof T]) => void;
  setFieldError: (name: keyof T, error: string) => void;
  resetForm: () => void;
}

/**
 * Custom hook for form handling with validation
 */
export const useForm = <T extends Record<string, unknown>>(
  { initialValues, onSubmit, validate }: UseFormProps<T>
): UseFormReturn<T> => {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<FormErrors<T>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const validateForm = (): FormErrors<T> => {
    if (validate) {
      return validate(values);
    }
    return {};
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const fieldName = name as keyof T;
    
    let fieldValue: T[keyof T] = value as T[keyof T];
    
    // Handle different input types
    if (type === 'checkbox') {
      fieldValue = (e.target as HTMLInputElement).checked as T[keyof T];
    } else if (type === 'number') {
      fieldValue = (value === '' ? '' : Number(value)) as T[keyof T];
    }
    
    setValues(prevValues => ({
      ...prevValues,
      [fieldName]: fieldValue
    }));
    
    // Clear error when field is changed
    if (errors[fieldName]) {
      setErrors(prevErrors => ({
        ...prevErrors,
        [fieldName]: undefined
      }));
    }
  };

  const handleBlur = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name } = e.target;
    const fieldName = name as keyof T;
    
    setTouched(prevTouched => ({
      ...prevTouched,
      [fieldName]: true
    }));
    
    // Validate field on blur
    if (validate) {
      const validationErrors = validate(values);
      setErrors(prevErrors => ({
        ...prevErrors,
        ...validationErrors
      }));
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Mark all fields as touched
    const allTouched = Object.keys(values).reduce((acc, key) => {
      acc[key as keyof T] = true;
      return acc;
    }, {} as Record<keyof T, boolean>);
    
    setTouched(allTouched);
    
    // Validate all fields
    const validationErrors = validateForm();
    setErrors(validationErrors);
    
    // If no errors, submit the form
    if (Object.keys(validationErrors).length === 0) {
      setIsSubmitting(true);
      try {
        await onSubmit(values);
      } catch (_error) {
        if (import.meta.env.DEV) {
          console.error('Form submission error:', _error);
        }
        // Re-throw error so parent component can handle it
        throw _error;
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const setFieldValue = (name: keyof T, value: T[keyof T]) => {
    setValues(prevValues => ({
      ...prevValues,
      [name]: value
    }));
    
    // Clear error when field is changed
    if (errors[name]) {
      setErrors(prevErrors => ({
        ...prevErrors,
        [name]: undefined
      }));
    }
  };

  const setFieldError = (name: keyof T, error: string) => {
    setErrors(prevErrors => ({
      ...prevErrors,
      [name]: error
    }));
  };

  const resetForm = () => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  };

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue,
    setFieldError,
    resetForm
  };
};