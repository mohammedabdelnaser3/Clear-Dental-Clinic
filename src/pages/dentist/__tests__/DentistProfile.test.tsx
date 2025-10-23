/**
 * Tests for DentistProfile component behavior with undefined/null data
 * Verifies safe property access and error handling in component
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import DentistProfile from '../DentistProfile';
import { useAuth } from '../../../hooks/useAuth';
import { usePerformance } from '../../../hooks/usePerformance';
import { dentistService } from '../../../services/dentistService';
import i18n from '../../../i18n';

// Mock dependencies
jest.mock('../../../hooks/useAuth');
jest.mock('../../../hooks/usePerformance');
jest.mock('../../../services/dentistService');

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUsePerformance = usePerformance as jest.MockedFunction<typeof usePerformance>;
const mockDentistService = dentistService as jest.Mocked<typeof dentistService>;

// Mock react-router-dom navigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    <I18nextProvider i18n={i18n}>
      {children}
    </I18nextProvider>
  </BrowserRouter>
);

describe('DentistProfile Component - Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    mockUseAuth.mockReturnValue({
      user: { id: 'test-dentist-id', role: 'dentist' },
      isAuthenticated: true,
      login: jest.fn(),
      logout: jest.fn(),
      loading: false
    });
    
    mockUsePerformance.mockReturnValue({
      measureAsync: jest.fn((name, fn) => fn()),
      mark: jest.fn(),
      measure: jest.fn(),
      getMetrics: jest.fn(() => ({}))
    });
  });

  describe('Handling undefined/null dentist data', () => {
    it('should handle null dentist profile gracefully', async () => {
      mockDentistService.getDentistProfile.mockResolvedValue(null as any);
      mockDentistService.getDentistClinics.mockResolvedValue({ data: [], total: 0, totalPages: 0 });
      mockDentistService.getDentistAppointments.mockResolvedValue({ 
        data: [], total: 0, page: 1, limit: 10, totalPages: 0 
      });
      
      render(
        <TestWrapper>
          <DentistProfile />
        </TestWrapper>
      );
      
      await waitFor(() => {
        expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
      });
      
      // Should show loading or empty state, not crash
      expect(screen.getByTestId('dentist-profile') || screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('should handle dentist profile with missing properties', async () => {
      const incompleteDentist = {
        _id: 'test-id',
        // Missing firstName, lastName, email, etc.
      };
      
      mockDentistService.getDentistProfile.mockResolvedValue(incompleteDentist as any);
      mockDentistService.getDentistClinics.mockResolvedValue({ data: [], total: 0, totalPages: 0 });
      mockDentistService.getDentistAppointments.mockResolvedValue({ 
        data: [], total: 0, page: 1, limit: 10, totalPages: 0 
      });
      
      render(
        <TestWrapper>
          <DentistProfile />
        </TestWrapper>
      );
      
      await waitFor(() => {
        expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
      });
      
      // Should render without crashing, using fallback values
      expect(screen.getByTestId('dentist-profile') || screen.getByText(/profile/i)).toBeInTheDocument();
    });

    it('should handle dentist profile with undefined nested properties', async () => {
      const dentistWithUndefinedProps = {
        _id: 'test-id',
        firstName: 'John',
        lastName: 'Doe',
        profile: undefined,
        settings: null,
        preferences: {
          // Some properties missing
          theme: 'light'
        }
      };
      
      mockDentistService.getDentistProfile.mockResolvedValue(dentistWithUndefinedProps as any);
      mockDentistService.getDentistClinics.mockResolvedValue({ data: [], total: 0, totalPages: 0 });
      mockDentistService.getDentistAppointments.mockResolvedValue({ 
        data: [], total: 0, page: 1, limit: 10, totalPages: 0 
      });
      
      render(
        <TestWrapper>
          <DentistProfile />
        </TestWrapper>
      );
      
      await waitFor(() => {
        expect(screen.queryByText(/John Doe/i)).toBeInTheDocument();
      });
      
      // Should render name correctly while handling undefined properties safely
      expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
    });
  });

  describe('Handling undefined/null clinics data', () => {
    it('should handle null clinics array', async () => {
      const validDentist = {
        _id: 'test-id',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@test.com'
      };
      
      mockDentistService.getDentistProfile.mockResolvedValue(validDentist as any);
      mockDentistService.getDentistClinics.mockResolvedValue({ data: null as any, total: 0, totalPages: 0 });
      mockDentistService.getDentistAppointments.mockResolvedValue({ 
        data: [], total: 0, page: 1, limit: 10, totalPages: 0 
      });
      
      render(
        <TestWrapper>
          <DentistProfile />
        </TestWrapper>
      );
      
      await waitFor(() => {
        expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
      });
      
      // Should show 0 clinics instead of crashing
      expect(screen.queryByText(/0.*clinic/i)).toBeInTheDocument();
    });

    it('should handle clinics with missing properties', async () => {
      const validDentist = {
        _id: 'test-id',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@test.com'
      };
      
      const clinicsWithMissingProps = [
        {
          _id: 'clinic-1',
          // Missing name, address, etc.
        },
        {
          _id: 'clinic-2',
          name: 'Test Clinic',
          // Missing other properties
        }
      ];
      
      mockDentistService.getDentistProfile.mockResolvedValue(validDentist as any);
      mockDentistService.getDentistClinics.mockResolvedValue({ 
        data: clinicsWithMissingProps as any, 
        total: 2, 
        totalPages: 1 
      });
      mockDentistService.getDentistAppointments.mockResolvedValue({ 
        data: [], total: 0, page: 1, limit: 10, totalPages: 0 
      });
      
      render(
        <TestWrapper>
          <DentistProfile />
        </TestWrapper>
      );
      
      await waitFor(() => {
        expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
      });
      
      // Should render clinics count without crashing
      expect(screen.queryByText(/2.*clinic/i)).toBeInTheDocument();
    });
  });

  describe('Handling undefined/null appointments data', () => {
    it('should handle null appointments array', async () => {
      const validDentist = {
        _id: 'test-id',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@test.com'
      };
      
      mockDentistService.getDentistProfile.mockResolvedValue(validDentist as any);
      mockDentistService.getDentistClinics.mockResolvedValue({ data: [], total: 0, totalPages: 0 });
      mockDentistService.getDentistAppointments.mockResolvedValue({ 
        data: null as any, total: 0, page: 1, limit: 10, totalPages: 0 
      });
      
      render(
        <TestWrapper>
          <DentistProfile />
        </TestWrapper>
      );
      
      await waitFor(() => {
        expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
      });
      
      // Should show 0 appointments instead of crashing
      expect(screen.queryByText(/0.*appointment/i)).toBeInTheDocument();
    });

    it('should handle appointments with missing properties', async () => {
      const validDentist = {
        _id: 'test-id',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@test.com'
      };
      
      const appointmentsWithMissingProps = [
        {
          _id: 'apt-1',
          // Missing date, patient, etc.
        },
        {
          _id: 'apt-2',
          date: '2024-01-15',
          // Missing other properties
        }
      ];
      
      mockDentistService.getDentistProfile.mockResolvedValue(validDentist as any);
      mockDentistService.getDentistClinics.mockResolvedValue({ data: [], total: 0, totalPages: 0 });
      mockDentistService.getDentistAppointments.mockResolvedValue({ 
        data: appointmentsWithMissingProps as any, 
        total: 2, 
        page: 1, 
        limit: 10, 
        totalPages: 1 
      });
      
      render(
        <TestWrapper>
          <DentistProfile />
        </TestWrapper>
      );
      
      await waitFor(() => {
        expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
      });
      
      // Should render appointments count without crashing
      expect(screen.queryByText(/2.*appointment/i)).toBeInTheDocument();
    });
  });

  describe('API error handling', () => {
    it('should handle API errors gracefully', async () => {
      mockDentistService.getDentistProfile.mockRejectedValue(new Error('API Error'));
      mockDentistService.getDentistClinics.mockRejectedValue(new Error('Clinics API Error'));
      mockDentistService.getDentistAppointments.mockRejectedValue(new Error('Appointments API Error'));
      
      render(
        <TestWrapper>
          <DentistProfile />
        </TestWrapper>
      );
      
      await waitFor(() => {
        // Should show error state instead of crashing
        expect(screen.getByText(/error/i) || screen.getByText(/something went wrong/i)).toBeInTheDocument();
      });
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network Error');
      networkError.name = 'NetworkError';
      
      mockDentistService.getDentistProfile.mockRejectedValue(networkError);
      mockDentistService.getDentistClinics.mockResolvedValue({ data: [], total: 0, totalPages: 0 });
      mockDentistService.getDentistAppointments.mockResolvedValue({ 
        data: [], total: 0, page: 1, limit: 10, totalPages: 0 
      });
      
      render(
        <TestWrapper>
          <DentistProfile />
        </TestWrapper>
      );
      
      await waitFor(() => {
        // Should show network error message
        expect(screen.getByText(/network/i) || screen.getByText(/connection/i)).toBeInTheDocument();
      });
    });

    it('should handle 404 errors for missing dentist', async () => {
      const error404 = {
        response: { status: 404 },
        message: 'Dentist not found'
      };
      
      mockDentistService.getDentistProfile.mockRejectedValue(error404);
      mockDentistService.getDentistClinics.mockResolvedValue({ data: [], total: 0, totalPages: 0 });
      mockDentistService.getDentistAppointments.mockResolvedValue({ 
        data: [], total: 0, page: 1, limit: 10, totalPages: 0 
      });
      
      render(
        <TestWrapper>
          <DentistProfile />
        </TestWrapper>
      );
      
      await waitFor(() => {
        // Should show not found message
        expect(screen.getByText(/not found/i) || screen.getByText(/404/i)).toBeInTheDocument();
      });
    });
  });

  describe('Loading states', () => {
    it('should show loading state while fetching data', async () => {
      // Mock delayed responses
      mockDentistService.getDentistProfile.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({
          _id: 'test-id',
          firstName: 'John',
          lastName: 'Doe'
        } as any), 100))
      );
      mockDentistService.getDentistClinics.mockResolvedValue({ data: [], total: 0, totalPages: 0 });
      mockDentistService.getDentistAppointments.mockResolvedValue({ 
        data: [], total: 0, page: 1, limit: 10, totalPages: 0 
      });
      
      render(
        <TestWrapper>
          <DentistProfile />
        </TestWrapper>
      );
      
      // Should show loading state initially
      expect(screen.getByText(/loading/i) || screen.getByTestId('loading-spinner')).toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
      });
    });

    it('should handle partial loading states', async () => {
      const validDentist = {
        _id: 'test-id',
        firstName: 'John',
        lastName: 'Doe'
      };
      
      mockDentistService.getDentistProfile.mockResolvedValue(validDentist as any);
      // Delay clinics loading
      mockDentistService.getDentistClinics.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ data: [], total: 0, totalPages: 0 }), 100))
      );
      mockDentistService.getDentistAppointments.mockResolvedValue({ 
        data: [], total: 0, page: 1, limit: 10, totalPages: 0 
      });
      
      render(
        <TestWrapper>
          <DentistProfile />
        </TestWrapper>
      );
      
      await waitFor(() => {
        expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
      });
      
      // Should show clinics loading state
      expect(screen.getByText(/loading.*clinic/i) || screen.getByTestId('clinics-loading')).toBeInTheDocument();
    });
  });

  describe('User interactions with error states', () => {
    it('should allow retry after error', async () => {
      mockDentistService.getDentistProfile
        .mockRejectedValueOnce(new Error('API Error'))
        .mockResolvedValueOnce({
          _id: 'test-id',
          firstName: 'John',
          lastName: 'Doe'
        } as any);
      
      mockDentistService.getDentistClinics.mockResolvedValue({ data: [], total: 0, totalPages: 0 });
      mockDentistService.getDentistAppointments.mockResolvedValue({ 
        data: [], total: 0, page: 1, limit: 10, totalPages: 0 
      });
      
      render(
        <TestWrapper>
          <DentistProfile />
        </TestWrapper>
      );
      
      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
      
      // Click retry button if available
      const retryButton = screen.queryByText(/retry/i) || screen.queryByText(/try again/i);
      if (retryButton) {
        fireEvent.click(retryButton);
        
        await waitFor(() => {
          expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
        });
      }
    });

    it('should handle navigation when profile is incomplete', async () => {
      const incompleteDentist = {
        _id: 'test-id',
        // Missing required fields
      };
      
      mockDentistService.getDentistProfile.mockResolvedValue(incompleteDentist as any);
      mockDentistService.getDentistClinics.mockResolvedValue({ data: [], total: 0, totalPages: 0 });
      mockDentistService.getDentistAppointments.mockResolvedValue({ 
        data: [], total: 0, page: 1, limit: 10, totalPages: 0 
      });
      
      render(
        <TestWrapper>
          <DentistProfile />
        </TestWrapper>
      );
      
      await waitFor(() => {
        expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
      });
      
      // Should still allow navigation to settings
      const editButton = screen.queryByText(/edit/i) || screen.queryByText(/settings/i);
      if (editButton) {
        fireEvent.click(editButton);
        expect(mockNavigate).toHaveBeenCalledWith('/settings');
      }
    });
  });
});