import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button, Badge } from '../components/ui';
import ServicesSection from '../components/homepage/ServicesSection';
import { servicesService } from '../services/servicesService';
import type { Service, ServiceCategory } from '../types/services';
import {
  Search,
  Grid,
  List,
  TrendingUp,
  Sparkles,
  Calendar,
  Phone,
  MessageCircle
} from 'lucide-react';

const Services: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // State for filters and view
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedLocation, setSelectedLocation] = useState(searchParams.get('location') || '');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'rating' | 'price' | 'popular'>('popular');
  
  // Get data from service
  const [_services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [stats, setStats] = useState(servicesService.getServiceStats());
  const [loading, setLoading] = useState(true);

  // Load data on component mount
  useEffect(() => {
    setLoading(true);
    try {
      const allServices = servicesService.getAllServices();
      const allCategories = servicesService.getAllCategories();
      
      setServices(allServices);
      setCategories(allCategories);
      setStats(servicesService.getServiceStats());
    } catch (error) {
      console.error('Error loading services:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedCategory !== 'all') params.set('category', selectedCategory);
    if (searchTerm) params.set('search', searchTerm);
    if (selectedLocation) params.set('location', selectedLocation);
    
    setSearchParams(params);
  }, [selectedCategory, searchTerm, selectedLocation, setSearchParams]);

  // Filter and sort services
  const filteredAndSortedServices = React.useMemo(() => {
    const filtered = servicesService.filterServices({
      category: selectedCategory,
      searchTerm,
      location: selectedLocation
    });

    // Sort services
    switch (sortBy) {
      case 'name':
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'price':
        // Simple price sorting (would need more sophisticated logic for real pricing)
        filtered.sort((a, b) => {
          const priceA = parseInt(a.price.replace(/[^0-9]/g, '')) || 0;
          const priceB = parseInt(b.price.replace(/[^0-9]/g, '')) || 0;
          return priceA - priceB;
        });
        break;
      case 'popular':
      default:
        filtered.sort((a, b) => {
          if (a.isPopular && !b.isPopular) return -1;
          if (!a.isPopular && b.isPopular) return 1;
          return b.rating - a.rating;
        });
        break;
    }

    return filtered;
  }, [selectedCategory, searchTerm, selectedLocation, sortBy]);

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  const handleLocationChange = (location: string) => {
    setSelectedLocation(location);
  };

  const clearAllFilters = () => {
    setSelectedCategory('all');
    setSearchTerm('');
    setSelectedLocation('');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading services...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Our Dental Services
            </h1>
            <p className="text-xl mb-8 opacity-90">
              Comprehensive dental care with modern technology and expert professionals
            </p>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12">
              <div className="text-center">
                <div className="text-3xl font-bold mb-2">{stats.totalServices}</div>
                <div className="text-blue-200">Services</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold mb-2">{stats.averageRating}</div>
                <div className="text-blue-200">Avg Rating</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold mb-2">{stats.totalReviews}</div>
                <div className="text-blue-200">Reviews</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold mb-2">2</div>
                <div className="text-blue-200">Locations</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filters and Controls */}
      <section className="bg-white border-b sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4 flex-1">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search services..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>

              {/* Location Filter */}
              <select
                value={selectedLocation}
                onChange={(e) => handleLocationChange(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Locations</option>
                <option value="Fayoum">Fayoum</option>
                <option value="Attsa">Attsa</option>
              </select>
            </div>

            {/* View Controls */}
            <div className="flex items-center gap-4">
              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="popular">Most Popular</option>
                <option value="name">Name A-Z</option>
                <option value="rating">Highest Rated</option>
                <option value="price">Price Low-High</option>
              </select>

              {/* View Mode Toggle */}
              <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Active Filters */}
          {(selectedCategory !== 'all' || searchTerm || selectedLocation) && (
            <div className="flex flex-wrap gap-2 mt-4">
              {selectedCategory !== 'all' && (
                <Badge className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full flex items-center gap-2">
                  {categories.find(cat => cat.id === selectedCategory)?.name}
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className="hover:bg-blue-200 rounded-full p-0.5"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {searchTerm && (
                <Badge className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full flex items-center gap-2">
                  Search: "{searchTerm}"
                  <button
                    onClick={() => setSearchTerm('')}
                    className="hover:bg-gray-200 rounded-full p-0.5"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {selectedLocation && (
                <Badge className="bg-green-100 text-green-800 px-3 py-1 rounded-full flex items-center gap-2">
                  Location: {selectedLocation}
                  <button
                    onClick={() => setSelectedLocation('')}
                    className="hover:bg-green-200 rounded-full p-0.5"
                  >
                    ×
                  </button>
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllFilters}
                className="text-xs"
              >
                Clear All
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Services Content */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          {/* Results Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {filteredAndSortedServices.length} Services Found
              </h2>
              <p className="text-gray-600 mt-1">
                {selectedCategory !== 'all' && `in ${categories.find(cat => cat.id === selectedCategory)?.name}`}
                {selectedLocation && ` at ${selectedLocation}`}
              </p>
            </div>

            {/* Popular and New Services Quick Links */}
            <div className="hidden md:flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedCategory('all');
                  setSortBy('popular');
                }}
                className="flex items-center gap-2"
              >
                <TrendingUp className="w-4 h-4" />
                Popular
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedCategory('all');
                  setSearchTerm('');
                  // Filter to show only new services
                }}
                className="flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                New
              </Button>
            </div>
          </div>

          {/* Services Grid/List */}
          {filteredAndSortedServices.length > 0 ? (
            <ServicesSection 
              showFilters={false}
              showBookingIntegration={true}
            />
          ) : (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No services found</h3>
              <p className="text-gray-600 mb-6">
                Try adjusting your search terms or filters to find what you're looking for.
              </p>
              <Button onClick={clearAllFilters}>
                Clear All Filters
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Book Your Appointment?</h2>
          <p className="text-xl mb-8 max-w-3xl mx-auto opacity-90">
            Our experienced team is ready to provide you with the highest quality dental care.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4">
              <Calendar className="w-5 h-5 mr-2" />
              Book Appointment
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4">
              <Phone className="w-5 h-5 mr-2" />
              Call Now: +201017848825
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4">
              <MessageCircle className="w-5 h-5 mr-2" />
              WhatsApp
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Services;