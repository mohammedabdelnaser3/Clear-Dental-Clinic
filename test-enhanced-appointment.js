import axios from 'axios';

const API_BASE = 'http://localhost:3009/api/v1';

async function testEnhancedAppointmentCreation() {
  try {
    console.log('🚀 Testing Enhanced Appointment Creation...\n');

    // Login
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@dentalclinic.com',
      password: 'Admin123!'
    });
    
    const token = loginResponse.data.data.token;
    console.log('✅ Login successful\n');

    // Get patients
    const patientsResponse = await axios.get(`${API_BASE}/patients`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const patients = patientsResponse.data.data?.data || [];
    const testPatient = patients[0];
    console.log(`📋 Using patient: ${testPatient.firstName} ${testPatient.lastName}\n`);

    // Test different service types with their durations
    const testServices = [
      { type: 'consultation', duration: 30 },
      { type: 'cleaning', duration: 60 },
      { type: 'filling', duration: 90 },
      { type: 'rootCanal', duration: 120 }
    ];

    for (const service of testServices) {
      console.log(`🦷 Testing ${service.type} (${service.duration} min)...`);
      
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const testDate = tomorrow.toISOString().split('T')[0];

      // Get available time slots for this service
      const timeSlotsResponse = await axios.get(`${API_BASE}/appointments/available-slots`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          dentistId: 'default-dentist-id',
          date: testDate,
          duration: service.duration
        }
      });

      const availableSlots = timeSlotsResponse.data.data?.availableSlots || [];
      console.log(`  ⏰ Available slots: ${availableSlots.length}`);

      if (availableSlots.length > 0) {
        // Create appointment with the first available slot
        const appointmentData = {
          patientId: testPatient._id || testPatient.id,
          dentistId: 'default-dentist-id',
          serviceType: service.type,
          date: testDate,
          timeSlot: availableSlots[0].time || availableSlots[0],
          duration: service.duration,
          notes: `Enhanced test - ${service.type} appointment`,
          status: 'scheduled'
        };

        const createResponse = await axios.post(`${API_BASE}/appointments`, appointmentData, {
          headers: { Authorization: `Bearer ${token}` }
        });

        console.log(`  ✅ ${service.type} appointment created successfully!`);
        console.log(`  📅 ID: ${createResponse.data.data?.appointment?.id}`);
        console.log(`  ⏰ Slot: ${appointmentData.timeSlot}`);
      } else {
        console.log(`  ❌ No available slots for ${service.type}`);
      }
      
      console.log('');
    }

    // Verify all appointments were created
    const allAppointmentsResponse = await axios.get(`${API_BASE}/appointments`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const enhancedTestAppointments = allAppointmentsResponse.data.data?.data?.filter(apt => 
      apt.notes?.includes('Enhanced test')
    ) || [];

    console.log('📊 Summary:');
    console.log(`  • Total enhanced test appointments: ${enhancedTestAppointments.length}`);
    enhancedTestAppointments.forEach((apt, index) => {
      console.log(`  ${index + 1}. ${apt.serviceType} - ${apt.date} at ${apt.timeSlot} (${apt.duration}min)`);
    });

    console.log('\n🎉 Enhanced appointment creation test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
  }
}

testEnhancedAppointmentCreation();
