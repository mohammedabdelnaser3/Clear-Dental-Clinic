import type { 
  ClinicBranch, 
  ClinicStatus, 
  ServiceHighlight
} from '../types/clinicBranch';
import type { OperatingHours } from '../types/clinic';

/**
 * Utility functions for clinic branch data manipulation and formatting
 */

/**
 * Format clinic branch display name
 */
export const formatClinicDisplayName = (branchName?: string, clinicName?: string): string => {
  if (!branchName) return clinicName || 'Clear Dental Center';
  return `Clear Dental - ${branchName}`;
};

/**
 * Generate clinic branch tagline based on branch characteristics
 */
export const generateClinicTagline = (branchName?: string): string => {
  const taglines: Record<string, string> = {
    'Fayoum': 'Your Premier Dental Care Destination',
    'Atesa': 'Advanced Dental Solutions in Atesa', 
    'Minya': 'Comprehensive Dental Care in Minya'
  };
  
  return taglines[branchName || ''] || 'Quality Dental Care You Can Trust';
};

/**
 * Get clinic branch color theme based on branch name
 */
export const getClinicBranchTheme = (branchName?: string) => {
  const themes: Record<string, { primary: string; secondary: string; accent: string }> = {
    'Fayoum': {
      primary: 'blue-600',
      secondary: 'blue-100', 
      accent: 'blue-500'
    },
    'Atesa': {
      primary: 'green-600',
      secondary: 'green-100',
      accent: 'green-500'
    },
    'Minya': {
      primary: 'purple-600',
      secondary: 'purple-100',
      accent: 'purple-500'
    }
  };
  
  return themes[branchName || ''] || themes['Fayoum'];
};

/**
 * Format phone number for display
 */
export const formatPhoneNumber = (phone: string): string => {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');
  
  // Format Egyptian phone numbers
  if (digits.startsWith('20')) {
    const number = digits.substring(2);
    if (number.length === 10) {
      return `+20 ${number.substring(0, 3)} ${number.substring(3, 6)} ${number.substring(6)}`;
    }
  }
  
  // Fallback formatting
  if (digits.length >= 10) {
    return `${digits.substring(0, 3)} ${digits.substring(3, 6)} ${digits.substring(6)}`;
  }
  
  return phone;
};

/**
 * Generate WhatsApp URL with pre-filled message
 */
export const generateWhatsAppUrl = (
  phoneNumber: string, 
  branchName?: string,
  message?: string
): string => {
  const cleanNumber = phoneNumber.replace(/\D/g, '');
  const defaultMessage = message || 
    `Hello! I would like to book an appointment at Clear Dental${branchName ? ` - ${branchName}` : ''}.`;
  
  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(defaultMessage)}`;
};

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
export const calculateDistance = (
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in kilometers
};

/**
 * Get the closest clinic branch to user location
 */
export const getClosestBranch = (
  branches: ClinicBranch[],
  userLat: number,
  userLon: number
): ClinicBranch | null => {
  if (branches.length === 0) return null;
  
  let closestBranch = branches[0];
  let minDistance = Infinity;
  
  branches.forEach(branch => {
    if (branch.address.coordinates) {
      const distance = calculateDistance(
        userLat,
        userLon,
        branch.address.coordinates.latitude,
        branch.address.coordinates.longitude
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        closestBranch = branch;
      }
    }
  });
  
  return closestBranch;
};

/**
 * Check if clinic is currently open
 */
export const isClinicCurrentlyOpen = (operatingHours: OperatingHours[]): boolean => {
  const now = new Date();
  const currentDay = getDayName(now.getDay()).toLowerCase();
  const currentTime = now.getHours() * 100 + now.getMinutes();
  
  const todayHours = operatingHours.find(hours => 
    hours.day.toLowerCase() === currentDay
  );
  
  if (!todayHours || todayHours.closed) {
    return false;
  }
  
  const openTime = parseTime(todayHours.open);
  const closeTime = parseTime(todayHours.close);
  
  return currentTime >= openTime && currentTime < closeTime;
};

/**
 * Get next opening time for clinic
 */
export const getNextOpeningTime = (operatingHours: OperatingHours[]): Date | null => {
  const now = new Date();
  
  // Check if open today but later
  const currentDay = getDayName(now.getDay()).toLowerCase();
  const currentTime = now.getHours() * 100 + now.getMinutes();
  
  const todayHours = operatingHours.find(hours => 
    hours.day.toLowerCase() === currentDay
  );
  
  if (todayHours && !todayHours.closed) {
    const openTime = parseTime(todayHours.open);
    if (currentTime < openTime) {
      const nextOpen = new Date(now);
      const [hours, minutes] = todayHours.open.split(':').map(Number);
      nextOpen.setHours(hours, minutes, 0, 0);
      return nextOpen;
    }
  }
  
  // Check next 7 days
  for (let i = 1; i <= 7; i++) {
    const nextDate = new Date(now);
    nextDate.setDate(nextDate.getDate() + i);
    const dayName = getDayName(nextDate.getDay()).toLowerCase();
    
    const dayHours = operatingHours.find(hours => 
      hours.day.toLowerCase() === dayName
    );
    
    if (dayHours && !dayHours.closed) {
      const [hours, minutes] = dayHours.open.split(':').map(Number);
      nextDate.setHours(hours, minutes, 0, 0);
      return nextDate;
    }
  }
  
  return null;
};

/**
 * Format operating hours for display
 */
export const formatOperatingHours = (hours: OperatingHours): string => {
  if (hours.closed) {
    return 'Closed';
  }
  
  const openTime = formatTime(hours.open);
  const closeTime = formatTime(hours.close);
  
  return `${openTime} - ${closeTime}`;
};

/**
 * Get clinic status text with color coding
 */
export const getClinicStatusDisplay = (status: ClinicStatus) => {
  return {
    text: status.statusText,
    color: status.isOpen ? 'green' : 'red',
    icon: status.isOpen ? 'check-circle' : 'x-circle',
    busyLevel: status.busyLevel
  };
};

/**
 * Filter service highlights by popularity
 */
export const getPopularServices = (serviceHighlights: ServiceHighlight[]): ServiceHighlight[] => {
  return serviceHighlights.filter(service => service.isPopular);
};

/**
 * Sort clinic branches by various criteria
 */
export const sortClinicBranches = (
  branches: ClinicBranch[],
  sortBy: 'name' | 'rating' | 'distance' | 'availability'
): ClinicBranch[] => {
  return [...branches].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return (a.branchName || '').localeCompare(b.branchName || '');
      
      case 'rating':
        return b.stats.rating - a.stats.rating;
      
      case 'availability':
        if (a.currentStatus.isOpen && !b.currentStatus.isOpen) return -1;
        if (!a.currentStatus.isOpen && b.currentStatus.isOpen) return 1;
        return 0;
      
      case 'distance':
        // This would require user location - placeholder implementation
        return 0;
      
      default:
        return 0;
    }
  });
};

/**
 * Generate clinic branch summary for quick overview
 */
export const generateClinicSummary = (branch: ClinicBranch) => {
  const popularServices = getPopularServices(branch.serviceHighlights);
  const statusDisplay = getClinicStatusDisplay(branch.currentStatus);
  
  return {
    name: branch.displayName,
    location: `${branch.address.city}, ${branch.address.state}`,
    status: statusDisplay,
    rating: `${branch.stats.rating}/5 (${branch.stats.reviewCount} reviews)`,
    popularServices: popularServices.slice(0, 3).map(s => s.name),
    uniqueFeatures: branch.uniqueFeatures.slice(0, 3),
    phone: formatPhoneNumber(branch.phone),
    nextAvailable: branch.nextAvailableSlot
  };
};

/**
 * Helper functions (internal)
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

/**
 * Validate clinic branch data
 */
export const validateClinicBranch = (branch: Partial<ClinicBranch>): string[] => {
  const errors: string[] = [];
  
  if (!branch.name) errors.push('Clinic name is required');
  if (!branch.branchName) errors.push('Branch name is required');
  if (!branch.phone) errors.push('Phone number is required');
  if (!branch.address) errors.push('Address is required');
  if (!branch.operatingHours || branch.operatingHours.length === 0) {
    errors.push('Operating hours are required');
  }
  
  return errors;
};

/**
 * Generate clinic branch URL slug
 */
export const generateClinicSlug = (branchName?: string): string => {
  if (!branchName) return 'clinic';
  return branchName.toLowerCase().replace(/\s+/g, '-');
};

/**
 * Get clinic branch by slug
 */
export const findBranchBySlug = (branches: ClinicBranch[], slug: string): ClinicBranch | null => {
  return branches.find(branch => 
    generateClinicSlug(branch.branchName) === slug
  ) || null;
};