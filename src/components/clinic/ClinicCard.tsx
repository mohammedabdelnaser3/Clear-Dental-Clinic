import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, Badge, Button } from '../ui';
import type { Clinic } from '../../types';
import { formatPhoneNumber } from '../../utils';

interface ClinicCardProps {
  clinic: Clinic;
  onSelect?: (clinic: Clinic) => void;
  onEdit?: (clinicId: string) => void;
  onDelete?: (clinicId: string) => void;
  isSelected?: boolean;
  showActions?: boolean;
  compact?: boolean;
}

const ClinicCard: React.FC<ClinicCardProps> = ({
  clinic,
  onSelect,
  onEdit,
  onDelete,
  isSelected = false,
  showActions = true,
  compact = false
}) => {
  const { t } = useTranslation();
  
  const handleSelect = () => {
    if (onSelect) {
      onSelect(clinic);
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(clinic.id);
    }
  };

  const handleDelete = () => {
    if (onDelete && window.confirm(t('clinicCard.deleteConfirm', { name: clinic.name }))) {
      onDelete(clinic.id);
    }
  };

  const getStatusColor = (): 'success' | 'danger' | 'warning' | 'gray' => {
    // Since Clinic type doesn't have status, we'll default to success
    return 'success';
  };

  return (
    <div 
      className={`
        hover:shadow-md transition-all duration-200 cursor-pointer
        ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''}
      `}
      onClick={(e) => {
        e.preventDefault();
        handleSelect();
      }}
    >
      <Card className={compact ? 'p-4' : 'p-6'}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          {/* Clinic Header */}
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center text-white font-semibold text-lg">
                {clinic.name.charAt(0)}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {clinic.name}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={getStatusColor()}>
                  {t('clinicCard.active')}
                </Badge>
                {isSelected && (
                  <Badge variant="primary">{t('clinicCard.selected')}</Badge>
                )}
              </div>
            </div>
          </div>

          {/* Clinic Details */}
          <div className="space-y-2 text-sm text-gray-600">
            {/* Address */}
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <div className="flex-1">
                <div>{clinic.address.street}</div>
                <div>{clinic.address.city}, {clinic.address.state} {clinic.address.zipCode}</div>
                {clinic.address.country !== 'USA' && (
                  <div>{clinic.address.country}</div>
                )}
              </div>
            </div>

            {/* Contact Info */}
            {clinic.phone && (
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span>{formatPhoneNumber(clinic.phone)}</span>
              </div>
            )}

            {clinic.email && (
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="truncate">{clinic.email}</span>
              </div>
            )}

            {clinic.website && (
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                </svg>
                <a 
                  href={clinic.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 truncate"
                  onClick={(e) => e.stopPropagation()}
                >
                  {clinic.website.replace(/^https?:\/\//, '')}
                </a>
              </div>
            )}

            {/* Operating Hours */}
            {clinic.operatingHours && clinic.operatingHours.length > 0 && (
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <div className="font-medium text-gray-700">{t('clinicCard.operatingHours')}</div>
                  {!compact && (
                    <div className="mt-1 space-y-1">
                      {clinic.operatingHours.map((hours) => (
                        <div key={hours.day} className="flex justify-between text-xs">
                          <span className="capitalize">{hours.day}:</span>
                          <span>{hours.closed ? t('clinicCard.closed') : `${hours.open} - ${hours.close}`}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Services */}
            {clinic.services && clinic.services.length > 0 && (
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <div className="flex-1">
                  <div className="font-medium text-gray-700 mb-1">{t('clinicCard.services')}</div>
                  <div className="flex flex-wrap gap-1">
                    {clinic.services.slice(0, compact ? 2 : 4).map((service, index) => (
                      <Badge key={index} variant="primary" size="sm">
                        {service}
                      </Badge>
                    ))}
                    {clinic.services.length > (compact ? 2 : 4) && (
                      <Badge variant="gray" size="sm">
                        {t('clinicCard.moreServices', { count: clinic.services.length - (compact ? 2 : 4) })}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex flex-col gap-2 ml-4 flex-shrink-0">
            <Link to={`/clinics/${clinic.id}`} onClick={(e) => e.stopPropagation()}>
              <Button variant="outline" size="sm" className="w-full">
                {t('clinicCard.viewDetails')}
              </Button>
            </Link>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={(e) => {
                e.stopPropagation();
                handleEdit();
              }}
              className="w-full"
            >
              {t('clinicCard.edit')}
            </Button>
            
            {onSelect && (
              <Button 
                variant={isSelected ? "primary" : "outline"}
                size="sm" 
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelect();
                }}
                className="w-full"
              >
                {isSelected ? t('clinicCard.selected') : t('clinicCard.select')}
              </Button>
            )}
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={(e) => {
                e.stopPropagation();
                handleDelete();
              }}
              className="w-full text-red-600 border-red-300 hover:bg-red-50"
            >
              {t('clinicCard.delete')}
            </Button>
          </div>
        )}
      </div>

      {/* Statistics */}
      {!compact && clinic.description && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          {clinic.description && (
            <p className="text-sm text-gray-600 mb-3">{clinic.description}</p>
          )}
          
          <div className="grid grid-cols-1 gap-4 text-center">
            <div>
              <div className="text-lg font-semibold text-gray-900">
                {clinic.staff?.length || 0}
              </div>
              <div className="text-xs text-gray-500">{t('clinicCard.staffMembers')}</div>
            </div>
          </div>
        </div>
      )}
      </Card>
    </div>
  );
};

export default ClinicCard;