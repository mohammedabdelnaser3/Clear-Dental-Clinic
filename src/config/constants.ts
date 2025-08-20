// API Configuration
export const API_URL = import.meta.env.VITE_API_URL || 'https://api.smartclinic.example.com';

// Authentication
export const TOKEN_KEY = 'smartclinic_token';
export const USER_KEY = 'smartclinic_user';

// Pagination
export const DEFAULT_PAGE_SIZE = 10;

// Date formats
export const DATE_FORMAT = 'MMM dd, yyyy';
export const TIME_FORMAT = 'h:mm a';
export const DATE_TIME_FORMAT = 'MMM dd, yyyy h:mm a';

// File upload
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];

// Appointment status colors
export const STATUS_COLORS = {
  scheduled: 'blue',
  confirmed: 'green',
  completed: 'purple',
  cancelled: 'red',
  'no-show': 'gray',
};

// Service types
export const SERVICE_TYPES = [
  'Regular Checkup',
  'Teeth Cleaning',
  'Cavity Filling',
  'Root Canal',
  'Tooth Extraction',
  'Dental Crown',
  'Dental Bridge',
  'Dental Implant',
  'Orthodontics Consultation',
  'Braces Adjustment',
  'Teeth Whitening',
  'Gum Treatment',
  'Dental X-Ray',
  'Emergency Care',
  'Pediatric Dentistry',
  'Oral Surgery',
  'Dentures',
  'Veneers',
  'Invisalign',
  'Consultation',
];

// Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  DASHBOARD: '/dashboard',
  APPOINTMENTS: '/appointments',
  APPOINTMENT_DETAILS: '/appointments/:id',
  NEW_APPOINTMENT: '/appointments/new',
  EDIT_APPOINTMENT: '/appointments/:id/edit',
  PATIENTS: '/patients',
  PATIENT_DETAILS: '/patients/:id',
  NEW_PATIENT: '/patients/new',
  EDIT_PATIENT: '/patients/:id/edit',
  PATIENT_REPORTS: '/patients/:id/reports',
  CLINICS: '/clinics',
  CLINIC_DETAILS: '/clinics/:id',
  PROFILE: '/profile',
  SETTINGS: '/settings',
};