import mongoose from 'mongoose';
import { User, StaffSchedule } from '../models';
import { connectDB } from '../config/database';

const CLINIC_ID_STRING = '687468107e70478314c346be';
const TARGET_DATE = '2025-09-03'; // Tuesday

async function createDentistSchedules() {
  try {
    console.log('📅 === CREATING DENTIST SCHEDULES FOR 2025-09-03 ===\n');

    // Connect to database
    await connectDB();

    // Step 1: Find dentists assigned to the clinic
    console.log('👨‍⚕️ Step 1: Finding dentists assigned to clinic...');
    
    const assignedDentists = await User.find({ 
      role: 'dentist', 
      isActive: true,
      assignedClinics: { $in: [CLINIC_ID_STRING] }
    });
    
    console.log(`🎯 Found ${assignedDentists.length} dentist(s) assigned to clinic`);
    
    if (assignedDentists.length === 0) {
      console.log('❌ No dentists assigned to clinic! Run npm run fix:dentists first.');
      return;
    }

    assignedDentists.forEach((d, index) => {
      console.log(`   ${index + 1}. Dr. ${d.firstName} ${d.lastName} (${d._id})`);
    });

    // Step 2: Check existing schedules for the target date
    console.log(`\n📋 Step 2: Checking existing schedules for ${TARGET_DATE}...`);
    
    const targetDate = new Date(TARGET_DATE);
    const dayOfWeek = targetDate.getDay(); // 2 = Tuesday
    
    console.log(`   Target date: ${TARGET_DATE} (day of week: ${dayOfWeek} - Tuesday)`);

    for (const dentist of assignedDentists) {
      const existingSchedules = await StaffSchedule.find({
        staffId: dentist._id,
        clinicId: CLINIC_ID_STRING,
        $or: [
          // Specific date schedule
          {
            date: {
              $gte: new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()),
              $lt: new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() + 1)
            }
          },
          // Recurring schedule that includes Tuesday (day 2)
          {
            isRecurring: true,
            'recurringPattern.daysOfWeek': { $in: [dayOfWeek] }
          }
        ]
      });

      console.log(`   Dr. ${dentist.firstName} ${dentist.lastName}: ${existingSchedules.length} existing schedule(s)`);
      
      if (existingSchedules.length === 0) {
        console.log(`   🔧 Creating schedule for Dr. ${dentist.firstName} ${dentist.lastName}...`);
        
        // Create a specific schedule for the target date
        const newSchedule = await StaffSchedule.create({
          staffId: dentist._id,
          clinicId: CLINIC_ID_STRING,
          date: new Date(TARGET_DATE),
          startTime: '09:00',
          endTime: '17:00',
          shiftType: 'full-day',
          status: 'scheduled',
          isRecurring: false,
          createdBy: dentist._id, // Use the dentist as the creator for simplicity
          notifications: {
            email: true,
            sms: false,
            inApp: true,
            reminderTime: 60
          }
        });
        
        console.log(`   ✅ Created schedule for ${TARGET_DATE} for Dr. ${dentist.firstName} ${dentist.lastName}`);
        console.log(`      Schedule ID: ${newSchedule._id}`);
        console.log(`      Working hours: 09:00 - 17:00`);
      } else {
        console.log(`   ✅ Dr. ${dentist.firstName} ${dentist.lastName} already has schedule(s)`);
        existingSchedules.forEach((schedule, idx) => {
          if (schedule.isRecurring) {
            console.log(`      ${idx + 1}. Recurring: Days ${schedule.recurringPattern?.daysOfWeek} (${schedule.startTime} - ${schedule.endTime})`);
          } else {
            console.log(`      ${idx + 1}. Specific date: ${schedule.date} (${schedule.startTime} - ${schedule.endTime})`);
          }
        });
      }
    }

    // Step 3: Verify schedules for the target date
    console.log(`\n✅ Step 3: Verifying schedules for ${TARGET_DATE}...`);
    
    for (const dentist of assignedDentists) {
      const schedulesForDate = await StaffSchedule.find({
        staffId: dentist._id,
        clinicId: CLINIC_ID_STRING,
        status: { $in: ['scheduled', 'completed'] },
        $or: [
          // Specific date schedule
          {
            date: {
              $gte: new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()),
              $lt: new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() + 1)
            }
          },
          // Recurring schedule that includes Tuesday
          {
            isRecurring: true,
            'recurringPattern.daysOfWeek': { $in: [dayOfWeek] }
          }
        ]
      });

      console.log(`   Dr. ${dentist.firstName} ${dentist.lastName}: ${schedulesForDate.length > 0 ? '✅ Available' : '❌ Not available'} on ${TARGET_DATE}`);
    }

    console.log('\n🎉 === SCHEDULE CREATION COMPLETE ===');
    console.log('✅ Benefits:');
    console.log('   - Time slots should now be available for 2025-09-03');
    console.log('   - Appointment booking should work for Tuesday');
    console.log('   - Auto-assignment logic will find available dentists');

  } catch (error) {
    console.error('❌ Error during schedule creation:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📝 Disconnected from database');
  }
}

// Run the script if this file is executed directly
if (require.main === module) {
  createDentistSchedules()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('💥 Unhandled error:', error);
      process.exit(1);
    });
}

export default createDentistSchedules;
