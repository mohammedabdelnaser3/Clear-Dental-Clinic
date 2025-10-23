export interface ServiceCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  description?: string;
}

export interface Service {
  id: string;
  title: string;
  category: string;
  shortDescription: string;
  description: string;
  icon: React.ReactNode;
  image: string;
  features: string[];
  duration: string;
  price: string;
  availableAt: string[];
  rating: number;
  reviewCount: number;
  isPopular: boolean;
  isNew: boolean;
  beforeAfterImages?: {
    before: string;
    after: string;
    description: string;
  }[];
  relatedServices?: string[];
  prerequisites?: string[];
  aftercare?: string[];
}

export interface ServiceBookingData {
  serviceId: string;
  serviceName: string;
  duration: string;
  price: string;
  clinicLocation?: string;
  preferredDate?: Date;
  preferredTime?: string;
  notes?: string;
}

export interface ServiceFilter {
  category: string;
  searchTerm: string;
  priceRange?: {
    min: number;
    max: number;
  };
  duration?: string;
  location?: string;
  rating?: number;
}

export interface ServiceStats {
  totalServices: number;
  categoryCounts: Record<string, number>;
  averageRating: number;
  totalReviews: number;
  popularServices: string[];
  newServices: string[];
}