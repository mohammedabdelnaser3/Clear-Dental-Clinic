import { api } from './index';

export interface MultiClinicDashboardData {
  overallStats: {
    totalPatients: number;
    newPatients: number;
    totalAppointments: number;
    totalRevenue: number;
    totalSchedules: number;
  };
  clinics: Array<{
    clinic: {
      id: string;
      name: string;
      email: string;
      phone: string;
      address: string;
      isActive: boolean;
      staffCount: number;
    };
    metrics: {
      patients: {
        total: number;
        new: number;
        demographics: Array<{ _id: string; count: number }>;
      };
      appointments: {
        total: number;
        statusBreakdown: Array<{ _id: string; count: number }>;
        dailyTrend: Array<{ _id: { year: number; month: number; day: number }; count: number }>;
      };
      billing: {
        totalRevenue: number;
        revenueByStatus: Array<{ _id: string; amount: number; count: number }>;
        dailyRevenue: Array<{ _id: { year: number; month: number; day: number }; revenue: number }>;
      };
      staffSchedules: {
        total: number;
        statusBreakdown: Array<{ _id: string; count: number }>;
        shiftTypeBreakdown: Array<{ _id: string; count: number }>;
        staffUtilization: Array<{
          _id: string;
          staffName: string;
          role: string;
          scheduledHours: number;
          scheduleCount: number;
        }>;
      };
    };
  }>;
  period: string;
  dateRange: {
    start: string;
    end: string;
  };
}

export interface ClinicPerformanceMetrics {
  clinicId: string;
  clinicName: string;
  efficiency: {
    appointmentCompletionRate: number;
    appointmentCancellationRate: number;
    appointmentNoShowRate: number;
  };
  patientSatisfaction: {
    averageRating: number;
    totalReviews: number;
  };
  revenue: {
    totalRevenue: number;
    averageRevenuePerAppointment: number;
    collectionRate: number;
  };
  staffProductivity: {
    scheduleCompletionRate: number;
    totalHours: number;
    averageHoursPerSchedule: number;
  };
}

export interface MultiClinicDashboardParams {
  period?: '7d' | '30d' | '90d' | '1y';
  clinicIds?: string[];
}

export interface ClinicPerformanceParams {
  period?: '7d' | '30d' | '90d' | '1y';
  metrics?: string[];
}

/**
 * Get multi-clinic dashboard data
 */
export const getMultiClinicDashboard = async (params?: MultiClinicDashboardParams): Promise<MultiClinicDashboardData> => {
  const queryParams = new URLSearchParams();
  
  if (params?.period) {
    queryParams.append('period', params.period);
  }
  
  if (params?.clinicIds && params.clinicIds.length > 0) {
    params.clinicIds.forEach(id => queryParams.append('clinicIds', id));
  }
  
  const response = await api.get(`/admin/multi-clinic/dashboard?${queryParams.toString()}`);
  return response.data;
};

/**
 * Get clinic performance metrics
 */
export const getClinicPerformanceMetrics = async (params?: ClinicPerformanceParams): Promise<ClinicPerformanceMetrics[]> => {
  const queryParams = new URLSearchParams();
  
  if (params?.period) {
    queryParams.append('period', params.period);
  }
  
  if (params?.metrics && params.metrics.length > 0) {
    params.metrics.forEach(metric => queryParams.append('metrics', metric));
  }
  
  const response = await api.get(`/admin/clinics/performance?${queryParams.toString()}`);
  return response.data;
};

/**
 * Get staff schedule analytics
 */
export const getStaffScheduleAnalytics = async (clinicId?: string, period?: string) => {
  const queryParams = new URLSearchParams();
  
  if (clinicId) {
    queryParams.append('clinicId', clinicId);
  }
  
  if (period) {
    queryParams.append('period', period);
  }
  
  const response = await api.get(`/staff-schedules/analytics?${queryParams.toString()}`);
  return response.data;
};

/**
 * Get staff schedules with filtering
 */
export const getStaffSchedules = async (params?: {
  clinicId?: string;
  staffId?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  page?: number;
  limit?: number;
}) => {
  const queryParams = new URLSearchParams();
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });
  }
  
  const response = await api.get(`/staff-schedules?${queryParams.toString()}`);
  return response.data;
};

/**
 * Check staff availability
 */
export const checkStaffAvailability = async (params: {
  staffId: string;
  date: string;
  startTime?: string;
  endTime?: string;
}) => {
  const queryParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      queryParams.append(key, value.toString());
    }
  });
  
  const response = await api.get(`/staff-schedules/availability?${queryParams.toString()}`);
  return response.data;
};

/**
 * Create a new staff schedule
 */
export const createStaffSchedule = async (scheduleData: any) => {
  const response = await api.post('/staff-schedules', scheduleData);
  return response.data;
};

/**
 * Update an existing staff schedule
 */
export const updateStaffSchedule = async (scheduleId: string, scheduleData: any) => {
  const response = await api.put(`/staff-schedules/${scheduleId}`, scheduleData);
  return response.data;
};

/**
 * Delete a staff schedule
 */
export const deleteStaffSchedule = async (scheduleId: string) => {
  const response = await api.delete(`/staff-schedules/${scheduleId}`);
  return response.data;
};

/**
 * Get staff schedule by ID
 */
export const getStaffScheduleById = async (scheduleId: string) => {
  const response = await api.get(`/staff-schedules/${scheduleId}`);
  return response.data;
};

/**
 * Get all clinics (admin)
 */
export const getAdminClinics = async () => {
  const response = await api.get('/admin/clinics');
  return response.data;
};

/**
 * Get staff members by clinic
 */
export const getStaffByClinic = async (clinicId: string) => {
  const response = await api.get(`/admin/clinics/${clinicId}/staff`);
  return response.data;
};

/**
 * Detect schedule conflicts
 */
export const detectScheduleConflicts = async (params: {
  clinicId: string;
  staffId?: string;
  startDate?: string;
  endDate?: string;
}) => {
  const queryParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      queryParams.append(key, value.toString());
    }
  });
  
  const response = await api.get(`/staff-schedules/conflicts?${queryParams.toString()}`);
  return response.data;
};

/**
 * Get calendar view of schedules
 */
export const getScheduleCalendarView = async (params: {
  clinicId: string;
  startDate: string;
  endDate: string;
  staffId?: string;
}) => {
  const queryParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      queryParams.append(key, value.toString());
    }
  });
  
  const response = await api.get(`/staff-schedules/calendar?${queryParams.toString()}`);
  return response.data;
};

/**
 * Get admin clinic overview with comprehensive data
 */
export const getAdminClinicOverview = async (params?: any) => {
  const queryParams = new URLSearchParams();
  
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.search) queryParams.append('search', params.search);
  if (params?.status) queryParams.append('status', params.status);
  if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
  
  const response = await api.get(`/admin/clinics/overview?${queryParams.toString()}`);
  return response.data;
};

/**
 * Get detailed clinic data
 */
export const getClinicDetailedData = async (clinicId: string, params?: any) => {
  const queryParams = new URLSearchParams();
  
  if (params?.startDate) queryParams.append('startDate', params.startDate);
  if (params?.endDate) queryParams.append('endDate', params.endDate);
  
  const response = await api.get(`/admin/clinics/${clinicId}/detailed?${queryParams.toString()}`);
  return response.data;
};

export default {
  getMultiClinicDashboard,
  getClinicPerformanceMetrics,
  getStaffScheduleAnalytics,
  getStaffSchedules,
  checkStaffAvailability,
  createStaffSchedule,
  updateStaffSchedule,
  deleteStaffSchedule,
  getStaffScheduleById,
  getAdminClinics,
  getStaffByClinic,
  detectScheduleConflicts,
  getScheduleCalendarView,
  getAdminClinicOverview,
  getClinicDetailedData
};