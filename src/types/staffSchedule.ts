export type ShiftType = 'morning' | 'afternoon' | 'evening' | 'night' | 'full-day';
export type ScheduleStatus = 'scheduled' | 'completed' | 'cancelled' | 'no-show';

export interface RecurringPattern {
  frequency: 'daily' | 'weekly' | 'monthly';
  interval?: number;
  endDate?: string;
  daysOfWeek?: number[];
}

export interface ScheduleNotifications {
  // Backend-compatible shape
  email?: boolean;
  sms?: boolean;
  inApp?: boolean;
  reminderTime?: number;
  // UI-friendly shape (optional)
  enabled?: boolean;
  channels?: {
    email?: boolean;
    sms?: boolean;
    inApp?: boolean;
  };
}

export interface StaffRef {
  _id: string;
  firstName: string;
  lastName: string;
  role: string;
  email: string;
  phone?: string;
}

export interface ClinicRef {
  _id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
}

export interface StaffSchedule {
  _id: string;
  staffId: StaffRef | string; // populated document or ObjectId
  clinicId: ClinicRef | string; // populated document or ObjectId
  date: string; // ISO date string
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  shiftType: ShiftType;
  status: ScheduleStatus;
  notes?: string;
  isRecurring: boolean;
  recurringPattern?: RecurringPattern;
  notifications?: ScheduleNotifications;
}

export interface CreateStaffSchedulePayload {
  staffId: string;
  clinicId: string;
  date: string;
  startTime: string;
  endTime: string;
  shiftType: ShiftType;
  notes?: string;
  isRecurring?: boolean;
  recurringPattern?: RecurringPattern;
  notifications?: ScheduleNotifications;
}

export interface UpdateStaffSchedulePayload {
  date?: string;
  startTime?: string;
  endTime?: string;
  shiftType?: ShiftType;
  status?: ScheduleStatus;
  notes?: string;
  isRecurring?: boolean;
  recurringPattern?: RecurringPattern;
  notifications?: ScheduleNotifications;
}

export interface StaffAvailabilityEntry {
  staff: StaffRef & { id?: string };
  isScheduled: boolean;
  schedule: {
    id: string;
    startTime: string;
    endTime: string;
    shiftType: ShiftType;
    status: ScheduleStatus;
  } | null;
}

export interface StaffAvailabilityResponseData {
  date: string;
  clinic?: string;
  availability: StaffAvailabilityEntry[];
}

export interface ScheduleAnalytics {
  dateRange: { start: string | Date; end: string | Date };
  scheduleStats: Array<{ _id: string; count: number }>;
  shiftDistribution: Array<{ _id: string; count: number }>;
  staffUtilization: Array<{
    staffName: string;
    role: string;
    totalShifts: number;
    totalHours: number;
  }>;
}