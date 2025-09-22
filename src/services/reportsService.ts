import api from './api';
import type { ApiResponse } from '../types';

// Report data types
export interface ReportData {
  id: string;
  title: string;
  type: 'appointments' | 'patients' | 'revenue' | 'performance' | 'custom';
  dateRange: {
    start: Date;
    end: Date;
  };
  data: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReportFilters {
  type?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  clinicId?: string;
  dentistId?: string;
  status?: string;
}

export interface AppointmentReportData {
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  noShowAppointments: number;
  completionRate: number;
  cancellationRate: number;
  noShowRate: number;
  averageDuration: number;
  peakHours: Array<{ hour: number; count: number }>;
  dailyTrends: Array<{ date: string; count: number }>;
  serviceBreakdown: Array<{ service: string; count: number; revenue: number }>;
}

export interface PatientReportData {
  totalPatients: number;
  newPatients: number;
  returningPatients: number;
  ageDistribution: Array<{ ageGroup: string; count: number }>;
  genderDistribution: Array<{ gender: string; count: number }>;
  locationDistribution: Array<{ location: string; count: number }>;
  retentionRate: number;
  averageVisitsPerPatient: number;
  monthlyGrowth: Array<{ month: string; newPatients: number; totalPatients: number }>;
}

export interface RevenueReportData {
  totalRevenue: number;
  monthlyRevenue: Array<{ month: string; revenue: number }>;
  revenueByService: Array<{ service: string; revenue: number; count: number }>;
  revenueByDoctor: Array<{ doctor: string; revenue: number; appointments: number }>;
  averageRevenuePerAppointment: number;
  outstandingPayments: number;
  collectionRate: number;
}

// Helper function to transform report data
const transformReportData = (report: any): ReportData => {
  return {
    id: report._id,
    title: report.title,
    type: report.type,
    dateRange: {
      start: new Date(report.dateRange.start),
      end: new Date(report.dateRange.end)
    },
    data: report.data,
    createdAt: new Date(report.createdAt),
    updatedAt: new Date(report.updatedAt)
  };
};

// API Functions
export const getAppointmentReport = async (filters: ReportFilters): Promise<ApiResponse<AppointmentReportData>> => {
  try {
    const response = await api.get('/api/v1/reports/appointments', {
      params: filters
    });
    
    return {
      success: true,
      data: response.data.data,
      message: 'Appointment report retrieved successfully'
    };
  } catch (error: any) {
    return {
      success: false,
      data: {} as AppointmentReportData,
      message: error.response?.data?.message || error.message || 'Failed to retrieve appointment report'
    };
  }
};

export const getPatientReport = async (filters: ReportFilters): Promise<ApiResponse<PatientReportData>> => {
  try {
    const response = await api.get('/api/v1/reports/patients', {
      params: filters
    });
    
    return {
      success: true,
      data: response.data.data,
      message: 'Patient report retrieved successfully'
    };
  } catch (error: any) {
    return {
      success: false,
      data: {} as PatientReportData,
      message: error.response?.data?.message || error.message || 'Failed to retrieve patient report'
    };
  }
};

export const getRevenueReport = async (filters: ReportFilters): Promise<ApiResponse<RevenueReportData>> => {
  try {
    const response = await api.get('/api/v1/reports/revenue', {
      params: filters
    });
    
    return {
      success: true,
      data: response.data.data,
      message: 'Revenue report retrieved successfully'
    };
  } catch (error: any) {
    return {
      success: false,
      data: {} as RevenueReportData,
      message: error.response?.data?.message || error.message || 'Failed to retrieve revenue report'
    };
  }
};

export const generateCustomReport = async (config: {
  title: string;
  type: string;
  filters: ReportFilters;
  metrics: string[];
}): Promise<ApiResponse<ReportData>> => {
  try {
    const response = await api.post('/api/v1/reports/custom', config);
    const report = transformReportData(response.data.data);
    
    return {
      success: true,
      data: report,
      message: 'Custom report generated successfully'
    };
  } catch (error: any) {
    return {
      success: false,
      data: {} as ReportData,
      message: error.response?.data?.message || error.message || 'Failed to generate custom report'
    };
  }
};

export const getSavedReports = async (): Promise<ApiResponse<ReportData[]>> => {
  try {
    const response = await api.get('/api/v1/reports/saved');
    const reports = response.data.data.map(transformReportData);
    
    return {
      success: true,
      data: reports,
      message: 'Saved reports retrieved successfully'
    };
  } catch (error: any) {
    return {
      success: false,
      data: [],
      message: error.response?.data?.message || error.message || 'Failed to retrieve saved reports'
    };
  }
};

export const deleteReport = async (reportId: string): Promise<ApiResponse<null>> => {
  try {
    await api.delete(`/reports/${reportId}`);
    
    return {
      success: true,
      data: null,
      message: 'Report deleted successfully'
    };
  } catch (error: any) {
    return {
      success: false,
      data: null,
      message: error.response?.data?.message || error.message || 'Failed to delete report'
    };
  }
};

export const exportReport = async (reportId: string, format: 'pdf' | 'excel' | 'csv'): Promise<ApiResponse<Blob>> => {
  try {
    const response = await api.get(`/reports/${reportId}/export`, {
      params: { format },
      responseType: 'blob'
    });
    
    return {
      success: true,
      data: response.data,
      message: 'Report exported successfully'
    };
  } catch (error: any) {
    return {
      success: false,
      data: new Blob(),
      message: error.response?.data?.message || error.message || 'Failed to export report'
    };
  }
};