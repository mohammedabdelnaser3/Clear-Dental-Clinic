import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks';
import { Spinner } from '../ui';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string;
}

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const location = useLocation();
  const { user, loading, isInitialized } = useAuth();
  const isAuthenticated = !!user;

  console.log('🛡️ ProtectedRoute check:', {
    path: location.pathname,
    isInitialized,
    loading,
    isAuthenticated,
    user: user ? { id: user.id, email: user.email, role: user.role } : null,
    requiredRole
  });

  // Show loading spinner while checking authentication or during initialization
  if (!isInitialized || loading) {
    console.log('⏳ ProtectedRoute: Showing loading spinner');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" label="Loading..." />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    console.log('🚫 ProtectedRoute: User not authenticated, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check for required role if specified
  if (requiredRole && user?.role !== requiredRole) {
    console.log('🚫 ProtectedRoute: User role mismatch, redirecting to dashboard');
    return <Navigate to="/dashboard" replace />;
  }

  console.log('✅ ProtectedRoute: Access granted, rendering children');
  // Render children if authenticated and authorized
  return <>{children}</>;
};

export default ProtectedRoute;