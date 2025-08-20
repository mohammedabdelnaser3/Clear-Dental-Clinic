import React, { useState, useRef, useEffect } from 'react';
import { Button, Spinner } from '../ui';
import type { Clinic } from '../../types';
import { useClinic } from '../../hooks/useClinic';

interface ClinicSelectorProps {
  onClinicChange?: (clinic: Clinic) => void;
  compact?: boolean;
  showCreateButton?: boolean;
}

const ClinicSelector: React.FC<ClinicSelectorProps> = ({
  onClinicChange,
  compact = false,
  showCreateButton = true
}) => {
  const { clinics, selectedClinic, setSelectedClinicById, loading } = useClinic();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleClinicSelect = (clinic: Clinic) => {
    setSelectedClinicById(clinic.id);
    setIsOpen(false);
    if (onClinicChange) {
      onClinicChange(clinic);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2">
        <Spinner size="sm" />
        <span className="text-sm text-gray-600">Loading clinics...</span>
      </div>
    );
  }

  if (!clinics || clinics.length === 0) {
    return (
      <div className="text-sm text-gray-500 px-3 py-2">
        No clinics available
      </div>
    );
  }

  // If only one clinic, show it without dropdown
  if (clinics.length === 1 && !showCreateButton) {
    const clinic = clinics[0];
    return (
      <div className={`flex items-center gap-3 ${compact ? 'px-2 py-1' : 'px-3 py-2'}`}>
        <div className="flex-shrink-0">
          <div className={`bg-blue-500 rounded-lg flex items-center justify-center text-white font-semibold ${
            compact ? 'w-8 h-8 text-sm' : 'w-10 h-10'
          }`}>
            {clinic.name.charAt(0)}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className={`font-medium text-gray-900 truncate ${
            compact ? 'text-sm' : 'text-base'
          }`}>
            {clinic.name}
          </div>
          {!compact && (
            <div className="text-xs text-gray-500 truncate">
              {clinic.address.city}, {clinic.address.state}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Selected Clinic Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full flex items-center gap-3 text-left transition-colors
          ${compact ? 'px-2 py-1' : 'px-3 py-2'}
          ${isOpen ? 'bg-gray-100' : 'hover:bg-gray-50'}
          rounded-lg border border-gray-200
        `}
      >
        {selectedClinic ? (
          <>
            <div className="flex-shrink-0">
              <div className={`bg-blue-500 rounded-lg flex items-center justify-center text-white font-semibold ${
                compact ? 'w-8 h-8 text-sm' : 'w-10 h-10'
              }`}>
                {selectedClinic.name.charAt(0)}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className={`font-medium text-gray-900 truncate ${
                compact ? 'text-sm' : 'text-base'
              }`}>
                {selectedClinic.name}
              </div>
              {!compact && (
                <div className="text-xs text-gray-500 truncate">
                  {selectedClinic.address.city}, {selectedClinic.address.state}
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="flex-shrink-0">
              <div className={`bg-gray-300 rounded-lg flex items-center justify-center text-gray-600 ${
                compact ? 'w-8 h-8' : 'w-10 h-10'
              }`}>
                <svg className={compact ? 'w-4 h-4' : 'w-5 h-5'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <div className={`font-medium text-gray-500 ${
                compact ? 'text-sm' : 'text-base'
              }`}>
                Select a clinic
              </div>
              {!compact && (
                <div className="text-xs text-gray-400">
                  Choose from {clinics.length} available clinics
                </div>
              )}
            </div>
          </>
        )}
        
        <div className="flex-shrink-0">
          <svg 
            className={`w-4 h-4 text-gray-400 transition-transform ${
              isOpen ? 'transform rotate-180' : ''
            }`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
          {/* Clinic Options */}
          <div className="py-1">
            {clinics.map((clinic) => (
              <button
                key={clinic.id}
                onClick={() => handleClinicSelect(clinic)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 transition-colors
                  ${selectedClinic?.id === clinic.id ? 'bg-blue-50 text-blue-700' : 'text-gray-900'}
                `}
              >
                <div className="flex-shrink-0">
                  <div className={`rounded-lg flex items-center justify-center text-white font-semibold w-8 h-8 text-sm ${
                    selectedClinic?.id === clinic.id ? 'bg-blue-600' : 'bg-blue-500'
                  }`}>
                    {clinic.name.charAt(0)}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{clinic.name}</div>
                  <div className="text-xs text-gray-500 truncate">
                    {clinic.address.city}, {clinic.address.state}
                  </div>
                </div>
                {selectedClinic?.id === clinic.id && (
                  <div className="flex-shrink-0">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Create New Clinic Button */}
          {showCreateButton && (
            <>
              <div className="border-t border-gray-200"></div>
              <div className="p-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-center"
                  onClick={() => {
                    setIsOpen(false);
                    // Navigate to create clinic page
                    window.location.href = '/clinics/new';
                  }}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create New Clinic
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ClinicSelector;