import axios from 'axios';

const API_BASE = 'http://localhost:3009/api/v1';

async function debugTimeSlots() {
  try {
    console.log('🔍 Debugging Time Slots Issue...\n');

    // Login first
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@dentalclinic.com',
      password: 'Admin123!'
    });
    
    const token = loginResponse.data.data.token;
    console.log('✅ Login successful\n');

    // Test different combinations of time slot parameters
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const testDate = tomorrow.toISOString().split('T')[0];

    console.log('Testing time slot requests with different parameters...\n');

    // Test 1: With default dentist ID
    console.log('1. Testing with default-dentist-id...');
    try {
      const response1 = await axios.get(`${API_BASE}/appointments/available-slots`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          dentistId: 'default-dentist-id',
          date: testDate,
          duration: 60
        }
      });
      console.log('✅ Success with default-dentist-id');
      console.log('📊 Slots:', response1.data.data?.availableSlots?.length || 0);
    } catch (error) {
      console.log('❌ Failed with default-dentist-id');
      console.log('📝 Error:', error.response?.data?.message || error.message);
      if (error.response?.data?.errors) {
        console.log('🔍 Validation errors:', JSON.stringify(error.response.data.errors, null, 2));
      }
    }

    console.log('');

    // Test 2: With real dentist ID
    console.log('2. Testing with real dentist ID...');
    try {
      const dentistsResponse = await axios.get(`${API_BASE}/users?role=dentist`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const dentists = dentistsResponse.data.data?.data || [];
      if (dentists.length > 0) {
        const realDentistId = dentists[0]._id || dentists[0].id;
        console.log('🦷 Using dentist ID:', realDentistId);
        
        const response2 = await axios.get(`${API_BASE}/appointments/available-slots`, {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            dentistId: realDentistId,
            date: testDate,
            duration: 60
          }
        });
        console.log('✅ Success with real dentist ID');
        console.log('📊 Slots:', response2.data.data?.availableSlots?.length || 0);
      }
    } catch (error) {
      console.log('❌ Failed with real dentist ID');
      console.log('📝 Error:', error.response?.data?.message || error.message);
      if (error.response?.data?.errors) {
        console.log('🔍 Validation errors:', JSON.stringify(error.response.data.errors, null, 2));
      }
    }

    console.log('');

    // Test 3: Without dentist ID
    console.log('3. Testing without dentist ID...');
    try {
      const response3 = await axios.get(`${API_BASE}/appointments/available-slots`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          date: testDate,
          duration: 60
        }
      });
      console.log('✅ Success without dentist ID');
      console.log('📊 Slots:', response3.data.data?.availableSlots?.length || 0);
    } catch (error) {
      console.log('❌ Failed without dentist ID');
      console.log('📝 Error:', error.response?.data?.message || error.message);
      if (error.response?.data?.errors) {
        console.log('🔍 Validation errors:', JSON.stringify(error.response.data.errors, null, 2));
      }
    }

    console.log('');

    // Test 4: Check the route definition
    console.log('4. Testing route access...');
    try {
      const response4 = await axios.get(`${API_BASE}/appointments/available-slots`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Route accessible');
    } catch (error) {
      console.log('❌ Route access failed');
      console.log('📝 Error:', error.response?.data?.message || error.message);
      console.log('🔍 Status:', error.response?.status);
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugTimeSlots();
