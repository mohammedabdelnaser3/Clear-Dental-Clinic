import axios from 'axios';

// Test configuration
const API_BASE_URL = 'http://localhost:3009';
const TEST_TOKEN = 'your-test-token-here'; // Replace with actual token

// Test data
const testAppointmentData = {
  patientId: '68a064af75c4d016454241d9',
  dentistId: 'default-dentist-id',
  serviceType: 'whitening',
  date: '2025-08-17',
  timeSlot: '13:00',
  duration: 60,
  notes: 'Test appointment'
};

async function testAppointmentCreation() {
  console.log('🧪 Testing Appointment Creation Endpoint');
  console.log('==========================================');
  
  try {
    // Test 1: Check if server is running
    console.log('\n1. Testing server connectivity...');
    const healthResponse = await axios.get(`${API_BASE_URL}/api/v1/health`, {
      timeout: 5000
    });
    console.log('✅ Server is running');
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Server is not running. Please start the backend server.');
      return;
    } else if (error.response?.status === 404) {
      console.log('⚠️  Health endpoint not found, but server is running');
    } else {
      console.log('❌ Server connectivity error:', error.message);
      return;
    }
  }

  try {
    // Test 2: Test appointment creation without auth
    console.log('\n2. Testing appointment creation without authentication...');
    const response = await axios.post(`${API_BASE_URL}/api/v1/appointments`, testAppointmentData, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    console.log('❌ Unexpected success without auth:', response.status);
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ Correctly rejected without authentication');
    } else {
      console.log('❌ Unexpected error:', error.message);
    }
  }

  try {
    // Test 3: Test appointment creation with auth
    console.log('\n3. Testing appointment creation with authentication...');
    const response = await axios.post(`${API_BASE_URL}/api/v1/appointments`, testAppointmentData, {
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_TOKEN}`
      }
    });
    
    console.log('✅ Appointment created successfully!');
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    
    // Validate response structure
    if (response.data.success && response.data.data && response.data.data.appointment) {
      console.log('✅ Response structure is correct');
    } else {
      console.log('❌ Invalid response structure');
    }
    
  } catch (error) {
    console.log('❌ Appointment creation failed:');
    
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Status Text:', error.response.statusText);
      console.log('Data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.log('Network Error:', error.message);
      console.log('Error Code:', error.code);
      console.log('Error Number:', error.errno);
    } else {
      console.log('Error:', error.message);
    }
  }

  // Test 4: Test with invalid data
  console.log('\n4. Testing with invalid data...');
  const invalidData = {
    ...testAppointmentData,
    patientId: 'invalid-id',
    date: '2020-01-01' // Past date
  };

  try {
    const response = await axios.post(`${API_BASE_URL}/api/v1/appointments`, invalidData, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_TOKEN}`
      }
    });
    console.log('❌ Unexpected success with invalid data');
  } catch (error) {
    if (error.response?.status === 422 || error.response?.status === 400) {
      console.log('✅ Correctly rejected invalid data');
      console.log('Validation errors:', error.response.data);
    } else {
      console.log('❌ Unexpected error with invalid data:', error.message);
    }
  }
}

// Run the test
testAppointmentCreation().catch(console.error);
