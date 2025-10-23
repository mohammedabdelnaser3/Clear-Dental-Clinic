# Dentist Pages Translation Test Guide

## Overview
This document provides a guide for testing the internationalization (i18n) implementation for the DentistProfile and DentistSettings pages.

## Translation Keys Added

### English (public/locales/en/en.json)
- `dentistProfile.*` - All DentistProfile component translations
- `dentistSettings.*` - All DentistSettings component translations

### Arabic (public/locales/ar/ar.json)
- `dentistProfile.*` - All DentistProfile component translations (Arabic)
- `dentistSettings.*` - All DentistSettings component translations (Arabic)

## Test Scenarios

### 1. DentistProfile Page Translation Test

#### Test Steps:
1. Log in as a dentist user
2. Navigate to `/profile`
3. Verify the following elements are displayed in English:
   - Page title: "Professional Profile"
   - Subtitle: "Manage your professional information and appointments"
   - "Edit Profile" button
   - Tab labels: "Overview", "Appointments", "Clinics", "Availability"
   - Section headers: "Professional Information", "Upcoming Appointments", "Clinic Affiliations"
   - Quick Actions: "Edit Profile", "Manage Schedule", "View Appointments", "Settings"

4. Switch language to Arabic using the language selector
5. Verify all text elements are now displayed in Arabic:
   - Page title: "الملف المهني"
   - Subtitle: "إدارة معلوماتك المهنية ومواعيدك"
   - "تعديل الملف الشخصي" button
   - Tab labels: "نظرة عامة", "المواعيد", "العيادات", "التوفر"
   - Section headers: "المعلومات المهنية", "المواعيد القادمة", "الانتماءات للعيادات"

6. Switch back to English and verify text reverts correctly

### 2. DentistSettings Page Translation Test

#### Test Steps:
1. Log in as a dentist user
2. Navigate to `/settings`
3. Verify the following elements are displayed in English:
   - Page title: "Dentist Settings"
   - Subtitle: "Manage your professional profile and preferences"
   - Section tabs: "Personal Information", "Professional Information", "Clinic Associations", "Availability", "Security", "Preferences"
   - Form labels and placeholders
   - Action buttons: "Save Changes", "Cancel", "Add", "Remove"

4. Switch language to Arabic
5. Verify all text elements are now displayed in Arabic:
   - Page title: "إعدادات طبيب الأسنان"
   - Subtitle: "إدارة ملفك المهني وتفضيلاتك"
   - Section tabs: "المعلومات الشخصية", "المعلومات المهنية", "ارتباطات العيادات", "التوفر", "الأمان", "التفضيلات"
   - Form labels and placeholders in Arabic
   - Action buttons: "حفظ التغييرات", "إلغاء", "إضافة", "إزالة"

6. Test each section tab and verify all content is translated

### 3. Form Validation Messages Test

#### Test Steps:
1. On DentistSettings page, try to submit the form with empty required fields
2. Verify validation error messages appear in the current language
3. Switch language and verify error messages update accordingly

### 4. Toast Notifications Test

#### Test Steps:
1. Update profile information and save
2. Verify success toast message appears in the current language
3. Try uploading an invalid file (too large or wrong type)
4. Verify error toast message appears in the current language
5. Switch language and repeat steps 1-4 to verify messages in both languages

### 5. Responsive Design with RTL Support

#### Test Steps (Arabic Language):
1. Switch to Arabic language
2. Verify text direction changes to RTL (right-to-left)
3. Verify layout adapts correctly:
   - Text alignment is right-aligned
   - Icons and buttons are mirrored appropriately
   - Forms maintain proper layout
4. Test on mobile, tablet, and desktop viewports

## Translation Coverage Checklist

### DentistProfile Component
- [x] Page title and subtitle
- [x] Edit profile button
- [x] Tab navigation labels
- [x] Professional information section
- [x] Upcoming appointments section
- [x] Clinic affiliations section
- [x] Quick actions sidebar
- [x] Appointment statistics
- [x] Appointment status badges
- [x] Loading and error messages
- [x] Empty state messages

### DentistSettings Component
- [x] Page title and subtitle
- [x] Section navigation tabs
- [x] Personal information form labels
- [x] Professional information form labels
- [x] Clinic associations section
- [x] Availability schedule section
- [x] Security section (password change)
- [x] Preferences section
- [x] Form validation messages
- [x] Success/error toast messages
- [x] Action buttons (Save, Cancel, Add, Remove)
- [x] Profile completion indicator
- [x] File upload messages

## Known Translation Keys

### Common Keys Used
```typescript
// DentistProfile
t('dentistProfile.title')
t('dentistProfile.subtitle')
t('dentistProfile.editProfile')
t('dentistProfile.tabs.overview')
t('dentistProfile.tabs.appointments')
t('dentistProfile.tabs.clinics')
t('dentistProfile.tabs.availability')

// DentistSettings
t('dentistSettings.title')
t('dentistSettings.subtitle')
t('dentistSettings.sections.personal')
t('dentistSettings.sections.professional')
t('dentistSettings.actions.save')
t('dentistSettings.messages.profileUpdated')
```

## Testing Tools

### Manual Testing
1. Use browser language selector or in-app language switcher
2. Test on different devices and screen sizes
3. Verify RTL layout for Arabic

### Automated Testing (Future)
- Unit tests for translation key existence
- Integration tests for language switching
- Visual regression tests for RTL layout

## Issues to Watch For

1. **Missing Translation Keys**: If a key is not found, the key itself will be displayed (e.g., "dentistProfile.title")
2. **Hardcoded Text**: Any text not using `t()` function will not be translated
3. **RTL Layout Issues**: Some CSS may need adjustment for proper RTL display
4. **Date/Time Formatting**: Ensure dates and times are formatted according to locale
5. **Number Formatting**: Verify numbers are formatted correctly for each locale

## Success Criteria

✅ All visible text on DentistProfile page is translatable
✅ All visible text on DentistSettings page is translatable
✅ Language switching works smoothly without page reload
✅ RTL layout works correctly for Arabic
✅ Form validation messages are translated
✅ Toast notifications are translated
✅ No translation keys are displayed to users
✅ Responsive design works in both languages

## Next Steps

1. Update DentistProfile.tsx to use translation keys (if not already done)
2. Update DentistSettings.tsx to use translation keys (if not already done)
3. Test all scenarios listed above
4. Fix any issues found during testing
5. Document any additional translation keys needed
6. Consider adding more languages in the future

## Notes

- Translation files are located in `public/locales/{lang}/{lang}.json`
- The i18n configuration is in `src/i18n/index.ts`
- Use the `useTranslation` hook from `react-i18next` in components
- Format: `const { t } = useTranslation(); t('key.path')`
