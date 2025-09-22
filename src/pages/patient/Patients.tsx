import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Input, Card, Table, Pagination, Badge } from '../../components/ui';
import { patientService } from '../../services';
import { useAuth } from '../../hooks/useAuth';
import { formatLocalizedDate } from '../../utils/dateUtils';
import type { PaginatedResponse, Patient } from '../../types';

const Patients: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [patientsData, setPatientsData] = useState<PaginatedResponse<Patient>>({ data: [], total: 0, page: 1, limit: 10, totalPages: 0, success: true });
  const [selectedPatients, setSelectedPatients] = useState<string[]>([]);

  const isPatient = user?.role === 'patient';
  const isStaffOrAdmin = user?.role === 'staff' || user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'dentist';

  useEffect(() => {
    const fetchPatients = async () => {
      setLoading(true);
      try {
        const params: any = { search: searchTerm, page: currentPage, limit: patientsPerPage };
        
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
      }
    };
    fetchPatients();
  }, [searchTerm, currentPage, user?.id, isPatient]);

  const patientsPerPage = 10;
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
    <div className="py-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {isPatient ? t('patients.my_profile') : t('patients.patients')}
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            {isPatient ? t('patients.view_and_manage_personal_information') : t('patients.manage_patient_records')}
          </p>
        </div>
        {isStaffOrAdmin && (
          <div className="mt-4 md:mt-0">
            <Link to="/patients/new">
              <Button variant="primary">
                <svg className="-ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                {t('patients.add_patient')}
              </Button>
            </Link>
          </div>
        )}
      </div>

      <Card>
        {isStaffOrAdmin && (
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="w-full sm:w-64">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <Input
                  placeholder={t('patients.search_patients')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="mt-4 sm:mt-0 flex items-center space-x-2">
              {selectedPatients.length > 0 && (
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <svg className="-ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    {t('patients.export')}
                  </Button>
                  <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                    <svg className="-ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    {t('patients.delete')}
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

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
      </Card>
    </div>
  );
};

export default Patients;