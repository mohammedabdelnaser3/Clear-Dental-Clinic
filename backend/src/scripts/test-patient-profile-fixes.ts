/**
 * Manual Test Script for Patient Profile API Fixes
 * 
 * This script tests the three main fixes:
 * 1. Profile image upload endpoint alias
 * 2. Patient data fetching authorization
 * 3. Patient data updating authorization
 * 
 * Prerequisites:
 * - Backend server must be running
 * - Database must have test users and patients
 * 
 * Run with: ts-node src/scripts/test-patient-profile-fixes.ts
 */

import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

const API_BASE_URL = process.env.API_URL || 'http://localhost:3001/api/v1';

interface TestResult {
  test: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  message: string;
  details?: any;
}

const results: TestResult[] = [];

function logResult(result: TestResult) {
  results.push(result);
  const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⏭️';
  console.log(`${icon} ${result.test}: ${result.message}`);
  if (result.details) {
    console.log('   Details:', JSON.stringify(result.details, null, 2));
  }
}

async function loginUser(email: string, password: string): Promise<string | null> {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email,
      password
    });
    return response.data.token;
  } catch (error: any) {
    console.error(`Failed to login as ${email}:`, error.response?.data || error.message);
    return null;
  }
}

async function test1_ProfileImageUploadEndpoint(token: string) {
  console.log('\n📋 Test 3.1: Profile Image Upload Endpoint');
  
  // Test 1.1: POST to /users/profile-image (new alias)
  try {
    const formData = new FormData();
    // Create a small test image buffer
    const testImageBuffer = Buffer.from('R0lGODlhAQABAAAAACw=', 'base64');
    formData.append('profileImage', testImageBuffer, {
      filename: 'test-image.gif',
      contentType: 'image/gif'
    });

    const response = await axios.post(`${API_BASE_URL}/users/profile-image`, formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': `Bearer ${token}`
      },
      validateStatus: () => true // Don't throw on any status
    });

    if (response.status === 404) {
      logResult({
        test: '3.1.1 POST /users/profile-image',
        status: 'FAIL',
        message: 'Endpoint returns 404 - route alias not added',
        details: { status: response.status, data: response.data }
      });
    } else if (response.status === 200 || response.status === 201) {
      logResult({
        test: '3.1.1 POST /users/profile-image',
        status: 'PASS',
        message: 'Endpoint exists and accepts requests',
        details: { status: response.status }
      });
    } else {
      logResult({
        test: '3.1.1 POST /users/profile-image',
        status: 'PASS',
        message: `Endpoint exists (status: ${response.status})`,
        details: { status: response.status, message: response.data.message }
      });
    }
  } catch (error: any) {
    logResult({
      test: '3.1.1 POST /users/profile-image',
      status: 'FAIL',
      message: 'Request failed',
      details: error.message
    });
  }

  // Test 1.2: POST to /users/upload-image (original endpoint)
  try {
    const formData = new FormData();
    const testImageBuffer = Buffer.from('R0lGODlhAQABAAAAACw=', 'base64');
    formData.append('profileImage', testImageBuffer, {
      filename: 'test-image.gif',
      contentType: 'image/gif'
    });

    const response = await axios.post(`${API_BASE_URL}/users/upload-image`, formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': `Bearer ${token}`
      },
      validateStatus: () => true
    });

    if (response.status === 404) {
      logResult({
        test: '3.1.2 POST /users/upload-image',
        status: 'FAIL',
        message: 'Original endpoint missing',
        details: { status: response.status }
      });
    } else {
      logResult({
        test: '3.1.2 POST /users/upload-image',
        status: 'PASS',
        message: 'Original endpoint still works',
        details: { status: response.status }
      });
    }
  } catch (error: any) {
    logResult({
      test: '3.1.2 POST /users/upload-image',
      status: 'FAIL',
      message: 'Request failed',
      details: error.message
    });
  }
}

async function test2_PatientDataFetching(patientToken: string, patientUserId: string, otherUserId: string) {
  console.log('\n📋 Test 3.2: Patient Data Fetching');

  // Test 2.1: Patient fetches their own data
  try {
    const response = await axios.get(`${API_BASE_URL}/patients/user/${patientUserId}`, {
      headers: { 'Authorization': `Bearer ${patientToken}` },
      validateStatus: () => true
    });

    if (response.status === 403) {
      logResult({
        test: '3.2.1 Patient fetches own data',
        status: 'FAIL',
        message: 'Patient receives 403 when accessing own data',
        details: { status: response.status, message: response.data.message }
      });
    } else if (response.status === 200) {
      logResult({
        test: '3.2.1 Patient fetches own data',
        status: 'PASS',
        message: 'Patient can access own data',
        details: { status: response.status }
      });
    } else {
      logResult({
        test: '3.2.1 Patient fetches own data',
        status: 'FAIL',
        message: `Unexpected status: ${response.status}`,
        details: { status: response.status, message: response.data.message }
      });
    }
  } catch (error: any) {
    logResult({
      test: '3.2.1 Patient fetches own data',
      status: 'FAIL',
      message: 'Request failed',
      details: error.message
    });
  }

  // Test 2.2: Patient tries to fetch another patient's data
  if (otherUserId) {
    try {
      const response = await axios.get(`${API_BASE_URL}/patients/user/${otherUserId}`, {
        headers: { 'Authorization': `Bearer ${patientToken}` },
        validateStatus: () => true
      });

      if (response.status === 403) {
        logResult({
          test: '3.2.2 Patient blocked from other data',
          status: 'PASS',
          message: 'Patient correctly denied access to other patient data',
          details: { status: response.status }
        });
      } else if (response.status === 200) {
        logResult({
          test: '3.2.2 Patient blocked from other data',
          status: 'FAIL',
          message: 'Patient can access other patient data (security issue!)',
          details: { status: response.status }
        });
      } else {
        logResult({
          test: '3.2.2 Patient blocked from other data',
          status: 'SKIP',
          message: `Unexpected status: ${response.status}`,
          details: { status: response.status }
        });
      }
    } catch (error: any) {
      logResult({
        test: '3.2.2 Patient blocked from other data',
        status: 'FAIL',
        message: 'Request failed',
        details: error.message
      });
    }
  }
}

async function test3_PatientDataUpdating(patientToken: string, patientId: string, otherPatientId: string) {
  console.log('\n📋 Test 3.3: Patient Data Updating');

  // Test 3.1: Patient updates their own data
  try {
    const updateData = {
      phone: '+1234567890'
    };

    const response = await axios.put(`${API_BASE_URL}/patients/${patientId}`, updateData, {
      headers: { 'Authorization': `Bearer ${patientToken}` },
      validateStatus: () => true
    });

    if (response.status === 403) {
      logResult({
        test: '3.3.1 Patient updates own data',
        status: 'FAIL',
        message: 'Patient receives 403 when updating own data',
        details: { status: response.status, message: response.data.message }
      });
    } else if (response.status === 200) {
      logResult({
        test: '3.3.1 Patient updates own data',
        status: 'PASS',
        message: 'Patient can update own data',
        details: { status: response.status }
      });
    } else {
      logResult({
        test: '3.3.1 Patient updates own data',
        status: 'FAIL',
        message: `Unexpected status: ${response.status}`,
        details: { status: response.status, message: response.data.message }
      });
    }
  } catch (error: any) {
    logResult({
      test: '3.3.1 Patient updates own data',
      status: 'FAIL',
      message: 'Request failed',
      details: error.message
    });
  }

  // Test 3.2: Patient tries to update another patient's data
  if (otherPatientId) {
    try {
      const updateData = {
        phone: '+9999999999'
      };

      const response = await axios.put(`${API_BASE_URL}/patients/${otherPatientId}`, updateData, {
        headers: { 'Authorization': `Bearer ${patientToken}` },
        validateStatus: () => true
      });

      if (response.status === 403) {
        logResult({
          test: '3.3.2 Patient blocked from updating other data',
          status: 'PASS',
          message: 'Patient correctly denied update access to other patient data',
          details: { status: response.status }
        });
      } else if (response.status === 200) {
        logResult({
          test: '3.3.2 Patient blocked from updating other data',
          status: 'FAIL',
          message: 'Patient can update other patient data (security issue!)',
          details: { status: response.status }
        });
      } else {
        logResult({
          test: '3.3.2 Patient blocked from updating other data',
          status: 'SKIP',
          message: `Unexpected status: ${response.status}`,
          details: { status: response.status }
        });
      }
    } catch (error: any) {
      logResult({
        test: '3.3.2 Patient blocked from updating other data',
        status: 'FAIL',
        message: 'Request failed',
        details: error.message
      });
    }
  }
}

async function test4_StaffAccess(staffToken: string, patientUserId: string, patientId: string) {
  console.log('\n📋 Test 3.5: Staff and Admin Access');

  // Test 4.1: Staff fetches patient data
  try {
    const response = await axios.get(`${API_BASE_URL}/patients/user/${patientUserId}`, {
      headers: { 'Authorization': `Bearer ${staffToken}` },
      validateStatus: () => true
    });

    if (response.status === 200) {
      logResult({
        test: '3.5.1 Staff fetches patient data',
        status: 'PASS',
        message: 'Staff can access patient data',
        details: { status: response.status }
      });
    } else {
      logResult({
        test: '3.5.1 Staff fetches patient data',
        status: 'FAIL',
        message: `Staff denied access (status: ${response.status})`,
        details: { status: response.status, message: response.data.message }
      });
    }
  } catch (error: any) {
    logResult({
      test: '3.5.1 Staff fetches patient data',
      status: 'FAIL',
      message: 'Request failed',
      details: error.message
    });
  }

  // Test 4.2: Staff updates patient data
  try {
    const updateData = {
      phone: '+1111111111'
    };

    const response = await axios.put(`${API_BASE_URL}/patients/${patientId}`, updateData, {
      headers: { 'Authorization': `Bearer ${staffToken}` },
      validateStatus: () => true
    });

    if (response.status === 200) {
      logResult({
        test: '3.5.2 Staff updates patient data',
        status: 'PASS',
        message: 'Staff can update patient data',
        details: { status: response.status }
      });
    } else {
      logResult({
        test: '3.5.2 Staff updates patient data',
        status: 'FAIL',
        message: `Staff denied update access (status: ${response.status})`,
        details: { status: response.status, message: response.data.message }
      });
    }
  } catch (error: any) {
    logResult({
      test: '3.5.2 Staff updates patient data',
      status: 'FAIL',
      message: 'Request failed',
      details: error.message
    });
  }
}

async function main() {
  console.log('🧪 Patient Profile API Fixes - Manual Test Suite\n');
  console.log('================================================\n');

  // Get test credentials from environment or use defaults
  const PATIENT_EMAIL = process.env.TEST_PATIENT_EMAIL || 'patient@example.com';
  const PATIENT_PASSWORD = process.env.TEST_PATIENT_PASSWORD || 'password123';
  const STAFF_EMAIL = process.env.TEST_STAFF_EMAIL || 'staff@example.com';
  const STAFF_PASSWORD = process.env.TEST_STAFF_PASSWORD || 'password123';
  const OTHER_PATIENT_EMAIL = process.env.TEST_OTHER_PATIENT_EMAIL;
  const OTHER_PATIENT_PASSWORD = process.env.TEST_OTHER_PATIENT_PASSWORD;

  console.log('📝 Test Configuration:');
  console.log(`   API Base URL: ${API_BASE_URL}`);
  console.log(`   Patient Email: ${PATIENT_EMAIL}`);
  console.log(`   Staff Email: ${STAFF_EMAIL}`);
  console.log(`   Other Patient Email: ${OTHER_PATIENT_EMAIL || 'Not configured'}\n`);

  // Login as patient
  console.log('🔐 Logging in as patient...');
  const patientToken = await loginUser(PATIENT_EMAIL, PATIENT_PASSWORD);
  if (!patientToken) {
    console.error('❌ Failed to login as patient. Please check credentials and ensure backend is running.');
    console.error('   You can set credentials via environment variables:');
    console.error('   TEST_PATIENT_EMAIL, TEST_PATIENT_PASSWORD');
    process.exit(1);
  }

  // Get patient user ID from token
  const patientPayload = JSON.parse(Buffer.from(patientToken.split('.')[1], 'base64').toString());
  const patientUserId = patientPayload.id;
  console.log(`✅ Logged in as patient (User ID: ${patientUserId})\n`);

  // Get patient record ID
  let patientId: string | null = null;
  try {
    const response = await axios.get(`${API_BASE_URL}/patients/user/${patientUserId}`, {
      headers: { 'Authorization': `Bearer ${patientToken}` },
      validateStatus: () => true
    });
    if (response.status === 200 && response.data.data) {
      patientId = response.data.data._id;
      console.log(`✅ Found patient record (Patient ID: ${patientId})\n`);
    }
  } catch (error) {
    console.warn('⚠️  Could not fetch patient record ID\n');
  }

  // Login as staff
  console.log('🔐 Logging in as staff...');
  const staffToken = await loginUser(STAFF_EMAIL, STAFF_PASSWORD);
  if (!staffToken) {
    console.warn('⚠️  Failed to login as staff. Staff tests will be skipped.\n');
  } else {
    console.log('✅ Logged in as staff\n');
  }

  // Login as other patient (optional)
  let otherPatientToken: string | null = null;
  let otherPatientUserId: string | null = null;
  let otherPatientId: string | null = null;
  if (OTHER_PATIENT_EMAIL && OTHER_PATIENT_PASSWORD) {
    console.log('🔐 Logging in as other patient...');
    otherPatientToken = await loginUser(OTHER_PATIENT_EMAIL, OTHER_PATIENT_PASSWORD);
    if (otherPatientToken) {
      const otherPayload = JSON.parse(Buffer.from(otherPatientToken.split('.')[1], 'base64').toString());
      otherPatientUserId = otherPayload.id;
      
      // Get other patient record ID
      try {
        const response = await axios.get(`${API_BASE_URL}/patients/user/${otherPatientUserId}`, {
          headers: { 'Authorization': `Bearer ${otherPatientToken}` },
          validateStatus: () => true
        });
        if (response.status === 200 && response.data.data) {
          otherPatientId = response.data.data._id;
        }
      } catch (error) {
        // Ignore
      }
      
      console.log(`✅ Logged in as other patient (User ID: ${otherPatientUserId})\n`);
    }
  }

  // Run tests
  await test1_ProfileImageUploadEndpoint(patientToken);
  await test2_PatientDataFetching(patientToken, patientUserId, otherPatientUserId || '');
  
  if (patientId) {
    await test3_PatientDataUpdating(patientToken, patientId, otherPatientId || '');
  } else {
    console.log('\n⏭️  Skipping patient update tests (no patient record found)');
  }

  if (staffToken && patientId) {
    await test4_StaffAccess(staffToken, patientUserId, patientId);
  } else {
    console.log('\n⏭️  Skipping staff access tests (staff login failed or no patient record)');
  }

  // Summary
  console.log('\n================================================');
  console.log('📊 Test Summary\n');
  
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const skipped = results.filter(r => r.status === 'SKIP').length;
  
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⏭️  Skipped: ${skipped}`);
  console.log(`📝 Total: ${results.length}\n`);

  if (failed > 0) {
    console.log('❌ Some tests failed. Please review the results above.');
    process.exit(1);
  } else {
    console.log('✅ All tests passed!');
    process.exit(0);
  }
}

main().catch(error => {
  console.error('💥 Test suite crashed:', error);
  process.exit(1);
});
