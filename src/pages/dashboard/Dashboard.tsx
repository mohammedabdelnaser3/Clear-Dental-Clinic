import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import PatientDashboard from './PatientDashboard';
import ClinicDashboard from './ClinicDashboard';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  if (user?.role === 'patient') {
    return <PatientDashboard />;
  }

  return <ClinicDashboard />;
};

export default Dashboard;