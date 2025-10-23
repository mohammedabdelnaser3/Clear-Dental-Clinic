import React, { useState } from 'react';
import { 
  MapPinIcon, 
  PhoneIcon, 
  ClockIcon, 
  StarIcon,
  UserGroupIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChevronRightIcon,
  HeartIcon
} from '@heroicons/react/24/outline';
import { 
  StarIcon as StarIconSolid,
  HeartIcon as HeartIconSolid
} from '@heroicons/react/24/solid';
import type { ClinicBranch, ContactMethod } from '../../types/clinicBranch';
import { getClinicContactMethods, getEnhancedOperatingHours } from '../../services/clinicBranchService';
import { getClinicBranchTheme } from '../../utils/clinicBranchUtils';

interface ClinicBranchCardProps {
  branch: ClinicBranch;
  onBookAppointment?: (branchId: string) => void;
  onViewDetails?: (branchId: string) => void;
  className?: string;
  showFavorite?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: (branchId: string) => void;
}

const ClinicBranchCard: React.FC<ClinicBranchCardProps> = ({
  branch,
  onBookAppointment,
  onViewDetails,
  className = '',
  showFavorite = false,
  isFavorite = false,
  onToggleFavorite
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const theme = getClinicBranchTheme(branch.branchName);
  const contactMethods = getClinicContactMethods(branch);
  const enhancedHours = getEnhancedOperatingHours(branch);
  const todayHours = enhancedHours.find(h => h.isToday);

  const handleBookAppointment = () => {
    if (onBookAppointment) {
      onBookAppointment(branch.id);
    } else if (branch.bookingUrl) {
      window.open(branch.bookingUrl, '_blank');
    }
  };

  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails(branch.id);
    }
  };

  const handleContactClick = (method: ContactMethod) => {
    switch (method.type) {
      case 'phone':
        window.open(`tel:${method.value}`, '_self');
        break;
      case 'whatsapp':
        window.open(method.value, '_blank');
        break;
      case 'directions':
        window.open(method.value, '_blank');
        break;
      case 'booking':
        handleBookAppointment();
        break;
      default:
        break;
    }
  };

  const handleToggleFavorite = () => {
    if (onToggleFavorite) {
      onToggleFavorite(branch.id);
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <StarIconSolid key={i} className="h-4 w-4 text-yellow-400" />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <div key="half" className="relative">
          <StarIcon className="h-4 w-4 text-gray-300" />
          <div className="absolute inset-0 overflow-hidden w-1/2">
            <StarIconSolid className="h-4 w-4 text-yellow-400" />
          </div>
        </div>
      );
    }

    const remainingStars = 5 - Math.ceil(rating);
    for (let i = 0; i < remainingStars; i++) {
      stars.push(
        <StarIcon key={`empty-${i}`} className="h-4 w-4 text-gray-300" />
      );
    }

    return stars;
  };

  return (
    <div
      className={`
        relative bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 
        transform hover:-translate-y-1 overflow-hidden group
        ${isHovered ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}
        ${className}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Favorite Button */}
      {showFavorite && (
        <button
          onClick={handleToggleFavorite}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/80 backdrop-blur-sm 
                   hover:bg-white transition-colors duration-200 shadow-md"
          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          {isFavorite ? (
            <HeartIconSolid className="h-5 w-5 text-red-500" />
          ) : (
            <HeartIcon className="h-5 w-5 text-gray-400 hover:text-red-500" />
          )}
        </button>
      )}

      {/* Hero Image */}
      <div className="relative h-48 overflow-hidden">
        {!imageError ? (
          <img
            src={branch.heroImage || '/images/clinics/default-hero.jpg'}
            alt={`${branch.displayName} exterior`}
            className={`
              w-full h-full object-cover transition-all duration-500
              ${imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}
              ${isHovered ? 'scale-110' : 'scale-100'}
            `}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
            <div className="text-center">
              <MapPinIcon className="h-12 w-12 text-blue-400 mx-auto mb-2" />
              <p className="text-blue-600 font-medium">{branch.branchName}</p>
            </div>
          </div>
        )}

        {/* Status Badge */}
        <div className="absolute top-4 left-4">
          <div className={`
            flex items-center px-3 py-1 rounded-full text-sm font-medium
            ${branch.currentStatus.isOpen 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : 'bg-red-100 text-red-800 border border-red-200'
            }
          `}>
            {branch.currentStatus.isOpen ? (
              <CheckCircleIcon className="h-4 w-4 mr-1" />
            ) : (
              <XCircleIcon className="h-4 w-4 mr-1" />
            )}
            {branch.currentStatus.isOpen ? 'Open Now' : 'Closed'}
          </div>
        </div>

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Header */}
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-900 mb-1">
            {branch.displayName}
          </h3>
          {branch.tagline && (
            <p className="text-gray-600 text-sm">{branch.tagline}</p>
          )}
        </div>

        {/* Rating and Stats */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="flex items-center">
              {renderStars(branch.stats.rating)}
            </div>
            <span className="text-sm text-gray-600">
              {branch.stats.rating} ({branch.stats.reviewCount} reviews)
            </span>
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <UserGroupIcon className="h-4 w-4 mr-1" />
            {branch.stats.patientsServed.toLocaleString()}+ patients
          </div>
        </div>

        {/* Location */}
        <div className="flex items-start space-x-2 mb-3">
          <MapPinIcon className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-gray-600">
            <p>{branch.address.street}</p>
            <p>{branch.address.city}, {branch.address.state}</p>
          </div>
        </div>

        {/* Operating Hours */}
        <div className="flex items-center space-x-2 mb-4">
          <ClockIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <div className="text-sm">
            {todayHours ? (
              <span className={`
                ${todayHours.isCurrentlyOpen ? 'text-green-600' : 'text-gray-600'}
              `}>
                Today: {todayHours.displayText}
              </span>
            ) : (
              <span className="text-gray-600">Hours vary</span>
            )}
          </div>
        </div>

        {/* Service Highlights */}
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Popular Services</h4>
          <div className="flex flex-wrap gap-2">
            {branch.serviceHighlights.slice(0, 3).map((service) => (
              <span
                key={service.id}
                className={`
                  inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium
                  ${service.isPopular 
                    ? `bg-${theme.primary} bg-opacity-10 text-${theme.primary} border border-${theme.primary} border-opacity-20`
                    : 'bg-gray-100 text-gray-700 border border-gray-200'
                  }
                `}
              >
                {service.name}
              </span>
            ))}
          </div>
        </div>

        {/* Unique Features */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Features</h4>
          <div className="space-y-1">
            {branch.uniqueFeatures.slice(0, 3).map((feature, index) => (
              <div key={index} className="flex items-center text-sm text-gray-600">
                <CheckCircleIcon className="h-3 w-3 text-green-500 mr-2 flex-shrink-0" />
                {feature}
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* Primary Actions */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleBookAppointment}
              className={`
                flex items-center justify-center px-4 py-2.5 rounded-lg font-medium text-sm
                bg-${theme.primary} hover:bg-${theme.primary} hover:bg-opacity-90
                text-white transition-colors duration-200
                focus:outline-none focus:ring-2 focus:ring-${theme.primary} focus:ring-opacity-50
              `}
            >
              Book Now
            </button>
            <button
              onClick={handleViewDetails}
              className="flex items-center justify-center px-4 py-2.5 rounded-lg font-medium text-sm
                       border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors duration-200
                       focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
            >
              View Details
              <ChevronRightIcon className="h-4 w-4 ml-1" />
            </button>
          </div>

          {/* Contact Methods */}
          <div className="flex justify-center space-x-4 pt-2 border-t border-gray-100">
            {contactMethods.slice(0, 3).map((method) => (
              <button
                key={method.type}
                onClick={() => handleContactClick(method)}
                className="flex items-center space-x-1 text-sm text-gray-600 hover:text-blue-600 
                         transition-colors duration-200"
                title={method.label}
              >
                {method.type === 'phone' && <PhoneIcon className="h-4 w-4" />}
                {method.type === 'whatsapp' && (
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                  </svg>
                )}
                {method.type === 'directions' && <MapPinIcon className="h-4 w-4" />}
                <span className="hidden sm:inline">{method.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Hover Effect Overlay */}
      <div className={`
        absolute inset-0 bg-gradient-to-t from-blue-600/5 to-transparent 
        transition-opacity duration-300 pointer-events-none
        ${isHovered ? 'opacity-100' : 'opacity-0'}
      `} />
    </div>
  );
};

export default ClinicBranchCard;