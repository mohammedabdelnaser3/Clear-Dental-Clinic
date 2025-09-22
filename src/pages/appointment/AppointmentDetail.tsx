import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button, Card, Badge } from '../../components/ui';
import { appointmentService } from '../../services/appointmentService';
import { toast } from 'react-hot-toast';

interface Appointment {
  _id: string;
  id: string;
  patientId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  } | string;
  dentistId?: {
    _id: string;
    firstName: string;
    lastName: string;
    specialization?: string;
  } | string;
  clinicId: {
    _id: string;
    name: string;
    address?: string;
    phone?: string;
  } | string;
  date: string;
  timeSlot: string;
  duration: number;
  serviceType: string;
  status: 'scheduled' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled' | 'no-show' | 'urgent';
  notes?: string;
  emergency?: boolean;
  createdAt: string;
  updatedAt: string;
  
  // Computed properties for backward compatibility
  patientName?: string;
  patientEmail?: string;
  patientPhone?: string;
  dentistName?: string;
  clinicName?: string;
  time?: string;
  type?: string;
  doctorName?: string;
  doctorId?: string;
}

const AppointmentDetail: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [actionLoading, setActionLoading] = useState<{ [key: string]: boolean }>({});
  const [showConfirmModal, setShowConfirmModal] = useState<{
    show: boolean;
    action: 'cancel' | 'complete' | 'no-show' | null;
    title: string;
    message: string;
    confirmText: string;
    variant: 'danger' | 'primary' | 'warning';
  }>({ 
    show: false, 
    action: null, 
    title: '', 
    message: '', 
    confirmText: '', 
    variant: 'primary' 
  });
  
  // Fetch appointment data on component mount
  useEffect(() => {
    const fetchAppointment = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        console.log('Fetching appointment with ID:', id);
        
        const response = await appointmentService.getAppointment(id);
        console.log('Appointment response:', response);
        
        // Handle the response structure from backend
        let appointmentData = response as any;
        if (appointmentData.data && appointmentData.data.appointment) {
          appointmentData = appointmentData.data.appointment;
        } else if (appointmentData.data) {
          appointmentData = appointmentData.data;
        }
        
        console.log('Processed appointment data:', appointmentData);
        
        // Transform populated fields to flat structure for backward compatibility
        const transformedAppointment = {
          ...appointmentData,
          id: appointmentData._id || appointmentData.id,
          patientName: typeof appointmentData.patientId === 'object' 
            ? `${appointmentData.patientId.firstName} ${appointmentData.patientId.lastName}`
            : undefined,
          patientEmail: typeof appointmentData.patientId === 'object' 
            ? appointmentData.patientId.email 
            : undefined,
          patientPhone: typeof appointmentData.patientId === 'object' 
            ? appointmentData.patientId.phone 
            : undefined,
          dentistName: typeof appointmentData.dentistId === 'object' 
            ? `${appointmentData.dentistId.firstName} ${appointmentData.dentistId.lastName}`
            : 'Auto-assigned',
          clinicName: typeof appointmentData.clinicId === 'object' 
            ? appointmentData.clinicId.name 
            : undefined,
          time: appointmentData.timeSlot,
          type: appointmentData.serviceType,
          doctorName: typeof appointmentData.dentistId === 'object' 
            ? `${appointmentData.dentistId.firstName} ${appointmentData.dentistId.lastName}`
            : 'Auto-assigned',
          doctorId: typeof appointmentData.dentistId === 'object' 
            ? appointmentData.dentistId._id 
            : appointmentData.dentistId
        };
        
        console.log('Final transformed appointment:', transformedAppointment);
        setAppointment(transformedAppointment);
      } catch (error: any) {
        console.error('Error fetching appointment:', error);
        console.error('Error details:', {
          message: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data
        });
        
        // Provide more specific error messages
        if (error.response?.status === 403) {
          toast.error(t('appointmentDetail.accessDenied') || 'Access denied. You can only view your own appointments.');
        } else if (error.response?.status === 404) {
          toast.error(t('appointmentDetail.notFound') || 'Appointment not found.');
        } else if (error.response?.status === 401) {
          toast.error(t('appointmentDetail.unauthorized') || 'Please log in to view appointment details.');
        } else {
          toast.error(t('appointmentDetail.errorFetching') || 'Failed to fetch appointment details');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchAppointment();
  }, [id, t]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(i18n.language, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
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

  const getStatusBadge = useCallback((status: Appointment['status']) => {
    const variants: Record<Appointment['status'], 'primary' | 'success' | 'gray' | 'danger' | 'warning'> = {
      'scheduled': 'primary',
      'confirmed': 'primary',
      'in-progress': 'warning',
      'completed': 'success',
      'cancelled': 'gray',
      'no-show': 'danger',
      'urgent': 'danger'
    };
    
    const labels: Record<Appointment['status'], string> = {
      'scheduled': t('appointments.scheduled'),
      'confirmed': t('appointments.confirmed'),
      'in-progress': t('appointments.inProgress') || 'In Progress',
      'completed': t('appointments.completed'),
      'cancelled': t('appointments.cancelled'),
      'no-show': t('appointments.noShow'),
      'urgent': t('appointments.urgent') || 'Urgent'
    };
    
    return (
      <Badge variant={variants[status] as 'primary' | 'success' | 'gray' | 'danger'} rounded={true} className="text-sm">
        {labels[status]}
      </Badge>
    );
  }, [t]);

  const handleCancelAppointment = useCallback(async () => {
    if (!appointment) return;
    
    try {
      setActionLoading(prev => ({ ...prev, cancel: true }));
      await appointmentService.updateAppointment(appointment._id || appointment.id, { status: 'cancelled' });
      toast.success(t('appointmentDetail.cancelSuccess') || 'Appointment cancelled successfully');
      
      // Update local state
      setAppointment(prev => prev ? { ...prev, status: 'cancelled' } : null);
      
      // Navigate back after a short delay
      setTimeout(() => navigate('/appointments'), 1500);
    } catch (error: any) {
      toast.error(t('appointmentDetail.cancelError') || 'Failed to cancel appointment');
      console.error('Error cancelling appointment:', error);
    } finally {
      setActionLoading(prev => ({ ...prev, cancel: false }));
      setShowConfirmModal({ show: false, action: null, title: '', message: '', confirmText: '', variant: 'primary' });
    }
  }, [appointment, navigate, t]);

  const handleCompleteAppointment = useCallback(async () => {
    if (!appointment) return;
    
    try {
      setActionLoading(prev => ({ ...prev, complete: true }));
      await appointmentService.updateAppointment(appointment._id || appointment.id, { status: 'completed' });
      toast.success(t('appointmentDetail.completeSuccess') || 'Appointment marked as completed');
      
      // Update local state
      setAppointment(prev => prev ? { ...prev, status: 'completed' } : null);
      
      // Navigate back after a short delay
      setTimeout(() => navigate('/appointments'), 1500);
    } catch (error: any) {
      toast.error(t('appointmentDetail.completeError') || 'Failed to complete appointment');
      console.error('Error completing appointment:', error);
    } finally {
      setActionLoading(prev => ({ ...prev, complete: false }));
      setShowConfirmModal({ show: false, action: null, title: '', message: '', confirmText: '', variant: 'primary' });
    }
  }, [appointment, navigate, t]);

  const handleNoShow = useCallback(async () => {
    if (!appointment) return;
    
    try {
      setActionLoading(prev => ({ ...prev, noShow: true }));
      await appointmentService.updateAppointment(appointment._id || appointment.id, { status: 'no-show' });
      toast.success(t('appointmentDetail.noShowSuccess') || 'Appointment marked as no-show');
      
      // Update local state
      setAppointment(prev => prev ? { ...prev, status: 'no-show' } : null);
      
      // Navigate back after a short delay
      setTimeout(() => navigate('/appointments'), 1500);
    } catch (error: any) {
      toast.error(t('appointmentDetail.noShowError') || 'Failed to mark appointment as no-show');
      console.error('Error marking appointment as no-show:', error);
    } finally {
      setActionLoading(prev => ({ ...prev, noShow: false }));
      setShowConfirmModal({ show: false, action: null, title: '', message: '', confirmText: '', variant: 'primary' });
    }
  }, [appointment, navigate, t]);

  // Helper functions for confirmation modals
  const showCancelConfirmation = useCallback(() => {
    setShowConfirmModal({
      show: true,
      action: 'cancel',
      title: t('appointmentDetail.cancelConfirmTitle') || 'Cancel Appointment',
      message: t('appointmentDetail.cancelConfirmMessage') || 'Are you sure you want to cancel this appointment? This action cannot be undone.',
      confirmText: t('appointmentDetail.yesCancel') || 'Yes, Cancel',
      variant: 'danger'
    });
  }, [t]);

  const showCompleteConfirmation = useCallback(() => {
    setShowConfirmModal({
      show: true,
      action: 'complete',
      title: t('appointmentDetail.completeConfirmTitle') || 'Complete Appointment',
      message: t('appointmentDetail.completeConfirmMessage') || 'Are you sure you want to mark this appointment as completed?',
      confirmText: t('appointmentDetail.yesComplete') || 'Yes, Complete',
      variant: 'primary'
    });
  }, [t]);

  const showNoShowConfirmation = useCallback(() => {
    setShowConfirmModal({
      show: true,
      action: 'no-show',
      title: t('appointmentDetail.noShowConfirmTitle') || 'Mark as No-Show',
      message: t('appointmentDetail.noShowConfirmMessage') || 'Are you sure you want to mark this appointment as no-show?',
      confirmText: t('appointmentDetail.yesNoShow') || 'Yes, Mark as No-Show',
      variant: 'warning'
    });
  }, [t]);

  const handleConfirmAction = useCallback(() => {
    if (showConfirmModal.action === 'cancel') {
      handleCancelAppointment();
    } else if (showConfirmModal.action === 'complete') {
      handleCompleteAppointment();
    } else if (showConfirmModal.action === 'no-show') {
      handleNoShow();
    }
  }, [showConfirmModal.action, handleCancelAppointment, handleCompleteAppointment, handleNoShow]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white py-8 px-6 rounded-b-3xl shadow-lg mb-8">
          <div className="max-w-7xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-white/20 rounded w-1/3 mb-2"></div>
              <div className="h-4 bg-white/10 rounded w-1/4"></div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, index) => (
              <Card key={index} className="animate-pulse">
                <div className="space-y-4">
                  <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (!appointment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-pink-50">
        <div className="bg-gradient-to-r from-red-600 via-pink-600 to-red-600 text-white py-8 px-6 rounded-b-3xl shadow-lg mb-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center space-x-3">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <h1 className="text-2xl font-bold">
                  {t('appointmentDetail.error') || 'Error'}
                </h1>
                <p className="text-red-100">
                  {t('appointmentDetail.appointmentNotFound') || 'Appointment not found'}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6">
          <Card className="max-w-md mx-auto text-center">
            <div className="p-8">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
                <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
          {t('appointmentDetail.appointmentNotFound')}
              </h3>
              <p className="text-gray-500 mb-6">
                {t('appointmentDetail.appointmentNotFoundDesc') || 'The appointment you are looking for does not exist or has been removed.'}
              </p>
              <div className="space-x-3">
          <Link to="/appointments">
                  <Button 
                    variant="primary"
                    className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 font-bold shadow-lg transition-all duration-200 transform hover:scale-105"
                  >
                    <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    <span className="font-bold">{t('appointmentDetail.backToAppointments')}</span>
            </Button>
          </Link>
                <Button 
                  variant="outline" 
                  onClick={() => window.location.reload()}
                  className="bg-slate-500/10 border-slate-300 text-slate-700 hover:bg-slate-500/20 font-medium shadow-md transition-all duration-200 transform hover:scale-105"
                >
                  <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span className="font-medium">{t('common.refresh') || 'Refresh'}</span>
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Enhanced Header with Gradient */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white py-8 px-6 rounded-b-3xl shadow-lg mb-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                </div>
                <h1 className="text-3xl font-bold">
                  {t('appointmentDetail.title')}
                </h1>
                <div className="ml-2">
              {getStatusBadge(appointment.status)}
            </div>
          </div>
              <div className="flex items-center space-x-4 text-blue-100">
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-6a1 1 0 00-1-1H9a1 1 0 00-1 1v6a1 1 0 01-1 1H4a1 1 0 110-2V4z" clipRule="evenodd" />
                  </svg>
                  <span>{t('appointmentDetail.appointmentId')}: #{appointment.id}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>{appointment.patientName}</span>
                </div>
              </div>
        </div>
            
            {/* Action Buttons */}
            <div className="mt-6 md:mt-0 flex flex-wrap gap-3">
              {(appointment.status === 'scheduled' || appointment.status === 'confirmed') && (
            <>
              <Link to={`/appointments/${id}/edit`}>
                <Button 
                  variant="outline"
                      className="bg-blue-500/20 border-blue-300 text-blue-100 hover:bg-blue-500/30 font-medium shadow-lg backdrop-blur-sm transition-all duration-200 transform hover:scale-105"
                >
                      <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                      <span className="font-semibold">{t('appointmentDetail.edit')}</span>
                </Button>
              </Link>
              <Button 
                variant="primary"
                    onClick={showCompleteConfirmation}
                    disabled={actionLoading.complete}
                    className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 border-0 text-white font-bold shadow-lg transition-all duration-200 transform hover:scale-105 disabled:transform-none"
                  >
                    {actionLoading.complete ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span className="font-medium">{t('common.processing')}</span>
                      </div>
                    ) : (
                      <>
                        <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                        <span className="font-bold">{t('appointmentDetail.markAsCompleted')}</span>
                      </>
                    )}
              </Button>
              <Button 
                variant="outline"
                    onClick={showCancelConfirmation}
                    disabled={actionLoading.cancel}
                    className="bg-gradient-to-r from-red-500/20 to-pink-500/20 border-red-300 text-red-100 hover:from-red-500/30 hover:to-pink-500/30 font-medium shadow-lg backdrop-blur-sm transition-all duration-200 transform hover:scale-105 disabled:transform-none"
                  >
                    {actionLoading.cancel ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-red-300 border-t-transparent rounded-full animate-spin" />
                        <span className="font-medium">{t('common.processing')}</span>
                      </div>
                    ) : (
                      <>
                        <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                        <span className="font-semibold">{t('appointmentDetail.cancelAppointment')}</span>
                      </>
                    )}
              </Button>
              <Button 
                variant="outline"
                    onClick={showNoShowConfirmation}
                    disabled={actionLoading.noShow}
                    className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-amber-300 text-amber-100 hover:from-amber-500/30 hover:to-orange-500/30 font-medium shadow-lg backdrop-blur-sm transition-all duration-200 transform hover:scale-105 disabled:transform-none"
                  >
                    {actionLoading.noShow ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-amber-300 border-t-transparent rounded-full animate-spin" />
                        <span className="font-medium">{t('common.processing')}</span>
                      </div>
                    ) : (
                      <>
                        <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                        <span className="font-semibold">{t('appointmentDetail.markAsNoShow')}</span>
                      </>
                    )}
              </Button>
            </>
          )}
          <Link to="/appointments">
            <Button 
              variant="outline"
                  className="bg-slate-500/20 border-slate-300 text-slate-100 hover:bg-slate-500/30 font-medium shadow-lg backdrop-blur-sm transition-all duration-200 transform hover:scale-105"
            >
                  <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  <span className="font-medium">{t('appointmentDetail.backToList')}</span>
            </Button>
          </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6">

      {/* Modern Confirmation Modal */}
      {showConfirmModal.show && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-modal-title"
        >
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 transform transition-all">
            <div className="flex items-center space-x-3 mb-4">
              <div className={`p-3 rounded-full ${
                showConfirmModal.variant === 'danger' 
                  ? 'bg-red-100' 
                  : showConfirmModal.variant === 'warning' 
                  ? 'bg-yellow-100' 
                  : 'bg-green-100'
              }`}>
                {showConfirmModal.variant === 'danger' ? (
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                ) : showConfirmModal.variant === 'warning' ? (
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <h3 id="confirm-modal-title" className="text-lg font-semibold text-gray-900">
                {showConfirmModal.title}
              </h3>
            </div>
            
            <p className="text-gray-600 mb-6 leading-relaxed">
              {showConfirmModal.message}
            </p>
            
            <div className="flex space-x-3 justify-end">
              <Button 
                variant="outline"
                onClick={() => setShowConfirmModal({ 
                  show: false, 
                  action: null, 
                  title: '', 
                  message: '', 
                  confirmText: '', 
                  variant: 'primary' 
                })}
                disabled={actionLoading[showConfirmModal.action || '']}
                className="bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200 font-medium shadow-sm transition-all duration-200"
              >
                <span className="font-medium">{t('common.cancel')}</span>
              </Button>
              <Button 
                variant={showConfirmModal.variant === 'danger' ? 'danger' : 'primary'}
                onClick={handleConfirmAction}
                disabled={actionLoading[showConfirmModal.action || '']}
                autoFocus
                className={`font-bold shadow-lg transition-all duration-200 transform hover:scale-105 disabled:transform-none ${
                  showConfirmModal.variant === 'danger' 
                    ? 'bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 border-0' 
                    : showConfirmModal.variant === 'warning' 
                    ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 border-0 text-white' 
                    : 'bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 border-0'
                }`}
              >
                {actionLoading[showConfirmModal.action || ''] ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span className="font-medium">{t('common.processing')}</span>
                  </div>
                ) : (
                  <span className="font-bold">{showConfirmModal.confirmText}</span>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Cards Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Info Card */}
        <div className="lg:col-span-3">
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 shadow-lg">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center md:text-left">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl mb-3">
                  <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-500">{t('appointmentDetail.date')}</p>
                <p className="text-lg font-semibold text-gray-900">{formatDate(appointment.date)}</p>
              </div>
              
              <div className="text-center md:text-left">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-xl mb-3">
                  <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-500">{t('appointmentDetail.time')}</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatTime(appointment.timeSlot)}
                  <span className="text-sm text-gray-500 ml-1">({appointment.duration} min)</span>
                </p>
              </div>
              
              <div className="text-center md:text-left">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-xl mb-3">
                  <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-500">{t('appointmentDetail.doctor')}</p>
                <p className="text-lg font-semibold text-gray-900">{appointment.dentistName || 'Auto-assigned'}</p>
              </div>
              
              <div className="text-center md:text-left">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-xl mb-3">
                  <svg className="w-6 h-6 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-500">{t('appointmentDetail.status')}</p>
                <div className="mt-1">{getStatusBadge(appointment.status)}</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Appointment Details */}
        <Card className="lg:col-span-2 shadow-lg hover:shadow-xl transition-shadow duration-200">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-6a1 1 0 00-1-1H9a1 1 0 00-1 1v6a1 1 0 01-1 1H4a1 1 0 110-2V4z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900">{t('appointmentDetail.appointmentInfo')}</h2>
          </div>
          
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
                  <p className="text-sm font-medium text-gray-500">{t('appointmentDetail.type')}</p>
                  <p className="mt-1 text-base font-medium text-gray-900">{appointment.serviceType}</p>
            </div>
            <div>
                  <p className="text-sm font-medium text-gray-500">{t('appointmentDetail.clinic')}</p>
                  <p className="mt-1 text-base font-medium text-gray-900">{appointment.clinicName}</p>
                </div>
              </div>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-500 mb-2">{t('appointmentDetail.appointmentId')}</p>
              <div className="bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg p-3 font-mono text-sm">
                #{appointment._id || appointment.id}
              </div>
            </div>
          </div>
        </Card>

        {/* Patient Information */}
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-200">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900">{t('appointmentDetail.patientInfo')}</h2>
          </div>
          
          <div className="space-y-4">
            <div className="text-center pb-4 border-b border-gray-200">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full text-white font-bold text-xl mb-3">
                {appointment.patientName?.split(' ').map(name => name[0]).join('') || 'PA'}
              </div>
                <Link 
                to={`/patients/${typeof appointment.patientId === 'object' ? appointment.patientId._id : appointment.patientId}`}
                className="text-lg font-semibold text-indigo-600 hover:text-indigo-800 transition-colors duration-200 block"
                >
                  {appointment.patientName}
                </Link>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
            <div>
                  <p className="text-sm text-gray-500">{t('appointmentDetail.email')}</p>
                  <p className="font-medium">{appointment.patientEmail}</p>
                </div>
            </div>
              
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
            <div>
                  <p className="text-sm text-gray-500">{t('appointmentDetail.phone')}</p>
                  <p className="font-medium">{appointment.patientPhone}</p>
                </div>
              </div>
            </div>
            
            <div className="pt-4 border-t border-gray-200">
              <Link to={`/patients/${typeof appointment.patientId === 'object' ? appointment.patientId._id : appointment.patientId}`}>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="w-full bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-indigo-300 text-indigo-700 hover:from-indigo-500/20 hover:to-purple-500/20 font-medium shadow-md transition-all duration-200 transform hover:scale-105"
                >
                  <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="font-semibold">{t('appointmentDetail.viewPatientProfile')}</span>
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        {/* Notes Section */}
        <Card className="lg:col-span-3 shadow-lg hover:shadow-xl transition-shadow duration-200">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900">{t('appointmentDetail.notes')}</h2>
          </div>
          
          {appointment.notes ? (
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-6">
            <div className="prose max-w-none">
                <p className="text-gray-700 leading-relaxed">{appointment.notes}</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="mt-4 text-gray-500 italic">{t('appointmentDetail.noNotes')}</p>
            </div>
          )}
        </Card>

        {/* History Section */}
        <Card className="lg:col-span-3 shadow-lg hover:shadow-xl transition-shadow duration-200">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <svg className="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900">{t('appointmentDetail.appointmentHistory')}</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <p className="text-sm font-medium text-gray-500">{t('appointmentDetail.created')}</p>
              </div>
              <p className="text-lg font-semibold text-gray-900">{formatDateTime(appointment.createdAt)}</p>
            </div>
            
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <p className="text-sm font-medium text-gray-500">{t('appointmentDetail.lastUpdated')}</p>
              </div>
              <p className="text-lg font-semibold text-gray-900">{formatDateTime(appointment.updatedAt)}</p>
            </div>
          </div>
        </Card>
      </div>
      </div>
    </div>
  );
};

export default AppointmentDetail;