# Implementation Plan

- [x] 1. Consolidate translation files and update i18n configuration
  - Remove duplicate translation files from `src/i18n/locales/` directory
  - Install `i18next-http-backend` package if not already installed
  - Update `src/i18n/index.ts` to use HTTP backend and load translations from `public/locales/`
  - Test that application loads correctly with new configuration
  - Verify language switching still works
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 5.1_

- [x] 2. Verify all pages use translation hooks
  - All auth pages (Login, Register, ForgotPassword, ResetPassword) are using `useTranslation`
  - All dashboard pages are using `useTranslation`
  - All appointment pages are using `useTranslation`
  - All patient pages are using `useTranslation`
  - All medication, prescription, and billing pages are using `useTranslation`
  - All clinic and report pages are using `useTranslation`
  - All public pages (Home, About, Services, Contact, Privacy, Terms, NotFound) are using `useTranslation`
  - _Requirements: 3.4, 7.1_

- [x] 3. Fix hardcoded placeholders in auth pages





  - Replace hardcoded placeholder `"you@example.com"` in `src/pages/auth/ForgotPassword.tsx` with translation key
  - Add translation key `forgotPassword.emailPlaceholder` to both English and Arabic translation files
  - _Requirements: 3.1, 3.2, 3.4_

- [x] 4. Add missing translation keys for PatientSettings page







  - Add complete `patientSettings` section to `public/locales/en/en.json` with all required keys
  - Add complete `patientSettings` section to `public/locales/ar/ar.json` with Arabic translations
  - Include keys for: personal info labels, address placeholders, emergency contact, medical history, allergies, conditions, notifications
  - _Requirements: 3.1, 3.2, 6.1, 6.2, 6.3_

- [x] 5. Fix hardcoded placeholders in PatientSettings page





  - Replace hardcoded placeholder `"+20 123 456 7890"` for phone fields with translation key
  - Replace hardcoded placeholder `"123 Main Street"` for street with translation key
  - Replace hardcoded placeholder `"Cairo"` for city with translation key
  - Replace hardcoded placeholder `"12345"` for zip code with translation key
  - Replace hardcoded placeholder `"Egypt"` for country with translation key
  - Replace hardcoded placeholder `"Full Name"` for emergency contact name with translation key
  - Replace hardcoded placeholder `"Add new allergy"` with translation key
  - Replace hardcoded placeholder `"Add medical condition"` with translation key
  - Replace hardcoded placeholder `"Any additional medical information..."` with translation key
  - _Requirements: 3.1, 3.2, 3.4_

- [x] 6. Fix hardcoded button text in PatientMedicalHistory component





  - Replace hardcoded button text `"Add"` with translation key in `src/components/patient/PatientMedicalHistory.tsx`
  - Replace hardcoded button text `"Cancel"` with translation key
  - Add translation keys to both English and Arabic translation files
  - _Requirements: 3.1, 3.2, 3.4, 7.1_

- [x] 7. Audit and fix remaining components for hardcoded strings





  - Systematically check all components in `src/components/` directories
  - Focus on: appointment, billing, clinic, medications, prescriptions, and common components
  - Replace any hardcoded strings with translation keys
  - Add missing translation keys to both language files
  - _Requirements: 2.2, 3.1, 3.2, 3.4, 7.1_
-

- [x] 8. Verify translation key consistency across language files




  - Compare English and Arabic translation file structures
  - Ensure all keys in English file exist in Arabic file
  - Ensure all keys in Arabic file exist in English file
  - Fix any missing or mismatched keys
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 6.1, 6.2_

-

- [x] 9. Test language switching functionality



  - Test switching from English to Arabic in browser
  - Verify all pages display correctly in Arabic with RTL layout
  - Test switching from Arabic to English
  - Verify language preference persists after page refresh
  - Check that no English text appears when Arabic is selected
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 10. Create automated translation coverage test





  - Write script to compare translation key usage in components vs available keys
  - Identify any missing translation keys
  - Generate report of translation coverage
  - _Requirements: 6.4