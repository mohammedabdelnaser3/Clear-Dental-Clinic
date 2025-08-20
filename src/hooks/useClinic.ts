import { useContext } from 'react';
import { ClinicContext } from '../context/ClinicContextDefinition';

export const useClinic = () => {
  const context = useContext(ClinicContext);
  if (context === undefined) {
    throw new Error('useClinic must be used within a ClinicProvider');
  }
  return context;
};