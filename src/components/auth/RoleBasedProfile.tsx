import React, { Suspense } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks';

// Lazy load role-specific components for code splitting
const DentistProfile = React.lazy(() => import('../../pages/dentist/DentistProfile'));
const PatientProfile = React.lazy(() => import('../../pages/patient/PatientProfile'));
const AdminProfile = React.lazy(() => import('../../pages/admin/AdminProfile'));

// Loading component for Suspense fallback
const ProfileLoadingFallback: React.FC = () => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
    <div className="text-center" role="status" aria-live="polite">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" aria-hidden="true"></div>
      <p className="text-gray-600">Loading profile...</p>
    </div>
  </div>
);

/**
 * RoleBasedProfile Component
 * 
 * Routes users to the appropriate profile page based on their role.
 * - Dentists are routed to DentistProfile
 * - Patients are routed to PatientProfile
 * - Unauthenticated users are redirected to login
 * 
 * Uses code splitting to lazy load role-specific components for better performance
 */
const RoleBasedProfile: React.FC = () => {
  const { user } = useAuth();

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Route based on user role with Suspense for lazy loading
  return (
    <Suspense fallback={<ProfileLoadingFallback />}>
      {user.role === 'dentist' ? (
        <DentistProfile />
      ) : user.role === 'admin' || user.role === 'super_admin' ? (
        <AdminProfile />
      ) : (
        <PatientProfile />
      )}
    </Suspense>
  );
};

export default RoleBasedProfile;
