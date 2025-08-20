import axios from 'axios';

const API_BASE = 'http://localhost:3009/api/v1';

async function testNewBusinessHours() {
  try {
    console.log('🕐 Testing New Business Hours (11 AM - 11 PM)...\n');

    // Login
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@dentalclinic.com',
      password: 'Admin123!'
    });
    
    const token = loginResponse.data.data.token;
    console.log('✅ Login successful\n');

    // Test time slots for tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const testDate = tomorrow.toISOString().split('T')[0];

    console.log(`📅 Testing slots for: ${testDate}\n`);

    // Test different service durations
    const testCases = [
      { duration: 30, service: 'consultation' },
      { duration: 60, service: 'cleaning' },
      { duration: 90, service: 'filling' },
      { duration: 120, service: 'root canal' }
    ];

    for (const testCase of testCases) {
      console.log(`🦷 Testing ${testCase.service} (${testCase.duration} min):`);
      
      const timeSlotsResponse = await axios.get(`${API_BASE}/appointments/available-slots`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          dentistId: 'default-dentist-id',
          date: testDate,
          duration: testCase.duration
        }
      });

      const availableSlots = timeSlotsResponse.data.data?.availableSlots || [];
      console.log(`  📊 Total slots: ${availableSlots.length}`);
      
      if (availableSlots.length > 0) {
        // Show first few and last few slots to verify range
        const firstSlots = availableSlots.slice(0, 3).map(slot => slot.time || slot);
        const lastSlots = availableSlots.slice(-3).map(slot => slot.time || slot);
        
        console.log(`  🌅 First slots: ${firstSlots.join(', ')}`);
        console.log(`  🌙 Last slots: ${lastSlots.join(', ')}`);
        
        // Verify hours are in correct range (11 AM - 11 PM)
        const allHours = availableSlots.map(slot => {
          const timeString = slot.time || slot;
          return parseInt(timeString.split(':')[0]);
        });
        
        const minHour = Math.min(...allHours);
        const maxHour = Math.max(...allHours);
        
        console.log(`  ⏰ Hour range: ${minHour}:00 - ${maxHour}:30`);
        
        if (minHour >= 11 && maxHour <= 22) {
          console.log('  ✅ Hours are within business range (11 AM - 11 PM)');
        } else {
          console.log('  ❌ Hours are outside expected range');
        }
      } else {
        console.log('  ❌ No slots returned - this is the issue we need to fix');
      }
      
      console.log('');
    }

    console.log('🎯 Business Hours Test Summary:');
    console.log('• Expected: 11:00 AM to 11:00 PM (11:00 - 23:00)');
    console.log('• Slot interval: 30 minutes');
    console.log('• Expected total slots per day: 24 slots (12 hours × 2 slots/hour)');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
    if (error.response?.data) {
      console.error('Error details:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testNewBusinessHours();
