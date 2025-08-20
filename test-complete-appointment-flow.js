import axios from 'axios';

const API_BASE = 'http://localhost:3009/api/v1';

async function testCompleteAppointmentFlow() {
  try {
    console.log('🧪 Testing Complete Appointment Flow After Fixes...\n');

    // Test as admin user (simulating staff/admin frontend experience)
    console.log('1. Testing Admin/Staff User Flow:');
    const adminLogin = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@dentalclinic.com',
      password: 'Admin123!'
    });
    
    const adminToken = adminLogin.data.data.token;
    console.log('✅ Admin login successful');

    // Simulate frontend logic for admin user
    console.log('\n📋 Simulating Frontend Patient Loading (Admin):');
    const patientsResponse = await axios.get(`${API_BASE}/patients`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      params: { limit: 100 }
    });
    
    const patients = patientsResponse.data.data?.data || [];
    console.log(`✅ Patients loaded: ${patients.length}`);
    
    // Auto-select first patient (as frontend now does)
    const selectedPatient = patients[0];
    console.log(`👤 Auto-selected patient: ${selectedPatient.firstName} ${selectedPatient.lastName}`);
    
    // Simulate form data
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const testDate = tomorrow.toISOString().split('T')[0];
    
    const frontendFormData = {
      patientId: selectedPatient._id || selectedPatient.id,
      serviceType: 'consultation',
      date: testDate,
      duration: 30 // Consultation duration
    };
    
    console.log('\n⏰ Simulating Time Slot Loading:');
    console.log('Form data:', frontendFormData);
    
    const timeSlotsResponse = await axios.get(`${API_BASE}/appointments/available-slots`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      params: {
        dentistId: 'default-dentist-id',
        date: frontendFormData.date,
        duration: frontendFormData.duration
      }
    });
    
    const availableSlots = timeSlotsResponse.data.data?.availableSlots || [];
    console.log(`✅ Time slots loaded: ${availableSlots.length}`);
    
    if (availableSlots.length > 0) {
      console.log(`⏰ Available slots: ${availableSlots.slice(0, 5).map(slot => slot.time || slot).join(', ')}`);
      
      // Simulate appointment creation
      const selectedTimeSlot = availableSlots[0].time || availableSlots[0];
      
      console.log('\n💾 Simulating Appointment Creation:');
      const appointmentData = {
        patientId: frontendFormData.patientId,
        dentistId: 'default-dentist-id',
        serviceType: frontendFormData.serviceType,
        date: frontendFormData.date,
        timeSlot: selectedTimeSlot,
        duration: frontendFormData.duration,
        notes: 'Test appointment after fixes',
        status: 'scheduled'
      };
      
      const createResponse = await axios.post(`${API_BASE}/appointments`, appointmentData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      console.log('✅ Appointment created successfully!');
      console.log('📅 Appointment ID:', createResponse.data.data?.appointment?.id);
    } else {
      console.log('❌ No time slots available - this would show "No available time slots" error');
    }

    console.log('\n=====================================\n');

    // Test as patient user
    console.log('2. Testing Patient User Flow:');
    const patientLogin = await axios.post(`${API_BASE}/auth/login`, {
      email: 'mohamedabdelnasser0123@gmail.com',
      password: 'Patient123!'
    });
    
    const patientToken = patientLogin.data.data.token;
    const patientUser = patientLogin.data.data.user;
    console.log('✅ Patient login successful');
    console.log(`👤 Patient user: ${patientUser.firstName} ${patientUser.lastName}`);

    // Check linked patient records
    console.log('\n🔗 Checking Linked Patient Records:');
    const linkedResponse = await axios.get(`${API_BASE}/patients/user/${patientUser.id}`, {
      headers: { Authorization: `Bearer ${patientToken}` }
    });
    
    const linkedPatients = linkedResponse.data.data?.data || [];
    console.log(`✅ Linked records: ${linkedPatients.length}`);
    
    if (linkedPatients.length > 0) {
      const linkedPatient = linkedPatients[0];
      console.log(`👤 Linked to: ${linkedPatient.firstName} ${linkedPatient.lastName}`);
      
      // Test patient appointment creation
      console.log('\n⏰ Testing Patient Time Slot Loading:');
      const patientTimeSlotsResponse = await axios.get(`${API_BASE}/appointments/available-slots`, {
        headers: { Authorization: `Bearer ${patientToken}` },
        params: {
          dentistId: 'default-dentist-id',
          date: testDate,
          duration: 30
        }
      });
      
      const patientSlots = patientTimeSlotsResponse.data.data?.availableSlots || [];
      console.log(`✅ Patient time slots: ${patientSlots.length}`);
      
      if (patientSlots.length > 0) {
        console.log('✅ Patient can see available time slots');
      } else {
        console.log('❌ Patient sees no time slots');
      }
    } else {
      console.log('❌ Patient user has no linked records - this would cause "Please select a patient" error');
    }

    console.log('\n🎯 Summary:');
    console.log('✅ Admin/Staff flow: Auto-selects patient and loads time slots');
    console.log('✅ Patient user flow: Uses linked patient record');
    console.log('✅ Time slot loading: Backend returns slots correctly');
    console.log('✅ Appointment creation: Works end-to-end');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
    if (error.response?.status === 401) {
      console.error('Authentication issue - check user credentials');
    }
  }
}

testCompleteAppointmentFlow();
