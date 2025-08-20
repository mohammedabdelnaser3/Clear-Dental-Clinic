import React from 'react';
import Input from './Input';
import type { ChangeEvent } from 'react';

interface DatePickerProps {
  value?: Date | { start: Date | null; end: Date | null };
  onChange?: (date: Date | { start: Date | null; end: Date | null }) => void;
  range?: boolean;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  range = false,
  className = '',
  placeholder,
  disabled = false
}) => {
  const formatDate = (date: Date | null): string => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  };

  const parseDate = (dateString: string): Date | null => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  };

  if (range) {
    const rangeValue = value as { start: Date | null; end: Date | null } || { start: null, end: null };
    
    return (
      <div className={`flex space-x-2 ${className}`}>
        <Input
          type="date"
          value={formatDate(rangeValue.start)}
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            const newStart = parseDate(e.target.value);
            onChange?.({ start: newStart, end: rangeValue.end });
          }}
          placeholder="Start date"
          disabled={disabled}
          className="flex-1"
        />
        <Input
          type="date"
          value={formatDate(rangeValue.end)}
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            const newEnd = parseDate(e.target.value);
            onChange?.({ start: rangeValue.start, end: newEnd });
          }}
          placeholder="End date"
          disabled={disabled}
          className="flex-1"
        />
      </div>
    );
  }

  const singleValue = value as Date;
  
  return (
    <Input
      type="date"
      value={formatDate(singleValue)}
      onChange={(e: ChangeEvent<HTMLInputElement>) => {
        const newDate = parseDate(e.target.value);
        onChange?.(newDate!);
      }}
      placeholder={placeholder}
      disabled={disabled}
      className={className}
    />
  );
};

export default DatePicker;