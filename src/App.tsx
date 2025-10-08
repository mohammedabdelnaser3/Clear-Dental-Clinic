import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppProvider } from './context';
import { useAuth } from './hooks'; // Import useAuth from AuthContext
import { Layout } from './components/layout';
import ErrorBoundary from './components/ErrorBoundary';
import { Toaster } from 'react-hot-toast';
import { setupConsoleErrorHandling } from './utils/consoleUtils';
import { useEffect } from 'react';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

// Main Pages
import Dashboard from './pages/dashboard/Dashboard';
import UnifiedAppointmentDashboard from './pages/dashboard/UnifiedAppointmentDashboard';
import Appointments from './pages/appointment/Appointments';
import AppointmentDetails from './pages/appointment/AppointmentDetail';
import CreateAppointment from './pages/appointment/AppointmentForm';
import Patients from './pages/patient/Patients';
import PatientDetails from './pages/patient/PatientDetail';
import CreatePatient from './pages/patient/PatientForm';
import Medications from './pages/medications/Medications';
import Prescriptions from './pages/prescriptions/Prescriptions';
import Billing from './pages/billing/Billing';
import Reports from './pages/reports/Reports';
import Clinics from './pages/clinics/Clinics';
import MultiClinicDashboard from './pages/MultiClinicDashboard';
import StaffScheduling from './components/StaffScheduling';
import Search from './pages/search/Search';

// Public Pages
import Home from './pages/Home';
import About from './pages/About';
import Services from './pages/Services';
import Contact from './pages/Contact';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import NotFound from './pages/NotFound';

// Prototype Pages
import { MultiBranchBookingPrototype } from './pages/prototype';

// Protected Route Component
import ProtectedRoute from './components/auth/ProtectedRoute';
import { PatientProfile, PatientSettings } from './pages/patient';



const AppContent = () => {
  const { user, loading, isInitialized } = useAuth();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';
  const isAuthenticated = !!user;

  // Only log in development mode and reduce frequency
  if (import.meta.env.DEV && Math.random() < 0.1) {
    console.log('🚀 App.tsx - AppContent render:', {
      currentPath: location.pathname,
      isInitialized,
      loading,
      isAuthenticated,
      userRole: user?.role,
      from
    });
  }

  // Show loading during initial auth check
  if (!isInitialized || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Layout><div><Home /></div></Layout>} />
      <Route path="/about" element={<Layout><About /></Layout>} />
      <Route path="/services" element={<Layout><Services /></Layout>} />
      <Route path="/contact" element={<Layout><Contact /></Layout>} />
      <Route path="/privacy" element={<Layout><Privacy /></Layout>} />
      <Route path="/terms" element={<Layout><Terms /></Layout>} />
      
      {/* Prototype Routes */}
      <Route path="/prototype/multi-branch" element={<MultiBranchBookingPrototype />} />
      
      {/* Auth Routes */}
      <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to={from} replace />} />
      <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to={from} replace />} />
      <Route path="/forgot-password" element={!isAuthenticated ? <ForgotPassword /> : <Navigate to={from} replace />} />
      <Route path="/reset-password" element={!isAuthenticated ? <ResetPassword /> : <Navigate to={from} replace />} />
      
      {/* Protected Routes */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Layout><Dashboard /></Layout>
          </ProtectedRoute>
        } 
      />
      {/* Appointment Routes */}
          <Route 
            path="/appointments" 
            element={
              <ProtectedRoute>
                <Layout><Appointments /></Layout>
              </ProtectedRoute>
            } 
          />
          {/* Unified Appointment Dashboard */}
          <Route 
            path="/appointments/unified" 
            element={
              <ProtectedRoute>
                <Layout><UnifiedAppointmentDashboard /></Layout>
              </ProtectedRoute>
            } 
          />
          {/* Specific routes must come before parameterized routes */}
          <Route 
            path="/appointments/create" 
            element={
              <ProtectedRoute>
                <Layout><CreateAppointment /></Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/appointments/:id" 
            element={
              <ProtectedRoute>
                <Layout><AppointmentDetails /></Layout>
              </ProtectedRoute>
            } 
          />
          
          {/* Patient Routes */}
          <Route 
            path="/patients" 
            element={
              <ProtectedRoute>
                <Layout><Patients /></Layout>
              </ProtectedRoute>
            } 
          />
          {/* Specific routes must come before parameterized routes */}
          <Route 
            path="/patients/new" 
            element={
              <ProtectedRoute>
                <Layout><CreatePatient /></Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/patients/create" 
            element={
              <ProtectedRoute>
                <Layout><CreatePatient /></Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/patients/:id" 
            element={
              <ProtectedRoute>
                <Layout><PatientDetails /></Layout>
              </ProtectedRoute>
            } 
          />
          
          {/* Medication Routes */}
          <Route 
            path="/medications" 
            element={
              <ProtectedRoute>
                <Layout><Medications /></Layout>
              </ProtectedRoute>
            } 
          />
          
          {/* Prescription Routes */}
          <Route 
            path="/prescriptions" 
            element={
              <ProtectedRoute>
                <Layout><Prescriptions /></Layout>
              </ProtectedRoute>
            } 
          />
          
          {/* Billing Routes */}
          <Route 
            path="/billing" 
            element={
              <ProtectedRoute>
                <Layout><Billing /></Layout>
              </ProtectedRoute>
            } 
          />
          
          {/* Report Routes */}
          <Route 
            path="/reports" 
            element={
              <ProtectedRoute>
                <Layout><Reports /></Layout>
              </ProtectedRoute>
            } 
          />
          
          {/* Profile Route */}
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <Layout><PatientProfile/></Layout>
              </ProtectedRoute>
            } 
          />
          
          {/* Clinics Routes */}
          <Route 
            path="/clinics" 
            element={
              <ProtectedRoute requiredRole="admin">
                <Layout><Clinics /></Layout>
              </ProtectedRoute>
            } 
          />
          
          {/* Admin Multi-Clinic Dashboard */}
          <Route 
            path="/admin/multi-clinic" 
            element={
              <ProtectedRoute requiredRole="admin">
                <Layout><MultiClinicDashboard /></Layout>
              </ProtectedRoute>
            } 
          />
          
          {/* Staff Scheduling */}
          <Route 
            path="/staff-scheduling" 
            element={
              <ProtectedRoute>
                <Layout><StaffScheduling /></Layout>
              </ProtectedRoute>
            } 
          />
          
          {/* Search Route */}
          <Route 
            path="/search" 
            element={
              <ProtectedRoute>
                <Layout><Search /></Layout>
              </ProtectedRoute>
            } 
          />

          {/* Settings Routes */}
          <Route 
            path="/settings" 
            element={
              <ProtectedRoute>
                <Layout><PatientSettings /></Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/settings/*" 
            element={
              <ProtectedRoute>
                <Layout><PatientSettings /></Layout>
              </ProtectedRoute>
            } 
          />
      
      {/* Fallback Routes */}
      <Route path="/404" element={<Layout><NotFound /></Layout>} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
};

function App() {
  // Initialize console error handling on app startup
  useEffect(() => {
    setupConsoleErrorHandling();
  }, []);

  return (
    <ErrorBoundary>
      <AppProvider>
        {/* React Router v7 Migration - Future flags enabled for forward compatibility */}
        <Router
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <AppContent />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#4ade80',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 4000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </Router>
      </AppProvider>
    </ErrorBoundary>
  );
}

export default App;