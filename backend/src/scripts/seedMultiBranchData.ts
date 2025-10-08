import mongoose from 'mongoose';
import { config } from 'dotenv';
import { User } from '../models';
import DoctorSchedule from '../models/DoctorSchedule';
import Clinic from '../models/Clinic';

config();

const MONGODB_URI = process.env.MONGODB_URI || 
  'mongodb+srv://mohamedabdelnasser0123:pyyd9JSaA2wTUYzT@cluster0.ohipm4r.mongodb.net/smartclinic?retryWrites=true&w=majority&appName=Cluster0';

/**
 * Seed data for 3 clinic branches with doctor schedules
 * Based on user requirements:
 * - Fayoum Branch (Clear): Daily 11 AM - 11 PM
 * - Atesa Branch: All days except Friday, 12 PM - 11 PM
 * - Minya Branch: All days except Friday, 11 AM - 11 PM
 */

const seedMultiBranchData = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('\n🗑️  Clearing existing data...');
    await (DoctorSchedule as any).deleteMany({});
    // Note: Not deleting clinics and users to preserve existing data
    // If you want fresh data, uncomment the lines below:
    // await Clinic.deleteMany({});
    // await User.deleteMany({ role: 'dentist' });
    
    console.log('✅ Cleared existing schedules');

    // =====================================================
    // STEP 1: Create or Update Clinics with Branch Names
    // =====================================================
    console.log('\n📍 Creating/Updating clinic branches...');

    // Fayoum Branch (Clear)
    let fayoumClinic = await (Clinic as any).findOne({ name: 'Clear', branchName: 'Fayoum' });
    if (!fayoumClinic) {
      fayoumClinic = await (Clinic as any).create({
        name: 'Clear',
        branchName: 'Fayoum',
        email: 'fayoum@cleardentalclinic.com',
        phone: '+20123456789',
        address: {
          street: 'City Center Street',
          city: 'Fayoum',
          state: 'Fayoum',
          zipCode: '63514',
          country: 'Egypt'
        },
        operatingHours: [
          { day: 'sunday', open: '11:00', close: '23:00', closed: false },
          { day: 'monday', open: '11:00', close: '23:00', closed: false },
          { day: 'tuesday', open: '11:00', close: '23:00', closed: false },
          { day: 'wednesday', open: '11:00', close: '23:00', closed: false },
          { day: 'thursday', open: '11:00', close: '23:00', closed: false },
          { day: 'friday', open: '11:00', close: '23:00', closed: false }, // Open on Friday
          { day: 'saturday', open: '11:00', close: '23:00', closed: false }
        ],
        emergencyContact: '+20123456789',
        workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      });
      console.log(`✅ Created Fayoum branch: ${fayoumClinic._id}`);
    } else {
      console.log(`✅ Found existing Fayoum branch: ${fayoumClinic._id}`);
    }

    // Atesa Branch
    let atesaClinic = await (Clinic as any).findOne({ name: 'Clear', branchName: 'Atesa' });
    if (!atesaClinic) {
      atesaClinic = await (Clinic as any).create({
        name: 'Clear',
        branchName: 'Atesa',
        email: 'atesa@cleardentalclinic.com',
        phone: '+20123456780',
        address: {
          street: 'Main District Road',
          city: 'Atesa',
          state: 'Fayoum',
          zipCode: '63515',
          country: 'Egypt'
        },
        operatingHours: [
          { day: 'sunday', open: '12:00', close: '23:00', closed: false },
          { day: 'monday', open: '12:00', close: '23:00', closed: false },
          { day: 'tuesday', open: '12:00', close: '23:00', closed: false },
          { day: 'wednesday', open: '12:00', close: '23:00', closed: false },
          { day: 'thursday', open: '12:00', close: '23:00', closed: false },
          { day: 'friday', open: '12:00', close: '23:00', closed: true }, // Closed on Friday
          { day: 'saturday', open: '12:00', close: '23:00', closed: false }
        ],
        emergencyContact: '+20123456780',
        workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'saturday', 'sunday']
      });
      console.log(`✅ Created Atesa branch: ${atesaClinic._id}`);
    } else {
      console.log(`✅ Found existing Atesa branch: ${atesaClinic._id}`);
    }

    // Minya Branch
    let minyaClinic = await (Clinic as any).findOne({ name: 'Clear', branchName: 'Minya' });
    if (!minyaClinic) {
      minyaClinic = await (Clinic as any).create({
        name: 'Clear',
        branchName: 'Minya',
        email: 'minya@cleardentalclinic.com',
        phone: '+20123456781',
        address: {
          street: 'Downtown Avenue',
          city: 'Minya',
          state: 'Minya',
          zipCode: '61111',
          country: 'Egypt'
        },
        operatingHours: [
          { day: 'sunday', open: '11:00', close: '23:00', closed: false },
          { day: 'monday', open: '11:00', close: '23:00', closed: false },
          { day: 'tuesday', open: '11:00', close: '23:00', closed: false },
          { day: 'wednesday', open: '11:00', close: '23:00', closed: false },
          { day: 'thursday', open: '11:00', close: '23:00', closed: false },
          { day: 'friday', open: '11:00', close: '23:00', closed: true }, // Closed on Friday
          { day: 'saturday', open: '11:00', close: '23:00', closed: false }
        ],
        emergencyContact: '+20123456781',
        workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'saturday', 'sunday']
      });
      console.log(`✅ Created Minya branch: ${minyaClinic._id}`);
    } else {
      console.log(`✅ Found existing Minya branch: ${minyaClinic._id}`);
    }

    // =====================================================
    // STEP 2: Create or Find Doctors
    // =====================================================
    console.log('\n👨‍⚕️ Creating/Finding doctors...');


    // Doctor Jamal
    let drJamal = await User.findOne({ email: 'dr.jamal@cleardentalclinic.com' });
    if (!drJamal) {
      drJamal = await User.create({
        firstName: 'Jamal',
        lastName: 'Hassan',
        email: 'dr.jamal@cleardentalclinic.com',
        password: 'DentistPass123!',
        role: 'dentist',
        phone: '+20100000001',
        specialization: 'General Dentistry',
        assignedClinics: [fayoumClinic._id, atesaClinic._id] as any,
        isActive: true
      });
      console.log(`✅ Created Dr. Jamal: ${drJamal._id}`);
    } else {
      // Update assigned clinics
      drJamal.assignedClinics = [fayoumClinic._id, atesaClinic._id] as any;
      // Reset password to known value (hashed by pre-save hook)
      (drJamal as any).password = 'DentistPass123!';
      await drJamal.save();
      console.log(`✅ Found and updated Dr. Jamal: ${drJamal._id}`);
    }

    // Doctor Momen
    let drMomen = await User.findOne({ email: 'dr.momen@cleardentalclinic.com' });
    if (!drMomen) {
      drMomen = await User.create({
        firstName: 'Momen',
        lastName: 'Ahmed',
        email: 'dr.momen@cleardentalclinic.com',
        password: 'DentistPass123!',
        role: 'dentist',
        phone: '+20100000002',
        specialization: 'Orthodontics',
        assignedClinics: [fayoumClinic._id, minyaClinic._id] as any,
        isActive: true
      });
      console.log(`✅ Created Dr. Momen: ${drMomen._id}`);
    } else {
      // Update assigned clinics
      drMomen.assignedClinics = [fayoumClinic._id, minyaClinic._id] as any;
      // Reset password to known value (hashed by pre-save hook)
      (drMomen as any).password = 'DentistPass123!';
      await drMomen.save();
      console.log(`✅ Found and updated Dr. Momen: ${drMomen._id}`);
    }

    // Doctor 3 (New)
    let dr3 = await User.findOne({ email: 'dr.ali@cleardentalclinic.com' });
    if (!dr3) {
      dr3 = await User.create({
        firstName: 'Ali',
        lastName: 'Mahmoud',
        email: 'dr.ali@cleardentalclinic.com',
        password: 'DentistPass123!',
        role: 'dentist',
        phone: '+20100000003',
        specialization: 'Cosmetic Dentistry',
        assignedClinics: [fayoumClinic._id] as any,
        isActive: true
      });
      console.log(`✅ Created Dr. Ali: ${dr3._id}`);
    } else {
      dr3.assignedClinics = [fayoumClinic._id] as any;
      // Reset password to known value (hashed by pre-save hook)
      (dr3 as any).password = 'DentistPass123!';
      await dr3.save();
      console.log(`✅ Found and updated Dr. Ali: ${dr3._id}`);
    }

    // Doctor 4 (New)
    let dr4 = await User.findOne({ email: 'dr.sara@cleardentalclinic.com' });
    if (!dr4) {
      dr4 = await User.create({
        firstName: 'Sara',
        lastName: 'Ibrahim',
        email: 'dr.sara@cleardentalclinic.com',
        password: 'DentistPass123!',
        role: 'dentist',
        phone: '+20100000004',
        specialization: 'Endodontics',
        assignedClinics: [minyaClinic._id] as any,
        isActive: true
      });
      console.log(`✅ Created Dr. Sara: ${dr4._id}`);
    } else {
      dr4.assignedClinics = [minyaClinic._id] as any;
      // Reset password to known value (hashed by pre-save hook)
      (dr4 as any).password = 'DentistPass123!';
      await dr4.save();
      console.log(`✅ Found and updated Dr. Sara: ${dr4._id}`);
    }

    // =====================================================
    // STEP 3: Create Doctor Schedules
    // =====================================================
    console.log('\n📅 Creating doctor schedules...');

    const schedules = [];

    // ==================== FAYOUM BRANCH ====================
    // Dr. Jamal at Fayoum: Sunday & Tuesday (7 PM - 11 PM), Thursday (11 AM - 7 PM)
    schedules.push(
      {
        doctorId: drJamal._id,
        clinicId: fayoumClinic._id,
        dayOfWeek: 0, // Sunday
        startTime: '19:00',
        endTime: '23:00',
        slotDuration: 30,
        isActive: true
      },
      {
        doctorId: drJamal._id,
        clinicId: fayoumClinic._id,
        dayOfWeek: 2, // Tuesday
        startTime: '19:00',
        endTime: '23:00',
        slotDuration: 30,
        isActive: true
      },
      {
        doctorId: drJamal._id,
        clinicId: fayoumClinic._id,
        dayOfWeek: 4, // Thursday
        startTime: '11:00',
        endTime: '19:00',
        slotDuration: 30,
        isActive: true
      }
    );

    // Dr. Momen at Fayoum: Friday (11 AM - 11 PM), Sunday & Tuesday (11 AM - 7 PM), Thursday (7 PM - 11 PM)
    schedules.push(
      {
        doctorId: drMomen._id,
        clinicId: fayoumClinic._id,
        dayOfWeek: 5, // Friday
        startTime: '11:00',
        endTime: '23:00',
        slotDuration: 30,
        isActive: true
      },
      {
        doctorId: drMomen._id,
        clinicId: fayoumClinic._id,
        dayOfWeek: 0, // Sunday
        startTime: '11:00',
        endTime: '19:00',
        slotDuration: 30,
        isActive: true
      },
      {
        doctorId: drMomen._id,
        clinicId: fayoumClinic._id,
        dayOfWeek: 2, // Tuesday
        startTime: '11:00',
        endTime: '19:00',
        slotDuration: 30,
        isActive: true
      },
      {
        doctorId: drMomen._id,
        clinicId: fayoumClinic._id,
        dayOfWeek: 4, // Thursday
        startTime: '19:00',
        endTime: '23:00',
        slotDuration: 30,
        isActive: true
      }
    );

    // Dr. Ali (Doctor 3) at Fayoum: Saturday, Monday, Wednesday (11 AM - 11 PM)
    schedules.push(
      {
        doctorId: dr3._id,
        clinicId: fayoumClinic._id,
        dayOfWeek: 6, // Saturday
        startTime: '11:00',
        endTime: '23:00',
        slotDuration: 30,
        isActive: true
      },
      {
        doctorId: dr3._id,
        clinicId: fayoumClinic._id,
        dayOfWeek: 1, // Monday
        startTime: '11:00',
        endTime: '23:00',
        slotDuration: 30,
        isActive: true
      },
      {
        doctorId: dr3._id,
        clinicId: fayoumClinic._id,
        dayOfWeek: 3, // Wednesday
        startTime: '11:00',
        endTime: '23:00',
        slotDuration: 30,
        isActive: true
      }
    );

    // ==================== ATESA BRANCH ====================
    // Dr. Jamal at Atesa: Sunday & Tuesday (12 PM - 7 PM), Thursday (7 PM - 11 PM), Saturday, Monday, Wednesday (12 PM - 11 PM)
    schedules.push(
      {
        doctorId: drJamal._id,
        clinicId: atesaClinic._id,
        dayOfWeek: 0, // Sunday
        startTime: '12:00',
        endTime: '19:00',
        slotDuration: 30,
        isActive: true
      },
      {
        doctorId: drJamal._id,
        clinicId: atesaClinic._id,
        dayOfWeek: 2, // Tuesday
        startTime: '12:00',
        endTime: '19:00',
        slotDuration: 30,
        isActive: true
      },
      {
        doctorId: drJamal._id,
        clinicId: atesaClinic._id,
        dayOfWeek: 4, // Thursday
        startTime: '19:00',
        endTime: '23:00',
        slotDuration: 30,
        isActive: true
      },
      {
        doctorId: drJamal._id,
        clinicId: atesaClinic._id,
        dayOfWeek: 6, // Saturday
        startTime: '12:00',
        endTime: '23:00',
        slotDuration: 30,
        isActive: true
      },
      {
        doctorId: drJamal._id,
        clinicId: atesaClinic._id,
        dayOfWeek: 1, // Monday
        startTime: '12:00',
        endTime: '23:00',
        slotDuration: 30,
        isActive: true
      },
      {
        doctorId: drJamal._id,
        clinicId: atesaClinic._id,
        dayOfWeek: 3, // Wednesday
        startTime: '12:00',
        endTime: '23:00',
        slotDuration: 30,
        isActive: true
      }
    );

    // ==================== MINYA BRANCH ====================
    // Dr. Momen at Minya: Sunday & Tuesday (11 AM - 7 PM), Thursday (7 PM - 11 PM), Saturday, Monday, Wednesday (11 AM - 11 PM)
    schedules.push(
      {
        doctorId: drMomen._id,
        clinicId: minyaClinic._id,
        dayOfWeek: 0, // Sunday
        startTime: '11:00',
        endTime: '19:00',
        slotDuration: 30,
        isActive: true
      },
      {
        doctorId: drMomen._id,
        clinicId: minyaClinic._id,
        dayOfWeek: 2, // Tuesday
        startTime: '11:00',
        endTime: '19:00',
        slotDuration: 30,
        isActive: true
      },
      {
        doctorId: drMomen._id,
        clinicId: minyaClinic._id,
        dayOfWeek: 4, // Thursday
        startTime: '19:00',
        endTime: '23:00',
        slotDuration: 30,
        isActive: true
      },
      {
        doctorId: drMomen._id,
        clinicId: minyaClinic._id,
        dayOfWeek: 6, // Saturday
        startTime: '11:00',
        endTime: '23:00',
        slotDuration: 30,
        isActive: true
      },
      {
        doctorId: drMomen._id,
        clinicId: minyaClinic._id,
        dayOfWeek: 1, // Monday
        startTime: '11:00',
        endTime: '23:00',
        slotDuration: 30,
        isActive: true
      },
      {
        doctorId: drMomen._id,
        clinicId: minyaClinic._id,
        dayOfWeek: 3, // Wednesday
        startTime: '11:00',
        endTime: '23:00',
        slotDuration: 30,
        isActive: true
      }
    );

    // Dr. Sara (Doctor 4) at Minya: Sunday & Tuesday (7 PM - 11 PM), Thursday (11 AM - 7 PM)
    schedules.push(
      {
        doctorId: dr4._id,
        clinicId: minyaClinic._id,
        dayOfWeek: 0, // Sunday
        startTime: '19:00',
        endTime: '23:00',
        slotDuration: 30,
        isActive: true
      },
      {
        doctorId: dr4._id,
        clinicId: minyaClinic._id,
        dayOfWeek: 2, // Tuesday
        startTime: '19:00',
        endTime: '23:00',
        slotDuration: 30,
        isActive: true
      },
      {
        doctorId: dr4._id,
        clinicId: minyaClinic._id,
        dayOfWeek: 4, // Thursday
        startTime: '11:00',
        endTime: '19:00',
        slotDuration: 30,
        isActive: true
      }
    );

    // Bulk insert all schedules
    const createdSchedules = await (DoctorSchedule as any).insertMany(schedules);
    console.log(`✅ Created ${createdSchedules.length} doctor schedules`);

    // =====================================================
    // STEP 4: Display Summary
    // =====================================================
    console.log('\n📊 SEED SUMMARY');
    console.log('=====================================');
    console.log(`✅ Fayoum Branch ID: ${fayoumClinic._id}`);
    console.log(`✅ Atesa Branch ID: ${atesaClinic._id}`);
    console.log(`✅ Minya Branch ID: ${minyaClinic._id}`);
    console.log('');
    console.log(`✅ Dr. Jamal ID: ${drJamal._id} (Fayoum, Atesa)`);
    console.log(`✅ Dr. Momen ID: ${drMomen._id} (Fayoum, Minya)`);
    console.log(`✅ Dr. Ali ID: ${dr3._id} (Fayoum)`);
    console.log(`✅ Dr. Sara ID: ${dr4._id} (Minya)`);
    console.log('');
    console.log(`✅ Total Schedules Created: ${createdSchedules.length}`);
    console.log('');
    console.log('🎉 Multi-branch seeding completed successfully!');
    console.log('');
    console.log('📝 Login Credentials (All doctors):');
    console.log('   Password: DentistPass123!');
    console.log('   Emails: dr.jamal@cleardentalclinic.com, dr.momen@cleardentalclinic.com,');
    console.log('           dr.ali@cleardentalclinic.com, dr.sara@cleardentalclinic.com');
    console.log('=====================================');

  } catch (error) {
    console.error('❌ Error seeding data:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
};

// Run the seed script
if (require.main === module) {
  seedMultiBranchData()
    .then(() => {
      console.log('\n✅ Seed script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Seed script failed:', error);
      process.exit(1);
    });
}

export default seedMultiBranchData;

