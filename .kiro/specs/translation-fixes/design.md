# Design Document

## Overview

This design document outlines the technical approach to fix translation-related issues in the DentalPro Manager application. The application currently has duplicate translation files in two locations (`src/i18n/locales/` and `public/locales/`), which creates confusion and maintenance overhead. Additionally, many components throughout the application may have hardcoded strings that need to be replaced with translation keys.

The solution involves:
1. Consolidating translation files to a single location (`public/locales/`)
2. Updating the i18n configuration to use the consolidated location
3. Auditing all pages and components for hardcoded strings
4. Replacing hardcoded strings with translation keys
5. Ensuring translation key consistency and completeness
6. Testing language switching functionality

## Architecture

### Current State

**Translation File Locations:**
- `src/i18n/locales/en.json` - Duplicate English translations
- `src/i18n/locales/ar.json` - Duplicate Arabic translations
- `public/locales/en/en.json` - Primary English translations (comprehensive)
- `public/locales/ar/ar.json` - Primary Arabic translations (comprehensive)

**i18n Configuration:**
- Located at `src/i18n/index.ts`
- Currently imports from `src/i18n/locales/` (incorrect path)
- Uses i18next with react-i18next
- Includes LanguageDetector for automatic language detection
- Stores language preference in localStorage

**Language Context:**
- `src/context/LanguageContext.tsx` provides global language state
- Handles RTL/LTR switching for Arabic
- Exposes `changeLanguage` function and `t` translation function
- Updates document direction and body classes

### Target State

**Single Translation Source:**
- All translations will be in `public/locales/{lang}/{lang}.json`
- Remove duplicate files from `src/i18n/locales/`
- Update i18n configuration to load from public folder

**Component Translation Usage:**
- All components will use `useLanguage` hook from LanguageContext
- All user-facing strings will use `t()` function
- No hardcoded strings in any component

## Components and Interfaces

### Translation File Structure

The translation files follow a hierarchical JSON structure organized by feature/page:

```json
{
  "privacy": { ... },
  "settings": {
    "profile": { ... },
    "clinic": { ... },
    "security": { ... },
    "notifications": { ... },
    "billing": { ... }
  },
  "patients": { ... },
  "appointments": { ... },
  "medications": { ... },
  "prescriptions": { ... },
  "billing": { ... },
  "services": { ... },
  "hero": { ... },
  "testimonials": { ... }
}
```

### i18n Configuration Update

The i18n configuration needs to be updated to use HTTP backend or proper resource loading:

**Option 1: HTTP Backend (Recommended)**
```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    debug: false,
    backend: {
      loadPath: '/locales/{{lng}}/{{lng}}.json'
    },
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage']
    }
  });
```

**Option 2: Dynamic Import**
```typescript
const resources = {
  en: {
    translation: await fetch('/locales/en/en.json').then(r => r.json())
  },
  ar: {
    translation: await fetch('/locales/ar/ar.json').then(r => r.json())
  }
};
```

### Component Translation Pattern

All components should follow this pattern:

```typescript
import { useLanguage } from '@/context/LanguageContext';

const MyComponent = () => {
  const { t } = useLanguage();
  
  return (
    <div>
      <h1>{t('myComponent.title')}</h1>
      <p>{t('myComponent.description')}</p>
      <button>{t('myComponent.button')}</button>
    </div>
  );
};
```

### Pages to Audit

Based on the project structure, the following pages need to be audited:

**Auth Pages:**
- `src/pages/auth/Login.tsx`
- `src/pages/auth/Register.tsx`
- `src/pages/auth/ForgotPassword.tsx`
- `src/pages/auth/ResetPassword.tsx`

**Dashboard Pages:**
- `src/pages/dashboard/Dashboard.tsx`
- `src/pages/dashboard/UnifiedAppointmentDashboard.tsx`

**Appointment Pages:**
- `src/pages/appointment/Appointments.tsx`
- `src/pages/appointment/AppointmentDetail.tsx`
- `src/pages/appointment/AppointmentForm.tsx`

**Patient Pages:**
- `src/pages/patient/Patients.tsx`
- `src/pages/patient/PatientDetail.tsx`
- `src/pages/patient/PatientForm.tsx`
- `src/pages/patient/PatientProfile.tsx`
- `src/pages/patient/PatientSettings.tsx`

**Medication Pages:**
- `src/pages/medications/Medications.tsx`

**Prescription Pages:**
- `src/pages/prescriptions/Prescriptions.tsx`

**Billing Pages:**
- `src/pages/billing/Billing.tsx`

**Report Pages:**
- `src/pages/reports/Reports.tsx`

**Clinic Pages:**
- `src/pages/clinics/Clinics.tsx`
- `src/pages/MultiClinicDashboard.tsx`

**Public Pages:**
- `src/pages/Home.tsx`
- `src/pages/About.tsx`
- `src/pages/Services.tsx`
- `src/pages/Contact.tsx`
- `src/pages/Privacy.tsx`
- `src/pages/Terms.tsx`

**Other Pages:**
- `src/pages/search/Search.tsx`
- `src/pages/NotFound.tsx`

### Components to Audit

Key component directories to audit:
- `src/components/appointment/` - Appointment-related components
- `src/components/auth/` - Authentication components
- `src/components/billing/` - Billing components
- `src/components/clinic/` - Clinic management components
- `src/components/common/` - Shared components
- `src/components/dashboard/` - Dashboard components
- `src/components/layout/` - Layout components (Header, Footer, Sidebar)
- `src/components/medications/` - Medication components
- `src/components/patient/` - Patient management components
- `src/components/prescriptions/` - Prescription components
- `src/components/ui/` - Reusable UI components
- `src/components/StaffScheduling.tsx` - Staff scheduling component

## Data Models

### Translation Key Structure

Translation keys follow a hierarchical naming convention:

```
{page/feature}.{section}.{element}
```

Examples:
- `settings.profile.firstName` - First name label in profile settings
- `appointments.form.selectDate` - Date selection in appointment form
- `patients.list.searchPlaceholder` - Search placeholder in patient list
- `billing.invoice.totalAmount` - Total amount label in invoice

### Translation Entry Format

Each translation entry should include:
- **Key**: Hierarchical dot-notation path
- **Value**: Translated string
- **Interpolation**: Use `{{variable}}` for dynamic values
- **Pluralization**: Use i18next plural format when needed

Example:
```json
{
  "appointments": {
    "count": "{{count}} appointment",
    "count_plural": "{{count}} appointments",
    "greeting": "Hello, {{name}}!"
  }
}
```

## Error Handling

### Missing Translation Keys

When a translation key is missing:
1. i18next will fall back to English (configured as `fallbackLng`)
2. In development mode, missing keys will be logged to console
3. The key itself will be displayed as fallback text

### Language Loading Errors

If translation files fail to load:
1. The application will fall back to English
2. An error will be logged to console
3. User will see English text instead of broken UI

### RTL Layout Issues

For Arabic (RTL) language:
1. Document direction is set via `document.documentElement.dir`
2. Body class `rtl` is added for custom RTL styling
3. Tailwind CSS RTL plugin handles most layout adjustments
4. Custom RTL styles can be added using `.rtl` class prefix

## Testing Strategy

### Unit Testing

**Translation Key Coverage:**
- Verify all translation keys exist in both English and Arabic files
- Check for missing keys by comparing file structures
- Validate translation key naming conventions

**Component Testing:**
- Test that components render with correct translations
- Test language switching updates component text
- Test RTL layout for Arabic language

### Integration Testing

**Language Switching:**
- Test switching from English to Arabic
- Test switching from Arabic to English
- Verify localStorage persistence
- Verify document direction changes
- Verify body class updates

**Page Navigation:**
- Navigate through all pages in English
- Navigate through all pages in Arabic
- Verify all text is translated
- Verify no hardcoded strings appear

### Manual Testing Checklist

1. **Initial Load:**
   - Application loads with correct default language
   - Language preference is detected from localStorage
   - All visible text is translated

2. **Language Switcher:**
   - Click language switcher
   - UI updates immediately
   - Direction changes for RTL languages
   - Preference is saved to localStorage

3. **Page-by-Page Audit:**
   - Visit each page in English
   - Visit each page in Arabic
   - Check for hardcoded strings
   - Verify form labels, buttons, placeholders
   - Verify error messages and notifications
   - Verify tooltips and modal content

4. **Form Validation:**
   - Trigger validation errors
   - Verify error messages are translated
   - Test in both languages

5. **Notifications:**
   - Trigger success notifications
   - Trigger error notifications
   - Verify toast messages are translated

## Implementation Phases

### Phase 1: Consolidate Translation Files
- Remove duplicate files from `src/i18n/locales/`
- Update i18n configuration to load from `public/locales/`
- Verify application loads correctly with new configuration

### Phase 2: Audit and Document
- Audit all pages for hardcoded strings
- Audit all components for hardcoded strings
- Create a comprehensive list of missing translations
- Document current translation coverage

### Phase 3: Add Missing Translation Keys
- Add missing keys to English translation file
- Add corresponding keys to Arabic translation file
- Ensure key structure matches between languages

### Phase 4: Update Components
- Replace hardcoded strings with translation keys
- Update components to use `useLanguage` hook
- Test each component after updates

### Phase 5: Testing and Validation
- Run manual testing checklist
- Test language switching
- Test RTL layout
- Verify translation completeness

## Dependencies

### Required Packages
- `i18next` - Core i18n library (already installed)
- `react-i18next` - React bindings for i18next (already installed)
- `i18next-browser-languagedetector` - Language detection (already installed)
- `i18next-http-backend` - Load translations via HTTP (may need to install)

### Installation Command
```bash
npm install i18next-http-backend
```

## Configuration Files

### Files to Modify
1. `src/i18n/index.ts` - Update i18n configuration
2. All page components - Add translation usage
3. All component files - Replace hardcoded strings

### Files to Delete
1. `src/i18n/locales/en.json` - Remove duplicate
2. `src/i18n/locales/ar.json` - Remove duplicate

### Files to Keep
1. `public/locales/en/en.json` - Primary English translations
2. `public/locales/ar/ar.json` - Primary Arabic translations
3. `src/context/LanguageContext.tsx` - Language context provider

## Performance Considerations

### Translation File Size
- Current translation files are large (single-line JSON)
- Consider code-splitting translations by feature if performance issues arise
- Use lazy loading for translation namespaces if needed

### Language Switching
- Language changes are immediate (no page reload)
- Translations are cached in memory
- localStorage is used for persistence

### Bundle Size
- Translation files are loaded separately from main bundle
- Using HTTP backend keeps main bundle size small
- Consider compression for translation files in production

## Accessibility

### Screen Readers
- Ensure all translated text is accessible to screen readers
- Use proper ARIA labels with translations
- Test with screen readers in both languages

### Keyboard Navigation
- Ensure language switcher is keyboard accessible
- Test tab order in both LTR and RTL layouts
- Verify focus indicators work in both directions

### Color Contrast
- Ensure translated text meets WCAG contrast requirements
- Test in both light and dark modes (if applicable)
- Verify readability in both languages

## Security Considerations

### XSS Prevention
- i18next escapes values by default (`escapeValue: false` is safe for React)
- Avoid using `dangerouslySetInnerHTML` with translated content
- Sanitize any user input before interpolation

### Content Security Policy
- Ensure CSP allows loading translation files from `/locales/`
- No inline scripts needed for translations
- All translations loaded via HTTP requests

## Maintenance

### Adding New Translations
1. Add key to English file first
2. Add corresponding key to Arabic file
3. Use hierarchical naming convention
4. Update component to use new key
5. Test in both languages

### Updating Existing Translations
1. Update in both language files
2. Verify no breaking changes to key structure
3. Test affected components
4. Check for interpolation variable changes

### Translation Review Process
1. Developer adds translation keys
2. Content team reviews translations
3. Native speakers verify accuracy
4. QA tests in both languages
5. Deploy to production
