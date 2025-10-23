/**
 * Tests for Prescriptions component React key props and error handling
 * Verifies proper key props in medication mapping and safe data handling
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import Prescriptions from '../Prescriptions';
import { useAuth } from '../../../hooks/useAuth';
import { prescriptionService } from '../../../services/prescriptionService';
import i18n from '../../../i18n';

// Mock dependencies
jest.mock('../../../hooks/useAuth');
jest.mock('../../../services/prescriptionService');

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockPrescriptionService = prescriptionService as jest.Mocked<typeof prescriptionService>;

// Mock console.error to catch React key warnings
const originalConsoleError = console.error;
const mockConsoleError = jest.fn();

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    <I18nextProvider i18n={i18n}>
      {children}
    </I18nextProvider>
  </BrowserRouter>
);

describe('Prescriptions Component - Key Props and Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.error = mockConsoleError;
    
    // Default mock implementations
    mockUseAuth.mockReturnValue({
      user: { id: 'test-patient-id', role: 'patient' },
      isAuthenticated: true,
      login: jest.fn(),
      logout: jest.fn(),
      loading: false
    });
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  describe('React Key Props', () => {
    it('should not generate React key warnings for prescription list', async () => {
      const mockPrescriptions = [
        {
          _id: 'prescription-1',
          medications: [
            {
              _id: 'med-1',
              medication: { name: 'Medication 1', category: 'Antibiotic' },
              dosage: '500mg',
              frequency: 'Twice daily',
              duration: '7 days'
            },
            {
              _id: 'med-2',
              medication: { name: 'Medication 2', category: 'Painkiller' },
              dosage: '200mg',
              frequency: 'As needed',
              duration: '5 days'
            }
          ],
          prescribedDate: '2024-01-15',
          expiryDate: '2024-02-15',
          status: 'active',
          dentist: { firstName: 'Dr. John', lastName: 'Doe' },
          clinic: { name: 'Test Clinic' }
        },
        {
          _id: 'prescription-2',
          medications: [
            {
              _id: 'med-3',
              medication: { name: 'Medication 3', category: 'Antiseptic' },
              dosage: '10ml',
              frequency: 'Three times daily',
              duration: '3 days'
            }
          ],
          prescribedDate: '2024-01-10',
          expiryDate: '2024-02-10',
          status: 'active',
          dentist: { firstName: 'Dr. Jane', lastName: 'Smith' },
          clinic: { name: 'Another Clinic' }
        }
      ];

      mockPrescriptionService.getMyPrescriptions.mockResolvedValue({
        data: mockPrescriptions,
        total: 2,
        page: 1,
        limit: 100,
        totalPages: 1
      } as any);

      render(
        <TestWrapper>
          <Prescriptions />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Medication 1/i)).toBeInTheDocument();
      });

      // Check that no React key warnings were logged
      const keyWarnings = mockConsoleError.mock.calls.filter(call =>
        call.some(arg => 
          typeof arg === 'string' && 
          (arg.includes('Warning: Each child in a list should have a unique "key" prop') ||
           arg.includes('key prop'))
        )
      );

      expect(keyWarnings).toHaveLength(0);
    });

    it('should handle medications without _id using index as key', async () => {
      const mockPrescriptions = [
        {
          _id: 'prescription-1',
          medications: [
            {
              // Missing _id - should use index as key
              medication: { name: 'Medication Without ID', category: 'Antibiotic' },
              dosage: '500mg',
              frequency: 'Twice daily',
              duration: '7 days'
            },
            {
              _id: 'med-2',
              medication: { name: 'Medication With ID', category: 'Painkiller' },
              dosage: '200mg',
              frequency: 'As needed',
              duration: '5 days'
            }
          ],
          prescribedDate: '2024-01-15',
          expiryDate: '2024-02-15',
          status: 'active',
          dentist: { firstName: 'Dr. John', lastName: 'Doe' },
          clinic: { name: 'Test Clinic' }
        }
      ];

      mockPrescriptionService.getMyPrescriptions.mockResolvedValue({
        data: mockPrescriptions,
        total: 1,
        page: 1,
        limit: 100,
        totalPages: 1
      } as any);

      render(
        <TestWrapper>
          <Prescriptions />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Medication Without ID/i)).toBeInTheDocument();
        expect(screen.getByText(/Medication With ID/i)).toBeInTheDocument();
      });

      // Should not generate key warnings even with missing _id
      const keyWarnings = mockConsoleError.mock.calls.filter(call =>
        call.some(arg => 
          typeof arg === 'string' && 
          arg.includes('key prop')
        )
      );

      expect(keyWarnings).toHaveLength(0);
    });

    it('should handle empty medications array without errors', async () => {
      const mockPrescriptions = [
        {
          _id: 'prescription-1',
          medications: [], // Empty medications array
          prescribedDate: '2024-01-15',
          expiryDate: '2024-02-15',
          status: 'active',
          dentist: { firstName: 'Dr. John', lastName: 'Doe' },
          clinic: { name: 'Test Clinic' }
        }
      ];

      mockPrescriptionService.getMyPrescriptions.mockResolvedValue({
        data: mockPrescriptions,
        total: 1,
        page: 1,
        limit: 100,
        totalPages: 1
      } as any);

      render(
        <TestWrapper>
          <Prescriptions />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Dr. John Doe/i)).toBeInTheDocument();
      });

      // Should render without errors
      expect(mockConsoleError).not.toHaveBeenCalled();
    });
  });

  describe('Undefined/Null Data Handling', () => {
    it('should handle null prescriptions data', async () => {
      mockPrescriptionService.getMyPrescriptions.mockResolvedValue({
        data: null,
        total: 0,
        page: 1,
        limit: 100,
        totalPages: 0
      } as any);

      render(
        <TestWrapper>
          <Prescriptions />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/no prescriptions/i) || screen.getByText(/0.*prescription/i)).toBeInTheDocument();
      });

      // Should not crash
      expect(mockConsoleError).not.toHaveBeenCalled();
    });

    it('should handle prescriptions with missing properties', async () => {
      const incompletePrescriptions = [
        {
          _id: 'prescription-1',
          // Missing medications array
          prescribedDate: '2024-01-15',
          status: 'active'
          // Missing dentist, clinic, etc.
        },
        {
          _id: 'prescription-2',
          medications: null, // Null medications
          prescribedDate: '2024-01-10',
          status: 'active',
          dentist: { firstName: 'Dr. Jane' }, // Missing lastName
          clinic: null // Null clinic
        }
      ];

      mockPrescriptionService.getMyPrescriptions.mockResolvedValue({
        data: incompletePrescriptions,
        total: 2,
        page: 1,
        limit: 100,
        totalPages: 1
      } as any);

      render(
        <TestWrapper>
          <Prescriptions />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/prescription-1/i) || screen.getByText(/2.*prescription/i)).toBeInTheDocument();
      });

      // Should render without crashing
      expect(mockConsoleError).not.toHaveBeenCalled();
    });

    it('should handle medications with missing properties', async () => {
      const prescriptionsWithIncompleteMeds = [
        {
          _id: 'prescription-1',
          medications: [
            {
              _id: 'med-1',
              // Missing medication object
              dosage: '500mg'
            },
            {
              _id: 'med-2',
              medication: null, // Null medication
              dosage: '200mg',
              frequency: 'As needed'
            },
            {
              _id: 'med-3',
              medication: {
                name: 'Complete Medication'
                // Missing category
              },
              dosage: '100mg',
              frequency: 'Once daily',
              duration: '10 days'
            }
          ],
          prescribedDate: '2024-01-15',
          expiryDate: '2024-02-15',
          status: 'active',
          dentist: { firstName: 'Dr. John', lastName: 'Doe' },
          clinic: { name: 'Test Clinic' }
        }
      ];

      mockPrescriptionService.getMyPrescriptions.mockResolvedValue({
        data: prescriptionsWithIncompleteMeds,
        total: 1,
        page: 1,
        limit: 100,
        totalPages: 1
      } as any);

      render(
        <TestWrapper>
          <Prescriptions />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Complete Medication/i)).toBeInTheDocument();
      });

      // Should render available data without crashing
      expect(mockConsoleError).not.toHaveBeenCalled();
    });

    it('should handle undefined prescription properties gracefully', async () => {
      const prescriptionWithUndefinedProps = [
        {
          _id: 'prescription-1',
          medications: [
            {
              _id: 'med-1',
              medication: {
                name: 'Test Medication',
                category: 'Test Category'
              },
              dosage: undefined, // Undefined dosage
              frequency: null, // Null frequency
              duration: '7 days',
              instructions: undefined // Undefined instructions
            }
          ],
          prescribedDate: undefined, // Undefined date
          expiryDate: '2024-02-15',
          status: 'active',
          dentist: undefined, // Undefined dentist
          clinic: { name: 'Test Clinic' },
          diagnosis: null, // Null diagnosis
          notes: undefined // Undefined notes
        }
      ];

      mockPrescriptionService.getMyPrescriptions.mockResolvedValue({
        data: prescriptionWithUndefinedProps,
        total: 1,
        page: 1,
        limit: 100,
        totalPages: 1
      } as any);

      render(
        <TestWrapper>
          <Prescriptions />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Test Medication/i)).toBeInTheDocument();
      });

      // Should render without errors, using fallback values
      expect(mockConsoleError).not.toHaveBeenCalled();
    });
  });

  describe('API Error Scenarios', () => {
    it('should handle API errors gracefully', async () => {
      mockPrescriptionService.getMyPrescriptions.mockRejectedValue(
        new Error('Failed to fetch prescriptions')
      );

      render(
        <TestWrapper>
          <Prescriptions />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/error/i) || screen.getByText(/failed/i)).toBeInTheDocument();
      });

      // Should show error state instead of crashing
      expect(screen.queryByText(/Test Medication/i)).not.toBeInTheDocument();
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network Error');
      networkError.name = 'NetworkError';
      
      mockPrescriptionService.getMyPrescriptions.mockRejectedValue(networkError);

      render(
        <TestWrapper>
          <Prescriptions />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/network/i) || screen.getByText(/connection/i)).toBeInTheDocument();
      });
    });

    it('should handle malformed API response', async () => {
      // Return malformed response structure
      mockPrescriptionService.getMyPrescriptions.mockResolvedValue('invalid response' as any);

      render(
        <TestWrapper>
          <Prescriptions />
        </TestWrapper>
      );

      await waitFor(() => {
        // Should handle malformed response gracefully
        expect(screen.getByText(/no prescriptions/i) || screen.getByText(/error/i)).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading state while fetching prescriptions', async () => {
      // Mock delayed response
      mockPrescriptionService.getMyPrescriptions.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({
          data: [],
          total: 0,
          page: 1,
          limit: 100,
          totalPages: 0
        } as any), 100))
      );

      render(
        <TestWrapper>
          <Prescriptions />
        </TestWrapper>
      );

      // Should show loading state initially
      expect(screen.getByText(/loading/i) || screen.getByTestId('loading-spinner')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText(/no prescriptions/i) || screen.getByText(/0.*prescription/i)).toBeInTheDocument();
      });
    });

    it('should handle loading state with partial data', async () => {
      const partialPrescriptions = [
        {
          _id: 'prescription-1',
          medications: [
            {
              _id: 'med-1',
              medication: { name: 'Loading Medication' },
              // Other properties still loading
            }
          ],
          status: 'active'
          // Other properties still loading
        }
      ];

      mockPrescriptionService.getMyPrescriptions.mockResolvedValue({
        data: partialPrescriptions,
        total: 1,
        page: 1,
        limit: 100,
        totalPages: 1
      } as any);

      render(
        <TestWrapper>
          <Prescriptions />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Loading Medication/i)).toBeInTheDocument();
      });

      // Should render partial data without errors
      expect(mockConsoleError).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle extremely large medication lists', async () => {
      const largeMedicationList = Array.from({ length: 100 }, (_, i) => ({
        _id: `med-${i}`,
        medication: { 
          name: `Medication ${i}`, 
          category: `Category ${i % 5}` 
        },
        dosage: `${(i + 1) * 100}mg`,
        frequency: 'Daily',
        duration: `${i + 1} days`
      }));

      const prescriptionWithManyMeds = [
        {
          _id: 'prescription-1',
          medications: largeMedicationList,
          prescribedDate: '2024-01-15',
          expiryDate: '2024-02-15',
          status: 'active',
          dentist: { firstName: 'Dr. John', lastName: 'Doe' },
          clinic: { name: 'Test Clinic' }
        }
      ];

      mockPrescriptionService.getMyPrescriptions.mockResolvedValue({
        data: prescriptionWithManyMeds,
        total: 1,
        page: 1,
        limit: 100,
        totalPages: 1
      } as any);

      render(
        <TestWrapper>
          <Prescriptions />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Medication 0/i)).toBeInTheDocument();
      });

      // Should handle large lists without key warnings
      const keyWarnings = mockConsoleError.mock.calls.filter(call =>
        call.some(arg => 
          typeof arg === 'string' && 
          arg.includes('key prop')
        )
      );

      expect(keyWarnings).toHaveLength(0);
    });

    it('should handle duplicate medication IDs gracefully', async () => {
      const prescriptionWithDuplicateIds = [
        {
          _id: 'prescription-1',
          medications: [
            {
              _id: 'duplicate-id',
              medication: { name: 'First Medication', category: 'Antibiotic' },
              dosage: '500mg'
            },
            {
              _id: 'duplicate-id', // Duplicate ID
              medication: { name: 'Second Medication', category: 'Painkiller' },
              dosage: '200mg'
            }
          ],
          prescribedDate: '2024-01-15',
          status: 'active',
          dentist: { firstName: 'Dr. John', lastName: 'Doe' },
          clinic: { name: 'Test Clinic' }
        }
      ];

      mockPrescriptionService.getMyPrescriptions.mockResolvedValue({
        data: prescriptionWithDuplicateIds,
        total: 1,
        page: 1,
        limit: 100,
        totalPages: 1
      } as any);

      render(
        <TestWrapper>
          <Prescriptions />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/First Medication/i)).toBeInTheDocument();
        expect(screen.getByText(/Second Medication/i)).toBeInTheDocument();
      });

      // Should handle duplicate IDs by falling back to index-based keys
      expect(mockConsoleError).not.toHaveBeenCalled();
    });
  });
});