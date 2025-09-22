import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks';
import { Spinner } from '../ui';
import { memo, useMemo } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string;
}

const ProtectedRoute = memo<ProtectedRouteProps>(({ children, requiredRole }) => {
  const location = useLocation();
  const { user, loading, isInitialized } = useAuth();
  
  // Memoize authentication status to prevent unnecessary re-calculations
  const authStatus = useMemo(() => {
    const isAuthenticated = !!user;
    const hasRequiredRole = !requiredRole || user?.role === requiredRole || user?.role === 'admin';
    
    // Only log in development mode and for important state changes
    if (process.env.NODE_ENV === 'development') {
      console.log('🛡️ ProtectedRoute auth status:', {
        path: location.pathname,
        isInitialized,
        loading,
        isAuthenticated,
        hasRequiredRole,
        userRole: user?.role,
        requiredRole
      });
    }
    
    return { isAuthenticated, hasRequiredRole };
  }, [user, requiredRole, location.pathname, isInitialized, loading]);

  // Show loading spinner while checking authentication or during initialization
  if (!isInitialized || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" label="Loading..." />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!authStatus.isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check for required role if specified
  if (!authStatus.hasRequiredRole) {
    return <Navigate to="/dashboard" replace />;
  }

  // Render children if authenticated and authorized
  return <>{children}</>;
});

// Set display name for better debugging
ProtectedRoute.displayName = 'ProtectedRoute';

export default ProtectedRoute;