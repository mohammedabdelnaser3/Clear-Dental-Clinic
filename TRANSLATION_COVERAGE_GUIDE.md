# Translation Coverage Testing Guide

## Overview

The translation coverage test script (`check-translation-coverage.cjs`) is an automated tool that analyzes the codebase to ensure all translation keys used in components are available in the translation files, and identifies any unused translation keys.

## Purpose

This script helps maintain translation quality by:
- **Identifying missing translations**: Finds translation keys used in code but not defined in translation files
- **Detecting unused keys**: Finds translation keys defined in files but never used in code
- **Generating coverage reports**: Provides detailed statistics and coverage percentages
- **Preventing translation errors**: Catches missing translations before they reach production

## How It Works

The script performs the following analysis:

1. **Scans all source files** in the `src/` directory for TypeScript/JavaScript files
2. **Extracts translation keys** by finding patterns like:
   - `t('key')` or `t("key")`
   - `t(\`key\`)`
   - `i18n.t('key')`
3. **Loads translation files** from `public/locales/en/en.json` and `public/locales/ar/ar.json`
4. **Compares usage vs availability** to identify:
   - Keys used in code but missing in translation files
   - Keys defined in translation files but never used in code
5. **Generates a detailed report** with coverage statistics and issue lists

## Running the Script

### Using npm script (recommended):
```bash
npm run check:translations
```

### Using node directly:
```bash
node check-translation-coverage.cjs
```

## Output

### Console Output

The script provides a summary in the console:

```
📊 TRANSLATION COVERAGE REPORT
══════════════════════════════════════════════════

📈 Summary:
   Total source files scanned: 193
   Total translation keys used: 1848
   Available keys (English): 1781
   Available keys (Arabic): 1781

📊 Coverage:
   English: 96.37%
   Arabic: 96.37%

⚠️  Missing in English: 67 keys
   - appointments.services.consultation
     Used in: src/components/appointment/AppointmentBooking.tsx
   ...

✅ Translation coverage check passed
```

### JSON Report

A detailed JSON report is saved to `translation-coverage-report.json` containing:

```json
{
  "timestamp": "2025-10-08T23:46:51.436Z",
  "summary": {
    "totalSourceFiles": 193,
    "totalKeysUsed": 1848,
    "totalKeysAvailable": {
      "en": 1781,
      "ar": 1781
    },
    "coverage": {
      "en": "96.37%",
      "ar": "96.37%"
    }
  },
  "issues": {
    "missingInEnglish": {
      "count": 67,
      "keys": [
        {
          "key": "appointments.services.consultation",
          "usedIn": [
            "src/components/appointment/AppointmentBooking.tsx"
          ]
        }
      ]
    },
    "missingInArabic": { ... },
    "unusedInEnglish": { ... },
    "unusedInArabic": { ... }
  },
  "keysByFile": [
    {
      "file": "src/pages/Home.tsx",
      "keyCount": 15,
      "keys": ["hero.title", "hero.subtitle", ...]
    }
  ]
}
```

## Exit Codes

- **Exit 0**: All translation keys are available (success)
- **Exit 1**: Missing translation keys detected (failure)

This makes the script suitable for CI/CD pipelines.

## Interpreting Results

### Missing Keys

Keys that appear in your code but are not defined in translation files:

```
⚠️  Missing in English: 67 keys
   - appointments.services.consultation
     Used in: src/components/appointment/AppointmentBooking.tsx
```

**Action**: Add these keys to the translation files.

### Unused Keys

Keys that are defined in translation files but never used in code:

```
💡 Unused in English: 142 keys
   (These keys exist in translation file but are not used in code)
```

**Action**: Consider removing these keys to keep translation files clean, or they may be used in dynamic contexts not detected by the script.

## Limitations

The script has some limitations:

1. **Dynamic keys**: Keys constructed dynamically (e.g., `t(\`user.\${type}\`)`) are not detected
2. **Conditional usage**: Keys used only in certain conditions may be flagged as unused
3. **External usage**: Keys used in configuration files or non-TypeScript/JavaScript files are not detected
4. **Template literals**: Complex template literals with variables are skipped

## Best Practices

1. **Run regularly**: Include this script in your development workflow
2. **CI/CD integration**: Add to your CI pipeline to catch missing translations early
3. **Review unused keys**: Periodically review and clean up unused translation keys
4. **Document dynamic keys**: Add comments for dynamically constructed keys that the script can't detect
5. **Keep translations in sync**: Ensure English and Arabic files have matching key structures

## Troubleshooting

### Script fails to find translation files

Ensure the translation files exist at:
- `public/locales/en/en.json`
- `public/locales/ar/ar.json`

### False positives for unused keys

Some keys may be used in:
- Dynamic contexts (e.g., error messages from API)
- Configuration files
- External libraries
- Future features

Review the report carefully before removing keys.

### High number of missing keys

This may indicate:
- Recent code changes without translation updates
- Hardcoded strings that need to be replaced with translation keys
- Incorrect key names in code

## Integration with Development Workflow

### Pre-commit Hook

Add to `.git/hooks/pre-commit`:
```bash
#!/bin/sh
npm run check:translations
```

### CI/CD Pipeline

Add to your CI configuration:
```yaml
- name: Check Translation Coverage
  run: npm run check:translations
```

### VS Code Task

Add to `.vscode/tasks.json`:
```json
{
  "label": "Check Translation Coverage",
  "type": "shell",
  "command": "npm run check:translations",
  "problemMatcher": []
}
```

## Maintenance

The script requires minimal maintenance:
- Update `CONFIG` object if translation file paths change
- Add new translation patterns if using different i18n syntax
- Adjust exclusion patterns if needed

## Related Documentation

- [Translation Consolidation Summary](TRANSLATION_CONSOLIDATION_SUMMARY.md)
- [Translation Fixes Summary](TRANSLATION_FIXES_SUMMARY.md)
- [i18n Configuration](src/i18n/index.ts)
- [Language Context](src/context/LanguageContext.tsx)
