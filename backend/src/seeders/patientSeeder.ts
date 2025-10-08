import { Patient, Clinic } from '../models';
import { connectDB } from '../config/database';

interface PatientData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: 'male' | 'female';
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  };
}

const patientData: PatientData[] = [
  {
    firstName: 'Ahmed',
    lastName: 'Mohammed',
    email: 'ahmed.mohammed@example.com',
    phone: '+201234567890',
    dateOfBirth: '1990-05-15',
    gender: 'male',
    address: {
      street: '123 Main Street',
      city: 'Cairo',
      state: 'Cairo',
      country: 'Egypt',
      zipCode: '12345'
    }
  },
  {
    firstName: 'Fatima',
    lastName: 'Ali',
    email: 'fatima.ali@example.com',
    phone: '+201234567891',
    dateOfBirth: '1985-08-22',
    gender: 'female',
    address: {
      street: '456 Oak Avenue',
      city: 'Alexandria',
      state: 'Alexandria',
      country: 'Egypt',
      zipCode: '54321'
    }
  },
  {
    firstName: 'Omar',
    lastName: 'Hassan',
    email: 'omar.hassan@example.com',
    phone: '+201234567892',
    dateOfBirth: '1995-03-10',
    gender: 'male',
    address: {
      street: '789 Pine Road',
      city: 'Giza',
      state: 'Giza',
      country: 'Egypt',
      zipCode: '67890'
    }
  }
];

export const createPatientRecords = async (): Promise<void> => {
  try {
    // Get the first clinic to assign patients to
    const clinic = await (Clinic as any).findOne();
    if (!clinic) {
      console.log('❌ No clinic found. Cannot assign patients.');
      return;
    }

    for (const patientInfo of patientData) {
      // Check if patient already exists
      const existingPatient = await (Patient as any).findOne({ email: patientInfo.email });
      
      if (existingPatient) {
        console.log(`✅ Patient already exists: ${patientInfo.firstName} ${patientInfo.lastName}`);
        continue;
      }

      // Create patient record
      const patient = new Patient({
        ...patientInfo,
        preferredClinicId: clinic._id
      });

      await patient.save();
      
      console.log(`✅ Patient created: ${patientInfo.firstName} ${patientInfo.lastName}`);
      console.log(`📧 Email: ${patientInfo.email}`);
      console.log(`📱 Phone: ${patientInfo.phone}`);
      console.log(`🏥 Preferred clinic: ${clinic.name}`);
      console.log('');
    }
    
    console.log('🎉 Patient seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error creating patient records:', error);
    throw error;
  }
};

// Run seeder if called directly
if (require.main === module) {
  const runSeeder = async () => {
    try {
      await connectDB();
      await createPatientRecords();
      console.log('🎉 Patient seeder completed successfully!');
      process.exit(0);
    } catch (error) {
      console.error('💥 Patient seeder failed:', error);
      process.exit(1);
    }
  };
  
  runSeeder();
}
