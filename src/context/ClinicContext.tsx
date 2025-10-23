/* eslint-disable react-refresh/only-export-components */
import { useState, useEffect, useCallback, useContext } from 'react';
import type { ReactNode } from 'react';
import type { Clinic } from '../types';
import { getAllClinics } from '../services/clinicService';
import { useAuth } from '../hooks/useAuth';
import { ClinicContext } from './ClinicContextDefinition';

interface ClinicProviderProps {
  children: ReactNode;
}

export const ClinicProvider = ({ children }: ClinicProviderProps) => {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null); // null => All Clinics
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchClinics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getAllClinics();
      if (response.success && response.data) {
        setClinics(response.data);
        // Preserve current selection if still present; otherwise default to All Clinics
        if (selectedClinic) {
          const exists = response.data.find(c => c.id === selectedClinic.id);
          if (!exists) setSelectedClinic(null);
        }
      } else {
        setClinics([]);
        setError(response.message || 'Failed to fetch clinics');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch clinics';
      setError(errorMessage);
      console.error('Error fetching clinics:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedClinic]);

  useEffect(() => {
    if (user) {
      fetchClinics();
    }
  }, [user, fetchClinics]);

  const refreshClinics = async () => {
    await fetchClinics();
  };

  const setSelectedClinicById = (clinicId: string) => {
    if (!clinicId) {
      // Empty string or falsy value => All Clinics
      setSelectedClinic(null);
      return;
    }
    const found = clinics.find(c => c.id === clinicId);
    setSelectedClinic(found || null);
  };

  const updateClinic = async () => {
    throw new Error('Clinic updates are not supported in this context');
  };

  const value = {
    clinics,
    selectedClinic,
    loading,
    error,
    setSelectedClinicById,
    refreshClinics,
    updateClinic,
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