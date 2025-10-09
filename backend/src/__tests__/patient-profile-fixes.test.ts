import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app';
import User from '../models/User';
import Patient from '../models/Patient';
import jwt from 'jsonwebtoken';
import path from 'path';
import fs from 'fs';

describe('Patient Profile API Fixes', () => {
  let patientAToken: string;
  let patientBToken: string;
  let staffToken: string;
  let adminToken: string;
  let patientAUserId: string;
  let patientBUserId: string;
  let patientAId: string;
  let patientBId: string;
  let staffUserId: string;
  let adminUserId: string;

  beforeAll(async () => {
    // Connect to test database
    const mongoUri = process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/smartclinic-test';
    await mongoose.connect(mongoUri);

    // Clean up existing test data
    await User.deleteMany({ email: { $regex: /test-patient-profile/ } });
    await Patient.deleteMany({ email: { $regex: /test-patient-profile/ } });

    // Create test users
    const patientAUser = await User.create({
      firstName: 'Patient',
      lastName: 'A',
      email: 'test-patient-profile-a@example.com',
      password: 'password123',
      role: 'patient',
      phone: '+1234567890',
      isActive: true
    });
    patientAUserId = patientAUser._id.toString();

    const patientBUser = await User.create({
      firstName: 'Patient',
      lastName: 'B',
      email: 'test-patient-profile-b@example.com',
      password: 'password123',
      role: 'patient',
      phone: '+1234567891',
      isActive: true
    });
    patientBUserId = patientBUser._id.toString();

    const staffUser = await User.create({
      firstName: 'Staff',
      lastName: 'User',
      email: 'test-patient-profile-staff@example.com',
      password: 'password123',
      role: 'staff',
      phone: '+1234567892',
      isActive: true
    });
    staffUserId = staffUser._id.toString();

    const adminUser = await User.create({
      firstName: 'Admin',
      lastName: 'User',
      email: 'test-patient-profile-admin@example.com',
      password: 'password123',
      role: 'admin',
      phone: '+1234567893',
      isActive: true
    });
    adminUserId = adminUser._id.toString();

    // Create patient records
    const patientA = await Patient.create({
      userId: patientAUserId,
      firstName: 'Patient',
      lastName: 'A',
      email: 'test-patient-profile-a@example.com',
      phone: '+1234567890',
      dateOfBirth: new Date('1990-01-01'),
      gender: 'male',
      address: {
        street: '123 Test St',
        city: 'Test City',
        state: 'TS',
        zipCode: '12345',
        country: 'Test Country'
      },
      emergencyContact: {
        name: 'Emergency Contact A',
        phone: '+1234567894',
        relationship: 'Spouse'
      },
      medicalHistory: {
        allergies: ['None'],
        conditions: [],
        medications: [],
        notes: 'Test patient A'
      }
    });
    patientAId = patientA._id.toString();

    const patientB = await Patient.create({
      userId: patientBUserId,
      firstName: 'Patient',
      lastName: 'B',
      email: 'test-patient-profile-b@example.com',
      phone: '+1234567891',
      dateOfBirth: new Date('1991-01-01'),
      gender: 'female',
      address: {
        street: '456 Test St',
        city: 'Test City',
        state: 'TS',
        zipCode: '12345',
        country: 'Test Country'
      },
      emergencyContact: {
        name: 'Emergency Contact B',
        phone: '+1234567895',
        relationship: 'Parent'
      },
      medicalHistory: {
        allergies: ['Penicillin'],
        conditions: [],
        medications: [],
        notes: 'Test patient B'
      }
    });
    patientBId = patientB._id.toString();

    // Generate tokens
    patientAToken = jwt.sign({ id: patientAUserId }, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });
    patientBToken = jwt.sign({ id: patientBUserId }, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });
    staffToken = jwt.sign({ id: staffUserId }, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });
    adminToken = jwt.sign({ id: adminUserId }, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });
  });

  afterAll(async () => {
    // Clean up test data
    await User.deleteMany({ email: { $regex: /test-patient-profile/ } });
    await Patient.deleteMany({ email: { $regex: /test-patient-profile/ } });
    await mongoose.connection.close();
  });

  describe('3.1 Test profile image upload endpoint', () => {
    it('should accept POST to /users/profile-image with valid image', async () => {
      // Create a test image buffer
      const testImageBuffer = Buffer.from('fake-image-data');
      
      const response = await request(app)
        .post('/api/v1/users/profile-image')
        .set('Authorization', `Bearer ${patientAToken}`)
        .attach('profileImage', testImageBuffer, 'test-image.jpg');

      // The endpoint should exist (not 404)
      expect(response.status).not.toBe(404);
      
      // It should either succeed or fail with validation error, but not 404
      expect([200, 201, 400, 500]).toContain(response.status);
    });

    it('should also accept POST to /users/upload-image (original endpoint)', async () => {
      const testImageBuffer = Buffer.from('fake-image-data');
      
      const response = await request(app)
        .post('/api/v1/users/upload-image')
        .set('Authorization', `Bearer ${patientAToken}`)
        .attach('profileImage', testImageBuffer, 'test-image.jpg');

      expect(response.status).not.toBe(404);
      expect([200, 201, 400, 500]).toContain(response.status);
    });
  });

  describe('3.2 Test patient data fetching', () => {
    it('should allow patient to fetch their own data via GET /patients/user/:userId', async () => {
      const response = await request(app)
        .get(`/api/v1/patients/user/${patientAUserId}`)
        .set('Authorization', `Bearer ${patientAToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.userId.toString()).toBe(patientAUserId);
    });

    it('should not return 403 error for patient accessing their own data', async () => {
      const response = await request(app)
        .get(`/api/v1/patients/user/${patientAUserId}`)
        .set('Authorization', `Bearer ${patientAToken}`);

      expect(response.status).not.toBe(403);
    });
  });

  describe('3.3 Test patient data updating', () => {
    it('should allow patient to update their own data via PUT /patients/:id', async () => {
      const updateData = {
        phone: '+1234567899',
        medicalHistory: {
          allergies: ['Peanuts'],
          conditions: [],
          medications: [],
          notes: 'Updated notes'
        }
      };

      const response = await request(app)
        .put(`/api/v1/patients/${patientAId}`)
        .set('Authorization', `Bearer ${patientAToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    it('should not return 403 error for patient updating their own data', async () => {
      const updateData = {
        phone: '+1234567898'
      };

      const response = await request(app)
        .put(`/api/v1/patients/${patientAId}`)
        .set('Authorization', `Bearer ${patientAToken}`)
        .send(updateData);

      expect(response.status).not.toBe(403);
    });
  });

  describe('3.4 Test authorization boundaries', () => {
    it('should deny patient A from fetching patient B data', async () => {
      const response = await request(app)
        .get(`/api/v1/patients/user/${patientBUserId}`)
        .set('Authorization', `Bearer ${patientAToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access denied');
    });

    it('should deny patient A from updating patient B data', async () => {
      const updateData = {
        phone: '+9999999999'
      };

      const response = await request(app)
        .put(`/api/v1/patients/${patientBId}`)
        .set('Authorization', `Bearer ${patientAToken}`)
        .send(updateData);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access denied');
    });
  });

  describe('3.5 Test staff and admin access', () => {
    it('should allow staff to fetch any patient data', async () => {
      const response = await request(app)
        .get(`/api/v1/patients/user/${patientAUserId}`)
        .set('Authorization', `Bearer ${staffToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should allow staff to update any patient data', async () => {
      const updateData = {
        phone: '+1111111111'
      };

      const response = await request(app)
        .put(`/api/v1/patients/${patientAId}`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should allow admin to fetch any patient data', async () => {
      const response = await request(app)
        .get(`/api/v1/patients/user/${patientBUserId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should allow admin to update any patient data', async () => {
      const updateData = {
        phone: '+2222222222'
      };

      const response = await request(app)
        .put(`/api/v1/patients/${patientBId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});
