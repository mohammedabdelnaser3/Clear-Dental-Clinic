const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, 'src/i18n/locales/en.json');
const arPath = path.join(__dirname, 'src/i18n/locales/ar.json');

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const ar = JSON.parse(fs.readFileSync(arPath, 'utf8'));

// Missing keys to add to Arabic
const missingInAr = {
  auth: {
    ...ar.auth,
    logout: "تسجيل الخروج"
  },
  dashboard: {
    ...ar.dashboard,
    appointments: "المواعيد",
    today: "اليوم",
    tomorrow: "غداً"
  },
  appointmentForm: {
    ...ar.appointmentForm,
    emergency: "طوارئ",
    emergencyDescription: "هذا موعد طارئ يتطلب اهتمامًا فوريًا",
    emergencyWarning: "سيتم إعطاء الأولوية للمواعيد الطارئة",
    reviewAndConfirm: "مراجعة وتأكيد",
    selectedService: "الخدمة المختارة",
    selectedDate: "التاريخ المختار",
    selectedTime: "الوقت المختار",
    estimatedDuration: "المدة المقدرة",
    patientDetails: "تفاصيل المريض",
    additionalNotes: "ملاحظات إضافية",
    noNotesProvided: "لم يتم تقديم ملاحظات",
    confirmAppointment: "تأكيد الموعد",
    editDetails: "تعديل التفاصيل",
    morningSlots: "فترات الصباح",
    afternoonSlots: "فترات الظهيرة",
    eveningSlots: "فترات المساء",
    selectPatient: "اختر المريض",
    selectService: "اختر الخدمة",
    selectDateTime: "اختر التاريخ والوقت",
    morning: "صباحاً",
    afternoon: "ظهراً",
    evening: "مساءً"
  },
  privacy: {
    ...ar.privacy,
    contact: {
      ...ar.privacy?.contact,
      intro: "إذا كانت لديك أي أسئلة حول سياسة الخصوصية هذه، يرجى الاتصال بنا على:",
      p1: "إذا كانت لديك أي أسئلة حول سياسة الخصوصية هذه، يرجى الاتصال بنا على:"
    }
  },
  contact: {
    ...ar.contact,
    info: {
      ...ar.contact?.info,
      contactDetails: {
        ...ar.contact?.info?.contactDetails,
        emailValue: "info@healthcareapp.com",
        phoneValue: "+1 (555) 123-4567",
        supportValue: "support@healthcareapp.com"
      },
      businessHours: {
        ...ar.contact?.info?.businessHours,
        weekdaysValue: "9:00 صباحًا - 6:00 مساءً (توقيت المحيط الهادئ)"
      }
    }
  }
};

// Missing keys to add to English
const missingInEn = {
  auth: {
    ...en.auth,
    signOut: "Sign Out"
  },
  dashboard: {
    ...en.dashboard,
    Billing: "Billing",
    Appointments: "Appointments",
    Prescriptions: "Prescriptions",
    Reports: "Reports",
    viewDetails: "View Details",
    viewAllActivity: "View All Activity"
  },
  appointmentForm: {
    ...en.appointmentForm,
    emergency: {
      label: "This is an emergency appointment",
      description: "Check this option if the patient needs immediate attention",
      alert: "Emergency appointments will be prioritized and may result in rescheduling other appointments"
    },
    review: {
      title: "Review Appointment Details",
      description: "Please review the information below before confirming the appointment",
      patientDetails: "Patient Details",
      serviceDetails: "Service Details",
      dateTimeDetails: "Date & Time",
      additionalDetails: "Additional Details",
      emergencyStatus: "Emergency Status",
      yes: "Yes",
      no: "No",
      confirm: "Confirm Appointment"
    },
    timeSlotCategories: {
      morning: "Morning",
      afternoon: "Afternoon",
      evening: "Evening",
      peak: "Peak Time",
      available: "Available",
      unavailable: "Unavailable"
    },
    validation: {
      selectPatient: "Please select a patient to proceed",
      selectService: "Please select a service to proceed",
      selectDateTime: "Please select a date and time to proceed",
      reviewDetails: "Please review all details before confirming"
    }
  },
  patient_detail: {
    ...en.patient_detail,
    years_zero: "{{count}} years",
    years_two: "{{count}} years",
    years_few: "{{count}} years",
    years_many: "{{count}} years"
  },
  privacy: {
    ...en.privacy,
    contact: {
      ...en.privacy?.contact,
      p1: "If you have any questions about this Privacy Policy, please contact us at:"
    }
  }
};

// Merge the missing keys
const updatedEn = { ...en, ...missingInEn };
const updatedAr = { ...ar, ...missingInAr };

// Write back to files
fs.writeFileSync(enPath, JSON.stringify(updatedEn, null, 2), 'utf8');
fs.writeFileSync(arPath, JSON.stringify(updatedAr, null, 2), 'utf8');

console.log('✅ Translation files have been updated successfully!');
console.log('');
console.log('Added to English:');
console.log('  - auth.signOut');
console.log('  - dashboard: Billing, Appointments, Prescriptions, Reports, viewDetails, viewAllActivity');
console.log('  - appointmentForm: emergency, review, timeSlotCategories, validation');
console.log('  - patient_detail: years_zero, years_two, years_few, years_many');
console.log('  - privacy.contact.p1');
console.log('');
console.log('Added to Arabic:');
console.log('  - auth.logout');
console.log('  - dashboard: appointments, today, tomorrow');
console.log('  - appointmentForm: emergency, reviewAndConfirm, selectedService, etc.');
console.log('  - privacy.contact: intro, p1');
console.log('  - contact.info: contactDetails, businessHours');

