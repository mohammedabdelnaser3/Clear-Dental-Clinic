import mongoose from 'mongoose';
import { User, Clinic } from '../models';
import { connectDB } from '../config/database';

const CLINIC_ID_STRING = '687468107e70478314c346be';
const CLINIC_ID = new mongoose.Types.ObjectId(CLINIC_ID_STRING);

async function fixDentistAssignment() {
  try {
    console.log('🔧 === FIXING DENTIST ASSIGNMENT ISSUE ===\n');

    // Connect to database
    await connectDB();

    // Step 1: Verify clinic exists
    console.log('📋 Step 1: Verifying clinic...');
    const clinic = await Clinic.findById(CLINIC_ID_STRING);
    
    if (!clinic) {
      console.log('❌ ERROR: Clinic not found!');
      console.log('Available clinics:');
      const allClinics = await Clinic.find({}, 'name _id');
      allClinics.forEach(c => {
        console.log(`   - ${c.name} (${c._id})`);
      });
      return;
    }
    
    console.log(`✅ Clinic found: ${clinic.name}`);
    console.log(`   Address: ${clinic.address?.street}, ${clinic.address?.city}`);

    // Step 2: Check current assignments
    console.log('\n👥 Step 2: Checking current dentist assignments...');
    
    const assignedDentists = await User.find({ 
      role: 'dentist', 
      isActive: true,
      assignedClinics: { $in: [CLINIC_ID_STRING] }
    });
    
    console.log(`🎯 Currently assigned dentists: ${assignedDentists.length}`);
    
    if (assignedDentists.length > 0) {
      console.log('✅ Dentists already assigned:');
      assignedDentists.forEach((d, index) => {
        console.log(`   ${index + 1}. Dr. ${d.firstName} ${d.lastName} (${d._id})`);
      });
      console.log('\n🎉 No fix needed - dentists are already assigned!');
      return;
    }

    // Step 3: Find available dentists to assign
    console.log('\n🔍 Step 3: Finding available dentists...');
    
    const availableDentists = await User.find({ 
      role: 'dentist', 
      isActive: true
    }).limit(3);
    
    console.log(`📊 Available dentists: ${availableDentists.length}`);
    
    if (availableDentists.length === 0) {
      console.log('❌ No dentists found in the system!');
      console.log('💡 You need to create dentist users first.');
      return;
    }

    // Step 4: Assign dentists to the clinic
    console.log('\n🔧 Step 4: Assigning dentists to clinic...');
    
    let assignedCount = 0;
    for (const dentist of availableDentists) {
      // Initialize assignedClinics if it doesn't exist
      if (!dentist.assignedClinics) {
        dentist.assignedClinics = [];
      }
      
      // Check if already assigned
      if (!dentist.assignedClinics.some(id => id.toString() === CLINIC_ID_STRING)) {
        dentist.assignedClinics.push(CLINIC_ID);
        await dentist.save();
        
        console.log(`✅ Assigned Dr. ${dentist.firstName} ${dentist.lastName} to ${clinic.name}`);
        assignedCount++;
      } else {
        console.log(`ℹ️  Dr. ${dentist.firstName} ${dentist.lastName} already assigned`);
      }
    }

    // Step 5: Verify the fix
    console.log('\n✅ Step 5: Verifying the fix...');
    
    const verifyDentists = await User.find({ 
      role: 'dentist', 
      isActive: true,
      assignedClinics: { $in: [CLINIC_ID_STRING] }
    });
    
    console.log(`🎯 Verification: ${verifyDentists.length} dentist(s) now assigned`);
    
    if (verifyDentists.length > 0) {
      console.log('✅ SUCCESS! The following issues should now be resolved:');
      console.log('   - 401 Unauthorized errors when fetching dentists');
      console.log('   - Empty time slots in appointment booking');
      console.log('   - "No dentists in clinic" conflict check messages');
      console.log('\n🚀 Try booking an appointment now - it should work!');
    } else {
      console.log('❌ Verification failed - no dentists assigned');
    }

    console.log('\n🎉 === FIX COMPLETE ===');

  } catch (error) {
    console.error('❌ Error during fix:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📝 Disconnected from database');
  }
}

// Run the fix if this file is executed directly
if (require.main === module) {
  fixDentistAssignment()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('💥 Unhandled error:', error);
      process.exit(1);
    });
}

export default fixDentistAssignment;
