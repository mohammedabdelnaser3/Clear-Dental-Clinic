import axios from 'axios';

const API_BASE = 'http://localhost:3009/api/v1';

async function debugTimeSlotAPI() {
  try {
    console.log('🔍 Debugging Time Slot API Issues...\n');

    // Login as admin
    const adminLogin = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@dentalclinic.com',
      password: 'Admin123!'
    });
    
    const adminToken = adminLogin.data.data.token;
    console.log('✅ Admin login successful\n');

    // Test different parameter combinations that frontend might be sending
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const testDate = tomorrow.toISOString().split('T')[0];
    
    console.log('📅 Test date:', testDate);
    
    // Test 1: Basic parameters (what should work)
    console.log('\n1. Testing Basic Parameters:');
    const basicParams = {
      dentistId: 'default-dentist-id',
      date: testDate,
      duration: 30
    };
    
    console.log('Request params:', JSON.stringify(basicParams, null, 2));
    
    try {
      const basicResponse = await axios.get(`${API_BASE}/appointments/available-slots`, {
        headers: { Authorization: `Bearer ${adminToken}` },
        params: basicParams
      });
      
      console.log('✅ Basic request successful');
      console.log('Response status:', basicResponse.status);
      console.log('Response data:', JSON.stringify(basicResponse.data, null, 2));
      
      const slots = basicResponse.data.data?.availableSlots || [];
      console.log(`📊 Available slots: ${slots.length}`);
      
      if (slots.length > 0) {
        console.log('Sample slots:', slots.slice(0, 3));
      }
      
    } catch (error) {
      console.log('❌ Basic request failed:', error.response?.data?.message || error.message);
      console.log('Response status:', error.response?.status);
      console.log('Response data:', error.response?.data);
    }

    // Test 2: Check if there are validation errors
    console.log('\n2. Testing Parameter Validation:');
    
    const testCases = [
      {
        name: 'Missing dentistId',
        params: { date: testDate, duration: 30 }
      },
      {
        name: 'Invalid date format',
        params: { dentistId: 'default-dentist-id', date: 'invalid-date', duration: 30 }
      },
      {
        name: 'Missing duration',
        params: { dentistId: 'default-dentist-id', date: testDate }
      },
      {
        name: 'Invalid duration',
        params: { dentistId: 'default-dentist-id', date: testDate, duration: 'invalid' }
      }
    ];
    
    for (const testCase of testCases) {
      console.log(`\n  Testing: ${testCase.name}`);
      console.log('  Params:', JSON.stringify(testCase.params));
      
      try {
        const response = await axios.get(`${API_BASE}/appointments/available-slots`, {
          headers: { Authorization: `Bearer ${adminToken}` },
          params: testCase.params
        });
        
        console.log('  ✅ Request succeeded (unexpected for some cases)');
        console.log('  Slots:', response.data.data?.availableSlots?.length || 0);
        
      } catch (error) {
        console.log('  ❌ Request failed:', error.response?.data?.message || error.message);
        console.log('  Status:', error.response?.status);
      }
    }

    // Test 3: Check if there are existing appointments blocking slots
    console.log('\n3. Checking Existing Appointments:');
    try {
      const appointmentsResponse = await axios.get(`${API_BASE}/appointments`, {
        headers: { Authorization: `Bearer ${adminToken}` },
        params: {
          startDate: `${testDate}T00:00:00.000Z`,
          endDate: `${testDate}T23:59:59.999Z`
        }
      });
      
      const appointments = appointmentsResponse.data.data?.data || [];
      console.log(`📊 Existing appointments for ${testDate}: ${appointments.length}`);
      
      if (appointments.length > 0) {
        console.log('Time slots already booked:');
        appointments.forEach((apt, index) => {
          console.log(`  ${index + 1}. ${apt.timeSlot} - ${apt.serviceType} (${apt.duration}min) - ${apt.status}`);
        });
        
        // Check if all slots are booked
        const bookedSlots = appointments.map(apt => apt.timeSlot);
        console.log('Booked slots:', bookedSlots);
      }
      
    } catch (error) {
      console.log('❌ Failed to check existing appointments:', error.response?.data?.message || error.message);
    }

    // Test 4: Check dentist availability
    console.log('\n4. Checking Dentist Availability:');
    try {
      const dentistsResponse = await axios.get(`${API_BASE}/users?role=dentist`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      const dentists = dentistsResponse.data.data?.data || [];
      console.log(`👨‍⚕️ Available dentists: ${dentists.length}`);
      
      dentists.forEach((dentist, index) => {
        console.log(`  ${index + 1}. ${dentist.firstName} ${dentist.lastName} (${dentist._id})`);
      });
      
      if (dentists.length === 0) {
        console.log('❌ No dentists found - this could cause 0 slots');
      }
      
    } catch (error) {
      console.log('❌ Failed to check dentists:', error.response?.data?.message || error.message);
    }

    // Test 5: Test with specific dentist ID
    if (dentists && dentists.length > 0) {
      console.log('\n5. Testing with Specific Dentist ID:');
      const specificDentist = dentists[0];
      
      const specificParams = {
        dentistId: specificDentist._id,
        date: testDate,
        duration: 30
      };
      
      console.log('Testing with dentist:', specificDentist.firstName, specificDentist.lastName);
      console.log('Params:', JSON.stringify(specificParams));
      
      try {
        const specificResponse = await axios.get(`${API_BASE}/appointments/available-slots`, {
          headers: { Authorization: `Bearer ${adminToken}` },
          params: specificParams
        });
        
        const specificSlots = specificResponse.data.data?.availableSlots || [];
        console.log(`📊 Slots with specific dentist: ${specificSlots.length}`);
        
        if (specificSlots.length > 0) {
          console.log('Sample slots:', specificSlots.slice(0, 3));
        }
        
      } catch (error) {
        console.log('❌ Specific dentist request failed:', error.response?.data?.message || error.message);
      }
    }

    console.log('\n🎯 Summary:');
    console.log('- Check if parameters are being sent correctly');
    console.log('- Verify dentist auto-assignment logic is working');
    console.log('- Ensure business hours are configured correctly (11 AM - 11 PM)');
    console.log('- Check if too many existing appointments are blocking slots');

  } catch (error) {
    console.error('❌ Debug failed:', error.response?.data?.message || error.message);
  }
}

debugTimeSlotAPI();
