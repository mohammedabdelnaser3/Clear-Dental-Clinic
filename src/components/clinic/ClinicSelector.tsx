import React, { useState, useEffect } from 'react';
import { ChevronDownIcon, CheckIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { getAllClinics } from '../../services/clinicService';
import { type Clinic } from '../../types';
import { toast } from 'react-hot-toast';

interface ClinicSelectorProps {
  selectedClinicId?: string;
  onClinicSelect: (clinic: Clinic) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  error?: string;
}

export const ClinicSelector: React.FC<ClinicSelectorProps> = ({
  selectedClinicId,
  onClinicSelect,
  disabled = false,
  className = '',
  placeholder = 'Select a clinic',
  error
}) => {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null);

  // Fetch clinics on component mount
  useEffect(() => {
    const fetchClinics = async () => {
      setLoading(true);
      try {
        const response = await getAllClinics();
        if (response.success && response.data) {
          setClinics(response.data);
          
          // Auto-select if only one clinic or if selectedClinicId is provided
          if (response.data.length === 1) {
            const clinic = response.data[0];
            setSelectedClinic(clinic);
            onClinicSelect(clinic);
          } else if (selectedClinicId) {
            const clinic = response.data.find(c => c.id === selectedClinicId);
            if (clinic) {
              setSelectedClinic(clinic);
            }
          }
        } else {
          toast.error(response.message || 'Failed to load clinics');
        }
      } catch (error) {
        console.error('Error fetching clinics:', error);
        toast.error('Failed to load clinics');
      } finally {
        setLoading(false);
      }
    };

    fetchClinics();
  }, [selectedClinicId, onClinicSelect]);

  const handleClinicSelect = (clinic: Clinic) => {
    setSelectedClinic(clinic);
    onClinicSelect(clinic);
    setIsOpen(false);
  };

  if (loading) {
    return (
      <div className={`relative ${className}`}>
        <div className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-gray-500">Loading clinics...</span>
          </div>
        </div>
      </div>
    );
  }

  if (clinics.length === 0) {
    return (
      <div className={`relative ${className}`}>
        <div className="w-full p-3 border border-red-300 rounded-lg bg-red-50">
          <div className="flex items-center space-x-2">
            <MapPinIcon className="h-4 w-4 text-red-500" />
            <span className="text-red-600">No clinics available</span>
          </div>
        </div>
      </div>
    );
  }

  // If only one clinic, show it as read-only
  if (clinics.length === 1) {
    const clinic = clinics[0];
    return (
      <div className={`relative ${className}`}>
        <div className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50">
          <div className="flex items-center space-x-2">
            <MapPinIcon className="h-4 w-4 text-gray-500" />
            <div className="flex-1">
              <p className="font-medium text-gray-900">{clinic.name}</p>
              {clinic.address && (
                <p className="text-sm text-gray-500">
                  {clinic.address.street}, {clinic.address.city}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        className={`w-full p-3 text-left border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
          disabled
            ? 'bg-gray-50 cursor-not-allowed border-gray-300'
            : 'bg-white hover:border-gray-400 border-gray-300'
        } ${error ? 'border-red-300 bg-red-50' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MapPinIcon className="h-4 w-4 text-gray-500" />
            <div className="flex-1">
              {selectedClinic ? (
                <>
                  <p className="font-medium text-gray-900">{selectedClinic.name}</p>
                  {selectedClinic.address && (
                    <p className="text-sm text-gray-500">
                      {selectedClinic.address.street}, {selectedClinic.address.city}
                    </p>
                  )}
                </>
              ) : (
                <span className="text-gray-500">{placeholder}</span>
              )}
            </div>
          </div>
          <ChevronDownIcon
            className={`h-4 w-4 text-gray-400 transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </div>
      </button>

      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}

      {isOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
            {clinics.map((clinic) => (
              <button
                key={clinic.id}
                type="button"
                className="w-full p-3 text-left hover:bg-gray-50 focus:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                onClick={() => handleClinicSelect(clinic)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <MapPinIcon className="h-4 w-4 text-gray-500" />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{clinic.name}</p>
                      {clinic.address && (
                        <p className="text-sm text-gray-500">
                          {clinic.address.street}, {clinic.address.city}
                        </p>
                      )}
                      {clinic.phone && (
                        <p className="text-xs text-gray-400">{clinic.phone}</p>
                      )}
                    </div>
                  </div>
                  {selectedClinic?.id === clinic.id && (
                    <CheckIcon className="h-4 w-4 text-blue-600" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ClinicSelector;