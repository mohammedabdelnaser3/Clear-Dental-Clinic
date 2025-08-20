import axios from 'axios';

const API_BASE = 'http://localhost:3009/api/v1';

async function debugSlotConflicts() {
  try {
    console.log('🔍 Debugging Time Slot Conflicts...\n');

    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@dentalclinic.com',
      password: 'Admin123!'
    });
    
    const token = loginResponse.data.data.token;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const testDate = tomorrow.toISOString().split('T')[0];

    // Get available slots
    console.log('1. Checking Available Time Slots:');
    const timeSlotsResponse = await axios.get(`${API_BASE}/appointments/available-slots`, {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        dentistId: 'default-dentist-id',
        date: testDate,
        duration: 30
      }
    });
    
    const availableSlots = timeSlotsResponse.data.data?.availableSlots || [];
    console.log(`✅ Backend reports ${availableSlots.length} available slots`);
    console.log(`⏰ First few slots: ${availableSlots.slice(0, 5).map(slot => slot.time || slot).join(', ')}\n`);

    // Check existing appointments for that date
    console.log('2. Checking Existing Appointments:');
    const appointmentsResponse = await axios.get(`${API_BASE}/appointments`, {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        startDate: `${testDate}T00:00:00.000Z`,
        endDate: `${testDate}T23:59:59.999Z`
      }
    });

    const appointments = appointmentsResponse.data.data?.data || [];
    console.log(`📊 Existing appointments for ${testDate}: ${appointments.length}`);
    
    // Group appointments by time slot
    const appointmentsByTime = {};
    appointments.forEach(apt => {
      const timeSlot = apt.timeSlot;
      if (!appointmentsByTime[timeSlot]) {
        appointmentsByTime[timeSlot] = [];
      }
      appointmentsByTime[timeSlot].push({
        id: apt.id,
        patient: apt.patientId?.firstName || 'Unknown',
        service: apt.serviceType,
        duration: apt.duration,
        status: apt.status,
        dentist: apt.dentistId?._id || apt.dentistId
      });
    });

    console.log('\n📋 Appointments by time slot:');
    Object.keys(appointmentsByTime).sort().forEach(timeSlot => {
      const appts = appointmentsByTime[timeSlot];
      console.log(`⏰ ${timeSlot}:`);
      appts.forEach((apt, index) => {
        console.log(`  ${index + 1}. ${apt.patient} - ${apt.service} (${apt.duration}min) - ${apt.status} - Dentist: ${apt.dentist}`);
      });
    });

    // Check which dentist is being auto-assigned
    console.log('\n3. Checking Dentist Auto-Assignment:');
    const dentistsResponse = await axios.get(`${API_BASE}/users?role=dentist`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const dentists = dentistsResponse.data.data?.data || [];
    console.log(`👨‍⚕️ Available dentists: ${dentists.length}`);
    
    dentists.forEach((dentist, index) => {
      const dentistAppointments = appointments.filter(apt => 
        (apt.dentistId?._id || apt.dentistId) === dentist._id
      );
      console.log(`  ${index + 1}. ${dentist.firstName} ${dentist.lastName} (${dentist._id}) - ${dentistAppointments.length} appointments`);
    });

    // Try to create appointment with the first available slot
    if (availableSlots.length > 0) {
      console.log('\n4. Testing Appointment Creation with First Available Slot:');
      const firstSlot = availableSlots[0].time || availableSlots[0];
      console.log(`🎯 Trying to book ${firstSlot} slot...`);
      
      const patients = await axios.get(`${API_BASE}/patients`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const testPatient = patients.data.data?.data[0];
      
      const appointmentData = {
        patientId: testPatient._id || testPatient.id,
        dentistId: 'default-dentist-id',
        serviceType: 'consultation',
        date: testDate,
        timeSlot: firstSlot,
        duration: 30,
        notes: 'Conflict test appointment',
        status: 'scheduled'
      };

      try {
        const createResponse = await axios.post(`${API_BASE}/appointments`, appointmentData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('✅ Appointment created successfully!');
        console.log('📅 Created appointment ID:', createResponse.data.data?.appointment?.id);
        console.log('👨‍⚕️ Assigned dentist:', createResponse.data.data?.appointment?.dentistId?.firstName);
      } catch (error) {
        console.log('❌ Appointment creation failed:', error.response?.data?.message || error.message);
        console.log('📝 Error details:', error.response?.data?.errors || 'No additional details');
        
        // The conflict might be because the same dentist is being assigned
        // Let's try with a specific different dentist
        if (dentists.length > 1) {
          console.log('\n🔄 Trying with specific dentist...');
          const alternateDentist = dentists.find(d => {
            const dentistAppointments = appointments.filter(apt => 
              (apt.dentistId?._id || apt.dentistId) === d._id
            );
            return dentistAppointments.length === 0; // Find dentist with no appointments
          });
          
          if (alternateDentist) {
            console.log(`👨‍⚕️ Using dentist: ${alternateDentist.firstName} ${alternateDentist.lastName}`);
            
            const altAppointmentData = {
              ...appointmentData,
              dentistId: alternateDentist._id
            };
            
            try {
              const altCreateResponse = await axios.post(`${API_BASE}/appointments`, altAppointmentData, {
                headers: { Authorization: `Bearer ${token}` }
              });
              
              console.log('✅ Appointment created with specific dentist!');
              console.log('📅 Created appointment ID:', altCreateResponse.data.data?.appointment?.id);
            } catch (altError) {
              console.log('❌ Still failed with specific dentist:', altError.response?.data?.message || altError.message);
            }
          }
        }
      }
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.response?.data?.message || error.message);
  }
}

debugSlotConflicts();
