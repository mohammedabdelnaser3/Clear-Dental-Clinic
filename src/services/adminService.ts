import { api } from './index';
import type { ApiResponse, PaginatedResponse } from '../types/common';
import type { HomepageContentBlock, ContentVersion, ContentStatus } from '../types/homepage';
import type {
  StaffSchedule,
  CreateStaffSchedulePayload,
  UpdateStaffSchedulePayload,
  ScheduleAnalytics,
  StaffAvailabilityResponseData
} from '../types/staffSchedule';

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
  
  const response = await api.get(`/api/v1/admin/multi-clinic/dashboard?${queryParams.toString()}`);
  return response.data.data;
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
  
  const response = await api.get(`/api/v1/admin/clinics/performance?${queryParams.toString()}`);
  return response.data.data;
};

/**
 * Get staff schedule analytics
 */
export const getStaffScheduleAnalytics = async (
  clinicId: string,
  params?: { startDate?: string; endDate?: string }
): Promise<ApiResponse<ScheduleAnalytics>> => {
  const queryParams = new URLSearchParams();
  if (params?.startDate) queryParams.append('startDate', params.startDate);
  if (params?.endDate) queryParams.append('endDate', params.endDate);
  const response = await api.get(`/api/v1/staff-schedules/analytics/${clinicId}?${queryParams.toString()}`);
  return response.data as ApiResponse<ScheduleAnalytics>;
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
  shiftType?: string;
  page?: number;
  limit?: number;
}): Promise<ApiResponse<PaginatedResponse<StaffSchedule>>> => {
  const queryParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });
  }
  const response = await api.get(`/api/v1/staff-schedules?${queryParams.toString()}`);
  return response.data as ApiResponse<PaginatedResponse<StaffSchedule>>;
};

/**
 * Check staff availability
 */
export const checkStaffAvailability = async (
  params: { clinicId: string; date: string }
): Promise<ApiResponse<StaffAvailabilityResponseData>> => {
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      queryParams.append(key, value.toString());
    }
  });
  const response = await api.get(`/api/v1/staff-schedules/availability?${queryParams.toString()}`);
  return response.data as ApiResponse<StaffAvailabilityResponseData>;
};

/**
 * Create a new staff schedule
 */
export const createStaffSchedule = async (
  scheduleData: CreateStaffSchedulePayload
): Promise<ApiResponse<{ schedule: StaffSchedule }>> => {
  const response = await api.post('/api/v1/staff-schedules', scheduleData);
  return response.data as ApiResponse<{ schedule: StaffSchedule }>;
};

/**
 * Update an existing staff schedule
 */
export const updateStaffSchedule = async (
  scheduleId: string,
  scheduleData: UpdateStaffSchedulePayload
): Promise<ApiResponse<{ schedule: StaffSchedule }>> => {
  const response = await api.put(`/api/v1/staff-schedules/${scheduleId}`, scheduleData);
  return response.data as ApiResponse<{ schedule: StaffSchedule }>;
};

/**
 * Delete a staff schedule
 */
export const deleteStaffSchedule = async (scheduleId: string): Promise<ApiResponse<null>> => {
  const response = await api.delete(`/api/v1/staff-schedules/${scheduleId}`);
  return response.data as ApiResponse<null>;
};

/**
 * Get staff schedule by ID
 */
export const getStaffScheduleById = async (
  scheduleId: string
): Promise<ApiResponse<{ schedule: StaffSchedule }>> => {
  const response = await api.get(`/api/v1/staff-schedules/${scheduleId}`);
  return response.data as ApiResponse<{ schedule: StaffSchedule }>;
};

/**
 * Get all clinics (admin)
 */
export const getAdminClinics = async (): Promise<ApiResponse<{ clinics: any }>> => {
  const response = await api.get('/api/v1/admin/clinics');
  return response.data as ApiResponse<{ clinics: any }>;
};

/**
 * Get staff members by clinic
 */
export const getStaffByClinic = async (clinicId: string): Promise<ApiResponse<{ staff: any }>> => {
  const response = await api.get(`/api/v1/clinics/${clinicId}/staff`);
  return response.data as ApiResponse<{ staff: any }>;
};

/**
 * Detect schedule conflicts
 */
export const detectScheduleConflicts = async (params: {
  clinicId: string;
  staffId?: string;
  startDate?: string;
  endDate?: string;
}): Promise<ApiResponse<unknown>> => {
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      queryParams.append(key, value.toString());
    }
  });
  const response = await api.get(`/api/v1/staff-schedules/conflicts?${queryParams.toString()}`);
  return response.data as ApiResponse<unknown>;
};

/**
 * Get calendar view of schedules
 */
export const getScheduleCalendarView = async (params: {
  clinicId: string;
  startDate: string;
  endDate: string;
  staffId?: string;
}): Promise<ApiResponse<unknown>> => {
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      queryParams.append(key, value.toString());
    }
  });
  const response = await api.get(`/api/v1/staff-schedules/calendar?${queryParams.toString()}`);
  return response.data as ApiResponse<unknown>;
};

/**
 * Get admin clinic overview with comprehensive data
 */
export const getAdminClinicOverview = async (
  params?: { page?: number; limit?: number; search?: string; status?: string; sortBy?: string }
): Promise<ApiResponse<any>> => {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.search) queryParams.append('search', params.search);
  if (params?.status) queryParams.append('status', params.status);
  if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
  const response = await api.get(`/api/v1/admin/clinics/overview?${queryParams.toString()}`);
  return response.data as ApiResponse<any>;
};

/**
 * Get detailed clinic data
 */
export const getClinicDetailedData = async (
  clinicId: string,
  params?: { startDate?: string; endDate?: string }
): Promise<ApiResponse<any>> => {
  const queryParams = new URLSearchParams();
  if (params?.startDate) queryParams.append('startDate', params.startDate);
  if (params?.endDate) queryParams.append('endDate', params.endDate);
  const response = await api.get(`/api/v1/admin/clinics/${clinicId}/detailed?${queryParams.toString()}`);
  return response.data as ApiResponse<any>;
};

export interface HomepageContentPayload {
  title: string;
  sectionKey: string;
  type: 'text' | 'image' | 'video';
  data: Record<string, unknown>;
  order?: number;
  visible?: boolean;
  note?: string;
}

export const getHomepageContentBlocks = async (params?: { status?: ContentStatus; sectionKey?: string; visible?: boolean; }): Promise<ApiResponse<HomepageContentBlock[]>> => {
  const query = new URLSearchParams();
  if (params?.status) query.append('status', params.status);
  if (params?.sectionKey) query.append('sectionKey', params.sectionKey);
  if (typeof params?.visible !== 'undefined') query.append('visible', String(params.visible));
  const response = await api.get(`/api/v1/admin/homepage/blocks?${query.toString()}`);
  return response.data as ApiResponse<HomepageContentBlock[]>;
};

export const createHomepageContentBlock = async (payload: HomepageContentPayload): Promise<ApiResponse<HomepageContentBlock>> => {
  const response = await api.post('/api/v1/admin/homepage/blocks', payload);
  return response.data as ApiResponse<HomepageContentBlock>;
};

export const updateHomepageContentBlock = async (id: string, payload: Partial<HomepageContentPayload & { status?: string }>): Promise<ApiResponse<HomepageContentBlock>> => {
  const response = await api.put(`/api/v1/admin/homepage/blocks/${id}`, payload);
  return response.data as ApiResponse<HomepageContentBlock>;
};

export const deleteHomepageContentBlock = async (id: string): Promise<ApiResponse<null>> => {
  const response = await api.delete(`/api/v1/admin/homepage/blocks/${id}`);
  return response.data as ApiResponse<null>;
};

export const publishHomepageContentBlock = async (id: string): Promise<ApiResponse<HomepageContentBlock>> => {
  const response = await api.post(`/api/v1/admin/homepage/blocks/${id}/publish`);
  return response.data as ApiResponse<HomepageContentBlock>;
};

export const submitHomepageContentBlock = async (id: string): Promise<ApiResponse<HomepageContentBlock>> => {
  const response = await api.post(`/api/v1/admin/homepage-content/${id}/submit`);
  return response.data as ApiResponse<HomepageContentBlock>;
};

export const approveHomepageContentBlock = async (id: string): Promise<ApiResponse<HomepageContentBlock>> => {
  const response = await api.post(`/api/v1/admin/homepage-content/${id}/approve`);
  return response.data as ApiResponse<HomepageContentBlock>;
};

export const rejectHomepageContentBlock = async (id: string, comment?: string): Promise<ApiResponse<HomepageContentBlock>> => {
  const response = await api.post(`/api/v1/admin/homepage-content/${id}/reject`, { comment });
  return response.data as ApiResponse<HomepageContentBlock>;
};

// Removed duplicate publishHomepageContentBlock for /homepage-content

export const scheduleHomepageContentBlock = async (id: string, payload: { scheduledFor?: string; scheduledTo?: string; timezone?: string; }): Promise<ApiResponse<HomepageContentBlock>> => {
  const response = await api.post(`/api/v1/admin/homepage-content/${id}/schedule`, payload);
  return response.data as ApiResponse<HomepageContentBlock>;
};

export const getHomepageContentVersions = async (id: string): Promise<ApiResponse<ContentVersion[]>> => {
  const response = await api.get(`/api/v1/admin/homepage-content/${id}/versions`);
  return response.data as ApiResponse<ContentVersion[]>;
};

export const revertHomepageContentVersion = async (id: string, versionId: string): Promise<ApiResponse<HomepageContentBlock>> => {
  const response = await api.post(`/api/v1/admin/homepage-content/${id}/versions/${versionId}/revert`);
  return response.data as ApiResponse<HomepageContentBlock>;
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
  getClinicDetailedData,
  getHomepageContentBlocks,
  createHomepageContentBlock,
  updateHomepageContentBlock,
  deleteHomepageContentBlock,
  submitHomepageContentBlock,
  approveHomepageContentBlock,
  rejectHomepageContentBlock,
  publishHomepageContentBlock,
  scheduleHomepageContentBlock,
  getHomepageContentVersions,
  revertHomepageContentVersion
};