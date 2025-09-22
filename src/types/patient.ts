export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: Date;
  gender: 'male' | 'female' | 'other';
  address: Address;
  medicalHistory: MedicalHistory;
  treatmentRecords: TreatmentRecord[];
  preferredClinicId: string;
  userId?: string; // Link to user account
  isActive?: boolean;
  emergencyContact?: EmergencyContact;
  createdAt: Date;
  updatedAt: Date;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface EmergencyContact {
  name: string;
  phone: string;
  relationship: string;
}

export interface MedicalHistory {
  allergies: string[];
  medications: string[];
  conditions: string[];
  notes: string;
}

export interface TreatmentRecord {
  id: string;
  date: Date;
  dentistId: string;
  clinicId: string;
  procedure: string;
  diagnosis: string;
  notes: string;
  attachments: Attachment[];
}

export interface Attachment {
  id: string;
  fileName: string;
  fileType: string;
  fileUrl: string;
  uploadedAt: Date;
}

export interface PatientReport {
  id: string;
  patientId: string;
  dentistId: string;
  clinicId: string;
  title: string;
  description: string;
  date: Date;
  attachments: Attachment[];
  isShared: boolean;
  createdAt: Date;
  updatedAt: Date;
}