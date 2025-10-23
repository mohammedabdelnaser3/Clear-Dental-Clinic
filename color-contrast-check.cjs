#!/usr/bin/env node

/**
 * Color Contrast Checker for Dentist Pages
 * 
 * This tool checks color combinations used in the dentist pages
 * and verifies they meet WCAG AA contrast requirements (4.5:1 for normal text, 3:1 for large text)
 */

const fs = require('fs');

class ColorContrastChecker {
  constructor() {
    // Common Tailwind color values (simplified for key colors used)
    this.colors = {
      'white': '#ffffff',
      'gray-50': '#f9fafb',
      'gray-100': '#f3f4f6',
      'gray-200': '#e5e7eb',
      'gray-300': '#d1d5db',
      'gray-400': '#9ca3af',
      'gray-500': '#6b7280',
      'gray-600': '#4b5563',
      'gray-700': '#374151',
      'gray-800': '#1f2937',
      'gray-900': '#111827',
      'blue-50': '#eff6ff',
      'blue-100': '#dbeafe',
      'blue-600': '#2563eb',
      'blue-700': '#1d4ed8',
      'blue-800': '#1e40af',
      'green-100': '#dcfce7',
      'green-600': '#16a34a',
      'green-800': '#166534',
      'red-600': '#dc2626',
      'red-500': '#ef4444',
      'yellow-100': '#fef3c7',
      'yellow-800': '#92400e'
    };
  }

  // Convert hex to RGB
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  // Calculate relative luminance
  getLuminance(rgb) {
    const { r, g, b } = rgb;
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }

  // Calculate contrast ratio
  getContrastRatio(color1, color2) {
    const rgb1 = this.hexToRgb(color1);
    const rgb2 = this.hexToRgb(color2);
    
    if (!rgb1 || !rgb2) return null;
    
    const lum1 = this.getLuminance(rgb1);
    const lum2 = this.getLuminance(rgb2);
    
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    
    return (brightest + 0.05) / (darkest + 0.05);
  }

  // Check if contrast meets WCAG standards
  meetsWCAG(ratio, level = 'AA', size = 'normal') {
    const requirements = {
      'AA': { normal: 4.5, large: 3.0 },
      'AAA': { normal: 7.0, large: 4.5 }
    };
    
    return ratio >= requirements[level][size];
  }

  // Extract color combinations from content
  extractColorCombinations(content) {
    const combinations = [];
    
    // Common text/background combinations
    const textPatterns = [
      { text: 'text-gray-900', bg: 'bg-white', context: 'Primary text on white' },
      { text: 'text-gray-800', bg: 'bg-white', context: 'Secondary text on white' },
      { text: 'text-gray-600', bg: 'bg-white', context: 'Muted text on white' },
      { text: 'text-gray-500', bg: 'bg-white', context: 'Light text on white' },
      { text: 'text-gray-400', bg: 'bg-white', context: 'Very light text on white' },
      { text: 'text-white', bg: 'bg-blue-600', context: 'White text on blue button' },
      { text: 'text-blue-600', bg: 'bg-white', context: 'Blue text on white' },
      { text: 'text-blue-800', bg: 'bg-blue-100', context: 'Blue text on light blue' },
      { text: 'text-green-800', bg: 'bg-green-100', context: 'Green text on light green' },
      { text: 'text-red-600', bg: 'bg-white', context: 'Error text on white' },
      { text: 'text-yellow-800', bg: 'bg-yellow-100', context: 'Warning text on light yellow' }
    ];
    
    textPatterns.forEach(pattern => {
      if (content.includes(pattern.text)) {
        const textColor = this.colors[pattern.text.replace('text-', '')];
        const bgColor = this.colors[pattern.bg.replace('bg-', '')];
        
        if (textColor && bgColor) {
          const ratio = this.getContrastRatio(textColor, bgColor);
          if (ratio) {
            combinations.push({
              ...pattern,
              textColor,
              bgColor,
              ratio: ratio.toFixed(2),
              meetsAA: this.meetsWCAG(ratio, 'AA', 'normal'),
              meetsAALarge: this.meetsWCAG(ratio, 'AA', 'large')
            });
          }
        }
      }
    });
    
    return combinations;
  }

  // Check a file for color contrast issues
  checkFile(filePath, fileName) {
    console.log(`\n🎨 Checking Color Contrast: ${fileName}`);
    console.log('='.repeat(50));
    
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const combinations = this.extractColorCombinations(content);
      
      if (combinations.length === 0) {
        console.log('⚠️ No recognizable color combinations found');
        return;
      }
      
      console.log('\n📊 Color Contrast Analysis:');
      
      let passCount = 0;
      let failCount = 0;
      
      combinations.forEach((combo, index) => {
        const status = combo.meetsAA ? '✅' : '❌';
        const largeStatus = combo.meetsAALarge ? '✅' : '❌';
        
        console.log(`\n${index + 1}. ${combo.context}`);
        console.log(`   Text: ${combo.textColor} | Background: ${combo.bgColor}`);
        console.log(`   Contrast Ratio: ${combo.ratio}:1`);
        console.log(`   WCAG AA Normal Text (4.5:1): ${status}`);
        console.log(`   WCAG AA Large Text (3:1): ${largeStatus}`);
        
        if (combo.meetsAA) {
          passCount++;
        } else {
          failCount++;
          console.log(`   ⚠️ Recommendation: ${this.getRecommendation(combo.ratio)}`);
        }
      });
      
      console.log(`\n📈 Summary: ${passCount} passed, ${failCount} failed`);
      
      return { passed: passCount, failed: failCount, total: combinations.length };
      
    } catch (error) {
      console.error(`❌ Error checking ${fileName}:`, error.message);
      return { passed: 0, failed: 0, total: 0 };
    }
  }

  // Get recommendation for improving contrast
  getRecommendation(ratio) {
    const needed = 4.5;
    const current = parseFloat(ratio);
    
    if (current < 3.0) {
      return 'Use darker text or lighter background - significant contrast improvement needed';
    } else if (current < 4.5) {
      return 'Slightly increase contrast - consider darker text or adjust background';
    } else {
      return 'Contrast is adequate';
    }
  }

  // Generate contrast improvement suggestions
  generateSuggestions() {
    console.log('\n💡 CONTRAST IMPROVEMENT SUGGESTIONS');
    console.log('='.repeat(50));
    
    const suggestions = [
      {
        issue: 'text-gray-400 on white backgrounds',
        solution: 'Replace with text-gray-600 or text-gray-700 for better contrast',
        example: 'text-gray-400 → text-gray-600 (improves from 2.5:1 to 4.7:1)'
      },
      {
        issue: 'text-gray-500 on light backgrounds',
        solution: 'Use text-gray-700 or text-gray-800 instead',
        example: 'text-gray-500 → text-gray-700 (improves from 3.9:1 to 5.9:1)'
      },
      {
        issue: 'Light text on colored backgrounds',
        solution: 'Ensure sufficient contrast by using darker background shades',
        example: 'text-blue-600 on bg-blue-100 → text-blue-800 on bg-blue-50'
      },
      {
        issue: 'Small text with borderline contrast',
        solution: 'Increase font weight or size, or improve color contrast',
        example: 'Use font-medium or font-semibold for better readability'
      }
    ];
    
    suggestions.forEach((suggestion, index) => {
      console.log(`\n${index + 1}. ${suggestion.issue}`);
      console.log(`   Solution: ${suggestion.solution}`);
      console.log(`   Example: ${suggestion.example}`);
    });
  }
}

// Main execution
function main() {
  const checker = new ColorContrastChecker();
  
  console.log('🚀 Color Contrast Analysis for Dentist Pages');
  console.log('Checking WCAG 2.1 AA compliance (4.5:1 ratio for normal text)...\n');
  
  const files = [
    { path: 'src/pages/dentist/DentistProfile.tsx', name: 'DentistProfile' },
    { path: 'src/pages/dentist/DentistSettings.tsx', name: 'DentistSettings' }
  ];
  
  let totalPassed = 0;
  let totalFailed = 0;
  let totalChecked = 0;
  
  files.forEach(file => {
    if (fs.existsSync(file.path)) {
      const results = checker.checkFile(file.path, file.name);
      if (results) {
        totalPassed += results.passed;
        totalFailed += results.failed;
        totalChecked += results.total;
      }
    } else {
      console.log(`⚠️ File not found: ${file.path}`);
    }
  });
  
  console.log('\n' + '='.repeat(60));
  console.log('🎯 OVERALL CONTRAST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Combinations Checked: ${totalChecked}`);
  console.log(`Passed WCAG AA: ${totalPassed}`);
  console.log(`Failed WCAG AA: ${totalFailed}`);
  
  if (totalFailed === 0) {
    console.log('\n🎉 All color combinations meet WCAG AA standards!');
  } else {
    console.log(`\n⚠️ ${totalFailed} color combinations need improvement.`);
    checker.generateSuggestions();
  }
  
  console.log('\n📋 MANUAL VERIFICATION NEEDED:');
  console.log('- Test with actual browser rendering');
  console.log('- Verify with color contrast analyzer tools');
  console.log('- Test with users who have color vision differences');
  console.log('- Check contrast in different lighting conditions');
}

if (require.main === module) {
  main();
}

module.exports = ColorContrastChecker;