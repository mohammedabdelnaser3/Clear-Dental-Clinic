import React, { useState, useEffect } from 'react';
import { Card, Button, Select } from '../../components/ui';
import { getPatientReport, type PatientReportData, type ReportFilters } from '../../services/reportsService';
import { getPatients } from '../../services/patientService';
import type { Patient } from '../../types';

// Loading spinner component
const Spinner = () => (
  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
);

const PatientReports: React.FC = () => {
  const [dateRange, setDateRange] = useState<string>('last30days');
  const [reportType, setReportType] = useState<string>('overview');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [patientData, setPatientData] = useState<PatientReportData | null>(null);
  const [recentPatients, setRecentPatients] = useState<Patient[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Helper function to convert date range to actual dates
  const getDateRangeFromString = (range: string): { startDate: string; endDate: string } => {
    const now = new Date();
    const endDate = now.toISOString().split('T')[0];
    let startDate: string;

    switch (range) {
      case 'today':
        startDate = endDate;
        break;
      case 'yesterday':
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        startDate = yesterday.toISOString().split('T')[0];
        break;
      case 'thisWeek':
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startDate = startOfWeek.toISOString().split('T')[0];
        break;
      case 'lastWeek':
        const lastWeekEnd = new Date(now);
        lastWeekEnd.setDate(now.getDate() - now.getDay() - 1);
        const lastWeekStart = new Date(lastWeekEnd);
        lastWeekStart.setDate(lastWeekEnd.getDate() - 6);
        startDate = lastWeekStart.toISOString().split('T')[0];
        break;
      case 'thisMonth':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        break;
      case 'lastMonth':
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        // Removed unused lastMonthEnd variable
        startDate = lastMonth.toISOString().split('T')[0];
        break;
      case 'last30days':
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(now.getDate() - 30);
        startDate = thirtyDaysAgo.toISOString().split('T')[0];
        break;
      case 'last90days':
        const ninetyDaysAgo = new Date(now);
        ninetyDaysAgo.setDate(now.getDate() - 90);
        startDate = ninetyDaysAgo.toISOString().split('T')[0];
        break;
      case 'thisYear':
        startDate = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
        break;
      case 'lastYear':
        const lastYear = new Date(now.getFullYear() - 1, 0, 1);
        // Removed unused lastYearEnd variable
        startDate = lastYear.toISOString().split('T')[0];
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    }

    return { startDate, endDate };
  };

  // Fetch patient report data
  const fetchPatientData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { startDate, endDate } = getDateRangeFromString(dateRange);
      const filters: ReportFilters = {
        type: 'patients',
        dateRange: { start: startDate, end: endDate }
      };

      const [reportResponse, patientsResponse] = await Promise.all([
        getPatientReport(filters),
        getPatients({ limit: 10 })
      ]);

      if (reportResponse.success && reportResponse.data) {
        setPatientData(reportResponse.data);
      } else {
        setError(reportResponse.message || 'No data available');
      }

      setRecentPatients(patientsResponse.data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch patient data');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data on component mount and when filters change
  useEffect(() => {
    fetchPatientData();
  }, [dateRange]);
  
  // Date range options
  const dateRangeOptions = [
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'thisWeek', label: 'This Week' },
    { value: 'lastWeek', label: 'Last Week' },
    { value: 'thisMonth', label: 'This Month' },
    { value: 'lastMonth', label: 'Last Month' },
    { value: 'last30days', label: 'Last 30 Days' },
    { value: 'last90days', label: 'Last 90 Days' },
    { value: 'thisYear', label: 'This Year' },
    { value: 'lastYear', label: 'Last Year' }
  ];

  const handleDateRangeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setDateRange(e.target.value);
  };

  const handleReportTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setReportType(e.target.value);
  };

  // Report type options
  const reportTypeOptions = [
    { value: 'overview', label: 'Overview' },
    { value: 'demographics', label: 'Demographics' },
    { value: 'retention', label: 'Retention' },
    { value: 'trends', label: 'Trends' }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Patient Reports</h1>
        <div className="flex space-x-2">
          <Select
            value={dateRange}
            onChange={handleDateRangeChange}
            options={dateRangeOptions}
            className="w-40"
          />
          <Select
            value={reportType}
            onChange={handleReportTypeChange}
            options={reportTypeOptions}
            className="w-40"
          />
          <Button variant="outline" onClick={() => console.log('Export data')}>
            Export Data
          </Button>
          <Button variant="outline" onClick={() => console.log('Print report')}>
            Print
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={fetchPatientData}
          >
            Retry
          </Button>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="p-4">
          <h3 className="text-lg font-medium mb-1">Total Patients</h3>
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Spinner />
            </div>
          ) : (
            <p className="text-3xl font-bold">{patientData?.totalPatients?.toLocaleString() || 0}</p>
          )}
        </Card>
        <Card className="p-4">
          <h3 className="text-lg font-medium mb-1">New Patients</h3>
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Spinner />
            </div>
          ) : (
            <>
              <p className="text-3xl font-bold text-blue-600">{patientData?.newPatients?.toLocaleString() || 0}</p>
              {patientData?.totalPatients && patientData?.newPatients && (
                <p className="text-sm text-gray-600">
                  {Math.round((patientData.newPatients / patientData.totalPatients) * 100)}% of total
                </p>
              )}
            </>
          )}
        </Card>
        <Card className="p-4">
          <h3 className="text-lg font-medium mb-1">Returning Patients</h3>
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Spinner />
            </div>
          ) : (
            <>
              <p className="text-3xl font-bold text-green-600">{patientData?.returningPatients?.toLocaleString() || 0}</p>
              {patientData?.totalPatients && patientData?.returningPatients && (
                <p className="text-sm text-gray-600">
                  {Math.round((patientData.returningPatients / patientData.totalPatients) * 100)}% of total
                </p>
              )}
            </>
          )}
        </Card>
      </div>

      {/* Report Content - Conditionally rendered based on reportType */}
      {reportType === 'overview' && (
        <div className="space-y-6">
          <Card className="p-4">
            <h3 className="text-lg font-medium mb-4">Patient Demographics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-2">By Age Group</h4>
                <div className="bg-gray-100 rounded-lg p-4 h-64 flex items-center justify-center">
                  <p className="text-gray-500">Age Group Chart Placeholder</p>
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">By Gender</h4>
                <div className="bg-gray-100 rounded-lg p-4 h-64 flex items-center justify-center">
                  <p className="text-gray-500">Gender Chart Placeholder</p>
                </div>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <h3 className="text-lg font-medium mb-4">Monthly Patient Trends</h3>
            <div className="bg-gray-100 rounded-lg p-4 h-80 flex items-center justify-center">
              <p className="text-gray-500">Monthly Trends Chart Placeholder</p>
            </div>
          </Card>
        </div>
      )}

      {reportType === 'demographics' && (
        <div className="space-y-6">
          <Card className="p-4">
            <h3 className="text-lg font-medium mb-4">Detailed Demographics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-2">Age Distribution</h4>
                <div className="bg-gray-100 rounded-lg p-4 h-64 flex items-center justify-center">
                  <p className="text-gray-500">Detailed Age Chart Placeholder</p>
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">Location Distribution</h4>
                <div className="bg-gray-100 rounded-lg p-4 h-64 flex items-center justify-center">
                  <p className="text-gray-500">Location Chart Placeholder</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {reportType === 'retention' && (
        <Card className="p-4">
          <h3 className="text-lg font-medium mb-4">Patient Retention</h3>
          <div className="bg-gray-100 rounded-lg p-4 h-80 flex items-center justify-center">
            <p className="text-gray-500">Retention Chart Placeholder</p>
          </div>
        </Card>
      )}

      {reportType === 'trends' && (
        <Card className="p-4">
          <h3 className="text-lg font-medium mb-4">Patient Growth Trends</h3>
          <div className="bg-gray-100 rounded-lg p-4 h-80 flex items-center justify-center">
            <p className="text-gray-500">Growth Trends Chart Placeholder</p>
          </div>
        </Card>
      )}

      {/* Detailed Patient Data Table */}
      <Card className="p-4 mt-6">
        <h3 className="text-lg font-medium mb-4">Recent Patients</h3>
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Age</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gender</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date of Birth</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentPatients.length > 0 ? (
                  recentPatients.map((patient) => {
                    const age = patient.dateOfBirth 
                      ? Math.floor((Date.now() - new Date(patient.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
                      : 'N/A';
                    
                    return (
                      <tr key={patient.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{patient.id.slice(-6).toUpperCase()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {patient.firstName} {patient.lastName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{age}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{patient.gender}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{patient.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{patient.phone}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : 'N/A'}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-sm text-gray-500">
                      No patients found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
        <div className="mt-4 flex justify-between items-center">
          <p className="text-sm text-gray-500">
            Showing {recentPatients.length} recent patients
            {patientData?.totalPatients && ` of ${patientData.totalPatients.toLocaleString()} total`}
          </p>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" disabled>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled>
              Next
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default PatientReports;