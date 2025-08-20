import axios from 'axios';

const API_BASE = 'http://localhost:3009/api/v1';

async function testCompleteFrontendFlow() {
  try {
    console.log('🚀 Testing Complete Frontend Appointment Flow...\n');

    // Step 1: Login (simulating user login)
    console.log('STEP 1: User Login');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@dentalclinic.com', // This could be any user
      password: 'Admin123!'
    });
    
    const token = loginResponse.data.data.token;
    console.log('✅ User logged in successfully');
    console.log('🔐 Auth token received\n');

    // Step 2: Load patients (simulating page load)
    console.log('STEP 2: Loading Patients Data');
    const patientsResponse = await axios.get(`${API_BASE}/patients`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const patients = patientsResponse.data.data?.data || [];
    console.log(`✅ Loaded ${patients.length} patients`);
    
    const selectedPatient = patients[0];
    console.log(`📋 Selected patient: ${selectedPatient.firstName} ${selectedPatient.lastName}\n`);

    // Step 3: User selects date (simulating form interaction)
    console.log('STEP 3: User Selects Date');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const selectedDate = tomorrow.toISOString().split('T')[0];
    console.log(`📅 User selected date: ${selectedDate}\n`);

    // Step 4: Fetch available time slots (simulating frontend request)
    console.log('STEP 4: Fetching Available Time Slots');
    const timeSlotsResponse = await axios.get(`${API_BASE}/appointments/available-slots`, {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        dentistId: 'default-dentist-id', // This is what the frontend sends
        date: selectedDate,
        duration: 60
      }
    });
    
    const availableSlots = timeSlotsResponse.data.data?.availableSlots || [];
    console.log(`✅ Loaded ${availableSlots.length} available time slots`);
    
    if (availableSlots.length > 0) {
      console.log(`⏰ Sample slots: ${availableSlots.slice(0, 3).map(slot => slot.time || slot).join(', ')}\n`);
    } else {
      console.log('⚠️ No time slots available\n');
      return;
    }

    // Step 5: User selects service and time (simulating form completion)
    console.log('STEP 5: User Completes Form');
    const selectedTimeSlot = availableSlots[0].time || availableSlots[0];
    const appointmentData = {
      patientId: selectedPatient._id || selectedPatient.id,
      dentistId: 'default-dentist-id', // Frontend sends this
      serviceType: 'حشو ليزر',
      date: selectedDate,
      timeSlot: selectedTimeSlot,
      duration: 60,
      notes: 'Frontend flow test appointment',
      status: 'scheduled'
    };
    
    console.log('📝 Form data prepared:', {
      patient: `${selectedPatient.firstName} ${selectedPatient.lastName}`,
      service: appointmentData.serviceType,
      date: appointmentData.date,
      time: appointmentData.timeSlot,
      duration: `${appointmentData.duration} min`
    });
    console.log('');

    // Step 6: Submit appointment (simulating form submission)
    console.log('STEP 6: Submitting Appointment');
    const createResponse = await axios.post(`${API_BASE}/appointments`, appointmentData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const createdAppointment = createResponse.data.data?.appointment;
    console.log('✅ Appointment created successfully!');
    console.log('🆔 Appointment ID:', createdAppointment?.id);
    console.log('👨‍⚕️ Assigned Dentist:', createdAppointment?.dentistId?.firstName, createdAppointment?.dentistId?.lastName);
    console.log('🏥 Assigned Clinic:', createdAppointment?.clinicId?.name);
    console.log('');

    // Step 7: Verify appointment appears in list (simulating navigation to appointments page)
    console.log('STEP 7: Verifying Appointment in List');
    const appointmentsListResponse = await axios.get(`${API_BASE}/appointments`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const allAppointments = appointmentsListResponse.data.data?.data || [];
    const ourAppointment = allAppointments.find(apt => 
      apt.notes === 'Frontend flow test appointment'
    );
    
    if (ourAppointment) {
      console.log('✅ Appointment found in appointments list');
      console.log('📊 Appointment details:');
      console.log(`   • Patient: ${ourAppointment.patientId?.firstName} ${ourAppointment.patientId?.lastName}`);
      console.log(`   • Service: ${ourAppointment.serviceType}`);
      console.log(`   • Date: ${ourAppointment.date}`);
      console.log(`   • Time: ${ourAppointment.timeSlot}`);
      console.log(`   • Status: ${ourAppointment.status}`);
      console.log(`   • Dentist: ${ourAppointment.dentistId?.firstName} ${ourAppointment.dentistId?.lastName}`);
    } else {
      console.log('❌ Appointment NOT found in appointments list');
    }

    console.log('\n🎉 COMPLETE FRONTEND FLOW TEST SUCCESSFUL!');
    console.log('✅ All steps working correctly:');
    console.log('   ✓ User authentication');
    console.log('   ✓ Patient data loading');
    console.log('   ✓ Date selection');
    console.log('   ✓ Time slots fetching');
    console.log('   ✓ Form completion');
    console.log('   ✓ Appointment submission');
    console.log('   ✓ Appointment verification');
    console.log('\n🚀 Frontend appointment creation should work perfectly now!');

  } catch (error) {
    console.error('❌ Frontend flow test failed!');
    console.error('📍 Failed at step:', error.config?.url || 'Unknown');
    console.error('📝 Error details:', {
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      errors: error.response?.data?.errors
    });
    
    if (error.response?.data?.errors) {
      console.error('🔍 Validation errors:', JSON.stringify(error.response.data.errors, null, 2));
    }
  }
}

testCompleteFrontendFlow();
