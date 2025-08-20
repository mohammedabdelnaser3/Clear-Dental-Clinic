import axios from 'axios';

const API_BASE = 'http://localhost:3009/api/v1';

async function debugFrontendIssues() {
  try {
    console.log('🔍 Debugging Frontend Appointment Issues...\n');

    // Login as admin (staff/admin role)
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@dentalclinic.com',
      password: 'Admin123!'
    });
    
    const token = loginResponse.data.data.token;
    const user = loginResponse.data.data.user;
    console.log('✅ Login successful');
    console.log(`👤 User role: ${user.role}`);
    console.log(`📧 User email: ${user.email}\n`);

    // Test 1: Check if patients can be loaded (for admin/staff)
    console.log('1. Testing Patient Loading (Admin/Staff view):');
    try {
      const patientsResponse = await axios.get(`${API_BASE}/patients`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 100 }
      });
      
      const patients = patientsResponse.data.data?.data || [];
      console.log(`✅ Patients loaded: ${patients.length} found`);
      
      if (patients.length > 0) {
        console.log(`📋 First patient: ${patients[0].firstName} ${patients[0].lastName} (ID: ${patients[0]._id || patients[0].id})`);
      } else {
        console.log('❌ No patients found - this will cause "Please select a patient" error');
      }
    } catch (error) {
      console.log('❌ Failed to load patients:', error.response?.data?.message || error.message);
    }
    console.log('');

    // Test 2: Check time slots availability
    console.log('2. Testing Time Slots Availability:');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const testDate = tomorrow.toISOString().split('T')[0];
    
    try {
      const timeSlotsResponse = await axios.get(`${API_BASE}/appointments/available-slots`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          dentistId: 'default-dentist-id',
          date: testDate,
          duration: 30 // consultation duration
        }
      });
      
      const slots = timeSlotsResponse.data.data?.availableSlots || [];
      console.log(`✅ Time slots loaded: ${slots.length} available`);
      
      if (slots.length > 0) {
        console.log(`⏰ Sample slots: ${slots.slice(0, 5).map(slot => slot.time || slot).join(', ')}`);
      } else {
        console.log('❌ No time slots available - this will cause "No available time slots" error');
      }
    } catch (error) {
      console.log('❌ Failed to load time slots:', error.response?.data?.message || error.message);
    }
    console.log('');

    // Test 3: Simulate patient user login
    console.log('3. Testing Patient User Experience:');
    
    // Check if there are any patient users
    try {
      const usersResponse = await axios.get(`${API_BASE}/users?role=patient`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const patientUsers = usersResponse.data.data?.data || [];
      console.log(`👥 Patient users found: ${patientUsers.length}`);
      
      if (patientUsers.length > 0) {
        const patientUser = patientUsers[0];
        console.log(`👤 Test patient user: ${patientUser.firstName} ${patientUser.lastName} (${patientUser.email})`);
        
        // Check if this user has a linked patient record
        try {
          const linkedPatientsResponse = await axios.get(`${API_BASE}/patients/user/${patientUser._id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          const linkedPatients = linkedPatientsResponse.data.data?.data || [];
          console.log(`🔗 Linked patient records: ${linkedPatients.length}`);
          
          if (linkedPatients.length === 0) {
            console.log('❌ Patient user has no linked patient record - this will cause "Please select a patient" error');
          }
        } catch (error) {
          console.log('❌ Failed to check linked patients:', error.response?.data?.message || error.message);
        }
      } else {
        console.log('ℹ️ No patient users found - all users are staff/admin');
      }
    } catch (error) {
      console.log('❌ Failed to check patient users:', error.response?.data?.message || error.message);
    }
    console.log('');

    // Test 4: Check if current date is affecting slot availability
    console.log('4. Testing Date Selection:');
    const today = new Date().toISOString().split('T')[0];
    console.log(`📅 Today: ${today}`);
    console.log(`📅 Tomorrow: ${testDate}`);
    
    // Check if there are any appointments already booked for tomorrow
    try {
      const existingAppointments = await axios.get(`${API_BASE}/appointments`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          startDate: `${testDate}T00:00:00.000Z`,
          endDate: `${testDate}T23:59:59.999Z`
        }
      });
      
      const appointments = existingAppointments.data.data?.data || [];
      console.log(`📊 Existing appointments for ${testDate}: ${appointments.length}`);
      
      if (appointments.length > 0) {
        console.log('⚠️ Many existing appointments may be reducing available slots');
        appointments.slice(0, 3).forEach((apt, index) => {
          console.log(`  ${index + 1}. ${apt.timeSlot} - ${apt.serviceType} (${apt.duration}min)`);
        });
      }
    } catch (error) {
      console.log('❌ Failed to check existing appointments:', error.response?.data?.message || error.message);
    }

    console.log('\n🎯 Summary of Potential Issues:');
    console.log('1. Patient loading: Check if patients array is populated correctly');
    console.log('2. Time slot loading: Verify backend is returning slots for selected date/service');
    console.log('3. Patient user linking: Ensure patient users have linked patient records');
    console.log('4. Form validation: Check timing of validation vs data loading');

  } catch (error) {
    console.error('❌ Debug failed:', error.response?.data?.message || error.message);
  }
}

debugFrontendIssues();
