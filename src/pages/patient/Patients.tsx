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
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 shadow-xl border-b border-blue-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0">
            {/* Left Section */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="p-3 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 rounded-xl shadow-lg">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-white">
                  {isPatient ? t('patients.my_profile') : t('patients.patients')}
                </h1>
                <p className="text-blue-100/80 text-sm lg:text-base">
                  {isPatient ? t('patients.view_and_manage_personal_information') : t('patients.manage_patient_records')}
                </p>
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
                onClick={() => fetchPatients(true)}
                disabled={refreshing}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : t('common.refresh')}
              </Button>
              
              {isStaffOrAdmin && (
                <>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30"
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Filters
                  </Button>
                  
                  <div className="flex items-center bg-white/10 rounded-lg p-1">
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
                  
                  <Link to="/patients/new">
                    <Button 
                      variant="primary" 
                      size="sm"
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {t('patients.add_patient')}
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Statistics Cards - Only for staff/admin */}
        {isStaffOrAdmin && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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

          <div className="p-6">
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

            {totalPages > 1 && (
              <div className="mt-6 flex justify-center">
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