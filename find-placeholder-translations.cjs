const fs = require('fs');
const path = require('path');

// Read translation files
const enPath = path.join(__dirname, 'public/locales/en/en.json');
const arPath = path.join(__dirname, 'public/locales/ar/ar.json');

const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const arData = JSON.parse(fs.readFileSync(arPath, 'utf8'));

// Function to find all placeholder values
function findPlaceholders(obj, prefix = '', placeholderPrefix) {
  let placeholders = [];
  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      placeholders = placeholders.concat(findPlaceholders(obj[key], fullKey, placeholderPrefix));
    } else if (typeof obj[key] === 'string' && obj[key].startsWith(placeholderPrefix)) {
      placeholders.push({
        key: fullKey,
        value: obj[key]
      });
    }
  }
  return placeholders;
}

const enPlaceholders = findPlaceholders(enData, '', '[EN]');
const arPlaceholders = findPlaceholders(arData, '', '[AR]');

console.log('=== Placeholder Translation Report ===\n');
console.log(`English placeholders needing translation: ${enPlaceholders.length}`);
console.log(`Arabic placeholders needing translation: ${arPlaceholders.length}`);

if (enPlaceholders.length > 0) {
  console.log('\n--- English Keys Needing Translation ---');
  enPlaceholders.slice(0, 20).forEach(item => {
    console.log(`  ${item.key}: ${item.value.substring(0, 80)}${item.value.length > 80 ? '...' : ''}`);
  });
  if (enPlaceholders.length > 20) {
    console.log(`  ... and ${enPlaceholders.length - 20} more`);
  }
}

if (arPlaceholders.length > 0) {
  console.log('\n--- Arabic Keys Needing Translation ---');
  arPlaceholders.slice(0, 20).forEach(item => {
    console.log(`  ${item.key}: ${item.value.substring(0, 80)}${item.value.length > 80 ? '...' : ''}`);
  });
  if (arPlaceholders.length > 20) {
    console.log(`  ... and ${arPlaceholders.length - 20} more`);
  }
}

// Write detailed report
const report = {
  summary: {
    englishPlaceholdersCount: enPlaceholders.length,
    arabicPlaceholdersCount: arPlaceholders.length,
    totalPlaceholders: enPlaceholders.length + arPlaceholders.length
  },
  englishPlaceholders: enPlaceholders,
  arabicPlaceholders: arPlaceholders
};

fs.writeFileSync(
  'placeholder-translations-report.json',
  JSON.stringify(report, null, 2)
);

console.log('\n✓ Detailed report saved to placeholder-translations-report.json');
console.log('\nNote: These placeholders should be replaced with proper translations.');
console.log('Keys with [EN] prefix need English translation.');
console.log('Keys with [AR] prefix need Arabic translation.');
