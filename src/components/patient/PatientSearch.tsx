import React, { useState, useEffect } from 'react';
import { Input, Select, Button } from '../ui';

interface PatientSearchProps {
  onSearch: (filters: PatientSearchFilters) => void;
  loading?: boolean;
  totalResults?: number;
}

export interface PatientSearchFilters {
  search: string;
  ageRange: string;
  gender: string;
  status: string;
  hasAllergies: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

const PatientSearch: React.FC<PatientSearchProps> = ({
  onSearch,
  loading = false,
  totalResults
}) => {
  const [filters, setFilters] = useState<PatientSearchFilters>({
    search: '',
    ageRange: 'all',
    gender: 'all',
    status: 'all',
    hasAllergies: 'all',
    sortBy: 'lastName',
    sortOrder: 'asc'
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  // Debounce search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onSearch(filters);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [filters, onSearch]);

  const handleFilterChange = (key: keyof PatientSearchFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleReset = () => {
    setFilters({
      search: '',
      ageRange: 'all',
      gender: 'all',
      status: 'all',
      hasAllergies: 'all',
      sortBy: 'lastName',
      sortOrder: 'asc'
    });
  };

  const hasActiveFilters = Object.entries(filters).some(([key, value]) => {
    if (key === 'search') return value.trim() !== '';
    if (key === 'sortBy') return value !== 'lastName';
    if (key === 'sortOrder') return value !== 'asc';
    return value !== 'all';
  });

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      {/* Basic Search */}
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Search patients by name, email, or phone..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="w-full"
            leftIcon={
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
          />
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="whitespace-nowrap"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
            </svg>
            {showAdvanced ? 'Hide Filters' : 'Advanced Filters'}
          </Button>
          
          {hasActiveFilters && (
            <Button variant="outline" onClick={handleReset}>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 pt-4 border-t border-gray-200">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Age Range
            </label>
            <Select
              value={filters.ageRange}
              onChange={(e) => handleFilterChange('ageRange', e.target.value)}
              options={[
                { value: 'all', label: 'All Ages' },
                { value: '0-17', label: '0-17 years' },
                { value: '18-30', label: '18-30 years' },
                { value: '31-50', label: '31-50 years' },
                { value: '51-70', label: '51-70 years' },
                { value: '70+', label: '70+ years' }
              ]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Gender
            </label>
            <Select
              value={filters.gender}
              onChange={(e) => handleFilterChange('gender', e.target.value)}
              options={[
                { value: 'all', label: 'All Genders' },
                { value: 'male', label: 'Male' },
                { value: 'female', label: 'Female' },
                { value: 'other', label: 'Other' }
              ]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <Select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              options={[
                { value: 'all', label: 'All Patients' },
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' }
              ]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Allergies
            </label>
            <Select
              value={filters.hasAllergies}
              onChange={(e) => handleFilterChange('hasAllergies', e.target.value)}
              options={[
                { value: 'all', label: 'All Patients' },
                { value: 'yes', label: 'Has Allergies' },
                { value: 'no', label: 'No Allergies' }
              ]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sort By
            </label>
            <div className="flex gap-1">
              <Select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="flex-1"
                options={[
                  { value: 'lastName', label: 'Last Name' },
                  { value: 'firstName', label: 'First Name' },
                  { value: 'dateOfBirth', label: 'Age' },
                  { value: 'createdAt', label: 'Registration Date' },
                  { value: 'lastVisit', label: 'Last Visit' }
                ]}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleFilterChange('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-2"
                title={`Sort ${filters.sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
              >
                {filters.sortOrder === 'asc' ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
                  </svg>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Results Summary */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
        <div className="text-sm text-gray-600">
          {loading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Searching...
            </span>
          ) : (
            <span>
              {totalResults !== undefined ? (
                `${totalResults} patient${totalResults !== 1 ? 's' : ''} found`
              ) : (
                'Enter search criteria'
              )}
            </span>
          )}
        </div>
        
        {hasActiveFilters && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
            </svg>
            Filters active
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientSearch;