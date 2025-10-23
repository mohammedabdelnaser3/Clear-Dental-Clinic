import type { Clinic, OperatingHours } from './clinic';

/**
 * Enhanced clinic branch interface for homepage showcase
 * Extends the base Clinic interface with additional display and interaction data
 */
export interface ClinicBranch extends Clinic {
  // Display information
  displayName: string; // User-friendly display name
  tagline?: string; // Short marketing tagline
  heroImage?: string; // Main showcase image
  galleryImages: string[]; // Additional images for gallery
  
  // Location and contact enhancements
  mapUrl: string; // Google Maps URL
  whatsappNumber: string; // WhatsApp contact number
  directionsUrl?: string; // Direct Google Maps directions URL
  
  // Service and feature highlights
  uniqueFeatures: string[]; // Branch-specific unique features
  serviceHighlights: ServiceHighlight[]; // Key services to highlight
  
  // Statistics and social proof
  stats: ClinicStats;
  
  // Booking and interaction
  bookingUrl?: string; // Direct booking URL for this branch
  virtualTourUrl?: string; // 360° virtual tour URL
  
  // Current status
  currentStatus: ClinicStatus;
  nextAvailableSlot?: string; // Next available appointment slot
  
  // Accessibility and amenities
  accessibility: AccessibilityFeature[];
  amenities: string[]; // Available amenities
}

/**
 * Service highlight for clinic branch showcase
 */
export interface ServiceHighlight {
  id: string;
  name: string;
  icon: string; // Icon name or URL
  description: string;
  isPopular?: boolean; // Mark as popular service
  estimatedDuration?: string; // e.g., "30-60 minutes"
  startingPrice?: string; // e.g., "Starting from $100"
}

/**
 * Clinic statistics for social proof
 */
export interface ClinicStats {
  patientsServed: number;
  yearsOfService: number;
  rating: number; // Average rating (1-5)
  reviewCount: number;
  successfulTreatments?: number;
  doctorsCount: number;
}

/**
 * Current clinic status
 */
export interface ClinicStatus {
  isOpen: boolean;
  statusText: string; // e.g., "Open now", "Closes at 11 PM", "Closed - Opens tomorrow at 11 AM"
  nextOpenTime?: string; // When clinic opens next (if currently closed)
  busyLevel?: 'low' | 'medium' | 'high'; // Current busy level
}

/**
 * Accessibility features
 */
export interface AccessibilityFeature {
  id: string;
  name: string;
  icon: string;
  description: string;
  available: boolean;
}

/**
 * Contact method for clinic branch
 */
export interface ContactMethod {
  type: 'phone' | 'whatsapp' | 'email' | 'directions' | 'booking';
  label: string;
  value: string; // Phone number, URL, email, etc.
  icon: string;
  primary?: boolean; // Mark as primary contact method
}

/**
 * Operating hours with enhanced display information
 */
export interface EnhancedOperatingHours extends OperatingHours {
  displayText: string; // e.g., "11:00 AM - 11:00 PM"
  isToday?: boolean; // If this is today's hours
  isCurrentlyOpen?: boolean; // If currently within these hours
}

/**
 * Clinic branch comparison data
 */
export interface ClinicComparison {
  branches: ClinicBranch[];
  comparisonCategories: ComparisonCategory[];
}

/**
 * Comparison category for branch comparison
 */
export interface ComparisonCategory {
  id: string;
  name: string;
  icon: string;
  items: ComparisonItem[];
}

/**
 * Individual comparison item
 */
export interface ComparisonItem {
  branchId: string;
  value: string | number | boolean;
  displayValue: string; // Formatted display value
  highlight?: boolean; // Highlight this value
}

/**
 * Clinic branch filter options
 */
export interface ClinicBranchFilters {
  services?: string[]; // Filter by available services
  location?: string; // Filter by location/city
  availability?: 'now' | 'today' | 'week'; // Filter by availability
  features?: string[]; // Filter by unique features
}

/**
 * Clinic branch search and recommendation result
 */
export interface ClinicRecommendation {
  branch: ClinicBranch;
  score: number; // Recommendation score (0-100)
  reasons: string[]; // Reasons for recommendation
  matchedCriteria: string[]; // Which search criteria were matched
}