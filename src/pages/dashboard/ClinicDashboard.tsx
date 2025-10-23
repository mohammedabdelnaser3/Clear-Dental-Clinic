import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, Button, Badge } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';
import { useClinic } from '../../hooks/useClinic';
import { getDashboardStats, getRecentActivities, type DashboardStats, type RecentActivity } from '../../services/dashboardService';
import {
  Calendar,
  Users,
  DollarSign,
  FileText,
  TrendingUp,
  TrendingDown,
  Clock,
  Activity,
  AlertCircle,
  CheckCircle,
  Plus,
  RefreshCw,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  UserCheck,
  CalendarCheck,
  CreditCard,
  ChevronRight,
  Zap,
  Building2,
  Stethoscope
} from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  change?: string;
  isPositive?: boolean;
  linkTo?: string;
  loading?: boolean;
  gradient?: string;
  description?: string;
  trend?: number;
}

interface QuickActionProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  linkTo: string;
  color: string;
  badge?: string;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  change: number;
  icon: React.ReactNode;
  color: string;
  loading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  icon, 
  change, 
  isPositive = true,
  linkTo,
  loading = false,
  gradient = 'from-blue-500 to-purple-600',
  description,
  trend
}) => {
  const { t } = useTranslation();
  return (
    <Card className="h-full hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-white to-gray-50/50 backdrop-blur-sm">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-xl bg-gradient-to-r ${gradient} shadow-lg`}>
            <div className="text-white">{icon}</div>
          </div>
          {trend !== undefined && (
            <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
              trend > 0 ? 'bg-green-100 text-green-700' : trend < 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
            }`}>
              {trend > 0 ? <TrendingUp className="w-3 h-3" /> : trend < 0 ? <TrendingDown className="w-3 h-3" /> : <Activity className="w-3 h-3" />}
              <span>{Math.abs(trend)}%</span>
            </div>
          )}
        </div>
        
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          {loading ? (
            <div className="h-8 flex items-center">
              <div className="animate-pulse bg-gray-200 h-6 w-20 rounded"></div>
            </div>
          ) : (
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          )}
          {description && (
            <p className="text-xs text-gray-500">{description}</p>
          )}
          {change && (
            <p className={`text-sm font-medium flex items-center space-x-1 ${
              isPositive ? 'text-green-600' : 'text-red-600'
            }`}>
              {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
              <span>{change}</span>
            </p>
          )}
        </div>
        
        {linkTo && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <Link 
              to={linkTo} 
              className="inline-flex items-center space-x-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors group"
            >
              <span>{t('dashboard.viewDetails')}</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        )}
      </div>
    </Card>
  );
};

const MetricCard: React.FC<MetricCardProps & { fromLastMonthText?: string }> = ({ title, value, change, icon, color, loading, fromLastMonthText }) => {
  return (
    <div className={`p-4 rounded-xl bg-gradient-to-r ${color} text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-white/80">{title}</p>
          {loading ? (
            <div className="animate-pulse bg-white/20 h-6 w-16 rounded mt-1"></div>
          ) : (
            <p className="text-2xl font-bold mt-1">{value}</p>
          )}
        </div>
        <div className="p-2 bg-white/20 rounded-lg">
          {icon}
        </div>
      </div>
      {change !== 0 && (
        <div className="flex items-center mt-2 space-x-1">
          {change > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          <span className="text-sm font-medium">
            {change > 0 ? '+' : ''}{change}% {fromLastMonthText || 'from last month'}
          </span>
        </div>
      )}
    </div>
  );
};

const QuickActionCard: React.FC<QuickActionProps> = ({ title, description, icon, linkTo, color, badge }) => {
  return (
    <Link to={linkTo} className="block group">
      <Card className="h-full p-6 hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-white to-gray-50/50 group-hover:from-gray-50 group-hover:to-white">
        <div className="flex items-center space-x-4">
          <div className={`p-3 rounded-xl bg-gradient-to-r ${color} shadow-lg group-hover:shadow-xl transition-shadow`}>
            <div className="text-white">{icon}</div>
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{title}</h3>
              {badge && (
                <Badge className="bg-blue-100 text-blue-700 text-xs">{badge}</Badge>
              )}
            </div>
            <p className="text-sm text-gray-600 mt-1">{description}</p>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
        </div>
      </Card>
    </Link>
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
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      // For doctors/dentists, allow dashboard access even without selected clinic
      // They can view their personal statistics across all assigned clinics
      if (!selectedClinic?.id && user?.role !== 'admin' && user?.role !== 'super_admin' && user?.role !== 'dentist') {
        setError(t('errors.selectClinicFirst'));
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        // For doctors, use their assigned clinic or selected clinic
        const clinicId = user?.role === 'dentist' ? 
          (selectedClinic?.id || user?.preferredClinicId || user?.assignedClinics?.[0]) : 
          selectedClinic?.id;
        
        const [statsResponse, activitiesResponse] = await Promise.all([
          getDashboardStats(clinicId),
          getRecentActivities(10, clinicId)
        ]);
        
        if (statsResponse.success && statsResponse.data) {
          setDashboardStats(statsResponse.data);
        } else {
          // For doctors, show a more helpful error message
          if (user?.role === 'dentist') {
            setError(t('dashboard.errors.noAssignedClinic'));
          } else {
            setError(statsResponse.message || t('dashboard.errors.failedToFetchStats'));
          }
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
  }, [selectedClinic, user?.role, user?.preferredClinicId, user?.assignedClinics]);

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

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // For doctors, use their assigned clinic or selected clinic
      const clinicId = user?.role === 'dentist' ? 
        (selectedClinic?.id || user?.preferredClinicId || user?.assignedClinics?.[0]) : 
        selectedClinic?.id;
        
      const [statsResponse, activitiesResponse] = await Promise.all([
        getDashboardStats(clinicId),
        getRecentActivities(10, clinicId)
      ]);
      
      if (statsResponse.success && statsResponse.data) {
        setDashboardStats(statsResponse.data);
        setError(null);
      }
      
      if (activitiesResponse.success && activitiesResponse.data) {
        setRecentActivities(activitiesResponse.data);
      }
    } catch (err) {
      console.error('Error refreshing dashboard data:', err);
      setError(t('dashboard.errors.failedToRefresh'));
    } finally {
      setRefreshing(false);
    }
  }, [selectedClinic, user?.role, user?.preferredClinicId, user?.assignedClinics]);

  const quickActions = useMemo(() => {
    // Doctor-specific quick actions
    if (user?.role === 'dentist') {
      return [
        {
          title: t('appointments.newAppointment'),
          description: t('dashboard.quickActions.scheduleAppointmentDesc'),
          icon: <Plus className="w-5 h-5" />,
          linkTo: '/appointments/create',
          color: 'from-blue-500 to-blue-600',
          badge: 'Quick'
        },
        {
          title: t('dashboard.quickActions.myAppointments'),
          description: t('dashboard.quickActions.viewAppointmentsDesc'),
          icon: <Calendar className="w-5 h-5" />,
          linkTo: '/appointments',
          color: 'from-indigo-500 to-indigo-600'
        },
        {
          title: t('prescriptions.create'),
          description: t('dashboard.quickActions.createPrescriptionDesc'),
          icon: <FileText className="w-5 h-5" />,
          linkTo: '/prescriptions/create',
          color: 'from-purple-500 to-purple-600'
        },
        {
          title: t('dashboard.quickActions.patientRecords'),
          description: t('dashboard.quickActions.accessRecordsDesc'),
          icon: <UserCheck className="w-5 h-5" />,
          linkTo: '/patients',
          color: 'from-green-500 to-green-600'
        }
      ];
    }
    
    // Default actions for admin/staff
    return [
      {
        title: t('appointments.newAppointment'),
        description: 'Schedule a new patient appointment',
        icon: <Plus className="w-5 h-5" />,
        linkTo: '/appointments/create',
        color: 'from-blue-500 to-blue-600',
        badge: 'Quick'
      },
      {
        title: t('patients.addPatient'),
        description: t('dashboard.quickActions.registerPatientDesc'),
        icon: <UserCheck className="w-5 h-5" />,
        linkTo: '/patients/create',
        color: 'from-green-500 to-green-600'
      },
      {
        title: t('prescriptions.create'),
        description: 'Create new prescription',
        icon: <FileText className="w-5 h-5" />,
        linkTo: '/prescriptions/create',
        color: 'from-purple-500 to-purple-600'
      },
      {
        title: t('reports.generate'),
        description: 'Generate clinic reports',
        icon: <BarChart3 className="w-5 h-5" />,
        linkTo: '/reports',
        color: 'from-orange-500 to-orange-600'
      }
    ];
  }, [t, user?.role]);

  // Only show clinic selection for non-doctor roles
  if (!selectedClinic && user?.role !== 'admin' && user?.role !== 'super_admin' && user?.role !== 'dentist') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
            <Stethoscope className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Select a Clinic</h2>
          <p className="text-gray-600 mb-6">{t('dashboard.selectClinicMessage')}</p>
          <Link to="/clinics">
            <Button variant="primary" className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
              <Building2 className="w-4 h-4 mr-2" />
              Browse Clinics
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 shadow-xl border-b border-blue-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 lg:gap-0">
            {/* Left Section */}
            <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
              <div className="relative flex-shrink-0">
                <div className="p-2 sm:p-3 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 rounded-xl shadow-lg">
                  <Stethoscope className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white truncate">
                  {user?.role === 'dentist' ? 'Doctor Dashboard' : t('navigation.dashboard')}
                </h1>
                <p className="text-blue-100/80 text-xs sm:text-sm lg:text-base truncate">
                  {user?.role === 'dentist'
                    ? `Welcome back, Dr. ${user?.firstName || 'Doctor'}${selectedClinic ? ` - ${selectedClinic.name}` : ''}`
                    : selectedClinic
                      ? t('dashboard.welcome_clinic', { name: user?.firstName || 'User', clinicName: selectedClinic.name })
                      : (user?.role === 'admin' || user?.role === 'super_admin')
                        ? t('dashboard.welcome_admin', { name: user?.firstName || 'User' })
                        : t('dashboard.welcome_select_clinic', { name: user?.firstName || 'User' })
                  }
                </p>
                <div className="hidden sm:flex items-center space-x-2 sm:space-x-4 mt-2 text-xs text-blue-200/70">
                  <span className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span>System Online</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>Last updated: {new Date().toLocaleTimeString()}</span>
                  </span>
                  {user?.role === 'dentist' && user?.specialization && (
                    <span className="flex items-center space-x-1">
                      <UserCheck className="w-3 h-3" />
                      <span>{user.specialization}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Right Section */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <Button 
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isLoading || refreshing}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30 min-h-[44px] sm:min-h-0"
              >
                <RefreshCw className={`w-4 h-4 mr-2 flex-shrink-0 ${isLoading || refreshing ? 'animate-spin' : ''}`} />
                <span className="truncate">{isLoading || refreshing ? 'Refreshing...' : t('dashboard.refresh')}</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => console.log('Export clicked')}
                className="hidden sm:flex bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30"
              >
                <Download className="w-4 h-4 mr-2" />
                {t('dashboard.export')}
              </Button>
              <Link to="/appointments/create" className="w-full sm:w-auto">
                <Button 
                  variant="primary" 
                  size="sm"
                  className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 min-h-[44px] sm:min-h-0"
                >
                  <Plus className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="truncate">{t('appointments.newAppointment')}</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl shadow-sm">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{error}</p>
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
              icon={<Calendar className="w-6 h-6" />}
              linkTo="/appointments"
              loading={isLoading}
              gradient="from-blue-500 to-blue-600"
            />
            <StatCard
              title={t('dashboard.Prescriptions')}
              value={t('dashboard.viewAll')}
              icon={<FileText className="w-6 h-6" />}
              linkTo="/prescriptions"
              loading={isLoading}
              gradient="from-green-500 to-green-600"
            />
            <StatCard
              title={t('dashboard.Billing')}
              value={t('dashboard.viewAll')}
              icon={<CreditCard className="w-6 h-6" />}
              linkTo="/billing"
              loading={isLoading}
              gradient="from-purple-500 to-purple-600"
            />
            <StatCard 
              title={t('dashboard.Reports')}
              value={t('dashboard.viewAll')}
              icon={<BarChart3 className="w-6 h-6" />}
              linkTo="/reports"
              loading={isLoading}
              gradient="from-orange-500 to-orange-600"
            />
          </div>
        ) : user?.role === 'dentist' ? (
          // Doctor/Dentist Dashboard Stats
          <>
            {/* Doctor Key Metrics Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <MetricCard
                title="Today's Appointments"
                value={dashboardStats?.appointments.today || 0}
                change={12}
                icon={<Calendar className="w-6 h-6" />}
                color="from-blue-500 to-blue-600"
                loading={isLoading}
                fromLastMonthText={t('dashboard.fromLastMonth')}
              />
              <MetricCard
                title="My Patients"
                value={dashboardStats?.patients.total || 0}
                change={8}
                icon={<Users className="w-6 h-6" />}
                color="from-green-500 to-green-600"
                loading={isLoading}
                fromLastMonthText={t('dashboard.fromLastMonth')}
              />
              <MetricCard
                title="Completed Today"
                value={dashboardStats?.appointments.completed || 0}
                change={5}
                icon={<CheckCircle className="w-6 h-6" />}
                color="from-purple-500 to-purple-600"
                loading={isLoading}
                fromLastMonthText={t('dashboard.fromLastMonth')}
              />
              <MetricCard
                title="Upcoming"
                value={dashboardStats?.appointments.upcoming || 0}
                change={-2}
                icon={<Clock className="w-6 h-6" />}
                color="from-orange-500 to-orange-600"
                loading={isLoading}
                fromLastMonthText={t('dashboard.fromLastMonth')}
              />
            </div>

            {/* Doctor Detailed Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                title="Today's Schedule"
                value={dashboardStats?.appointments.today || 0}
                icon={<Calendar className="w-6 h-6" />}
                linkTo="/appointments"
                loading={isLoading}
                gradient="from-blue-500 to-blue-600"
                description="Appointments scheduled for today"
                trend={12}
              />
              <StatCard
                title="Active Patients"
                value={dashboardStats?.patients.active || 0}
                icon={<Users className="w-6 h-6" />}
                linkTo="/patients"
                loading={isLoading}
                gradient="from-green-500 to-green-600"
                description="Patients under your care"
                trend={8}
              />
              <StatCard
                title="Prescriptions"
                value={dashboardStats?.activities?.recentAppointments?.length || 0}
                icon={<FileText className="w-6 h-6" />}
                linkTo="/prescriptions"
                loading={isLoading}
                gradient="from-purple-500 to-purple-600"
                description="Recent prescriptions"
                trend={15}
              />
              <StatCard
                title="Treatment Records"
                value={dashboardStats?.appointments.completed || 0}
                icon={<Activity className="w-6 h-6" />}
                linkTo="/treatments"
                loading={isLoading}
                gradient="from-indigo-500 to-indigo-600"
                description="Completed treatments"
                trend={10}
              />
            </div>
          </>
        ) : (
          // Staff/Admin Dashboard Stats
          <>
            {/* Key Metrics Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <MetricCard
                title={t('dashboard.todayAppointments')}
                value={dashboardStats?.appointments.today || 0}
                change={12}
                icon={<Calendar className="w-6 h-6" />}
                color="from-blue-500 to-blue-600"
                loading={isLoading}
                fromLastMonthText={t('dashboard.fromLastMonth')}
              />
              <MetricCard
                title={t('dashboard.totalPatients')}
                value={dashboardStats?.patients.total || 0}
                change={8}
                icon={<Users className="w-6 h-6" />}
                color="from-green-500 to-green-600"
                loading={isLoading}
                fromLastMonthText={t('dashboard.fromLastMonth')}
              />
              <MetricCard
                title={t('dashboard.monthlyRevenue')}
                value={dashboardStats ? formatCurrency(dashboardStats.revenue.thisMonth) : '$0'}
                change={15}
                icon={<DollarSign className="w-6 h-6" />}
                color="from-purple-500 to-purple-600"
                loading={isLoading}
                fromLastMonthText={t('dashboard.fromLastMonth')}
              />
              <MetricCard
                title={t('dashboard.upcomingAppointments')}
                value={dashboardStats?.appointments.upcoming || 0}
                change={-3}
                icon={<Clock className="w-6 h-6" />}
                color="from-orange-500 to-orange-600"
                loading={isLoading}
                fromLastMonthText={t('dashboard.fromLastMonth')}
              />
            </div>

            {/* Detailed Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                title={t('dashboard.todayAppointments')}
                value={dashboardStats?.appointments.today || 0}
                icon={<Calendar className="w-6 h-6" />}
                linkTo="/appointments"
                loading={isLoading}
                gradient="from-blue-500 to-blue-600"
                description="Scheduled for today"
                trend={12}
              />
              <StatCard
                title={t('dashboard.totalPatients')}
                value={dashboardStats?.patients.total || 0}
                icon={<Users className="w-6 h-6" />}
                linkTo="/patients"
                loading={isLoading}
                gradient="from-green-500 to-green-600"
                description="Registered patients"
                trend={8}
              />
              <StatCard
                title={t('dashboard.monthlyRevenue')}
                value={dashboardStats ? formatCurrency(dashboardStats.revenue.thisMonth) : '$0'}
                icon={<DollarSign className="w-6 h-6" />}
                linkTo="/reports/financial"
                loading={isLoading}
                gradient="from-purple-500 to-purple-600"
                description="This month's earnings"
                trend={15}
              />
              <StatCard
                title={t('dashboard.upcomingAppointments')}
                value={dashboardStats?.appointments.upcoming || 0}
                icon={<Clock className="w-6 h-6" />}
                linkTo="/appointments"
                loading={isLoading}
                gradient="from-orange-500 to-orange-600"
                description="Next 7 days"
                trend={-3}
              />
            </div>
          </>
        )}

        {/* Quick Actions Section */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 flex-shrink-0" />
              <span className="truncate">{user?.role === 'dentist' ? 'Doctor Quick Actions' : 'Quick Actions'}</span>
            </h2>
            {user?.role === 'dentist' && (
              <div className="text-xs sm:text-sm text-gray-600">
                Access your most used tools quickly
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {quickActions.map((action, index) => (
              <QuickActionCard
                key={index}
                title={action.title}
                description={action.description}
                icon={action.icon}
                linkTo={action.linkTo}
                color={action.color}
                badge={action.badge}
              />
            ))}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <Card className="p-6 border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-600" />
                  {user?.role === 'dentist' ? 'Recent Patient Activities' : t('dashboard.recentActivity')}
                </h2>
                <Link 
                  to={user?.role === 'dentist' ? '/appointments' : '/activity'}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1 group"
                >
                  View All
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
              <div className="space-y-4">
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : recentActivities.length > 0 ? (
                  recentActivities.slice(0, 5).map((activity) => {
                    const getActivityIcon = (type: string, status?: string) => {
                      switch (type) {
                        case 'patient':
                          return (
                            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white shadow-lg">
                              <Users className="h-5 w-5" />
                            </div>
                          );
                        case 'appointment':
                          const bgColor = status === 'completed' ? 'from-green-500 to-green-600' : status === 'cancelled' ? 'from-red-500 to-red-600' : 'from-yellow-500 to-yellow-600';
                          return (
                            <div className={`h-10 w-10 rounded-full bg-gradient-to-r ${bgColor} flex items-center justify-center text-white shadow-lg`}>
                              <Calendar className="h-5 w-5" />
                            </div>
                          );
                        default:
                          return (
                            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-gray-500 to-gray-600 flex items-center justify-center text-white shadow-lg">
                              <Activity className="h-5 w-5" />
                            </div>
                          );
                      }
                    };

                    return (
                      <div key={activity.id} className="flex items-start p-4 hover:bg-blue-50/50 rounded-xl transition-all duration-200 group">
                        <div className="flex-shrink-0">
                          {getActivityIcon(activity.type, activity.status)}
                        </div>
                        <div className="ml-4 flex-1">
                          <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{activity.title}</p>
                          <p className="text-sm text-gray-600">{activity.description}</p>
                          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTimeAgo(activity.timestamp)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8">
                    <Activity className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">{t('dashboard.noRecentActivity')}</p>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Upcoming Appointments */}
          <div>
            <Card className="p-6 border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <CalendarCheck className="w-5 h-5 text-blue-600" />
                  {user?.role === 'dentist' ? 'My Upcoming Appointments' : t('dashboard.upcomingAppointments')}
                </h2>
                <Link 
                  to="/appointments" 
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1 group"
                >
                  {user?.role === 'dentist' ? 'View Schedule' : 'View All'}
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
              <div className="space-y-4">
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : dashboardStats?.activities?.upcomingAppointments && dashboardStats.activities.upcomingAppointments.length > 0 ? (
                  dashboardStats.activities.upcomingAppointments.slice(0, 5).map((appointment: any) => {
                    const appointmentDate = new Date(appointment.startTime);
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
                      <div key={appointment._id} className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl hover:from-blue-100 hover:to-purple-100 transition-all duration-200 group">
                        <div className="flex items-center">
                          <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                            {getInitials(appointment.patient?.firstName ? `${appointment.patient.firstName} ${appointment.patient.lastName}` : 'Patient')}
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                              {appointment.patient?.firstName ? `${appointment.patient.firstName} ${appointment.patient.lastName}` : 'Patient'}
                            </p>
                            <p className="text-sm text-gray-600">{appointment.treatmentType || t('appointments.appointment')}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-900">{formatTime()}</p>
                          <p className="text-sm text-gray-600">{formatDate()}</p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8">
                    <CalendarCheck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">
                      {user?.role === 'dentist' 
                        ? 'No upcoming appointments scheduled' 
                        : t('dashboard.noUpcomingAppointments')
                      }
                    </p>
                    {user?.role === 'dentist' && (
                      <Link to="/appointments/create">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-4 border-blue-200 text-blue-600 hover:bg-blue-50"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Schedule Appointment
                        </Button>
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClinicDashboard;