import axios from 'axios';

const API_BASE = 'http://localhost:3009/api/v1';

async function debugPatientAppointments500() {
  try {
    console.log('🔍 Debugging Patient Appointments 500 Error...\n');

    // Step 1: Admin login
    console.log('1. Admin Login:');
    const adminLogin = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@dentalclinic.com',
      password: 'Admin123!'
    });
    
    const adminToken = adminLogin.data.data.token;
    console.log('✅ Admin login successful');
    
    const headers = { Authorization: `Bearer ${adminToken}` };
    
    // Step 2: Get all patients first
    console.log('\n2. Getting All Patients:');
    try {
      const patientsResponse = await axios.get(`${API_BASE}/patients`, {
        headers,
        params: { page: 1, limit: 10 }
      });
      
      const patients = patientsResponse.data.data.patients.data;
      console.log(`✅ Found ${patients.length} patients`);
      
      if (patients.length > 0) {
        const testPatient = patients[0];
        console.log('Testing with patient:', testPatient.firstName, testPatient.lastName, testPatient.id);
        
        // Step 3: Test patient appointments endpoint
        console.log('\n3. Testing Patient Appointments Endpoint:');
        try {
          const appointmentsResponse = await axios.get(`${API_BASE}/patients/${testPatient.id}/appointments`, {
            headers,
            params: { page: 1, limit: 10 }
          });
          
          console.log('✅ Patient appointments successful');
          console.log('Response structure:', Object.keys(appointmentsResponse.data));
          console.log('Appointments count:', appointmentsResponse.data.data.appointments.data.length);
          
        } catch (error) {
          console.log('❌ Patient appointments failed:', error.response?.data?.message);
          console.log('Status:', error.response?.status);
          console.log('Error details:', error.response?.data);
          
          // Step 4: Test with the specific patient ID from the error
          console.log('\n4. Testing with Specific Patient ID:');
          const specificPatientId = '68a064af75c4d016454241d9';
          try {
            const specificResponse = await axios.get(`${API_BASE}/patients/${specificPatientId}/appointments`, {
              headers,
              params: { page: 1, limit: 10 }
            });
            
            console.log('✅ Specific patient appointments successful');
            console.log('Appointments count:', specificResponse.data.data.appointments.data.length);
            
          } catch (specificError) {
            console.log('❌ Specific patient appointments failed:', specificError.response?.data?.message);
            console.log('Status:', specificError.response?.status);
            console.log('Error details:', specificError.response?.data);
          }
        }
      } else {
        console.log('❌ No patients found to test with');
      }
      
    } catch (error) {
      console.log('❌ Failed to get patients:', error.response?.data?.message);
      console.log('Status:', error.response?.status);
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.response?.data?.message || error.message);
  }
}

debugPatientAppointments500();
