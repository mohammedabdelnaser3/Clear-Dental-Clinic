import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  const [actionLoading, setActionLoading] = useState<{ [key: string]: boolean }>({});
  const [showConfirmModal, setShowConfirmModal] = useState<{
    show: boolean;
    action: 'cancel' | 'complete' | null;
    appointmentIds: string[];
    message: string;
  }>({ show: false, action: null, appointmentIds: [], message: '' });

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
            // No patient record found - handle gracefully without console warnings
            // This is expected for new users or users without patient records
          }
        } catch (_error) {
          // Error handled gracefully - no need for console errors in production
          // The patientService handles API errors appropriately
        }
      }
    };
    
    getPatientId();
  }, [user, t, patientService]); // Added missing dependencies

  // Fetch appointments from API
  const fetchAppointments = useCallback(async () => {
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

      // Handle different response structures
      const responseData = response as any;
      
      // Transform appointments to ensure consistent structure
      const transformAppointments = (rawAppointments: any[]) => {
        return rawAppointments.map((appointment: any) => ({
          ...appointment,
          id: appointment._id || appointment.id, // Ensure id field exists
          patientName: typeof appointment.patientId === 'object' 
            ? `${appointment.patientId.firstName} ${appointment.patientId.lastName}`
            : appointment.patientName,
          dentistName: typeof appointment.dentistId === 'object' 
            ? `${appointment.dentistId.firstName} ${appointment.dentistId.lastName}`
            : appointment.dentistName || 'Auto-assigned',
          clinicName: typeof appointment.clinicId === 'object' 
            ? appointment.clinicId.name 
            : appointment.clinicName,
        }));
      };

      // Check if response follows the ApiResponse pattern {success: true, data: ...}
      if (responseData && responseData.success && responseData.data) {
        // Handle structured response from apiService wrapper
        if (Array.isArray(responseData.data.appointments)) {
          // Backend returns { success: true, data: { appointments: [...], totalPages: X, total: Y } }
          setAppointments(transformAppointments(responseData.data.appointments));
          setTotalPages(responseData.data.totalPages || 1);
          setTotalCount(responseData.data.total || responseData.data.appointments.length);
        } else if (Array.isArray(responseData.data.data) && responseData.data.pagination) {
          // Backend returns { success: true, data: { data: [...], pagination: {...} } }
          setAppointments(transformAppointments(responseData.data.data));
          setTotalPages(responseData.data.pagination.totalPages || 1);
          setTotalCount(responseData.data.pagination.total || responseData.data.data.length);
        } else if (Array.isArray(responseData.data)) {
          // Backend returns { success: true, data: [...] }
          setAppointments(transformAppointments(responseData.data));
          setTotalPages(1);
          setTotalCount(responseData.data.length);
        } else {
          // Unexpected data structure - handle gracefully
          setAppointments([]);
          setTotalPages(1);
          setTotalCount(0);
        }
      } else if (responseData && Array.isArray(responseData.data)) {
        // Handle direct response format (legacy)
        setAppointments(transformAppointments(responseData.data));
        setTotalPages(responseData.totalPages || 1);
        setTotalCount(responseData.total || 0);
      } else if (responseData && Array.isArray(responseData)) {
        // Handle direct array response
        setAppointments(transformAppointments(responseData));
        setTotalPages(1);
        setTotalCount(responseData.length);
      } else {
        // Invalid response format - handle gracefully
        setAppointments([]);
        setTotalPages(1);
        setTotalCount(0);
        toast.error(t('appointments.invalidResponse') || 'Invalid response format received');
      }
    } catch (error: any) {
      // API error handled with user-friendly message
      toast.error(error.message || t('appointments.errorFetching'));
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, statusFilter, dateFilter, user, patientId, t]);

  useEffect(() => {
    if (user && (user.role !== 'patient' || patientId)) {
      fetchAppointments();
    }
  }, [currentPage, statusFilter, dateFilter, user, patientId, fetchAppointments]);

  // Filter appointments based on search term (client-side filtering for search) - optimized with useMemo
  const filteredAppointments = useMemo(() => {
    if (!searchTerm) return appointments;
    
    const searchLower = searchTerm.toLowerCase();
    return appointments.filter(appointment => 
      appointment.patientName?.toLowerCase().includes(searchLower) ||
      appointment.dentistName?.toLowerCase().includes(searchLower) ||
      appointment.serviceType?.toLowerCase().includes(searchLower) ||
      appointment.clinicName?.toLowerCase().includes(searchLower)
    );
  }, [appointments, searchTerm]);

  // Use filtered appointments for display
  const displayAppointments = filteredAppointments;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleRowClick = (appointment: AppointmentWithNames) => {
    navigate(`/appointments/${appointment.id}`);
  };

  const handleCancelAppointment = useCallback(async (appointmentIds: string[]) => {
    const loadingKey = appointmentIds.join(',');
    try {
      setActionLoading(prev => ({ ...prev, [`cancel-${loadingKey}`]: true }));
      await Promise.all(appointmentIds.map(id => appointmentService.updateAppointment(id, { status: 'cancelled' })));
      toast.success(t('appointments.appointmentCancelledSuccess') || 'Appointment(s) cancelled successfully');
      fetchAppointments(); // Refresh the list
      setSelectedAppointments([]); // Clear selection
    } catch (error: any) {
      // Provide more specific error messages based on status code
      if (error.response?.status === 500) {
        toast.error(t('appointments.errors.serverError') || 'Server error occurred while cancelling appointment. Please try again later.');
      } else if (error.response?.status === 404) {
        toast.error(t('appointments.errors.notFound') || 'Appointment not found. It may have already been cancelled or deleted.');
      } else if (error.response?.status === 403) {
        toast.error(t('appointments.errors.unauthorized') || 'You do not have permission to cancel this appointment.');
      } else if (error.response?.status === 400) {
        toast.error(t('appointments.errors.badRequest') || 'Invalid request. Please check the appointment details.');
      } else {
        toast.error(error.message || t('appointments.errorCancelling') || 'Failed to cancel appointment');
      }
    } finally {
      setActionLoading(prev => ({ ...prev, [`cancel-${loadingKey}`]: false }));
      setShowConfirmModal({ show: false, action: null, appointmentIds: [], message: '' });
    }
  }, [fetchAppointments, t]);

  const handleCompleteAppointment = useCallback(async (appointmentIds: string[]) => {
    const loadingKey = appointmentIds.join(',');
    try {
      setActionLoading(prev => ({ ...prev, [`complete-${loadingKey}`]: true }));
      await Promise.all(appointmentIds.map(id => appointmentService.updateAppointment(id, { status: 'completed' })));
      toast.success(t('appointments.appointmentCompletedSuccess') || 'Appointment(s) completed successfully');
      fetchAppointments(); // Refresh the list
      setSelectedAppointments([]); // Clear selection
    } catch (error: any) {
      // Provide more specific error messages based on status code
      if (error.response?.status === 500) {
        toast.error(t('appointments.errors.serverError') || 'Server error occurred while completing appointment. Please try again later.');
      } else if (error.response?.status === 404) {
        toast.error(t('appointments.errors.notFound') || 'Appointment not found. It may have already been completed or deleted.');
      } else if (error.response?.status === 403) {
        toast.error(t('appointments.errors.unauthorized') || 'You do not have permission to complete this appointment.');
      } else if (error.response?.status === 400) {
        toast.error(t('appointments.errors.badRequest') || 'Invalid request. Please check the appointment details.');
      } else {
        toast.error(error.message || t('appointments.errorCompleting') || 'Failed to complete appointment');
      }
    } finally {
      setActionLoading(prev => ({ ...prev, [`complete-${loadingKey}`]: false }));
      setShowConfirmModal({ show: false, action: null, appointmentIds: [], message: '' });
    }
  }, [fetchAppointments, t]);



  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString(i18n.language, {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = useCallback((timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? t('common.time.pm') || 'PM' : t('common.time.am') || 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  }, [t]);

  const getStatusBadge = useCallback((status: AppointmentStatus) => {
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
  }, [t]);

  // Helper functions for confirmation modal
  const showCancelConfirmation = useCallback((appointmentIds: string[]) => {
    const count = appointmentIds.length;
    const message = count === 1 
      ? t('appointments.confirmCancel.single') || 'Are you sure you want to cancel this appointment?'
      : t('appointments.confirmCancel.multiple', { count }) || `Are you sure you want to cancel ${count} appointments?`;
    
    setShowConfirmModal({
      show: true,
      action: 'cancel',
      appointmentIds,
      message
    });
  }, [t]);

  const showCompleteConfirmation = useCallback((appointmentIds: string[]) => {
    const count = appointmentIds.length;
    const message = count === 1 
      ? t('appointments.confirmComplete.single') || 'Are you sure you want to mark this appointment as completed?'
      : t('appointments.confirmComplete.multiple', { count }) || `Are you sure you want to mark ${count} appointments as completed?`;
    
    setShowConfirmModal({
      show: true,
      action: 'complete',
      appointmentIds,
      message
    });
  }, [t]);

  const handleConfirmAction = useCallback(() => {
    if (showConfirmModal.action === 'cancel') {
      handleCancelAppointment(showConfirmModal.appointmentIds);
    } else if (showConfirmModal.action === 'complete') {
      handleCompleteAppointment(showConfirmModal.appointmentIds);
    }
  }, [showConfirmModal, handleCancelAppointment, handleCompleteAppointment]);

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
      accessor: (appointment: AppointmentWithNames) => {
        const isCancelLoading = actionLoading[`cancel-${appointment.id}`];
        const isCompleteLoading = actionLoading[`complete-${appointment.id}`];
        
        return (
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/appointments/${appointment.id}`);
              }}
              aria-label={t('appointments.viewDetails', { patient: appointment.patientName })}
              className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-indigo-300 text-indigo-700 hover:from-indigo-500/20 hover:to-purple-500/20 font-medium shadow-sm transition-all duration-200 transform hover:scale-105"
            >
              <span className="font-medium">{t('appointments.view')}</span>
            </Button>
            {(appointment.status === 'scheduled' || appointment.status === 'confirmed') && (
              <>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    showCompleteConfirmation([appointment.id]);
                  }}
                  disabled={isCompleteLoading || isCancelLoading}
                  aria-label={t('appointments.completeAppointment', { patient: appointment.patientName })}
                  className="bg-gradient-to-r from-emerald-500/10 to-green-500/10 border-emerald-400 text-emerald-700 hover:from-emerald-500/20 hover:to-green-500/20 font-medium shadow-sm transition-all duration-200 transform hover:scale-105 disabled:transform-none"
                >
                  {isCompleteLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                      <span className="font-medium">{t('common.processing')}</span>
                    </div>
                  ) : (
                    <span className="font-medium">{t('appointments.complete')}</span>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="bg-gradient-to-r from-red-500/10 to-pink-500/10 border-red-400 text-red-700 hover:from-red-500/20 hover:to-pink-500/20 font-medium shadow-sm transition-all duration-200 transform hover:scale-105 disabled:transform-none"
                  onClick={(e) => {
                    e.stopPropagation();
                    showCancelConfirmation([appointment.id]);
                  }}
                  disabled={isCompleteLoading || isCancelLoading}
                  aria-label={t('appointments.cancelAppointment', { patient: appointment.patientName })}
                >
                  {isCancelLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                      <span className="font-medium">{t('common.processing')}</span>
                    </div>
                  ) : (
                    <span className="font-medium">{t('appointments.cancel')}</span>
                  )}
                </Button>
              </>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header Section with Enhanced Gradient */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white py-8 px-6 rounded-b-3xl shadow-lg mb-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-white">
                {t('appointments.title')}
              </h1>
              <p className="text-blue-100 text-lg">
                {t('appointments.description')}
              </p>
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-2 bg-white/20 rounded-full px-3 py-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                  <span>{totalCount} {t('appointments.total')}</span>
                </div>
                {selectedAppointments.length > 0 && (
                  <div className="flex items-center space-x-2 bg-yellow-400/20 text-yellow-100 rounded-full px-3 py-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>{selectedAppointments.length} {t('appointments.selected')}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-6 md:mt-0">
            <Link to="/appointments/create">
              <Button 
                variant="primary"
                className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 font-bold"
                size="lg"
              >
                <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span className="font-bold">{t('appointments.newAppointment')}</span>
              </Button>
            </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6">

      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        {/* Enhanced Search and Filter Section */}
        <div className="mb-6 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-blue-100">
          <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
            <div className="flex-1 max-w-md">
              <Input
                placeholder={t('appointments.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="shadow-sm"
                leftIcon={
                  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                }
                aria-label={t('appointments.searchLabel')}
              />
            </div>
            <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-x-3 sm:space-y-0">
              <div className="flex items-center space-x-1">
                <span className="text-sm font-medium text-gray-700">{t('common.status')}:</span>
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
                  aria-label={t('appointments.filterByStatus')}
                />
              </div>
              <div className="flex items-center space-x-1">
                <span className="text-sm font-medium text-gray-700">{t('common.date')}:</span>
                <DatePicker
                  value={dateFilter ? dateFilter : undefined}
                  onChange={(date) => setDateFilter(date as Date | null)}
                  className="w-full sm:w-40"
                  placeholder={t('appointments.selectDate')}
                  aria-label={t('appointments.filterByDate')}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mb-4 flex items-center space-x-2">
          {selectedAppointments.length > 0 && (
            <div className="flex items-center space-x-2 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
              <span className="text-sm font-medium text-blue-800 mr-2">
                {t('appointments.selectedCount', { count: selectedAppointments.length })}
              </span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => showCompleteConfirmation(selectedAppointments)}
                disabled={actionLoading[`complete-${selectedAppointments.join(',')}`]}
                aria-label={t('appointments.completeSelectedLabel', { count: selectedAppointments.length })}
                className="bg-gradient-to-r from-emerald-500/10 to-green-500/10 border-emerald-400 text-emerald-700 hover:from-emerald-500/20 hover:to-green-500/20 font-semibold shadow-md transition-all duration-200 transform hover:scale-105 disabled:transform-none"
              >
                <svg className="-ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {actionLoading[`complete-${selectedAppointments.join(',')}`] ? (
                  <div className="flex items-center space-x-1">
                    <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                    <span className="font-medium">{t('common.processing')}</span>
                  </div>
                ) : (
                  <span className="font-semibold">{t('appointments.completeSelected')}</span>
                )}
              </Button>

              <Button 
                variant="outline" 
                size="sm" 
                className="bg-gradient-to-r from-red-500/10 to-pink-500/10 border-red-400 text-red-700 hover:from-red-500/20 hover:to-pink-500/20 font-semibold shadow-md transition-all duration-200 transform hover:scale-105 disabled:transform-none" 
                onClick={() => showCancelConfirmation(selectedAppointments)}
                disabled={actionLoading[`cancel-${selectedAppointments.join(',')}`]}
                aria-label={t('appointments.cancelSelectedLabel', { count: selectedAppointments.length })}
              >
                <svg className="-ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                {actionLoading[`cancel-${selectedAppointments.join(',')}`] ? (
                  <div className="flex items-center space-x-1">
                    <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                    <span className="font-medium">{t('common.processing')}</span>
                  </div>
                ) : (
                  <span className="font-semibold">{t('appointments.cancel')}</span>
                )}
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

      {/* Confirmation Modal */}
      {showConfirmModal.show && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-modal-title"
        >
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className={`p-2 rounded-full ${showConfirmModal.action === 'cancel' ? 'bg-red-100' : 'bg-green-100'}`}>
                {showConfirmModal.action === 'cancel' ? (
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <h3 id="confirm-modal-title" className="text-lg font-medium text-gray-900">
                {showConfirmModal.action === 'cancel' 
                  ? t('appointments.confirmCancel.title') || 'Cancel Appointment'
                  : t('appointments.confirmComplete.title') || 'Complete Appointment'
                }
              </h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              {showConfirmModal.message}
            </p>
            
            <div className="flex space-x-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowConfirmModal({ show: false, action: null, appointmentIds: [], message: '' })}
                disabled={actionLoading[`${showConfirmModal.action}-${showConfirmModal.appointmentIds.join(',')}`]}
                className="bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200 font-medium shadow-sm transition-all duration-200"
              >
                <span className="font-medium">{t('common.cancel')}</span>
              </Button>
              <Button
                variant={showConfirmModal.action === 'cancel' ? 'danger' : 'primary'}
                onClick={handleConfirmAction}
                disabled={actionLoading[`${showConfirmModal.action}-${showConfirmModal.appointmentIds.join(',')}`]}
                autoFocus
                className={`font-bold shadow-lg transition-all duration-200 transform hover:scale-105 disabled:transform-none ${
                  showConfirmModal.action === 'cancel' 
                    ? 'bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 border-0' 
                    : 'bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 border-0'
                }`}
              >
                {actionLoading[`${showConfirmModal.action}-${showConfirmModal.appointmentIds.join(',')}`] ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span className="font-medium">{t('common.processing')}</span>
                  </div>
                ) : (
                  <span className="font-bold">
                    {showConfirmModal.action === 'cancel' 
                      ? t('appointments.confirmCancel.action') || 'Yes, Cancel'
                      : t('appointments.confirmComplete.action') || 'Yes, Complete'
                    }
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default Appointments;