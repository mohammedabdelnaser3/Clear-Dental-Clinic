/**
 * Responsive Testing Script
 * 
 * This script provides automated checks for responsive design implementation.
 * Run with: node test-responsive.cjs
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Test results
const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  tests: []
};

/**
 * Log test result
 */
function logTest(name, passed, message = '') {
  const status = passed ? `${colors.green}✓ PASS${colors.reset}` : `${colors.red}✗ FAIL${colors.reset}`;
  console.log(`  ${status} ${name}`);
  if (message) {
    console.log(`    ${colors.cyan}${message}${colors.reset}`);
  }
  
  results.tests.push({ name, passed, message });
  if (passed) {
    results.passed++;
  } else {
    results.failed++;
  }
}

/**
 * Log warning
 */
function logWarning(message) {
  console.log(`  ${colors.yellow}⚠ WARNING${colors.reset} ${message}`);
  results.warnings++;
}

/**
 * Check if file contains responsive classes
 */
function checkResponsiveClasses(filePath, componentName) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check for mobile-first responsive classes
    const hasResponsiveClasses = /\b(sm:|md:|lg:|xl:|2xl:)/.test(content);
    const hasGridResponsive = /grid-cols-1.*md:grid-cols-|grid-cols-1.*lg:grid-cols-/.test(content);
    const hasFlexResponsive = /flex-col.*md:flex-row|flex-col.*lg:flex-row/.test(content);
    const hasHiddenResponsive = /hidden.*md:block|hidden.*lg:block/.test(content);
    const hasPaddingResponsive = /p-\d+.*md:p-|p-\d+.*lg:p-/.test(content);
    
    if (hasResponsiveClasses) {
      logTest(`${componentName} has responsive classes`, true);
    } else {
      logTest(`${componentName} has responsive classes`, false, 'No responsive Tailwind classes found');
    }
    
    // Check for specific responsive patterns
    if (hasGridResponsive || hasFlexResponsive) {
      logTest(`${componentName} has responsive layout`, true);
    } else {
      logWarning(`${componentName} may need responsive layout classes (grid/flex)`);
    }
    
    return hasResponsiveClasses;
  } catch (error) {
    logTest(`${componentName} file exists`, false, error.message);
    return false;
  }
}

/**
 * Check for touch-friendly button sizes
 */
function checkTouchTargets(filePath, componentName) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check for minimum button sizes (44x44px equivalent)
    const hasMinHeight = /min-h-\[44px\]|h-11|h-12|h-14|py-3|py-4/.test(content);
    const hasMinWidth = /min-w-\[44px\]|px-4|px-5|px-6/.test(content);
    
    if (hasMinHeight && hasMinWidth) {
      logTest(`${componentName} has touch-friendly button sizes`, true);
    } else {
      logWarning(`${componentName} may need larger touch targets for mobile`);
    }
  } catch (error) {
    // File doesn't exist or can't be read
  }
}

/**
 * Check for responsive navigation
 */
function checkResponsiveNavigation(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check for mobile menu implementation
    const hasMobileMenu = /hamburger|menu.*toggle|isMenuOpen|showMenu/.test(content);
    const hasResponsiveNav = /md:flex|lg:flex|hidden.*md:block/.test(content);
    
    if (hasMobileMenu && hasResponsiveNav) {
      logTest('Header has responsive navigation', true);
    } else {
      logTest('Header has responsive navigation', false, 'Missing mobile menu or responsive classes');
    }
  } catch (error) {
    logTest('Header file exists', false, error.message);
  }
}

/**
 * Check for responsive forms
 */
function checkResponsiveForms(filePath, componentName) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check for responsive form layouts
    const hasResponsiveInputs = /w-full/.test(content);
    const hasResponsiveGrid = /grid-cols-1.*md:grid-cols-2|grid-cols-1.*lg:grid-cols-/.test(content);
    
    if (hasResponsiveInputs) {
      logTest(`${componentName} has responsive form inputs`, true);
    } else {
      logWarning(`${componentName} may need full-width inputs for mobile`);
    }
    
    if (hasResponsiveGrid) {
      logTest(`${componentName} has responsive form grid`, true);
    }
  } catch (error) {
    // File doesn't exist or can't be read
  }
}

/**
 * Check for responsive tables
 */
function checkResponsiveTables(dirPath) {
  try {
    const files = getAllFiles(dirPath);
    let hasResponsiveTables = false;
    
    files.forEach(file => {
      if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
        try {
          const content = fs.readFileSync(file, 'utf8');
          
          // Check for table responsive patterns
          if (/<table/.test(content)) {
            const hasOverflowScroll = /overflow-x-auto|overflow-scroll/.test(content);
            const hasCardTransform = /md:table|lg:table|hidden.*md:table-cell/.test(content);
            
            if (hasOverflowScroll || hasCardTransform) {
              hasResponsiveTables = true;
            }
          }
        } catch (err) {
          // Skip files that can't be read
        }
      }
    });
    
    if (hasResponsiveTables) {
      logTest('Tables have responsive behavior', true);
    } else {
      logWarning('Tables may need responsive handling (scroll or card transform)');
    }
  } catch (error) {
    // Directory doesn't exist
  }
}

/**
 * Get all files recursively
 */
function getAllFiles(dirPath, arrayOfFiles = []) {
  try {
    const files = fs.readdirSync(dirPath);
    
    files.forEach(file => {
      const filePath = path.join(dirPath, file);
      try {
        if (fs.statSync(filePath).isDirectory()) {
          arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
        } else {
          arrayOfFiles.push(filePath);
        }
      } catch (err) {
        // Skip files/dirs that can't be accessed
      }
    });
    
    return arrayOfFiles;
  } catch (error) {
    return arrayOfFiles;
  }
}

/**
 * Main test execution
 */
function runTests() {
  console.log(`\n${colors.blue}========================================${colors.reset}`);
  console.log(`${colors.blue}  Responsive Design Testing${colors.reset}`);
  console.log(`${colors.blue}========================================${colors.reset}\n`);
  
  // Test 1: Check dentist pages
  console.log(`${colors.cyan}Testing Dentist Pages...${colors.reset}`);
  checkResponsiveClasses('src/pages/dentist/DentistProfile.tsx', 'DentistProfile');
  checkTouchTargets('src/pages/dentist/DentistProfile.tsx', 'DentistProfile');
  checkResponsiveForms('src/pages/dentist/DentistProfile.tsx', 'DentistProfile');
  
  checkResponsiveClasses('src/pages/dentist/DentistSettings.tsx', 'DentistSettings');
  checkTouchTargets('src/pages/dentist/DentistSettings.tsx', 'DentistSettings');
  checkResponsiveForms('src/pages/dentist/DentistSettings.tsx', 'DentistSettings');
  console.log('');
  
  // Test 2: Check patient pages
  console.log(`${colors.cyan}Testing Patient Pages...${colors.reset}`);
  checkResponsiveClasses('src/pages/patient/PatientProfile.tsx', 'PatientProfile');
  checkTouchTargets('src/pages/patient/PatientProfile.tsx', 'PatientProfile');
  
  checkResponsiveClasses('src/pages/patient/PatientSettings.tsx', 'PatientSettings');
  checkTouchTargets('src/pages/patient/PatientSettings.tsx', 'PatientSettings');
  checkResponsiveForms('src/pages/patient/PatientSettings.tsx', 'PatientSettings');
  console.log('');
  
  // Test 3: Check dashboard
  console.log(`${colors.cyan}Testing Dashboard...${colors.reset}`);
  checkResponsiveClasses('src/pages/dashboard/PatientDashboard.tsx', 'PatientDashboard');
  // Dashboard.tsx is just a router component, skip it
  checkResponsiveClasses('src/pages/dashboard/ClinicDashboard.tsx', 'ClinicDashboard');
  checkResponsiveClasses('src/pages/dashboard/UnifiedAppointmentDashboard.tsx', 'UnifiedAppointmentDashboard');
  console.log('');
  
  // Test 4: Check header/navigation
  console.log(`${colors.cyan}Testing Navigation...${colors.reset}`);
  checkResponsiveNavigation('src/components/layout/Header.tsx');
  checkResponsiveClasses('src/components/layout/Header.tsx', 'Header');
  console.log('');
  
  // Test 5: Check appointment pages
  console.log(`${colors.cyan}Testing Appointment Pages...${colors.reset}`);
  checkResponsiveClasses('src/pages/appointment/Appointments.tsx', 'Appointments');
  checkResponsiveClasses('src/pages/appointment/AppointmentForm.tsx', 'AppointmentForm');
  checkResponsiveClasses('src/pages/appointment/AppointmentDetail.tsx', 'AppointmentDetail');
  console.log('');
  
  // Test 6: Check common components
  console.log(`${colors.cyan}Testing Common Components...${colors.reset}`);
  checkResponsiveClasses('src/components/ui/Card.tsx', 'Card');
  checkResponsiveClasses('src/components/ui/Button.tsx', 'Button');
  checkTouchTargets('src/components/ui/Button.tsx', 'Button');
  console.log('');
  
  // Test 7: Check for responsive tables
  console.log(`${colors.cyan}Testing Tables...${colors.reset}`);
  checkResponsiveTables('src/pages');
  checkResponsiveTables('src/components');
  console.log('');
  
  // Print summary
  console.log(`${colors.blue}========================================${colors.reset}`);
  console.log(`${colors.blue}  Test Summary${colors.reset}`);
  console.log(`${colors.blue}========================================${colors.reset}\n`);
  
  console.log(`  ${colors.green}Passed:${colors.reset}   ${results.passed}`);
  console.log(`  ${colors.red}Failed:${colors.reset}   ${results.failed}`);
  console.log(`  ${colors.yellow}Warnings:${colors.reset} ${results.warnings}`);
  console.log(`  Total:    ${results.passed + results.failed}\n`);
  
  if (results.failed === 0) {
    console.log(`${colors.green}✓ All responsive design tests passed!${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`${colors.red}✗ Some tests failed. Please review the output above.${colors.reset}\n`);
    process.exit(1);
  }
}

// Run tests
runTests();
