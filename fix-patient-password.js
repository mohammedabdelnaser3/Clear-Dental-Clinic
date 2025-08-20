import axios from 'axios';

const API_BASE = 'http://localhost:3009/api/v1';

async function fixPatientPassword() {
  try {
    console.log('🔧 Fixing Patient User Password...\n');

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
    
    const patientUsers = usersResponse.data.data?.data || [];
    if (patientUsers.length === 0) {
      console.log('❌ No patient users found');
      return;
    }
    
    const patientUser = patientUsers[0];
    console.log(`👤 Patient user: ${patientUser.firstName} ${patientUser.lastName}`);
    console.log(`📧 Email: ${patientUser.email}`);
    console.log(`🆔 User ID: ${patientUser._id}\n`);

    // Update password to Patient123!
    console.log('🔐 Updating patient password...');
    try {
      await axios.put(`${API_BASE}/users/${patientUser._id}`, {
        password: 'Patient123!'
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.log('✅ Password updated successfully');
    } catch (error) {
      console.log('❌ Failed to update password:', error.response?.data?.message || error.message);
    }

    // Test login with new password
    console.log('\n🧪 Testing patient login with new password...');
    try {
      const patientLogin = await axios.post(`${API_BASE}/auth/login`, {
        email: patientUser.email,
        password: 'Patient123!'
      });
      
      const patientToken = patientLogin.data.data.token;
      const loggedInUser = patientLogin.data.data.user;
      console.log('✅ Patient login successful!');
      console.log(`👤 Logged in as: ${loggedInUser.firstName} ${loggedInUser.lastName}`);
      
      // Test the fixed linked patients call
      console.log('\n🔗 Testing linked patients call...');
      const linkedResponse = await axios.get(`${API_BASE}/patients/user/${loggedInUser.id}`, {
        headers: { Authorization: `Bearer ${patientToken}` }
      });
      
      console.log('✅ Linked patients call successful');
      const linkedPatients = linkedResponse.data.data?.data || [];
      console.log(`🔗 Found ${linkedPatients.length} linked patient records`);
      
      if (linkedPatients.length > 0) {
        const linkedPatient = linkedPatients[0];
        const patientId = linkedPatient.id || linkedPatient._id;
        console.log(`👤 Linked to: ${linkedPatient.firstName} ${linkedPatient.lastName}`);
        console.log(`🆔 Patient ID: ${patientId}`);
        
        // This should now work without the undefined error
        console.log('✅ Patient data access should now work correctly in frontend');
      }
      
    } catch (loginError) {
      console.log('❌ Patient login failed:', loginError.response?.data?.message || loginError.message);
    }

  } catch (error) {
    console.error('❌ Fix failed:', error.response?.data?.message || error.message);
  }
}

fixPatientPassword();
