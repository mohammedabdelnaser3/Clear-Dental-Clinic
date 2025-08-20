import axios from 'axios';

const API_BASE = 'http://localhost:3009/api/v1';

async function debugPatientsAndUsers() {
  try {
    console.log('🔍 Debugging Patients and Users...\n');

    // Login as admin
    console.log('1. Admin Login:');
    const adminLogin = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@dentalclinic.com',
      password: 'Admin123!'
    });
    
    const adminToken = adminLogin.data.data.token;
    console.log('✅ Admin login successful');
    
    const headers = { Authorization: `Bearer ${adminToken}` };
    
    // Test 2: Get all patients
    console.log('\n2. Getting All Patients:');
    try {
      const patientsResponse = await axios.get(`${API_BASE}/patients`, { headers });
      const patients = patientsResponse.data.data.patients.data;
      
      console.log(`✅ Found ${patients.length} patients:`);
      patients.forEach((patient, index) => {
        console.log(`  ${index + 1}. ID: ${patient.id}, Name: ${patient.firstName} ${patient.lastName}, Email: ${patient.email}`);
      });
      
      if (patients.length > 0) {
        // Test appointment creation with first patient
        await testAppointmentWithPatient(adminToken, patients[0]);
      }
      
    } catch (error) {
      console.log('❌ Failed to get patients:', error.response?.data?.message);
    }
    
    // Test 3: Get all users
    console.log('\n3. Getting All Users:');
    try {
      const usersResponse = await axios.get(`${API_BASE}/users`, { headers });
      const users = usersResponse.data.data.users.data;
      
      console.log(`✅ Found ${users.length} users:`);
      users.forEach((user, index) => {
        console.log(`  ${index + 1}. ID: ${user.id}, Email: ${user.email}, Role: ${user.role}`);
      });
      
    } catch (error) {
      console.log('❌ Failed to get users:', error.response?.data?.message);
    }
    
    // Test 4: Try to create test users if they don't exist
    console.log('\n4. Creating Test Users if Needed:');
    const testUsers = [
      { email: 'staff@dentalclinic.com', password: 'Staff123!', role: 'staff', firstName: 'Staff', lastName: 'User' },
      { email: 'patient@dentalclinic.com', password: 'Patient123!', role: 'patient', firstName: 'Patient', lastName: 'User' }
    ];
    
    for (const user of testUsers) {
      try {
        console.log(`Creating ${user.role} user: ${user.email}`);
        const createResponse = await axios.post(`${API_BASE}/auth/register`, {
          email: user.email,
          password: user.password,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        }, { headers });
        
        console.log(`✅ ${user.role} user created successfully`);
        
      } catch (error) {
        if (error.response?.status === 409) {
          console.log(`ℹ️ ${user.role} user already exists`);
        } else {
          console.log(`❌ Failed to create ${user.role} user:`, error.response?.data?.message);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.response?.data?.message || error.message);
  }
}

async function testAppointmentWithPatient(adminToken, patient) {
  console.log(`\n--- Testing Appointment Creation with Patient: ${patient.firstName} ${patient.lastName} ---`);
  
  const headers = { Authorization: `Bearer ${adminToken}` };
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const testDate = tomorrow.toISOString().split('T')[0];
  
  try {
    const appointmentData = {
      patientId: patient.id,
      serviceType: 'consultation',
      date: testDate,
      timeSlot: '14:00',
      duration: 30,
      dentistId: 'default-dentist-id'
    };
    
    console.log('Appointment data:', appointmentData);
    
    const createResponse = await axios.post(`${API_BASE}/appointments`, appointmentData, {
      headers
    });
    
    console.log('✅ Appointment created successfully');
    console.log('Appointment ID:', createResponse.data.data.id);
    
  } catch (error) {
    console.log('❌ Appointment creation failed:', error.response?.data?.message);
    console.log('Status:', error.response?.status);
    console.log('Error details:', error.response?.data);
  }
}

debugPatientsAndUsers();
