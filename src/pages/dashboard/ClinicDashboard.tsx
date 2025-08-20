import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, Button, Spinner } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';
import { useClinic } from '../../hooks/useClinic';
import { getDashboardStats, getRecentActivities, type DashboardStats, type RecentActivity } from '../../services/dashboardService';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  change?: string;
  isPositive?: boolean;
  linkTo?: string;
  loading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  icon, 
  change, 
  isPositive = true,
  linkTo,
  loading = false
}) => {
  const { t } = useTranslation();
  return (
    <Card className="h-full">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          {loading ? (
            <div className="h-8 flex items-center">
              <Spinner size="sm" />
            </div>
          ) : (
            <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
          )}
          {change && (
            <p className={`mt-1 text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {isPositive ? '↑' : '↓'} {change} {isPositive ? t('dashboard.increase') : t('dashboard.decrease')}
            </p>
          )}
        </div>
        <div className="p-3 rounded-full bg-blue-50 text-blue-600">
          {icon}
        </div>
      </div>
      {linkTo && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <Link 
            to={linkTo} 
            className="text-sm font-medium text-blue-600 hover:text-blue-500"
          >
            {t('dashboard.viewDetails')} <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      )}
    </Card>
  );
};

const ClinicDashboard: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { selectedClinic } = useClinic();
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!selectedClinic?.id && user?.role !== 'admin' && user?.role !== 'super_admin') {
        setError(t('errors.selectClinicFirst'));
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        const clinicId = selectedClinic?.id;
        const [statsResponse, activitiesResponse] = await Promise.all([
          getDashboardStats(clinicId),
          getRecentActivities(10, clinicId)
        ]);
        
        if (statsResponse.success && statsResponse.data) {
          setDashboardStats(statsResponse.data);
        } else {
          setError(statsResponse.message || 'Failed to fetch dashboard statistics');
        }
        
        if (activitiesResponse.success && activitiesResponse.data) {
          setRecentActivities(activitiesResponse.data);
        } else {
          console.warn('Failed to fetch recent activities');
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(t('errors.failedToLoadData'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [selectedClinic, user?.role]);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  const formatTimeAgo = (timestamp: string): string => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));

    if (diffInMinutes < 60) {
      return t(diffInMinutes === 1 ? 'dashboard.minuteAgo' : 'dashboard.minutesAgo', { count: diffInMinutes });
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return t(hours === 1 ? 'dashboard.hourAgo' : 'dashboard.hoursAgo', { count: hours });
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return t(days === 1 ? 'dashboard.dayAgo' : 'dashboard.daysAgo', { count: days });
    }
  };

  if (!selectedClinic && user?.role !== 'admin' && user?.role !== 'super_admin') {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg text-gray-600">{t('dashboard.selectClinicMessage')}</p>
      </div>
    );
  }

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{t('navigation.dashboard')}</h1>
          <p className="mt-1 text-sm text-gray-600">
            {selectedClinic
                ? t('dashboard.welcome_clinic', { name: user?.firstName || 'User', clinicName: selectedClinic.name })
                : (user?.role === 'admin' || user?.role === 'super_admin')
                  ? t('dashboard.welcome_admin', { name: user?.firstName || 'User' })
                  : t('dashboard.welcome_select_clinic', { name: user?.firstName || 'User' })
            }
          </p>
        </div>
        {
          <div className="mt-4 md:mt-0 flex space-x-3">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => console.log('Export clicked')}
            >
              <svg className="-ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              {t('dashboard.export')}
            </Button>
            <Link to="/appointments/create">
              <Button variant="primary" size="sm">
                <svg className="-ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                {t('appointments.newAppointment')}
              </Button>
            </Link>
          </div>
        }
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {user?.role === 'patient' ? (
        // Patient Dashboard Stats
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title={t('dashboard.Appointments')}
            value={t('dashboard.viewAll')}
            icon={
              <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
            linkTo="/appointments"
            loading={isLoading}
          />
          <StatCard
            title={t('dashboard.Prescriptions')}
            value={t('dashboard.viewAll')}
            icon={
              <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
            linkTo="/prescriptions"
            loading={isLoading}
          />
          <StatCard
            title={t('dashboard.Billing')}
            value={t('dashboard.viewAll')}
            icon={
              <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            linkTo="/billing"
            loading={isLoading}
          />
          <StatCard 
            title={t('dashboard.Reports')}
            value={t('dashboard.viewAll')}
            icon={
              <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
            linkTo="/reports"
            loading={isLoading}
          />
        </div>
      ) : (
        // Staff/Admin Dashboard Stats
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title={t('dashboard.todayAppointments')}
            value={dashboardStats?.appointments.today || 0}
            icon={
              <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
            linkTo="/appointments"
            loading={isLoading}
          />
          <StatCard
            title={t('dashboard.totalPatients')}
            value={dashboardStats?.patients.total || 0}
            icon={
              <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            }
            linkTo="/patients"
            loading={isLoading}
          />
          <StatCard
            title={t('dashboard.monthlyRevenue')}
            value={dashboardStats ? formatCurrency(dashboardStats.revenue.thisMonth) : '$0'}
            icon={
              <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            linkTo="/reports/financial"
            loading={isLoading}
          />
          <StatCard
            title={t('dashboard.upcomingAppointments')}
            value={dashboardStats?.appointments.upcoming || 0}
            icon={
              <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            linkTo="/appointments"
            loading={isLoading}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title={t('dashboard.recentActivity')}>
          <div className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center py-6">
                <Spinner />
              </div>
            ) : recentActivities.length > 0 ? (
              recentActivities.slice(0, 5).map((activity) => {
                const getActivityIcon = (type: string, status?: string) => {
                  switch (type) {
                    case 'patient':
                      return (
                        <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs">
                          <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                      );
                    case 'appointment':
                      const bgColor = status === 'completed' ? 'bg-green-500' : status === 'cancelled' ? 'bg-red-500' : 'bg-yellow-500';
                      return (
                        <div className={`h-8 w-8 rounded-full ${bgColor} flex items-center justify-center text-white text-xs`}>
                          <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      );
                    default:
                      return (
                        <div className="h-8 w-8 rounded-full bg-gray-500 flex items-center justify-center text-white text-xs">
                          <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      );
                  }
                };

                return (
                  <div key={activity.id} className="flex items-start p-3 hover:bg-gray-50 rounded-lg transition-colors duration-150">
                    <div className="flex-shrink-0">
                      {getActivityIcon(activity.type, activity.status)}
                    </div>
                    <div className="ml-4 flex-1">
                      <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                      <p className="text-sm text-gray-600">{activity.description}</p>
                      <p className="text-xs text-gray-500 mt-1">{formatTimeAgo(activity.timestamp)}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-6">
                <p className="text-sm text-gray-500">{t('dashboard.noRecentActivity')}</p>
              </div>
            )}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <Link 
              to="/activity"
              className="text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              {t('dashboard.viewAllActivity')} →
            </Link>
          </div>
        </Card>

        <Card title={t('dashboard.upcomingAppointments')}>
          <div className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center py-6">
                <Spinner />
              </div>
            ) : dashboardStats?.appointments?.upcoming && dashboardStats.appointments.upcoming > 0 ? (
              (dashboardStats.appointments?.upcoming ? Array(dashboardStats.appointments.upcoming).fill({}).slice(0, 3) : []).map((_, index) => {
                const appointmentDate = new Date(); // Temporary date since appointment object is not defined
                const isToday = appointmentDate.toDateString() === new Date().toDateString();
                const isTomorrow = appointmentDate.toDateString() === new Date(Date.now() + 24 * 60 * 60 * 1000).toDateString();
                
                const formatDate = () => {
                  if (isToday) return t('dashboard.today');
                  if (isTomorrow) return t('dashboard.tomorrow');
                  return appointmentDate.toLocaleDateString(navigator.language, { month: 'short', day: 'numeric' });
                };

                const formatTime = () => {
                  return appointmentDate.toLocaleTimeString('en-US', { 
                    hour: 'numeric', 
                    minute: '2-digit',
                    hour12: true 
                  });
                };

                return (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-150">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium text-sm">
                        {getInitials('John Doe')} {/* Placeholder name since appointment object is undefined */}
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">John Doe</p>
                        <p className="text-sm text-gray-600">{t('appointments.appointment')}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{formatTime()}</p>
                      <p className="text-sm text-gray-600">{formatDate()}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-6">
                <p className="text-sm text-gray-500">{t('dashboard.noUpcomingAppointments')}</p>
              </div>
            )}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <Link 
              to="/appointments" 
              className="text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              {t('dashboard.viewAllAppointments')} →
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ClinicDashboard;