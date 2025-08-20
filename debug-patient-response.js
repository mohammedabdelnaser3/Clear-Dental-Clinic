import axios from 'axios';

const API_BASE = 'http://localhost:3009/api/v1';

async function debugPatientResponse() {
  try {
    console.log('🔍 Debugging Patient Response Structure...\n');

    // Login as patient user
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'mohamedabdelnasser0123@gmail.com',
      password: 'Patient123!'
    });
    
    const token = loginResponse.data.data.token;
    const user = loginResponse.data.data.user;
    console.log('✅ Patient login successful');
    console.log(`👤 User: ${user.firstName} ${user.lastName} (${user.id})\n`);

    // Check linked patients response structure
    console.log('📋 Checking linked patients response:');
    const linkedResponse = await axios.get(`${API_BASE}/patients/user/${user.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('📝 Full response structure:');
    console.log(JSON.stringify(linkedResponse.data, null, 2));
    
    const linkedPatients = linkedResponse.data.data?.data || [];
    console.log(`\n🔗 Linked patients count: ${linkedPatients.length}`);
    
    if (linkedPatients.length > 0) {
      const firstPatient = linkedPatients[0];
      console.log('\n👤 First patient object:');
      console.log(JSON.stringify(firstPatient, null, 2));
      
      console.log('\n🔍 Available ID fields:');
      console.log('id:', firstPatient.id);
      console.log('_id:', firstPatient._id);
      console.log('patientId:', firstPatient.patientId);
      
      // Try to access this patient using both potential ID fields
      const possibleIds = [firstPatient.id, firstPatient._id, firstPatient.patientId].filter(Boolean);
      
      for (const testId of possibleIds) {
        console.log(`\n🧪 Testing patient access with ID: ${testId}`);
        try {
          const patientResponse = await axios.get(`${API_BASE}/patients/${testId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          console.log(`✅ Success with ID ${testId}`);
          console.log('Patient data:', {
            firstName: patientResponse.data.data?.firstName,
            lastName: patientResponse.data.data?.lastName,
            email: patientResponse.data.data?.email
          });
        } catch (error) {
          console.log(`❌ Failed with ID ${testId}:`, error.response?.data?.message || error.message);
        }
      }
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.response?.data?.message || error.message);
    if (error.response?.status === 401) {
      console.log('📝 Note: Patient password might need to be updated');
    }
  }
}

debugPatientResponse();
