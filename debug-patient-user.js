import axios from 'axios';

const API_BASE = 'http://localhost:3009/api/v1';

async function debugPatientUser() {
  try {
    console.log('🔍 Debugging Patient User and Response Structure...\n');

    // Login as admin
    const adminLogin = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@dentalclinic.com',
      password: 'Admin123!'
    });
    
    const adminToken = adminLogin.data.data.token;
    console.log('✅ Admin login successful\n');

    // Check the patient user details
    console.log('👤 Checking patient user details:');
    const usersResponse = await axios.get(`${API_BASE}/users?role=patient`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    const patientUsers = usersResponse.data.data?.data || [];
    if (patientUsers.length === 0) {
      console.log('❌ No patient users found');
      return;
    }
    
    const patientUser = patientUsers[0];
    console.log(`📧 Patient email: ${patientUser.email}`);
    console.log(`👤 Patient name: ${patientUser.firstName} ${patientUser.lastName}`);
    console.log(`🆔 Patient user ID: ${patientUser._id}`);

    // Check what patient records are linked to this user
    console.log('\n🔗 Checking linked patient records (as admin):');
    try {
      const linkedResponse = await axios.get(`${API_BASE}/patients/user/${patientUser._id}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      console.log('📝 Full linked response structure:');
      console.log(JSON.stringify(linkedResponse.data, null, 2));
      
      const linkedPatients = linkedResponse.data.data?.data || [];
      console.log(`\n🔗 Linked patients count: ${linkedPatients.length}`);
      
      if (linkedPatients.length > 0) {
        const firstLinkedPatient = linkedPatients[0];
        console.log('\n👤 First linked patient object:');
        console.log(JSON.stringify(firstLinkedPatient, null, 2));
        
        console.log('\n🔍 Available ID fields:');
        console.log('id:', firstLinkedPatient.id);
        console.log('_id:', firstLinkedPatient._id);
        
        // Test accessing this patient record directly
        const testId = firstLinkedPatient._id || firstLinkedPatient.id;
        if (testId) {
          console.log(`\n🧪 Testing direct patient access with ID: ${testId}`);
          const directPatientResponse = await axios.get(`${API_BASE}/patients/${testId}`, {
            headers: { Authorization: `Bearer ${adminToken}` }
          });
          console.log('✅ Direct patient access successful');
          console.log('Patient details:', {
            firstName: directPatientResponse.data.data?.firstName,
            lastName: directPatientResponse.data.data?.lastName,
            email: directPatientResponse.data.data?.email,
            id: directPatientResponse.data.data?._id || directPatientResponse.data.data?.id
          });
        }
      }
    } catch (error) {
      console.log('❌ Failed to get linked patients:', error.response?.data?.message || error.message);
    }

    // Try to simulate the frontend code issue
    console.log('\n🔧 Simulating frontend issue...');
    console.log('Frontend code tries: linkedPatients.data[0].id');
    
    if (linkedPatients && linkedPatients.length > 0) {
      const frontendPatientId = linkedPatients[0].id;
      console.log('Frontend gets patientId:', frontendPatientId);
      
      if (frontendPatientId === undefined) {
        console.log('❌ This is the problem! .id is undefined');
        console.log('Correct field would be:', linkedPatients[0]._id || 'still undefined');
      }
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.response?.data?.message || error.message);
  }
}

debugPatientUser();
