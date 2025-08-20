import axios from 'axios';

const API_BASE = 'http://localhost:3009/api/v1';

async function debugPatientIdExtraction() {
  try {
    console.log('🔍 Debugging Patient ID Extraction Issue...\n');

    // Login as admin to access the data
    const adminLogin = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@dentalclinic.com',
      password: 'Admin123!'
    });
    
    const adminToken = adminLogin.data.data.token;
    console.log('✅ Admin login successful');

    // Get patient user
    const usersResponse = await axios.get(`${API_BASE}/users?role=patient`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    const patientUser = usersResponse.data.data?.data[0];
    console.log(`👤 Testing with patient user: ${patientUser.firstName} ${patientUser.lastName}`);
    console.log(`🆔 User ID: ${patientUser._id}\n`);

    // Get the exact response that frontend receives
    console.log('📡 Getting exact frontend response...');
    const linkedResponse = await axios.get(`${API_BASE}/patients/user/${patientUser._id}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    console.log('📝 Raw response structure:');
    console.log('response.data:', Object.keys(linkedResponse.data));
    console.log('response.data.data:', Object.keys(linkedResponse.data.data || {}));
    console.log('response.data.data.data:', Array.isArray(linkedResponse.data.data?.data));
    
    // Simulate patientService.getPatientsByUserId() processing
    const responseData = linkedResponse.data;
    let patientsData = [];
    
    console.log('\n🔧 Simulating patientService processing...');
    if (responseData.data && Array.isArray(responseData.data)) {
      patientsData = responseData.data;
      console.log('✅ Used responseData.data (array)');
    } else if (Array.isArray(responseData)) {
      patientsData = responseData;
      console.log('✅ Used responseData (direct array)');
    } else if (responseData.data && responseData.data.data && Array.isArray(responseData.data.data)) {
      patientsData = responseData.data.data;
      console.log('✅ Used responseData.data.data (nested array)');
    } else {
      console.log('❌ No matching condition for response structure');
      console.log('responseData.data:', typeof responseData.data);
      console.log('Array.isArray(responseData.data):', Array.isArray(responseData.data));
      console.log('responseData.data.data:', typeof responseData.data?.data);
      console.log('Array.isArray(responseData.data.data):', Array.isArray(responseData.data?.data));
    }
    
    console.log(`📊 Extracted patients data: ${patientsData.length} records\n`);
    
    // Simulate the frontend AppointmentForm logic
    console.log('🎯 Simulating AppointmentForm logic...');
    if (patientsData && patientsData.length > 0) {
      const linkedPatient = patientsData[0];
      console.log('👤 First patient object keys:', Object.keys(linkedPatient));
      console.log('🔍 Checking ID fields:');
      console.log('  linkedPatient.id:', linkedPatient.id);
      console.log('  linkedPatient._id:', linkedPatient._id);
      console.log('  linkedPatient.patientId:', linkedPatient.patientId);
      
      const patientId = linkedPatient.id || linkedPatient._id;
      console.log('🎯 Final extracted patientId:', patientId);
      
      if (patientId) {
        console.log('✅ SUCCESS: Patient ID found');
      } else {
        console.log('❌ PROBLEM: Patient ID not found - this triggers the error message');
        console.log('📋 Full patient object:');
        console.log(JSON.stringify(linkedPatient, null, 2));
      }
    } else {
      console.log('❌ No patients data extracted');
    }

    // Check what the patientService actually returns
    console.log('\n🧪 Testing patientService return format...');
    const mockPaginatedResponse = {
      data: patientsData,
      total: patientsData.length,
      page: 1,
      limit: 10,
      totalPages: Math.ceil(patientsData.length / 10)
    };
    
    console.log('📦 Mock service response:');
    console.log('  .data:', Array.isArray(mockPaginatedResponse.data));
    console.log('  .data.length:', mockPaginatedResponse.data?.length);
    console.log('  .data[0]?.id:', mockPaginatedResponse.data?.[0]?.id);
    console.log('  .data[0]?._id:', mockPaginatedResponse.data?.[0]?._id);

  } catch (error) {
    console.error('❌ Debug failed:', error.response?.data?.message || error.message);
  }
}

debugPatientIdExtraction();
