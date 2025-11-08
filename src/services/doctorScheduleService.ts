import api from './api';

export interface DoctorSchedule {
  _id: string;
  doctorId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    specialization?: string;
  };
  clinicId: {
    _id: string;
    name: string;
    branchName?: string;
  };
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  slotDuration: number; // in minutes
  isActive: boolean;
  effectiveFrom: string;
  effectiveUntil?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AvailableDoctor {
  doctorId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    specialization?: string;
  };
  startTime: string;
  endTime: string;
  slotDuration: number;
}

export interface CreateScheduleData {
  doctorId: string;
  clinicId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDuration: number;
  isActive?: boolean;
  effectiveFrom?: string;
  effectiveUntil?: string;
}

export interface UpdateScheduleData extends Partial<CreateScheduleData> {}

class DoctorScheduleService {
  /**
   * Get all doctor schedules with optional filters
   */
  async getAllSchedules(filters?: {
    doctorId?: string;
    clinicId?: string;
    dayOfWeek?: number;
    isActive?: boolean;
  }): Promise<{ data: DoctorSchedule[]; count: number }> {
    const params = new URLSearchParams();
    if (filters?.doctorId) params.append('doctorId', filters.doctorId);
    if (filters?.clinicId) params.append('clinicId', filters.clinicId);
    if (filters?.dayOfWeek !== undefined) params.append('dayOfWeek', filters.dayOfWeek.toString());
    if (filters?.isActive !== undefined) params.append('isActive', filters.isActive.toString());

    const response = await api.get(`/schedules?${params.toString()}`);
    return response.data;
  }

  /**
   * Get a single schedule by ID
   */
  async getScheduleById(id: string): Promise<DoctorSchedule> {
    const response = await api.get(`/schedules/${id}`);
    return response.data.data;
  }

  /**
   * Get all schedules for a specific doctor
   */
  async getSchedulesByDoctor(doctorId: string): Promise<DoctorSchedule[]> {
    const response = await api.get(`/schedules/doctor/${doctorId}`);
    return response.data.data;
  }

  /**
   * Get all schedules for a specific clinic
   */
  async getSchedulesByClinic(clinicId: string): Promise<DoctorSchedule[]> {
    const response = await api.get(`/schedules/clinic/${clinicId}`);
    return response.data.data;
  }

  /**
   * Get available doctors for a specific clinic and day of week
   */
  async getAvailableDoctors(clinicId: string, dayOfWeek: number): Promise<AvailableDoctor[]> {
    const response = await api.get(`/schedules/available`, {
      params: { clinicId, dayOfWeek }
    });
    return response.data.data;
  }

  /**
   * Get available doctors for a specific clinic and date
   * This converts the date to day of week and calls the API
   */
  async getAvailableDoctorsForDate(clinicId: string, date: Date): Promise<AvailableDoctor[]> {
    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    return this.getAvailableDoctors(clinicId, dayOfWeek);
  }

  /**
   * Create a new doctor schedule
   */
  async createSchedule(data: CreateScheduleData): Promise<DoctorSchedule> {
    const response = await api.post('/schedules', data);
    return response.data.data;
  }

  /**
   * Bulk create doctor schedules
   */
  async bulkCreateSchedules(schedules: CreateScheduleData[]): Promise<DoctorSchedule[]> {
    const response = await api.post('/schedules/bulk', schedules);
    return response.data.data;
  }

  /**
   * Update a doctor schedule
   */
  async updateSchedule(id: string, data: UpdateScheduleData): Promise<DoctorSchedule> {
    const response = await api.put(`/schedules/${id}`, data);
    return response.data.data;
  }

  /**
   * Delete a doctor schedule
   */
  async deleteSchedule(id: string): Promise<void> {
    await api.delete(`/schedules/${id}`);
  }

  /**
   * Helper: Get day name from day number
   */
  getDayName(dayOfWeek: number): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayOfWeek] || 'Unknown';
  }

  /**
   * Helper: Get day number from date
   */
  getDayOfWeekFromDate(date: Date | string): number {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.getDay();
  }

  /**
   * Helper: Format time slots for display
   */
  formatTimeSlot(time: string): string {
    // Convert 24-hour format to 12-hour format with AM/PM
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  }

  /**
   * Helper: Generate time slots between start and end time
   */
  generateTimeSlots(startTime: string, endTime: string, slotDuration: number): string[] {
    const slots: string[] = [];
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    const startInMinutes = startHour * 60 + startMinute;
    const endInMinutes = endHour * 60 + endMinute;

    for (let time = startInMinutes; time + slotDuration <= endInMinutes; time += slotDuration) {
      const hour = Math.floor(time / 60);
      const minute = time % 60;
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      slots.push(timeString);
    }

    return slots;
  }
}

export const doctorScheduleService = new DoctorScheduleService();
export default doctorScheduleService;

/**
 * Helper function to get available doctors for a specific day
 * Returns the schedules as DoctorSchedule[] for compatibility
 */
export const getAvailableDoctorsForDay = async (
  clinicId: string,
  date: Date
): Promise<{ success: boolean; data: DoctorSchedule[]; message: string }> => {
  try {
    const dayOfWeek = date.getDay();
    const response = await api.get(`/api/v1/schedules/available`, {
      params: { clinicId, dayOfWeek }
    });
    
    // The backend returns a data array with the schedule information
    return {
      success: true,
      data: response.data.data || [],
      message: 'Available doctors retrieved successfully'
    };
  } catch (error: any) {
    if (import.meta.env.DEV) {
      console.error('Error getting available doctors:', error);
    }
    return {
      success: false,
      data: [],
      message: error.response?.data?.message || 'Failed to get available doctors'
    };
  }
};

