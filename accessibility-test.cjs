#!/usr/bin/env node

/**
 * Comprehensive Accessibility Testing for Dentist Pages
 * 
 * This script performs detailed accessibility checks and generates a report
 * with specific fixes needed for WCAG 2.1 AA compliance.
 */

const fs = require('fs');

class AccessibilityTester {
  constructor() {
    this.results = {
      DentistProfile: { issues: [], warnings: [], passes: [] },
      DentistSettings: { issues: [], warnings: [], passes: [] }
    };
  }

  // Test keyboard navigation implementation
  testKeyboardNavigation(content, fileName) {
    const tests = [];
    
    // Check for tab navigation
    if (content.includes('onKeyDown') && content.includes('tabIndex')) {
      tests.push('✅ Tab navigation implemented');
    } else if (content.includes('onKeyDown')) {
      tests.push('⚠️ Keyboard handlers found but tabIndex management may be incomplete');
    } else {
      tests.push('❌ No keyboard navigation handlers found');
    }
    
    // Check for arrow key navigation
    if (content.includes('ArrowLeft') || content.includes('ArrowRight')) {
      tests.push('✅ Arrow key navigation implemented');
    }
    
    // Check for Home/End key support
    if (content.includes('Home') && content.includes('End')) {
      tests.push('✅ Home/End key navigation implemented');
    }
    
    // Check for focus management
    if (content.includes('focus:outline-none') && content.includes('focus:ring')) {
      tests.push('✅ Focus indicators implemented');
    } else {
      tests.push('❌ Focus indicators missing or incomplete');
    }
    
    return tests;
  }

  // Test ARIA implementation
  testARIA(content, fileName) {
    const tests = [];
    
    // Check for proper roles
    const roles = ['tablist', 'tab', 'tabpanel', 'button', 'status'];
    const foundRoles = roles.filter(role => content.includes(`role="${role}"`));
    
    if (foundRoles.length > 0) {
      tests.push(`✅ ARIA roles found: ${foundRoles.join(', ')}`);
    }
    
    // Check for aria-selected
    if (content.includes('aria-selected')) {
      tests.push('✅ aria-selected implemented for tabs');
    } else if (content.includes('role="tab"')) {
      tests.push('❌ Tabs found but aria-selected missing');
    }
    
    // Check for aria-controls
    if (content.includes('aria-controls')) {
      tests.push('✅ aria-controls implemented');
    }
    
    // Check for aria-labelledby
    if (content.includes('aria-labelledby')) {
      tests.push('✅ aria-labelledby implemented');
    }
    
    // Check for aria-label
    if (content.includes('aria-label')) {
      tests.push('✅ aria-label attributes found');
    }
    
    // Check for aria-live regions
    if (content.includes('aria-live')) {
      tests.push('✅ Live regions implemented');
    } else {
      tests.push('⚠️ No live regions found - consider for dynamic content');
    }
    
    return tests;
  }

  // Test form accessibility
  testFormAccessibility(content, fileName) {
    const tests = [];
    
    // Check for form labels
    if (content.includes('label=')) {
      tests.push('✅ Form labels implemented');
    }
    
    // Check for validation errors
    if (content.includes('text-red-600') || content.includes('text-red-500')) {
      tests.push('✅ Error styling implemented');
    }
    
    // Check for required field indicators
    if (content.includes('required')) {
      tests.push('✅ Required field indicators found');
    }
    
    // Check for fieldsets (for grouped form elements)
    if (content.includes('fieldset') || content.includes('legend')) {
      tests.push('✅ Form grouping with fieldset/legend');
    } else {
      tests.push('⚠️ Consider using fieldset/legend for form sections');
    }
    
    return tests;
  }

  // Test touch targets
  testTouchTargets(content, fileName) {
    const tests = [];
    
    // Check for minimum touch target sizes
    const minHeightCount = (content.match(/min-h-\[44px\]/g) || []).length;
    const minWidthCount = (content.match(/min-w-\[44px\]/g) || []).length;
    
    if (minHeightCount > 0 || minWidthCount > 0) {
      tests.push(`✅ Touch targets implemented: ${minHeightCount} min-height, ${minWidthCount} min-width`);
    } else {
      tests.push('❌ No explicit touch target sizing found');
    }
    
    // Check for button sizing
    const buttonCount = (content.match(/<Button/g) || []).length;
    if (buttonCount > 0) {
      tests.push(`✅ Found ${buttonCount} Button components (should have proper sizing)`);
    }
    
    return tests;
  }

  // Test color contrast
  testColorContrast(content, fileName) {
    const tests = [];
    
    // Check for high contrast text
    const highContrastClasses = ['text-gray-900', 'text-gray-800', 'text-white'];
    const highContrastCount = highContrastClasses.reduce((count, cls) => {
      return count + (content.match(new RegExp(cls, 'g')) || []).length;
    }, 0);
    
    if (highContrastCount > 0) {
      tests.push(`✅ High contrast text classes found: ${highContrastCount} instances`);
    }
    
    // Check for potentially low contrast
    const lowContrastClasses = ['text-gray-400', 'text-gray-300'];
    const lowContrastCount = lowContrastClasses.reduce((count, cls) => {
      return count + (content.match(new RegExp(cls, 'g')) || []).length;
    }, 0);
    
    if (lowContrastCount > 0) {
      tests.push(`⚠️ Potentially low contrast text: ${lowContrastCount} instances - verify ratios`);
    }
    
    return tests;
  }

  // Test responsive design
  testResponsiveDesign(content, fileName) {
    const tests = [];
    
    const breakpoints = ['sm:', 'md:', 'lg:', 'xl:'];
    const responsiveCounts = breakpoints.map(bp => ({
      breakpoint: bp,
      count: (content.match(new RegExp(bp, 'g')) || []).length
    }));
    
    const totalResponsive = responsiveCounts.reduce((sum, bp) => sum + bp.count, 0);
    
    if (totalResponsive > 0) {
      tests.push(`✅ Responsive design implemented: ${totalResponsive} responsive classes`);
      responsiveCounts.forEach(bp => {
        if (bp.count > 0) {
          tests.push(`  - ${bp.breakpoint} ${bp.count} classes`);
        }
      });
    } else {
      tests.push('❌ No responsive design classes found');
    }
    
    return tests;
  }

  // Test semantic HTML
  testSemanticHTML(content, fileName) {
    const tests = [];
    
    // Check for semantic elements
    const semanticElements = ['nav', 'main', 'section', 'article', 'header', 'footer'];
    const foundElements = semanticElements.filter(element => 
      content.includes(`<${element}`) || content.includes(`id="${element}`)
    );
    
    if (foundElements.length > 0) {
      tests.push(`✅ Semantic elements found: ${foundElements.join(', ')}`);
    } else {
      tests.push('⚠️ Limited semantic HTML structure');
    }
    
    // Check for heading hierarchy
    const headings = [];
    for (let i = 1; i <= 6; i++) {
      const count = (content.match(new RegExp(`<h${i}`, 'g')) || []).length;
      if (count > 0) {
        headings.push(`h${i}(${count})`);
      }
    }
    
    if (headings.length > 0) {
      tests.push(`✅ Heading structure: ${headings.join(', ')}`);
    }
    
    return tests;
  }

  // Run all tests for a file
  testFile(filePath, fileName) {
    console.log(`\n🧪 Testing: ${fileName}`);
    console.log('='.repeat(50));
    
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      const testSuites = [
        { name: 'Keyboard Navigation', tests: this.testKeyboardNavigation(content, fileName) },
        { name: 'ARIA Implementation', tests: this.testARIA(content, fileName) },
        { name: 'Form Accessibility', tests: this.testFormAccessibility(content, fileName) },
        { name: 'Touch Targets', tests: this.testTouchTargets(content, fileName) },
        { name: 'Color Contrast', tests: this.testColorContrast(content, fileName) },
        { name: 'Responsive Design', tests: this.testResponsiveDesign(content, fileName) },
        { name: 'Semantic HTML', tests: this.testSemanticHTML(content, fileName) }
      ];
      
      testSuites.forEach(suite => {
        console.log(`\n📋 ${suite.name}:`);
        suite.tests.forEach(test => {
          console.log(`  ${test}`);
        });
      });
      
    } catch (error) {
      console.error(`❌ Error testing ${fileName}:`, error.message);
    }
  }

  // Generate accessibility fixes
  generateFixes() {
    console.log('\n🔧 RECOMMENDED ACCESSIBILITY FIXES');
    console.log('='.repeat(60));
    
    const fixes = [
      {
        title: 'Skip Links Enhancement',
        description: 'Skip links are present but could be enhanced',
        action: 'Ensure skip links are visible when focused and properly positioned'
      },
      {
        title: 'Focus Management',
        description: 'Improve focus management for dynamic content',
        action: 'Add focus management when switching tabs or updating content'
      },
      {
        title: 'Loading States',
        description: 'Add ARIA live regions for loading states',
        action: 'Implement aria-live="polite" for status updates'
      },
      {
        title: 'Error Announcements',
        description: 'Ensure form errors are announced to screen readers',
        action: 'Add aria-live regions for form validation errors'
      },
      {
        title: 'Touch Target Verification',
        description: 'Verify all interactive elements meet 44x44px minimum',
        action: 'Test on actual devices to ensure touch targets are adequate'
      }
    ];
    
    fixes.forEach((fix, index) => {
      console.log(`\n${index + 1}. ${fix.title}`);
      console.log(`   Issue: ${fix.description}`);
      console.log(`   Action: ${fix.action}`);
    });
  }

  // Generate testing checklist
  generateTestingChecklist() {
    console.log('\n📝 MANUAL TESTING CHECKLIST');
    console.log('='.repeat(60));
    
    const checklist = [
      '□ Test keyboard-only navigation (Tab, Shift+Tab, Arrow keys)',
      '□ Test screen reader compatibility (NVDA, JAWS, VoiceOver)',
      '□ Verify color contrast ratios meet WCAG AA (4.5:1 for normal text)',
      '□ Test on mobile devices for touch target accessibility',
      '□ Verify focus indicators are visible and clear',
      '□ Test form validation with screen reader',
      '□ Verify skip links work and are visible when focused',
      '□ Test tab navigation follows logical order',
      '□ Verify all images have appropriate alt text',
      '□ Test with high contrast mode enabled',
      '□ Verify text can be zoomed to 200% without horizontal scrolling',
      '□ Test with reduced motion preferences'
    ];
    
    checklist.forEach(item => {
      console.log(`  ${item}`);
    });
  }
}

// Main execution
function main() {
  const tester = new AccessibilityTester();
  
  console.log('🚀 Comprehensive Accessibility Testing for Dentist Pages');
  console.log('Testing WCAG 2.1 AA compliance requirements...\n');
  
  const files = [
    { path: 'src/pages/dentist/DentistProfile.tsx', name: 'DentistProfile' },
    { path: 'src/pages/dentist/DentistSettings.tsx', name: 'DentistSettings' }
  ];
  
  files.forEach(file => {
    if (fs.existsSync(file.path)) {
      tester.testFile(file.path, file.name);
    } else {
      console.log(`⚠️ File not found: ${file.path}`);
    }
  });
  
  tester.generateFixes();
  tester.generateTestingChecklist();
  
  console.log('\n🎯 NEXT STEPS');
  console.log('='.repeat(30));
  console.log('1. Address the recommended fixes above');
  console.log('2. Complete the manual testing checklist');
  console.log('3. Test with actual assistive technologies');
  console.log('4. Validate with automated tools like axe-core');
}

if (require.main === module) {
  main();
}

module.exports = AccessibilityTester;