export interface Appointment {
  id: string;
  patientId: string;
  dentistId?: string; // Made optional
  clinicId: string;
  clinicName?: string;
  dentistName?: string;
  patientName?: string;
  serviceType: string;
  date: Date | string;
  timeSlot: string;
  duration: number; // in minutes
  status: AppointmentStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type AppointmentStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no-show';

export interface TimeSlot {
  id: string;
  time: string;
  isAvailable: boolean;
}

export interface AppointmentType {
  id: string;
  name: string;
  duration?: number; // in minutes
  description?: string;
  color?: string;
}