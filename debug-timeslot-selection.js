import axios from 'axios';

const API_BASE = 'http://0.0.0.0:3009/api/v1';

// Helper function to add delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function debugTimeSlotSelection() {
  try {
    console.log('🔍 Debugging Time Slot Selection Issues...\n');

    // Add delay before login to avoid rate limiting
    console.log('Waiting 5 seconds before login attempt to avoid rate limiting...');
    await delay(5000);
    
    // Login as admin first
    const adminLogin = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@dentalclinic.com',
      password: 'Admin123!'
    });
    
    const adminToken = adminLogin.data.data.token;
    console.log('✅ Admin login successful');

    // Get a patient for testing
    const patientsResponse = await axios.get(`${API_BASE}/patients`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      params: { limit: 1 }
    });
    
    console.log('Patient response structure:', JSON.stringify(patientsResponse.data, null, 2));
    
    let testPatient = patientsResponse.data.data?.[0] || patientsResponse.data?.[0];
    if (!testPatient) {
      console.log('❌ No patients found. Creating a test patient...');
      // Create a test patient
      const newPatient = {
        firstName: 'Test',
        lastName: 'Patient',
        email: 'test.patient@example.com',
        phone: '1234567890',
        dateOfBirth: '1990-01-01',
        address: '123 Test St',
        city: 'Test City',
        state: 'TS',
        postalCode: '12345',
        insuranceProvider: 'Test Insurance',
        insuranceNumber: 'TEST123456',
        medicalHistory: 'None'
      };
      
      try {
        const createResponse = await axios.post(`${API_BASE}/patients`, newPatient, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        testPatient = createResponse.data.data;
        console.log(`✅ Created test patient: ${testPatient.firstName} ${testPatient.lastName}`);
        console.log(`🆔 Patient ID: ${testPatient._id || testPatient.id}\n`);
      } catch (createError) {
        console.error('❌ Failed to create test patient:', createError.response?.data?.message || createError.message);
        throw new Error('Cannot proceed without a patient');
      }
    } else {
      console.log(`👤 Test patient: ${testPatient.firstName} ${testPatient.lastName}`);
      console.log(`🆔 Patient ID: ${testPatient._id || testPatient.id}\n`);
    }

    // Test time slot loading
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const testDate = tomorrow.toISOString().split('T')[0];
    
    console.log('⏰ Testing time slot loading:');
    console.log(`📅 Date: ${testDate}`);
    
    let availableSlots = [];
    try {
      const timeSlotsResponse = await axios.get(`${API_BASE}/appointments/available-slots`, {
        headers: { Authorization: `Bearer ${adminToken}` },
        params: {
          dentistId: '6879369cf9594e20abb3d14e', // Using the userId from the patient data as dentistId
          clinicId: '6879369cf9594e20abb3d14d', // Default clinic ID
          date: testDate,
          duration: 30 // consultation duration
        }
      });
      
      console.log('Time slots response structure:', JSON.stringify(timeSlotsResponse.data, null, 2));
      
      availableSlots = timeSlotsResponse.data.data?.availableSlots || [];
      console.log(`✅ Time slots loaded: ${availableSlots.length} available`);
    } catch (error) {
      console.error('❌ Error fetching time slots:', error.response?.data || error.message);
      console.log('❌ No time slots available for testing');
      return; // Exit the function early
    }
    
    if (availableSlots.length > 0) {
      console.log(`⏰ Sample slots: ${availableSlots.slice(0, 5).map(slot => slot.time || slot).join(', ')}`);
      
      // Test the validation logic that the frontend uses
      const testSlot = availableSlots[0].time || availableSlots[0];
      console.log(`\n🧪 Testing slot selection validation for: ${testSlot}`);
      
      // Simulate the frontend validation logic
      const formData = {
        patientId: testPatient._id || testPatient.id,
        date: testDate,
        duration: 30,
        serviceType: 'consultation'
      };
      
      console.log('📋 Simulated form data:');
      console.log(`  patientId: ${formData.patientId}`);
      console.log(`  date: ${formData.date}`);
      console.log(`  duration: ${formData.duration}`);
      
      // Test validation conditions
      console.log('\n🔍 Validation checks:');
      
      // Check 1: Required fields
      const hasRequiredFields = !!(formData.patientId && formData.date && testSlot);
      console.log(`✅ Has required fields: ${hasRequiredFields}`);
      console.log(`  patientId: ${!!formData.patientId}`);
      console.log(`  date: ${!!formData.date}`);
      console.log(`  selectedTime: ${!!testSlot}`);
      
      // Check 2: Business hours validation
      const [hours, minutes] = testSlot.split(':').map(Number);
      const slotStartMinutes = hours * 60 + minutes;
      const slotEndMinutes = slotStartMinutes + formData.duration;
      const endHour = Math.floor(slotEndMinutes / 60);
      const endMinute = slotEndMinutes % 60;
      
      console.log(`⏰ Time calculations:`);
      console.log(`  Start: ${hours}:${minutes.toString().padStart(2, '0')}`);
      console.log(`  Duration: ${formData.duration} minutes`);
      console.log(`  End: ${endHour}:${endMinute.toString().padStart(2, '0')}`);
      
      const exceedsBusinessHours = endHour >= 23 || (endHour === 23 && endMinute > 0);
      console.log(`✅ Within business hours: ${!exceedsBusinessHours}`);
      
      // Check 3: Same-day appointment validation
      const isToday = formData.date === new Date().toISOString().split('T')[0];
      const currentHour = new Date().getHours();
      const tooSoon = isToday && hours <= currentHour + 1;
      
      console.log(`📅 Same-day validation:`);
      console.log(`  Is today: ${isToday}`);
      console.log(`  Current hour: ${currentHour}`);
      console.log(`  Slot hour: ${hours}`);
      console.log(`  Too soon: ${tooSoon}`);
      
      // Overall validation result
      const isValid = hasRequiredFields && !exceedsBusinessHours && !tooSoon;
      console.log(`\n🎯 Overall validation result: ${isValid ? '✅ VALID' : '❌ INVALID'}`);
      
      if (!isValid) {
        console.log('❌ Issues found:');
        if (!hasRequiredFields) console.log('  - Missing required fields');
        if (exceedsBusinessHours) console.log('  - Exceeds business hours');
        if (tooSoon) console.log('  - Too soon for same-day appointment');
      }
      
      // Test if the slot would be selectable
      console.log('\n🖱️ Click behavior simulation:');
      if (isValid) {
        console.log(`✅ Slot ${testSlot} would be selected successfully`);
      } else {
        console.log(`❌ Slot ${testSlot} selection would be blocked by validation`);
      }
      
      // Check available property from backend
      const slotObj = availableSlots.find(s => (s.time || s) === testSlot);
      if (slotObj && typeof slotObj === 'object') {
        console.log(`🔍 Backend slot data:`);
        console.log(`  available: ${slotObj.available}`);
        console.log(`  isPeakHour: ${slotObj.isPeakHour}`);
        console.log(`  Button should be: ${slotObj.available ? 'clickable' : 'disabled'}`);
      }
      
    } else {
      console.log('❌ No time slots available for testing');
    }

    console.log('\n🎯 Potential Issues to Check:');
    console.log('1. Validation function blocking valid selections');
    console.log('2. Patient ID not set when validation runs');
    console.log('3. Business hours validation too strict');
    console.log('4. Backend not returning correct available status');
    console.log('5. UI state not updating after click');

  } catch (error) {
    console.error('❌ Debug failed:', error.response?.data?.message || error.message);
  }
}

debugTimeSlotSelection();
