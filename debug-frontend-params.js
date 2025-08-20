import axios from 'axios';

const API_BASE = 'http://localhost:3009/api/v1';

// Simulate the frontend apiService call
async function testFrontendAPICall() {
  try {
    console.log('🔍 Debugging Frontend API Parameters...\n');

    // Login
    const adminLogin = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@dentalclinic.com',
      password: 'Admin123!'
    });
    
    const adminToken = adminLogin.data.data.token;
    console.log('✅ Login successful\n');

    // Simulate frontend formData
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const testDate = tomorrow.toISOString().split('T')[0];
    
    const frontendFormData = {
      date: testDate,
      serviceType: 'consultation',
      duration: 30
    };
    
    console.log('📋 Frontend form data:', frontendFormData);
    
    // Test different scenarios that could cause issues
    
    // Scenario 1: Exactly what frontend sends
    console.log('\n1. Testing Exact Frontend Parameters:');
    const frontendParams = {
      dentistId: 'default-dentist-id',
      date: frontendFormData.date,
      duration: frontendFormData.duration
    };
    
    console.log('Frontend params:', JSON.stringify(frontendParams));
    
    try {
      const frontendResponse = await axios.get(`${API_BASE}/appointments/available-slots`, {
        headers: { Authorization: `Bearer ${adminToken}` },
        params: frontendParams
      });
      
      console.log('✅ Frontend-style request successful');
      console.log('Slots returned:', frontendResponse.data.data?.availableSlots?.length || 0);
      
    } catch (error) {
      console.log('❌ Frontend-style request failed:', error.response?.data?.message || error.message);
      console.log('Response data:', error.response?.data);
    }

    // Scenario 2: Check if duration is being sent as string vs number
    console.log('\n2. Testing Duration Format Issues:');
    
    const testDurations = [
      30,           // number
      '30',         // string
      '30min',      // string with unit
      undefined,    // missing
      null          // null
    ];
    
    for (const duration of testDurations) {
      console.log(`\n  Testing duration: ${JSON.stringify(duration)} (${typeof duration})`);
      
      const params = {
        dentistId: 'default-dentist-id',
        date: testDate,
        ...(duration !== undefined && duration !== null && { duration })
      };
      
      try {
        const response = await axios.get(`${API_BASE}/appointments/available-slots`, {
          headers: { Authorization: `Bearer ${adminToken}` },
          params
        });
        
        console.log(`  ✅ Success: ${response.data.data?.availableSlots?.length || 0} slots`);
        
      } catch (error) {
        console.log(`  ❌ Failed: ${error.response?.data?.message || error.message}`);
      }
    }

    // Scenario 3: Check date format issues
    console.log('\n3. Testing Date Format Issues:');
    
    const testDates = [
      testDate,                    // YYYY-MM-DD
      new Date(testDate).toISOString(), // Full ISO string
      new Date(testDate).toString(),    // Date toString
      testDate + 'T00:00:00.000Z',     // ISO with time
      ''                               // empty string
    ];
    
    for (const date of testDates) {
      console.log(`\n  Testing date: "${date}"`);
      
      const params = {
        dentistId: 'default-dentist-id',
        date: date,
        duration: 30
      };
      
      try {
        const response = await axios.get(`${API_BASE}/appointments/available-slots`, {
          headers: { Authorization: `Bearer ${adminToken}` },
          params
        });
        
        console.log(`  ✅ Success: ${response.data.data?.availableSlots?.length || 0} slots`);
        
      } catch (error) {
        console.log(`  ❌ Failed: ${error.response?.data?.message || error.message}`);
      }
    }

    // Scenario 4: Check if there's an authorization issue
    console.log('\n4. Testing Authorization Issues:');
    
    const params = {
      dentistId: 'default-dentist-id',
      date: testDate,
      duration: 30
    };
    
    // Test without token
    try {
      const noAuthResponse = await axios.get(`${API_BASE}/appointments/available-slots`, {
        params
      });
      
      console.log('✅ No auth needed:', noAuthResponse.data.data?.availableSlots?.length || 0, 'slots');
      
    } catch (error) {
      console.log('❌ Auth required:', error.response?.status, error.response?.data?.message);
    }

    // Test with invalid token
    try {
      const badAuthResponse = await axios.get(`${API_BASE}/appointments/available-slots`, {
        headers: { Authorization: 'Bearer invalid-token' },
        params
      });
      
      console.log('✅ Bad auth accepted:', badAuthResponse.data.data?.availableSlots?.length || 0, 'slots');
      
    } catch (error) {
      console.log('❌ Bad auth rejected:', error.response?.status, error.response?.data?.message);
    }

    console.log('\n🎯 Key Insights:');
    console.log('- Backend API works correctly with proper parameters');
    console.log('- Issue is likely in frontend parameter formatting or API call setup');
    console.log('- Check for authorization, data types, and request structure');

  } catch (error) {
    console.error('❌ Debug failed:', error.response?.data?.message || error.message);
  }
}

testFrontendAPICall();
