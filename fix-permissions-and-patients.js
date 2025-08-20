import axios from 'axios';

const API_BASE = 'http://localhost:3009/api/v1';

async function fixPermissionsAndPatients() {
  try {
    console.log('🔧 Fixing Permissions and Patient Issues...\n');

    // Step 1: Login as admin
    console.log('1. Admin Login:');
    const adminLogin = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@dentalclinic.com',
      password: 'Admin123!'
    });
    
    const adminToken = adminLogin.data.data.token;
    console.log('✅ Admin login successful');
    
    const headers = { Authorization: `Bearer ${adminToken}` };
    
    // Step 2: Create test patient user if it doesn't exist
    console.log('\n2. Creating Test Patient User:');
    let patientUser = null;
    
    try {
      const patientLogin = await axios.post(`${API_BASE}/auth/login`, {
        email: 'patient@dentalclinic.com',
        password: 'Patient123!'
      });
      patientUser = patientLogin.data.data.user;
      console.log('✅ Patient user already exists');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('Creating new patient user...');
        try {
          const createUserResponse = await axios.post(`${API_BASE}/auth/register`, {
            email: 'patient@dentalclinic.com',
            password: 'Patient123!',
            firstName: 'Test',
            lastName: 'Patient',
            role: 'patient'
          }, { headers });
          
          patientUser = createUserResponse.data.data.user;
          console.log('✅ Patient user created successfully');
        } catch (createError) {
          console.log('❌ Failed to create patient user:', createError.response?.data?.message);
          return;
        }
      }
    }
    
    // Step 3: Create a patient record linked to the patient user
    console.log('\n3. Creating Patient Record:');
    try {
      const patientData = {
        firstName: 'Test',
        lastName: 'Patient',
        email: 'patient@dentalclinic.com',
        phone: '+1234567890',
        dateOfBirth: '1990-01-01',
        gender: 'male',
        address: {
          street: '123 Test Street',
          city: 'Test City',
          state: 'Test State',
          country: 'Test Country',
          zipCode: '12345'
        },
        emergencyContact: {
          name: 'Emergency Contact',
          phone: '+1234567891',
          relationship: 'Spouse'
        },
        medicalHistory: {
          allergies: [],
          medications: [],
          conditions: []
        },
        userId: patientUser.id
      };
      
      const patientResponse = await axios.post(`${API_BASE}/patients`, patientData, { headers });
      const patientRecord = patientResponse.data.data.patient;
      console.log('✅ Patient record created successfully');
      console.log('Patient ID:', patientRecord.id);
      
      // Step 4: Test appointment creation with the new patient
      console.log('\n4. Testing Appointment Creation:');
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const testDate = tomorrow.toISOString().split('T')[0];
      
      const appointmentData = {
        patientId: patientRecord.id,
        serviceType: 'consultation',
        date: testDate,
        timeSlot: '14:00',
        duration: 30,
        dentistId: 'default-dentist-id'
      };
      
      const appointmentResponse = await axios.post(`${API_BASE}/appointments`, appointmentData, { headers });
      console.log('✅ Appointment created successfully');
      console.log('Appointment ID:', appointmentResponse.data.data.id);
      
      // Step 5: Test time slots access
      console.log('\n5. Testing Time Slots Access:');
      const slotsResponse = await axios.get(`${API_BASE}/appointments/available-slots`, {
        headers,
        params: {
          dentistId: 'default-dentist-id',
          date: testDate,
          duration: 30
        }
      });
      
      console.log('✅ Time slots access successful');
      console.log('Available slots:', slotsResponse.data.data.availableSlots.length);
      
      // Step 6: Test patient login and their permissions
      console.log('\n6. Testing Patient Login and Permissions:');
      const patientLoginResponse = await axios.post(`${API_BASE}/auth/login`, {
        email: 'patient@dentalclinic.com',
        password: 'Patient123!'
      });
      
      const patientToken = patientLoginResponse.data.data.token;
      const patientHeaders = { Authorization: `Bearer ${patientToken}` };
      
      // Test patient's own appointments
      const patientAppointmentsResponse = await axios.get(`${API_BASE}/patients/${patientRecord.id}/appointments`, {
        headers: patientHeaders
      });
      
      console.log('✅ Patient can access their appointments');
      console.log('Patient appointments:', patientAppointmentsResponse.data.data.appointments.data.length);
      
      // Test patient creating their own appointment
      const patientAppointmentData = {
        patientId: patientRecord.id,
        serviceType: 'cleaning',
        date: testDate,
        timeSlot: '15:00',
        duration: 60,
        dentistId: 'default-dentist-id'
      };
      
      const patientAppointmentResponse = await axios.post(`${API_BASE}/appointments`, patientAppointmentData, {
        headers: patientHeaders
      });
      
      console.log('✅ Patient can create their own appointments');
      console.log('Patient appointment ID:', patientAppointmentResponse.data.data.id);
      
      console.log('\n🎉 All permission and patient issues fixed successfully!');
      
    } catch (error) {
      console.log('❌ Error in patient/appointment creation:', error.response?.data?.message);
      console.log('Status:', error.response?.status);
      console.log('Error details:', error.response?.data);
    }
    
  } catch (error) {
    console.error('❌ Fix failed:', error.response?.data?.message || error.message);
  }
}

fixPermissionsAndPatients();
