/**
 * Automated Language Switching Verification Script
 * 
 * This script verifies:
 * 1. Translation files are valid JSON
 * 2. Both language files have matching key structures
 * 3. No missing translations
 * 4. Key consistency between English and Arabic
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Language Switching Verification\n');
console.log('=' .repeat(60));

// Load translation files
const enPath = path.join(__dirname, 'public/locales/en/en.json');
const arPath = path.join(__dirname, 'public/locales/ar/ar.json');

let enTranslations, arTranslations;
let hasErrors = false;

// Test 1: Verify translation files exist
console.log('\n📁 Test 1: Checking translation files exist...');
try {
  if (!fs.existsSync(enPath)) {
    console.error('❌ English translation file not found:', enPath);
    hasErrors = true;
  } else {
    console.log('✅ English translation file exists');
  }
  
  if (!fs.existsSync(arPath)) {
    console.error('❌ Arabic translation file not found:', arPath);
    hasErrors = true;
  } else {
    console.log('✅ Arabic translation file exists');
  }
} catch (error) {
  console.error('❌ Error checking files:', error.message);
  hasErrors = true;
}

// Test 2: Verify translation files are valid JSON
console.log('\n📝 Test 2: Validating JSON structure...');
try {
  const enContent = fs.readFileSync(enPath, 'utf8');
  enTranslations = JSON.parse(enContent);
  console.log('✅ English translation file is valid JSON');
  console.log(`   - File size: ${(enContent.length / 1024).toFixed(2)} KB`);
} catch (error) {
  console.error('❌ English translation file has JSON errors:', error.message);
  hasErrors = true;
}

try {
  const arContent = fs.readFileSync(arPath, 'utf8');
  arTranslations = JSON.parse(arContent);
  console.log('✅ Arabic translation file is valid JSON');
  console.log(`   - File size: ${(arContent.length / 1024).toFixed(2)} KB`);
} catch (error) {
  console.error('❌ Arabic translation file has JSON errors:', error.message);
  hasErrors = true;
}

if (!enTranslations || !arTranslations) {
  console.error('\n❌ Cannot proceed with further tests due to JSON errors');
  process.exit(1);
}

// Test 3: Count translation keys
console.log('\n🔢 Test 3: Counting translation keys...');
function countKeys(obj, prefix = '') {
  let count = 0;
  const keys = [];
  
  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      const result = countKeys(obj[key], fullKey);
      count += result.count;
      keys.push(...result.keys);
    } else {
      count++;
      keys.push(fullKey);
    }
  }
  
  return { count, keys };
}

const enResult = countKeys(enTranslations);
const arResult = countKeys(arTranslations);

console.log(`✅ English translations: ${enResult.count} keys`);
console.log(`✅ Arabic translations: ${arResult.count} keys`);

if (enResult.count !== arResult.count) {
  console.warn(`⚠️  Key count mismatch: EN(${enResult.count}) vs AR(${arResult.count})`);
  hasErrors = true;
} else {
  console.log('✅ Key counts match');
}

// Test 4: Check for missing keys
console.log('\n🔍 Test 4: Checking for missing translation keys...');

const enKeys = new Set(enResult.keys);
const arKeys = new Set(arResult.keys);

const missingInArabic = enResult.keys.filter(key => !arKeys.has(key));
const missingInEnglish = arResult.keys.filter(key => !enKeys.has(key));

if (missingInArabic.length > 0) {
  console.error(`❌ Keys missing in Arabic (${missingInArabic.length}):`);
  missingInArabic.slice(0, 10).forEach(key => console.error(`   - ${key}`));
  if (missingInArabic.length > 10) {
    console.error(`   ... and ${missingInArabic.length - 10} more`);
  }
  hasErrors = true;
} else {
  console.log('✅ No keys missing in Arabic');
}

if (missingInEnglish.length > 0) {
  console.error(`❌ Keys missing in English (${missingInEnglish.length}):`);
  missingInEnglish.slice(0, 10).forEach(key => console.error(`   - ${key}`));
  if (missingInEnglish.length > 10) {
    console.error(`   ... and ${missingInEnglish.length - 10} more`);
  }
  hasErrors = true;
} else {
  console.log('✅ No keys missing in English');
}

// Test 5: Check for empty translations
console.log('\n📋 Test 5: Checking for empty translations...');

function findEmptyValues(obj, prefix = '') {
  const empty = [];
  
  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      empty.push(...findEmptyValues(obj[key], fullKey));
    } else if (obj[key] === '' || obj[key] === null || obj[key] === undefined) {
      empty.push(fullKey);
    }
  }
  
  return empty;
}

const emptyEnKeys = findEmptyValues(enTranslations);
const emptyArKeys = findEmptyValues(arTranslations);

if (emptyEnKeys.length > 0) {
  console.warn(`⚠️  Empty values in English (${emptyEnKeys.length}):`);
  emptyEnKeys.slice(0, 5).forEach(key => console.warn(`   - ${key}`));
  if (emptyEnKeys.length > 5) {
    console.warn(`   ... and ${emptyEnKeys.length - 5} more`);
  }
} else {
  console.log('✅ No empty values in English');
}

if (emptyArKeys.length > 0) {
  console.warn(`⚠️  Empty values in Arabic (${emptyArKeys.length}):`);
  emptyArKeys.slice(0, 5).forEach(key => console.warn(`   - ${key}`));
  if (emptyArKeys.length > 5) {
    console.warn(`   ... and ${emptyArKeys.length - 5} more`);
  }
} else {
  console.log('✅ No empty values in Arabic');
}

// Test 6: Check top-level structure
console.log('\n🏗️  Test 6: Checking top-level structure...');

const enTopLevel = Object.keys(enTranslations).sort();
const arTopLevel = Object.keys(arTranslations).sort();

console.log(`English top-level keys (${enTopLevel.length}):`, enTopLevel.join(', '));
console.log(`Arabic top-level keys (${arTopLevel.length}):`, arTopLevel.join(', '));

const topLevelMatch = JSON.stringify(enTopLevel) === JSON.stringify(arTopLevel);
if (topLevelMatch) {
  console.log('✅ Top-level structure matches');
} else {
  console.error('❌ Top-level structure mismatch');
  hasErrors = true;
}

// Test 7: Verify i18n configuration file
console.log('\n⚙️  Test 7: Checking i18n configuration...');

const i18nPath = path.join(__dirname, 'src/i18n/index.ts');
try {
  const i18nContent = fs.readFileSync(i18nPath, 'utf8');
  
  const checks = [
    { pattern: /HttpBackend/, name: 'HTTP Backend' },
    { pattern: /LanguageDetector/, name: 'Language Detector' },
    { pattern: /initReactI18next/, name: 'React i18next' },
    { pattern: /fallbackLng:\s*['"]en['"]/, name: 'Fallback language (en)' },
    { pattern: /loadPath:\s*['"]\/locales\/\{\{lng\}\}\/\{\{lng\}\}\.json['"]/, name: 'Load path' },
    { pattern: /localStorage/, name: 'localStorage detection' },
  ];
  
  checks.forEach(check => {
    if (check.pattern.test(i18nContent)) {
      console.log(`✅ ${check.name} configured`);
    } else {
      console.error(`❌ ${check.name} not found`);
      hasErrors = true;
    }
  });
} catch (error) {
  console.error('❌ Error reading i18n config:', error.message);
  hasErrors = true;
}

// Test 8: Verify LanguageContext
console.log('\n🔄 Test 8: Checking LanguageContext...');

const contextPath = path.join(__dirname, 'src/context/LanguageContext.tsx');
try {
  const contextContent = fs.readFileSync(contextPath, 'utf8');
  
  const checks = [
    { pattern: /changeLanguage/, name: 'changeLanguage function' },
    { pattern: /localStorage\.setItem\(['"]language['"]/, name: 'localStorage persistence' },
    { pattern: /document\.documentElement\.dir/, name: 'Document direction update' },
    { pattern: /document\.body\.classList\.add\(['"]rtl['"]/, name: 'RTL class management' },
    { pattern: /isRTL/, name: 'RTL state' },
  ];
  
  checks.forEach(check => {
    if (check.pattern.test(contextContent)) {
      console.log(`✅ ${check.name} implemented`);
    } else {
      console.error(`❌ ${check.name} not found`);
      hasErrors = true;
    }
  });
} catch (error) {
  console.error('❌ Error reading LanguageContext:', error.message);
  hasErrors = true;
}

// Summary
console.log('\n' + '='.repeat(60));
console.log('\n📊 VERIFICATION SUMMARY\n');

if (hasErrors) {
  console.log('❌ Some tests failed. Please review the errors above.');
  console.log('\n⚠️  Manual testing is still required to verify:');
  console.log('   - Language switching in the browser');
  console.log('   - RTL layout rendering');
  console.log('   - localStorage persistence');
  console.log('   - No hardcoded English text in Arabic mode');
  process.exit(1);
} else {
  console.log('✅ All automated checks passed!');
  console.log('\n📝 Next steps:');
  console.log('   1. Start the application: npm run dev');
  console.log('   2. Test language switching manually');
  console.log('   3. Verify RTL layout in Arabic');
  console.log('   4. Check localStorage persistence');
  console.log('   5. Navigate through all pages in both languages');
  console.log('   6. Look for any hardcoded English text');
  console.log('\n📄 See test-language-switching.md for detailed test cases');
  process.exit(0);
}
