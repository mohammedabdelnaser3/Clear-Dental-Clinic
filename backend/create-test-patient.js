const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB Atlas connection string
const ATLAS_URI = process.env.MONGODB_URI || 'mongodb+srv://your-username:your-password@cluster0.mongodb.net/smartclinic?retryWrites=true&w=majority';

// Simple Patient schema for this script
const patientSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  phone: { type: String, required: true },
  dateOfBirth: { type: Date, required: true },
  gender: { type: String, enum: ['male', 'female', 'other'], required: true },
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    country: { type: String, required: true }
  },
  medicalHistory: {
    allergies: [{ type: String }],
    medications: [{ type: String }],
    conditions: [{ type: String }],
    notes: { type: String, default: '' }
  },
  treatmentRecords: [{ type: mongoose.Schema.Types.ObjectId, ref: 'TreatmentRecord' }],
  preferredClinicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clinic' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isActive: { type: Boolean, default: true },
  emergencyContact: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    relationship: { type: String, required: true }
  }
}, {
  timestamps: true
});

// Simple User schema for this script
const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'staff', 'dentist', 'patient'], required: true },
  phone: { type: String },
  isActive: { type: Boolean, default: true },
  assignedClinics: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Clinic' }]
}, {
  timestamps: true
});

const Patient = mongoose.model('Patient', patientSchema);
const User = mongoose.model('User', userSchema);

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

async function createTestPatient() {
  console.log('🔗 Creating Test Patient in MongoDB Atlas');
  console.log('=========================================');
  
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
    console.error('❌ Error during patient creation:', error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('\n✅ MongoDB Atlas connection closed');
  }
}

// Run the creation
createTestPatient().catch(console.error);
