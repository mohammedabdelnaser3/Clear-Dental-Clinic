import api from './api';

export interface ReportFilters {
  startDate?: string;
  endDate?: string;
  clinicId?: string;
  dentistId?: string;
  patientId?: string;
  reportType?: string;
  period?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  groupBy?: 'day' | 'week' | 'month' | 'quarter' | 'year';
}

export interface AppointmentReport {
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  noShowAppointments: number;
  appointmentsByStatus: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
  appointmentsByType: Array<{
    type: string;
    count: number;
    percentage: number;
  }>;
  appointmentsByDate: Array<{
    date: string;
    total: number;
    completed: number;
    cancelled: number;
    noShow: number;
  }>;
  appointmentsByDentist: Array<{
    dentistId: string;
    dentistName: string;
    total: number;
    completed: number;
    cancelled: number;
  }>;
  averageAppointmentDuration: number;
  peakHours: Array<{
    hour: number;
    count: number;
  }>;
}

export interface RevenueReport {
  totalRevenue: number;
  paidAmount: number;
  pendingAmount: number;
  overdueAmount: number;
  averageInvoiceAmount: number;
  revenueByPeriod: Array<{
    period: string;
    revenue: number;
    invoices: number;
    patients: number;
  }>;
  revenueByService: Array<{
    service: string;
    revenue: number;
    count: number;
    percentage: number;
  }>;
  revenueByDentist: Array<{
    dentistId: string;
    dentistName: string;
    revenue: number;
    invoices: number;
  }>;
  paymentMethodBreakdown: Array<{
    method: string;
    amount: number;
    count: number;
    percentage: number;
  }>;
  revenueGrowth: {
    currentPeriod: number;
    previousPeriod: number;
    growthRate: number;
  };
}

export interface PatientReport {
  totalPatients: number;
  newPatients: number;
  activePatients: number;
  inactivePatients: number;
  patientsByAge: Array<{
    ageGroup: string;
    count: number;
    percentage: number;
  }>;
  patientsByGender: Array<{
    gender: string;
    count: number;
    percentage: number;
  }>;
  patientRegistrationTrends: Array<{
    period: string;
    newPatients: number;
    totalPatients: number;
  }>;
  patientRetentionRate: number;
  averagePatientValue: number;
  topPatientsByRevenue: Array<{
    patientId: string;
    patientName: string;
    totalRevenue: number;
    appointmentCount: number;
  }>;
}

export interface TreatmentReport {
  totalTreatments: number;
  treatmentsByType: Array<{
    treatmentType: string;
    count: number;
    revenue: number;
    percentage: number;
  }>;
  treatmentsByDentist: Array<{
    dentistId: string;
    dentistName: string;
    treatments: number;
    revenue: number;
  }>;
  treatmentTrends: Array<{
    period: string;
    treatments: number;
    revenue: number;
  }>;
  averageTreatmentCost: number;
  mostCommonTreatments: Array<{
    treatment: string;
    count: number;
    averageCost: number;
  }>;
  treatmentOutcomes: Array<{
    outcome: string;
    count: number;
    percentage: number;
  }>;
}

export interface DentistPerformanceReport {
  dentistId: string;
  dentistName: string;
  totalAppointments: number;
  completedAppointments: number;
  revenue: number;
  patientCount: number;
  averageAppointmentRating: number;
  specializationPerformance: Array<{
    specialization: string;
    appointments: number;
    revenue: number;
  }>;
  workingHours: {
    totalHours: number;
    averageHoursPerDay: number;
    utilizationRate: number;
  };
  patientSatisfactionScore: number;
}

export interface ClinicOverviewReport {
  clinicId: string;
  clinicName: string;
  totalRevenue: number;
  totalAppointments: number;
  totalPatients: number;
  activeDentists: number;
  operationalMetrics: {
    appointmentUtilizationRate: number;
    averageWaitTime: number;
    patientSatisfactionScore: number;
    cancellationRate: number;
  };
  revenueByMonth: Array<{
    month: string;
    revenue: number;
    appointments: number;
  }>;
  topServices: Array<{
    service: string;
    revenue: number;
    count: number;
  }>;
}

export interface InventoryReport {
  totalItems: number;
  lowStockItems: number;
  outOfStockItems: number;
  inventoryValue: number;
  itemsByCategory: Array<{
    category: string;
    count: number;
    value: number;
  }>;
  consumptionTrends: Array<{
    period: string;
    consumed: number;
    restocked: number;
  }>;
  topConsumedItems: Array<{
    itemName: string;
    consumed: number;
    cost: number;
  }>;
}

class ReportsService {
  private baseURL = '/reports';

  // Appointment Reports
  async getAppointmentReport(filters: ReportFilters = {}): Promise<AppointmentReport> {
    const params = this.buildQueryParams(filters);
    const response = await api.get(`${this.baseURL}/appointments?${params}`);
    return response.data;
  }

  async getAppointmentAnalytics(filters: ReportFilters = {}) {
    const params = this.buildQueryParams(filters);
    const response = await api.get(`${this.baseURL}/appointments/analytics?${params}`);
    return response.data;
  }

  // Revenue Reports
  async getRevenueReport(filters: ReportFilters = {}): Promise<RevenueReport> {
    const params = this.buildQueryParams(filters);
    const response = await api.get(`${this.baseURL}/revenue?${params}`);
    return response.data;
  }

  async getRevenueAnalytics(filters: ReportFilters = {}) {
    const params = this.buildQueryParams(filters);
    const response = await api.get(`${this.baseURL}/revenue/analytics?${params}`);
    return response.data;
  }

  // Patient Reports
  async getPatientReport(filters: ReportFilters = {}): Promise<PatientReport> {
    const params = this.buildQueryParams(filters);
    const response = await api.get(`${this.baseURL}/patients?${params}`);
    return response.data;
  }

  async getPatientAnalytics(filters: ReportFilters = {}) {
    const params = this.buildQueryParams(filters);
    const response = await api.get(`${this.baseURL}/patients/analytics?${params}`);
    return response.data;
  }

  // Treatment Reports
  async getTreatmentReport(filters: ReportFilters = {}): Promise<TreatmentReport> {
    const params = this.buildQueryParams(filters);
    const response = await api.get(`${this.baseURL}/treatments?${params}`);
    return response.data;
  }

  async getTreatmentAnalytics(filters: ReportFilters = {}) {
    const params = this.buildQueryParams(filters);
    const response = await api.get(`${this.baseURL}/treatments/analytics?${params}`);
    return response.data;
  }

  // Dentist Performance Reports
  async getDentistPerformanceReport(dentistId: string, filters: ReportFilters = {}): Promise<DentistPerformanceReport> {
    const params = this.buildQueryParams(filters);
    const response = await api.get(`${this.baseURL}/dentists/${dentistId}?${params}`);
    return response.data;
  }

  async getAllDentistPerformance(filters: ReportFilters = {}) {
    const params = this.buildQueryParams(filters);
    const response = await api.get(`${this.baseURL}/dentists?${params}`);
    return response.data;
  }

  // Clinic Overview Reports
  async getClinicOverviewReport(clinicId: string, filters: ReportFilters = {}): Promise<ClinicOverviewReport> {
    const params = this.buildQueryParams(filters);
    const response = await api.get(`${this.baseURL}/clinics/${clinicId}?${params}`);
    return response.data;
  }

  async getAllClinicsOverview(filters: ReportFilters = {}) {
    const params = this.buildQueryParams(filters);
    const response = await api.get(`${this.baseURL}/clinics?${params}`);
    return response.data;
  }

  // Inventory Reports
  async getInventoryReport(filters: ReportFilters = {}): Promise<InventoryReport> {
    const params = this.buildQueryParams(filters);
    const response = await api.get(`${this.baseURL}/inventory?${params}`);
    return response.data;
  }

  // Dashboard Summary
  async getDashboardSummary(filters: ReportFilters = {}) {
    const params = this.buildQueryParams(filters);
    const response = await api.get(`${this.baseURL}/dashboard?${params}`);
    return response.data;
  }

  // Export Reports
  async exportReport(reportType: string, filters: ReportFilters = {}, format: 'csv' | 'pdf' | 'xlsx' = 'pdf') {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });
    
    params.append('format', format);

    const response = await api.get(`${this.baseURL}/export/${reportType}?${params.toString()}`, {
      responseType: 'blob'
    });
    return response.data;
  }

  // Custom Reports
  async generateCustomReport(config: {
    metrics: string[];
    dimensions: string[];
    filters: ReportFilters;
  }) {
    const response = await api.post(`${this.baseURL}/custom`, config);
    return response.data;
  }

  // Comparative Analysis
  async getComparativeAnalysis(config: {
    metric: string;
    compareBy: 'period' | 'clinic' | 'dentist';
    filters: ReportFilters;
  }) {
    const response = await api.post(`${this.baseURL}/comparative`, config);
    return response.data;
  }

  // Trending Analysis
  async getTrendingAnalysis(config: {
    metrics: string[];
    period: 'daily' | 'weekly' | 'monthly';
    filters: ReportFilters;
  }) {
    const response = await api.post(`${this.baseURL}/trending`, config);
    return response.data;
  }

  // Financial Analysis
  async getFinancialAnalysis(filters: ReportFilters = {}) {
    const params = this.buildQueryParams(filters);
    const response = await api.get(`${this.baseURL}/financial?${params}`);
    return response.data;
  }

  // Operational Metrics
  async getOperationalMetrics(filters: ReportFilters = {}) {
    const params = this.buildQueryParams(filters);
    const response = await api.get(`${this.baseURL}/operational?${params}`);
    return response.data;
  }

  // Patient Satisfaction
  async getPatientSatisfactionReport(filters: ReportFilters = {}) {
    const params = this.buildQueryParams(filters);
    const response = await api.get(`${this.baseURL}/satisfaction?${params}`);
    return response.data;
  }

  // Forecasting
  async getForecastReport(config: {
    metric: string;
    periods: number;
    filters: ReportFilters;
  }) {
    const response = await api.post(`${this.baseURL}/forecast`, config);
    return response.data;
  }

  // Helper method to build query parameters
  private buildQueryParams(filters: ReportFilters): string {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    return params.toString();
  }
}

export const reportsService = new ReportsService();