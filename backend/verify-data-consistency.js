import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// MongoDB Atlas connection string
const ATLAS_URI = process.env.MONGODB_URI || 'mongodb+srv://your-username:your-password@cluster0.mongodb.net/smartclinic?retryWrites=true&w=majority';

// Import models
import { Patient, Appointment, User, Clinic } from './src/models/index.js';

async function verifyDataConsistency() {
  console.log('🔍 Verifying Data Consistency in MongoDB Atlas');
  console.log('===============================================');
  
  try {
    // Connect to MongoDB Atlas
    console.log('\n1. Connecting to MongoDB Atlas...');
    await mongoose.connect(ATLAS_URI);
    console.log('✅ Connected to MongoDB Atlas successfully');
    
    // Check collection counts
    console.log('\n2. Checking collection counts...');
    const patientCount = await Patient.countDocuments();
    const appointmentCount = await Appointment.countDocuments();
    const userCount = await User.countDocuments();
    const clinicCount = await Clinic.countDocuments();
    
    console.log('Collection counts:');
    console.log(`  - Patients: ${patientCount}`);
    console.log(`  - Appointments: ${appointmentCount}`);
    console.log(`  - Users: ${userCount}`);
    console.log(`  - Clinics: ${clinicCount}`);
    
    // Check for orphaned appointments (appointments without valid patient)
    console.log('\n3. Checking for orphaned appointments...');
    const allAppointments = await Appointment.find({});
    const orphanedAppointments = [];
    
    for (const appointment of allAppointments) {
      const patient = await Patient.findById(appointment.patientId);
      if (!patient) {
        orphanedAppointments.push({
          appointmentId: appointment._id,
          patientId: appointment.patientId,
          serviceType: appointment.serviceType,
          date: appointment.date
        });
      }
    }
    
    if (orphanedAppointments.length > 0) {
      console.log(`❌ Found ${orphanedAppointments.length} orphaned appointments:`);
      orphanedAppointments.forEach(apt => {
        console.log(`  - Appointment: ${apt.appointmentId}, Patient: ${apt.patientId}, Service: ${apt.serviceType}`);
      });
    } else {
      console.log('✅ No orphaned appointments found');
    }
    
    // Check for appointments with invalid dentist references
    console.log('\n4. Checking for appointments with invalid dentist references...');
    const appointmentsWithInvalidDentist = [];
    
    for (const appointment of allAppointments) {
      const dentist = await User.findById(appointment.dentistId);
      if (!dentist || dentist.role !== 'dentist') {
        appointmentsWithInvalidDentist.push({
          appointmentId: appointment._id,
          dentistId: appointment.dentistId,
          serviceType: appointment.serviceType,
          date: appointment.date
        });
      }
    }
    
    if (appointmentsWithInvalidDentist.length > 0) {
      console.log(`❌ Found ${appointmentsWithInvalidDentist.length} appointments with invalid dentist references:`);
      appointmentsWithInvalidDentist.forEach(apt => {
        console.log(`  - Appointment: ${apt.appointmentId}, Dentist: ${apt.dentistId}, Service: ${apt.serviceType}`);
      });
    } else {
      console.log('✅ All appointments have valid dentist references');
    }
    
    // Check for appointments with invalid clinic references
    console.log('\n5. Checking for appointments with invalid clinic references...');
    const appointmentsWithInvalidClinic = [];
    
    for (const appointment of allAppointments) {
      const clinic = await Clinic.findById(appointment.clinicId);
      if (!clinic) {
        appointmentsWithInvalidClinic.push({
          appointmentId: appointment._id,
          clinicId: appointment.clinicId,
          serviceType: appointment.serviceType,
          date: appointment.date
        });
      }
    }
    
    if (appointmentsWithInvalidClinic.length > 0) {
      console.log(`❌ Found ${appointmentsWithInvalidClinic.length} appointments with invalid clinic references:`);
      appointmentsWithInvalidClinic.forEach(apt => {
        console.log(`  - Appointment: ${apt.appointmentId}, Clinic: ${apt.clinicId}, Service: ${apt.serviceType}`);
      });
    } else {
      console.log('✅ All appointments have valid clinic references');
    }
    
    // Check specific test patient
    console.log('\n6. Checking specific test patient...');
    const testPatientId = '68a064af75c4d016454241d9';
    const testPatient = await Patient.findById(testPatientId);
    
    if (testPatient) {
      console.log('✅ Test patient found:');
      console.log(`  - ID: ${testPatient._id}`);
      console.log(`  - Name: ${testPatient.firstName} ${testPatient.lastName}`);
      console.log(`  - Email: ${testPatient.email}`);
      console.log(`  - Active: ${testPatient.isActive}`);
      
      // Check appointments for this patient
      const patientAppointments = await Appointment.find({ patientId: testPatientId });
      console.log(`  - Appointments: ${patientAppointments.length}`);
      
      if (patientAppointments.length > 0) {
        console.log('  Patient appointments:');
        patientAppointments.forEach((apt, index) => {
          console.log(`    ${index + 1}. ${apt.serviceType} - ${apt.date} at ${apt.timeSlot} (${apt.status})`);
        });
      }
    } else {
      console.log('❌ Test patient not found');
      console.log('Available patients:');
      const allPatients = await Patient.find({}).select('_id firstName lastName email').limit(10);
      allPatients.forEach(p => {
        console.log(`  - ${p._id}: ${p.firstName} ${p.lastName} (${p.email})`);
      });
    }
    
    // Check appointment status distribution
    console.log('\n7. Checking appointment status distribution...');
    const statusAggregation = await Appointment.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    
    console.log('Appointment status distribution:');
    statusAggregation.forEach(status => {
      console.log(`  - ${status._id}: ${status.count}`);
    });
    
    // Check service type distribution
    console.log('\n8. Checking service type distribution...');
    const serviceAggregation = await Appointment.aggregate([
      {
        $group: {
          _id: '$serviceType',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    
    console.log('Service type distribution:');
    serviceAggregation.forEach(service => {
      console.log(`  - ${service._id}: ${service.count}`);
    });
    
  } catch (error) {
    console.error('❌ Error during data consistency verification:', error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('\n✅ MongoDB Atlas connection closed');
  }
}

// Run the verification
verifyDataConsistency().catch(console.error);
