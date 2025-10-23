import React, { useState } from 'react';
// Declare global gtag for TypeScript
declare const gtag: any;
import {
  PhoneIcon,
  CalendarIcon,
  GlobeAltIcon,
  ClockIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import {
  PhoneIcon as PhoneIconSolid,
  MapPinIcon as MapPinIconSolid
} from '@heroicons/react/24/solid';
import type { ClinicBranch, ContactMethod } from '../../types/clinicBranch';
import { getClinicContactMethods, getEnhancedOperatingHours } from '../../services/clinicBranchService';
import { formatPhoneNumber, generateWhatsAppUrl } from '../../utils/clinicBranchUtils';

interface ClinicContactActionsProps {
  branch: ClinicBranch;
  onBookAppointment?: (branchId: string) => void;
  className?: string;
  layout?: 'horizontal' | 'vertical' | 'grid';
  showOperatingHours?: boolean;
  showEmergencyContact?: boolean;
}

const ClinicContactActions: React.FC<ClinicContactActionsProps> = ({
  branch,
  onBookAppointment,
  className = '',
  layout = 'horizontal',
  showOperatingHours = true,
  showEmergencyContact = true
}) => {
  const [showAllHours, setShowAllHours] = useState(false);
  const [mapLoading, setMapLoading] = useState(false);

  const contactMethods = getClinicContactMethods(branch);
  const enhancedHours = getEnhancedOperatingHours(branch);
  const todayHours = enhancedHours.find(h => h.isToday);

  const handleContactAction = async (method: ContactMethod) => {
    switch (method.type) {
      case 'phone':
        // Track phone call analytics
        if (typeof gtag !== 'undefined') {
          gtag('event', 'phone_call', {
            clinic_branch: branch.branchName,
            phone_number: method.value
          });
        }
        window.open(`tel:${method.value}`, '_self');
        break;

      case 'whatsapp':
        // Track WhatsApp analytics
        if (typeof gtag !== 'undefined') {
          gtag('event', 'whatsapp_contact', {
            clinic_branch: branch.branchName
          });
        }
        const whatsappUrl = generateWhatsAppUrl(
          branch.whatsappNumber,
          branch.branchName,
          `Hello! I would like to book an appointment at ${branch.displayName}. Could you please help me with available time slots?`
        );
        window.open(whatsappUrl, '_blank');
        break;

      case 'directions':
        // Track directions analytics
        if (typeof gtag !== 'undefined') {
          gtag('event', 'get_directions', {
            clinic_branch: branch.branchName,
            clinic_address: `${branch.address.city}, ${branch.address.state}`
          });
        }
        setMapLoading(true);
        
        // Try to use user's location for better directions
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const { latitude, longitude } = position.coords;
              const directionsUrl = `https://www.google.com/maps/dir/${latitude},${longitude}/${encodeURIComponent(
                `${branch.address.street}, ${branch.address.city}, ${branch.address.country}`
              )}`;
              window.open(directionsUrl, '_blank');
              setMapLoading(false);
            },
            () => {
              // Fallback to basic directions without user location
              window.open(branch.directionsUrl || branch.mapUrl, '_blank');
              setMapLoading(false);
            },
            { timeout: 5000 }
          );
        } else {
          window.open(branch.directionsUrl || branch.mapUrl, '_blank');
          setMapLoading(false);
        }
        break;

      case 'booking':
        // Track booking analytics
        if (typeof gtag !== 'undefined') {
          gtag('event', 'book_appointment_click', {
            clinic_branch: branch.branchName,
            source: 'contact_actions'
          });
        }
        
        if (onBookAppointment) {
          onBookAppointment(branch.id);
        } else if (branch.bookingUrl) {
          window.open(branch.bookingUrl, '_blank');
        }
        break;

      default:
        break;
    }
  };

  const handleEmergencyCall = () => {
    if (typeof gtag !== 'undefined') {
      gtag('event', 'emergency_call', {
        clinic_branch: branch.branchName
      });
    }
    window.open(`tel:${branch.emergencyContact}`, '_self');
  };

  const handleViewOnMap = () => {
    if (typeof gtag !== 'undefined') {
      gtag('event', 'view_on_map', {
        clinic_branch: branch.branchName
      });
    }
    window.open(branch.mapUrl, '_blank');
  };

  const layoutClasses = {
    horizontal: 'flex flex-wrap gap-3',
    vertical: 'flex flex-col space-y-3',
    grid: 'grid grid-cols-2 gap-3'
  };

  const buttonBaseClasses = `
    flex items-center justify-center px-4 py-3 rounded-lg font-medium text-sm
    transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-opacity-50
    hover:transform hover:scale-105 active:scale-95
  `;

  return (
    <div className={`${className}`}>
      {/* Primary Contact Actions */}
      <div className={layoutClasses[layout]}>
        {contactMethods.map((method) => {
          const isPrimary = method.primary;
          const buttonClasses = isPrimary
            ? `${buttonBaseClasses} bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 shadow-md`
            : `${buttonBaseClasses} bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-gray-500`;

          return (
            <button
              key={method.type}
              onClick={() => handleContactAction(method)}
              disabled={method.type === 'directions' && mapLoading}
              className={`${buttonClasses} ${
                method.type === 'directions' && mapLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title={method.label}
            >
              {method.type === 'phone' && <PhoneIconSolid className="h-5 w-5 mr-2" />}
              {method.type === 'whatsapp' && (
                <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                </svg>
              )}
              {method.type === 'directions' && (
                mapLoading ? (
                  <div className="animate-spin h-5 w-5 mr-2 border-2 border-current border-t-transparent rounded-full" />
                ) : (
                  <MapPinIconSolid className="h-5 w-5 mr-2" />
                )
              )}
              {method.type === 'booking' && <CalendarIcon className="h-5 w-5 mr-2" />}
              <span className="hidden sm:inline">{method.label}</span>
              <span className="sm:hidden">
                {method.type === 'phone' && 'Call'}
                {method.type === 'whatsapp' && 'Chat'}
                {method.type === 'directions' && 'Directions'}
                {method.type === 'booking' && 'Book'}
              </span>
            </button>
          );
        })}
      </div>

      {/* Additional Actions */}
      <div className="mt-4 flex flex-wrap gap-2 justify-center">
        {/* View on Map */}
        <button
          onClick={handleViewOnMap}
          className="inline-flex items-center px-3 py-1.5 text-sm text-gray-600 hover:text-blue-600 
                   transition-colors duration-200"
          title="View location on Google Maps"
        >
          <GlobeAltIcon className="h-4 w-4 mr-1" />
          View on Map
        </button>

        {/* Emergency Contact */}
        {showEmergencyContact && branch.emergencyContact && (
          <button
            onClick={handleEmergencyCall}
            className="inline-flex items-center px-3 py-1.5 text-sm text-red-600 hover:text-red-700 
                     transition-colors duration-200"
            title="Emergency contact"
          >
            <PhoneIcon className="h-4 w-4 mr-1" />
            Emergency
          </button>
        )}
      </div>

      {/* Operating Hours */}
      {showOperatingHours && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h4 className="flex items-center text-sm font-medium text-gray-900">
              <ClockIcon className="h-4 w-4 mr-2" />
              Operating Hours
            </h4>
            {enhancedHours.length > 1 && (
              <button
                onClick={() => setShowAllHours(!showAllHours)}
                className="text-sm text-blue-600 hover:text-blue-700 transition-colors duration-200"
              >
                {showAllHours ? 'Show Less' : 'Show All'}
              </button>
            )}
          </div>

          {/* Current Status */}
          <div className={`
            flex items-center mb-3 p-2 rounded-md text-sm font-medium
            ${branch.currentStatus.isOpen 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
            }
          `}>
            <div className={`
              w-2 h-2 rounded-full mr-2
              ${branch.currentStatus.isOpen ? 'bg-green-500' : 'bg-red-500'}
            `} />
            {branch.currentStatus.statusText}
          </div>

          {/* Hours Display */}
          <div className="space-y-1">
            {showAllHours ? (
              enhancedHours.map((hours) => (
                <div
                  key={hours.day}
                  className={`
                    flex justify-between text-sm py-1 px-2 rounded
                    ${hours.isToday ? 'bg-blue-50 text-blue-900 font-medium' : 'text-gray-600'}
                  `}
                >
                  <span className="capitalize">{hours.day}</span>
                  <span>{hours.displayText}</span>
                </div>
              ))
            ) : todayHours ? (
              <div className="flex justify-between text-sm py-1 px-2 bg-blue-50 text-blue-900 font-medium rounded">
                <span>Today</span>
                <span>{todayHours.displayText}</span>
              </div>
            ) : (
              <div className="text-sm text-gray-600 text-center py-2">
                Hours information not available
              </div>
            )}
          </div>

          {/* Busy Level Indicator */}
          {branch.currentStatus.isOpen && branch.currentStatus.busyLevel && (
            <div className="mt-3 flex items-center text-sm">
              <InformationCircleIcon className="h-4 w-4 mr-2 text-gray-400" />
              <span className="text-gray-600">Current wait time: </span>
              <span className={`
                ml-1 font-medium
                ${branch.currentStatus.busyLevel === 'low' ? 'text-green-600' : 
                  branch.currentStatus.busyLevel === 'medium' ? 'text-yellow-600' : 'text-red-600'}
              `}>
                {branch.currentStatus.busyLevel === 'low' ? 'Short' : 
                 branch.currentStatus.busyLevel === 'medium' ? 'Moderate' : 'Longer'}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Contact Information */}
      <div className="mt-4 text-center text-sm text-gray-600">
        <p className="mb-1">
          <span className="font-medium">Phone:</span> {formatPhoneNumber(branch.phone)}
        </p>
        <p>
          <span className="font-medium">Address:</span> {branch.address.street}, {branch.address.city}
        </p>
      </div>
    </div>
  );
};

export default ClinicContactActions;