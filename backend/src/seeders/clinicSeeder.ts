import { Clinic } from '../models';
import { connectDB } from '../config/database';

interface ClinicData {
  name: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  phone: string;
  email: string;
  services: string[];
  operatingHours: {
    day: string;
    open: string;
    close: string;
    closed: boolean;
  }[];
}

const clinicsData: ClinicData[] = [
  {
    name: 'Dr. Gamal Abdel Nasser Center for Laser Dental Implants and Aesthetics',
    address: {
      street: 'In front of Attsa Preparatory School',
      city: 'Attsa',
      state: 'Fayoum',
      zipCode: '63511',
      country: 'Egypt'
    },
    phone: '+201017848825',
    email: 'attsa@dentalclinic.com',
    services: [
      'Dental treatment',
      'Laser filling',
      'Root canal filling',
      'Children\'s filling',
      'Regular filling',
      'Regular and surgical extraction',
      'Implants',
      'Installation',
      'Teeth whitening services'
    ],
    operatingHours: [
      { day: 'monday', open: '12:00', close: '23:00', closed: false },
      { day: 'tuesday', open: '12:00', close: '23:00', closed: false },
      { day: 'wednesday', open: '12:00', close: '23:00', closed: false },
      { day: 'thursday', open: '12:00', close: '23:00', closed: false },
      { day: 'friday', open: '', close: '', closed: true },
      { day: 'saturday', open: '12:00', close: '23:00', closed: false },
      { day: 'sunday', open: '12:00', close: '23:00', closed: false }
    ]
  },
  {
    name: 'Center for Laser Dental Implants and Aesthetics',
    address: {
      street: 'Al-Nabawi Street, in front of General Hospital',
      city: 'Fayoum',
      state: 'Fayoum',
      zipCode: '63514',
      country: 'Egypt'
    },
    phone: '+201017848825',
    email: 'nabawi@dentalclinic.com',
    services: [
      'Dental treatment',
      'Laser filling',
      'Root canal filling',
      'Children\'s filling',
      'Regular filling',
      'Regular and surgical extraction',
      'Implants',
      'Installation',
      'Teeth whitening services'
    ],
    operatingHours: [
      { day: 'monday', open: '12:00', close: '23:00', closed: false },
      { day: 'tuesday', open: '12:00', close: '23:00', closed: false },
      { day: 'wednesday', open: '12:00', close: '23:00', closed: false },
      { day: 'thursday', open: '12:00', close: '23:00', closed: false },
      { day: 'friday', open: '', close: '', closed: true },
      { day: 'saturday', open: '12:00', close: '23:00', closed: false },
      { day: 'sunday', open: '12:00', close: '23:00', closed: false }
    ]
  }
];

export const seedClinics = async (): Promise<void> => {
  try {
    // Check if clinics already exist
    const existingCount = await Clinic.countDocuments();
    
    if (existingCount > 0) {
      console.log(`✅ Clinics already seeded (${existingCount} clinics found)`);
      return;
    }

    // Insert clinics
    await Clinic.insertMany(clinicsData);
    
    console.log(`✅ Successfully seeded ${clinicsData.length} clinics`);
    
  } catch (error) {
    console.error('❌ Error seeding clinics:', error);
    throw error;
  }
};

// Run seeder if called directly
if (require.main === module) {
  const runSeeder = async () => {
    try {
      await connectDB();
      await seedClinics();
      console.log('🎉 Clinic seeder completed successfully!');
      process.exit(0);
    } catch (error) {
      console.error('💥 Clinic seeder failed:', error);
      process.exit(1);
    }
  };
  
  runSeeder();
}