import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, Button, Badge } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';
import { appointmentService } from '../../services/appointmentService';
import { patientService } from '../../services/patientService';

// Patient Dashboard Interfaces
interface PatientDashboardStats {
  upcomingAppointments: number;
  recentVisits: number;
  pendingBills: number;
  totalTreatments: number;
}

interface UpcomingAppointment {
  _id: string;
  date: string;
  timeSlot: string;
  serviceType: string;
  dentistId?: {
    firstName: string;
    lastName: string;
    specialization?: string;
  };
  clinicId?: {
    name: string;
  };
  status: string;
}

interface RecentActivity {
  id: string;
  type: 'appointment' | 'treatment' | 'billing' | 'prescription';
  title: string;
  description: string;
  date: string;
  status?: string;
}

const PatientDashboard: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState<PatientDashboardStats>({
    upcomingAppointments: 0,
    recentVisits: 0,
    pendingBills: 0,
    totalTreatments: 0
  });
  const [upcomingAppointments, setUpcomingAppointments] = useState<UpcomingAppointment[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchPatientDashboardData = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      setError(null);

      // Get patient record linked to user
      let patientId = null;
      try {
        const patientsResponse = await patientService.getPatientsByUserId(user.id, { page: 1, limit: 1 });
        if (patientsResponse.data && patientsResponse.data.length > 0) {
          patientId = patientsResponse.data[0].id;
          // Patient profile data stored in patientId for other uses
        }
      } catch (_patientError) {
        console.warn('No patient record found for user');
      }

      if (patientId) {
        // Fetch upcoming appointments
        try {
          const appointmentsResponse = await appointmentService.getAppointments({
            patientId,
            limit: 5,
            sort: 'date',
            order: 'asc'
          });

          const responseData = appointmentsResponse as any;
          let appointments = [];

          // Handle different response structures
          if (responseData?.success && responseData.data) {
            if (Array.isArray(responseData.data.data)) {
              appointments = responseData.data.data;
            } else if (Array.isArray(responseData.data.appointments)) {
              appointments = responseData.data.appointments;
            } else if (Array.isArray(responseData.data)) {
              appointments = responseData.data;
            }
          }

          // Filter for upcoming appointments (today or future)
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const upcoming = appointments.filter((apt: any) => {
            const aptDate = new Date(apt.date);
            return aptDate >= today && ['scheduled', 'confirmed'].includes(apt.status);
          }).slice(0, 3);

          setUpcomingAppointments(upcoming);

          // Calculate stats
          const recentVisits = appointments.filter((apt: any) =>
            apt.status === 'completed' &&
            new Date(apt.date) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          ).length;

          setDashboardStats(prev => ({
            ...prev,
            upcomingAppointments: upcoming.length,
            recentVisits,
            totalTreatments: appointments.filter((apt: any) => apt.status === 'completed').length
          }));

          // Create recent activities from appointments
          const activities: RecentActivity[] = appointments
            .slice(0, 5)
            .map((apt: any) => ({
              id: apt._id || apt.id,
              type: 'appointment' as const,
              title: `${t('patientDashboard.appointment')} - ${apt.serviceType}`,
              description: apt.status === 'completed'
                ? t('patientDashboard.completedAppointment', { service: apt.serviceType })
                : t('patientDashboard.scheduledAppointment', { service: apt.serviceType }),
              date: apt.date,
              status: apt.status
            }));

          setRecentActivities(activities);

        } catch (appointmentError) {
          console.warn('Error fetching appointments:', appointmentError);
        }

        // Fetch billing information
        try {
          // This would require a patient billing endpoint
          // For now, set placeholder
          setDashboardStats(prev => ({ ...prev, pendingBills: 0 }));
        } catch (billingError) {
          console.warn('Error fetching billing info:', billingError);
        }
      }

    } catch (err) {
      console.error('Error fetching patient dashboard data:', err);
      setError(t('patientDashboard.errorLoading') || 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, t]);

  useEffect(() => {
    fetchPatientDashboardData();
  }, [fetchPatientDashboardData]);

  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(i18n.language, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }, [i18n.language]);

  const formatTime = useCallback((timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? (t('common.time.pm') || 'PM') : (t('common.time.am') || 'AM');
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  }, [t]);

  const getStatusBadge = useCallback((status: string) => {
    const statusConfig = {
      'scheduled': { variant: 'primary' as const, label: t('appointments.scheduled') },
      'confirmed': { variant: 'success' as const, label: t('appointments.confirmed') },
      'completed': { variant: 'success' as const, label: t('appointments.completed') },
      'cancelled': { variant: 'gray' as const, label: t('appointments.cancelled') },
    };

    const config = statusConfig[status as keyof typeof statusConfig] ||
      { variant: 'gray' as const, label: status };

    return (
      <Badge variant={config.variant} size="sm">
        {config.label}
      </Badge>
    );
  }, [t]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'appointment':
        return (
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'treatment':
        return (
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'billing':
        return (
          <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          {/* Loading Skeleton */}
          <div className="animate-pulse space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div className="space-y-2">
                <div className="h-6 sm:h-8 bg-gray-300 rounded w-48 sm:w-64"></div>
                <div className="h-3 sm:h-4 bg-gray-300 rounded w-32 sm:w-48"></div>
              </div>
              <div className="h-10 bg-gray-300 rounded w-full sm:w-40"></div>
            </div>

            <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
                  <div className="h-5 sm:h-6 bg-gray-300 rounded w-20 sm:w-24 mb-2"></div>
                  <div className="h-6 sm:h-8 bg-gray-300 rounded w-12 sm:w-16"></div>
                </div>
              ))}
            </div>

            <div className="grid gap-4 sm:gap-6 lg:gap-8 grid-cols-1 lg:grid-cols-2">
              <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
                <div className="h-5 sm:h-6 bg-gray-300 rounded w-36 sm:w-48 mb-4"></div>
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex space-x-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-300 rounded-lg flex-shrink-0"></div>
                      <div className="flex-1 space-y-2 min-w-0">
                        <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
                <div className="h-5 sm:h-6 bg-gray-300 rounded w-24 sm:w-32 mb-4"></div>
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex space-x-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-300 rounded-full flex-shrink-0"></div>
                      <div className="flex-1 space-y-2 min-w-0">
                        <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 sm:mb-8 gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-1 sm:mb-2 truncate">
              {t('patientDashboard.welcome', { name: user?.firstName || 'Patient' })}
            </h1>
            <p className="text-gray-600 text-sm sm:text-base lg:text-lg">
              {t('patientDashboard.subtitle')}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
            <Link to="/appointments/create" className="w-full sm:w-auto">
              <Button
                variant="primary"
                className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 min-h-[44px]"
                size="lg"
              >
                <svg className="-ml-1 mr-2 h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span className="font-semibold">{t('patientDashboard.bookAppointment')}</span>
              </Button>
            </Link>

            <Link to="/appointments" className="w-full sm:w-auto">
              <Button
                variant="outline"
                className="w-full sm:w-auto border-2 border-indigo-300 text-indigo-700 hover:bg-indigo-50 shadow-md transition-all duration-200 min-h-[44px]"
                size="lg"
              >
                <svg className="-ml-1 mr-2 h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-8 4h8a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2v-8a2 2 0 012-2z" />
                </svg>
                <span className="truncate">{t('patientDashboard.viewAppointments')}</span>
              </Button>
            </Link>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 text-red-700">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-6 sm:mb-8">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg hover:shadow-xl transition-shadow duration-200 border-0">
            <div className="p-4 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-blue-100 truncate">{t('patientDashboard.upcomingAppointments')}</p>
                  <p className="text-xl sm:text-2xl font-bold">{dashboardStats.upcomingAppointments}</p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg hover:shadow-xl transition-shadow duration-200 border-0">
            <div className="p-4 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-green-100 truncate">{t('patientDashboard.recentVisits')}</p>
                  <p className="text-xl sm:text-2xl font-bold">{dashboardStats.recentVisits}</p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg hover:shadow-xl transition-shadow duration-200 border-0">
            <div className="p-4 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-purple-100 truncate">{t('patientDashboard.pendingBills')}</p>
                  <p className="text-xl sm:text-2xl font-bold">{dashboardStats.pendingBills}</p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-lg hover:shadow-xl transition-shadow duration-200 border-0">
            <div className="p-4 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-indigo-100 truncate">{t('patientDashboard.totalTreatments')}</p>
                  <p className="text-xl sm:text-2xl font-bold">{dashboardStats.totalTreatments}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-4 sm:gap-6 lg:gap-8 grid-cols-1 lg:grid-cols-2">
          {/* Upcoming Appointments */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-200 border-0 bg-white/80 backdrop-blur-sm">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4 sm:mb-6 gap-2">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center min-w-0">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                  <span className="truncate">{t('patientDashboard.upcomingAppointments')}</span>
                </h2>
                <Link
                  to="/appointments"
                  className="text-blue-600 hover:text-blue-800 text-xs sm:text-sm font-medium transition-colors duration-200 whitespace-nowrap flex-shrink-0"
                >
                  {t('patientDashboard.viewAll')} →
                </Link>
              </div>

              {upcomingAppointments.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-lg">{t('patientDashboard.noUpcomingAppointments')}</p>
                  <Link to="/appointments/create">
                    <Button variant="primary" className="mt-4" size="sm">
                      {t('patientDashboard.bookAppointment')}
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingAppointments.map((appointment) => (
                    <div key={appointment._id} className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 sm:p-4 border border-blue-100 hover:shadow-md transition-all duration-200">
                      <div className="flex flex-col sm:flex-row sm:items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">{appointment.serviceType}</h3>
                          <p className="text-xs sm:text-sm text-gray-600 mb-2">{formatDate(appointment.date)} at {formatTime(appointment.timeSlot)}</p>
                          {appointment.dentistId && (
                            <p className="text-xs sm:text-sm text-blue-700 font-medium">
                              Dr. {appointment.dentistId.firstName} {appointment.dentistId.lastName}
                              {appointment.dentistId.specialization && (
                                <span className="text-gray-500 font-normal"> - {appointment.dentistId.specialization}</span>
                              )}
                            </p>
                          )}
                          {appointment.clinicId && (
                            <p className="text-xs sm:text-sm text-gray-600 mt-1">📍 {appointment.clinicId.name}</p>
                          )}
                        </div>
                        <div className="flex sm:flex-col items-center sm:items-end gap-2">
                          {getStatusBadge(appointment.status)}
                          <Link to={`/appointments/${appointment._id}`}>
                            <Button variant="outline" size="sm" className="text-xs whitespace-nowrap">
                              {t('patientDashboard.viewDetails')}
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Recent Activities */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-200 border-0 bg-white/80 backdrop-blur-sm">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <svg className="w-6 h-6 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  {t('patientDashboard.recentActivity')}
                </h2>
              </div>

              {recentActivities.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="text-gray-500">{t('patientDashboard.noRecentActivity')}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                      {getActivityIcon(activity.type)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{activity.title}</p>
                        <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                        <div className="flex items-center mt-2 space-x-2">
                          <p className="text-xs text-gray-500">{formatDate(activity.date)}</p>
                          {activity.status && getStatusBadge(activity.status)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mt-6 sm:mt-8 shadow-lg border-0 bg-gradient-to-r from-gray-50 to-blue-50">
          <div className="p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6 flex items-center">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
              </svg>
              <span className="truncate">{t('patientDashboard.quickActions')}</span>
            </h2>

            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              <Link to="/appointments/create" className="group block">
                <div className="bg-white p-3 sm:p-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform group-hover:scale-105 border-2 border-transparent group-hover:border-blue-200 min-h-[80px] sm:min-h-0">
                  <div className="flex items-center">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm sm:text-base font-semibold text-gray-900 truncate">{t('patientDashboard.bookAppointment')}</p>
                      <p className="text-xs sm:text-sm text-gray-600 truncate">{t('patientDashboard.scheduleVisit')}</p>
                    </div>
                  </div>
                </div>
              </Link>

              <Link to="/appointments" className="group block">
                <div className="bg-white p-3 sm:p-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform group-hover:scale-105 border-2 border-transparent group-hover:border-green-200 min-h-[80px] sm:min-h-0">
                  <div className="flex items-center">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm sm:text-base font-semibold text-gray-900 truncate">{t('patientDashboard.myAppointments')}</p>
                      <p className="text-xs sm:text-sm text-gray-600 truncate">{t('patientDashboard.viewHistory')}</p>
                    </div>
                  </div>
                </div>
              </Link>

              <Link to="/profile" className="group block">
                <div className="bg-white p-3 sm:p-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform group-hover:scale-105 border-2 border-transparent group-hover:border-purple-200 min-h-[80px] sm:min-h-0">
                  <div className="flex items-center">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm sm:text-base font-semibold text-gray-900 truncate">{t('patientDashboard.myProfile')}</p>
                      <p className="text-xs sm:text-sm text-gray-600 truncate">{t('patientDashboard.updateInfo')}</p>
                    </div>
                  </div>
                </div>
              </Link>

              <Link to="/billing" className="group block">
                <div className="bg-white p-3 sm:p-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform group-hover:scale-105 border-2 border-transparent group-hover:border-yellow-200 min-h-[80px] sm:min-h-0">
                  <div className="flex items-center">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm sm:text-base font-semibold text-gray-900 truncate">{t('patientDashboard.billing')}</p>
                      <p className="text-xs sm:text-sm text-gray-600 truncate">{t('patientDashboard.viewBills')}</p>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PatientDashboard;