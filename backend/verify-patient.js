import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import models
import { Patient, Appointment } from './src/models/index.ts';

// Patient ID to verify
const PATIENT_ID = '68a064af75c4d016454241d9';

async function verifyPatient() {
  console.log('🔍 Verifying Patient in MongoDB');
  console.log('================================');
  
  try {
    // Connect to MongoDB
    console.log('\n1. Connecting to MongoDB...');
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/dental-clinic';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB successfully');
    
    // Verify patient exists
    console.log('\n2. Checking if patient exists...');
    const patient = await Patient.findById(PATIENT_ID);
    
    if (!patient) {
      console.log('❌ Patient not found in database');
      console.log('Patient ID:', PATIENT_ID);
      
      // List all patients to help identify the correct ID
      console.log('\n📋 Listing all patients in database:');
      const allPatients = await Patient.find({}).select('_id firstName lastName email').limit(10);
      
      if (allPatients.length === 0) {
        console.log('No patients found in database');
      } else {
        console.log('Found patients:');
        allPatients.forEach(p => {
          console.log(`  - ID: ${p._id}, Name: ${p.firstName} ${p.lastName}, Email: ${p.email}`);
        });
      }
      
      return;
    }
    
    console.log('✅ Patient found in database');
    console.log('Patient details:', {
      _id: patient._id,
      firstName: patient.firstName,
      lastName: patient.lastName,
      email: patient.email,
      phone: patient.phone,
      isActive: patient.isActive,
      createdAt: patient.createdAt
    });
    
    // Check for appointments for this patient
    console.log('\n3. Checking appointments for this patient...');
    const appointments = await Appointment.find({ patientId: PATIENT_ID });
    
    console.log(`📊 Found ${appointments.length} appointments for patient ${PATIENT_ID}`);
    
    if (appointments.length > 0) {
      console.log('Appointments:');
      appointments.forEach((apt, index) => {
        console.log(`  ${index + 1}. ID: ${apt._id}`);
        console.log(`     Date: ${apt.date}`);
        console.log(`     Time: ${apt.timeSlot}`);
        console.log(`     Service: ${apt.serviceType}`);
        console.log(`     Status: ${apt.status}`);
        console.log(`     Duration: ${apt.duration} minutes`);
        console.log('');
      });
    } else {
      console.log('No appointments found for this patient');
      
      // List some recent appointments to verify the collection has data
      console.log('\n📋 Checking recent appointments in database:');
      const recentAppointments = await Appointment.find({})
        .sort({ createdAt: -1 })
        .limit(5)
        .select('_id patientId date timeSlot serviceType status');
      
      if (recentAppointments.length === 0) {
        console.log('No appointments found in database at all');
      } else {
        console.log('Recent appointments:');
        recentAppointments.forEach(apt => {
          console.log(`  - ID: ${apt._id}, Patient: ${apt.patientId}, Date: ${apt.date}, Service: ${apt.serviceType}`);
        });
      }
    }
    
    // Check collection counts
    console.log('\n4. Checking collection counts...');
    const patientCount = await Patient.countDocuments();
    const appointmentCount = await Appointment.countDocuments();
    
    console.log(`Patients: ${patientCount}`);
    console.log(`Appointments: ${appointmentCount}`);
    
  } catch (error) {
    console.error('❌ Error during verification:', error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('\n✅ MongoDB connection closed');
  }
}

// Run the verification
verifyPatient().catch(console.error);
