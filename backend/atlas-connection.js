import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// MongoDB Atlas connection string
const ATLAS_URI = process.env.MONGODB_URI || 'mongodb+srv://your-username:your-password@cluster0.mongodb.net/smartclinic?retryWrites=true&w=majority';

// Test patient data
const testPatient = {
  _id: new mongoose.Types.ObjectId('68a064af75c4d016454241d9'),
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  phone: '+1234567890',
  dateOfBirth: new Date('1990-01-15'),
  gender: 'male',
  address: {
    street: '123 Main Street',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    country: 'USA'
  },
  medicalHistory: {
    allergies: [],
    medications: [],
    conditions: [],
    notes: 'No significant medical history'
  },
  treatmentRecords: [],
  preferredClinicId: null,
  userId: null,
  createdBy: new mongoose.Types.ObjectId(),
  isActive: true,
  emergencyContact: {
    name: 'Jane Doe',
    phone: '+1234567891',
    relationship: 'Spouse'
  }
};

// Test appointments data
const testAppointments = [
  {
    _id: new mongoose.Types.ObjectId(),
    patientId: new mongoose.Types.ObjectId('68a064af75c4d016454241d9'),
    dentistId: new mongoose.Types.ObjectId(),
    clinicId: new mongoose.Types.ObjectId(),
    serviceType: 'checkup',
    date: new Date('2025-01-20'),
    timeSlot: '10:00',
    duration: 60,
    status: 'scheduled',
    notes: 'Regular dental checkup',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: new mongoose.Types.ObjectId(),
    patientId: new mongoose.Types.ObjectId('68a064af75c4d016454241d9'),
    dentistId: new mongoose.Types.ObjectId(),
    clinicId: new mongoose.Types.ObjectId(),
    serviceType: 'cleaning',
    date: new Date('2025-01-25'),
    timeSlot: '14:00',
    duration: 45,
    status: 'scheduled',
    notes: 'Teeth cleaning appointment',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Import models
import { Patient, Appointment, User, Clinic } from './src/models/index.js';

async function connectToAtlas() {
  console.log('🔗 Connecting to MongoDB Atlas...');
  console.log('====================================');
  
  try {
    // Connect to MongoDB Atlas
    console.log('\n1. Establishing connection to Atlas...');
    await mongoose.connect(ATLAS_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB Atlas successfully');
    console.log('Database:', mongoose.connection.db.databaseName);
    console.log('Host:', mongoose.connection.host);
    
    // Check existing data
    console.log('\n2. Checking existing data...');
    const patientCount = await Patient.countDocuments();
    const appointmentCount = await Appointment.countDocuments();
    const userCount = await User.countDocuments();
    const clinicCount = await Clinic.countDocuments();
    
    console.log('Current collection counts:');
    console.log(`  - Patients: ${patientCount}`);
    console.log(`  - Appointments: ${appointmentCount}`);
    console.log(`  - Users: ${userCount}`);
    console.log(`  - Clinics: ${clinicCount}`);
    
    // Check if test patient exists
    console.log('\n3. Checking if test patient exists...');
    const existingPatient = await Patient.findById('68a064af75c4d016454241d9');
    
    if (existingPatient) {
      console.log('✅ Test patient already exists');
      console.log('Patient details:', {
        _id: existingPatient._id,
        firstName: existingPatient.firstName,
        lastName: existingPatient.lastName,
        email: existingPatient.email
      });
    } else {
      console.log('❌ Test patient not found, creating...');
      
      // Get or create a user for the patient
      let user = await User.findOne({ role: 'patient' });
      if (!user) {
        console.log('Creating test user...');
        user = new User({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          password: 'password123',
          role: 'patient',
          isActive: true
        });
        await user.save();
        console.log('✅ Test user created');
      }
      
      // Get or create a clinic
      let clinic = await Clinic.findOne();
      if (!clinic) {
        console.log('Creating test clinic...');
        clinic = new Clinic({
          name: 'Test Dental Clinic',
          email: 'clinic@example.com',
          phone: '+1234567890',
          address: {
            street: '456 Clinic Street',
            city: 'New York',
            state: 'NY',
            zipCode: '10002',
            country: 'USA'
          },
          isActive: true
        });
        await clinic.save();
        console.log('✅ Test clinic created');
      }
      
      // Create test patient
      testPatient.userId = user._id;
      testPatient.preferredClinicId = clinic._id;
      testPatient.createdBy = user._id;
      
      const patient = new Patient(testPatient);
      await patient.save();
      console.log('✅ Test patient created successfully');
      console.log('Patient ID:', patient._id);
    }
    
    // Check appointments for the test patient
    console.log('\n4. Checking appointments for test patient...');
    const patientAppointments = await Appointment.find({ 
      patientId: '68a064af75c4d016454241d9' 
    });
    
    console.log(`Found ${patientAppointments.length} appointments for test patient`);
    
    if (patientAppointments.length === 0) {
      console.log('Creating test appointments...');
      
      // Get a dentist
      let dentist = await User.findOne({ role: 'dentist' });
      if (!dentist) {
        console.log('Creating test dentist...');
        dentist = new User({
          firstName: 'Dr. Smith',
          lastName: 'Dentist',
          email: 'dr.smith@example.com',
          password: 'password123',
          role: 'dentist',
          specialization: 'General Dentistry',
          isActive: true
        });
        await dentist.save();
        console.log('✅ Test dentist created');
      }
      
      // Get clinic
      const clinic = await Clinic.findOne();
      
      // Create test appointments
      for (const appointmentData of testAppointments) {
        appointmentData.dentistId = dentist._id;
        appointmentData.clinicId = clinic._id;
        
        const appointment = new Appointment(appointmentData);
        await appointment.save();
        console.log(`✅ Created appointment: ${appointment.serviceType} on ${appointment.date}`);
      }
    }
    
    // Verify data consistency
    console.log('\n5. Verifying data consistency...');
    const finalPatientCount = await Patient.countDocuments();
    const finalAppointmentCount = await Appointment.countDocuments();
    const testPatientAppointments = await Appointment.find({ 
      patientId: '68a064af75c4d016454241d9' 
    });
    
    console.log('Final collection counts:');
    console.log(`  - Patients: ${finalPatientCount}`);
    console.log(`  - Appointments: ${finalAppointmentCount}`);
    console.log(`  - Test patient appointments: ${testPatientAppointments.length}`);
    
    // Test the API endpoint
    console.log('\n6. Testing API endpoint...');
    console.log('You can now test the endpoint:');
    console.log(`GET /api/v1/patients/68a064af75c4d016454241d9/appointments`);
    
  } catch (error) {
    console.error('❌ Error during Atlas connection:', error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('\n✅ MongoDB Atlas connection closed');
  }
}

// Run the connection
connectToAtlas().catch(console.error);
