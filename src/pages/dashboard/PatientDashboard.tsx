import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, Button, Spinner } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';
import { getRecentActivities, type RecentActivity } from '../../services/dashboardService';

const PatientDashboard: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const [activitiesResponse] = await Promise.all([
          getRecentActivities(10) // Patient's own activities
        ]);
        
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
  }, []);

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

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{t('navigation.dashboard')}</h1>
          <p className="mt-1 text-sm text-gray-600">
            {t('dashboard.welcome_user', { name: user?.firstName || 'User' })}
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-3">
            <Link to="/appointments/create">
              <Button variant="primary" size="sm">
                <svg className="-ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                {t('dashboard.bookAppointment')}
              </Button>
            </Link>
          </div>
      </div>

      {isLoading && <Spinner />}
      {error && <p className="text-red-500">{error}</p>}

      {!isLoading && !error && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Patient-specific cards can be added here */}
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900">{t('dashboard.recentActivity')}</h2>
        <Card className="mt-4">
          <ul className="divide-y divide-gray-200">
            {recentActivities.map((activity) => (
              <li key={activity.id} className="py-4 flex">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                  <span className="font-semibold text-blue-600">{getInitials(activity.title || '')}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-800">{activity.description}</p>
                  <p className="text-sm text-gray-500">{formatTimeAgo(activity.timestamp)}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
};

export default PatientDashboard;