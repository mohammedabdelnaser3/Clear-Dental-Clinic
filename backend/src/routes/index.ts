import { Router } from 'express';
import authRoutes from './authRoutes';
import userRoutes from './userRoutes';
import patientRoutes from './patientRoutes';
import clinicRoutes from './clinicRoutes';
import appointmentRoutes from './appointmentRoutes';
import treatmentRoutes from './treatmentRoutes';
import notificationRoutes from './notificationRoutes';
import medicationRoutes from './medications';
import prescriptionRoutes from './prescriptions';
import billingRoutes from './billing';
import adminRoutes from './adminRoutes';
import staffScheduleRoutes from './staffScheduleRoutes';

const router = Router();

// API version prefix
const API_VERSION = '/api/v1';

// Mount routes
router.use(`${API_VERSION}/auth`, authRoutes);
router.use(`${API_VERSION}/users`, userRoutes);
router.use(`${API_VERSION}/patients`, patientRoutes);
router.use(`${API_VERSION}/clinics`, clinicRoutes);
router.use(`${API_VERSION}/appointments`, appointmentRoutes);
router.use(`${API_VERSION}/treatments`, treatmentRoutes);
router.use(`${API_VERSION}/notifications`, notificationRoutes);
router.use(`${API_VERSION}/medications`, medicationRoutes);
router.use(`${API_VERSION}/prescriptions`, prescriptionRoutes);
router.use(`${API_VERSION}/billing`, billingRoutes);
router.use(`${API_VERSION}/admin`, adminRoutes);
router.use(`${API_VERSION}/staff-schedules`, staffScheduleRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Dental Management System API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API documentation endpoint
router.get(`${API_VERSION}`, (req, res) => {
  res.json({
    success: true,
    message: 'Dental Management System API v1',
    version: '1.0.0',
    endpoints: {
      auth: `${API_VERSION}/auth`,
      users: `${API_VERSION}/users`,
      patients: `${API_VERSION}/patients`,
      clinics: `${API_VERSION}/clinics`,
      appointments: `${API_VERSION}/appointments`,
      treatments: `${API_VERSION}/treatments`,
      notifications: `${API_VERSION}/notifications`,
      medications: `${API_VERSION}/medications`,
      prescriptions: `${API_VERSION}/prescriptions`,
      billing: `${API_VERSION}/billing`,
      admin: `${API_VERSION}/admin`,
      staffSchedules: `${API_VERSION}/staff-schedules`
    },
    documentation: {
      health: '/health',
      version: `${API_VERSION}`
    }
  });
});

export default router;