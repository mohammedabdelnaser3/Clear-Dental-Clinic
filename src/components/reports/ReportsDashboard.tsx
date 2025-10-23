import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import { 
  Calendar, TrendingUp, Users, DollarSign, Activity, Download, 
  Filter, RefreshCw, ChevronDown, ChevronUp 
} from 'lucide-react';
import { Card, Button, Select, Input } from '../ui';
import { useAuth } from '../../hooks/useAuth';
import { reportsService, type ReportFilters } from '../../services/reportsService';
import toast from 'react-hot-toast';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';

interface DashboardSummary {
  totalRevenue: number;
  totalAppointments: number;
  totalPatients: number;
  activeDentists: number;
  revenueGrowth: number;
  appointmentGrowth: number;
  patientGrowth: number;
}

interface ChartData {
  name: string;
  value: number;
  revenue?: number;
  appointments?: number;
  patients?: number;
  [key: string]: any;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6B7280'];

export const ReportsDashboard: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: format(startOfMonth(subMonths(new Date(), 11)), 'yyyy-MM-dd'),
    end: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  });

  // Data states
  const [dashboardSummary, setDashboardSummary] = useState<DashboardSummary | null>(null);
  const [revenueData, setRevenueData] = useState<ChartData[]>([]);
  const [appointmentData, setAppointmentData] = useState<ChartData[]>([]);
  const [treatmentData, setTreatmentData] = useState<ChartData[]>([]);
  const [dentistPerformanceData, setDentistPerformanceData] = useState<ChartData[]>([]);
  const [paymentMethodData, setPaymentMethodData] = useState<ChartData[]>([]);

  // UI states
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['summary', 'revenue']));

  const periodOptions = [
    { value: 'daily', label: t('reports.periods.daily') },
    { value: 'weekly', label: t('reports.periods.weekly') },
    { value: 'monthly', label: t('reports.periods.monthly') },
    { value: 'yearly', label: t('reports.periods.yearly') }
  ];

  useEffect(() => {
    fetchDashboardData();
  }, [selectedPeriod, dateRange]);

  const buildFilters = (): ReportFilters => ({
    startDate: dateRange.start,
    endDate: dateRange.end,
    period: selectedPeriod,
    ...(user?.assignedClinics?.length === 1 ? { clinicId: user.assignedClinics[0] } : {})
  });

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const filters = buildFilters();

      // Fetch all data in parallel
        const [
          summaryResponse,
          revenueResponse,
          appointmentResponse,
          treatmentResponse,
          dentistResponse
        ] = await Promise.all([
        reportsService.getDashboardSummary(filters),
        reportsService.getRevenueAnalytics(filters),
        reportsService.getAppointmentAnalytics(filters),
        reportsService.getTreatmentAnalytics(filters),
        reportsService.getAllDentistPerformance(filters)
      ]);

      // Process summary data
      setDashboardSummary({
        totalRevenue: summaryResponse.totalRevenue || 0,
        totalAppointments: summaryResponse.totalAppointments || 0,
        totalPatients: summaryResponse.totalPatients || 0,
        activeDentists: summaryResponse.activeDentists || 0,
        revenueGrowth: summaryResponse.revenueGrowth || 0,
        appointmentGrowth: summaryResponse.appointmentGrowth || 0,
        patientGrowth: summaryResponse.patientGrowth || 0
      });

      // Process chart data
      setRevenueData(revenueResponse.chartData || []);
      setAppointmentData(appointmentResponse.chartData || []);
      setTreatmentData(treatmentResponse.chartData || []);
      setDentistPerformanceData(dentistResponse.chartData || []);
      setPaymentMethodData(revenueResponse.paymentMethods || []);

    } catch (err: any) {
      setError(err.message || t('reports.errors.fetchFailed'));
      toast.error(t('reports.errors.fetchFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportReport = async (exportFormat: 'pdf' | 'csv' | 'xlsx') => {
    try {
      const filters = buildFilters();
      const blob = await reportsService.exportReport('dashboard', filters, exportFormat);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `clinic-report-${exportFormat}-${format(new Date(), 'yyyy-MM-dd')}.${exportFormat}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success(t('reports.exportSuccess'));
    } catch (_err: any) {
      toast.error(t('reports.errors.exportFailed'));
    }
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">{t('reports.loading')}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('reports.dashboard.title')}</h1>
          <p className="text-gray-600">{t('reports.dashboard.subtitle')}</p>
        </div>
        <div className="mt-4 sm:mt-0 flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => fetchDashboardData()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('common.refresh')}
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => handleExportReport('csv')}>
              {t('reports.export.csv')}
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExportReport('xlsx')}>
              {t('reports.export.xlsx')}
            </Button>
            <Button size="sm" onClick={() => handleExportReport('pdf')}>
              <Download className="h-4 w-4 mr-2" />
              {t('reports.export.pdf')}
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">{t('reports.filters.title')}</span>
          </div>
          <Select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as any)}
            options={periodOptions}
          />
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="w-40"
            />
            <span className="text-gray-500">-</span>
            <Input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="w-40"
            />
          </div>
        </div>
      </Card>

      {error && (
        <Card className="p-4 bg-red-50 border-red-200">
          <p className="text-red-600">{error}</p>
        </Card>
      )}

      {/* Summary Cards */}
      {dashboardSummary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100">{t('reports.dashboard.metrics.totalRevenue')}</p>
                <p className="text-2xl font-bold">{formatCurrency(dashboardSummary.totalRevenue)}</p>
                <p className="text-sm text-blue-100">
                  {formatPercentage(dashboardSummary.revenueGrowth)} {t('reports.dashboard.fromLastPeriod')}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-200" />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-green-500 to-green-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100">{t('reports.dashboard.metrics.totalAppointments')}</p>
                <p className="text-2xl font-bold">{dashboardSummary.totalAppointments.toLocaleString()}</p>
                <p className="text-sm text-green-100">
                  {formatPercentage(dashboardSummary.appointmentGrowth)} {t('reports.dashboard.fromLastPeriod')}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-green-200" />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100">{t('reports.dashboard.metrics.totalPatients')}</p>
                <p className="text-2xl font-bold">{dashboardSummary.totalPatients.toLocaleString()}</p>
                <p className="text-sm text-purple-100">
                  {formatPercentage(dashboardSummary.patientGrowth)} {t('reports.dashboard.fromLastPeriod')}
                </p>
              </div>
              <Users className="h-8 w-8 text-purple-200" />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100">{t('reports.dashboard.metrics.activeDentists')}</p>
                <p className="text-2xl font-bold">{dashboardSummary.activeDentists}</p>
                <p className="text-sm text-orange-100">{t('reports.dashboard.currentlyActive')}</p>
              </div>
              <Activity className="h-8 w-8 text-orange-200" />
            </div>
          </Card>
        </div>
      )}

      {/* Revenue Analytics */}
      <Card>
        <div 
          className="flex items-center justify-between p-6 border-b cursor-pointer"
          onClick={() => toggleSection('revenue')}
        >
          <h2 className="text-lg font-semibold flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            {t('reports.dashboard.sections.revenueAnalytics')}
          </h2>
          {expandedSections.has('revenue') ? 
            <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
          }
        </div>
        {expandedSections.has('revenue') && (
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <h3 className="text-sm font-medium text-gray-700 mb-4">
                  {t('reports.dashboard.charts.revenueOverTime')}
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={formatCurrency} />
                    <Tooltip formatter={(value: number) => [formatCurrency(value), t('reports.dashboard.revenue')]} />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#3B82F6" 
                      fill="#3B82F6"
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-4">
                  {t('reports.dashboard.charts.paymentMethods')}
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={paymentMethodData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {paymentMethodData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [formatCurrency(value), '']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Appointment Analytics */}
      <Card>
        <div 
          className="flex items-center justify-between p-6 border-b cursor-pointer"
          onClick={() => toggleSection('appointments')}
        >
          <h2 className="text-lg font-semibold flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            {t('reports.dashboard.sections.appointmentAnalytics')}
          </h2>
          {expandedSections.has('appointments') ? 
            <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
          }
        </div>
        {expandedSections.has('appointments') && (
          <div className="p-6">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={appointmentData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="completed" fill="#10B981" name={t('appointments.status.completed')} />
                <Bar dataKey="cancelled" fill="#EF4444" name={t('appointments.status.cancelled')} />
                <Bar dataKey="scheduled" fill="#3B82F6" name={t('appointments.status.scheduled')} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {/* Treatment Analytics */}
      <Card>
        <div 
          className="flex items-center justify-between p-6 border-b cursor-pointer"
          onClick={() => toggleSection('treatments')}
        >
          <h2 className="text-lg font-semibold flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            {t('reports.dashboard.sections.treatmentAnalytics')}
          </h2>
          {expandedSections.has('treatments') ? 
            <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
          }
        </div>
        {expandedSections.has('treatments') && (
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-4">
                  {t('reports.dashboard.charts.treatmentsByType')}
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={treatmentData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                      label={(entry) => entry.name}
                    >
                      {treatmentData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-4">
                  {t('reports.dashboard.charts.treatmentRevenue')}
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={treatmentData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tickFormatter={formatCurrency} />
                    <YAxis dataKey="name" type="category" width={100} />
                    <Tooltip formatter={(value: number) => [formatCurrency(value), t('reports.dashboard.revenue')]} />
                    <Bar dataKey="revenue" fill="#8B5CF6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Dentist Performance */}
      {user?.role !== 'patient' && (
        <Card>
          <div 
            className="flex items-center justify-between p-6 border-b cursor-pointer"
            onClick={() => toggleSection('performance')}
          >
            <h2 className="text-lg font-semibold flex items-center">
              <Users className="h-5 w-5 mr-2" />
              {t('reports.dashboard.sections.dentistPerformance')}
            </h2>
            {expandedSections.has('performance') ? 
              <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
            }
          </div>
          {expandedSections.has('performance') && (
            <div className="p-6">
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={dentistPerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="left" orientation="left" />
                  <YAxis yAxisId="right" orientation="right" tickFormatter={formatCurrency} />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="appointments" fill="#3B82F6" name={t('appointments.title')} />
                  <Bar yAxisId="right" dataKey="revenue" fill="#10B981" name={t('reports.dashboard.revenue')} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};
