import bcrypt from 'bcryptjs';
import { User, Clinic } from '../models';
import { connectDB } from '../config/database';

interface DentistData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: 'dentist';
  phone?: string;
  specialization?: string;
  isActive: boolean;
}

const dentistData: DentistData[] = [
  {
    firstName: 'Dr. Gamal',
    lastName: 'Abdel Nasser Khattab',
    email: 'dr.gamal@dentalclinic.com',
    password: 'Dentist123!',
    role: 'dentist',
    phone: '+201070721469',
    specialization: 'Oral and Dental Medicine and Surgery Specialist',
    isActive: true
  },
  {
    firstName: 'Dr. Moamen',
    lastName: 'Al-Banna',
    email: 'dr.moamen@dentalclinic.com',
    password: 'Dentist123!',
    role: 'dentist',
    phone: '+201070721470',
    specialization: 'Oral and Dental Medicine and Surgery Specialist',
    isActive: true
  }
];

export const createDentistUsers = async (): Promise<void> => {
  try {
    // Get the first clinic to assign dentists to
    const clinic = await Clinic.findOne();
    if (!clinic) {
      console.log('❌ No clinic found. Cannot assign dentists.');
      return;
    }

    for (const dentistInfo of dentistData) {
      // Check if dentist already exists
      const existingDentist = await User.findOne({ email: dentistInfo.email });
      
      if (existingDentist) {
        console.log(`✅ Dentist already exists: ${dentistInfo.firstName} ${dentistInfo.lastName}`);
        continue;
      }

      // Create dentist user
      const dentist = new User({
        ...dentistInfo,
        assignedClinics: [clinic._id]
      });

      await dentist.save();
      
      console.log(`✅ Dentist created: ${dentistInfo.firstName} ${dentistInfo.lastName}`);
      console.log(`📧 Email: ${dentistInfo.email}`);
      console.log(`🔑 Password: ${dentistInfo.password}`);
      console.log(`🏥 Assigned to clinic: ${clinic.name}`);
      console.log('');
    }
    
    console.log('🎉 Dentist seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error creating dentist users:', error);
    throw error;
  }
};

// Run seeder if called directly
if (require.main === module) {
  const runSeeder = async () => {
    try {
      await connectDB();
      await createDentistUsers();
      console.log('🎉 Dentist seeder completed successfully!');
      process.exit(0);
    } catch (error) {
      console.error('💥 Dentist seeder failed:', error);
      process.exit(1);
    }
  };
  
  runSeeder();
}
