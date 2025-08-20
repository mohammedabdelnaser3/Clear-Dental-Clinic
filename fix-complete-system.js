import axios from 'axios';

const API_BASE = 'http://localhost:3009/api/v1';

async function fixCompleteSystem() {
  try {
    console.log('🔧 Fixing Complete System Issues...\n');

    // Step 1: Admin login
    console.log('1. Admin Login:');
    const adminLogin = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@dentalclinic.com',
      password: 'Admin123!'
    });
    
    const adminToken = adminLogin.data.data.token;
    console.log('✅ Admin login successful');
    
    const headers = { Authorization: `Bearer ${adminToken}` };
    
    // Step 2: Create test patient user
    console.log('\n2. Creating Test Patient User:');
    let patientUser = null;
    
    try {
      const createUserResponse = await axios.post(`${API_BASE}/auth/register`, {
        email: 'testpatient@example.com',
        password: 'TestPatient123!',
        firstName: 'Test',
        lastName: 'Patient',
        role: 'patient'
      }, { headers });
      
      patientUser = createUserResponse.data.data.user;
      console.log('✅ Patient user created successfully');
      console.log('Patient User ID:', patientUser.id);
      
    } catch (error) {
      if (error.response?.status === 409) {
        console.log('ℹ️ Patient user already exists, trying to login...');
        try {
          const patientLogin = await axios.post(`${API_BASE}/auth/login`, {
            email: 'testpatient@example.com',
            password: 'TestPatient123!'
          });
          patientUser = patientLogin.data.data.user;
          console.log('✅ Patient user login successful');
        } catch (loginError) {
          console.log('❌ Patient user login failed:', loginError.response?.data?.message);
          return;
        }
      } else {
        console.log('❌ Failed to create patient user:', error.response?.data?.message);
        return;
      }
    }
    
    // Step 3: Create a patient record
    console.log('\n3. Creating Patient Record:');
    try {
      const patientData = {
        firstName: 'Test',
        lastName: 'Patient',
        email: 'testpatient@example.com',
        phone: '1234567890',
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
          phone: '1234567891',
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
      console.log('Patient Record ID:', patientRecord.id);
      
      // Step 4: Test appointment creation
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
      
      // Step 5: Test patient login and permissions
      console.log('\n5. Testing Patient Login and Permissions:');
      const patientLoginResponse = await axios.post(`${API_BASE}/auth/login`, {
        email: 'testpatient@example.com',
        password: 'TestPatient123!'
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
      
      // Step 6: Test time slots with patient
      console.log('\n6. Testing Time Slots with Patient:');
      const slotsResponse = await axios.get(`${API_BASE}/appointments/available-slots`, {
        headers: patientHeaders,
        params: {
          dentistId: 'default-dentist-id',
          date: testDate,
          duration: 30
        }
      });
      
      console.log('✅ Patient can access time slots');
      console.log('Available slots:', slotsResponse.data.data.availableSlots.length);
      
      console.log('\n🎉 All system issues fixed successfully!');
      console.log('\n📋 Summary:');
      console.log('- Admin can access all features');
      console.log('- Patient user created and linked');
      console.log('- Patient record created');
      console.log('- Appointments can be created by both admin and patient');
      console.log('- Time slots are accessible');
      console.log('- Patient can access their own appointments');
      
      console.log('\n🔑 Test Credentials:');
      console.log('Patient Email: testpatient@example.com');
      console.log('Patient Password: TestPatient123!');
      
    } catch (error) {
      console.log('❌ Error in patient/appointment creation:', error.response?.data?.message);
      console.log('Status:', error.response?.status);
      console.log('Error details:', error.response?.data);
    }
    
  } catch (error) {
    console.error('❌ Fix failed:', error.response?.data?.message || error.message);
  }
}

fixCompleteSystem();
