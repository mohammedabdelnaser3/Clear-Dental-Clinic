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
  dentistId?: string; // Made optional - can get slots for all dentists in clinic
  clinicId: string; // Required parameter
  date: string;     // Required parameter
  duration?: number; // Optional parameter with default value in backend
}
export interface ConflictCheckRequest {
  date: string;
  timeSlot: string;
  clinicId: string;
  dentistId?: string;
  excludeAppointmentId?: string;
}
class AppointmentService {
  async getAppointments(params?: Record<string, unknown>): Promise<unknown> {
    try {
      const response = await api.get('/api/v1/appointments', { params });
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
      const response = await api.get('/api/v1/appointments', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching user appointment history:', error);
      return { data: [] }; // Return empty data instead of throwing
    }
  }
  async getAppointment(id: string): Promise<Appointment> {
    try {
      const response = await api.get(`/api/v1/appointments/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching appointment:', error);
      throw error;
    }
  }
  async createAppointment(data: CreateAppointmentDto): Promise<Appointment> {
    try {
      // Debug authentication status
      const token = localStorage.getItem('token');
      console.log('🔐 Authentication Debug:', {
        hasToken: !!token,
        tokenLength: token?.length || 0,
        tokenStart: token?.substring(0, 20) + '...',
        requestData: data
      });
      
      console.log('📤 Starting appointment creation request...');
      const startTime = Date.now();
      
      const response = await api.post('/api/v1/appointments', data);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      console.log(`✅ Appointment creation completed in ${duration}ms`);
      
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

  async autoBookFirstAvailable(data: {
    patientId: string;
    clinicId: string;
    serviceType: string;
    date: string;
    duration?: number;
    notes?: string;
    emergency?: boolean;
  }): Promise<{
    success: boolean;
    appointment?: Appointment;
    bookedSlot?: {
      time: string;
      dentistName: string;
      dentistSpecialization?: string;
    };
    message: string;
  }> {
    try {
      const response = await api.post('/api/v1/appointments/auto-book', data);
      return {
        success: true,
        appointment: response.data.data.appointment,
        bookedSlot: response.data.data.bookedSlot,
        message: response.data.message
      };
    } catch (error: any) {
      console.error('Error auto-booking appointment:', {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        data: error.response?.data
      });
      
      // Return structured error response
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to auto-book appointment'
      };
    }
  }
  async updateAppointment(id: string, data: UpdateAppointmentDto): Promise<Appointment> {
    try {
      console.log('Updating appointment:', { id, data });
      const response = await api.put(`/api/v1/appointments/${id}`, data);
      return response.data;
    } catch (error: any) {
      // Log error with more details
      console.error('Error updating appointment:', {
        appointmentId: id,
        updateData: data,
        message: error.message,
        code: error.code,
        status: error.response?.status,
        responseData: error.response?.data,
        responseText: error.response?.statusText
      });
      
      // Handle specific error statuses
      if (error.response?.status === 404) {
        console.error(`Appointment with ID ${id} not found. It may have been deleted or never existed.`);
      } else if (error.response?.status === 500) {
        console.error('Server error occurred during appointment update. This may be a backend validation or processing issue.');
        if (error.response?.data?.message) {
          console.error('Server error message:', error.response.data.message);
        }
      }
      
      throw error;
    }
  }
  async deleteAppointment(id: string): Promise<void> {
    try {
      await api.delete(`/api/v1/appointments/${id}`);
    } catch (error) {
      console.error('Error deleting appointment:', error);
      throw error;
    }
  }
  // Add to appointmentService.ts
  
  // Cache for time slots to reduce API calls
  private timeSlotCache: Record<string, { slots: TimeSlot[], timestamp: number }> = {};
  private pendingRequests: Record<string, Promise<TimeSlot[]>> = {};
  
  // Debounced time slot fetching to prevent excessive API calls
  private debounceTimers: Record<string, NodeJS.Timeout> = {};
  
  // Enhanced getAvailableTimeSlots with caching, debouncing and improved error handling
  async getAvailableTimeSlots(params: TimeSlotRequest, debounceMs: number = 300): Promise<TimeSlot[]> {
    try {
      // Validate required parameters - dentistId is optional, will be auto-assigned by backend
      if (!params.clinicId || !params.date) {
        console.error('Missing required parameters for time slots:', params);
        // Return empty array instead of throwing error to prevent blocking UI
        return [];
      }
      
      // Validate date format
      if (!/^\d{4}-\d{2}-\d{2}$/.test(params.date)) {
        if (import.meta.env.DEV) {
          console.error('Invalid date format:', params.date);
        }
        // Return empty array instead of throwing error
        return [];
      }
      
      // Create cache key from parameters
      const cacheKey = `${params.date}-${params.dentistId || 'any'}-${params.clinicId}-${params.duration || 30}`;
      
      // Check if we have cached data less than 3 minutes old
      const cachedData = this.timeSlotCache[cacheKey];
      const cacheExpiry = 3 * 60 * 1000; // 3 minutes
      
      if (cachedData && (Date.now() - cachedData.timestamp) < cacheExpiry) {
        console.log('Using cached time slots for:', cacheKey);
        return cachedData.slots;
      }
      
      // Check if there's already a pending request for this key
      if (Object.prototype.hasOwnProperty.call(this.pendingRequests, cacheKey)) {
        console.log('Waiting for pending request:', cacheKey);
        return this.pendingRequests[cacheKey];
      }
      
      // Implement debouncing
      if (debounceMs > 0) {
        return new Promise((resolve, reject) => {
          // Clear existing timer
          if (this.debounceTimers[cacheKey]) {
            clearTimeout(this.debounceTimers[cacheKey]);
          }
          
          // Set new timer
          this.debounceTimers[cacheKey] = setTimeout(async () => {
            try {
              const result = await this._fetchTimeSlots(params, cacheKey);
              resolve(result);
            } catch (error) {
              reject(error);
            } finally {
              delete this.debounceTimers[cacheKey];
            }
          }, debounceMs);
        });
      }
      
      // No debouncing, fetch immediately
      return await this._fetchTimeSlots(params, cacheKey);
    } catch (error) {
      console.error('Error in getAvailableTimeSlots:', error);
      return [];
    }
  }
  
  // Private method to handle the actual fetching logic
  private async _fetchTimeSlots(params: TimeSlotRequest, cacheKey: string): Promise<TimeSlot[]> {
    try {
      
      // Add this request to pending requests to prevent duplicates
      const pendingPromise = this._performTimeslotFetch(params, cacheKey);
      this.pendingRequests[cacheKey] = pendingPromise;
      
      try {
        const result = await pendingPromise;
        return result;
      } finally {
        // Clean up pending request
        delete this.pendingRequests[cacheKey];
      }
    } catch (error) {
      console.error('Error in _fetchTimeSlots:', error);
      
      // Return cached data if available as fallback
      const cachedData = this.timeSlotCache[cacheKey];
      if (cachedData) {
        console.warn('Using cached data as fallback due to fetch error');
        return cachedData.slots;
      }
      
      return [];
    }
  }
  
  // Performs the actual API request
  private async _performTimeslotFetch(params: TimeSlotRequest, cacheKey: string): Promise<TimeSlot[]> {
    // Set timeout for API request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
    
    try {
      // Fetch from API
        const response = await api.get('/api/v1/appointments/available-slots', { 
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
      
      // Check for specific messages about no dentists
      const responseMessage = response.data?.message || response.data?.data?.message || '';
      if (availableSlots.length === 0) {
        console.warn('No time slots returned from API:', {
          cacheKey,
          responseMessage,
          clinicId: params.clinicId,
          date: params.date
        });
        
        // Don't cache empty results if it's due to no dentists
        if (responseMessage.includes('dentist') || responseMessage.includes('No dentists')) {
          console.warn('Empty slots due to no dentists - not caching result');
          throw new Error('No dentists available for this clinic. Please contact administration to assign dentists or select a different clinic.');
        }
      }
        
        // Ensure all slots have the isPeak property defined
        availableSlots = availableSlots.map(slot => ({
          ...slot,
          isPeak: slot.isPeak !== undefined ? slot.isPeak : false
        }));
        
      // Only cache non-empty results or when we have a valid reason for empty results
      if (availableSlots.length > 0 || !responseMessage.includes('dentist')) {
        this.timeSlotCache[cacheKey] = {
          slots: availableSlots,
          timestamp: Date.now()
        };
      }
        
      console.log('Successfully fetched time slots:', { 
        cacheKey, 
        slotsCount: availableSlots.length,
        cached: availableSlots.length > 0 || !responseMessage.includes('dentist')
      });
        return availableSlots;
    } catch (fetchError: any) {
        clearTimeout(timeoutId);
        
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.warn('Time slot request timed out');
        throw new Error('Request timed out. Please try again.');
      }
      
      console.error('API request failed:', fetchError);
      throw fetchError;
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
      
      // Also clear pending requests and timers for this date and clinic
      Object.keys(this.pendingRequests).forEach(key => {
        if (key.startsWith(`${date}-`) && key.includes(`-${clinicId}-`)) {
          delete this.pendingRequests[key];
        }
      });
      
      Object.keys(this.debounceTimers).forEach(key => {
        if (key.startsWith(`${date}-`) && key.includes(`-${clinicId}-`)) {
          clearTimeout(this.debounceTimers[key]);
          delete this.debounceTimers[key];
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
      
      // Also clear pending requests and timers for this date
      Object.keys(this.pendingRequests).forEach(key => {
        if (key.startsWith(`${date}-`)) {
          delete this.pendingRequests[key];
        }
      });
      
      Object.keys(this.debounceTimers).forEach(key => {
        if (key.startsWith(`${date}-`)) {
          clearTimeout(this.debounceTimers[key]);
          delete this.debounceTimers[key];
        }
      });
    } else {
      // Clear all cache, pending requests, and timers
      console.log('Clearing all time slot cache and pending operations');
      this.timeSlotCache = {};
      this.pendingRequests = {};
      
      // Clear all debounce timers
      Object.values(this.debounceTimers).forEach(timer => clearTimeout(timer));
      this.debounceTimers = {};
    }
  }
  
  // Method to cancel pending operations for cleanup
  cancelPendingOperations(): void {
    console.log('Cancelling all pending time slot operations');
    
    // Clear all pending requests
    this.pendingRequests = {};
    
    // Clear all debounce timers
    Object.values(this.debounceTimers).forEach(timer => clearTimeout(timer));
    this.debounceTimers = {};
  }
  
  
  async getNextSlotAfterLastBooking(params: {
    date: string;
    clinicId: string;
    duration?: number;
  }): Promise<TimeSlot | null> {
    try {
      // Validate required parameters
      if (!params.date || !params.clinicId) {
        console.error('Missing required parameters for next slot request:', params);
        return null;
      }
      
      // Validate date format
      if (!/^\d{4}-\d{2}-\d{2}$/.test(params.date)) {
        if (import.meta.env.DEV) {
          console.error('Invalid date format:', params.date);
        }
        return null;
      }
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
      
      try {
        const response = await api.get('/api/v1/appointments/next-slot-after-last', { 
          params,
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        console.log('Next slot response:', response.data);
        
        return response.data.data.nextSlot;
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          console.warn('Next slot request timed out');
          return null;
        }
        
        console.error('API request for next slot failed:', fetchError);
        return null;
      }
    } catch (error) {
      console.error('Error getting next slot after last booking:', error);
      return null;
    }
  }
  
  async checkTimeSlotConflict(params: ConflictCheckRequest): Promise<boolean> {
    try {
      // Validate required parameters
      if (!params.date || !params.timeSlot || !params.clinicId) {
        console.error('Missing required parameters for conflict check:', params);
        throw new Error('Missing required parameters for conflict check');
      }
      
      // Validate date format (YYYY-MM-DD)
      if (!/^\d{4}-\d{2}-\d{2}$/.test(params.date)) {
        if (import.meta.env.DEV) {
          console.error('Invalid date format:', params.date);
        }
        throw new Error('Invalid date format. Expected YYYY-MM-DD');
      }
      
      // Validate time slot format (HH:mm)
      if (!/^\d{2}:\d{2}$/.test(params.timeSlot)) {
        if (import.meta.env.DEV) {
          console.error('Invalid time slot format:', params.timeSlot);
        }
        throw new Error('Invalid time slot format. Expected HH:mm');
      }
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
      
      try {
        const response = await api.get('/api/v1/appointments/check-conflict', { 
          params,
          signal: controller.signal
        });
        console.log('Conflict check response:', response.data);
        clearTimeout(timeoutId);
        
        // Handle specific case where no dentists are available
        const responseMessage = response.data?.message || '';
        if (responseMessage.includes('No dentists in clinic')) {
          console.warn('Conflict check: No dentists available in clinic');
          throw new Error('No dentists available for this clinic. Please contact administration to assign dentists or select a different clinic.');
        }
        
        return response.data.hasConflict || false;
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          console.warn('Conflict check request timed out');
          throw new Error('Time slot conflict check timed out. Please try again.');
        }
        
        if (fetchError.response && fetchError.response.status === 403) {
          console.error('Permission denied for conflict check - stopping booking process');
          throw new Error('You do not have permission to check availability. Please log in.');
        }
        
        if (fetchError.response && fetchError.response.status === 401) {
          console.error('Authentication failed for conflict check');
          throw new Error('Authentication failed. Please log in again.');
        }
        
        throw fetchError;
      }
    } catch (error) {
      console.error('Error checking time slot conflict:', error);
      // Re-throw the error instead of returning false to stop the booking process
      throw error;
    }
  }

  /**
   * Get booked time slots for a specific date and clinic/doctor
   * @param date - Date in YYYY-MM-DD format
   * @param clinicId - Clinic ID
   * @param doctorId - Optional doctor ID for filtering
   * @returns Array of booked time slots in HH:MM format
   */
  async getBookedSlots(date: string, clinicId: string, doctorId?: string): Promise<string[]> {
    try {
      // Validate parameters
      if (!date || !clinicId) {
        if (import.meta.env.DEV) {
          console.error('Missing required parameters for booked slots:', { date, clinicId });
        }
        return [];
      }

      // Validate date format
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        if (import.meta.env.DEV) {
          console.error('Invalid date format:', date);
        }
        return [];
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

      try {
        const params: any = { date, clinicId };
        if (doctorId) {
          params.doctorId = doctorId;
        }

        const response = await api.get('/api/v1/appointments/booked-slots', {
          params,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        console.log('Booked slots response:', response.data);

        return response.data.data?.bookedSlots || [];
      } catch (fetchError: any) {
        clearTimeout(timeoutId);

        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          console.warn('Booked slots request timed out');
          return [];
        }

        console.error('API request for booked slots failed:', fetchError);
        return [];
      }
    } catch (error) {
      console.error('Error getting booked slots:', error);
      return [];
    }
  }
}

export const appointmentService = new AppointmentService();