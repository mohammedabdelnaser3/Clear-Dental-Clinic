import React, { useState } from 'react';
import { Button, Input, Select } from '../ui';

export interface FilterField {
  key: string;
  label: string;
  type: 'text' | 'select' | 'date' | 'dateRange' | 'number' | 'numberRange';
  options?: { value: string; label: string }[];
  placeholder?: string;
  multiple?: boolean;
}

export interface FilterValues {
  [key: string]: any;
}

interface FilterPanelProps {
  fields: FilterField[];
  values: FilterValues;
  onChange: (values: FilterValues) => void;
  onApply?: () => void;
  onReset?: () => void;
  className?: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  fields,
  values,
  onChange,
  onApply,
  onReset,
  className = '',
  collapsible = true,
  defaultCollapsed = false
}) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  const handleFieldChange = (key: string, value: any) => {
    onChange({
      ...values,
      [key]: value
    });
  };

  const handleReset = () => {
    const resetValues: FilterValues = {};
    fields.forEach(field => {
      resetValues[field.key] = field.multiple ? [] : '';
    });
    onChange(resetValues);
    if (onReset) {
      onReset();
    }
  };

  const renderField = (field: FilterField) => {
    const value = values[field.key] || (field.multiple ? [] : '');

    switch (field.type) {
      case 'text':
        return (
          <Input
            type="text"
            placeholder={field.placeholder}
            value={value}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
          />
        );

      case 'select':
        const selectOptions = field.options || [];
        const optionsWithPlaceholder = field.placeholder 
          ? [{ value: '', label: field.placeholder }, ...selectOptions]
          : selectOptions;
        return (
          <Select
            options={optionsWithPlaceholder}
            value={value}
            onChange={(selectedValue) => handleFieldChange(field.key, selectedValue)}
          />
        );

      case 'date':
        return (
          <Input
            type="date"
            value={value}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
          />
        );

      case 'dateRange':
        return (
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="date"
              placeholder="From"
              value={value.from || ''}
              onChange={(e) => handleFieldChange(field.key, { ...value, from: e.target.value })}
            />
            <Input
              type="date"
              placeholder="To"
              value={value.to || ''}
              onChange={(e) => handleFieldChange(field.key, { ...value, to: e.target.value })}
            />
          </div>
        );

      case 'number':
        return (
          <Input
            type="number"
            placeholder={field.placeholder}
            value={value}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
          />
        );

      case 'numberRange':
        return (
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              placeholder="Min"
              value={value.min || ''}
              onChange={(e) => handleFieldChange(field.key, { ...value, min: e.target.value })}
            />
            <Input
              type="number"
              placeholder="Max"
              value={value.max || ''}
              onChange={(e) => handleFieldChange(field.key, { ...value, max: e.target.value })}
            />
          </div>
        );

      default:
        return null;
    }
  };

  const hasActiveFilters = () => {
    return fields.some(field => {
      const value = values[field.key];
      if (field.multiple) {
        return Array.isArray(value) && value.length > 0;
      }
      if (field.type === 'dateRange' || field.type === 'numberRange') {
        return value && (value.from || value.to || value.min || value.max);
      }
      return value && value !== '';
    });
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg ${className}`}>
      {/* Header */}
      {collapsible ? (
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <span className="font-medium text-gray-900">Filters</span>
            {hasActiveFilters() && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Active
              </span>
            )}
          </div>
          <svg 
            className={`w-5 h-5 text-gray-400 transition-transform ${
              isCollapsed ? '' : 'transform rotate-180'
            }`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      ) : (
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <span className="font-medium text-gray-900">Filters</span>
            {hasActiveFilters() && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Active
              </span>
            )}
          </div>
        </div>
      )}

      {/* Filter Fields */}
      {(!collapsible || !isCollapsed) && (
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {fields.map((field) => (
              <div key={field.key} className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  {field.label}
                </label>
                {renderField(field)}
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={!hasActiveFilters()}
            >
              Reset
            </Button>
            {onApply && (
              <Button
                variant="primary"
                size="sm"
                onClick={onApply}
              >
                Apply Filters
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterPanel;