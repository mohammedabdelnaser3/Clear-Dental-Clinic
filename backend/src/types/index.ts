import { Request } from 'express';
import { Document, Types, Model } from 'mongoose';

// Day type for operating hours
export type Day = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

// User role type
export type UserRole = 'admin' | 'dentist' | 'staff' | 'patient' | 'super_admin';

// User related types
export interface IUser extends Document {
  _id: Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  role: 'admin' | 'dentist' | 'staff' | 'patient' | 'super_admin';
  phone?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  profileImage?: string;
  isActive: boolean;
  lastLogin?: Date;
  assignedClinics: Types.ObjectId[];
  preferredClinicId?: Types.ObjectId;
  specialization?: string;
  twoFactorEnabled?: boolean;
  licenseNumber?: string;
  bio?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  fullName?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Patient related types
export interface IPatient extends Document {
  _id: Types.ObjectId;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  dateOfBirth: Date;
  gender: 'male' | 'female' | 'other';
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  medicalHistory: {
    allergies: string[];
    medications: string[];
    conditions: string[];
    notes?: string;
  };
  treatmentRecords: Types.ObjectId[];
  preferredClinicId: Types.ObjectId;
  userId?: Types.ObjectId; // Link to user account
  createdBy: Types.ObjectId; // User who created this patient record
  isActive: boolean;
  emergencyContact?: {
    name?: string;
    phone?: string;
    relationship?: string;
  };
  fullName?: string; // Virtual property
  age?: number; // Virtual property
  createdAt: Date;
  updatedAt: Date;
}

export interface IPatientModel extends Model<IPatient> {
  findByEmail(email: string): Promise<IPatient | null>;
  findByPhone(phone: string): Promise<IPatient | null>;
  findByClinic(clinicId: string): any;
  searchPatients(searchTerm: string, clinicId?: string): any;
}

// Clinic related types
export interface IClinic extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  services: string[];
  operatingHours: {
    day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
    open: string;
    close: string;
    closed: boolean;
  }[];
  description?: string;
  website?: string;
  emergencyContact?: string;
  images: string[];
  staff: Types.ObjectId[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IClinicModel extends Model<IClinic> {
  findByCity(city: string, options?: { skip?: number; limit?: number }): Promise<IClinic[]>;
  findByName(name: string): Promise<IClinic[]>;
  findByService(service: string, options?: { skip?: number; limit?: number }): Promise<IClinic[]>;
  findNearby(lat: number, lng: number, radiusInKm: number): Promise<IClinic[]>;
  searchClinics(searchTerm: string): any;
}

// Appointment related types
export interface IAppointment extends Document {
  _id: Types.ObjectId;
  patientId: Types.ObjectId;
  dentistId: Types.ObjectId;
  clinicId: Types.ObjectId;
  date: Date;
  timeSlot: string;
  duration: number;
  serviceType: string;
  status: 'scheduled' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled' | 'no-show';
  notes?: string;
  reason?: string;
  treatmentProvided?: string;
  followUpRequired?: boolean;
  followUpDate?: Date;
  emergency?: boolean;
  notificationPreferences?: {
    enabled: boolean;
    channels: {
      email: boolean;
      sms: boolean;
      inApp: boolean;
    };
    reminderTimes: number[];
  };
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  
  // Instance methods
  isPast(): boolean;
  isToday(): boolean;
  canBeCancelled(): boolean;
  canBeRescheduled(): boolean;
}

export interface IAppointmentModel extends Model<IAppointment> {
  findByDateRange(startDate: Date, endDate: Date): Promise<IAppointment[]>;
  findByDentistAndDate(dentistId: string, date: Date): Promise<IAppointment[]>;
  findConflicts(dentistId: string, date: Date, timeSlot: string, duration: number, excludeId?: string): Promise<IAppointment[]>;
  getAvailableTimeSlots(dentistId: string, date: Date, duration?: number): Promise<any[]>;
}

// Treatment Record related types
export interface ITreatmentRecord extends Document {
  _id: Types.ObjectId;
  patientId: Types.ObjectId;
  date: Date;
  dentistId: Types.ObjectId;
  clinicId: Types.ObjectId;
  procedure: string;
  diagnosis?: string;
  notes?: string;
  attachments: {
    filename: string;
    originalName: string;
    url: string;
    fileType: string;
    fileSize: number;
    uploadedAt: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
  
  // Instance methods
  addAttachment(attachment: any): Promise<ITreatmentRecord>;
  removeAttachment(attachmentId: string): Promise<ITreatmentRecord>;
}

export interface ITreatmentRecordModel extends Model<ITreatmentRecord> {
  findByPatient(patientId: string): any;
  findByDentist(dentistId: string): any;
  findByClinic(clinicId: string): any;
  searchTreatmentRecords(searchTerm: string, options?: any): any;
  countSearchResults(searchTerm: string, options?: any): Promise<number>;
  searchRecords(searchTerm: string, options?: any): any;
  findByDateRange(startDate: Date, endDate: Date): any;
}

// Notification related types
// Medication related types
export interface IMedication extends Document {
  _id: Types.ObjectId;
  name: string;
  genericName?: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
  sideEffects: string[];
  contraindications: string[];
  category: 'antibiotic' | 'painkiller' | 'anti-inflammatory' | 'anesthetic' | 'antiseptic' | 'other';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMedicationModel extends Model<IMedication> {
  searchMedications(searchTerm: string): any;
  findByCategory(category: string): any;
}

// Prescription related types
export interface IPrescription extends Document {
  _id: Types.ObjectId;
  patientId: Types.ObjectId;
  dentistId: Types.ObjectId;
  clinicId: Types.ObjectId;
  appointmentId?: Types.ObjectId;
  medications: {
    medicationId: Types.ObjectId;
    dosage: string;
    frequency: string;
    duration: string;
    instructions?: string;
    startDate: Date;
    endDate?: Date;
  }[];
  diagnosis: string;
  notes?: string;
  status: 'active' | 'completed' | 'cancelled' | 'expired';
  issuedDate: Date;
  expiryDate?: Date;
  refillsAllowed: number;
  refillsUsed: number;
  isExpired?: boolean; // Virtual property
  hasRefillsAvailable?: boolean; // Virtual property
  createdAt: Date;
  updatedAt: Date;
  
  // Instance methods
  addRefill(): Promise<IPrescription>;
}

export interface IPrescriptionModel extends Model<IPrescription> {
  findByPatient(patientId: string, options?: any): any;
  findActive(patientId?: string): any;
  findExpiring(days?: number): any;
}

// Billing related types
export interface IBilling extends Document {
  _id: Types.ObjectId;
  patientId: Types.ObjectId;
  appointmentId?: Types.ObjectId;
  treatmentRecordId?: Types.ObjectId;
  clinicId: Types.ObjectId;
  dentistId: Types.ObjectId;
  invoiceNumber: string;
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    category: 'consultation' | 'treatment' | 'medication' | 'equipment' | 'other';
  }[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  paymentMethod: 'cash' | 'credit_card' | 'debit_card' | 'insurance' | 'bank_transfer' | 'check' | 'other';
  paymentStatus: 'pending' | 'partial' | 'paid' | 'overdue' | 'cancelled';
  insuranceInfo?: {
    provider?: string;
    policyNumber?: string;
    coverageAmount?: number;
    claimNumber?: string;
  };
  dueDate: Date;
  paidDate?: Date;
  notes?: string;
  isActive: boolean;
  isOverdue?: boolean; // Virtual property
  createdAt: Date;
  updatedAt: Date;
  
  // Instance methods
  addPayment(amount: number, method?: string): Promise<IBilling>;
}

export interface IBillingModel extends Model<IBilling> {
  findByPatient(patientId: string, options?: any): any;
  findOverdue(clinicId?: string): any;
  getRevenueStats(clinicId: string, startDate: Date, endDate: Date): any;
}

export interface INotification extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  title: string;
  message: string;
  type: 'general' | 'appointment_reminder' | 'appointment_confirmation' | 'appointment_cancellation' | 'system';
  isRead: boolean;
  link?: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Instance methods
  markAsRead(): Promise<INotification>;
  markAsUnread(): Promise<INotification>;
}

export interface INotificationModel extends Model<INotification> {
  createScheduleNotification(staffId: any, arg1: string, arg2: string, arg3: string, arg4: { scheduleId: unknown; clinicId: any; date: Date; startTime: any; endTime: any; }, arg5: { email: boolean; sms: boolean; inApp: boolean; }): unknown;
  createAppointmentConfirmation(appointmentId: string, userId: string): Promise<INotification>;
  createAppointmentReminder(appointmentId: string, userId: string): Promise<INotification>;
  createAppointmentCancellation(appointmentId: string, userId: string): Promise<INotification>;
  createScheduleConflict(staffId: string, scheduleId: string, clinicName: string, date: Date, startTime: string, endTime: string, action: string): Promise<INotification>;
  createScheduleChange(staffId: string, scheduleId: string, clinicName: string, date: Date, startTime: string, endTime: string, action: string): Promise<INotification>;
  deleteOldNotifications(days?: number): Promise<any>;
  markAsRead(notificationId: string): Promise<INotification>;
  markAllAsRead(userId: string): Promise<any>;
  getUnreadCount(userId: string): Promise<number>;
  createNotification(data: any): Promise<INotification>;
  findByType(userId: string, type: string, options?: any): any;
  findUnread(userId: string, limit?: number): any;
}

// Staff Schedule related types
export interface IStaffSchedule extends Document {
  _id: Types.ObjectId;
  staffId: Types.ObjectId;
  clinicId: Types.ObjectId;
  date: Date;
  startTime: string;
  endTime: string;
  shiftType: 'morning' | 'afternoon' | 'evening' | 'night' | 'full-day';
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  notes?: string;
  isRecurring: boolean;
  recurringPattern?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    daysOfWeek?: number[];
    endDate?: Date;
  };
  notifications: {
    email: boolean;
    sms: boolean;
    inApp: boolean;
    reminderTime: number;
  };
  conflictResolution?: {
    isConflict: boolean;
    conflictWith?: Types.ObjectId[];
    resolvedBy?: Types.ObjectId;
    resolvedAt?: Date;
  };
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IStaffScheduleModel extends Model<IStaffSchedule> {
  findByClinicAndDateRange(clinicId: string, startDate: Date, endDate: Date): any;
  findStaffAvailability(staffId: string, date: Date): any;
  detectConflicts(staffId: string, date: Date, startTime: string, endTime: string, excludeId?: string): any;
  getCalendarView(clinicId: string, startDate: Date, endDate: Date): any;
}

// Request types
export interface AuthenticatedRequest extends Request {
  user: IUser;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sort?: string;
  fields?: string;
}

export interface DateRangeQuery {
  startDate?: string;
  endDate?: string;
}

// Response types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  success: boolean;
  message?: string;
}

// JWT Payload
export interface JWTPayload {
  id: string;
  email?: string;
  role?: string;
  type?: string; // for refresh tokens
  iat?: number;
  exp?: number;
}

// File upload types
export interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer?: Buffer;
}

// Email types
export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  attachments?: {
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }[];
}

// Statistics types
export interface UserStatistics {
  totalUsers: number;
  activeUsers: number;
  usersByRole: {
    admin: number;
    dentist: number;
    staff: number;
    patient: number;
  };
  recentRegistrations: number;
}

export interface PatientStatistics {
  totalPatients: number;
  patientsByGender: {
    male: number;
    female: number;
    other: number;
  };
  patientsByAgeGroup: {
    '0-18': number;
    '19-35': number;
    '36-50': number;
    '51-65': number;
    '65+': number;
  };
  recentPatients: number;
}

export interface AppointmentStatistics {
  totalAppointments: number;
  appointmentsByStatus: {
    scheduled: number;
    confirmed: number;
    'in-progress': number;
    completed: number;
    cancelled: number;
    'no-show': number;
  };
  appointmentsToday: number;
  upcomingAppointments: number;
  completionRate: number;
}

export interface TreatmentStatistics {
  totalTreatments: number;
  treatmentsByProcedure: {
    [procedure: string]: number;
  };
  recentTreatments: number;
  averageTreatmentsPerDay: number;
}

export interface ClinicStatistics {
  totalClinics: number;
  activeClinics: number;
  clinicsByCity: {
    [city: string]: number;
  };
  averageStaffPerClinic: number;
}

// Search and filter types
export interface SearchOptions {
  query: string;
  fields?: string[];
  limit?: number;
  page?: number;
}

export interface FilterOptions {
  [key: string]: any;
}

// Validation types
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

// Time slot types
export interface TimeSlot {
  time: string;
  available: boolean;
  reason?: string;
}

// Dashboard data types
export interface DashboardData {
  appointments: {
    today: number;
    upcoming: number;
    completed: number;
    cancelled: number;
  };
  patients: {
    total: number;
    new: number;
  };
  treatments: {
    total: number;
    recent: number;
  };
  revenue?: {
    today: number;
    month: number;
    year: number;
  };
}