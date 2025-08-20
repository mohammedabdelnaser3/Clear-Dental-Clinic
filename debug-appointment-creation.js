import axios from 'axios';

const API_BASE = 'http://localhost:3009/api/v1';

async function debugAppointmentCreation() {
  try {
    console.log('🔍 Debugging Appointment Creation Process...\n');

    // 1. Test authentication first
    console.log('1. Testing Authentication...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@dentalclinic.com',
      password: 'Admin123!'
    });
    
    if (!loginResponse.data.success) {
      console.log('❌ Login failed:', loginResponse.data.message);
      return;
    }
    
    const token = loginResponse.data.data.token;
    console.log('✅ Login successful');
    console.log('🔑 Token received:', token ? 'Yes' : 'No');
    console.log('');

    // 2. Test patient data fetching
    console.log('2. Testing Patient Data Fetching...');
    const patientsResponse = await axios.get(`${API_BASE}/patients`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Patients endpoint response status:', patientsResponse.status);
    console.log('📊 Patients data structure:', Object.keys(patientsResponse.data));
    
    const patients = patientsResponse.data.data?.data || [];
    console.log('👥 Number of patients found:', patients.length);
    
    if (patients.length === 0) {
      console.log('❌ No patients found - this will prevent appointment creation');
      return;
    }
    
    const testPatient = patients[0];
    console.log('🧑‍⚕️ Test patient:', {
      id: testPatient._id || testPatient.id,
      name: `${testPatient.firstName} ${testPatient.lastName}`,
      email: testPatient.email
    });
    console.log('');

    // 3. Test dentist availability
    console.log('3. Testing Dentist Availability...');
    try {
      const dentistsResponse = await axios.get(`${API_BASE}/users?role=dentist`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✅ Dentists endpoint accessible');
      const dentists = dentistsResponse.data.data?.data || [];
      console.log('👨‍⚕️ Number of dentists found:', dentists.length);
      
      if (dentists.length > 0) {
        const testDentist = dentists[0];
        console.log('🦷 Test dentist:', {
          id: testDentist._id || testDentist.id,
          name: `${testDentist.firstName} ${testDentist.lastName}`,
          specialization: testDentist.specialization
        });
      }
    } catch (error) {
      console.log('⚠️ Cannot fetch dentists directly, using default assignment');
    }
    console.log('');

    // 4. Test time slots fetching
    console.log('4. Testing Time Slots Fetching...');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const testDate = tomorrow.toISOString().split('T')[0];
    
    try {
      const timeSlotsResponse = await axios.get(`${API_BASE}/appointments/available-slots`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          dentistId: 'default-dentist-id',
          date: testDate,
          duration: 60
        }
      });
      
      console.log('✅ Time slots endpoint accessible');
      console.log('⏰ Available slots:', timeSlotsResponse.data.data?.availableSlots?.length || 0);
    } catch (error) {
      console.log('⚠️ Time slots fetch error:', error.response?.data?.message || error.message);
    }
    console.log('');

    // 5. Test actual appointment creation
    console.log('5. Testing Appointment Creation...');
    const appointmentData = {
      patientId: testPatient._id || testPatient.id,
      dentistId: 'default-dentist-id',
      serviceType: 'حشو ليزر',
      date: testDate,
      timeSlot: '10:00',
      duration: 60,
      notes: 'Debug test appointment',
      status: 'scheduled'
    };
    
    console.log('📋 Appointment data to send:', JSON.stringify(appointmentData, null, 2));
    
    const appointmentResponse = await axios.post(`${API_BASE}/appointments`, appointmentData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Appointment created successfully!');
    console.log('📅 Appointment ID:', appointmentResponse.data.data?.appointment?.id);
    console.log('🔍 Full response structure:', Object.keys(appointmentResponse.data));
    console.log('');

    // 6. Verify appointment was saved
    console.log('6. Verifying Appointment was Saved...');
    const verifyResponse = await axios.get(`${API_BASE}/appointments`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const allAppointments = verifyResponse.data.data?.data || [];
    console.log('📊 Total appointments in system:', allAppointments.length);
    
    const recentAppointment = allAppointments.find(apt => 
      apt.notes === 'Debug test appointment'
    );
    
    if (recentAppointment) {
      console.log('✅ Debug appointment found in database');
      console.log('📅 Appointment details:', {
        id: recentAppointment.id,
        patient: recentAppointment.patientId?.firstName + ' ' + recentAppointment.patientId?.lastName,
        service: recentAppointment.serviceType,
        date: recentAppointment.date,
        time: recentAppointment.timeSlot,
        status: recentAppointment.status
      });
    } else {
      console.log('❌ Debug appointment NOT found in database');
    }

    console.log('\n🎉 Appointment Creation Debug Complete!');

  } catch (error) {
    console.error('❌ Debug failed at step:', error.config?.url || 'Unknown');
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

debugAppointmentCreation();
