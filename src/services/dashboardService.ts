import api from './api';
import type { ApiResponse } from '../types';
import { createSafeApiParams } from '../utils/clinicUtils';

// Dashboard data types
export interface DashboardStats {
  appointments: {
    total: number;
    today: number;
    upcoming: number;
    completed: number;
    cancelled: number;
    noShow: number;
  };
  patients: {
    total: number;
    new: number;
    active: number;
    byGender: {
      male: number;
      female: number;
      other: number;
    };
    byAgeGroup: {
      '0-18': number;
      '19-35': number;
      '36-50': number;
      '51-65': number;
      '65+': number;
    };
  };
  revenue: {
    total: number;
    thisMonth: number;
    lastMonth: number;
    pending: number;
    overdue: number;
  };
  activities: {
    recentAppointments: any[];
    recentPatients: any[];
    upcomingAppointments: any[];
  };
}

export interface RecentActivity {
  id: string;
  type: 'appointment' | 'patient' | 'treatment' | 'billing';
  title: string;
  description: string;
  timestamp: string;
  status?: string;
}

// Get dashboard statistics
export const getDashboardStats = async (clinicId?: string): Promise<ApiResponse<DashboardStats>> => {
  try {
    // If no clinicId is provided, get overall statistics for admin users
    if (!clinicId) {
      try {
        const overallStats = await api.get('/api/v1/clinics/statistics/overall');
        
        const dashboardData: DashboardStats = {
          appointments: {
            total: overallStats.data.data?.appointments?.total || 0,
            today: overallStats.data.data?.appointments?.today || 0,
            upcoming: overallStats.data.data?.appointments?.upcoming || 0,
            completed: overallStats.data.data?.appointments?.completed || 0,
            cancelled: overallStats.data.data?.appointments?.cancelled || 0,
            noShow: 0 // Not included in overall stats yet
          },
          patients: {
            total: overallStats.data.data?.patients?.total || 0,
            new: overallStats.data.data?.patients?.newThisMonth || 0,
            active: overallStats.data.data?.patients?.total || 0,
            byGender: {
              male: 0,
              female: 0,
              other: 0
            },
            byAgeGroup: {
              '0-18': 0,
              '19-35': 0,
              '36-50': 0,
              '51-65': 0,
              '65+': 0
            }
          },
          revenue: {
            total: overallStats.data.data?.revenue?.thisMonth || 0,
            thisMonth: overallStats.data.data?.revenue?.thisMonth || 0,
            lastMonth: overallStats.data.data?.revenue?.lastMonth || 0,
            pending: 0,
            overdue: 0
          },
          activities: {
            recentAppointments: [],
            recentPatients: [],
            upcomingAppointments: []
          }
        };

        return {
          success: true,
          data: dashboardData,
          message: 'Overall dashboard statistics retrieved successfully'
        };
      } catch (authError: any) {
        // If authentication fails, return empty data with appropriate message
        console.warn('Failed to fetch overall statistics, likely due to authentication:', authError.response?.status);
        
        const emptyDashboardData: DashboardStats = {
          appointments: { total: 0, today: 0, upcoming: 0, completed: 0, cancelled: 0, noShow: 0 },
          patients: { 
            total: 0, new: 0, active: 0, 
            byGender: { male: 0, female: 0, other: 0 },
            byAgeGroup: { '0-18': 0, '19-35': 0, '36-50': 0, '51-65': 0, '65+': 0 }
          },
          revenue: { total: 0, thisMonth: 0, lastMonth: 0, pending: 0, overdue: 0 },
          activities: { recentAppointments: [], recentPatients: [], upcomingAppointments: [] }
        };

        return {
          success: true,
          data: emptyDashboardData,
          message: 'Please log in as an admin to view overall statistics'
        };
      }
    }
    
    const params = createSafeApiParams(clinicId);
    
    // Log the parameters being sent for debugging (development only)
    if (import.meta.env.DEV) {
      console.log('🔍 getDashboardStats params:', params, 'original clinicId:', clinicId);
    }
    
    // Fetch data from multiple endpoints in parallel with error handling
    const results = await Promise.allSettled([
      api.get('/api/v1/appointments/statistics', { params }),
      api.get('/api/v1/patients/statistics', { params }),
      api.get('/api/v1/billing/stats/revenue', { params }),
      api.get('/api/v1/appointments/today', { params }),
      api.get('/api/v1/appointments/upcoming', { params: { ...params, days: 7 } }),
      api.get('/api/v1/patients/recent', { params: { ...params, limit: 5 } })
    ]);
    
    // Extract successful responses or provide empty defaults with better error handling
    const appointmentStats = results[0].status === 'fulfilled' ? results[0].value : { data: { data: {} } };
    const patientStats = results[1].status === 'fulfilled' ? results[1].value : { data: { data: {} } };
    const revenueStats = results[2].status === 'fulfilled' ? results[2].value : { data: { data: {} } };
    const todayAppointments = results[3].status === 'fulfilled' ? results[3].value : { data: { data: [] } };
    const upcomingAppointments = results[4].status === 'fulfilled' ? results[4].value : { data: { data: [] } };
    const recentPatients = results[5].status === 'fulfilled' ? results[5].value : { data: { data: [] } };

    // Log failed requests for debugging
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        const endpoints = ['appointments/statistics', 'patients/statistics', 'billing/stats/revenue', 'appointments/today', 'appointments/upcoming', 'patients/recent'];
        console.warn(`Failed to fetch ${endpoints[index]}:`, result.reason?.response?.status, result.reason?.response?.data);
      }
    });

    // Combine all the data
    const dashboardData: DashboardStats = {
      appointments: {
        total: appointmentStats.data.data?.total || 0,
        today: todayAppointments.data.data?.length || 0,
        upcoming: upcomingAppointments.data.data?.length || 0,
        completed: appointmentStats.data.data?.completed || 0,
        cancelled: appointmentStats.data.data?.cancelled || 0,
        noShow: appointmentStats.data.data?.noShow || 0
      },
      patients: {
        total: patientStats.data.data?.total || 0,
        new: patientStats.data.data?.newThisMonth || 0,
        active: patientStats.data.data?.active || 0,
        byGender: {
          male: patientStats.data.data?.byGender?.male || 0,
          female: patientStats.data.data?.byGender?.female || 0,
          other: patientStats.data.data?.byGender?.other || 0
        },
        byAgeGroup: {
          '0-18': patientStats.data.data?.byAgeGroup?.['0-18'] || 0,
          '19-35': patientStats.data.data?.byAgeGroup?.['19-35'] || 0,
          '36-50': patientStats.data.data?.byAgeGroup?.['36-50'] || 0,
          '51-65': patientStats.data.data?.byAgeGroup?.['51-65'] || 0,
          '65+': patientStats.data.data?.byAgeGroup?.['65+'] || 0
        }
      },
      revenue: {
        total: revenueStats.data.data?.total || 0,
        thisMonth: revenueStats.data.data?.thisMonth || 0,
        lastMonth: revenueStats.data.data?.lastMonth || 0,
        pending: revenueStats.data.data?.pending || 0,
        overdue: revenueStats.data.data?.overdue || 0
      },
      activities: {
        recentAppointments: Array.isArray(todayAppointments.data.data) ? todayAppointments.data.data : [],
        recentPatients: Array.isArray(recentPatients.data.data) ? recentPatients.data.data : [],
        upcomingAppointments: Array.isArray(upcomingAppointments.data.data) ? upcomingAppointments.data.data.slice(0, 5) : []
      }
    };

    return {
      success: true,
      data: dashboardData,
      message: 'Dashboard statistics retrieved successfully'
    };
  } catch (error: any) {
    if (import.meta.env.DEV) {
      console.error('Error fetching dashboard stats:', error);
    }
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to fetch dashboard statistics',
      error: error.response?.data?.error || error.message
    };
  }
};

// Get recent activities
export const getRecentActivities = async (limit: number = 10, clinicId?: string): Promise<ApiResponse<RecentActivity[]>> => {
  try {
    // If no clinicId is provided, get overall activities for admin users
    if (!clinicId) {
      const token = localStorage.getItem('token');
      if (!token) {
        return {
          success: true,
          data: [],
          message: 'Please log in to view activities'
        };
      }
      try {
        const userResponse = await api.get('/api/v1/auth/me');
        const userRole = userResponse.data?.role;
        if (userRole === 'admin' || userRole === 'dentist') {
          // Use Promise.allSettled to handle partial failures
          const results = await Promise.allSettled([
            api.get('/api/v1/appointments/recent/overall', { params: { limit } }),
            api.get('/api/v1/patients/recent/overall', { params: { limit } })
          ]);
          
          // Extract successful responses
          const recentAppointments = results[0].status === 'fulfilled' ? results[0].value : { data: { data: [] } };
          const recentPatients = results[1].status === 'fulfilled' ? results[1].value : { data: { data: [] } };
          
          const activities: RecentActivity[] = [];

          // Add recent appointments
          if (recentAppointments.data.data) {
            recentAppointments.data.data.forEach((appointment: any) => {
              activities.push({
                id: appointment._id,
                type: 'appointment',
                title: `Appointment with ${appointment.patient?.firstName} ${appointment.patient?.lastName}`,
                description: `${appointment.treatmentType} - ${appointment.status}`,
                timestamp: appointment.createdAt,
                status: appointment.status
              });
            });
          }

        // Add recent patients
        if (recentPatients.data.data) {
          recentPatients.data.data.forEach((patient: any) => {
            activities.push({
              id: patient._id,
              type: 'patient',
              title: `New Patient: ${patient.firstName} ${patient.lastName}`,
              description: `Registered on ${new Date(patient.createdAt).toLocaleDateString()}`,
              timestamp: patient.createdAt
            });
          });
        }

          // Sort by timestamp (most recent first)
          activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

          return {
            success: true,
            data: activities.slice(0, limit),
            message: 'Overall recent activities retrieved successfully'
          };
        } else {
          // Return empty activities for non-admin/non-dentist users
          return {
            success: true,
            data: [],
            message: 'Access restricted: Overall activities are only available for admin or dentist roles'
          };
        }
      } catch (authError: any) {
        // If authentication fails, return empty activities with appropriate message
        console.warn('Failed to fetch overall activities, likely due to authentication:', authError.response?.status);
        
        return {
          success: true,
          data: [],
          message: 'Please log in as an admin to view overall activities'
        };
      }
    }
    
    const params = createSafeApiParams(clinicId, { limit });
    
    // Log the parameters being sent for debugging (development only)
    if (import.meta.env.DEV) {
      console.log('🔍 getRecentActivities params:', params);
    }
    
    // Fetch recent data from multiple endpoints with error handling
    const results = await Promise.allSettled([
      api.get('/api/v1/appointments/recent', { params }),
      api.get('/api/v1/patients/recent', { params })
    ]);
    
    // Log failed requests for debugging
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        const endpoints = ['appointments/recent', 'patients/recent'];
        console.warn(`Failed to fetch recent ${endpoints[index]}:`, result.reason?.response?.status, result.reason?.response?.data);
      }
    });
    
    // Extract successful responses
    const recentAppointments = results[0].status === 'fulfilled' ? results[0].value : { data: { data: [] } };
    const recentPatients = results[1].status === 'fulfilled' ? results[1].value : { data: { data: [] } };

    const activities: RecentActivity[] = [];

    // Add recent appointments
    if (recentAppointments.data && recentAppointments.data.data && Array.isArray(recentAppointments.data.data)) {
      recentAppointments.data.data.forEach((appointment: any) => {
        activities.push({
          id: appointment._id,
          type: 'appointment',
          title: `Appointment with ${appointment.patient?.firstName} ${appointment.patient?.lastName}`,
          description: `${appointment.treatmentType} - ${appointment.status}`,
          timestamp: appointment.createdAt,
          status: appointment.status
        });
      });
    }

    // Add recent patients
    if (recentPatients.data && recentPatients.data.data && Array.isArray(recentPatients.data.data)) {
      recentPatients.data.data.forEach((patient: any) => {
        activities.push({
          id: patient._id,
          type: 'patient',
          title: `New Patient: ${patient.firstName} ${patient.lastName}`,
          description: `Registered on ${new Date(patient.createdAt).toLocaleDateString()}`,
          timestamp: patient.createdAt
        });
      });
    }

    // Sort by timestamp (most recent first)
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return {
      success: true,
      data: activities.slice(0, limit),
      message: 'Recent activities retrieved successfully'
    };
  } catch (error: any) {
    if (import.meta.env.DEV) {
      console.error('Error fetching recent activities:', error);
    }
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to fetch recent activities',
      error: error.response?.data?.error || error.message
    };
  }
};

// Get billing summary
export const getBillingSummary = async (clinicId?: string): Promise<ApiResponse<any>> => {
  try {
    const params = createSafeApiParams(clinicId);
    const response = await api.get('/api/v1/billing/summary', { params });
    return response.data;
  } catch (error: any) {
    if (import.meta.env.DEV) {
      console.error('Error fetching billing summary:', error);
    }
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to fetch billing summary',
      error: error.response?.data?.error || error.message
    };
  }
};

// Get overdue bills
export const getOverdueBills = async (clinicId?: string): Promise<ApiResponse<any[]>> => {
  try {
    const params = createSafeApiParams(clinicId);
    const response = await api.get('/api/v1/billing/overdue', { params });
    return response.data;
  } catch (error: any) {
    if (import.meta.env.DEV) {
      console.error('Error fetching overdue bills:', error);
    }
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to fetch overdue bills',
      error: error.response?.data?.error || error.message
    };
  }
};