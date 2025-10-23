import type { User, UserRole } from './user';
import type { Clinic } from './clinic';
import type { Appointment } from './appointment';

/**
 * Dentist interface extending User with professional information
 */
export interface Dentist extends User {
  role: Extract<UserRole, 'dentist'>;
  specialization: string;
  licenseNumber: string;
  bio?: string;
  yearsOfExperience?: number;
  education?: string[];
  certifications?: string[];
  clinics?: Clinic[];
  clinicIds?: string[];
  primaryClinicId?: string;
  availability?: DentistAvailability;
  rating?: number;
  reviewCount?: number;
}

/**
 * Dentist profile data structure for display
 */
export interface DentistProfile {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone?: string;
  profileImage?: string;
  specialization: string;
  licenseNumber: string;
  bio?: string;
  yearsOfExperience?: number;
  education?: string[];
  certifications?: string[];
  rating?: number;
  reviewCount?: number;
  clinics: DentistClinicAssociation[];
  primaryClinicId?: string;
  availability?: DentistAvailability;
  statistics?: DentistStatistics;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Dentist settings form data structure
 */
export interface DentistSettings {
  // Personal information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth?: string;
  gender?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  
  // Professional information
  specialization: string;
  licenseNumber: string;
  bio?: string;
  yearsOfExperience?: number;
  education?: string[];
  certifications?: string[];
  
  // Clinic associations
  clinicIds: string[];
  primaryClinicId?: string;
  
  // Profile image
  profileImage?: string;
}

/**
 * Dentist clinic association with location details
 */
export interface DentistClinicAssociation {
  id: string; // Clinic ID (can be same as clinicId)
  clinicId: string;
  name: string; // Clinic name (can be same as clinicName)
  clinicName: string;
  branchName?: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  phone: string;
  email?: string;
  isPrimary: boolean;
  joinedAt?: Date;
}

/**
 * Dentist availability schedule per clinic
 */
export interface DentistAvailability {
  [clinicId: string]: ClinicAvailability;
}

/**
 * Availability schedule for a specific clinic
 */
export interface ClinicAvailability {
  [day: string]: DaySchedule[];
}

/**
 * Schedule for a specific day
 */
export interface DaySchedule {
  start: string; // Format: "HH:MM"
  end: string;   // Format: "HH:MM"
  breaks?: BreakTimeSlot[];
}

/**
 * Break time slot for dentist schedules
 */
export interface BreakTimeSlot {
  start: string; // Format: "HH:MM"
  end: string;   // Format: "HH:MM"
}

/**
 * Dentist statistics for profile display
 */
export interface DentistStatistics {
  totalAppointments: number;
  upcomingAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  totalPatients: number;
  averageRating?: number;
  reviewCount?: number;
}

/**
 * Dentist appointment data
 */
export interface DentistAppointment extends Appointment {
  patientName: string;
  patientPhone?: string;
  clinicName: string;
  branchName?: string;
}

/**
 * Update dentist profile request
 */
export interface UpdateDentistProfileRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  specialization?: string;
  licenseNumber?: string;
  bio?: string;
  yearsOfExperience?: number;
  education?: string[];
  certifications?: string[];
  clinicIds?: string[];
  primaryClinicId?: string;
}

/**
 * Update dentist availability request
 */
export interface UpdateDentistAvailabilityRequest {
  clinicId: string;
  availability: ClinicAvailability;
}

/**
 * Dentist image upload response
 */
export interface DentistImageUploadResponse {
  profileImage: string;
  message: string;
  success: boolean;
}

/**
 * Dentist list item for admin views
 */
export interface DentistListItem {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone?: string;
  specialization: string;
  licenseNumber: string;
  profileImage?: string;
  rating?: number;
  clinics: string[]; // Clinic names
  isActive: boolean;
  createdAt: Date;
}

/**
 * Dentist filter options for search/list
 */
export interface DentistFilterOptions {
  specialization?: string;
  clinicId?: string;
  isActive?: boolean;
  search?: string;
  minRating?: number;
}

/**
 * Dentist availability query parameters
 */
export interface DentistAvailabilityQuery {
  dentistId: string;
  clinicId: string;
  date?: string; // ISO date string
  startDate?: string;
  endDate?: string;
}
