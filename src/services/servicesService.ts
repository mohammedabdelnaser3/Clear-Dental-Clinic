import { type Service, type ServiceCategory, type ServiceFilter, type ServiceStats, type ServiceBookingData } from '../types/services';

class ServicesService {
  private services: Service[];
  private categories: ServiceCategory[];

  constructor() {
    // Initialize with empty arrays
    this.services = [];
    this.categories = [];
    
    // Load data asynchronously to avoid circular dependency
    this.loadData();
  }
  
  private async loadData() {
    try {
      // Dynamic import to avoid circular dependency
      const module = await import('../components/homepage/ServicesSection');
      this.services = module.enhancedServices;
      this.categories = module.serviceCategories;
    } catch (error) {
      console.error('Failed to load services data:', error);
    }
  }

  // Get all services
  getAllServices(): Service[] {
    return this.services;
  }

  // Get services by category
  getServicesByCategory(categoryId: string): Service[] {
    if (categoryId === 'all') {
      return this.services;
    }
    return this.services.filter(service => service.category === categoryId);
  }

  // Get service by ID
  getServiceById(serviceId: string): Service | undefined {
    return this.services.find(service => service.id === serviceId);
  }

  // Search services
  searchServices(query: string): Service[] {
    const lowercaseQuery = query.toLowerCase();
    return this.services.filter(service =>
      service.title.toLowerCase().includes(lowercaseQuery) ||
      service.description.toLowerCase().includes(lowercaseQuery) ||
      service.shortDescription.toLowerCase().includes(lowercaseQuery) ||
      service.features.some(feature => feature.toLowerCase().includes(lowercaseQuery))
    );
  }

  // Filter services
  filterServices(filters: ServiceFilter): Service[] {
    let filteredServices = this.services;

    // Filter by category
    if (filters.category && filters.category !== 'all') {
      filteredServices = filteredServices.filter(service => service.category === filters.category);
    }

    // Filter by search term
    if (filters.searchTerm) {
      const lowercaseQuery = filters.searchTerm.toLowerCase();
      filteredServices = filteredServices.filter(service =>
        service.title.toLowerCase().includes(lowercaseQuery) ||
        service.description.toLowerCase().includes(lowercaseQuery) ||
        service.shortDescription.toLowerCase().includes(lowercaseQuery) ||
        service.features.some(feature => feature.toLowerCase().includes(lowercaseQuery))
      );
    }

    // Filter by location
    if (filters.location) {
      filteredServices = filteredServices.filter(service =>
        service.availableAt.includes(filters.location!)
      );
    }

    // Filter by rating
    if (filters.rating) {
      filteredServices = filteredServices.filter(service => service.rating >= filters.rating!);
    }

    return filteredServices;
  }

  // Get popular services
  getPopularServices(limit?: number): Service[] {
    const popularServices = this.services.filter(service => service.isPopular);
    return limit ? popularServices.slice(0, limit) : popularServices;
  }

  // Get new services
  getNewServices(limit?: number): Service[] {
    const newServices = this.services.filter(service => service.isNew);
    return limit ? newServices.slice(0, limit) : newServices;
  }

  // Get services by location
  getServicesByLocation(location: string): Service[] {
    return this.services.filter(service => service.availableAt.includes(location));
  }

  // Get all categories
  getAllCategories(): ServiceCategory[] {
    return this.categories;
  }

  // Get category by ID
  getCategoryById(categoryId: string): ServiceCategory | undefined {
    return this.categories.find(category => category.id === categoryId);
  }

  // Get service statistics
  getServiceStats(): ServiceStats {
    const categoryCounts: Record<string, number> = {};
    
    this.categories.forEach(category => {
      if (category.id !== 'all') {
        categoryCounts[category.id] = this.getServicesByCategory(category.id).length;
      }
    });

    const totalReviews = this.services.reduce((sum, service) => sum + service.reviewCount, 0);
    const averageRating = this.services.reduce((sum, service) => sum + service.rating, 0) / this.services.length;

    return {
      totalServices: this.services.length,
      categoryCounts,
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews,
      popularServices: this.getPopularServices().map(service => service.id),
      newServices: this.getNewServices().map(service => service.id)
    };
  }

  // Get related services
  getRelatedServices(serviceId: string, limit: number = 3): Service[] {
    const service = this.getServiceById(serviceId);
    if (!service) return [];

    // Get services from the same category, excluding the current service
    const relatedServices = this.services
      .filter(s => s.id !== serviceId && s.category === service.category)
      .slice(0, limit);

    // If we don't have enough related services from the same category,
    // fill with popular services
    if (relatedServices.length < limit) {
      const additionalServices = this.getPopularServices()
        .filter(s => s.id !== serviceId && !relatedServices.find(rs => rs.id === s.id))
        .slice(0, limit - relatedServices.length);
      
      relatedServices.push(...additionalServices);
    }

    return relatedServices;
  }

  // Book service appointment (placeholder for integration)
  async bookServiceAppointment(bookingData: ServiceBookingData): Promise<{ success: boolean; message: string; bookingId?: string }> {
    // This would integrate with the actual appointment booking system
    console.log('Booking service appointment:', bookingData);
    
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          message: 'Appointment booking request submitted successfully',
          bookingId: `booking_${Date.now()}`
        });
      }, 1000);
    });
  }

  // Get service pricing information
  getServicePricing(serviceId: string): { basePrice: string; factors: string[] } | null {
    const service = this.getServiceById(serviceId);
    if (!service) return null;

    return {
      basePrice: service.price,
      factors: [
        'Final price may vary based on complexity',
        'Consultation required for accurate quote',
        'Insurance coverage may apply',
        'Payment plans available'
      ]
    };
  }

  // Check service availability at location
  isServiceAvailableAt(serviceId: string, location: string): boolean {
    const service = this.getServiceById(serviceId);
    return service ? service.availableAt.includes(location) : false;
  }

  // Get service duration in minutes
  getServiceDurationInMinutes(serviceId: string): number | null {
    const service = this.getServiceById(serviceId);
    if (!service) return null;

    // Parse duration string (e.g., "30-90 minutes", "2-4 hours")
    const durationStr = service.duration.toLowerCase();
    
    if (durationStr.includes('hour')) {
      const hours = parseInt(durationStr.match(/\d+/)?.[0] || '1');
      return hours * 60;
    } else if (durationStr.includes('minute')) {
      const minutes = parseInt(durationStr.match(/\d+/)?.[0] || '30');
      return minutes;
    } else if (durationStr.includes('month')) {
      // For long-term treatments, return a placeholder
      return 60; // 1 hour per session
    }

    return 60; // Default to 1 hour
  }
}

// Export singleton instance
export const servicesService = new ServicesService();
export default servicesService;