export * from './authService';
export * from './clinicService';
export * from './appointmentService';
export * from './patientService';
export * from './dentistService';
export * from './userService';
export * from './reportsService';
export * from './medicationService';
export * from './prescriptionService';
export * from './billingService';
export * from './adminService';
export * from './notificationService';

// Re-export the API instance
import api from './api';
export { api };