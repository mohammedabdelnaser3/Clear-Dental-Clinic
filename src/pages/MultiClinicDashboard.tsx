import React, { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  Users,
  Calendar,
  DollarSign,
  Clock,
  Filter,
  RefreshCw,
  Eye,
  ChevronDown,
  AlertCircle,
  XCircle,
  Loader2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { getMultiClinicDashboard, getClinicPerformanceMetrics, type MultiClinicDashboardData, type ClinicPerformanceMetrics } from '../services/adminService';

// Using types from adminService

const MultiClinicDashboard: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [selectedClinics, setSelectedClinics] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'overview' | 'performance' | 'schedules'>('overview');
  const [showFilters, setShowFilters] = useState(false);

  // Check if user is admin
  const isAdmin = useMemo(() => {
    return user?.role === 'admin' || user?.role === 'super_admin';
  }, [user]);

  // Fetch multi-clinic dashboard data
  const {
    data: dashboardData,
    isLoading: isDashboardLoading,
    error: dashboardError,
    refetch: refetchDashboard
  } = useQuery<MultiClinicDashboardData>({
    queryKey: ['multiClinicDashboard', selectedPeriod, selectedClinics],
    queryFn: () => getMultiClinicDashboard({
      period: selectedPeriod,
      clinicIds: selectedClinics.length > 0 ? selectedClinics : undefined
    }),
    enabled: isAdmin
  });

  // Fetch performance metrics
  const {
    data: performanceData,
    isLoading: performanceLoading,
    error: performanceError
  } = useQuery<ClinicPerformanceMetrics[]>({
    queryKey: ['clinicPerformance', selectedPeriod],
    queryFn: () => getClinicPerformanceMetrics({ period: selectedPeriod }),
    enabled: isAdmin && viewMode === 'performance'
  });

  const performanceRows: ClinicPerformanceMetrics[] = useMemo(() => {
    const d: any = performanceData;
    if (Array.isArray(performanceData)) return performanceData;
    if (d?.clinics && Array.isArray(d.clinics)) return d.clinics;
    if (d?.metrics && Array.isArray(d.metrics)) return d.metrics;
    return [];
  }, [performanceData]);

  // Fetch available clinics for filtering
  const { data: availableClinics } = useQuery({
    queryKey: ['clinics'],
    queryFn: () => getMultiClinicDashboard({ period: '30d' }).then(data => 
      data.clinics.map(clinic => ({
        clinicId: clinic.clinic.id,
        clinicName: clinic.clinic.name
      }))
    ),
    enabled: isAdmin
  });

  const handleRefresh = useCallback(() => {
    refetchDashboard();
    queryClient.invalidateQueries({ queryKey: ['clinicPerformance'] });
    toast.success('Dashboard refreshed successfully');
  }, [refetchDashboard, queryClient]);

  const handlePeriodChange = useCallback((period: '7d' | '30d' | '90d' | '1y') => {
    setSelectedPeriod(period);
  }, []);

  const handleClinicToggle = useCallback((clinicId: string) => {
    setSelectedClinics(prev => 
      prev.includes(clinicId)
        ? prev.filter(id => id !== clinicId)
        : [...prev, clinicId]
    );
  }, []);

  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }, []);

  const formatAddress = useCallback((address: unknown) => {
    if (!address) return '';
    if (typeof address === 'string') return address;
    const addrObj = address as { street?: string; city?: string; state?: string; zipCode?: string };
    return [addrObj.street, addrObj.city, addrObj.state, addrObj.zipCode].filter(Boolean).join(', ');
  }, []);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'completed':
      case 'paid':
        return 'text-green-600 bg-green-100';
      case 'cancelled':
      case 'overdue':
        return 'text-red-600 bg-red-100';
      case 'scheduled':
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  }, []);

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('errors.accessDenied.title')}</h2>
          <p className="text-gray-600">{t('errors.accessDenied.message')}</p>
        </div>
      </div>
    );
  }

  if (isDashboardLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 text-blue-600 animate-spin mb-4" />
          <p className="text-gray-600">{t('loading.message')}</p>
        </div>
      </div>
    );
  }

  if (dashboardError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('errors.loading.title')}</h2>
          <p className="text-gray-600 mb-4">{t('errors.loading.message')}</p>
          <button
            onClick={handleRefresh}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t('errors.loading.retryButton')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t('header.title')}</h1>
              <p className="text-gray-600 mt-1">
                {t('header.subtitle')}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {/* View Mode Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('overview')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'overview'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {t('viewModes.overview')}
                </button>
                <button
                  onClick={() => setViewMode('performance')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'performance'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {t('viewModes.performance')}
                </button>
                <button
                  onClick={() => setViewMode('schedules')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'schedules'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {t('viewModes.schedules')}
                </button>
              </div>

              {/* Period Selector */}
              <select
                value={selectedPeriod}
                onChange={(e) => handlePeriodChange(e.target.value as '7d' | '30d' | '90d' | '1y')}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="7d">{t('filters.periods.last7Days')}</option>
                <option value="30d">{t('filters.periods.last30Days')}</option>
                <option value="90d">{t('filters.periods.last90Days')}</option>
                <option value="1y">{t('filters.periods.lastYear')}</option>
              </select>

              {/* Filters */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg transition-colors"
              >
                <Filter className="h-4 w-4" />
                <span className="text-sm">{t('filters.title')}</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${
                  showFilters ? 'rotate-180' : ''
                }`} />
              </button>

              {/* Refresh */}
              <button
                onClick={handleRefresh}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                <span className="text-sm">{t('filters.refresh')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white border-b shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('filters.selectClinics')}
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {availableClinics?.map((clinic: { clinicId: string; clinicName: string }) => (
                    <label key={clinic.clinicId} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedClinics.includes(clinic.clinicId)}
                        onChange={() => handleClinicToggle(clinic.clinicId)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">{clinic.clinicName}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {viewMode === 'overview' && dashboardData && (
          <>
            {/* Overall Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Users className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{t('overview.stats.totalPatients')}</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {dashboardData?.overallStats?.totalPatients?.toLocaleString() || 0}
                    </p>
                    <p className="text-sm text-green-600">
                      +{dashboardData?.overallStats?.newPatients || 0} {t('overview.stats.new')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Calendar className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{t('overview.stats.appointments')}</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {dashboardData?.overallStats?.totalAppointments?.toLocaleString() || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <DollarSign className="h-8 w-8 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{t('overview.stats.totalRevenue')}</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(dashboardData?.overallStats?.totalRevenue || 0)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Clock className="h-8 w-8 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{t('overview.stats.staffSchedules')}</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {dashboardData?.overallStats?.totalSchedules?.toLocaleString() || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Building2 className="h-8 w-8 text-indigo-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{t('overview.stats.activeClinics')}</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {dashboardData?.clinics?.filter(c => c.clinic?.isActive)?.length || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Clinic Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {dashboardData.clinics.map((clinicData) => (
                <div key={clinicData.clinic.id} className="bg-white rounded-lg shadow-sm border">
                  {/* Clinic Header */}
                  <div className="p-6 border-b">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {clinicData.clinic.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {formatAddress(clinicData.clinic.address)}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          clinicData.clinic.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {clinicData.clinic.isActive ? t('overview.clinicCard.active') : t('overview.clinicCard.inactive')}
                        </span>
                        <button className="text-gray-400 hover:text-gray-600">
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Clinic Metrics */}
                  <div className="p-6">
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">
                          {clinicData.metrics.patients.total}
                        </p>
                        <p className="text-sm text-gray-600">{t('overview.clinicCard.patients')}</p>
                        <p className="text-xs text-green-600">
                          +{clinicData.metrics.patients.new} {t('overview.stats.new')}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">
                          {clinicData.metrics.appointments.total}
                        </p>
                        <p className="text-sm text-gray-600">{t('overview.clinicCard.appointments')}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-yellow-600">
                          {formatCurrency(clinicData.metrics.billing.totalRevenue)}
                        </p>
                        <p className="text-sm text-gray-600">{t('overview.clinicCard.revenue')}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-purple-600">
                          {clinicData.clinic.staffCount}
                        </p>
                        <p className="text-sm text-gray-600">Staff</p>
                      </div>
                    </div>

                    {/* Staff Utilization */}
                    {clinicData.metrics.staffSchedules.staffUtilization.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-3">Staff Utilization</h4>
                        <div className="space-y-2">
                          {clinicData.metrics.staffSchedules.staffUtilization.slice(0, 3).map((staff) => (
                            <div key={staff._id} className="flex items-center justify-between text-sm">
                              <span className="text-gray-700">{staff.staffName}</span>
                              <span className="text-gray-600">
                                {staff.scheduledHours.toFixed(1)}h ({staff.scheduleCount} shifts)
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {viewMode === 'performance' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b">
                <h2 className="text-lg font-semibold text-gray-900">Clinic Performance Comparison</h2>
              </div>
              {performanceLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              ) : performanceError ? (
                <div className="p-6">
                  <div className="text-center text-red-600">
                    Failed to load performance data: {(performanceError as Error)?.message || 'Unknown error'}
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Clinic
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Completion Rate
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Revenue
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Collection Rate
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Staff Productivity
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {performanceRows.map((clinic) => (
                        <tr key={clinic.clinicId} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {clinic.clinicName}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {(clinic.efficiency.appointmentCompletionRate * 100).toFixed(1)}%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(clinic.revenue.totalRevenue)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {(clinic.revenue.collectionRate * 100).toFixed(1)}%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {(clinic.staffProductivity.scheduleCompletionRate * 100).toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {viewMode === 'schedules' && dashboardData && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b">
                <h2 className="text-lg font-semibold text-gray-900">Staff Schedule Overview</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {dashboardData.clinics.map((clinicData) => (
                    <div key={clinicData.clinic.id} className="border rounded-lg p-4">
                      <h3 className="font-medium text-gray-900 mb-4">{clinicData.clinic.name}</h3>
                      
                      {/* Schedule Status Breakdown */}
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Schedule Status</h4>
                        <div className="space-y-2">
                          {clinicData.metrics.staffSchedules.statusBreakdown.map((status) => (
                            <div key={status._id} className="flex items-center justify-between">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                getStatusColor(status._id)
                              }`}>
                                {status._id}
                              </span>
                              <span className="text-sm text-gray-600">{status.count}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Shift Type Breakdown */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Shift Types</h4>
                        <div className="space-y-2">
                          {clinicData.metrics.staffSchedules.shiftTypeBreakdown.map((shift) => (
                            <div key={shift._id} className="flex items-center justify-between">
                              <span className="text-sm text-gray-700 capitalize">{shift._id}</span>
                              <span className="text-sm text-gray-600">{shift.count}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MultiClinicDashboard;