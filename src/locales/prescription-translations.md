# Prescription Components Translation Keys

This document contains all the translation keys used across prescription-related components in the Smart Clinic application.

## Main Prescriptions Page (`/src/pages/prescriptions/Prescriptions.tsx`)

### Header Section
- `prescriptions.header.title` - Main page title
- `prescriptions.header.subtitle` - Page subtitle for patients
- `prescriptions.header.systemOnline` - System status indicator
- `prescriptions.header.lastUpdated` - Last updated timestamp
- `prescriptions.header.refresh` - Refresh button text
- `prescriptions.header.refreshing` - Refreshing button text
- `prescriptions.header.filters` - Filters button text
- `prescriptions.header.newAppointment` - New appointment button text

### Statistics Cards
- `prescriptions.stats.totalPrescriptions` - Total prescriptions card title
- `prescriptions.stats.total` - Total label
- `prescriptions.stats.activePrescriptions` - Active prescriptions card title
- `prescriptions.stats.active` - Active label
- `prescriptions.stats.expiredPrescriptions` - Expired prescriptions card title
- `prescriptions.stats.expired` - Expired label
- `prescriptions.stats.pendingRefills` - Pending refills card title
- `prescriptions.stats.refills` - Refills label
- `prescriptions.stats.ofTotal` - "of total" text for percentages

### Search and Filter Section
- `prescriptions.searchAndFilter.title` - Search and filter section title
- `prescriptions.searchAndFilter.subtitle` - Search and filter section subtitle
- `prescriptions.searchAndFilter.advancedFilters` - Advanced filters button text
- `prescriptions.searchAndFilter.searchPlaceholder` - Search input placeholder
- `prescriptions.searchAndFilter.resultsCount` - Results count text
- `prescriptions.searchAndFilter.lastUpdated` - Last updated text

### Status Options
- `prescriptions.status.all` - All statuses option
- `prescriptions.status.active` - Active status
- `prescriptions.status.completed` - Completed status
- `prescriptions.status.expired` - Expired status
- `prescriptions.status.cancelled` - Cancelled status

### Sort Options
- `prescriptions.sort.newest` - Sort by newest first
- `prescriptions.sort.oldest` - Sort by oldest first
- `prescriptions.sort.byMedication` - Sort by medication name
- `prescriptions.sort.byDoctor` - Sort by doctor name

### Empty State
- `prescriptions.emptyState.noMatchingPrescriptions` - No matching prescriptions found
- `prescriptions.emptyState.noPrescriptions` - No prescriptions found
- `prescriptions.emptyState.adjustFilters` - Adjust filters message
- `prescriptions.emptyState.noPrescriptionsDescription` - No prescriptions description
- `prescriptions.emptyState.bookAppointment` - Book appointment button text

### Prescription Cards
- `prescriptions.card.prescribedBy` - Prescribed by text
- `prescriptions.card.clinic` - Clinic text
- `prescriptions.card.prescribedDate` - Prescribed date label
- `prescriptions.card.expiryDate` - Expiry date label
- `prescriptions.card.refills` - Refills label
- `prescriptions.card.refillsCount` - Refills count text
- `prescriptions.card.diagnosis` - Diagnosis label
- `prescriptions.card.moreMedications` - More medications text

### Actions
- `prescriptions.actions.view` - View button text
- `prescriptions.actions.print` - Print button text
- `prescriptions.actions.download` - Download button text

### Modal
- `prescriptions.modal.title` - Modal title
- `prescriptions.modal.prescriptionInfo` - Prescription info section title
- `prescriptions.modal.prescriptionId` - Prescription ID label
- `prescriptions.modal.status` - Status label
- `prescriptions.modal.prescribedDate` - Prescribed date label
- `prescriptions.modal.expiryDate` - Expiry date label
- `prescriptions.modal.prescribedBy` - Prescribed by label
- `prescriptions.modal.doctorName` - Doctor name text
- `prescriptions.modal.clinic` - Clinic label
- `prescriptions.modal.diagnosis` - Diagnosis section title
- `prescriptions.modal.medications` - Medications section title
- `prescriptions.modal.dosage` - Dosage label
- `prescriptions.modal.frequency` - Frequency label
- `prescriptions.modal.duration` - Duration label
- `prescriptions.modal.category` - Category label
- `prescriptions.modal.instructions` - Instructions label
- `prescriptions.modal.refillInformation` - Refill information section title
- `prescriptions.modal.maxRefills` - Max refills label
- `prescriptions.modal.currentRefills` - Current refills label
- `prescriptions.modal.refillsRemaining` - Refills remaining label
- `prescriptions.modal.notes` - Notes section title
- `prescriptions.modal.print` - Print button text
- `prescriptions.modal.download` - Download button text
- `prescriptions.modal.close` - Close button text

### Print Function
- `prescriptions.print.title` - Print document title
- `prescriptions.print.patientInfo` - Patient info section title
- `prescriptions.print.patient` - Patient label
- `prescriptions.print.prescribedBy` - Prescribed by label
- `prescriptions.print.clinic` - Clinic label
- `prescriptions.print.prescribedDate` - Prescribed date label
- `prescriptions.print.expiryDate` - Expiry date label
- `prescriptions.print.diagnosis` - Diagnosis section title
- `prescriptions.print.medications` - Medications section title
- `prescriptions.print.dosage` - Dosage label
- `prescriptions.print.frequency` - Frequency label
- `prescriptions.print.duration` - Duration label
- `prescriptions.print.instructions` - Instructions label
- `prescriptions.print.notes` - Notes section title
- `prescriptions.print.disclaimer` - Print disclaimer
- `prescriptions.print.printDate` - Print date label

### Errors
- `prescriptions.errors.loading` - Loading error message

## Prescription Form Component (`/src/components/prescriptions/PrescriptionForm.tsx`)

### Validation Messages
- `prescriptionForm.validation.patientRequired` - Patient required validation
- `prescriptionForm.validation.medicationRequired` - Medication required validation
- `prescriptionForm.validation.dosageRequired` - Dosage required validation
- `prescriptionForm.validation.frequencyRequired` - Frequency required validation
- `prescriptionForm.validation.durationRequired` - Duration required validation
- `prescriptionForm.validation.atLeastOneMedication` - At least one medication required
- `prescriptionForm.validation.diagnosisRequired` - Diagnosis required validation
- `prescriptionForm.validation.expiryDateRequired` - Expiry date required validation
- `prescriptionForm.validation.maxRefillsExceeded` - Max refills exceeded validation

### Messages
- `prescriptionForm.messages.successUpdate` - Success update message
- `prescriptionForm.messages.successCreate` - Success create message
- `prescriptionForm.messages.errorSave` - Error save message

### Appointment
- `prescriptionForm.appointment.noSpecificAppointment` - No specific appointment option

### Form Fields
- `prescriptionForm.fields.patient` - Patient field label
- `prescriptionForm.fields.relatedAppointment` - Related appointment field label
- `prescriptionForm.fields.diagnosis` - Diagnosis field label
- `prescriptionForm.fields.medications` - Medications field label
- `prescriptionForm.fields.medication` - Medication field label
- `prescriptionForm.fields.dosage` - Dosage field label
- `prescriptionForm.fields.frequency` - Frequency field label
- `prescriptionForm.fields.duration` - Duration field label
- `prescriptionForm.fields.instructions` - Instructions field label
- `prescriptionForm.fields.expiryDate` - Expiry date field label
- `prescriptionForm.fields.maxRefills` - Max refills field label
- `prescriptionForm.fields.additionalNotes` - Additional notes field label

### Placeholders
- `prescriptionForm.placeholders.diagnosis` - Diagnosis input placeholder
- `prescriptionForm.placeholders.medicationName` - Medication name input placeholder
- `prescriptionForm.placeholders.dosage` - Dosage input placeholder
- `prescriptionForm.placeholders.frequency` - Frequency input placeholder
- `prescriptionForm.placeholders.duration` - Duration input placeholder
- `prescriptionForm.placeholders.instructions` - Instructions input placeholder
- `prescriptionForm.placeholders.notes` - Notes input placeholder

### Actions
- `prescriptionForm.actions.addMedication` - Add medication button text
- `prescriptionForm.actions.selectMedication` - Select medication button text
- `prescriptionForm.actions.cancel` - Cancel button text
- `prescriptionForm.actions.create` - Create button text
- `prescriptionForm.actions.update` - Update button text

## Prescription Details Component (`/src/components/prescriptions/PrescriptionDetails.tsx`)

### Toasts
- `prescriptionDetails.toasts.refillSuccess` - Refill success message
- `prescriptionDetails.toasts.refillError` - Refill error message

### Status
- `prescriptionDetails.status.active` - Active status
- `prescriptionDetails.status.completed` - Completed status
- `prescriptionDetails.status.cancelled` - Cancelled status
- `prescriptionDetails.expired` - Expired status

### Actions
- `prescriptionDetails.addRefill` - Add refill button text

### Patient Info
- `prescriptionDetails.patientInfo` - Patient info section title
- `prescriptionDetails.name` - Name label
- `prescriptionDetails.email` - Email label

### Prescription Info
- `prescriptionDetails.prescriptionInfo` - Prescription info section title
- `prescriptionDetails.diagnosis` - Diagnosis label
- `prescriptionDetails.notes` - Notes label
- `prescriptionDetails.issuedDate` - Issued date label
- `prescriptionDetails.expiryDate` - Expiry date label
- `prescriptionDetails.maxRefills` - Max refills label

### Medications
- `prescriptionDetails.medications` - Medications section title
- `prescriptionDetails.dosage` - Dosage label
- `prescriptionDetails.frequency` - Frequency label
- `prescriptionDetails.duration` - Duration label
- `prescriptionDetails.instructions` - Instructions label

### Refills
- `prescriptionDetails.noRefills` - No refills message

### Provider Info
- `prescriptionDetails.providerInfo` - Provider info section title
- `prescriptionDetails.prescribingDentist` - Prescribing dentist label
- `prescriptionDetails.dentistPrefix` - Dentist prefix
- `prescriptionDetails.clinic` - Clinic label
- `prescriptionDetails.relatedAppointment` - Related appointment label

### Actions
- `prescriptionDetails.close` - Close button text

### Modal
- `prescriptionDetails.modal.title` - Modal title
- `prescriptionDetails.modal.notesLabel` - Notes label
- `prescriptionDetails.modal.notesPlaceholder` - Notes placeholder
- `prescriptionDetails.modal.cancel` - Cancel button text
- `prescriptionDetails.modal.submit` - Submit button text

## Prescription List Component (`/src/components/prescriptions/PrescriptionList.tsx`)

### Filters
- `prescriptionList.filters.allStatus` - All status filter
- `prescriptionList.filters.active` - Active status filter
- `prescriptionList.filters.completed` - Completed status filter
- `prescriptionList.filters.cancelled` - Cancelled status filter

### Messages
- `prescriptionList.messages.fetchError` - Fetch error message
- `prescriptionList.messages.deleteConfirmation` - Delete confirmation message
- `prescriptionList.messages.deleteSuccess` - Delete success message
- `prescriptionList.messages.deleteError` - Delete error message

### Header
- `prescriptionList.header.patientPrescriptions` - Patient prescriptions title
- `prescriptionList.header.title` - Main title

### Actions
- `prescriptionList.actions.newPrescription` - New prescription button text

### Search
- `prescriptionList.search.placeholder` - Search placeholder

### Status
- `prescriptionList.status.active` - Active status
- `prescriptionList.status.completed` - Completed status
- `prescriptionList.status.cancelled` - Cancelled status
- `prescriptionList.status.expired` - Expired status

### Card
- `prescriptionList.card.prescriptionNumber` - Prescription number text
- `prescriptionList.card.diagnosis` - Diagnosis label
- `prescriptionList.card.medications` - Medications label
- `prescriptionList.card.doctor` - Doctor text
- `prescriptionList.card.refills` - Refills text
- `prescriptionList.card.expires` - Expires text

### Empty State
- `prescriptionList.emptyState.noPrescriptionsFound` - No prescriptions found
- `prescriptionList.emptyState.noPatientPrescriptions` - No patient prescriptions
- `prescriptionList.emptyState.noFilteredPrescriptions` - No filtered prescriptions
- `prescriptionList.emptyState.createFirstPrescription` - Create first prescription button

### Pagination
- `prescriptionList.pagination.previous` - Previous button text
- `prescriptionList.pagination.next` - Next button text
- `prescriptionList.pagination.pageOf` - Page of text

### Modal
- `prescriptionList.modal.editPrescription` - Edit prescription modal title
- `prescriptionList.modal.newPrescription` - New prescription modal title
- `prescriptionList.modal.prescriptionDetails` - Prescription details modal title

## Medication Safety Modal Component (`/src/components/prescriptions/MedicationSafetyModal.tsx`)

### Status
- `medicationSafetyModal.status.noCriticalIssues` - No critical issues found
- `medicationSafetyModal.status.criticalIssuesDetected` - Critical issues detected
- `medicationSafetyModal.status.reviewWarnings` - Review warnings message
- `medicationSafetyModal.status.resolveErrors` - Resolve errors message

### Actions
- `medicationSafetyModal.actions.proceed` - Proceed button text
- `medicationSafetyModal.actions.cannotProceed` - Cannot proceed button text

## Common Translation Keys

### Common Actions
- `common.refresh` - Refresh button text
- `common.separator` - Separator text (e.g., "•")

## Usage Notes

1. All translation keys follow a hierarchical structure using dots (.) as separators
2. Keys are organized by component and functionality
3. Dynamic values are passed as parameters to translation functions
4. All user-facing text should use these translation keys instead of hardcoded strings
5. When adding new features, follow the existing naming conventions

## Implementation

To use these translation keys in your components:

```typescript
import { useTranslation } from 'react-i18next';

const MyComponent = () => {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('prescriptions.header.title')}</h1>
      <p>{t('prescriptions.header.subtitle')}</p>
    </div>
  );
};
```

For dynamic values:

```typescript
<p>{t('prescriptions.card.refillsCount', { current: 2, max: 5 })}</p>
```
