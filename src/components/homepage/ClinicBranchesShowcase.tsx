import React, { useState, useEffect } from 'react';
import { 
  MapIcon, 
  BuildingOfficeIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FunnelIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import ClinicBranchCard from './ClinicBranchCard';
import LoadingSpinner from '../ui/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import { getClinicBranches, filterClinicBranches } from '../../services/clinicBranchService';
import { sortClinicBranches } from '../../utils/clinicBranchUtils';
import type { ClinicBranch, ClinicBranchFilters } from '../../types/clinicBranch';

interface ClinicBranchesShowcaseProps {
  onBookAppointment?: (branchId: string) => void;
  onViewBranchDetails?: (branchId: string) => void;
  className?: string;
  showFilters?: boolean;
  showFavorites?: boolean;
  maxBranches?: number;
}

const ClinicBranchesShowcase: React.FC<ClinicBranchesShowcaseProps> = ({
  onBookAppointment,
  onViewBranchDetails,
  className = '',
  showFilters = true,
  showFavorites = false,
  maxBranches
}) => {
  const [branches, setBranches] = useState<ClinicBranch[]>([]);
  const [filteredBranches, setFilteredBranches] = useState<ClinicBranch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedAvailability, setSelectedAvailability] = useState<'all' | 'now' | 'today'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'rating' | 'availability'>('name');
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);

  // Load clinic branches
  useEffect(() => {
    const loadBranches = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await getClinicBranches();
        
        if (response.success && response.data) {
          setBranches(response.data);
          setFilteredBranches(response.data);
        } else {
          setError(response.message || 'Failed to load clinic branches');
        }
      } catch (err) {
        setError('An unexpected error occurred while loading clinic branches');
        console.error('Error loading clinic branches:', err);
      } finally {
        setLoading(false);
      }
    };

    loadBranches();
  }, []);

  // Load favorites from localStorage
  useEffect(() => {
    const savedFavorites = localStorage.getItem('clinic-favorites');
    if (savedFavorites) {
      try {
        const favoriteIds = JSON.parse(savedFavorites);
        setFavorites(new Set(favoriteIds));
      } catch (err) {
        console.error('Error loading favorites:', err);
      }
    }
  }, []);

  // Apply filters and sorting
  useEffect(() => {
    const applyFilters = async () => {
      let filtered = [...branches];

      // Apply search filter
      if (searchQuery.trim()) {
        filtered = filtered.filter(branch =>
          branch.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          branch.branchName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          branch.address.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
          branch.serviceHighlights.some(service =>
            service.name.toLowerCase().includes(searchQuery.toLowerCase())
          )
        );
      }

      // Apply location filter
      if (selectedLocation) {
        filtered = filtered.filter(branch =>
          branch.address.city.toLowerCase() === selectedLocation.toLowerCase() ||
          branch.branchName?.toLowerCase() === selectedLocation.toLowerCase()
        );
      }

      // Apply availability filter
      if (selectedAvailability !== 'all') {
        const filters: ClinicBranchFilters = {
          availability: selectedAvailability
        };
        
        try {
          const filterResponse = await filterClinicBranches(filters);
          if (filterResponse.success && filterResponse.data) {
            const availableIds = new Set(filterResponse.data.map(b => b.id));
            filtered = filtered.filter(branch => availableIds.has(branch.id));
          }
        } catch (err) {
          console.error('Error applying availability filter:', err);
        }
      }

      // Apply sorting
      filtered = sortClinicBranches(filtered, sortBy);

      // Apply max branches limit
      if (maxBranches && maxBranches > 0) {
        filtered = filtered.slice(0, maxBranches);
      }

      setFilteredBranches(filtered);
      setCurrentSlide(0); // Reset to first slide when filters change
    };

    applyFilters();
  }, [branches, searchQuery, selectedLocation, selectedAvailability, sortBy, maxBranches]);

  const handleToggleFavorite = (branchId: string) => {
    const newFavorites = new Set(favorites);
    
    if (newFavorites.has(branchId)) {
      newFavorites.delete(branchId);
    } else {
      newFavorites.add(branchId);
    }
    
    setFavorites(newFavorites);
    localStorage.setItem('clinic-favorites', JSON.stringify([...newFavorites]));
  };

  const handlePrevSlide = () => {
    setCurrentSlide(prev => 
      prev === 0 ? Math.max(0, filteredBranches.length - 3) : Math.max(0, prev - 1)
    );
  };

  const handleNextSlide = () => {
    setCurrentSlide(prev => 
      prev >= filteredBranches.length - 3 ? 0 : prev + 1
    );
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedLocation('');
    setSelectedAvailability('all');
    setSortBy('name');
  };

  const uniqueLocations = [...new Set(branches.map(b => b.address.city))];

  if (loading) {
    return (
      <div className={`py-16 ${className}`}>
        <div className="container mx-auto px-4">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-gray-600">Loading clinic branches...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`py-16 ${className}`}>
        <div className="container mx-auto px-4">
          <ErrorMessage 
            message={error}
            onRetry={() => window.location.reload()}
          />
        </div>
      </div>
    );
  }

  return (
    <section className={`py-16 bg-gray-50 ${className}`}>
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <BuildingOfficeIcon className="h-8 w-8 text-blue-600 mr-3" />
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Our Clinic Branches
            </h2>
          </div>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Choose from our three convenient locations across Egypt. Each branch offers 
            comprehensive dental care with modern facilities and experienced professionals.
          </p>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mb-8">
            {/* Mobile Filter Toggle */}
            <div className="md:hidden mb-4">
              <button
                onClick={() => setShowFiltersPanel(!showFiltersPanel)}
                className="flex items-center justify-center w-full px-4 py-2 bg-white border border-gray-300 
                         rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
              >
                <FunnelIcon className="h-5 w-5 mr-2" />
                Filters & Search
              </button>
            </div>

            {/* Filter Panel */}
            <div className={`
              bg-white rounded-lg shadow-sm border border-gray-200 p-6 transition-all duration-300
              ${showFiltersPanel || 'hidden md:block'}
            `}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Search */}
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search branches, services..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 
                             focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Location Filter */}
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 
                           focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Locations</option>
                  {uniqueLocations.map(location => (
                    <option key={location} value={location}>{location}</option>
                  ))}
                </select>

                {/* Availability Filter */}
                <select
                  value={selectedAvailability}
                  onChange={(e) => setSelectedAvailability(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 
                           focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Hours</option>
                  <option value="now">Open Now</option>
                  <option value="today">Open Today</option>
                </select>

                {/* Sort By */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 
                           focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="name">Sort by Name</option>
                  <option value="rating">Sort by Rating</option>
                  <option value="availability">Sort by Availability</option>
                </select>
              </div>

              {/* Active Filters & Clear */}
              {(searchQuery || selectedLocation || selectedAvailability !== 'all' || sortBy !== 'name') && (
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex flex-wrap gap-2">
                    {searchQuery && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                        Search: "{searchQuery}"
                      </span>
                    )}
                    {selectedLocation && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                        Location: {selectedLocation}
                      </span>
                    )}
                    {selectedAvailability !== 'all' && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                        {selectedAvailability === 'now' ? 'Open Now' : 'Open Today'}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={clearFilters}
                    className="text-sm text-gray-600 hover:text-gray-900 underline"
                  >
                    Clear All
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Results Count */}
        <div className="mb-6 text-center">
          <p className="text-gray-600">
            Showing {filteredBranches.length} of {branches.length} clinic branches
          </p>
        </div>

        {/* Clinic Cards */}
        {filteredBranches.length === 0 ? (
          <div className="text-center py-12">
            <MapIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No branches found</h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your filters or search terms to find clinic branches.
            </p>
            <button
              onClick={clearFilters}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                       transition-colors duration-200"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="relative">
            {/* Desktop Grid Layout */}
            <div className="hidden lg:grid lg:grid-cols-3 gap-8">
              {filteredBranches.map((branch) => (
                <ClinicBranchCard
                  key={branch.id}
                  branch={branch}
                  onBookAppointment={onBookAppointment}
                  onViewDetails={onViewBranchDetails}
                  showFavorite={showFavorites}
                  isFavorite={favorites.has(branch.id)}
                  onToggleFavorite={handleToggleFavorite}
                />
              ))}
            </div>

            {/* Mobile/Tablet Carousel */}
            <div className="lg:hidden">
              <div className="relative overflow-hidden">
                <div 
                  className="flex transition-transform duration-300 ease-in-out"
                  style={{ 
                    transform: `translateX(-${currentSlide * (100 / Math.min(filteredBranches.length, 2))}%)`,
                    width: `${Math.max(filteredBranches.length * 50, 100)}%`
                  }}
                >
                  {filteredBranches.map((branch) => (
                    <div 
                      key={branch.id} 
                      className="w-full md:w-1/2 flex-shrink-0 px-2"
                    >
                      <ClinicBranchCard
                        branch={branch}
                        onBookAppointment={onBookAppointment}
                        onViewDetails={onViewBranchDetails}
                        showFavorite={showFavorites}
                        isFavorite={favorites.has(branch.id)}
                        onToggleFavorite={handleToggleFavorite}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Carousel Controls */}
              {filteredBranches.length > 1 && (
                <div className="flex items-center justify-center mt-6 space-x-4">
                  <button
                    onClick={handlePrevSlide}
                    disabled={currentSlide === 0}
                    className="p-2 rounded-full bg-white border border-gray-300 text-gray-600 
                             hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed
                             transition-colors duration-200"
                  >
                    <ChevronLeftIcon className="h-5 w-5" />
                  </button>

                  {/* Dots Indicator */}
                  <div className="flex space-x-2">
                    {Array.from({ length: Math.max(1, filteredBranches.length - 1) }).map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentSlide(index)}
                        className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                          currentSlide === index ? 'bg-blue-600' : 'bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>

                  <button
                    onClick={handleNextSlide}
                    disabled={currentSlide >= filteredBranches.length - 1}
                    className="p-2 rounded-full bg-white border border-gray-300 text-gray-600 
                             hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed
                             transition-colors duration-200"
                  >
                    <ChevronRightIcon className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Call to Action */}
        <div className="text-center mt-12">
          <p className="text-gray-600 mb-6">
            Can't decide which branch is right for you? We're here to help!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => onBookAppointment?.('any')}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 
                       transition-colors duration-200 focus:outline-none focus:ring-2 
                       focus:ring-blue-500 focus:ring-opacity-50"
            >
              Book at Any Branch
            </button>
            <a
              href="tel:+20123456789"
              className="px-8 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium 
                       hover:bg-gray-50 transition-colors duration-200 focus:outline-none 
                       focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
            >
              Call for Guidance
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ClinicBranchesShowcase;