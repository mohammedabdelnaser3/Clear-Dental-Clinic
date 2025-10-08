export interface Clinic {
  id: string;
  name: string;
  branchName?: string; // NEW: Branch identifier (e.g., "Fayoum", "Atesa", "Minya")
  description?: string;
  address: ClinicAddress;
  phone: string;
  email: string;
  website?: string;
  emergencyContact?: string;
  operatingHours: OperatingHours[];
  services: string[];
  staff: string[]; // Array of staff IDs
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClinicAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface OperatingHours {
  day: Day;
  open: string; // Format: "HH:MM"
  close: string; // Format: "HH:MM"
  closed: boolean;
}

export type Day = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';