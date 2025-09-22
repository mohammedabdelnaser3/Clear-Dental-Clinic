import { StaffSchedule, User, Clinic } from '../models';
import { connectDB } from '../config/database';

interface DentistSchedule {
  email: string;
  name: string;
  workingDays: number[]; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  startTime: string;
  endTime: string;
}

const dentistSchedules: DentistSchedule[] = [
  {
    email: 'dr.gamal@dentalclinic.com',
    name: 'Dr. Gamal Abdel Nasser Khattab',
    workingDays: [6, 0, 1, 5], // Saturday, Sunday, Monday, Friday
    startTime: '09:00',
    endTime: '17:00'
  },
  {
    email: 'dr.moamen@dentalclinic.com', 
    name: 'Dr. Moamen Al-Banna',
    workingDays: [2, 3, 4], // Tuesday, Wednesday, Thursday
    startTime: '09:00',
    endTime: '17:00'
  }
];

export const createDentistSchedules = async (): Promise<void> => {
  try {
    console.log('🏥 Setting up dentist schedules...');
    
    // Get the clinic
    const clinic = await Clinic.findOne();
    if (!clinic) {
      console.log('❌ No clinic found. Cannot create schedules.');
      return;
    }
    console.log(`📍 Using clinic: ${clinic.name}`);

    for (const scheduleInfo of dentistSchedules) {
      // Find the dentist by email
      const dentist = await User.findOne({ 
        email: scheduleInfo.email,
        role: 'dentist'
      });
      
      if (!dentist) {
        console.log(`❌ Dentist not found: ${scheduleInfo.name} (${scheduleInfo.email})`);
        continue;
      }

      // Check if schedule already exists
      const existingSchedule = await StaffSchedule.findOne({
        staffId: dentist._id,
        clinicId: clinic._id,
        isRecurring: true
      });

      if (existingSchedule) {
        // Update existing schedule
        existingSchedule.recurringPattern = {
          frequency: 'weekly',
          daysOfWeek: scheduleInfo.workingDays,
          endDate: undefined // No end date - ongoing
        };
        existingSchedule.startTime = scheduleInfo.startTime;
        existingSchedule.endTime = scheduleInfo.endTime;
        
        await existingSchedule.save();
        console.log(`🔄 Updated schedule for ${scheduleInfo.name}`);
      } else {
        // Create new recurring schedule
        const schedule = new StaffSchedule({
          staffId: dentist._id,
          clinicId: clinic._id,
          date: new Date(), // Required field, but not used for recurring
          startTime: scheduleInfo.startTime,
          endTime: scheduleInfo.endTime,
          shiftType: 'full-day',
          status: 'scheduled',
          isRecurring: true,
          recurringPattern: {
            frequency: 'weekly',
            daysOfWeek: scheduleInfo.workingDays,
            // No end date - ongoing schedule
          },
          notifications: {
            email: true,
            sms: false,
            inApp: true,
            reminderTime: 60
          },
          createdBy: dentist._id
        });

        await schedule.save();
        console.log(`✅ Created schedule for ${scheduleInfo.name}`);
      }

      // Display the schedule
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const workingDayNames = scheduleInfo.workingDays.map(day => dayNames[day]);
      console.log(`   📅 Working days: ${workingDayNames.join(', ')}`);
      console.log(`   🕘 Hours: ${scheduleInfo.startTime} - ${scheduleInfo.endTime}`);
      console.log('');
    }
    
    console.log('🎉 Dentist schedule setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error creating dentist schedules:', error);
    throw error;
  }
};

// Run seeder if called directly
if (require.main === module) {
  (async () => {
    try {
      await connectDB();
      await createDentistSchedules();
      process.exit(0);
    } catch (error) {
      console.error('❌ Seeder failed:', error);
      process.exit(1);
    }
  })();
}
