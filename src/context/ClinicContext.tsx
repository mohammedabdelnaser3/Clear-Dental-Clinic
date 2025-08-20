import { useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { Clinic } from '../types';
import { getClinics, updateClinic as updateClinicService } from '../services/clinicService';
import { useAuth } from '../hooks/useAuth';
import { ClinicContext } from './ClinicContextDefinition';

interface ClinicProviderProps {
  children: ReactNode;
}

export const ClinicProvider = ({ children }: ClinicProviderProps) => {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchClinics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getClinics();
      
      if (response.success && response.data) {
        const clinicsData = response.data;
        setClinics(clinicsData);

        // Set default selected clinic
        if (clinicsData.length > 0) {
          // If user has a preferred clinic, select it
          if (user?.preferredClinicId) {
            const preferredClinic = clinicsData.find(clinic => clinic.id === user.preferredClinicId);
            if (preferredClinic) {
              setSelectedClinic(preferredClinic);
            } else {
              setSelectedClinic(clinicsData[0]);
            }
          } else {
            // Otherwise select the first clinic
            setSelectedClinic(clinicsData[0]);
          }
        }
      } else {
        setError(response.message || 'Failed to fetch clinics');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch clinics';
      setError(errorMessage);
      console.error('Error fetching clinics:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchClinics();
    }
  }, [user, fetchClinics]);

  const setSelectedClinicById = (clinicId: string) => {
    const clinic = clinics.find(c => c.id === clinicId);
    if (clinic) {
      setSelectedClinic(clinic);
    }
  };

  const refreshClinics = async () => {
    await fetchClinics();
  };

  const updateClinic = async (id: string, clinicData: Partial<Clinic>) => {
    try {
      setLoading(true);
      setError(null);
      const response = await updateClinicService(id, clinicData);
      
      if (response.success && response.data) {
        const updatedClinic = response.data;
        
        // Update the clinic in the local state
        setClinics(prev => prev.map(clinic => 
          clinic.id === id ? updatedClinic : clinic
        ));
        
        // Update selected clinic if it's the one being updated
        if (selectedClinic?.id === id) {
          setSelectedClinic(updatedClinic);
        }
      } else {
        setError(response.message || 'Failed to update clinic');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update clinic';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
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