import axios from 'axios';

const API_BASE = 'http://localhost:3009/api/v1';

async function fixPatientLinking() {
  try {
    console.log('🔧 Fixing Patient User Linking...\n');

    // Login as admin
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@dentalclinic.com',
      password: 'Admin123!'
    });
    
    const token = loginResponse.data.data.token;
    console.log('✅ Admin login successful\n');

    // Get the patient user
    const usersResponse = await axios.get(`${API_BASE}/users?role=patient`, {
      headers: { Authorization: `Bearer ${token}` }
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

    // Get available patient records
    const patientsResponse = await axios.get(`${API_BASE}/patients`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const patients = patientsResponse.data.data?.data || [];
    console.log(`📋 Available patient records: ${patients.length}\n`);

    if (patients.length === 0) {
      console.log('❌ No patient records found');
      return;
    }

    // Find a patient record that matches or create a link
    let targetPatient = patients.find(p => 
      p.firstName.toLowerCase() === patientUser.firstName.toLowerCase() &&
      p.lastName.toLowerCase() === patientUser.lastName.toLowerCase()
    );

    if (!targetPatient) {
      // If no exact match, use the first available patient record
      targetPatient = patients[0];
      console.log(`⚠️ No exact name match found, using: ${targetPatient.firstName} ${targetPatient.lastName}`);
    } else {
      console.log(`✅ Found matching patient record: ${targetPatient.firstName} ${targetPatient.lastName}`);
    }

    console.log(`🔗 Linking user ${patientUser._id} to patient ${targetPatient._id || targetPatient.id}\n`);

    // Link the patient user to the patient record
    try {
      const linkResponse = await axios.post(`${API_BASE}/patients/link-to-user`, {
        patientId: targetPatient._id || targetPatient.id,
        userId: patientUser._id
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('✅ Successfully linked patient user to patient record!');
      console.log('Response:', linkResponse.data.message);
    } catch (error) {
      console.log('❌ Failed to link patient:', error.response?.data?.message || error.message);
    }

    console.log('\n🧪 Testing the fix...');
    
    // Test if the linking worked
    try {
      const linkedPatientsResponse = await axios.get(`${API_BASE}/patients/user/${patientUser._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const linkedPatients = linkedPatientsResponse.data.data?.data || [];
      console.log(`🔗 Linked patient records after fix: ${linkedPatients.length}`);
      
      if (linkedPatients.length > 0) {
        const linkedPatient = linkedPatients[0];
        console.log(`✅ Successfully linked to: ${linkedPatient.firstName} ${linkedPatient.lastName}`);
        console.log(`📧 Patient email: ${linkedPatient.email}`);
        console.log(`📱 Patient phone: ${linkedPatient.phone}`);
      }
    } catch (error) {
      console.log('❌ Failed to verify linking:', error.response?.data?.message || error.message);
    }

  } catch (error) {
    console.error('❌ Fix failed:', error.response?.data?.message || error.message);
  }
}

fixPatientLinking();
