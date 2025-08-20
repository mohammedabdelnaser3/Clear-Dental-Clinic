import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Input, Card, Table, Pagination, Badge, Select, DatePicker } from '../../components/ui';
import { appointmentService } from '../../services/appointmentService';
import { patientService } from '../../services/patientService';
import { useAuth } from '../../hooks/useAuth';
import type { Appointment, AppointmentStatus } from '../../types';
import { toast } from 'react-hot-toast';

interface AppointmentWithNames extends Appointment {
  patientName?: string;
  dentistName?: string;
  clinicName?: string;
}

const Appointments: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [appointments, setAppointments] = useState<AppointmentWithNames[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [patientId, setPatientId] = useState<string | null>(null);

  const [selectedAppointments, setSelectedAppointments] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | 'all'>('all');
  const [dateFilter, setDateFilter] = useState<Date | null>(null);

  // Get patient ID for patient users
  useEffect(() => {
    const getPatientId = async () => {
      if (user?.role === 'patient') {
        try {
          // Get patient records linked to this user
          const response = await patientService.getPatientsByUserId(user.id, { page: 1, limit: 1 });
          if (response.data && response.data.length > 0) {
            setPatientId(response.data[0].id);
          } else {
            console.warn('No patient record found for user:', user.id);
            // Don't show error toast as it might confuse users
            // Instead, handle this gracefully in the UI
          }
        } catch (_error) {
          console.error('Error getting patient ID:', _error);
          // Don't show error toast as the patientService now handles errors gracefully
        }
      }
    };
    
    getPatientId();
  }, [user, t, patientService]); // Added missing dependencies

  // Fetch appointments from API
  const fetchAppointments = async () => {
    try {
      setIsLoading(true);
      const params: any = {
        page: currentPage,
        limit: 10
      };

      // Add filters
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      // Add date filter
      if (dateFilter) {
        const startOfDay = new Date(dateFilter);
        startOfDay.setHours(0, 0, 0, 0);
        params.startDate = startOfDay.toISOString();
        const endOfDay = new Date(dateFilter);
        endOfDay.setHours(23, 59, 59, 999);
        params.endDate = endOfDay.toISOString();
      }

      let response;
      if (user?.role === 'patient' && patientId) {
        // For patients, use the general endpoint with patientId parameter
        params.patientId = patientId;
        response = await appointmentService.getAppointments(params);
      } else if (user?.role && ['staff', 'dentist', 'admin', 'super_admin'].includes(user.role)) {
        // For staff/admin, use the general appointments endpoint
        response = await appointmentService.getAppointments(params);
      } else {
        throw new Error(t('common.errors.unauthorized'));
      }

      // Validate response and ensure data is an array
      const responseData = response as any;
      if (responseData && Array.isArray(responseData.data)) {
        setAppointments(responseData.data);
        setTotalPages(responseData.totalPages || 1);
        setTotalCount(responseData.total || 0);
      } else {
        console.error('Invalid appointments response:', response);
        setAppointments([]);
        setTotalPages(1);
        setTotalCount(0);
        toast.error(t('appointments.invalidResponse'));
      }
    } catch (error: any) {
      console.error('Error fetching appointments:', error);
      toast.error(error.message || t('appointments.errorFetching'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user && (user.role !== 'patient' || patientId)) {
      fetchAppointments();
    }
  }, [currentPage, statusFilter, dateFilter, user, patientId, fetchAppointments]);

  // Filter appointments based on search term (client-side filtering for search)
  const filteredAppointments = appointments.filter(appointment => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      appointment.patientName?.toLowerCase().includes(searchLower) ||
      appointment.dentistName?.toLowerCase().includes(searchLower) ||
      appointment.serviceType?.toLowerCase().includes(searchLower) ||
      appointment.clinicName?.toLowerCase().includes(searchLower)
    );
  });

  // Use filtered appointments for display
  const displayAppointments = filteredAppointments;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleRowClick = (appointment: AppointmentWithNames) => {
    navigate(`/appointments/${appointment.id}`);
  };

  const handleCancelAppointment = async (appointmentIds: string[]) => {
    try {
      await Promise.all(appointmentIds.map(id => appointmentService.updateAppointment(id, { status: 'cancelled' })));
      toast.success(t('appointments.appointmentCancelledSuccess'));
      fetchAppointments(); // Refresh the list
    } catch (error: any) {
      console.error('Error cancelling appointment:', error);
      toast.error(error.message || t('appointments.errorCancelling'));
    }
  };

  const handleCompleteAppointment = async (appointmentIds: string[]) => {
    try {
      await Promise.all(appointmentIds.map(id => appointmentService.updateAppointment(id, { status: 'completed' })));
      toast.success(t('appointments.appointmentCompletedSuccess'));
      fetchAppointments(); // Refresh the list
    } catch (error: any) {
      console.error('Error completing appointment:', error);
      toast.error(error.message || t('appointments.errorCompleting'));
    }
  };



  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString(i18n.language, {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
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

  const getStatusBadge = (status: AppointmentStatus) => {
    const variants: Record<AppointmentStatus, 'primary' | 'success' | 'gray' | 'danger'> = {
      'scheduled': 'primary',
      'confirmed': 'primary',
      'completed': 'success',
      'cancelled': 'gray',
      'no-show': 'danger'
    };
    
    return (
      <Badge variant={variants[status]} rounded={true}>
        {t(`appointments.${status.replace('-', '')}`)}
      </Badge>
    );
  };

  const columns = [
    {
      header: t('appointments.patient'),
      accessor: (appointment: AppointmentWithNames) => (
        <div>
          <div className="font-medium text-gray-900">{appointment.patientName || t('appointments.unknownPatient')}</div>
        </div>
      ),
    },
    {
      header: t('appointments.dateTime'),
      accessor: (appointment: AppointmentWithNames) => (
        <div>
          <div className="font-medium text-gray-900">{formatDate(appointment.date)}</div>
          <div className="text-sm text-gray-500">{formatTime(appointment.timeSlot)} ({appointment.duration} min)</div>
        </div>
      ),
    },
    {
      header: t('appointments.service'),
      accessor: (appointment: AppointmentWithNames) => (
        <div>
          <div className="font-medium text-gray-900">{appointment.serviceType}</div>
          <div className="text-sm text-gray-500">{appointment.clinicName}</div>
        </div>
      ),
    },
    {
      header: t('appointments.dentist'),
      accessor: (appointment: AppointmentWithNames) => appointment.dentistName || t('appointments.unknownDentist'),
    },
    {
      header: t('appointments.status'),
      accessor: (appointment: AppointmentWithNames) => getStatusBadge(appointment.status),
    },
    {
      header: t('appointments.actions'),
      accessor: (appointment: AppointmentWithNames) => (
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/appointments/${appointment.id}`);
            }}
          >
            {t('appointments.view')}
          </Button>
          {appointment.status === 'scheduled' && (
            <>
              <Button 
            variant="outline" 
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleCompleteAppointment([appointment.id]);
            }}
          >
            {t('appointments.complete')}
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className="text-red-600 hover:text-red-700"
            onClick={(e) => {
              e.stopPropagation();
              handleCancelAppointment([appointment.id]);
            }}
          >
            {t('appointments.cancel')}
          </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="py-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{t('appointments.title')}</h1>
          <p className="mt-1 text-sm text-gray-600">
            {t('appointments.description')} ({totalCount} {t('appointments.total')})
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <Link to="/appointments/create">
            <Button 
              variant="primary"
            >
              <svg className="-ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              {t('appointments.newAppointment')}
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <div className="mb-6 flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div className="w-full sm:w-64">
            <Input
              placeholder={t('appointments.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              }
            />
          </div>
          <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-x-2 sm:space-y-0">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as AppointmentStatus | 'all')}
              className="w-full sm:w-40"
              options={[
                { value: 'all', label: t('appointments.allStatuses') },
                { value: 'scheduled', label: t('appointments.scheduled') },
                { value: 'confirmed', label: t('appointments.confirmed') },
                { value: 'completed', label: t('appointments.completed') },
                { value: 'cancelled', label: t('appointments.cancelled') },
                { value: 'no-show', label: t('appointments.noShow') }
              ]}
            />
            <DatePicker
              value={dateFilter ? dateFilter : undefined}
              onChange={(date) => setDateFilter(date as Date | null)}
              className="w-full sm:w-40"
              placeholder={t('appointments.selectDate')}
            />
          </div>
        </div>

        <div className="mb-4 flex items-center space-x-2">
          {selectedAppointments.length > 0 && (
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={() => handleCompleteAppointment(selectedAppointments)}>
                <svg className="-ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {t('appointments.completeSelected')}
              </Button>

              <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleCancelAppointment(selectedAppointments)}>
                <svg className="-ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                {t('appointments.cancel')}
              </Button>
            </div>
          )}
        </div>

        <Table
          columns={columns}
          data={displayAppointments}
          keyExtractor={(appointment) => appointment.id}
          isLoading={isLoading}
          emptyMessage={t('appointments.noAppointmentsFound')}
          onRowClick={handleRowClick}
          isSelectable
          selectedIds={selectedAppointments}
          onSelectionChange={(selectedIds) => setSelectedAppointments(selectedIds as string[])}
        />

        {totalPages > 1 && (
          <div className="mt-6 flex justify-center">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </Card>
    </div>
  );
};

export default Appointments;