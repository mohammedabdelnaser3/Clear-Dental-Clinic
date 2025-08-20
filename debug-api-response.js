import axios from 'axios';

const API_BASE = 'http://localhost:3009/api/v1';

async function debugApiResponse() {
  try {
    console.log('🔍 Debugging API Response Structure...\n');

    // Login as admin
    const adminLogin = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@dentalclinic.com',
      password: 'Admin123!'
    });
    
    const adminToken = adminLogin.data.data.token;
    console.log('✅ Admin login successful');
    
    // Get tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const testDate = tomorrow.toISOString().split('T')[0];
    
    console.log('📅 Testing date:', testDate);
    
    // Make the API call
    console.log('\n1. Testing Direct API Call:');
    const params = {
      dentistId: 'default-dentist-id',
      date: testDate,
      duration: 30
    };
    
    console.log('Request params:', params);
    
    try {
      const response = await axios.get(`${API_BASE}/appointments/available-slots`, {
        headers: { Authorization: `Bearer ${adminToken}` },
        params
      });
      
      console.log('✅ API call successful');
      console.log('Status code:', response.status);
      console.log('Response structure:', Object.keys(response.data));
      
      if (response.data.data) {
        console.log('Data structure:', Object.keys(response.data.data));
      }
      
      // Check for availableSlots
      const availableSlots = response.data.data?.availableSlots || [];
      console.log('Available slots array:', Array.isArray(availableSlots));
      console.log('Available slots length:', availableSlots.length);
      
      if (availableSlots.length > 0) {
        console.log('First slot type:', typeof availableSlots[0]);
        console.log('First slot sample:', availableSlots[0]);
      }
      
      // Examine the full response
      console.log('\nFull response data:');
      console.log(JSON.stringify(response.data, null, 2));
      
    } catch (error) {
      console.log('❌ API call failed:', error.response?.data?.message || error.message);
      console.log('Status code:', error.response?.status);
    }
    
    // Test with axios directly vs through wrapper
    console.log('\n2. Testing Frontend API Service Simulation:');
    
    // Simulate the frontend apiService.get function
    const simulateApiGet = async (url, params) => {
      try {
        const response = await axios.get(`${API_BASE}${url}`, {
          headers: { Authorization: `Bearer ${adminToken}` },
          params
        });
        
        // Transform to match frontend service structure
        return {
          success: true,
          data: response.data.data,
          message: response.data.message
        };
      } catch (error) {
        console.error('API error:', error);
        return {
          success: false,
          data: null,
          message: error.response?.data?.message || error.message
        };
      }
    };
    
    // Test the simulated service
    const serviceResponse = await simulateApiGet('/appointments/available-slots', params);
    console.log('Service success:', serviceResponse.success);
    console.log('Service data:', serviceResponse.data);
    
    if (serviceResponse.data) {
      console.log('Service data keys:', Object.keys(serviceResponse.data));
      console.log('AvailableSlots:', serviceResponse.data.availableSlots?.length || 0);
    }
    
    // Test a different date to see if it's date specific
    console.log('\n3. Testing Different Date:');
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextWeekDate = nextWeek.toISOString().split('T')[0];
    
    console.log('Next week date:', nextWeekDate);
    
    const nextWeekResponse = await axios.get(`${API_BASE}/appointments/available-slots`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      params: {
        dentistId: 'default-dentist-id',
        date: nextWeekDate,
        duration: 30
      }
    });
    
    const nextWeekSlots = nextWeekResponse.data.data?.availableSlots || [];
    console.log('Next week slots:', nextWeekSlots.length);
    
    if (nextWeekSlots.length > 0) {
      console.log('Sample slots:', nextWeekSlots.slice(0, 3));
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.response?.data?.message || error.message);
  }
}

debugApiResponse();
