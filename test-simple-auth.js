import axios from 'axios';

const API_BASE = 'http://localhost:3009/api/v1';

async function testSimpleAuth() {
  try {
    console.log('🔍 Testing Simple Authentication...\n');

    // Test 1: Health check (no auth required)
    console.log('1. Testing Health Check:');
    try {
      const healthResponse = await axios.get(`${API_BASE.replace('/api/v1', '')}/health`);
      console.log('✅ Health check successful:', healthResponse.data.message);
    } catch (error) {
      console.log('❌ Health check failed:', error.message);
    }

    // Test 2: Admin login
    console.log('\n2. Testing Admin Login:');
    try {
      const adminLogin = await axios.post(`${API_BASE}/auth/login`, {
        email: 'admin@dentalclinic.com',
        password: 'Admin123!'
      });
      
      const adminToken = adminLogin.data.data.token;
      console.log('✅ Admin login successful');
      console.log('Admin user:', adminLogin.data.data.user.email, adminLogin.data.data.user.role);
      
      // Test 3: Time slots access with admin
      console.log('\n3. Testing Time Slots with Admin:');
      const headers = { Authorization: `Bearer ${adminToken}` };
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const testDate = tomorrow.toISOString().split('T')[0];
      
      const slotsResponse = await axios.get(`${API_BASE}/appointments/available-slots`, {
        headers,
        params: {
          dentistId: 'default-dentist-id',
          date: testDate,
          duration: 30
        }
      });
      
      console.log('✅ Time slots access successful');
      console.log('Available slots:', slotsResponse.data.data.availableSlots.length);
      
      // Test 4: Check if there are any patients
      console.log('\n4. Checking for Patients:');
      try {
        const patientsResponse = await axios.get(`${API_BASE}/patients`, { headers });
        const patients = patientsResponse.data.data.patients.data;
        console.log(`✅ Found ${patients.length} patients`);
        
        if (patients.length > 0) {
          console.log('First patient:', patients[0].firstName, patients[0].lastName, patients[0].id);
          
          // Test 5: Create appointment with first patient
          console.log('\n5. Testing Appointment Creation:');
          const appointmentData = {
            patientId: patients[0].id,
            serviceType: 'consultation',
            date: testDate,
            timeSlot: '14:00',
            duration: 30,
            dentistId: 'default-dentist-id'
          };
          
          const appointmentResponse = await axios.post(`${API_BASE}/appointments`, appointmentData, { headers });
          console.log('✅ Appointment created successfully');
          console.log('Appointment ID:', appointmentResponse.data.data.id);
        } else {
          console.log('❌ No patients found - this might be the issue');
        }
        
      } catch (error) {
        console.log('❌ Failed to get patients:', error.response?.data?.message);
        console.log('Status:', error.response?.status);
      }
      
    } catch (error) {
      console.log('❌ Admin login failed:', error.response?.data?.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testSimpleAuth();
