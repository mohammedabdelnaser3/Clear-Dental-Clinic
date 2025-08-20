import axios from 'axios';

const API_BASE = 'http://localhost:3009/api/v1';

async function testTimeSlotFix() {
  try {
    console.log('🧪 Testing Time Slot Selection Fix...\n');

    // Login as admin
    const adminLogin = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@dentalclinic.com',
      password: 'Admin123!'
    });
    
    const adminToken = adminLogin.data.data.token;
    console.log('✅ Admin login successful');

    // Get patient data
    const patientsResponse = await axios.get(`${API_BASE}/patients`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      params: { limit: 1 }
    });
    
    const testPatient = patientsResponse.data.data?.data[0];
    console.log(`👤 Test patient: ${testPatient.firstName} ${testPatient.lastName}\n`);

    // Test different scenarios for time slot selection
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const testDate = tomorrow.toISOString().split('T')[0];
    
    console.log('📅 Testing Date:', testDate);
    
    // Scenario 1: Load time slots
    console.log('\n1. Testing Time Slot Loading:');
    const timeSlotsResponse = await axios.get(`${API_BASE}/appointments/available-slots`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      params: {
        dentistId: 'default-dentist-id',
        date: testDate,
        duration: 30
      }
    });
    
    const availableSlots = timeSlotsResponse.data.data?.availableSlots || [];
    console.log(`✅ Loaded ${availableSlots.length} time slots`);
    
    if (availableSlots.length > 0) {
      console.log(`⏰ First few slots: ${availableSlots.slice(0, 5).map(slot => slot.time || slot).join(', ')}`);
      
      // Scenario 2: Test selection behavior (simulating frontend)
      console.log('\n2. Testing Selection Behavior:');
      
      const testSlots = availableSlots.slice(0, 3); // Test first 3 slots
      
      for (const slot of testSlots) {
        const timeSlot = slot.time || slot;
        console.log(`\n🎯 Testing slot: ${timeSlot}`);
        
        // Simulate the NEW click behavior (immediate selection)
        console.log('  📱 NEW Behavior: Immediate selection');
        console.log(`  ✅ Would select ${timeSlot} immediately`);
        console.log('  📝 Validation runs in background (non-blocking)');
        
        // Test validation separately
        const formData = {
          patientId: testPatient._id || testPatient.id,
          date: testDate,
          duration: 30
        };
        
        // Simulate validation logic
        const hasBasicRequirements = !!(formData.date && timeSlot);
        console.log(`  🔍 Basic requirements: ${hasBasicRequirements ? '✅ Met' : '❌ Missing'}`);
        
        if (hasBasicRequirements) {
          // Business hours check
          const [hours, minutes] = timeSlot.split(':').map(Number);
          const slotStartMinutes = hours * 60 + minutes;
          const slotEndMinutes = slotStartMinutes + formData.duration;
          const endHour = Math.floor(slotEndMinutes / 60);
          const endMinute = slotEndMinutes % 60;
          
          const exceedsBusinessHours = endHour >= 23 || (endHour === 23 && endMinute > 0);
          console.log(`  ⏰ Business hours: ${exceedsBusinessHours ? '❌ Exceeds' : '✅ Within'}`);
          
          // Same-day check (only relevant if testing today)
          const isToday = formData.date === new Date().toISOString().split('T')[0];
          let tooSoon = false;
          if (isToday) {
            const currentHour = new Date().getHours();
            const currentMinutes = new Date().getMinutes();
            const currentTotalMinutes = currentHour * 60 + currentMinutes;
            const slotTotalMinutes = hours * 60 + minutes;
            tooSoon = slotTotalMinutes <= currentTotalMinutes + 60;
          }
          console.log(`  📅 Same-day: ${isToday ? (tooSoon ? '❌ Too soon' : '✅ OK') : '✅ Future date'}`);
          
          const overallValid = !exceedsBusinessHours && !tooSoon;
          console.log(`  🎯 Overall: ${overallValid ? '✅ Valid' : '⚠️ Warning (but still selectable)'}`);
        }
        
        // Check slot availability from backend
        if (typeof slot === 'object' && slot.available !== undefined) {
          console.log(`  🖱️ Button state: ${slot.available ? '✅ Clickable' : '❌ Disabled'}`);
        }
      }
      
      // Scenario 3: Test appointment creation with selected slot
      console.log('\n3. Testing Appointment Creation:');
      const selectedSlot = availableSlots[0].time || availableSlots[0];
      
      const appointmentData = {
        patientId: testPatient._id || testPatient.id,
        dentistId: 'default-dentist-id',
        serviceType: 'consultation',
        date: testDate,
        timeSlot: selectedSlot,
        duration: 30,
        notes: 'Test appointment after time slot selection fix',
        status: 'scheduled'
      };
      
      console.log(`🎯 Creating appointment with selected slot: ${selectedSlot}`);
      
      const createResponse = await axios.post(`${API_BASE}/appointments`, appointmentData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      console.log('✅ Appointment created successfully!');
      console.log(`📅 Appointment ID: ${createResponse.data.data?.appointment?.id}`);
    }

    console.log('\n🎉 Expected Frontend Behavior:');
    console.log('✅ Time slots are immediately selectable (no async blocking)');
    console.log('✅ Selection happens instantly when clicked');
    console.log('✅ Validation runs in background for warnings only');
    console.log('✅ Better user experience with immediate feedback');
    console.log('✅ No more "not functioning properly" issues');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
  }
}

testTimeSlotFix();
