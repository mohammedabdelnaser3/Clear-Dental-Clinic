import { useState, useEffect, useCallback, useContext } from 'react';
import type { ReactNode } from 'react';
import type { Clinic } from '../types';
import { getClinic } from '../services/clinicService';
import { useAuth } from '../hooks/useAuth';
import { ClinicContext } from './ClinicContextDefinition';

interface ClinicProviderProps {
  children: ReactNode;
}

export const ClinicProvider = ({ children }: ClinicProviderProps) => {
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchClinic = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getClinic();
      
      if (response.success && response.data) {
        setClinic(response.data);
      } else {
        setError(response.message || 'Failed to fetch clinic');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch clinic';
      setError(errorMessage);
      console.error('Error fetching clinic:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchClinic();
    }
  }, [user, fetchClinic]);

  const refreshClinic = async () => {
    await fetchClinic();
  };

  const value = {
    clinic,
    selectedClinic: clinic, // Keep selectedClinic for backward compatibility
    clinics: clinic ? [clinic] : [], // Keep clinics array for backward compatibility
    loading,
    error,
    setSelectedClinicById: () => {}, // No-op since we only have one clinic
    refreshClinics: refreshClinic, // Keep refreshClinics for backward compatibility
    refreshClinic,
    updateClinic: async () => {
      throw new Error('Clinic updates are not supported in single clinic mode');
    },
  };

  return <ClinicContext.Provider value={value}>{children}</ClinicContext.Provider>;
};

// Custom hook to use clinic context
export const useClinic = () => {
  const context = useContext(ClinicContext);
  if (context === undefined) {
    throw new Error('useClinic must be used within a ClinicProvider');
  }
  return context;
};