import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// MongoDB Atlas connection string
const ATLAS_URI = process.env.MONGODB_URI || 'mongodb+srv://your-username:your-password@cluster0.mongodb.net/smartclinic?retryWrites=true&w=majority';

// Import models
import Patient from './src/models/Patient.ts';
import User from './src/models/User.ts';

// Test data for the specific user
const testPatientData = {
  _id: new mongoose.Types.ObjectId(),
  firstName: 'Mohamed',
  lastName: 'Abdelnasser Khattab',
  email: 'mohamedabdelnasser0123@gmail.com',
  phone: '+201013320786',
  dateOfBirth: new Date('1990-01-15'),
  gender: 'male',
  address: {
    street: '123 Main Street',
    city: 'Cairo',
    state: 'Cairo',
    zipCode: '12345',
    country: 'Egypt'
  },
  medicalHistory: {
    allergies: [],
    medications: [],
    conditions: [],
    notes: 'No significant medical history'
  },
  treatmentRecords: [],
  preferredClinicId: null,
  userId: new mongoose.Types.ObjectId('6879369cf9594e20abb3d14e'), // The specific user ID
  createdBy: new mongoose.Types.ObjectId('6879369cf9594e20abb3d14e'),
  isActive: true,
  emergencyContact: {
    name: 'Emergency Contact',
    phone: '+201013320786',
    relationship: 'Self'
  }
};

async function populateAtlasPatients() {
  console.log('🔗 Populating MongoDB Atlas Patients Collection');
  console.log('===============================================');
  
  try {
    // Connect to MongoDB Atlas
    console.log('\n1. Connecting to MongoDB Atlas...');
    await mongoose.connect(ATLAS_URI);
    console.log('✅ Connected to MongoDB Atlas successfully');
    console.log('Database:', mongoose.connection.db.databaseName);
    console.log('Host:', mongoose.connection.host);
    
    // Check if user exists
    console.log('\n2. Checking if user exists...');
    const user = await User.findById('6879369cf9594e20abb3d14e');
    
    if (!user) {
      console.log('❌ User not found. Creating test user...');
      
      const testUser = new User({
        _id: new mongoose.Types.ObjectId('6879369cf9594e20abb3d14e'),
        firstName: 'Mohamed',
        lastName: 'Abdelnasser Khattab',
        email: 'mohamedabdelnasser0123@gmail.com',
        password: 'password123', // This should be hashed in production
        role: 'patient',
        phone: '+201013320786',
        isActive: true,
        assignedClinics: [],
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      await testUser.save();
      console.log('✅ Test user created');
    } else {
      console.log('✅ User found:', {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
      });
    }
    
    // Check if patient already exists
    console.log('\n3. Checking if patient record exists...');
    const existingPatient = await Patient.findOne({ 
      userId: '6879369cf9594e20abb3d14e' 
    });
    
    if (existingPatient) {
      console.log('✅ Patient record already exists:');
      console.log('  - ID:', existingPatient._id);
      console.log('  - Name:', existingPatient.firstName, existingPatient.lastName);
      console.log('  - Email:', existingPatient.email);
      console.log('  - User ID:', existingPatient.userId);
    } else {
      console.log('❌ Patient record not found. Creating...');
      
      // Create the patient record
      const patient = new Patient(testPatientData);
      await patient.save();
      
      console.log('✅ Patient record created successfully:');
      console.log('  - ID:', patient._id);
      console.log('  - Name:', patient.firstName, patient.lastName);
      console.log('  - Email:', patient.email);
      console.log('  - User ID:', patient.userId);
    }
    
    // Verify the data
    console.log('\n4. Verifying data...');
    const patientCount = await Patient.countDocuments();
    const userCount = await User.countDocuments();
    
    console.log('Collection counts:');
    console.log(`  - Patients: ${patientCount}`);
    console.log(`  - Users: ${userCount}`);
    
    // Check the specific patient
    const specificPatient = await Patient.findOne({ 
      userId: '6879369cf9594e20abb3d14e' 
    });
    
    if (specificPatient) {
      console.log('\n✅ Specific patient found:');
      console.log('  - Patient ID:', specificPatient._id);
      console.log('  - User ID:', specificPatient.userId);
      console.log('  - Name:', specificPatient.firstName, specificPatient.lastName);
      console.log('  - Email:', specificPatient.email);
      console.log('  - Phone:', specificPatient.phone);
      console.log('  - Active:', specificPatient.isActive);
    } else {
      console.log('\n❌ Specific patient not found');
    }
    
    // Test the API endpoint
    console.log('\n5. Testing API endpoint...');
    console.log('You can now test the endpoint:');
    console.log(`GET /api/v1/patients/user/6879369cf9594e20abb3d14e`);
    console.log(`POST /api/v1/patients (with proper authentication)`);
    
  } catch (error) {
    console.error('❌ Error during population:', error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('\n✅ MongoDB Atlas connection closed');
  }
}

// Run the population
populateAtlasPatients().catch(console.error);
