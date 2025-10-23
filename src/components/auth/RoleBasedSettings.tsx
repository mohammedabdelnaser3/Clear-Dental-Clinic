import React, { Suspense } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks';

// Lazy load role-specific components for code splitting
const DentistSettings = React.lazy(() => import('../../pages/dentist/DentistSettings'));
const PatientSettings = React.lazy(() => import('../../pages/patient/PatientSettings'));
const AdminSettings = React.lazy(() => import('../../pages/admin/AdminSettings'));

// Loading component for Suspense fallback
const SettingsLoadingFallback: React.FC = () => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
    <div className="text-center" role="status" aria-live="polite">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" aria-hidden="true"></div>
      <p className="text-gray-600">Loading settings...</p>
    </div>
  </div>
);

/**
 * RoleBasedSettings Component
 * 
 * Routes users to the appropriate settings page based on their role.
 * - Dentists are routed to DentistSettings
 * - Patients are routed to PatientSettings
 * - Unauthenticated users are redirected to login
 * 
 * Uses code splitting to lazy load role-specific components for better performance
 */
const RoleBasedSettings: React.FC = () => {
  const { user } = useAuth();

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Route based on user role with Suspense for lazy loading
  return (
    <Suspense fallback={<SettingsLoadingFallback />}>
      {user.role === 'dentist' ? (
        <DentistSettings />
      ) : user.role === 'admin' || user.role === 'super_admin' ? (
        <AdminSettings />
      ) : (
        <PatientSettings />
      )}
    </Suspense>
  );
};

export default RoleBasedSettings;
