import axios from 'axios';

const API_BASE = 'http://localhost:3009/api/v1';

async function testSimpleEndpoints() {
  try {
    console.log('🔍 Testing Simple Endpoints...\n');

    // Step 1: Health check
    console.log('1. Health Check:');
    try {
      const healthResponse = await axios.get(`${API_BASE.replace('/api/v1', '')}/health`);
      console.log('✅ Health check:', healthResponse.data.message);
    } catch (error) {
      console.log('❌ Health check failed:', error.message);
    }

    // Step 2: Admin login
    console.log('\n2. Admin Login:');
    const adminLogin = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@dentalclinic.com',
      password: 'Admin123!'
    });
    
    const adminToken = adminLogin.data.data.token;
    console.log('✅ Admin login successful');
    
    const headers = { Authorization: `Bearer ${adminToken}` };
    
    // Step 3: Test clinics endpoint (should work)
    console.log('\n3. Testing Clinics Endpoint:');
    try {
      const clinicsResponse = await axios.get(`${API_BASE}/clinics`, { headers });
      console.log('✅ Clinics endpoint successful');
      console.log('Clinics count:', clinicsResponse.data.data.clinics.data.length);
    } catch (error) {
      console.log('❌ Clinics endpoint failed:', error.response?.data?.message);
      console.log('Status:', error.response?.status);
    }
    
    // Step 4: Test patients endpoint with minimal params
    console.log('\n4. Testing Patients Endpoint (Minimal):');
    try {
      const patientsResponse = await axios.get(`${API_BASE}/patients`, { headers });
      console.log('✅ Patients endpoint successful');
      console.log('Response structure:', Object.keys(patientsResponse.data));
      console.log('Patients count:', patientsResponse.data.data.patients.data.length);
    } catch (error) {
      console.log('❌ Patients endpoint failed:', error.response?.data?.message);
      console.log('Status:', error.response?.status);
      console.log('Error details:', error.response?.data);
    }
    
    // Step 5: Test patients endpoint with pagination
    console.log('\n5. Testing Patients Endpoint (With Pagination):');
    try {
      const patientsResponse2 = await axios.get(`${API_BASE}/patients`, {
        headers,
        params: { page: 1, limit: 10 }
      });
      console.log('✅ Patients with pagination successful');
      console.log('Patients count:', patientsResponse2.data.data.patients.data.length);
    } catch (error) {
      console.log('❌ Patients with pagination failed:', error.response?.data?.message);
      console.log('Status:', error.response?.status);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
  }
}

testSimpleEndpoints();
