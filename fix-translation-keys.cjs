const fs = require('fs');
const path = require('path');

// Read translation files
const enPath = path.join(__dirname, 'public/locales/en/en.json');
const arPath = path.join(__dirname, 'public/locales/ar/ar.json');

const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const arData = JSON.parse(fs.readFileSync(arPath, 'utf8'));

// Function to get value at path
function getValueAtPath(obj, path) {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

// Function to set value at path
function setValueAtPath(obj, path, value) {
  const keys = path.split('.');
  const lastKey = keys.pop();
  const target = keys.reduce((current, key) => {
    if (!current[key]) current[key] = {};
    return current[key];
  }, obj);
  target[lastKey] = value;
}

// Function to get all keys from nested object
function getAllKeys(obj, prefix = '') {
  let keys = [];
  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      keys = keys.concat(getAllKeys(obj[key], fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

// Get all keys from both files
const enKeys = getAllKeys(enData);
const arKeys = getAllKeys(arData);

// Find missing keys
const missingInArabic = enKeys.filter(key => !arKeys.includes(key));
const missingInEnglish = arKeys.filter(key => !enKeys.includes(key));

console.log(`Found ${missingInArabic.length} keys missing in Arabic`);
console.log(`Found ${missingInEnglish.length} keys missing in English`);

// Add missing keys to Arabic with placeholder
missingInArabic.forEach(key => {
  const enValue = getValueAtPath(enData, key);
  // Use English value as placeholder with [AR] prefix to indicate it needs translation
  setValueAtPath(arData, key, `[AR] ${enValue}`);
});

// Add missing keys to English with placeholder
missingInEnglish.forEach(key => {
  const arValue = getValueAtPath(arData, key);
  // Use Arabic value as placeholder with [EN] prefix to indicate it needs translation
  setValueAtPath(enData, key, `[EN] ${arValue}`);
});

// Write updated files
fs.writeFileSync(enPath, JSON.stringify(enData, null, 2));
fs.writeFileSync(arPath, JSON.stringify(arData, null, 2));

console.log('\n✅ Translation files updated successfully!');
console.log(`Added ${missingInArabic.length} keys to Arabic file`);
console.log(`Added ${missingInEnglish.length} keys to English file`);
console.log('\nNote: Keys prefixed with [AR] or [EN] need proper translation.');
