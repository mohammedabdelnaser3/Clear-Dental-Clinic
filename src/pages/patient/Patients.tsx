import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Card, Table, Pagination, Badge } from '../../components/ui';
import { AnalyticsWidget } from '../../components/dashboard';
import PatientSearch, { type PatientSearchFilters } from '../../components/patient/PatientSearch';
import { patientService } from '../../services';
import { useAuth } from '../../hooks/useAuth';
import { formatLocalizedDate } from '../../utils/dateUtils';
import type { PaginatedResponse, Patient } from '../../types';
import {
  Users,
  UserPlus,
  UserCheck,
  UserX,
  Download,
  Filter,
  Grid,
  List,
  Plus,
  Trash2,
  RefreshCw,
  CheckCircle,
  Clock
} from 'lucide-react';

const Patients: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchFilters, setSearchFilters] = useState<PatientSearchFilters>({
    search: '',
    ageRange: 'all',
    gender: 'all',
    status: 'all',
    hasAllergies: 'all',
    sortBy: 'lastName',
    sortOrder: 'asc'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [patientsData, setPatientsData] = useState<PaginatedResponse<Patient>>({ data: [], total: 0, page: 1, limit: 10, totalPages: 0, success: true });
  const [selectedPatients, setSelectedPatients] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [showFilters, setShowFilters] = useState(false);

  const isPatient = user?.role === 'patient';
  const isStaffOrAdmin = user?.role === 'staff' || user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'dentist';

  // Patient statistics
  const patientStats = useMemo(() => {
    const patients = patientsData.data;
    const totalPatients = patientsData.total;
    const activePatients = patients.filter(p => p.isActive).length;
    const inactivePatients = patients.filter(p => !p.isActive).length;
    const newThisMonth = patients.filter(p => {
      const createdDate = new Date(p.createdAt);
      const now = new Date();
      return createdDate.getMonth() === now.getMonth() && createdDate.getFullYear() === now.getFullYear();
    }).length;

    return {
      total: totalPatients,
      active: activePatients,
      inactive: inactivePatients,
      newThisMonth,
      activePercentage: totalPatients > 0 ? Math.round((activePatients / totalPatients) * 100) : 0
    };
  }, [patientsData]);

  // Fetch patients with advanced filtering
  const fetchPatients = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    
    try {
      const params: any = { 
        search: searchFilters.search, 
        page: currentPage, 
        limit: 10,
        sortBy: searchFilters.sortBy,
        sortOrder: searchFilters.sortOrder
      };
      
      // Add advanced filters
      if (searchFilters.status !== 'all') {
        params.status = searchFilters.status;
      }
      if (searchFilters.gender !== 'all') {
        params.gender = searchFilters.gender;
      }
      if (searchFilters.ageRange !== 'all') {
        params.ageRange = searchFilters.ageRange;
      }
      if (searchFilters.hasAllergies !== 'all') {
        params.hasAllergies = searchFilters.hasAllergies === 'yes';
      }
      
      // If user is a patient, only fetch their own data
      if (isPatient && user?.id) {
        params.patientId = user.id;
      }
      
      const response = await patientService.getPatients(params);
      setPatientsData(response);
    } catch (err: any) {
      console.error('Failed to fetch patients:', err.message || 'Unknown error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchFilters, currentPage, user?.id, isPatient]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const filteredPatients = patientsData.data; // Already filtered by API
  const totalPages = patientsData.totalPages;
  const paginatedPatients = filteredPatients;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleRowClick = (patient: Patient) => {
    navigate(`/patients/${patient.id}`);
  };

  const handleSelectionChange = (selectedIds: (string | number)[]) => {
    setSelectedPatients(selectedIds as string[]);
  };

  const formatDate = (dateString: string) => {
    // Use the new utility function that handles locale errors gracefully
    return formatLocalizedDate(dateString, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const columns = [
    {
      header: t('patients.name'),
      accessor: (patient: Patient) => (
        <div>
          <div className="font-medium text-gray-900">{patient.firstName} {patient.lastName}</div>
          <div className="text-sm text-gray-500">{patient.email}</div>
        </div>
      ),
    },
    {
      header: t('patients.phone'),
      accessor: (patient: Patient) => patient.phone,
    },
    {
      header: t('patients.age'),
      accessor: (patient: Patient) => calculateAge(patient.dateOfBirth.toString()),
    },
    {
      header: t('patients.status'),
      accessor: (patient: Patient) => (
        <Badge 
          variant={patient.isActive ? 'success' : 'gray'}
        >
          {patient.isActive ? t('patients.active') : t('patients.inactive')}
        </Badge>
      ),
    },
    {
      header: t('patients.last_visit'),
      accessor: (patient: Patient) => patient.updatedAt ? formatDate(patient.updatedAt.toString()) : t('common.not_applicable'),
    },
    {
      header: t('patients.actions'),
      accessor: (patient: Patient) => (
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/patients/${patient.id}`);
            }}
          >
            {t('patients.view')}
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/patients/${patient.id}/edit`);
            }}
          >
            {t('patients.edit')}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Enhanced Header - Responsive */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 shadow-xl border-b border-blue-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col space-y-4 lg:flex-row lg:justify-between lg:items-center lg:space-y-0">
            {/* Left Section - Responsive */}
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="relative flex-shrink-0">
                <div className="p-2 sm:p-3 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 rounded-xl shadow-lg">
                  <Users className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white truncate">
                  {isPatient ? t('patients.my_profile') : t('patients.patients')}
                </h1>
                <p className="text-blue-100/80 text-xs sm:text-sm lg:text-base truncate">
                  {isPatient ? t('patients.view_and_manage_personal_information') : t('patients.manage_patient_records')}
                </p>
                <div className="hidden sm:flex items-center space-x-4 mt-2 text-xs text-blue-200/70">
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

            {/* Right Section - Responsive */}
            <div className="flex items-center space-x-2 sm:space-x-3 overflow-x-auto">
              <Button 
                variant="outline"
                size="sm"
                onClick={() => fetchPatients(true)}
                disabled={refreshing}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30 flex-shrink-0"
              >
                <RefreshCw className={`w-4 h-4 sm:mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{refreshing ? 'Refreshing...' : t('common.refresh')}</span>
              </Button>
              
              {isStaffOrAdmin && (
                <>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30 flex-shrink-0"
                  >
                    <Filter className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">Filters</span>
                  </Button>
                  
                  <div className="hidden md:flex items-center bg-white/10 rounded-lg p-1 flex-shrink-0">
                    <Button
                      variant={viewMode === 'table' ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('table')}
                      className="px-2 py-1"
                    >
                      <List className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'grid' ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className="px-2 py-1"
                    >
                      <Grid className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <Link to="/patients/new" className="flex-shrink-0">
                    <Button 
                      variant="primary" 
                      size="sm"
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                    >
                      <Plus className="w-4 h-4 sm:mr-2" />
                      <span className="hidden sm:inline">{t('patients.add_patient')}</span>
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Statistics Cards - Only for staff/admin - Responsive */}
        {isStaffOrAdmin && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <AnalyticsWidget
              title="Total Patients"
              type="metric"
              data={[{ label: 'Total', value: patientStats.total }]}
              icon={<Users className="w-5 h-5" />}
              gradient="from-blue-500 to-blue-600"
              height="h-32"
              showLegend={false}
            />
            <AnalyticsWidget
              title="Active Patients"
              type="metric"
              data={[{ label: 'Active', value: patientStats.active }]}
              trend={{ value: patientStats.activePercentage, isPositive: true, period: 'of total' }}
              icon={<UserCheck className="w-5 h-5" />}
              gradient="from-green-500 to-green-600"
              height="h-32"
              showLegend={false}
            />
            <AnalyticsWidget
              title="Inactive Patients"
              type="metric"
              data={[{ label: 'Inactive', value: patientStats.inactive }]}
              icon={<UserX className="w-5 h-5" />}
              gradient="from-orange-500 to-orange-600"
              height="h-32"
              showLegend={false}
            />
            <AnalyticsWidget
              title="New This Month"
              type="metric"
              data={[{ label: 'New', value: patientStats.newThisMonth }]}
              trend={{ value: 15, isPositive: true, period: 'vs last month' }}
              icon={<UserPlus className="w-5 h-5" />}
              gradient="from-purple-500 to-purple-600"
              height="h-32"
              showLegend={false}
            />
          </div>
        )}

        {/* Advanced Search - Only for staff/admin */}
        {isStaffOrAdmin && showFilters && (
          <div className="mb-6">
            <PatientSearch
              onSearch={setSearchFilters}
              loading={loading}
              totalResults={patientsData.total}
            />
          </div>
        )}

        {/* Main Content */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50">
          {/* Bulk Actions Bar */}
          {isStaffOrAdmin && selectedPatients.length > 0 && (
            <div className="p-4 bg-blue-50 border-b border-blue-100 rounded-t-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">
                    {selectedPatients.length} patient{selectedPatients.length !== 1 ? 's' : ''} selected
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" className="text-blue-600 border-blue-200 hover:bg-blue-100">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                  <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="p-4 sm:p-6">
            {/* Mobile Card View */}
            <div className="block md:hidden space-y-4">
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : paginatedPatients.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  {isPatient ? t('patients.noProfileFound') : t('patients.noPatientsFound')}
                </div>
              ) : (
                paginatedPatients.map((patient) => (
                  <div
                    key={patient.id}
                    onClick={() => handleRowClick(patient)}
                    className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {patient.firstName} {patient.lastName}
                        </h3>
                        <p className="text-sm text-gray-500 truncate">{patient.email}</p>
                      </div>
                      <Badge 
                        variant={patient.isActive ? 'success' : 'gray'}
                        className="ml-2 flex-shrink-0"
                      >
                        {patient.isActive ? t('patients.active') : t('patients.inactive')}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 mb-3">
                      <div className="flex items-center text-sm text-gray-600">
                        <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <span className="truncate">{patient.phone}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4h3a1 1 0 011 1v1a1 1 0 01-1 1H5a1 1 0 01-1-1V8a1 1 0 011-1h3z" />
                        </svg>
                        <span>{t('patients.age')}: {calculateAge(patient.dateOfBirth.toString())}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="truncate">{t('patients.last_visit')}: {patient.updatedAt ? formatDate(patient.updatedAt.toString()) : t('common.not_applicable')}</span>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2 pt-3 border-t border-gray-100">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/patients/${patient.id}`);
                        }}
                        className="flex-1 min-h-[44px]"
                      >
                        {t('patients.view')}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/patients/${patient.id}/edit`);
                        }}
                        className="flex-1 min-h-[44px]"
                      >
                        {t('patients.edit')}
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block">
              <Table
                columns={columns}
                data={paginatedPatients}
                keyExtractor={(patient) => patient.id}
                isLoading={loading}
                emptyMessage={isPatient ? t('patients.noProfileFound') : t('patients.noPatientsFound')}
                onRowClick={handleRowClick}
                isSelectable={isStaffOrAdmin}
                selectedIds={selectedPatients}
                onSelectionChange={handleSelectionChange}
              />
            </div>

            {totalPages > 1 && (
              <div className="mt-4 sm:mt-6 flex justify-center">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Patients;