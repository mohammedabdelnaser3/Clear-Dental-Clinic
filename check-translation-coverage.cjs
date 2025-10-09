#!/usr/bin/env node

/**
 * Translation Coverage Test Script
 * 
 * This script analyzes the codebase to:
 * 1. Find all translation keys used in components (t('key') patterns)
 * 2. Compare against available keys in translation files
 * 3. Identify missing translation keys
 * 4. Generate a comprehensive coverage report
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  srcDir: path.join(__dirname, 'src'),
  translationFiles: {
    en: path.join(__dirname, 'public/locales/en/en.json'),
    ar: path.join(__dirname, 'public/locales/ar/ar.json')
  },
  outputFile: path.join(__dirname, 'translation-coverage-report.json'),
  excludeDirs: ['node_modules', 'dist', 'build', '.git']
};

// Regular expressions to match translation key usage
const TRANSLATION_PATTERNS = [
  // t('key') or t("key")
  /\bt\s*\(\s*['"]([^'"]+)['"]/g,
  // t(`key`)
  /\bt\s*\(\s*`([^`]+)`/g,
  // i18n.t('key')
  /i18n\.t\s*\(\s*['"]([^'"]+)['"]/g
];

/**
 * Recursively get all files in a directory
 */
function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (!CONFIG.excludeDirs.includes(file)) {
        getAllFiles(filePath, fileList);
      }
    } else if (file.match(/\.(tsx?|jsx?)$/)) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

/**
 * Extract translation keys from a file
 */
function extractKeysFromFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const keys = new Set();

  TRANSLATION_PATTERNS.forEach(pattern => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const key = match[1];
      // Skip dynamic keys (containing variables)
      if (!key.includes('${') && !key.includes('{{')) {
        keys.add(key);
      }
    }
  });

  return Array.from(keys);
}

/**
 * Flatten nested translation object to dot notation keys
 */
function flattenTranslations(obj, prefix = '') {
  const keys = new Set();

  Object.keys(obj).forEach(key => {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      // Recursively flatten nested objects
      const nestedKeys = flattenTranslations(obj[key], fullKey);
      nestedKeys.forEach(k => keys.add(k));
    } else {
      keys.add(fullKey);
    }
  });

  return Array.from(keys);
}

/**
 * Load translation keys from JSON file
 */
function loadTranslationKeys(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const translations = JSON.parse(content);
    return flattenTranslations(translations);
  } catch (error) {
    console.error(`Error loading translation file ${filePath}:`, error.message);
    return [];
  }
}

/**
 * Find files where a specific key is used
 */
function findKeyUsage(key, files) {
  const usageFiles = [];

  files.forEach(filePath => {
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Check if the key appears in the file
    const patterns = [
      new RegExp(`t\\s*\\(\\s*['"\`]${key.replace(/\./g, '\\.')}['"\`]`, 'g'),
      new RegExp(`i18n\\.t\\s*\\(\\s*['"\`]${key.replace(/\./g, '\\.')}['"\`]`, 'g')
    ];

    if (patterns.some(pattern => pattern.test(content))) {
      usageFiles.push(path.relative(__dirname, filePath));
    }
  });

  return usageFiles;
}

/**
 * Main analysis function
 */
function analyzeTranslationCoverage() {
  console.log('🔍 Starting translation coverage analysis...\n');

  // Get all source files
  console.log('📂 Scanning source files...');
  const sourceFiles = getAllFiles(CONFIG.srcDir);
  console.log(`   Found ${sourceFiles.length} source files\n`);

  // Extract all used translation keys
  console.log('🔑 Extracting translation keys from components...');
  const usedKeysMap = new Map();
  
  sourceFiles.forEach(filePath => {
    const keys = extractKeysFromFile(filePath);
    if (keys.length > 0) {
      usedKeysMap.set(filePath, keys);
    }
  });

  const allUsedKeys = new Set();
  usedKeysMap.forEach(keys => keys.forEach(key => allUsedKeys.add(key)));
  console.log(`   Found ${allUsedKeys.size} unique translation keys in use\n`);

  // Load available translation keys
  console.log('📖 Loading translation files...');
  const availableKeys = {
    en: new Set(loadTranslationKeys(CONFIG.translationFiles.en)),
    ar: new Set(loadTranslationKeys(CONFIG.translationFiles.ar))
  };
  console.log(`   English: ${availableKeys.en.size} keys`);
  console.log(`   Arabic: ${availableKeys.ar.size} keys\n`);

  // Find missing keys
  console.log('🔍 Analyzing coverage...');
  const missingInEn = [];
  const missingInAr = [];
  const unusedInEn = [];
  const unusedInAr = [];

  // Check for keys used in code but missing in translation files
  allUsedKeys.forEach(key => {
    if (!availableKeys.en.has(key)) {
      missingInEn.push({
        key,
        usedIn: findKeyUsage(key, sourceFiles)
      });
    }
    if (!availableKeys.ar.has(key)) {
      missingInAr.push({
        key,
        usedIn: findKeyUsage(key, sourceFiles)
      });
    }
  });

  // Check for keys in translation files but not used in code
  availableKeys.en.forEach(key => {
    if (!allUsedKeys.has(key)) {
      unusedInEn.push(key);
    }
  });

  availableKeys.ar.forEach(key => {
    if (!allUsedKeys.has(key)) {
      unusedInAr.push(key);
    }
  });

  // Calculate coverage percentages
  const enCoverage = availableKeys.en.size > 0 
    ? ((availableKeys.en.size - missingInEn.length) / availableKeys.en.size * 100).toFixed(2)
    : 0;
  const arCoverage = availableKeys.ar.size > 0
    ? ((availableKeys.ar.size - missingInAr.length) / availableKeys.ar.size * 100).toFixed(2)
    : 0;

  // Generate report
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalSourceFiles: sourceFiles.length,
      totalKeysUsed: allUsedKeys.size,
      totalKeysAvailable: {
        en: availableKeys.en.size,
        ar: availableKeys.ar.size
      },
      coverage: {
        en: `${enCoverage}%`,
        ar: `${arCoverage}%`
      }
    },
    issues: {
      missingInEnglish: {
        count: missingInEn.length,
        keys: missingInEn
      },
      missingInArabic: {
        count: missingInAr.length,
        keys: missingInAr
      },
      unusedInEnglish: {
        count: unusedInEn.length,
        keys: unusedInEn
      },
      unusedInArabic: {
        count: unusedInAr.length,
        keys: unusedInAr
      }
    },
    keysByFile: Array.from(usedKeysMap.entries()).map(([file, keys]) => ({
      file: path.relative(__dirname, file),
      keyCount: keys.length,
      keys: keys.sort()
    }))
  };

  // Save report to file
  fs.writeFileSync(CONFIG.outputFile, JSON.stringify(report, null, 2));
  console.log(`\n✅ Report saved to: ${CONFIG.outputFile}\n`);

  // Print summary
  console.log('📊 TRANSLATION COVERAGE REPORT');
  console.log('═'.repeat(50));
  console.log(`\n📈 Summary:`);
  console.log(`   Total source files scanned: ${sourceFiles.length}`);
  console.log(`   Total translation keys used: ${allUsedKeys.size}`);
  console.log(`   Available keys (English): ${availableKeys.en.size}`);
  console.log(`   Available keys (Arabic): ${availableKeys.ar.size}`);
  console.log(`\n📊 Coverage:`);
  console.log(`   English: ${enCoverage}%`);
  console.log(`   Arabic: ${arCoverage}%`);

  if (missingInEn.length > 0) {
    console.log(`\n⚠️  Missing in English: ${missingInEn.length} keys`);
    missingInEn.slice(0, 10).forEach(({ key, usedIn }) => {
      console.log(`   - ${key}`);
      if (usedIn.length > 0) {
        console.log(`     Used in: ${usedIn[0]}${usedIn.length > 1 ? ` (+${usedIn.length - 1} more)` : ''}`);
      }
    });
    if (missingInEn.length > 10) {
      console.log(`   ... and ${missingInEn.length - 10} more (see report file)`);
    }
  }

  if (missingInAr.length > 0) {
    console.log(`\n⚠️  Missing in Arabic: ${missingInAr.length} keys`);
    missingInAr.slice(0, 10).forEach(({ key, usedIn }) => {
      console.log(`   - ${key}`);
      if (usedIn.length > 0) {
        console.log(`     Used in: ${usedIn[0]}${usedIn.length > 1 ? ` (+${usedIn.length - 1} more)` : ''}`);
      }
    });
    if (missingInAr.length > 10) {
      console.log(`   ... and ${missingInAr.length - 10} more (see report file)`);
    }
  }

  if (unusedInEn.length > 0) {
    console.log(`\n💡 Unused in English: ${unusedInEn.length} keys`);
    console.log(`   (These keys exist in translation file but are not used in code)`);
  }

  if (unusedInAr.length > 0) {
    console.log(`\n💡 Unused in Arabic: ${unusedInAr.length} keys`);
    console.log(`   (These keys exist in translation file but are not used in code)`);
  }

  console.log('\n' + '═'.repeat(50));

  // Exit with error code if there are missing keys
  if (missingInEn.length > 0 || missingInAr.length > 0) {
    console.log('\n❌ Translation coverage check failed: Missing translation keys detected');
    process.exit(1);
  } else {
    console.log('\n✅ Translation coverage check passed: All keys are available');
    process.exit(0);
  }
}

// Run the analysis
try {
  analyzeTranslationCoverage();
} catch (error) {
  console.error('❌ Error during analysis:', error);
  process.exit(1);
}
