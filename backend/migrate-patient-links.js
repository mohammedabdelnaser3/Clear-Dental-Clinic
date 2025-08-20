const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Import the linking utilities
const { 
  linkPatientsByEmail, 
  linkPatientsByPhone, 
  getLinkingStatistics,
  createUsersForUnlinkedPatients 
} = require('./dist/utils/linkPatientsToUsers');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dental-management';

async function runMigration() {
  try {
    console.log('🔗 Starting Patient-User Linking Migration...');
    console.log('=' .repeat(50));
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Get initial statistics
    console.log('\n📊 Initial Statistics:');
    const initialStats = await getLinkingStatistics();
    console.log('Patients:', initialStats.patients);
    console.log('Users:', initialStats.users);
    
    // Step 1: Link patients by email
    console.log('\n🔍 Step 1: Linking patients by email...');
    const emailResults = await linkPatientsByEmail();
    
    // Step 2: Link remaining patients by phone
    console.log('\n📱 Step 2: Linking remaining patients by phone...');
    const phoneResults = await linkPatientsByPhone();
    
    // Step 3: Get final statistics
    console.log('\n📊 Final Statistics:');
    const finalStats = await getLinkingStatistics();
    console.log('Patients:', finalStats.patients);
    console.log('Users:', finalStats.users);
    
    // Summary
    console.log('\n🎯 Migration Summary:');
    console.log('=' .repeat(50));
    console.log(`Email linking - Linked: ${emailResults.linkedPatients}, Errors: ${emailResults.errors.length}`);
    console.log(`Phone linking - Linked: ${phoneResults.linkedPatients}, Errors: ${phoneResults.errors.length}`);
    console.log(`Total patients linked: ${emailResults.linkedPatients + phoneResults.linkedPatients}`);
    console.log(`Linking percentage: ${finalStats.patients.linkingPercentage}%`);
    
    // Show errors if any
    const allErrors = [...emailResults.errors, ...phoneResults.errors];
    if (allErrors.length > 0) {
      console.log('\n❌ Errors encountered:');
      allErrors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }
    
    console.log('\n✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Optional: Create users for unlinked patients
async function createMissingUsers() {
  try {
    console.log('👤 Creating user accounts for unlinked patients...');
    console.log('=' .repeat(50));
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const defaultPassword = process.env.DEFAULT_PATIENT_PASSWORD || 'TempPassword123!';
    console.log(`Using default password: ${defaultPassword}`);
    
    const results = await createUsersForUnlinkedPatients(defaultPassword);
    
    console.log('\n🎯 User Creation Summary:');
    console.log('=' .repeat(50));
    console.log(`Total patients processed: ${results.totalPatients}`);
    console.log(`Users created and linked: ${results.linkedPatients}`);
    console.log(`Errors: ${results.errors.length}`);
    
    if (results.errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      results.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }
    
    console.log('\n✅ User creation completed!');
    
  } catch (error) {
    console.error('❌ User creation failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Check command line arguments
const command = process.argv[2];

switch (command) {
  case 'link':
    runMigration();
    break;
  case 'create-users':
    createMissingUsers();
    break;
  case 'stats':
    (async () => {
      try {
        await mongoose.connect(MONGODB_URI);
        const stats = await getLinkingStatistics();
        console.log('📊 Current Linking Statistics:');
        console.log('=' .repeat(30));
        console.log('Patients:', stats.patients);
        console.log('Users:', stats.users);
        await mongoose.disconnect();
      } catch (error) {
        console.error('Error getting statistics:', error.message);
        process.exit(1);
      }
    })();
    break;
  default:
    console.log('🔗 Patient-User Linking Migration Tool');
    console.log('=' .repeat(40));
    console.log('Usage:');
    console.log('  node migrate-patient-links.js link         - Link existing patients to users');
    console.log('  node migrate-patient-links.js create-users - Create user accounts for unlinked patients');
    console.log('  node migrate-patient-links.js stats        - Show current linking statistics');
    console.log('');
    console.log('Environment variables:');
    console.log('  MONGODB_URI                 - MongoDB connection string');
    console.log('  DEFAULT_PATIENT_PASSWORD    - Default password for created users');
    break;
}