import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, Button, Input, Alert, Select } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';
import adminService from '../../services/adminService';
import { 
  BarChart3, 
  Users, 
  DollarSign, 
  Calendar, 
  Search, 
  Filter, 
  Eye, 
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Activity,
  CheckCircle,
  Clock,
  Building2,
  Plus,
  Settings,
  Download,
} from 'lucide-react';
import type { Clinic } from '../../types';
import { useTranslation } from 'react-i18next';

interface ClinicStatistics {
  totalPatients: number;
  totalAppointments: number;
  totalRevenue: number;
  activePatients: number;
  completedAppointments: number;
  cancelledAppointments: number;
  averageRating: number;
}

interface ClinicData {
  clinic: Clinic;
  statistics: ClinicStatistics | null;
  patientCount: number;
  appointmentCount: number;
  revenue: number;
  detailedData?: any;
}

interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

type SortOption = 'name' | 'patients' | 'revenue' | 'appointments';
type FilterOption = 'all' | 'active' | 'inactive';

const AdminClinicDashboard: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [clinicData, setClinicData] = useState<ClinicData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedClinicDetail, setSelectedClinicDetail] = useState<ClinicData | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationData>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  });
  const [refreshing, setRefreshing] = useState(false);

  const isAdmin = useMemo(() => 
    user?.role === 'admin' || user?.role === 'super_admin', 
    [user?.role]
  );

  useEffect(() => {
    if (isAdmin) {
      fetchClinicsWithData();
    }
  }, [isAdmin, currentPage, searchTerm, filterBy, sortBy]);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (currentPage !== 1) {
        setCurrentPage(1);
      } else {
        fetchClinicsWithData();
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const fetchClinicsWithData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page: currentPage,
        limit: pagination.itemsPerPage,
        search: searchTerm.trim(),
        status: filterBy,
        sortBy: sortBy
      };
      
      const response = await adminService.getAdminClinicOverview(params);
      
      if (response.success && response.data) {
        const clinicsArray = response.data.data || [];
        
        // Transform data to match ClinicData interface
        const transformedData = clinicsArray.map((clinicData: any) => ({
          clinic: clinicData.clinic,
          statistics: clinicData.statistics,
          patientCount: clinicData.statistics?.patients?.total || 0,
          appointmentCount: clinicData.statistics?.appointments?.total || 0,
          revenue: clinicData.statistics?.billing?.totalRevenue || 0
        }));
        
        setClinicData(transformedData);
        setPagination({
          currentPage: response.data.currentPage || 1,
          totalPages: response.data.totalPages || 1,
          totalItems: response.data.totalItems || 0,
          itemsPerPage: response.data.itemsPerPage || 10
        });
      } else {
        throw new Error(response.message || 'Failed to fetch clinic data');
      }
    } catch (err: any) {
      console.error('Error fetching clinic data:', err);
      setError(err.message || 'Failed to fetch clinic data. Please try again.');
      setClinicData([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, filterBy, sortBy, pagination.itemsPerPage]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchClinicsWithData();
    setRefreshing(false);
  }, [fetchClinicsWithData]);



  const viewClinicDetails = useCallback(async (clinicData: ClinicData) => {
    try {
      setError(null);
      const response = await adminService.getClinicDetailedData(clinicData.clinic.id);
      
      if (response.success && response.data) {
        setSelectedClinicDetail({
          ...clinicData,
          detailedData: response.data
        });
        setShowDetailModal(true);
      } else {
        setError('Failed to fetch clinic details');
      }
    } catch (_error) {
      console.error('Error fetching clinic details:', error);
      setError('Failed to fetch clinic details. Please try again.');
    }
  }, []);

  const filteredAndSortedClinics = useMemo(() => {
    return clinicData
      .filter(data => {
        const searchLower = searchTerm.toLowerCase().trim();
        if (!searchLower) return true;
        
        const matchesSearch = 
          data.clinic.name.toLowerCase().includes(searchLower) ||
          data.clinic.address?.city?.toLowerCase().includes(searchLower) ||
          data.clinic.address?.state?.toLowerCase().includes(searchLower) ||
          data.clinic.email?.toLowerCase().includes(searchLower) ||
          data.clinic.phone?.includes(searchTerm.trim());
        
        const matchesFilter = filterBy === 'all' || 
                             (filterBy === 'active' && data.clinic.isActive) ||
                             (filterBy === 'inactive' && !data.clinic.isActive);
        
        return matchesSearch && matchesFilter;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'name':
            return a.clinic.name.localeCompare(b.clinic.name);
          case 'patients':
            return b.patientCount - a.patientCount;
          case 'revenue':
            return b.revenue - a.revenue;
          case 'appointments':
            return b.appointmentCount - a.appointmentCount;
          default:
            return 0;
        }
      });
  }, [clinicData, searchTerm, filterBy, sortBy]);

  const totalStats = useMemo(() => {
    return clinicData.reduce(
      (acc, data) => ({
        totalClinics: acc.totalClinics + 1,
        totalPatients: acc.totalPatients + (data.patientCount || 0),
        totalRevenue: acc.totalRevenue + (data.revenue || 0),
        totalAppointments: acc.totalAppointments + (data.appointmentCount || 0)
      }),
      { totalClinics: 0, totalPatients: 0, totalRevenue: 0, totalAppointments: 0 }
    );
  }, [clinicData]);

  const handlePageChange = useCallback((newPage: number) => {
    setCurrentPage(newPage);
  }, []);

  const handleSortChange = useCallback((newSort: SortOption) => {
    setSortBy(newSort);
    setCurrentPage(1);
  }, []);

  const handleFilterChange = useCallback((newFilter: FilterOption) => {
    setFilterBy(newFilter);
    setCurrentPage(1);
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
  }, []);

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('admin_dashboard.access_denied')}</h1>
          <p className="text-gray-600 mb-6">{t('admin_dashboard.access_denied_message')}</p>
          <div className="space-y-3">
            <Link to="/dashboard" className="block">
              <Button variant="primary" className="w-full">{t('admin_dashboard.go_to_dashboard')}</Button>
            </Link>
            <Link to="/" className="block">
              <Button variant="outline" className="w-full">{t('admin_dashboard.go_to_home')}</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading && clinicData.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">{t('admin_dashboard.loading_clinics')}</h2>
          <p className="text-gray-500">{t('admin_dashboard.failed_to_fetch_clinic_data')}</p>
        </div>
      </div>
    );
  }

  if (error && clinicData.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('admin_dashboard.error_loading_data')}</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <Button 
              onClick={handleRefresh} 
              variant="primary" 
              className="w-full flex items-center justify-center gap-2"
              disabled={refreshing}
            >
              <RefreshCw className={refreshing ? 'animate-spin' : ''} />
              {refreshing ? t('admin_dashboard.retrying') : t('admin_dashboard.try_again')}
            </Button>
            <Link to="/dashboard" className="block">
              <Button variant="outline" className="w-full">{t('admin_dashboard.go_to_dashboard')}</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 shadow-xl border-b border-blue-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0">
            {/* Left Section */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="p-3 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 rounded-xl shadow-lg">
                  <BarChart3 className="w-8 h-8 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-white">{t('admin_dashboard.title')}</h1>
                <p className="text-blue-100/80 text-sm lg:text-base">Comprehensive clinic management and analytics</p>
                <div className="flex items-center space-x-4 mt-2 text-xs text-blue-200/70">
                  <span className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span>System Online</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>Last updated: {new Date().toLocaleTimeString()}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center space-x-3">
              <Button 
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? t('admin_dashboard.refreshing') : t('admin_dashboard.refresh_data')}
              </Button>
              <Link to="/admin/multi-clinic">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30"
                >
                  <Activity className="w-4 h-4 mr-2" />
                  {t('admin_dashboard.multi_clinic_dashboard')}
                </Button>
              </Link>
              <Link to="/clinics">
                <Button 
                  variant="primary" 
                  size="sm"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  <Building2 className="w-4 h-4 mr-2" />
                  {t('admin_dashboard.manage_clinics')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}

        {/* Overall Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-white to-blue-50/50 backdrop-blur-sm group">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg group-hover:shadow-xl transition-shadow">
                  <Building2 className="w-8 h-8 text-white" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">{t('admin_dashboard.total_clinics')}</h3>
              <p className="text-3xl font-bold text-blue-600 mb-2">
                {loading ? (
                  <div className="animate-pulse bg-gray-200 h-8 w-16 rounded mx-auto"></div>
                ) : (
                  totalStats.totalClinics.toLocaleString()
                )}
              </p>
              <div className="flex items-center justify-center space-x-1 text-sm text-green-600">
                <TrendingUp className="w-4 h-4" />
                <span>+12% this month</span>
              </div>
            </div>
          </Card>
          <Card className="p-6 hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-white to-green-50/50 backdrop-blur-sm group">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg group-hover:shadow-xl transition-shadow">
                  <Users className="w-8 h-8 text-white" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">{t('admin_dashboard.total_patients')}</h3>
              <p className="text-3xl font-bold text-green-600 mb-2">
                {loading ? (
                  <div className="animate-pulse bg-gray-200 h-8 w-20 rounded mx-auto"></div>
                ) : (
                  totalStats.totalPatients.toLocaleString()
                )}
              </p>
              <div className="flex items-center justify-center space-x-1 text-sm text-green-600">
                <TrendingUp className="w-4 h-4" />
                <span>+8% this month</span>
              </div>
            </div>
          </Card>
          <Card className="p-6 hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-white to-purple-50/50 backdrop-blur-sm group">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-lg group-hover:shadow-xl transition-shadow">
                  <DollarSign className="w-8 h-8 text-white" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">{t('admin_dashboard.total_revenue')}</h3>
              <p className="text-3xl font-bold text-purple-600 mb-2">
                {loading ? (
                  <div className="animate-pulse bg-gray-200 h-8 w-24 rounded mx-auto"></div>
                ) : (
                  `$${totalStats.totalRevenue.toLocaleString()}`
                )}
              </p>
              <div className="flex items-center justify-center space-x-1 text-sm text-green-600">
                <TrendingUp className="w-4 h-4" />
                <span>+15% this month</span>
              </div>
            </div>
          </Card>
          <Card className="p-6 hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-white to-orange-50/50 backdrop-blur-sm group">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl shadow-lg group-hover:shadow-xl transition-shadow">
                  <Calendar className="w-8 h-8 text-white" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">{t('admin_dashboard.total_appointments')}</h3>
              <p className="text-3xl font-bold text-orange-600 mb-2">
                {loading ? (
                  <div className="animate-pulse bg-gray-200 h-8 w-20 rounded mx-auto"></div>
                ) : (
                  totalStats.totalAppointments.toLocaleString()
                )}
              </p>
              <div className="flex items-center justify-center space-x-1 text-sm text-red-600">
                <TrendingDown className="w-4 h-4" />
                <span>-3% this month</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Enhanced Filters and Search */}
        <Card className="p-6 mb-8 border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Search className="w-5 h-5 text-blue-600" />
              Search & Filter Clinics
            </h2>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span>Total: {filteredAndSortedClinics.length} clinics</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder={t('admin_dashboard.search_placeholder')}
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value as SortOption)}
                className="pl-10 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl appearance-none"
                options={[
                  { value: 'name', label: t('admin_dashboard.sort_by_name') },
                  { value: 'patients', label: t('admin_dashboard.sort_by_patients') },
                  { value: 'revenue', label: t('admin_dashboard.sort_by_revenue') },
                  { value: 'appointments', label: t('admin_dashboard.sort_by_appointments') }
                ]}
              />
            </div>
            <div className="relative">
              <Activity className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Select
                value={filterBy}
                onChange={(e) => handleFilterChange(e.target.value as FilterOption)}
                className="pl-10 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl appearance-none"
                options={[
                  { value: 'all', label: t('admin_dashboard.all_clinics') },
                  { value: 'active', label: t('admin_dashboard.active_only') },
                  { value: 'inactive', label: t('admin_dashboard.inactive_only') }
                ]}
              />
            </div>
          </div>
        </Card>

        {/* Enhanced Clinics Table */}
        <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                Clinic Management
              </h2>
              <div className="flex items-center space-x-3">
                <Link to="/clinics/create">
                  <Button 
                    variant="primary" 
                    size="sm"
                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Clinic
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => console.log('Export clicked')}
                  className="border-gray-200 hover:border-blue-500 hover:text-blue-600"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-blue-50/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    <div className="flex items-center space-x-1">
                      <Building2 className="w-4 h-4" />
                      <span>{t('admin_dashboard.clinic')}</span>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    <div className="flex items-center space-x-1">
                      <Activity className="w-4 h-4" />
                      <span>{t('admin_dashboard.location')}</span>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    <div className="flex items-center space-x-1">
                      <Users className="w-4 h-4" />
                      <span>{t('admin_dashboard.patients')}</span>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>{t('admin_dashboard.appointments')}</span>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    <div className="flex items-center space-x-1">
                      <DollarSign className="w-4 h-4" />
                      <span>{t('admin_dashboard.revenue')}</span>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    <div className="flex items-center space-x-1">
                      <CheckCircle className="w-4 h-4" />
                      <span>{t('admin_dashboard.status')}</span>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    <div className="flex items-center space-x-1">
                      <Settings className="w-4 h-4" />
                      <span>{t('admin_dashboard.actions')}</span>
                    </div>
                  </th>
                </tr>
              </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAndSortedClinics.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
                        {t('admin_dashboard.loading_clinics')}
                      </div>
                    ) : searchTerm || filterBy !== 'all' ? (
                      <div>
                        <p className="text-lg font-medium">{t('admin_dashboard.no_clinics_found')}</p>
                        <p className="text-sm mt-1">{t('admin_dashboard.try_again')}</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-lg font-medium">{t('admin_dashboard.no_clinics_available')}</p>
                        <p className="text-sm mt-1">{t('admin_dashboard.failed_to_fetch_clinic_data')}</p>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                filteredAndSortedClinics.map((data) => (
                  <tr key={data.clinic.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{data.clinic.name}</div>
                      <div className="text-sm text-gray-500">{data.clinic.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {data.clinic.address.city}, {data.clinic.address.state}
                    </div>
                    <div className="text-sm text-gray-500">{data.clinic.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {data.patientCount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {data.appointmentCount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${data.revenue.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      data.clinic.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {data.clinic.isActive ? t('admin_dashboard.active') : t('admin_dashboard.inactive')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => viewClinicDetails(data)}
                        className="flex items-center gap-1"
                      >
                        <Eye /> {t('admin_dashboard.view_details')}
                      </Button>
                      <Link to={`/clinics/${data.clinic.id}/dashboard`}>
                        <Button variant="outline" size="sm">
                          {t('admin_dashboard.dashboard')}
                        </Button>
                      </Link>
                    </div>
                  </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-between items-center mt-6 px-6 py-4 bg-gray-50">
            <div className="text-sm text-gray-600">
              Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} to{' '}
              {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of{' '}
              {pagination.totalItems} clinics
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => handlePageChange(Math.max(pagination.currentPage - 1, 1))}
                disabled={pagination.currentPage === 1 || loading}
                variant="outline"
                size="sm"
              >
                {t('admin_dashboard.previous')}
              </Button>
              
              {/* Page numbers */}
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  let pageNum;
                  if (pagination.totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (pagination.currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (pagination.currentPage >= pagination.totalPages - 2) {
                    pageNum = pagination.totalPages - 4 + i;
                  } else {
                    pageNum = pagination.currentPage - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      variant={pageNum === pagination.currentPage ? 'primary' : 'outline'}
                      size="sm"
                      className="w-8 h-8 p-0"
                      disabled={loading}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                onClick={() => handlePageChange(Math.min(pagination.currentPage + 1, pagination.totalPages))}
                disabled={pagination.currentPage === pagination.totalPages || loading}
                variant="outline"
                size="sm"
              >
                {t('admin_dashboard.next')}
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Clinic Detail Modal */}
      {showDetailModal && selectedClinicDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedClinicDetail.clinic.name}
                </h2>
                <p className="text-sm text-gray-500 mt-1">{t('admin_dashboard.detailed_clinic_overview')}</p>
              </div>
              <Button
                onClick={() => setShowDetailModal(false)}
                variant="outline"
                size="sm"
                className="text-gray-400 hover:text-gray-600 border-none"
              >
                ✕
              </Button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                  <h3 className="text-sm font-medium text-blue-800 mb-1">{t('admin_dashboard.total_patients')}</h3>
                  <p className="text-2xl font-bold text-blue-600">
                    {selectedClinicDetail.patientCount?.toLocaleString() || 0}
                  </p>
                </div>
                <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                  <h3 className="text-sm font-medium text-green-800 mb-1">{t('admin_dashboard.total_revenue')}</h3>
                  <p className="text-2xl font-bold text-green-600">
                    ${(selectedClinicDetail.revenue || 0).toLocaleString()}
                  </p>
                </div>
                <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                  <h3 className="text-sm font-medium text-purple-800 mb-1">{t('admin_dashboard.appointments')}</h3>
                  <p className="text-2xl font-bold text-purple-600">
                    {selectedClinicDetail.appointmentCount?.toLocaleString() || 0}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Clinic Information */}
                <div className="bg-gray-50 p-6 rounded-lg border">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                    {t('admin_dashboard.clinic_information')}
                  </h3>
                  <div className="space-y-3">
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t('common.email')}</span>
                      <span className="text-sm text-gray-900">{selectedClinicDetail.clinic.email || t('admin_dashboard.not_provided')}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t('common.phone')}</span>
                      <span className="text-sm text-gray-900">{selectedClinicDetail.clinic.phone || t('admin_dashboard.not_provided')}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t('common.address')}</span>
                      <span className="text-sm text-gray-900">
                        {selectedClinicDetail.clinic.address ? (
                          `${selectedClinicDetail.clinic.address.street || ''}, ${selectedClinicDetail.clinic.address.city || ''}, ${selectedClinicDetail.clinic.address.state || ''} ${selectedClinicDetail.clinic.address.zipCode || ''}`.trim().replace(/^,\s*|,\s*$/g, '')
                        ) : (
                          t('admin_dashboard.not_provided')
                        )}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t('admin_dashboard.status')}</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 w-fit ${
                        selectedClinicDetail.clinic.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                          selectedClinicDetail.clinic.isActive ? 'bg-green-400' : 'bg-red-400'
                        }`}></span>
                        {selectedClinicDetail.clinic.isActive ? t('admin_dashboard.active') : t('admin_dashboard.inactive')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Performance Metrics */}
                <div className="bg-gray-50 p-6 rounded-lg border">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    {t('admin_dashboard.performance_metrics')}
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-white rounded border">
                      <span className="text-sm text-gray-600">{t('admin_dashboard.avg_revenue_per_patient')}</span>
                      <span className="text-sm font-semibold text-gray-900">
                        ${(selectedClinicDetail.patientCount && selectedClinicDetail.patientCount > 0) 
                          ? ((selectedClinicDetail.revenue || 0) / selectedClinicDetail.patientCount).toFixed(2)
                          : '0.00'
                        }
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white rounded border">
                      <span className="text-sm text-gray-600">{t('admin_dashboard.appointments_per_patient')}</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {(selectedClinicDetail.patientCount && selectedClinicDetail.patientCount > 0) 
                          ? ((selectedClinicDetail.appointmentCount || 0) / selectedClinicDetail.patientCount).toFixed(1)
                          : '0.0'
                        }
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white rounded border">
                      <span className="text-sm text-gray-600">{t('admin_dashboard.revenue_per_appointment')}</span>
                      <span className="text-sm font-semibold text-gray-900">
                        ${(selectedClinicDetail.appointmentCount && selectedClinicDetail.appointmentCount > 0) 
                          ? ((selectedClinicDetail.revenue || 0) / selectedClinicDetail.appointmentCount).toFixed(2)
                          : '0.00'
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Details */}
              {selectedClinicDetail.detailedData && (
                <div className="mt-6 bg-blue-50 p-6 rounded-lg border border-blue-200">
                  <h3 className="text-lg font-semibold text-blue-800 mb-4">{t('admin_dashboard.additional_details')}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {Object.entries(selectedClinicDetail.detailedData).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-blue-600 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                        <span className="text-blue-800 font-medium">
                          {typeof value === 'number' ? value.toLocaleString() : String(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap justify-end gap-3 pt-6 border-t border-gray-200 mt-6">
                <Link to={`/patients?clinic=${selectedClinicDetail.clinic.id}`}>
                  <Button variant="outline" size="sm">{t('admin_dashboard.view_patients')}</Button>
                </Link>
                <Link to={`/appointments?clinic=${selectedClinicDetail.clinic.id}`}>
                  <Button variant="outline" size="sm">{t('admin_dashboard.view_appointments')}</Button>
                </Link>
                <Link to={`/billing?clinic=${selectedClinicDetail.clinic.id}`}>
                  <Button variant="outline" size="sm">{t('admin_dashboard.view_billing')}</Button>
                </Link>
                <Link to={`/clinics/${selectedClinicDetail.clinic.id}/edit`}>
                  <Button variant="primary" size="sm">{t('admin_dashboard.edit_clinic')}</Button>
                </Link>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end p-6 border-t border-gray-200 bg-gray-50">
              <Button
                onClick={() => setShowDetailModal(false)}
                variant="primary"
              >
                {t('admin_dashboard.close')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
};

export default AdminClinicDashboard;