import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button, Card, Badge, Alert } from '../../components/ui';

interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  date: string;
  time: string;
  duration: number; // in minutes
  type: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  notes: string;
  clinicId: string;
  clinicName: string;
  doctorId: string;
  doctorName: string;
  createdAt: string;
  updatedAt: string;
}

const AppointmentDetail: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  
  // Mock data - would come from API in real app
  const appointment: Appointment = {
    id: '1',
    patientId: '101',
    patientName: 'John Doe',
    patientEmail: 'john.doe@example.com',
    patientPhone: '(555) 123-4567',
    date: '2023-07-15',
    time: '09:00',
    duration: 30,
    type: 'Check-up',
    status: 'scheduled',
    notes: 'Regular check-up appointment. Patient has mentioned some mild discomfort in lower back.',
    clinicId: '1',
    clinicName: 'Main Street Clinic',
    doctorId: '201',
    doctorName: 'Dr. Sarah Johnson',
    createdAt: '2023-06-20T10:30:00Z',
    updatedAt: '2023-06-20T10:30:00Z'
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(i18n.language, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString(i18n.language, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    });
  };

  const getStatusBadge = (status: Appointment['status']) => {
    const variants: Record<Appointment['status'], 'primary' | 'success' | 'gray' | 'danger'> = {
      'scheduled': 'primary',
      'completed': 'success',
      'cancelled': 'gray',
      'no-show': 'danger'
    };
    
    const labels: Record<Appointment['status'], string> = {
      'scheduled': t('appointments.scheduled'),
      'completed': t('appointments.completed'),
      'cancelled': t('appointments.cancelled'),
      'no-show': t('appointments.noShow')
    };
    
    return (
      <Badge variant={variants[status]} rounded={true}>
        {labels[status]}
      </Badge>
    );
  };

  const handleCancelAppointment = () => {
    setIsLoading(true);
    // In a real app, this would call an API to cancel the appointment
    setTimeout(() => {
      setIsLoading(false);
      navigate('/appointments');
    }, 1000);
  };

  const handleCompleteAppointment = () => {
    setIsLoading(true);
    // In a real app, this would call an API to mark the appointment as completed
    setTimeout(() => {
      setIsLoading(false);
      navigate('/appointments');
    }, 1000);
  };

  const handleNoShow = () => {
    setIsLoading(true);
    // In a real app, this would call an API to mark the appointment as no-show
    setTimeout(() => {
      setIsLoading(false);
      navigate('/appointments');
    }, 1000);
  };

  if (!appointment) {
    return (
      <div className="py-6">
        <Alert variant="error">
          {t('appointmentDetail.appointmentNotFound')}
        </Alert>
        <div className="mt-4">
          <Link to="/appointments">
            <Button variant="outline">
              {t('appointmentDetail.backToAppointments')}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <div className="flex items-center">
            <h1 className="text-2xl font-semibold text-gray-900">{t('appointmentDetail.title')}</h1>
            <div className="ml-3">
              {getStatusBadge(appointment.status)}
            </div>
          </div>
          <p className="mt-1 text-sm text-gray-600">
            {t('appointmentDetail.appointmentId')}: {appointment.id}
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
          {appointment.status === 'scheduled' && (
            <>
              <Link to={`/appointments/${id}/edit`}>
                <Button 
                  variant="outline"
                >
                  <svg className="-ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  {t('appointmentDetail.edit')}
                </Button>
              </Link>
              <Button 
                variant="primary"
                onClick={handleCompleteAppointment}
                isLoading={isLoading}
              >
                <svg className="-ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {t('appointmentDetail.markAsCompleted')}
              </Button>
              <Button 
                variant="outline"
                onClick={() => setShowCancelConfirm(true)}
                className="text-red-600 hover:text-red-700"
              >
                <svg className="-ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                {t('appointmentDetail.cancelAppointment')}
              </Button>
              <Button 
                variant="outline"
                onClick={handleNoShow}
              >
                <svg className="-ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {t('appointmentDetail.markAsNoShow')}
              </Button>
            </>
          )}
          <Link to="/appointments">
            <Button 
              variant="outline"
            >
              {t('appointmentDetail.backToList')}
            </Button>
          </Link>
        </div>
      </div>

      {showCancelConfirm && (
        <Alert 
          variant="warning" 
          className="mb-6"
          onClose={() => setShowCancelConfirm(false)}
        >
          <div className="flex flex-col">
            <p className="font-medium">{t('appointmentDetail.cancelConfirmTitle')}</p>
            <p className="mt-1">{t('appointmentDetail.cancelConfirmMessage')}</p>
            <div className="mt-4 flex space-x-2">
              <Button 
                variant="danger" 
                size="sm"
                onClick={handleCancelAppointment}
                isLoading={isLoading}
              >
                {t('appointmentDetail.yesCancel')}
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowCancelConfirm(false)}
              >
                {t('appointmentDetail.noKeep')}
              </Button>
            </div>
          </div>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-lg font-medium text-gray-900 mb-4">{t('appointmentDetail.appointmentInfo')}</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">{t('appointmentDetail.date')}</p>
                <p className="mt-1 font-medium">{formatDate(appointment.date)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">{t('appointmentDetail.time')}</p>
                <p className="mt-1">{formatTime(appointment.time)} ({appointment.duration} minutes)</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">{t('appointmentDetail.type')}</p>
              <p className="mt-1">{appointment.type}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">{t('appointmentDetail.status')}</p>
              <div className="mt-1">{getStatusBadge(appointment.status)}</div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">{t('appointmentDetail.doctor')}</p>
              <p className="mt-1">{appointment.doctorName}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">{t('appointmentDetail.clinic')}</p>
              <p className="mt-1">{appointment.clinicName}</p>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-medium text-gray-900 mb-4">{t('appointmentDetail.patientInfo')}</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-500">{t('appointmentDetail.name')}</p>
              <p className="mt-1">
                <Link 
                  to={`/patients/${appointment.patientId}`}
                  className="text-indigo-600 hover:text-indigo-900"
                >
                  {appointment.patientName}
                </Link>
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">{t('appointmentDetail.email')}</p>
              <p className="mt-1">{appointment.patientEmail}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">{t('appointmentDetail.phone')}</p>
              <p className="mt-1">{appointment.patientPhone}</p>
            </div>
            <div className="pt-2">
              <Link to={`/patients/${appointment.patientId}`}>
                <Button 
                  variant="outline" 
                  size="sm"
                >
                  {t('appointmentDetail.viewPatientProfile')}
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        <Card className="md:col-span-2">
          <h2 className="text-lg font-medium text-gray-900 mb-4">{t('appointmentDetail.notes')}</h2>
          {appointment.notes ? (
            <div className="prose max-w-none">
              <p>{appointment.notes}</p>
            </div>
          ) : (
            <p className="text-gray-500 italic">{t('appointmentDetail.noNotes')}</p>
          )}
        </Card>

        <Card className="md:col-span-2">
          <h2 className="text-lg font-medium text-gray-900 mb-4">{t('appointmentDetail.appointmentHistory')}</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">{t('appointmentDetail.created')}</p>
                <p className="mt-1">{formatDateTime(appointment.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">{t('appointmentDetail.lastUpdated')}</p>
                <p className="mt-1">{formatDateTime(appointment.updatedAt)}</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AppointmentDetail;