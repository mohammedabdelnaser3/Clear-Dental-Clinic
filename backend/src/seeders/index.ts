import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

import { connectDB } from '../config/database';
import { createAdminUser } from './adminSeeder';
import { seedMedications } from './medicationSeeder';
import { seedClinics } from './clinicSeeder';

/**
 * Main seeder function that runs all seeders
 */
export const runAllSeeders = async (): Promise<void> => {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Connect to database
    await connectDB();
    
    // Run admin seeder
    await createAdminUser();
    
    // Run clinic seeder
    await seedClinics();
    
    // Run medication seeder
    await seedMedications();
    
    console.log('🎉 All seeders completed successfully!');
    
  } catch (error) {
    console.error('💥 Seeding failed:', error);
    throw error;
  }
};

/**
 * Reset database function (use with caution)
 */
export const resetDatabase = async (): Promise<void> => {
  try {
    console.log('⚠️  WARNING: This will delete all data!');
    
    // Connect to database
    await connectDB();
    
    // Import models
    const { User, Patient, Clinic, Appointment, TreatmentRecord, Notification, Medication, Prescription, Billing } = await import('../models');
    
    // Delete all data
    await Promise.all([
      User.deleteMany({}),
      Patient.deleteMany({}),
      Clinic.deleteMany({}),
      Appointment.deleteMany({}),
      TreatmentRecord.deleteMany({}),
      Notification.deleteMany({}),
      Medication.deleteMany({}),
      Prescription.deleteMany({}),
      Billing.deleteMany({})
    ]);
    
    console.log('✅ Database reset completed');
    
    // Run seeders after reset
    await runAllSeeders();
    
  } catch (error) {
    console.error('💥 Database reset failed:', error);
    throw error;
  }
};

// Run seeder if called directly
if (require.main === module) {
  const args = process.argv.slice(2);
  const shouldReset = args.includes('--reset');
  
  const runSeeder = async () => {
    try {
      if (shouldReset) {
        await resetDatabase();
      } else {
        await runAllSeeders();
      }
      process.exit(0);
    } catch (error) {
      console.error('💥 Seeder execution failed:', error);
      process.exit(1);
    }
  };
  
  runSeeder();
}