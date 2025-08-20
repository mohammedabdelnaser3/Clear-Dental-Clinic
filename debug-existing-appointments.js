import axios from 'axios';

const API_BASE = 'http://localhost:3009/api/v1';

async function debugExistingAppointments() {
  try {
    console.log('🔍 Debugging Existing Appointments...\n');

    // Login
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@dentalclinic.com',
      password: 'Admin123!'
    });
    
    const token = loginResponse.data.data.token;
    console.log('✅ Login successful\n');

    // Get tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const testDate = tomorrow.toISOString().split('T')[0];
    
    console.log(`📅 Checking appointments for: ${testDate}\n`);

    // Get all appointments for tomorrow
    const appointmentsResponse = await axios.get(`${API_BASE}/appointments`, {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        startDate: `${testDate}T00:00:00.000Z`,
        endDate: `${testDate}T23:59:59.999Z`
      }
    });

    const appointments = appointmentsResponse.data.data?.data || [];
    console.log(`📊 Total appointments for ${testDate}: ${appointments.length}\n`);

    if (appointments.length > 0) {
      console.log('📋 Existing appointments:');
      appointments.forEach((apt, index) => {
        const patientName = apt.patientId?.firstName ? 
          `${apt.patientId.firstName} ${apt.patientId.lastName}` : 
          apt.patientName || 'Unknown Patient';
        
        console.log(`  ${index + 1}. ${patientName}`);
        console.log(`     Service: ${apt.serviceType}`);
        console.log(`     Time: ${apt.timeSlot} (${apt.duration} min)`);
        console.log(`     Status: ${apt.status}`);
        console.log(`     End time: ${calculateEndTime(apt.timeSlot, apt.duration)}`);
        console.log('');
      });
    } else {
      console.log('📝 No existing appointments found for tomorrow');
    }

    // Now check what the backend algorithm sees
    console.log('🔧 Backend slot generation analysis:');
    console.log('Expected logic:');
    console.log('• Start: 11:00 (11 AM)');
    console.log('• End: 23:00 (11 PM)');
    console.log('• Interval: 30 minutes');
    console.log('• Should generate slots: 11:00, 11:30, 12:00, ..., 22:30');
    console.log('');

    // Get dentists
    const dentistsResponse = await axios.get(`${API_BASE}/users?role=dentist`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const dentists = dentistsResponse.data.data?.data || [];
    if (dentists.length > 0) {
      const dentist = dentists[0];
      console.log(`👨‍⚕️ Using dentist: ${dentist.firstName} ${dentist.lastName} (${dentist._id})`);
      
      // Test with specific dentist ID
      console.log('\n🧪 Testing with specific dentist ID:');
      const specificSlotsResponse = await axios.get(`${API_BASE}/appointments/available-slots`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          dentistId: dentist._id,
          date: testDate,
          duration: 30
        }
      });

      const specificSlots = specificSlotsResponse.data.data?.availableSlots || [];
      console.log(`📊 Slots with specific dentist: ${specificSlots.length}`);
      
      if (specificSlots.length > 0) {
        const firstSlots = specificSlots.slice(0, 5).map(slot => slot.time || slot);
        console.log(`🌅 First 5 slots: ${firstSlots.join(', ')}`);
      }
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.response?.data?.message || error.message);
  }
}

function calculateEndTime(startTime, duration) {
  const [hours, minutes] = startTime.split(':').map(Number);
  const startMinutes = hours * 60 + minutes;
  const endMinutes = startMinutes + duration;
  const endHours = Math.floor(endMinutes / 60);
  const endMins = endMinutes % 60;
  return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
}

debugExistingAppointments();
