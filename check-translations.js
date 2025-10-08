const fs = require('fs');
const path = require('path');

// Load translation files
const enPath = path.join(__dirname, 'src/i18n/locales/en.json');
const arPath = path.join(__dirname, 'src/i18n/locales/ar.json');

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const ar = JSON.parse(fs.readFileSync(arPath, 'utf8'));

// Function to get all keys from an object recursively
function getAllKeys(obj, prefix = '') {
  const keys = [];
  for (const key in obj) {
    const newPrefix = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      keys.push(...getAllKeys(obj[key], newPrefix));
    } else {
      keys.push(newPrefix);
    }
  }
  return keys;
}

const enKeys = new Set(getAllKeys(en));
const arKeys = new Set(getAllKeys(ar));

// Find missing keys
const missingInAr = [...enKeys].filter(key => !arKeys.has(key));
const missingInEn = [...arKeys].filter(key => !enKeys.has(key));

console.log('=== Translation Keys Report ===\n');
console.log(`Total English keys: ${enKeys.size}`);
console.log(`Total Arabic keys: ${arKeys.size}`);
console.log('');

if (missingInAr.length > 0) {
  console.log(`⚠️  Keys missing in Arabic (${missingInAr.length}):`);
  missingInAr.forEach(key => console.log(`  - ${key}`));
  console.log('');
}

if (missingInEn.length > 0) {
  console.log(`⚠️  Keys missing in English (${missingInEn.length}):`);
  missingInEn.forEach(key => console.log(`  - ${key}`));
  console.log('');
}

if (missingInAr.length === 0 && missingInEn.length === 0) {
  console.log('✅ All translation keys are present in both languages!');
} else {
  console.log(`\n❌ Found ${missingInAr.length + missingInEn.length} missing translations`);
  process.exit(1);
}

