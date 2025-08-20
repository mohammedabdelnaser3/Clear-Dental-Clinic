import axios from 'axios';

// Test configuration
const API_BASE_URL = 'http://localhost:3009';
const TEST_TOKEN = 'your-actual-token-here'; // Replace with actual token

// Test patient data
const testPatientData = {
  firstName: 'Mohamed',
  lastName: 'Abdelnasser Khattab',
  email: 'mohamedabdelnasser0123@gmail.com',
  phone: '+201013320786',
  dateOfBirth: '1990-01-15',
  gender: 'male',
  address: {
    street: '123 Main Street',
    city: 'Cairo',
    state: 'Cairo',
    zipCode: '12345',
    country: 'Egypt'
  },
  medicalHistory: {
    allergies: [],
    medications: [],
    conditions: [],
    notes: 'No significant medical history'
  },
  treatmentRecords: [],
  preferredClinicId: '',
  userId: '6879369cf9594e20abb3d14e',
  isActive: true,
  emergencyContact: {
    name: 'Emergency Contact',
    phone: '+201013320786',
    relationship: 'Self'
  }
};

async function testPatientAPI() {
  console.log('🧪 Testing Patient API Endpoints');
  console.log('=================================');
  
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

    // Test 2: Test patient creation without auth
    console.log('\n2. Testing patient creation without authentication...');
    try {
      const response = await axios.post(`${API_BASE_URL}/api/v1/patients`, testPatientData, {
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

    // Test 3: Test patient creation with auth
    console.log('\n3. Testing patient creation with authentication...');
    try {
      const response = await axios.post(`${API_BASE_URL}/api/v1/patients`, testPatientData, {
        timeout: 15000,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TEST_TOKEN}`
        }
      });
      
      console.log('✅ Patient created successfully!');
      console.log('Response status:', response.status);
      console.log('Response data:', JSON.stringify(response.data, null, 2));
      
    } catch (error) {
      console.log('❌ Patient creation failed:');
      
      if (error.response) {
        console.log('Status:', error.response.status);
        console.log('Status Text:', error.response.statusText);
        console.log('Data:', JSON.stringify(error.response.data, null, 2));
        
        if (error.response.status === 403) {
          console.log('💡 403 Forbidden - Permission denied');
          console.log('   This suggests the user doesn\'t have permission to create patients');
        } else if (error.response.status === 401) {
          console.log('💡 401 Unauthorized - Authentication failed');
          console.log('   Check if the token is valid and not expired');
        } else if (error.response.status === 422) {
          console.log('💡 422 Validation error');
          console.log('   Check the request data format');
        }
      } else if (error.request) {
        console.log('Network Error:', error.message);
        console.log('Error Code:', error.code);
      } else {
        console.log('Error:', error.message);
      }
    }

    // Test 4: Test getting patients by user ID
    console.log('\n4. Testing get patients by user ID...');
    try {
      const response = await axios.get(`${API_BASE_URL}/api/v1/patients/user/6879369cf9594e20abb3d14e`, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TEST_TOKEN}`
        }
      });
      
      console.log('✅ Patients by user ID retrieved successfully!');
      console.log('Response status:', response.status);
      console.log('Patients found:', response.data.data?.length || 0);
      
      if (response.data.data && response.data.data.length > 0) {
        console.log('Patient details:', {
          id: response.data.data[0].id,
          name: `${response.data.data[0].firstName} ${response.data.data[0].lastName}`,
          email: response.data.data[0].email,
          phone: response.data.data[0].phone
        });
      }
      
    } catch (error) {
      console.log('❌ Get patients by user ID failed:');
      
      if (error.response) {
        console.log('Status:', error.response.status);
        console.log('Data:', JSON.stringify(error.response.data, null, 2));
      } else {
        console.log('Error:', error.message);
      }
    }

    // Test 5: Test getting all patients (staff/admin only)
    console.log('\n5. Testing get all patients (staff/admin only)...');
    try {
      const response = await axios.get(`${API_BASE_URL}/api/v1/patients`, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TEST_TOKEN}`
        }
      });
      
      console.log('✅ All patients retrieved successfully!');
      console.log('Response status:', response.status);
      console.log('Total patients:', response.data.data?.length || 0);
      
    } catch (error) {
      if (error.response?.status === 403) {
        console.log('✅ Correctly rejected - staff/admin only endpoint');
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
console.log('4. Run this script: node test-patient-api.js');
console.log('');

// Run the test
testPatientAPI().catch(console.error);
