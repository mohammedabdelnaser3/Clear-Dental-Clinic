import axios from 'axios';

const API_BASE = 'http://localhost:3009/api/v1';

async function testPatientAccountFlow() {
  try {
    console.log('🧪 Testing Patient Account Appointment Flow...\n');

    // Test 1: Admin user flow (should still work with patient selection)
    console.log('1. Testing Admin User Flow:');
    const adminLogin = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@dentalclinic.com',
      password: 'Admin123!'
    });
    
    const adminToken = adminLogin.data.data.token;
    const adminUser = adminLogin.data.data.user;
    console.log(`✅ Admin login: ${adminUser.firstName} ${adminUser.lastName} (${adminUser.role})`);
    
    // Admin should see patient selection and auto-select first patient
    const patientsResponse = await axios.get(`${API_BASE}/patients`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      params: { limit: 100 }
    });
    
    const patients = patientsResponse.data.data?.data || [];
    console.log(`📋 Admin can see ${patients.length} patients for selection`);
    console.log(`👤 First patient: ${patients[0]?.firstName} ${patients[0]?.lastName}`);
    
    // Test 2: Patient user flow (should use own account automatically)
    console.log('\n2. Testing Patient User Flow:');
    
    // Get patient user details
    const usersResponse = await axios.get(`${API_BASE}/users?role=patient`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    const patientUser = usersResponse.data.data?.data[0];
    console.log(`👤 Patient user: ${patientUser.firstName} ${patientUser.lastName}`);
    console.log(`📧 Email: ${patientUser.email}`);
    
    // Check patient's linked records (what appointment form will see)
    const linkedResponse = await axios.get(`${API_BASE}/patients/user/${patientUser._id}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    const linkedPatients = linkedResponse.data.data?.data || [];
    console.log(`🔗 Patient has ${linkedPatients.length} linked patient records`);
    
    if (linkedPatients.length > 0) {
      const patientRecord = linkedPatients[0];
      console.log(`✅ Patient record: ${patientRecord.firstName} ${patientRecord.lastName}`);
      console.log(`📧 Record email: ${patientRecord.email}`);
      console.log(`📱 Record phone: ${patientRecord.phone}`);
      console.log(`🆔 Record ID: ${patientRecord.id}`);
      
      // Test appointment creation using patient's own account
      console.log('\n3. Testing Appointment Creation with Patient Account:');
      
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const testDate = tomorrow.toISOString().split('T')[0];
      
      // Get available time slots
      const timeSlotsResponse = await axios.get(`${API_BASE}/appointments/available-slots`, {
        headers: { Authorization: `Bearer ${adminToken}` },
        params: {
          dentistId: 'default-dentist-id',
          date: testDate,
          duration: 30
        }
      });
      
      const availableSlots = timeSlotsResponse.data.data?.availableSlots || [];
      console.log(`⏰ Available time slots: ${availableSlots.length}`);
      
      if (availableSlots.length > 0) {
        const selectedSlot = availableSlots[0].time || availableSlots[0];
        
        // Create appointment using patient's account information
        const appointmentData = {
          patientId: patientRecord.id, // Use patient's own record ID
          dentistId: 'default-dentist-id',
          serviceType: 'consultation',
          date: testDate,
          timeSlot: selectedSlot,
          duration: 30,
          notes: 'Appointment created using patient account information',
          status: 'scheduled'
        };
        
        console.log(`🎯 Creating appointment for patient ID: ${appointmentData.patientId}`);
        
        const createResponse = await axios.post(`${API_BASE}/appointments`, appointmentData, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        
        console.log('✅ Appointment created successfully!');
        console.log(`📅 Appointment ID: ${createResponse.data.data?.appointment?.id}`);
        console.log(`👤 Patient: ${createResponse.data.data?.appointment?.patientId?.firstName || 'Auto-assigned'}`);
        console.log(`⏰ Time: ${createResponse.data.data?.appointment?.timeSlot}`);
      }
    } else {
      console.log('❌ Patient user has no linked patient records');
    }

    console.log('\n🎯 Expected Frontend Behavior:');
    console.log('✅ Patient users see their own account information automatically');
    console.log('✅ No patient selection dropdown for patient users');
    console.log('✅ Patient information populated from their linked patient record');
    console.log('✅ Appointments created using patient\'s own account');
    console.log('✅ Admin/staff users still see patient selection as before');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
  }
}

testPatientAccountFlow();
