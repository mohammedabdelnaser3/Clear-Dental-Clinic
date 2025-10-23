#!/usr/bin/env node

/**
 * Accessibility Audit Tool for Dentist Pages
 * 
 * This tool performs automated accessibility checks on the dentist profile and settings pages
 * following WCAG 2.1 AA guidelines.
 */

const fs = require('fs');
const path = require('path');

class AccessibilityAuditor {
  constructor() {
    this.issues = [];
    this.warnings = [];
    this.passes = [];
  }

  // Check for skip links
  checkSkipLinks(content) {
    const skipLinkPattern = /href="#[^"]*"[^>]*>Skip to/gi;
    const matches = content.match(skipLinkPattern);
    
    if (!matches || matches.length === 0) {
      this.issues.push({
        type: 'Skip Links',
        severity: 'error',
        message: 'No skip links found. Add skip links for keyboard navigation.',
        wcag: '2.4.1 Bypass Blocks'
      });
    } else {
      this.passes.push({
        type: 'Skip Links',
        message: `Found ${matches.length} skip link(s)`
      });
    }
  }

  // Check for proper heading hierarchy
  checkHeadingHierarchy(content) {
    const headingPattern = /<h([1-6])[^>]*>/gi;
    const headings = [];
    let match;
    
    while ((match = headingPattern.exec(content)) !== null) {
      headings.push(parseInt(match[1]));
    }
    
    if (headings.length === 0) {
      this.issues.push({
        type: 'Headings',
        severity: 'error',
        message: 'No headings found. Use proper heading hierarchy.',
        wcag: '1.3.1 Info and Relationships'
      });
      return;
    }
    
    // Check if starts with h1
    if (headings[0] !== 1) {
      this.issues.push({
        type: 'Headings',
        severity: 'error',
        message: 'Page should start with h1 heading.',
        wcag: '1.3.1 Info and Relationships'
      });
    }
    
    // Check for skipped levels
    for (let i = 1; i < headings.length; i++) {
      if (headings[i] > headings[i-1] + 1) {
        this.warnings.push({
          type: 'Headings',
          severity: 'warning',
          message: `Heading level skipped from h${headings[i-1]} to h${headings[i]}`,
          wcag: '1.3.1 Info and Relationships'
        });
      }
    }
    
    this.passes.push({
      type: 'Headings',
      message: `Found ${headings.length} headings with levels: ${headings.join(', ')}`
    });
  }

  // Check for ARIA labels and roles
  checkAriaLabels(content) {
    const ariaLabelPattern = /aria-label="[^"]+"/gi;
    const ariaLabelledByPattern = /aria-labelledby="[^"]+"/gi;
    const rolePattern = /role="[^"]+"/gi;
    
    const ariaLabels = content.match(ariaLabelPattern) || [];
    const ariaLabelledBy = content.match(ariaLabelledByPattern) || [];
    const roles = content.match(rolePattern) || [];
    
    this.passes.push({
      type: 'ARIA',
      message: `Found ${ariaLabels.length} aria-label attributes, ${ariaLabelledBy.length} aria-labelledby attributes, ${roles.length} role attributes`
    });
    
    // Check for buttons without accessible names
    const buttonPattern = /<button[^>]*>/gi;
    const buttons = content.match(buttonPattern) || [];
    
    buttons.forEach((button, index) => {
      if (!button.includes('aria-label') && !button.includes('aria-labelledby')) {
        // Check if button has text content (simplified check)
        if (!button.includes('>') || button.includes('/>')) {
          this.warnings.push({
            type: 'ARIA',
            severity: 'warning',
            message: `Button ${index + 1} may lack accessible name`,
            wcag: '4.1.2 Name, Role, Value'
          });
        }
      }
    });
  }

  // Check for keyboard navigation support
  checkKeyboardNavigation(content) {
    const tabIndexPattern = /tabIndex={?(-?\d+)}?/gi;
    const onKeyDownPattern = /onKeyDown=/gi;
    
    const tabIndexMatches = content.match(tabIndexPattern) || [];
    const keyDownMatches = content.match(onKeyDownPattern) || [];
    
    this.passes.push({
      type: 'Keyboard Navigation',
      message: `Found ${tabIndexMatches.length} tabIndex attributes, ${keyDownMatches.length} onKeyDown handlers`
    });
    
    // Check for interactive elements with proper keyboard handling
    const interactiveElements = [
      { pattern: /<button[^>]*>/gi, name: 'buttons' },
      { pattern: /<input[^>]*>/gi, name: 'inputs' },
      { pattern: /<select[^>]*>/gi, name: 'selects' },
      { pattern: /<textarea[^>]*>/gi, name: 'textareas' }
    ];
    
    interactiveElements.forEach(element => {
      const matches = content.match(element.pattern) || [];
      if (matches.length > 0) {
        this.passes.push({
          type: 'Interactive Elements',
          message: `Found ${matches.length} ${element.name}`
        });
      }
    });
  }

  // Check for touch target sizes (minimum 44x44px)
  checkTouchTargets(content) {
    const minHeightPattern = /min-h-\[44px\]/gi;
    const minWidthPattern = /min-w-\[44px\]/gi;
    
    const minHeightMatches = content.match(minHeightPattern) || [];
    const minWidthMatches = content.match(minWidthPattern) || [];
    
    if (minHeightMatches.length > 0 || minWidthMatches.length > 0) {
      this.passes.push({
        type: 'Touch Targets',
        message: `Found ${minHeightMatches.length} elements with min-height and ${minWidthMatches.length} with min-width for touch targets`
      });
    } else {
      this.warnings.push({
        type: 'Touch Targets',
        severity: 'warning',
        message: 'No explicit touch target sizing found. Ensure interactive elements are at least 44x44px.',
        wcag: '2.5.5 Target Size'
      });
    }
  }

  // Check for form labels and validation
  checkFormAccessibility(content) {
    const inputPattern = /<Input[^>]*>/gi;
    const selectPattern = /<Select[^>]*>/gi;
    const textareaPattern = /<Textarea[^>]*>/gi;
    
    const inputs = content.match(inputPattern) || [];
    const selects = content.match(selectPattern) || [];
    const textareas = content.match(textareaPattern) || [];
    
    const totalFormElements = inputs.length + selects.length + textareas.length;
    
    if (totalFormElements > 0) {
      this.passes.push({
        type: 'Form Elements',
        message: `Found ${totalFormElements} form elements (${inputs.length} inputs, ${selects.length} selects, ${textareas.length} textareas)`
      });
      
      // Check for validation error display
      const errorPattern = /text-red-600|text-red-500/gi;
      const errorMatches = content.match(errorPattern) || [];
      
      if (errorMatches.length > 0) {
        this.passes.push({
          type: 'Form Validation',
          message: `Found ${errorMatches.length} error styling classes`
        });
      }
    }
  }

  // Check for loading states and status updates
  checkLoadingStates(content) {
    const loadingPattern = /role="status"|aria-live="polite"|aria-live="assertive"/gi;
    const matches = content.match(loadingPattern) || [];
    
    if (matches.length > 0) {
      this.passes.push({
        type: 'Loading States',
        message: `Found ${matches.length} loading/status indicators with proper ARIA`
      });
    } else {
      this.warnings.push({
        type: 'Loading States',
        severity: 'warning',
        message: 'No loading states with ARIA live regions found',
        wcag: '4.1.3 Status Messages'
      });
    }
  }

  // Check for color contrast (basic check for common patterns)
  checkColorContrast(content) {
    const contrastIssues = [];
    
    // Check for potentially problematic color combinations
    const lightTextOnLight = /text-gray-300|text-gray-400/gi;
    const lightMatches = content.match(lightTextOnLight) || [];
    
    if (lightMatches.length > 0) {
      this.warnings.push({
        type: 'Color Contrast',
        severity: 'warning',
        message: `Found ${lightMatches.length} potentially low contrast text elements. Verify contrast ratios.`,
        wcag: '1.4.3 Contrast (Minimum)'
      });
    }
    
    // Look for proper contrast classes
    const goodContrastPattern = /text-gray-900|text-gray-800|text-white/gi;
    const goodMatches = content.match(goodContrastPattern) || [];
    
    if (goodMatches.length > 0) {
      this.passes.push({
        type: 'Color Contrast',
        message: `Found ${goodMatches.length} high contrast text elements`
      });
    }
  }

  // Check for responsive design patterns
  checkResponsiveDesign(content) {
    const responsivePatterns = [
      { pattern: /sm:/gi, name: 'small screen' },
      { pattern: /md:/gi, name: 'medium screen' },
      { pattern: /lg:/gi, name: 'large screen' },
      { pattern: /xl:/gi, name: 'extra large screen' }
    ];
    
    const responsiveClasses = [];
    responsivePatterns.forEach(pattern => {
      const matches = content.match(pattern.pattern) || [];
      if (matches.length > 0) {
        responsiveClasses.push(`${matches.length} ${pattern.name} classes`);
      }
    });
    
    if (responsiveClasses.length > 0) {
      this.passes.push({
        type: 'Responsive Design',
        message: `Found responsive classes: ${responsiveClasses.join(', ')}`
      });
    } else {
      this.warnings.push({
        type: 'Responsive Design',
        severity: 'warning',
        message: 'No responsive design classes found',
        wcag: '1.4.10 Reflow'
      });
    }
  }

  // Main audit function
  auditFile(filePath) {
    console.log(`\n🔍 Auditing: ${filePath}`);
    console.log('='.repeat(50));
    
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Reset arrays for this file
      this.issues = [];
      this.warnings = [];
      this.passes = [];
      
      // Run all checks
      this.checkSkipLinks(content);
      this.checkHeadingHierarchy(content);
      this.checkAriaLabels(content);
      this.checkKeyboardNavigation(content);
      this.checkTouchTargets(content);
      this.checkFormAccessibility(content);
      this.checkLoadingStates(content);
      this.checkColorContrast(content);
      this.checkResponsiveDesign(content);
      
      // Report results
      return this.reportResults();
      
    } catch (error) {
      console.error(`❌ Error reading file ${filePath}:`, error.message);
    }
  }

  reportResults() {
    // Report issues
    if (this.issues.length > 0) {
      console.log('\n❌ ISSUES FOUND:');
      this.issues.forEach((issue, index) => {
        console.log(`${index + 1}. [${issue.type}] ${issue.message}`);
        if (issue.wcag) {
          console.log(`   WCAG: ${issue.wcag}`);
        }
      });
    }
    
    // Report warnings
    if (this.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      this.warnings.forEach((warning, index) => {
        console.log(`${index + 1}. [${warning.type}] ${warning.message}`);
        if (warning.wcag) {
          console.log(`   WCAG: ${warning.wcag}`);
        }
      });
    }
    
    // Report passes
    if (this.passes.length > 0) {
      console.log('\n✅ ACCESSIBILITY FEATURES FOUND:');
      this.passes.forEach((pass, index) => {
        console.log(`${index + 1}. [${pass.type}] ${pass.message}`);
      });
    }
    
    // Summary
    console.log('\n📊 SUMMARY:');
    console.log(`Issues: ${this.issues.length}`);
    console.log(`Warnings: ${this.warnings.length}`);
    console.log(`Features Found: ${this.passes.length}`);
    
    return {
      issues: this.issues.length,
      warnings: this.warnings.length,
      passes: this.passes.length
    };
  }
}

// Main execution
function main() {
  const auditor = new AccessibilityAuditor();
  
  const filesToAudit = [
    'src/pages/dentist/DentistProfile.tsx',
    'src/pages/dentist/DentistSettings.tsx'
  ];
  
  console.log('🚀 Starting Accessibility Audit for Dentist Pages');
  console.log('Checking WCAG 2.1 AA compliance...\n');
  
  let totalIssues = 0;
  let totalWarnings = 0;
  let totalPasses = 0;
  
  filesToAudit.forEach(file => {
    if (fs.existsSync(file)) {
      const results = auditor.auditFile(file);
      totalIssues += results.issues;
      totalWarnings += results.warnings;
      totalPasses += results.passes;
    } else {
      console.log(`⚠️  File not found: ${file}`);
    }
  });
  
  console.log('\n' + '='.repeat(60));
  console.log('🎯 OVERALL AUDIT SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Issues: ${totalIssues}`);
  console.log(`Total Warnings: ${totalWarnings}`);
  console.log(`Total Features Found: ${totalPasses}`);
  
  if (totalIssues === 0) {
    console.log('\n🎉 No critical accessibility issues found!');
  } else {
    console.log('\n🔧 Please address the issues found above.');
  }
  
  if (totalWarnings > 0) {
    console.log('💡 Consider addressing the warnings for better accessibility.');
  }
}

if (require.main === module) {
  main();
}

module.exports = AccessibilityAuditor;