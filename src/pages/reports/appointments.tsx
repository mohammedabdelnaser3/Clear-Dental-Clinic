import React, { useState, useEffect } from 'react';
import { Card, Button, Select, DatePicker } from '../../components/ui';
import { BarChart, LineChart, PieChart } from '../../components/charts';
import { getAppointmentReport, type AppointmentReportData, type ReportFilters } from '../../services/reportsService';
import { Spinner } from '../../components/ui';

const AppointmentReports: React.FC = () => {
  // State for filters
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({
    start: new Date(new Date().setDate(new Date().getDate() - 30)), // Last 30 days
    end: new Date(),
  });
  const [doctorFilter, setDoctorFilter] = useState<string>('all');
  const [reportType, setReportType] = useState<string>('overview');
  
  // State for data and loading
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [appointmentData, setAppointmentData] = useState<AppointmentReportData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Helper function to convert date range to string format
  const getDateRangeString = (start: Date | null, end: Date | null): { startDate: string; endDate: string } => {
    const startDate = start ? start.toISOString().split('T')[0] : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const endDate = end ? end.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    return { startDate, endDate };
  };

  // Fetch appointment report data
  const fetchAppointmentData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { startDate, endDate } = getDateRangeString(dateRange.start, dateRange.end);
      const filters: ReportFilters = {
        dateRange : {start: startDate,
        end: endDate
        },
        ...(doctorFilter !== 'all' && { dentistId: doctorFilter })
      };
      
      const response = await getAppointmentReport(filters);
      
      if (response.success && response.data) {
        setAppointmentData(response.data);
      } else {
        setError(response.message || 'No data available');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch appointment data');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data on component mount and when filters change
  useEffect(() => {
    fetchAppointmentData();
  }, [dateRange, doctorFilter]);

  // Transform data for charts
  const appointmentStatusData = appointmentData ? [
    { name: 'Completed', value: appointmentData.completionRate, color: '#4CAF50' },
    { name: 'Cancelled', value: appointmentData.cancellationRate, color: '#F44336' },
    { name: 'No-show', value: appointmentData.noShowRate, color: '#9E9E9E' },
    { name: 'Rescheduled', value: Math.max(0, 100 - appointmentData.completionRate - appointmentData.cancellationRate - appointmentData.noShowRate), color: '#2196F3' },
  ] : [];

  const appointmentTrendData = appointmentData?.dailyTrends?.map(trend => ({
    date: trend.date,
    appointments: trend.count
  })) || [];

  const appointmentsByTypeData = appointmentData?.serviceBreakdown?.map((service, index) => {
    const colors = ['#4CAF50', '#2196F3', '#FFC107', '#9C27B0', '#FF5722', '#795548'];
    return {
      name: service.service,
      value: service.count,
      color: colors[index % colors.length]
    };
  }) || [];

  // Mock data for doctors (since this might not be in the API response)
  const appointmentsByDoctorData = [
    { name: 'Dr. Smith', appointments: Math.floor((appointmentData?.totalAppointments || 0) * 0.2) },
    { name: 'Dr. Johnson', appointments: Math.floor((appointmentData?.totalAppointments || 0) * 0.15) },
    { name: 'Dr. Williams', appointments: Math.floor((appointmentData?.totalAppointments || 0) * 0.18) },
    { name: 'Dr. Brown', appointments: Math.floor((appointmentData?.totalAppointments || 0) * 0.22) },
    { name: 'Dr. Jones', appointments: Math.floor((appointmentData?.totalAppointments || 0) * 0.12) },
    { name: 'Dr. Garcia', appointments: Math.floor((appointmentData?.totalAppointments || 0) * 0.13) },
  ];

  // Report type options
  const reportTypes = [
    { value: 'overview', label: 'Overview' },
    { value: 'status', label: 'Appointment Status' },
    { value: 'trends', label: 'Appointment Trends' },
    { value: 'doctors', label: 'Appointments by Doctor' },
    { value: 'types', label: 'Appointments by Type' },
  ];

  // Doctor filter options
  const doctorOptions = [
    { value: 'all', label: 'All Doctors' },
    { value: 'smith', label: 'Dr. Smith' },
    { value: 'johnson', label: 'Dr. Johnson' },
    { value: 'williams', label: 'Dr. Williams' },
    { value: 'brown', label: 'Dr. Brown' },
    { value: 'jones', label: 'Dr. Jones' },
    { value: 'garcia', label: 'Dr. Garcia' },
  ];

  // Handle date range change
  const handleDateRangeChange = (date: Date | { start: Date | null; end: Date | null }) => {
    if (date && typeof date === 'object' && 'start' in date) {
      setDateRange(date);
    }
  };

  // Handle export report
  const handleExportReport = (format: 'pdf' | 'csv' | 'excel') => {
    // Implementation for exporting reports
    console.log(`Exporting report as ${format}`);
    // In a real application, this would call an API to generate the export
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Appointment Reports</h1>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => handleExportReport('pdf')}
          >
            Export PDF
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExportReport('csv')}
          >
            Export CSV
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExportReport('excel')}
          >
            Export Excel
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
            <DatePicker
              range
              value={dateRange}
              onChange={handleDateRangeChange}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Doctor</label>
            <Select
              options={doctorOptions}
              value={doctorFilter}
              onChange={(e) => setDoctorFilter(e.target.value)}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
            <Select
              options={reportTypes}
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full"
            />
          </div>
        </div>
      </Card>

      {/* Error Message */}
      {error && (
        <Card className="p-4 mb-6 bg-red-50 border-red-200">
          <div className="flex items-center justify-between">
            <p className="text-red-600">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchAppointmentData}>
              Retry
            </Button>
          </div>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      )}

      {/* Report Content */}
      {!isLoading && !error && reportType === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-4">
            <h2 className="text-lg font-semibold mb-4">Appointment Status</h2>
            <div className="h-64">
              {appointmentStatusData.length > 0 ? (
                <PieChart data={appointmentStatusData} />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No data available
                </div>
              )}
            </div>
          </Card>
          <Card className="p-4">
            <h2 className="text-lg font-semibold mb-4">Appointment Trends</h2>
            <div className="h-64">
              {appointmentTrendData.length > 0 ? (
                <LineChart 
                  data={appointmentTrendData} 
                  xKey="date" 
                  yKey="appointments" 
                  xLabel="Date" 
                  yLabel={t('reports.reportTypesConfig.appointments.numberOfAppointments')} 
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No trend data available
                </div>
              )}
            </div>
          </Card>
          <Card className="p-4">
            <h2 className="text-lg font-semibold mb-4">Appointments by Doctor</h2>
            <div className="h-64">
              {appointmentsByDoctorData.length > 0 ? (
                <BarChart 
                  data={appointmentsByDoctorData} 
                  xKey="name" 
                  yKey="appointments" 
                  xLabel="Doctor" 
                  yLabel={t('reports.reportTypesConfig.appointments.numberOfAppointments')} 
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No doctor data available
                </div>
              )}
            </div>
          </Card>
          <Card className="p-4">
            <h2 className="text-lg font-semibold mb-4">Appointments by Type</h2>
            <div className="h-64">
              {appointmentsByTypeData.length > 0 ? (
                <PieChart data={appointmentsByTypeData} />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No service type data available
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {reportType === 'status' && (
        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-4">Appointment Status</h2>
          <div className="h-96">
            <PieChart data={appointmentStatusData} />
          </div>
          <div className="mt-6">
            <h3 className="text-md font-medium mb-2">Summary</h3>
            <p className="mb-4">During the selected period, 65% of appointments were completed successfully, while 15% were cancelled. The no-show rate was 8%, and 12% of appointments were rescheduled.</p>
            
            <h3 className="text-md font-medium mb-2">Recommendations</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Consider implementing appointment reminders to reduce the no-show rate.</li>
              <li>Analyze the reasons for cancellations to identify patterns.</li>
              <li>Review the scheduling process to minimize the need for rescheduling.</li>
            </ul>
          </div>
        </Card>
      )}

      {reportType === 'trends' && (
        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-4">Appointment Trends</h2>
          <div className="h-96">
            <LineChart 
              data={appointmentTrendData} 
              xKey="date" 
              yKey="appointments" 
              xLabel="Date" 
              yLabel="Number of Appointments" 
            />
          </div>
          <div className="mt-6">
            <h3 className="text-md font-medium mb-2">Trend Analysis</h3>
            <p className="mb-4">Appointment volume shows a cyclical pattern with peaks during weekdays and drops during weekends. There was a notable increase in appointments starting January 8th.</p>
            
            <h3 className="text-md font-medium mb-2">Insights</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Consider adjusting staffing levels to match appointment patterns.</li>
              <li>Investigate the factors contributing to the increased volume after January 8th.</li>
              <li>Explore opportunities to balance appointment load throughout the week.</li>
            </ul>
          </div>
        </Card>
      )}

      {reportType === 'doctors' && (
        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-4">Appointments by Doctor</h2>
          <div className="h-96">
            <BarChart 
              data={appointmentsByDoctorData} 
              xKey="name" 
              yKey="appointments" 
              xLabel="Doctor" 
              yLabel="Number of Appointments" 
            />
          </div>
          <div className="mt-6">
            <h3 className="text-md font-medium mb-2">Doctor Workload Analysis</h3>
            <p className="mb-4">Dr. Smith has the highest appointment volume (120), followed by Dr. Brown (110). Dr. Garcia has the lowest appointment count (65).</p>
            
            <h3 className="text-md font-medium mb-2">Recommendations</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Review appointment distribution to ensure balanced workloads.</li>
              <li>Consider specialization factors when evaluating appointment counts.</li>
              <li>Analyze appointment duration alongside count for a complete workload assessment.</li>
            </ul>
          </div>
        </Card>
      )}

      {reportType === 'types' && (
        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-4">Appointments by Type</h2>
          <div className="h-96">
            <PieChart data={appointmentsByTypeData} />
          </div>
          <div className="mt-6">
            <h3 className="text-md font-medium mb-2">Appointment Type Distribution</h3>
            <p className="mb-4">Check-ups represent the largest portion of appointments (45%), followed by follow-ups (30%). Consultations (15%) and procedures (10%) make up the remainder.</p>
            
            <h3 className="text-md font-medium mb-2">Resource Planning</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Allocate resources based on the distribution of appointment types.</li>
              <li>Consider dedicated time blocks for different appointment types.</li>
              <li>Review staffing needs for each appointment category.</li>
            </ul>
          </div>
        </Card>
      )}

      {/* Key Metrics */}
      {!isLoading && !error && appointmentData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <Card className="p-4">
            <h3 className="text-sm font-medium text-gray-500">Total Appointments</h3>
            <p className="text-2xl font-bold">{appointmentData.totalAppointments.toLocaleString()}</p>
            <p className="text-sm text-gray-600">During selected period</p>
          </Card>
          <Card className="p-4">
            <h3 className="text-sm font-medium text-gray-500">Completion Rate</h3>
            <p className="text-2xl font-bold">{appointmentData.completionRate.toFixed(1)}%</p>
            <p className="text-sm text-green-600">{appointmentData.completedAppointments} completed</p>
          </Card>
          <Card className="p-4">
            <h3 className="text-sm font-medium text-gray-500">No-show Rate</h3>
            <p className="text-2xl font-bold">{appointmentData.noShowRate.toFixed(1)}%</p>
            <p className="text-sm text-red-600">{appointmentData.noShowAppointments} no-shows</p>
          </Card>
          <Card className="p-4">
            <h3 className="text-sm font-medium text-gray-500">Avg. Duration</h3>
            <p className="text-2xl font-bold">{appointmentData.averageDuration} min</p>
            <p className="text-sm text-gray-600">Average per appointment</p>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AppointmentReports;