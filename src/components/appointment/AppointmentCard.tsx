import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Card, Badge, Button } from '../ui';
import type { Appointment } from '../../types';
import { formatDate } from '../../utils';

interface AppointmentCardProps {
  appointment: Appointment;
  onStatusChange?: (appointmentId: string, status: string) => void;
  showActions?: boolean;
  compact?: boolean;
}

const getStatusColor = (status: string): 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'light' | 'dark' | 'gray' => {
  switch (status) {
    case 'scheduled':
      return 'primary';
    case 'confirmed':
      return 'success';
    case 'completed':
      return 'gray';
    case 'cancelled':
      return 'danger';
    case 'no-show':
      return 'warning';
    default:
      return 'gray';
  }
};

const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  onStatusChange,
  showActions = true,
  compact = false
}) => {
  const { t } = useTranslation();
  const appointmentDate = typeof appointment.date === 'string' 
    ? new Date(appointment.date) 
    : appointment.date;

  const handleStatusChange = (newStatus: string) => {
    if (onStatusChange) {
      onStatusChange(appointment.id, newStatus);
    }
  };

  return (
    <Card className={`${compact ? 'p-4' : 'p-6'} hover:shadow-md transition-shadow`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">
              {appointment.patientName || t('appointmentCard.unknownPatient')}
            </h3>
            <Badge variant={getStatusColor(appointment.status)}>
              {t(`appointmentCard.status.${appointment.status}`)}
            </Badge>
          </div>
          
          <div className="space-y-1 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{formatDate(appointmentDate)} {t('appointmentCard.at')} {appointment.timeSlot}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>{t('doctor')} {appointment.dentistName || t('appointmentCard.unknownDentist')}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <span>{appointment.serviceType}</span>
            </div>
            
            {appointment.duration && (
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{appointment.duration} {t('appointmentCard.minutes')}</span>
              </div>
            )}
          </div>
          
          {appointment.notes && !compact && (
            <div className="mt-3 p-3 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-700">{appointment.notes}</p>
            </div>
          )}
        </div>
        
        {showActions && (
          <div className="flex flex-col gap-2 ml-4">
            <Link to={`/appointments/${appointment.id}`}>
              <Button variant="outline" size="sm" className="w-full">
                {t('appointmentCard.viewDetails')}
              </Button>
            </Link>
            
            {appointment.status === 'scheduled' && (
              <Button 
                variant="primary" 
                size="sm" 
                onClick={() => handleStatusChange('confirmed')}
                className="w-full"
              >
                {t('appointmentCard.confirm')}
              </Button>
            )}
            
            {appointment.status === 'confirmed' && (
              <Button 
                variant="success" 
                size="sm" 
                onClick={() => handleStatusChange('completed')}
                className="w-full"
              >
                {t('appointmentCard.complete')}
              </Button>
            )}
            
            {['scheduled', 'confirmed'].includes(appointment.status) && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleStatusChange('cancelled')}
                className="w-full text-red-600 border-red-300 hover:bg-red-50"
              >
                {t('appointmentCard.cancel')}
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

export default AppointmentCard;