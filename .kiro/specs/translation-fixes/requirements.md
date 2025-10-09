# Requirements Document

## Introduction

The DentalPro Manager application currently has several translation-related issues that prevent proper internationalization (i18n) support. The application supports English and Arabic languages, but there are inconsistencies in the translation setup, missing translations for hardcoded strings, and duplicate translation file locations causing confusion.

This feature aims to consolidate translation files, fix missing translations, ensure consistent translation key naming, verify i18n configuration, add missing translation entries, fix component translation usage, and test language switching functionality. The goal is to provide a fully localized experience for users in both English and Arabic languages.

## Requirements

### Requirement 1: Consolidate Translation Files

**User Story:** As a developer, I want a single source of truth for translation files, so that I can easily maintain and update translations without confusion.

#### Acceptance Criteria

1. WHEN the application loads THEN the system SHALL use translation files from a single, consistent location (`public/locales/`)
2. IF translation files exist in multiple locations THEN the system SHALL consolidate them into `public/locales/` and remove duplicates
3. WHEN translations are updated THEN developers SHALL only need to update files in one location
4. GIVEN the consolidated translation files WHEN the application runs THEN all translations SHALL load correctly without errors

### Requirement 2: Audit All Pages for Missing Translations

**User Story:** As a developer, I want to audit all pages and components in the application, so that I can identify and fix all missing translations systematically.

#### Acceptance Criteria

1. WHEN conducting the audit THEN the system SHALL check all pages in the `src/pages/` directory for hardcoded strings
2. WHEN conducting the audit THEN the system SHALL check all components in the `src/components/` directory for hardcoded strings
3. IF hardcoded strings are found THEN they SHALL be documented with their location and context
4. GIVEN the audit results WHEN reviewed THEN a comprehensive list of all missing translations SHALL be available
5. WHEN the audit is complete THEN all identified pages SHALL include: auth pages, dashboard pages, appointment pages, patient pages, billing pages, medication pages, prescription pages, clinic pages, and settings pages

### Requirement 3: Fix Missing Translations

**User Story:** As a user, I want all user-facing text to be properly translated, so that I can use the application in my preferred language without seeing English text mixed in.

#### Acceptance Criteria

1. WHEN a user switches to Arabic THEN all visible text SHALL be displayed in Arabic without any English fallbacks
2. IF hardcoded English strings exist in components THEN they SHALL be replaced with translation keys using the `t()` function
3. WHEN new features are added THEN all user-facing strings SHALL use translation keys from the i18n system
4. GIVEN a component with user-facing text WHEN rendered THEN it SHALL use the `useTranslation` hook and `t()` function for all displayable strings including labels, buttons, placeholders, error messages, tooltips, and notifications
5. WHEN all pages are checked THEN every page SHALL have complete translation coverage including: page titles, form labels, button text, validation messages, success/error messages, table headers, modal content, and navigation items

### Requirement 4: Ensure Translation Key Consistency

**User Story:** As a developer, I want consistent translation key naming conventions, so that I can easily find and use the correct translation keys.

#### Acceptance Criteria

1. WHEN translation keys are created THEN they SHALL follow a hierarchical naming pattern (e.g., `page.section.element`)
2. IF duplicate translation keys exist THEN they SHALL be consolidated
3. WHEN components use translations THEN they SHALL use the correct namespace and key path
4. GIVEN translation files WHEN reviewed THEN all keys SHALL be properly nested and organized

### Requirement 5: Verify i18n Configuration

**User Story:** As a developer, I want the i18n configuration to be properly set up, so that language switching works correctly and translations load efficiently.

#### Acceptance Criteria

1. WHEN the application initializes THEN i18n SHALL be configured with the correct resource paths
2. IF the user changes language THEN the application SHALL immediately reflect the change
3. WHEN translations are missing THEN the system SHALL fall back to English gracefully
4. GIVEN the i18n configuration WHEN the app loads THEN it SHALL detect the user's preferred language correctly

### Requirement 6: Add Missing Translation Entries

**User Story:** As a content manager, I want complete translation coverage for both English and Arabic, so that users have a fully localized experience.

#### Acceptance Criteria

1. WHEN comparing English and Arabic translation files THEN they SHALL have matching key structures
2. IF a translation key exists in English THEN it SHALL also exist in Arabic
3. WHEN new translation keys are added THEN they SHALL be added to both language files
4. GIVEN the translation files WHEN audited THEN no missing translations SHALL be found

### Requirement 7: Fix Component Translation Usage

**User Story:** As a developer, I want all components to properly use the translation system, so that the application is fully internationalized.

#### Acceptance Criteria

1. WHEN a component renders text THEN it SHALL use `useTranslation` hook and `t()` function
2. IF placeholder text exists THEN it SHALL be translated
3. WHEN error messages are displayed THEN they SHALL be translated
4. GIVEN any user-facing component WHEN inspected THEN no hardcoded strings SHALL be found

### Requirement 8: Test Language Switching

**User Story:** As a user, I want to be able to switch between English and Arabic seamlessly, so that I can use the application in my preferred language.

#### Acceptance Criteria

1. WHEN the user clicks the language switcher THEN the entire application SHALL update to the selected language immediately without page reload
2. IF the user refreshes the page THEN their language preference SHALL persist using localStorage
3. WHEN switching to Arabic THEN the layout SHALL switch to RTL (right-to-left) direction and all text SHALL be displayed in Arabic
4. WHEN switching to English THEN the layout SHALL switch to LTR (left-to-right) direction and all text SHALL be displayed in English
5. GIVEN a language preference WHEN the user returns to the app THEN it SHALL remember their choice and load with the correct language
