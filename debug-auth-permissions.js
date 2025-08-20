import axios from 'axios';

const API_BASE = 'http://localhost:3009/api/v1';

async function debugAuthPermissions() {
  try {
    console.log('🔍 Debugging Authentication & Permissions...\n');

    // Test 1: Login as different user types
    console.log('1. Testing Different User Logins:');
    
    const users = [
      { email: 'admin@dentalclinic.com', password: 'Admin123!', role: 'admin' },
      { email: 'staff@dentalclinic.com', password: 'Staff123!', role: 'staff' },
      { email: 'patient@dentalclinic.com', password: 'Patient123!', role: 'patient' }
    ];

    for (const user of users) {
      try {
        console.log(`\n--- Testing ${user.role} login ---`);
        const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
          email: user.email,
          password: user.password
        });
        
        const token = loginResponse.data.data.token;
        const userData = loginResponse.data.data.user;
        
        console.log(`✅ ${user.role} login successful`);
        console.log(`User ID: ${userData.id}`);
        console.log(`User Role: ${userData.role}`);
        console.log(`Token: ${token.substring(0, 20)}...`);
        
        // Test appointment permissions with this user
        await testAppointmentPermissions(token, userData, user.role);
        
      } catch (error) {
        console.log(`❌ ${user.role} login failed:`, error.response?.data?.message || error.message);
      }
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.response?.data?.message || error.message);
  }
}

async function testAppointmentPermissions(token, userData, role) {
  console.log(`\n--- Testing ${role} appointment permissions ---`);
  
  const headers = { Authorization: `Bearer ${token}` };
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const testDate = tomorrow.toISOString().split('T')[0];
  
  // Test 1: Get available time slots
  console.log('Testing: Get Available Time Slots');
  try {
    const slotsResponse = await axios.get(`${API_BASE}/appointments/available-slots`, {
      headers,
      params: {
        dentistId: 'default-dentist-id',
        date: testDate,
        duration: 30
      }
    });
    
    console.log('✅ Available slots access granted');
    console.log(`Slots returned: ${slotsResponse.data.data.availableSlots.length}`);
    
  } catch (error) {
    console.log('❌ Available slots access denied:', error.response?.data?.message);
    console.log('Status:', error.response?.status);
  }
  
  // Test 2: Get appointments (if applicable)
  if (role === 'patient') {
    console.log('Testing: Get Patient Appointments');
    try {
      const appointmentsResponse = await axios.get(`${API_BASE}/patients/${userData.id}/appointments`, {
        headers
      });
      
      console.log('✅ Patient appointments access granted');
      console.log(`Appointments found: ${appointmentsResponse.data.data.appointments.data.length}`);
      
    } catch (error) {
      console.log('❌ Patient appointments access denied:', error.response?.data?.message);
      console.log('Status:', error.response?.status);
    }
  }
  
  // Test 3: Create appointment
  console.log('Testing: Create Appointment');
  try {
    const appointmentData = {
      patientId: userData.id,
      serviceType: 'consultation',
      date: testDate,
      timeSlot: '14:00',
      duration: 30,
      dentistId: 'default-dentist-id'
    };
    
    const createResponse = await axios.post(`${API_BASE}/appointments`, appointmentData, {
      headers
    });
    
    console.log('✅ Create appointment access granted');
    console.log('Appointment ID:', createResponse.data.data.id);
    
  } catch (error) {
    console.log('❌ Create appointment access denied:', error.response?.data?.message);
    console.log('Status:', error.response?.status);
    console.log('Error details:', error.response?.data);
  }
}

debugAuthPermissions();
