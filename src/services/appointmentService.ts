import api from './api';
import type { Appointment } from '../types';
export interface TimeSlot {
  time: string;
  available: boolean;
  dentistId?: string;
  isPeak?: boolean;
  startTime?: string;
  endTime?: string;
}
export interface CreateAppointmentDto {
  patientId: string;
  dentistId?: string;
  clinicId?: string;
  service: string;
  date: string;
  timeSlot: string;
  notes?: string;
  emergency?: boolean;
}
export interface UpdateAppointmentDto {
  patientId?: string;
  dentistId?: string;
  clinicId?: string;
  service?: string;
  date?: string;
  timeSlot?: string;
  notes?: string;
  emergency?: boolean;
  status?: string;
}
export interface TimeSlotRequest {
  dentistId: string; // Required parameter
  clinicId: string; // Required parameter
  date: string;     // Required parameter
  duration?: number; // Optional parameter with default value in backend
}
export interface ConflictCheckRequest {
  date: string;
  timeSlot: string;
  clinicId: string;
  excludeAppointmentId?: string;
}
class AppointmentService {
  async getAppointments(params?: Record<string, unknown>): Promise<unknown> {
    try {
      const response = await api.get('/appointments', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching appointments:', error);
      throw error;
    }
  }
  
  // Get user's appointment history for smart defaults
  async getUserAppointmentHistory(patientId: string, limit: number = 5): Promise<unknown> {
    try {
      const params = {
        patientId,
        limit,
        sort: 'createdAt',
        order: 'desc'
      };
      const response = await api.get('/appointments', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching user appointment history:', error);
      return { data: [] }; // Return empty data instead of throwing
    }
  }
  async getAppointment(id: string): Promise<Appointment> {
    try {
      const response = await api.get(`/appointments/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching appointment:', error);
      throw error;
    }
  }
  async createAppointment(data: CreateAppointmentDto): Promise<Appointment> {
    try {
      const response = await api.post('/appointments', data);
      return response.data;
    } catch (error: any) {
      // Log error with more details
      console.error('Error creating appointment:', {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        data: error.response?.data
      });
      
      // Handle 404 errors specifically
      if (error.response?.status === 404) {
        console.error('Appointment endpoint not found. The appointment service might be unavailable.');
      }
      
      throw error;
    }
  }
  async updateAppointment(id: string, data: UpdateAppointmentDto): Promise<Appointment> {
    try {
      const response = await api.put(`/appointments/${id}`, data);
      return response.data;
    } catch (error: any) {
      // Log error with more details
      console.error('Error updating appointment:', {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        data: error.response?.data
      });
      
      // Handle 404 errors specifically
      if (error.response?.status === 404) {
        console.error(`Appointment with ID ${id} not found. It may have been deleted or never existed.`);
      }
      
      throw error;
    }
  }
  async deleteAppointment(id: string): Promise<void> {
    try {
      await api.delete(`/appointments/${id}`);
    } catch (error) {
      console.error('Error deleting appointment:', error);
      throw error;
    }
  }
  // Add to appointmentService.ts
  
  // Cache for time slots to reduce API calls
  private timeSlotCache: Record<string, { slots: TimeSlot[], timestamp: number }> = {};
  
  // Enhanced getAvailableTimeSlots with caching and improved error handling
  async getAvailableTimeSlots(params: TimeSlotRequest): Promise<TimeSlot[]> {
    try {
      // Validate required parameters
      if (!params.dentistId || !params.clinicId || !params.date) {
        console.error('Missing required parameters for time slots:', params);
        throw new Error('Missing required parameters for time slots');
      }
      
      // Validate date format
      if (!/^\d{4}-\d{2}-\d{2}$/.test(params.date)) {
        console.error('Invalid date format:', params.date);
        throw new Error('Invalid date format. Expected YYYY-MM-DD');
      }
      
      // Create cache key from parameters
      const cacheKey = `${params.date}-${params.dentistId}-${params.clinicId}-${params.duration || 30}`;
      
      // Check if we have cached data less than 5 minutes old
      const cachedData = this.timeSlotCache[cacheKey];
      const cacheExpiry = 5 * 60 * 1000; // 5 minutes
      
      if (cachedData && (Date.now() - cachedData.timestamp) < cacheExpiry) {
        console.log('Using cached time slots for:', cacheKey);
        return cachedData.slots;
      }
      
      // Set timeout for API request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      try {
        // Fetch from API if no cache or cache expired
        const response = await api.get('/appointments/available-slots', { 
          params,
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        let availableSlots: TimeSlot[] = [];
        if (response.data?.data?.availableSlots) {
          availableSlots = response.data.data.availableSlots;
        } else if (Array.isArray(response.data)) {
          availableSlots = response.data;
        } else if (response.data?.availableSlots) {
          availableSlots = response.data.availableSlots;
        }
        
        // Ensure all slots have the isPeak property defined
        availableSlots = availableSlots.map(slot => ({
          ...slot,
          isPeak: slot.isPeak !== undefined ? slot.isPeak : false
        }));
        
        // Cache the results
        this.timeSlotCache[cacheKey] = {
          slots: availableSlots,
          timestamp: Date.now()
        };
        
        return availableSlots;
      } catch (fetchError) {
        clearTimeout(timeoutId);
        
        // If we have stale cache, use it as fallback
        if (cachedData) {
          console.warn('Using stale cache as fallback due to fetch error');
          return cachedData.slots;
        }
        
        // Re-throw the error if no fallback available
        throw fetchError;
      }
    } catch (error) {
      console.error('Error fetching time slots:', error);
      
      // Return empty array with a specific error flag for the UI to handle
      return [];
    }
  }
  
  // Enhanced method to clear cache when appointments are created/updated
  clearTimeSlotCache(date?: string, clinicId?: string): void {
    if (date && clinicId) {
      // Clear only cache entries for this date and clinic
      Object.keys(this.timeSlotCache).forEach(key => {
        if (key.startsWith(`${date}-`) && key.includes(`-${clinicId}-`)) {
          console.log('Clearing specific cache for date and clinic:', key);
          delete this.timeSlotCache[key];
        }
      });
    } else if (date) {
      // Clear only cache entries for this date
      Object.keys(this.timeSlotCache).forEach(key => {
        if (key.startsWith(`${date}-`)) {
          console.log('Clearing cache for date:', key);
          delete this.timeSlotCache[key];
        }
      });
    } else {
      // Clear all cache
      console.log('Clearing all time slot cache');
      this.timeSlotCache = {};
    }
  }
  
  async checkTimeSlotConflict(params: ConflictCheckRequest): Promise<boolean> {
    try {
      // Validate required parameters
      if (!params.date || !params.timeSlot || !params.clinicId) {
        console.error('Missing required parameters for conflict check:', params);
        throw new Error('Missing required parameters for conflict check');
      }
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
      
      try {
        const response = await api.get('/appointments/check-conflict', { 
          params,
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        return response.data.hasConflict || false;
      } catch (fetchError) {
        clearTimeout(timeoutId);
        
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          console.warn('Conflict check request timed out');
          return false; // Assume no conflict if request times out
        }
        
        throw fetchError;
      }
    } catch (error) {
      console.error('Error checking time slot conflict:', error);
      // Return false as a fallback to prevent blocking the user
      // The UI should show a warning that conflict checking failed
      return false;
    }
  }
}

export const appointmentService = new AppointmentService();