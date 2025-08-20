import axios from 'axios';

// Test configuration
const API_BASE_URL = 'http://localhost:3009';
const TEST_PATIENT_ID = '68a064af75c4d016454241d9';

// You'll need to get a valid token from your login system
const TEST_TOKEN = 'your-actual-token-here'; // Replace with actual token

async function testAtlasAPI() {
  console.log('🧪 Testing API with MongoDB Atlas Data');
  console.log('=======================================');
  
  try {
    // Test 1: Check if server is running
    console.log('\n1. Testing server connectivity...');
    try {
      await axios.get(`${API_BASE_URL}/api/v1/health`, { timeout: 5000 });
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

    // Test 2: Test patient appointments endpoint
    console.log('\n2. Testing patient appointments endpoint...');
    try {
      const response = await axios.get(`${API_BASE_URL}/api/v1/patients/${TEST_PATIENT_ID}/appointments`, {
        timeout: 15000,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TEST_TOKEN}`
        }
      });
      
      console.log('✅ Patient appointments request successful!');
      console.log('Response status:', response.status);
      console.log('Response structure:', {
        hasSuccess: !!response.data.success,
        hasData: !!response.data.data,
        hasPatient: !!response.data.data?.patient,
        hasAppointments: !!response.data.data?.appointments,
        appointmentsDataLength: response.data.data?.appointments?.data?.length || 0,
        appointmentsStructure: {
          hasData: !!response.data.data?.appointments?.data,
          hasPagination: !!response.data.data?.appointments?.pagination,
          paginationKeys: response.data.data?.appointments?.pagination ? Object.keys(response.data.data.appointments.pagination) : []
        }
      });
      
      // Validate response structure
      if (response.data.success && 
          response.data.data && 
          response.data.data.patient && 
          response.data.data.appointments) {
        console.log('✅ Response structure is correct');
        
        const patient = response.data.data.patient;
        const appointments = response.data.data.appointments;
        
        console.log('Patient details:', {
          id: patient._id,
          fullName: patient.fullName
        });
        
        if (appointments.data && Array.isArray(appointments.data)) {
          console.log(`✅ Found ${appointments.data.length} appointments`);
          
          if (appointments.data.length > 0) {
            console.log('Appointments:');
            appointments.data.forEach((apt, index) => {
              console.log(`  ${index + 1}. ${apt.serviceType} - ${apt.date} at ${apt.timeSlot} (${apt.status})`);
            });
          } else {
            console.log('📝 No appointments found for this patient');
          }
        } else {
          console.log('❌ Appointments data structure is invalid');
        }
        
        if (appointments.pagination) {
          console.log('Pagination details:', appointments.pagination);
        }
      } else {
        console.log('❌ Invalid response structure');
        console.log('Full response:', JSON.stringify(response.data, null, 2));
      }
      
    } catch (error) {
      console.log('❌ Patient appointments request failed:');
      
      if (error.response) {
        console.log('Status:', error.response.status);
        console.log('Status Text:', error.response.statusText);
        console.log('Data:', JSON.stringify(error.response.data, null, 2));
        
        if (error.response.status === 404) {
          console.log('💡 This suggests the patient was not found in the database');
        } else if (error.response.status === 401) {
          console.log('💡 Authentication failed - check your token');
        }
      } else if (error.request) {
        console.log('Network Error:', error.message);
        console.log('Error Code:', error.code);
      } else {
        console.log('Error:', error.message);
      }
    }

    // Test 3: Test with invalid patient ID
    console.log('\n3. Testing with invalid patient ID...');
    try {
      const response = await axios.get(`${API_BASE_URL}/api/v1/patients/invalid-id/appointments`, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TEST_TOKEN}`
        }
      });
      console.log('❌ Unexpected success with invalid patient ID');
    } catch (error) {
      if (error.response?.status === 404 || error.response?.status === 400) {
        console.log('✅ Correctly rejected invalid patient ID');
        console.log('Error details:', error.response.data);
      } else {
        console.log('❌ Unexpected error with invalid patient ID:', error.message);
      }
    }

    // Test 4: Test without authentication
    console.log('\n4. Testing without authentication...');
    try {
      const response = await axios.get(`${API_BASE_URL}/api/v1/patients/${TEST_PATIENT_ID}/appointments`, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      console.log('❌ Unexpected success without authentication');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Correctly rejected without authentication');
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }

  } catch (error) {
    console.error('Test execution failed:', error);
  }
}

// Instructions for getting a token
console.log('📋 Instructions for getting a valid token:');
console.log('1. Start your backend server: npm run dev');
console.log('2. Login to your application to get a valid token');
console.log('3. Replace TEST_TOKEN in this script with your actual token');
console.log('4. Run this script: node test-atlas-api.js');
console.log('');

// Run the test
testAtlasAPI().catch(console.error);
