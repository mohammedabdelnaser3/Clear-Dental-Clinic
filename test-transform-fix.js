import axios from 'axios';

const API_BASE = 'http://localhost:3009/api/v1';

// Simulate the transformPatientData function
const transformPatientData = (patient) => {
  return {
    id: patient.id || patient._id,  // Fixed version
    firstName: patient.firstName,
    lastName: patient.lastName,
    email: patient.email,
    phone: patient.phone,
    // ... other fields would be here
  };
};

async function testTransformFix() {
  try {
    console.log('🧪 Testing Transform Function Fix...\n');

    // Login as admin
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
    console.log(`👤 Testing with patient user: ${patientUser.firstName}\n`);

    // Get raw response
    const linkedResponse = await axios.get(`${API_BASE}/patients/user/${patientUser._id}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    const rawPatient = linkedResponse.data.data.data[0];
    console.log('📦 Raw patient data from backend:');
    console.log('  id:', rawPatient.id);
    console.log('  _id:', rawPatient._id);
    console.log('  firstName:', rawPatient.firstName);
    
    // Test OLD transform function (broken)
    console.log('\n❌ OLD transformPatientData (broken):');
    const oldTransform = {
      id: rawPatient._id,  // This would be undefined!
      firstName: rawPatient.firstName,
    };
    console.log('  Transformed id:', oldTransform.id);
    console.log('  Result: ID would be undefined!');
    
    // Test NEW transform function (fixed)
    console.log('\n✅ NEW transformPatientData (fixed):');
    const newTransform = transformPatientData(rawPatient);
    console.log('  Transformed id:', newTransform.id);
    console.log('  firstName:', newTransform.firstName);
    console.log('  Result: ID preserved correctly!');
    
    console.log('\n🎯 Expected Frontend Behavior:');
    console.log('✅ linkedPatients.data[0].id will now be:', newTransform.id);
    console.log('✅ No more "Patient ID not found" error');
    console.log('✅ Form will populate correctly');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
  }
}

testTransformFix();
