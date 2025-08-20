import { createContext } from 'react';
import type { Clinic } from '../types';

interface ClinicContextType {
  clinics: Clinic[];
  selectedClinic: Clinic | null;
  loading: boolean;
  error: string | null;
  setSelectedClinicById: (clinicId: string) => void;
  refreshClinics: () => Promise<void>;
  updateClinic: (id: string, clinicData: Partial<Clinic>) => Promise<void>;
}

export const ClinicContext = createContext<ClinicContextType | undefined>(undefined);
export type { ClinicContextType };