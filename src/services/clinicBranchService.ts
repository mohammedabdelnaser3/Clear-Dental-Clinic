// Removed unused import
import { getAllClinics } from './clinicService';
import type { 
  ClinicBranch, 
  ClinicStats, 
  ClinicStatus, 
  ServiceHighlight, 
  AccessibilityFeature,
  ContactMethod,
  EnhancedOperatingHours,
  ClinicBranchFilters,
  ClinicRecommendation
} from '../types/clinicBranch';
import type { Clinic, OperatingHours } from '../types/clinic';
import type { ApiResponse } from '../types/common';
import { logInfo, logError, logWarn } from '../utils/logger';

/**
 * Transform base clinic data to enhanced clinic branch data
 * Adds display information, statistics, and interactive features
 */
const transformToClinicBranch = (clinic: Clinic): ClinicBranch => {
  // Generate display name based on branch
  const displayName = clinic.branchName 
    ? `Clear Dental - ${clinic.branchName}` 
    : clinic.name;

  // Generate taglines based on branch
  const taglines: Record<string, string> = {
    'Fayoum': 'Your Premier Dental Care Destination',
    'Atesa': 'Advanced Dental Solutions in Atesa',
    'Minya': 'Comprehensive Dental Care in Minya'
  };

  // Generate unique features based on branch
  const uniqueFeatures: Record<string, string[]> = {
    'Fayoum': [
      'Open 7 days a week',
      'Extended hours until 11 PM',
      'Full-service dental center',
      'Emergency dental care',
      'Digital X-ray technology'
    ],
    'Atesa': [
      'Specialized orthodontic services',
      'Modern dental equipment',
      'Comfortable waiting area',
      'Flexible scheduling',
      'Insurance accepted'
    ],
    'Minya': [
      'Cosmetic dentistry specialists',
      'Pain-free procedures',
      'Family-friendly environment',
      'Latest dental technology',
      'Multilingual staff'
    ]
  };

  // Generate service highlights based on branch
  const serviceHighlights: Record<string, ServiceHighlight[]> = {
    'Fayoum': [
      {
        id: 'general-checkup',
        name: 'General Checkup',
        icon: 'stethoscope',
        description: 'Comprehensive dental examination and cleaning',
        isPopular: true,
        estimatedDuration: '45-60 minutes',
        startingPrice: 'Starting from 200 EGP'
      },
      {
        id: 'teeth-whitening',
        name: 'Teeth Whitening',
        icon: 'sparkles',
        description: 'Professional teeth whitening treatment',
        isPopular: true,
        estimatedDuration: '60-90 minutes',
        startingPrice: 'Starting from 800 EGP'
      },
      {
        id: 'root-canal',
        name: 'Root Canal Treatment',
        icon: 'medical-bag',
        description: 'Advanced endodontic treatment',
        estimatedDuration: '90-120 minutes',
        startingPrice: 'Starting from 1500 EGP'
      }
    ],
    'Atesa': [
      {
        id: 'orthodontics',
        name: 'Orthodontic Treatment',
        icon: 'adjustments',
        description: 'Braces and teeth alignment solutions',
        isPopular: true,
        estimatedDuration: 'Multiple visits',
        startingPrice: 'Starting from 5000 EGP'
      },
      {
        id: 'dental-implants',
        name: 'Dental Implants',
        icon: 'cog',
        description: 'Permanent tooth replacement solution',
        estimatedDuration: '2-3 hours',
        startingPrice: 'Starting from 8000 EGP'
      },
      {
        id: 'preventive-care',
        name: 'Preventive Care',
        icon: 'shield-check',
        description: 'Regular maintenance and prevention',
        isPopular: true,
        estimatedDuration: '30-45 minutes',
        startingPrice: 'Starting from 150 EGP'
      }
    ],
    'Minya': [
      {
        id: 'cosmetic-dentistry',
        name: 'Cosmetic Dentistry',
        icon: 'star',
        description: 'Smile makeover and aesthetic treatments',
        isPopular: true,
        estimatedDuration: '60-120 minutes',
        startingPrice: 'Starting from 1000 EGP'
      },
      {
        id: 'pediatric-dentistry',
        name: 'Pediatric Dentistry',
        icon: 'heart',
        description: 'Specialized care for children',
        isPopular: true,
        estimatedDuration: '30-60 minutes',
        startingPrice: 'Starting from 250 EGP'
      },
      {
        id: 'emergency-care',
        name: 'Emergency Care',
        icon: 'exclamation-triangle',
        description: '24/7 emergency dental services',
        estimatedDuration: 'As needed',
        startingPrice: 'Starting from 300 EGP'
      }
    ]
  };

  // Generate mock statistics (in real app, these would come from backend)
  const stats: ClinicStats = {
    patientsServed: clinic.branchName === 'Fayoum' ? 5000 : 
                   clinic.branchName === 'Atesa' ? 3500 : 2800,
    yearsOfService: clinic.branchName === 'Fayoum' ? 8 : 
                   clinic.branchName === 'Atesa' ? 5 : 4,
    rating: 4.8,
    reviewCount: clinic.branchName === 'Fayoum' ? 450 : 
                clinic.branchName === 'Atesa' ? 280 : 220,
    successfulTreatments: clinic.branchName === 'Fayoum' ? 12000 : 
                         clinic.branchName === 'Atesa' ? 8500 : 6800,
    doctorsCount: clinic.branchName === 'Fayoum' ? 3 : 
                 clinic.branchName === 'Atesa' ? 1 : 2
  };

  // Generate current status
  const currentStatus = generateClinicStatus(clinic.operatingHours);

  // Generate accessibility features
  const accessibility: AccessibilityFeature[] = [
    {
      id: 'wheelchair-access',
      name: 'Wheelchair Accessible',
      icon: 'wheelchair',
      description: 'Full wheelchair accessibility throughout the facility',
      available: true
    },
    {
      id: 'parking',
      name: 'Free Parking',
      icon: 'car',
      description: 'Complimentary parking available',
      available: true
    },
    {
      id: 'elevator',
      name: 'Elevator Access',
      icon: 'arrow-up',
      description: 'Elevator access to all floors',
      available: clinic.branchName === 'Fayoum' // Only Fayoum has multiple floors
    },
    {
      id: 'hearing-loop',
      name: 'Hearing Loop',
      icon: 'volume-up',
      description: 'Assistive hearing technology available',
      available: clinic.branchName !== 'Atesa' // Available in Fayoum and Minya
    }
  ];

  // Generate amenities
  const amenities = [
    'Free WiFi',
    'Comfortable Waiting Area',
    'Refreshments Available',
    'Children\'s Play Area',
    'Private Consultation Rooms',
    'Digital Entertainment System'
  ];

  // Generate WhatsApp number (format: +20 + clinic phone without +20)
  const whatsappNumber = clinic.phone.startsWith('+20') 
    ? clinic.phone 
    : `+20${clinic.phone.replace(/^\+?20?/, '')}`;

  // Generate map URLs
  const mapUrl = generateMapUrl(clinic.address);
  const directionsUrl = generateDirectionsUrl(clinic.address);

  return {
    ...clinic,
    displayName,
    tagline: taglines[clinic.branchName || ''] || 'Quality Dental Care',
    heroImage: `/images/clinics/${clinic.branchName?.toLowerCase() || 'default'}-hero.jpg`,
    galleryImages: [
      `/images/clinics/${clinic.branchName?.toLowerCase() || 'default'}-1.jpg`,
      `/images/clinics/${clinic.branchName?.toLowerCase() || 'default'}-2.jpg`,
      `/images/clinics/${clinic.branchName?.toLowerCase() || 'default'}-3.jpg`
    ],
    mapUrl,
    whatsappNumber,
    directionsUrl,
    uniqueFeatures: uniqueFeatures[clinic.branchName || ''] || [],
    serviceHighlights: serviceHighlights[clinic.branchName || ''] || [],
    stats,
    bookingUrl: `/appointments/book?clinic=${clinic.id}`,
    virtualTourUrl: `/virtual-tour/${clinic.branchName?.toLowerCase() || 'default'}`,
    currentStatus,
    nextAvailableSlot: generateNextAvailableSlot(clinic.operatingHours),
    accessibility,
    amenities
  };
};

/**
 * Generate current clinic status based on operating hours
 */
const generateClinicStatus = (operatingHours: OperatingHours[]): ClinicStatus => {
  const now = new Date();
  const currentTime = now.getHours() * 100 + now.getMinutes(); // HHMM format

  // Find today's hours
  const todayHours = operatingHours.find(hours => 
    hours.day.toLowerCase() === getDayName(now.getDay()).toLowerCase()
  );

  if (!todayHours || todayHours.closed) {
    // Find next open day
    const nextOpenDay = findNextOpenDay(operatingHours, now);
    return {
      isOpen: false,
      statusText: nextOpenDay 
        ? `Closed - Opens ${nextOpenDay.day} at ${formatTime(nextOpenDay.open)}`
        : 'Closed',
      nextOpenTime: nextOpenDay?.open
    };
  }

  // Parse open and close times
  const openTime = parseTime(todayHours.open);
  const closeTime = parseTime(todayHours.close);

  const isCurrentlyOpen = currentTime >= openTime && currentTime < closeTime;

  if (isCurrentlyOpen) {
    const closingTime = formatTime(todayHours.close);
    return {
      isOpen: true,
      statusText: `Open now - Closes at ${closingTime}`,
      busyLevel: getBusyLevel(currentTime, openTime, closeTime)
    };
  } else if (currentTime < openTime) {
    return {
      isOpen: false,
      statusText: `Opens today at ${formatTime(todayHours.open)}`,
      nextOpenTime: todayHours.open
    };
  } else {
    // After closing time, find next open day
    const nextOpenDay = findNextOpenDay(operatingHours, now);
    return {
      isOpen: false,
      statusText: nextOpenDay 
        ? `Closed - Opens ${nextOpenDay.day} at ${formatTime(nextOpenDay.open)}`
        : 'Closed',
      nextOpenTime: nextOpenDay?.open
    };
  }
};

/**
 * Helper functions for time and status calculations
 */
const getDayName = (dayIndex: number): string => {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[dayIndex];
};

const parseTime = (timeString: string): number => {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 100 + minutes;
};

const formatTime = (timeString: string): string => {
  const [hours, minutes] = timeString.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
};

const findNextOpenDay = (operatingHours: OperatingHours[], fromDate: Date) => {
  for (let i = 1; i <= 7; i++) {
    const nextDate = new Date(fromDate);
    nextDate.setDate(nextDate.getDate() + i);
    const dayName = getDayName(nextDate.getDay());
    
    const dayHours = operatingHours.find(hours => 
      hours.day.toLowerCase() === dayName.toLowerCase()
    );
    
    if (dayHours && !dayHours.closed) {
      return {
        day: i === 1 ? 'tomorrow' : dayName,
        open: dayHours.open
      };
    }
  }
  return null;
};

const getBusyLevel = (currentTime: number, openTime: number, closeTime: number): 'low' | 'medium' | 'high' => {
  const totalMinutes = closeTime - openTime;
  const elapsedMinutes = currentTime - openTime;
  const progress = elapsedMinutes / totalMinutes;

  // Peak hours are typically mid-day and early evening
  if (progress > 0.3 && progress < 0.7) {
    return 'high';
  } else if (progress > 0.1 && progress < 0.9) {
    return 'medium';
  } else {
    return 'low';
  }
};

const generateNextAvailableSlot = (_operatingHours: OperatingHours[]): string => {
  // Mock implementation - in real app, this would check actual appointment availability
  const now = new Date();
  now.setHours(now.getHours() + 2); // Next available in 2 hours
  return now.toISOString();
};

const generateMapUrl = (address: any): string => {
  const query = encodeURIComponent(`${address.street}, ${address.city}, ${address.country}`);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
};

const generateDirectionsUrl = (address: any): string => {
  const destination = encodeURIComponent(`${address.street}, ${address.city}, ${address.country}`);
  return `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
};

/**
 * Get all clinic branches with enhanced data
 * Fetches base clinic data and transforms it for homepage showcase
 */
export const getClinicBranches = async (): Promise<ApiResponse<ClinicBranch[]>> => {
  try {
    logInfo('Fetching clinic branches for homepage showcase');

    // Get base clinic data
    const clinicsResponse = await getAllClinics();
    
    if (!clinicsResponse.success || !clinicsResponse.data) {
      logWarn('Failed to fetch base clinic data', { response: clinicsResponse });
      return {
        success: false,
        data: [],
        message: clinicsResponse.message || 'Failed to fetch clinic data'
      };
    }

    // Transform to enhanced clinic branch data
    const clinicBranches = clinicsResponse.data.map(transformToClinicBranch);
    
    // Sort by branch name for consistent ordering
    clinicBranches.sort((a, b) => {
      const order = ['Fayoum', 'Atesa', 'Minya'];
      const aIndex = order.indexOf(a.branchName || '');
      const bIndex = order.indexOf(b.branchName || '');
      return aIndex - bIndex;
    });

    logInfo('Successfully transformed clinic branches', { 
      count: clinicBranches.length,
      branches: clinicBranches.map(b => b.branchName)
    });

    return {
      success: true,
      data: clinicBranches,
      message: 'Clinic branches retrieved successfully'
    };
  } catch (error: any) {
    logError('Failed to fetch clinic branches', error);
    return {
      success: false,
      data: [],
      message: error.message || 'Failed to fetch clinic branches'
    };
  }
};

/**
 * Get specific clinic branch by branch name
 */
export const getClinicBranchByName = async (branchName: string): Promise<ApiResponse<ClinicBranch | null>> => {
  try {
    logInfo('Fetching specific clinic branch', { branchName });

    const branchesResponse = await getClinicBranches();
    
    if (!branchesResponse.success || !branchesResponse.data) {
      return {
        success: false,
        data: null,
        message: branchesResponse.message || 'Failed to fetch clinic branches'
      };
    }

    const branch = branchesResponse.data.find(
      branch => branch.branchName?.toLowerCase() === branchName.toLowerCase()
    );

    if (!branch) {
      return {
        success: false,
        data: null,
        message: `Clinic branch '${branchName}' not found`
      };
    }

    return {
      success: true,
      data: branch,
      message: 'Clinic branch retrieved successfully'
    };
  } catch (error: any) {
    logError('Failed to fetch clinic branch by name', error, { branchName });
    return {
      success: false,
      data: null,
      message: error.message || 'Failed to fetch clinic branch'
    };
  }
};

/**
 * Get contact methods for a clinic branch
 */
export const getClinicContactMethods = (branch: ClinicBranch): ContactMethod[] => {
  return [
    {
      type: 'phone',
      label: 'Call Now',
      value: branch.phone,
      icon: 'phone',
      primary: true
    },
    {
      type: 'whatsapp',
      label: 'WhatsApp',
      value: `https://wa.me/${branch.whatsappNumber.replace(/\D/g, '')}`,
      icon: 'chat'
    },
    {
      type: 'directions',
      label: 'Get Directions',
      value: branch.directionsUrl || branch.mapUrl,
      icon: 'map'
    },
    {
      type: 'booking',
      label: 'Book Appointment',
      value: branch.bookingUrl || '/appointments/book',
      icon: 'calendar',
      primary: true
    }
  ];
};

/**
 * Get enhanced operating hours with display formatting
 */
export const getEnhancedOperatingHours = (branch: ClinicBranch): EnhancedOperatingHours[] => {
  const today = getDayName(new Date().getDay());
  
  return branch.operatingHours.map(hours => ({
    ...hours,
    displayText: hours.closed 
      ? 'Closed' 
      : `${formatTime(hours.open)} - ${formatTime(hours.close)}`,
    isToday: hours.day.toLowerCase() === today.toLowerCase(),
    isCurrentlyOpen: hours.day.toLowerCase() === today.toLowerCase() && 
                    branch.currentStatus.isOpen
  }));
};

/**
 * Filter clinic branches based on criteria
 */
export const filterClinicBranches = async (
  filters: ClinicBranchFilters
): Promise<ApiResponse<ClinicBranch[]>> => {
  try {
    const branchesResponse = await getClinicBranches();
    
    if (!branchesResponse.success || !branchesResponse.data) {
      return branchesResponse;
    }

    let filteredBranches = branchesResponse.data;

    // Filter by services
    if (filters.services && filters.services.length > 0) {
      filteredBranches = filteredBranches.filter(branch =>
        filters.services!.some(service =>
          branch.serviceHighlights.some(highlight =>
            highlight.name.toLowerCase().includes(service.toLowerCase())
          )
        )
      );
    }

    // Filter by location
    if (filters.location) {
      filteredBranches = filteredBranches.filter(branch =>
        branch.address.city.toLowerCase().includes(filters.location!.toLowerCase()) ||
        branch.branchName?.toLowerCase().includes(filters.location!.toLowerCase())
      );
    }

    // Filter by availability
    if (filters.availability) {
      filteredBranches = filteredBranches.filter(branch => {
        switch (filters.availability) {
          case 'now':
            return branch.currentStatus.isOpen;
          case 'today':
            return !branch.operatingHours.find(h => 
              h.day.toLowerCase() === getDayName(new Date().getDay()).toLowerCase()
            )?.closed;
          case 'week':
            return branch.operatingHours.some(h => !h.closed);
          default:
            return true;
        }
      });
    }

    // Filter by features
    if (filters.features && filters.features.length > 0) {
      filteredBranches = filteredBranches.filter(branch =>
        filters.features!.some(feature =>
          branch.uniqueFeatures.some(branchFeature =>
            branchFeature.toLowerCase().includes(feature.toLowerCase())
          )
        )
      );
    }

    return {
      success: true,
      data: filteredBranches,
      message: `Found ${filteredBranches.length} matching clinic branches`
    };
  } catch (error: any) {
    logError('Failed to filter clinic branches', error, { filters });
    return {
      success: false,
      data: [],
      message: error.message || 'Failed to filter clinic branches'
    };
  }
};

/**
 * Get clinic branch recommendations based on user preferences
 */
export const getClinicRecommendations = async (
  preferences: {
    location?: string;
    services?: string[];
    availability?: string;
    maxDistance?: number;
  }
): Promise<ApiResponse<ClinicRecommendation[]>> => {
  try {
    const branchesResponse = await getClinicBranches();
    
    if (!branchesResponse.success || !branchesResponse.data) {
      return {
        success: false,
        data: [],
        message: branchesResponse.message || 'Failed to fetch clinic branches'
      };
    }

    const recommendations: ClinicRecommendation[] = branchesResponse.data.map(branch => {
      let score = 0;
      const reasons: string[] = [];
      const matchedCriteria: string[] = [];

      // Location scoring
      if (preferences.location) {
        if (branch.address.city.toLowerCase().includes(preferences.location.toLowerCase()) ||
            branch.branchName?.toLowerCase().includes(preferences.location.toLowerCase())) {
          score += 30;
          reasons.push(`Located in ${preferences.location}`);
          matchedCriteria.push('location');
        }
      }

      // Service scoring
      if (preferences.services && preferences.services.length > 0) {
        const matchedServices = preferences.services.filter(service =>
          branch.serviceHighlights.some(highlight =>
            highlight.name.toLowerCase().includes(service.toLowerCase())
          )
        );
        
        if (matchedServices.length > 0) {
          score += (matchedServices.length / preferences.services.length) * 25;
          reasons.push(`Offers ${matchedServices.join(', ')}`);
          matchedCriteria.push('services');
        }
      }

      // Availability scoring
      if (preferences.availability === 'now' && branch.currentStatus.isOpen) {
        score += 20;
        reasons.push('Currently open');
        matchedCriteria.push('availability');
      }

      // Rating and review scoring
      score += (branch.stats.rating / 5) * 15;
      if (branch.stats.rating >= 4.5) {
        reasons.push(`Highly rated (${branch.stats.rating}/5)`);
      }

      // Experience scoring
      score += Math.min(branch.stats.yearsOfService / 10, 1) * 10;
      if (branch.stats.yearsOfService >= 5) {
        reasons.push(`${branch.stats.yearsOfService} years of experience`);
      }

      return {
        branch,
        score: Math.round(score),
        reasons,
        matchedCriteria
      };
    });

    // Sort by score (highest first)
    recommendations.sort((a, b) => b.score - a.score);

    return {
      success: true,
      data: recommendations,
      message: 'Clinic recommendations generated successfully'
    };
  } catch (error: any) {
    logError('Failed to generate clinic recommendations', error, { preferences });
    return {
      success: false,
      data: [],
      message: error.message || 'Failed to generate recommendations'
    };
  }
};

// Export service functions
export const clinicBranchService = {
  getClinicBranches,
  getClinicBranchByName,
  getClinicContactMethods,
  getEnhancedOperatingHours,
  filterClinicBranches,
  getClinicRecommendations
};

export default clinicBranchService;