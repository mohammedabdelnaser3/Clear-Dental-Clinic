import { getClinicBranches, getClinicBranchByName } from '../clinicBranchService';
import * as clinicService from '../clinicService';
import type { Clinic } from '../../types/clinic';

// Mock the clinic service
jest.mock('../clinicService');

// Mock logger
jest.mock('../../utils/logger', () => ({
  logInfo: jest.fn(),
  logError: jest.fn(),
  logWarn: jest.fn()
}));

const mockedClinicService = clinicService as jest.Mocked<typeof clinicService>;

describe('clinicBranchService', () => {
  const mockClinics: Clinic[] = [
    {
      id: '1',
      name: 'Clear',
      branchName: 'Fayoum',
      description: 'Main branch',
      address: {
        street: 'City Center Street',
        city: 'Fayoum',
        state: 'Fayoum',
        zipCode: '63514',
        country: 'Egypt'
      },
      phone: '+20123456789',
      email: 'fayoum@cleardentalclinic.com',
      operatingHours: [
        { day: 'monday', open: '11:00', close: '23:00', closed: false },
        { day: 'tuesday', open: '11:00', close: '23:00', closed: false },
        { day: 'wednesday', open: '11:00', close: '23:00', closed: false },
        { day: 'thursday', open: '11:00', close: '23:00', closed: false },
        { day: 'friday', open: '11:00', close: '23:00', closed: false },
        { day: 'saturday', open: '11:00', close: '23:00', closed: false },
        { day: 'sunday', open: '11:00', close: '23:00', closed: false }
      ],
      services: ['General Dentistry', 'Teeth Whitening'],
      staff: ['staff1', 'staff2'],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '2',
      name: 'Clear',
      branchName: 'Atesa',
      description: 'Atesa branch',
      address: {
        street: 'Main District Road',
        city: 'Atesa',
        state: 'Fayoum',
        zipCode: '63515',
        country: 'Egypt'
      },
      phone: '+20123456780',
      email: 'atesa@cleardentalclinic.com',
      operatingHours: [
        { day: 'monday', open: '12:00', close: '23:00', closed: false },
        { day: 'tuesday', open: '12:00', close: '23:00', closed: false },
        { day: 'wednesday', open: '12:00', close: '23:00', closed: false },
        { day: 'thursday', open: '12:00', close: '23:00', closed: false },
        { day: 'friday', open: '12:00', close: '23:00', closed: true },
        { day: 'saturday', open: '12:00', close: '23:00', closed: false },
        { day: 'sunday', open: '12:00', close: '23:00', closed: false }
      ],
      services: ['Orthodontics', 'Dental Implants'],
      staff: ['staff3'],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getClinicBranches', () => {
    it('should successfully transform clinic data to clinic branches', async () => {
      // Mock successful clinic service response
      mockedClinicService.getAllClinics.mockResolvedValue({
        success: true,
        data: mockClinics,
        message: 'Success'
      });

      const result = await getClinicBranches();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      
      // Check first branch transformation
      const fayoumBranch = result.data![0];
      expect(fayoumBranch.displayName).toBe('Clear Dental - Fayoum');
      expect(fayoumBranch.tagline).toBe('Your Premier Dental Care Destination');
      expect(fayoumBranch.uniqueFeatures).toContain('Open 7 days a week');
      expect(fayoumBranch.serviceHighlights).toHaveLength(3);
      expect(fayoumBranch.stats.patientsServed).toBe(5000);
      expect(fayoumBranch.whatsappNumber).toBe('+20123456789');
      expect(fayoumBranch.mapUrl).toContain('google.com/maps');
      expect(fayoumBranch.accessibility).toHaveLength(4);
      expect(fayoumBranch.amenities).toContain('Free WiFi');
    });

    it('should handle clinic service failure', async () => {
      mockedClinicService.getAllClinics.mockResolvedValue({
        success: false,
        data: [],
        message: 'Service unavailable'
      });

      const result = await getClinicBranches();

      expect(result.success).toBe(false);
      expect(result.data).toEqual([]);
      expect(result.message).toBe('Service unavailable');
    });

    it('should sort branches in correct order (Fayoum, Atesa, Minya)', async () => {
      const unsortedClinics = [
        { ...mockClinics[1] }, // Atesa first
        { ...mockClinics[0] }  // Fayoum second
      ];

      mockedClinicService.getAllClinics.mockResolvedValue({
        success: true,
        data: unsortedClinics,
        message: 'Success'
      });

      const result = await getClinicBranches();

      expect(result.success).toBe(true);
      expect(result.data![0].branchName).toBe('Fayoum');
      expect(result.data![1].branchName).toBe('Atesa');
    });
  });

  describe('getClinicBranchByName', () => {
    beforeEach(() => {
      mockedClinicService.getAllClinics.mockResolvedValue({
        success: true,
        data: mockClinics,
        message: 'Success'
      });
    });

    it('should find branch by name (case insensitive)', async () => {
      const result = await getClinicBranchByName('fayoum');

      expect(result.success).toBe(true);
      expect(result.data?.branchName).toBe('Fayoum');
      expect(result.data?.displayName).toBe('Clear Dental - Fayoum');
    });

    it('should return null for non-existent branch', async () => {
      const result = await getClinicBranchByName('NonExistent');

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.message).toBe("Clinic branch 'NonExistent' not found");
    });

    it('should handle service failure', async () => {
      mockedClinicService.getAllClinics.mockResolvedValue({
        success: false,
        data: [],
        message: 'Service error'
      });

      const result = await getClinicBranchByName('Fayoum');

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.message).toBe('Service error');
    });
  });

  describe('clinic branch transformation', () => {
    beforeEach(() => {
      mockedClinicService.getAllClinics.mockResolvedValue({
        success: true,
        data: [mockClinics[0]], // Just Fayoum
        message: 'Success'
      });
    });

    it('should generate correct service highlights for Fayoum', async () => {
      const result = await getClinicBranches();
      const fayoumBranch = result.data![0];

      expect(fayoumBranch.serviceHighlights).toHaveLength(3);
      expect(fayoumBranch.serviceHighlights[0].name).toBe('General Checkup');
      expect(fayoumBranch.serviceHighlights[0].isPopular).toBe(true);
      expect(fayoumBranch.serviceHighlights[1].name).toBe('Teeth Whitening');
      expect(fayoumBranch.serviceHighlights[2].name).toBe('Root Canal Treatment');
    });

    it('should generate correct statistics for Fayoum', async () => {
      const result = await getClinicBranches();
      const fayoumBranch = result.data![0];

      expect(fayoumBranch.stats.patientsServed).toBe(5000);
      expect(fayoumBranch.stats.yearsOfService).toBe(8);
      expect(fayoumBranch.stats.rating).toBe(4.8);
      expect(fayoumBranch.stats.reviewCount).toBe(450);
      expect(fayoumBranch.stats.doctorsCount).toBe(3);
    });

    it('should generate correct unique features for Fayoum', async () => {
      const result = await getClinicBranches();
      const fayoumBranch = result.data![0];

      expect(fayoumBranch.uniqueFeatures).toContain('Open 7 days a week');
      expect(fayoumBranch.uniqueFeatures).toContain('Extended hours until 11 PM');
      expect(fayoumBranch.uniqueFeatures).toContain('Full-service dental center');
    });

    it('should generate correct contact information', async () => {
      const result = await getClinicBranches();
      const fayoumBranch = result.data![0];

      expect(fayoumBranch.whatsappNumber).toBe('+20123456789');
      expect(fayoumBranch.mapUrl).toContain('google.com/maps/search');
      expect(fayoumBranch.directionsUrl).toContain('google.com/maps/dir');
      expect(fayoumBranch.bookingUrl).toBe('/appointments/book?clinic=1');
    });

    it('should generate accessibility features', async () => {
      const result = await getClinicBranches();
      const fayoumBranch = result.data![0];

      expect(fayoumBranch.accessibility).toHaveLength(4);
      
      const wheelchairAccess = fayoumBranch.accessibility.find(f => f.id === 'wheelchair-access');
      expect(wheelchairAccess?.available).toBe(true);
      
      const elevator = fayoumBranch.accessibility.find(f => f.id === 'elevator');
      expect(elevator?.available).toBe(true); // Fayoum has elevator
    });
  });
});