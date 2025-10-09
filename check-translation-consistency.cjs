const fs = require('fs');
const path = require('path');

// Read translation files
const enPath = path.join(__dirname, 'public/locales/en/en.json');
const arPath = path.join(__dirname, 'public/locales/ar/ar.json');

const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const arData = JSON.parse(fs.readFileSync(arPath, 'utf8'));

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
const enKeys = getAllKeys(enData).sort();
const arKeys = getAllKeys(arData).sort();

// Find missing keys
const missingInArabic = enKeys.filter(key => !arKeys.includes(key));
const missingInEnglish = arKeys.filter(key => !enKeys.includes(key));

// Generate report
console.log('=== Translation Key Consistency Report ===\n');
console.log(`Total English keys: ${enKeys.length}`);
console.log(`Total Arabic keys: ${arKeys.length}`);
console.log(`\n--- Keys Missing in Arabic (${missingInArabic.length}) ---`);
if (missingInArabic.length > 0) {
  missingInArabic.forEach(key => console.log(`  - ${key}`));
} else {
  console.log('  None');
}

console.log(`\n--- Keys Missing in English (${missingInEnglish.length}) ---`);
if (missingInEnglish.length > 0) {
  missingInEnglish.forEach(key => console.log(`  - ${key}`));
} else {
  console.log('  None');
}

// Write detailed report to file
const report = {
  summary: {
    totalEnglishKeys: enKeys.length,
    totalArabicKeys: arKeys.length,
    missingInArabicCount: missingInArabic.length,
    missingInEnglishCount: missingInEnglish.length
  },
  missingInArabic,
  missingInEnglish,
  allEnglishKeys: enKeys,
  allArabicKeys: arKeys
};

fs.writeFileSync(
  'translation-consistency-report.json',
  JSON.stringify(report, null, 2)
);

console.log('\n✓ Detailed report saved to translation-consistency-report.json');

// Exit with error code if there are inconsistencies
if (missingInArabic.length > 0 || missingInEnglish.length > 0) {
  console.log('\n❌ Translation key inconsistencies found!');
  process.exit(1);
} else {
  console.log('\n✅ All translation keys are consistent!');
  process.exit(0);
}
