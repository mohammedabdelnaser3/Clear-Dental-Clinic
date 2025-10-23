/* eslint-disable react-refresh/only-export-components */
import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Card, Badge } from '../ui';
import ServiceBookingModal from '../services/ServiceBookingModal';
import { useServiceBooking } from '../../hooks/useServiceBooking';
import { trackEvent } from '../../utils/analytics';
import {
  Zap,
  Shield,
  Star,
  Heart,
  Smile,
  CheckCircle,
  ArrowRight,
  Calendar,
  Phone,
  MessageCircle,
  Search,
  Filter,
  X,
  ChevronDown,
  Eye,
  Sparkles,
  Award,
  Clock,
  Users
} from 'lucide-react';

// Service categories for filtering
export const serviceCategories = [
  { id: 'all', name: 'All Services', icon: <Sparkles className="w-4 h-4" /> },
  { id: 'general', name: 'General Dentistry', icon: <CheckCircle className="w-4 h-4" /> },
  { id: 'cosmetic', name: 'Cosmetic Dentistry', icon: <Star className="w-4 h-4" /> },
  { id: 'orthodontics', name: 'Orthodontics', icon: <Smile className="w-4 h-4" /> },
  { id: 'surgery', name: 'Oral Surgery', icon: <Shield className="w-4 h-4" /> },
  { id: 'pediatric', name: 'Pediatric Dentistry', icon: <Heart className="w-4 h-4" /> },
  { id: 'emergency', name: 'Emergency Care', icon: <Zap className="w-4 h-4" /> }
];

// Enhanced services data with categories and detailed information
export const enhancedServices = [
  {
    id: 'laser-treatment',
    title: 'Laser Dental Treatment',
    category: 'general',
    shortDescription: 'Advanced laser technology for precise, comfortable procedures',
    description: 'State-of-the-art laser technology for precise, comfortable, and minimally invasive dental procedures with faster healing times and reduced discomfort.',
    icon: <Zap className="w-8 h-8" />,
    image: '/images/service-laser.jpg',
    features: [
      'Minimally invasive procedures',
      'Faster healing times',
      'Reduced bleeding and swelling',
      'Precise treatment targeting',
      'Comfortable patient experience'
    ],
    duration: '30-90 minutes',
    price: 'From $150',
    availableAt: ['Fayoum', 'Attsa'],
    rating: 4.9,
    reviewCount: 156,
    isPopular: true,
    isNew: false
  },
  {
    id: 'dental-implants',
    title: 'Dental Implants',
    category: 'surgery',
    shortDescription: 'Permanent tooth replacement solutions',
    description: 'State-of-the-art dental implants to replace missing teeth with natural-looking, permanent solutions that restore function and aesthetics.',
    icon: <Shield className="w-8 h-8" />,
    image: '/images/service-implants.jpg',
    features: [
      'Permanent tooth replacement',
      'Natural appearance and feel',
      'Preserves jawbone structure',
      'Long-lasting solution',
      'Improved chewing function'
    ],
    duration: '2-4 hours',
    price: 'From $800',
    availableAt: ['Fayoum', 'Attsa'],
    rating: 4.8,
    reviewCount: 89,
    isPopular: true,
    isNew: false
  },
  {
    id: 'cosmetic-dentistry',
    title: 'Cosmetic Dentistry',
    category: 'cosmetic',
    shortDescription: 'Transform your smile with aesthetic treatments',
    description: 'Professional teeth whitening, veneers, and aesthetic treatments to give you the perfect smile you\'ve always wanted.',
    icon: <Star className="w-8 h-8" />,
    image: '/images/service-cosmetic.jpg',
    features: [
      'Professional teeth whitening',
      'Porcelain veneers',
      'Smile makeovers',
      'Tooth bonding',
      'Gum contouring'
    ],
    duration: '1-3 hours',
    price: 'From $200',
    availableAt: ['Fayoum', 'Attsa'],
    rating: 4.9,
    reviewCount: 203,
    isPopular: true,
    isNew: false
  },
  {
    id: 'root-canal',
    title: 'Root Canal Treatment',
    category: 'general',
    shortDescription: 'Pain-free endodontic therapy',
    description: 'Pain-free root canal procedures using modern techniques to save your natural teeth and eliminate infection.',
    icon: <Heart className="w-8 h-8" />,
    image: '/images/service-root-canal.jpg',
    features: [
      'Pain-free procedures',
      'Save natural teeth',
      'Advanced techniques',
      'Single-visit treatment',
      'Long-term success'
    ],
    duration: '60-90 minutes',
    price: 'From $300',
    availableAt: ['Fayoum', 'Attsa'],
    rating: 4.7,
    reviewCount: 134,
    isPopular: false,
    isNew: false
  },
  {
    id: 'pediatric-dentistry',
    title: 'Pediatric Dentistry',
    category: 'pediatric',
    shortDescription: 'Gentle dental care for children',
    description: 'Specialized dental care for children in a comfortable, child-friendly environment with gentle techniques and patient approach.',
    icon: <Smile className="w-8 h-8" />,
    image: '/images/service-pediatric.jpg',
    features: [
      'Child-friendly environment',
      'Gentle techniques',
      'Preventive care focus',
      'Behavior management',
      'Parent education'
    ],
    duration: '30-60 minutes',
    price: 'From $80',
    availableAt: ['Fayoum', 'Attsa'],
    rating: 4.9,
    reviewCount: 167,
    isPopular: false,
    isNew: false
  },
  {
    id: 'oral-surgery',
    title: 'Oral Surgery',
    category: 'surgery',
    shortDescription: 'Expert surgical procedures',
    description: 'Expert surgical procedures including extractions, wisdom teeth removal, and advanced oral surgery with modern techniques.',
    icon: <CheckCircle className="w-8 h-8" />,
    image: '/images/service-surgery.jpg',
    features: [
      'Wisdom teeth removal',
      'Tooth extractions',
      'Bone grafting',
      'Sinus lifts',
      'Sedation options'
    ],
    duration: '45-120 minutes',
    price: 'From $250',
    availableAt: ['Fayoum', 'Attsa'],
    rating: 4.8,
    reviewCount: 92,
    isPopular: false,
    isNew: false
  },
  {
    id: 'orthodontics',
    title: 'Orthodontic Treatment',
    category: 'orthodontics',
    shortDescription: 'Straighten your teeth with modern braces',
    description: 'Comprehensive orthodontic treatment including traditional braces, clear aligners, and modern teeth straightening solutions.',
    icon: <Smile className="w-8 h-8" />,
    image: '/images/service-orthodontics.jpg',
    features: [
      'Traditional metal braces',
      'Clear ceramic braces',
      'Invisible aligners',
      'Retainer therapy',
      'Adult orthodontics'
    ],
    duration: '12-24 months',
    price: 'From $1200',
    availableAt: ['Fayoum', 'Attsa'],
    rating: 4.8,
    reviewCount: 78,
    isPopular: false,
    isNew: true
  },
  {
    id: 'emergency-care',
    title: 'Emergency Dental Care',
    category: 'emergency',
    shortDescription: '24/7 urgent dental treatment',
    description: 'Immediate dental care for urgent situations including severe pain, trauma, and dental emergencies available 24/7.',
    icon: <Zap className="w-8 h-8" />,
    image: '/images/service-emergency.jpg',
    features: [
      '24/7 availability',
      'Immediate pain relief',
      'Trauma treatment',
      'Emergency extractions',
      'Same-day appointments'
    ],
    duration: '30-120 minutes',
    price: 'From $100',
    availableAt: ['Fayoum', 'Attsa'],
    rating: 4.9,
    reviewCount: 234,
    isPopular: false,
    isNew: false
  }
];

interface ServicesSectionProps {
  showFilters?: boolean;
  maxServices?: number;
  showBookingIntegration?: boolean;
}

const ServicesSection: React.FC<ServicesSectionProps> = ({ 
  showFilters = true, 
  maxServices,
  showBookingIntegration = true 
}) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFiltersDropdown, setShowFiltersDropdown] = useState(false);
  const [expandedService, setExpandedService] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [selectedServiceForBooking, setSelectedServiceForBooking] = useState<any | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const impressionSentRef = useRef(false);
  const navigate = useNavigate();
  
  // Service booking hook
  const { contactForService } = useServiceBooking();

  // Intersection Observer for animations + analytics impression
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (!impressionSentRef.current) {
            impressionSentRef.current = true;
            trackEvent('section_view', { section: 'services' });
          }
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Filter services based on category and search
  const filteredServices = enhancedServices.filter(service => {
    const matchesCategory = selectedCategory === 'all' || service.category === selectedCategory;
    const matchesSearch = service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.features.some(feature => feature.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  }).slice(0, maxServices);

  const handleServiceExpand = (serviceId: string) => {
    const expanded = expandedService === serviceId ? null : serviceId;
    setExpandedService(expanded);
    trackEvent('service_expand_toggle', { id: serviceId, expanded: !!expanded });
  };

  const handleBookAppointment = (service: any) => {
    setSelectedServiceForBooking(service);
    trackEvent('service_book_click', { id: service.id, title: service.title });
  };

  const handleContactForService = (service: any) => {
    trackEvent('service_contact_click', { id: service.id, channel: 'whatsapp' });
    contactForService(service, 'whatsapp');
  };

  const closeBookingModal = () => {
    setSelectedServiceForBooking(null);
  };

  return (
    <section 
      ref={sectionRef}
      className="py-20 bg-white" 
      role="region" 
      aria-label="Dental services"
    >
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className={`text-center mb-16 transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <Badge className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full mb-4">
            Our Services
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Comprehensive Dental Care
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            From routine cleanings to advanced procedures, we offer complete dental solutions using the latest technology and techniques.
          </p>
        </div>

        {/* Search and Filter Controls */}
        {showFilters && (
          <div className={`mb-12 transition-all duration-1000 delay-200 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            <div className="flex flex-col md:flex-row gap-4 max-w-4xl mx-auto">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search services..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onBlur={() => searchTerm && trackEvent('services_search', { query: searchTerm })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Category Filter */}
              <div className="relative">
                <button
                  onClick={() => setShowFiltersDropdown(!showFiltersDropdown)}
                  className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all min-w-[200px] justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Filter className="w-5 h-5 text-gray-500" />
                    <span className="text-gray-700">
                      {serviceCategories.find(cat => cat.id === selectedCategory)?.name}
                    </span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${
                    showFiltersDropdown ? 'rotate-180' : ''
                  }`} />
                </button>

                {showFiltersDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-10">
                    {serviceCategories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => {
                          setSelectedCategory(category.id);
                          setShowFiltersDropdown(false);
                          trackEvent('services_category_select', { category: category.id });
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors first:rounded-t-xl last:rounded-b-xl ${
                          selectedCategory === category.id ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                        }`}
                      >
                        {category.icon}
                        <span>{category.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Active Filters Display */}
            {(selectedCategory !== 'all' || searchTerm) && (
              <div className="flex flex-wrap gap-2 mt-4 max-w-4xl mx-auto">
                {selectedCategory !== 'all' && (
                  <Badge className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full flex items-center gap-2">
                    {serviceCategories.find(cat => cat.id === selectedCategory)?.name}
                    <button
                      onClick={() => setSelectedCategory('all')}
                      className="hover:bg-blue-200 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
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
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
              </div>
            )}
          </div>
        )}

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {filteredServices.map((service, index) => (
            <Card 
              key={service.id} 
              className={`group relative overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-3 border-0 bg-gradient-to-br from-white to-gray-50 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              data-transition-delay={`${index * 100 + 400}ms`}
            >
              {/* Service Badges */}
              <div className="absolute top-4 left-4 z-10 flex gap-2">
                {service.isPopular && (
                  <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-2 py-1 text-xs">
                    <Award className="w-3 h-3 mr-1" />
                    Popular
                  </Badge>
                )}
                {service.isNew && (
                  <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-2 py-1 text-xs">
                    <Sparkles className="w-3 h-3 mr-1" />
                    New
                  </Badge>
                )}
              </div>

              {/* Service Image */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={service.image}
                  alt={service.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjIwMCIgeT0iMTUwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOUNBM0FGIiBmb250LXNpemU9IjE4Ij4ke3NlcnZpY2UudGl0bGV9PC90ZXh0Pgo8L3N2Zz4=`;
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                {/* Quick View Button */}
                <button
                  onClick={() => handleServiceExpand(service.id)}
                  className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white hover:scale-110"
                >
                  <Eye className="w-5 h-5 text-gray-700" />
                </button>
              </div>

              {/* Service Content */}
              <div className="p-6">
                {/* Service Icon and Title */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center justify-center w-14 h-14 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl text-white group-hover:scale-110 transition-transform duration-300">
                    {service.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {service.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="text-sm text-gray-600">{service.rating}</span>
                      </div>
                      <span className="text-sm text-gray-400">•</span>
                      <span className="text-sm text-gray-600">{service.reviewCount} reviews</span>
                    </div>
                  </div>
                </div>

                {/* Service Description */}
                <p className="text-gray-600 mb-4 leading-relaxed">
                  {service.shortDescription}
                </p>

                {/* Service Details */}
                <div className="flex items-center justify-between text-sm text-gray-500 mb-6">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{service.duration}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>{service.availableAt.join(', ')}</span>
                  </div>
                </div>

                {/* Expandable Details */}
                {expandedService === service.id && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-xl animate-in slide-in-from-top duration-300">
                    <p className="text-gray-700 mb-4">{service.description}</p>
                    <div className="space-y-2">
                      <h4 className="font-semibold text-gray-900">Key Features:</h4>
                      <ul className="space-y-1">
                        {service.features.map((feature, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                {showBookingIntegration && (
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => handleBookAppointment(service)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      Book Now
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => handleContactForService(service)}
                      className="px-4"
                    >
                      <Phone className="w-4 h-4" />
                    </Button>
                  </div>
                )}

                {!showBookingIntegration && (
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => handleServiceExpand(service.id)}
                      className="flex-1 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all duration-300"
                    >
                      {expandedService === service.id ? 'Show Less' : 'Learn More'}
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                    <Link to={`/services/${service.id}`}>
                      <Button 
                        variant="outline"
                        className="px-4"
                        onClick={() => trackEvent('service_view_details', { id: service.id })}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>

        {/* No Results Message */}
        {filteredServices.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No services found</h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search terms or filters to find what you're looking for.
            </p>
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
              }}
            >
              Clear Filters
            </Button>
          </div>
        )}

        {/* Call to Action */}
        <div className={`text-center transition-all duration-1000 delay-600 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Ready to Transform Your Smile?
            </h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Our experienced team is here to provide you with the highest quality dental care using the latest technology and techniques.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4" onClick={() => { trackEvent('services_cta_book'); navigate('/appointments/create'); }}>
                <Calendar className="w-5 h-5 mr-2" />
                Book Appointment
              </Button>
              <Button size="lg" variant="outline" className="border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white px-8 py-4" onClick={() => { trackEvent('services_cta_whatsapp'); window.open('https://wa.me/201017848825?text=Hi%2C%20I%27d%20like%20a%20consultation%20about%20your%20services', '_blank'); }}>
                <MessageCircle className="w-5 h-5 mr-2" />
                WhatsApp Consultation
              </Button>
            </div>
          </div>

          {!maxServices && (
            <div className="flex justify-center">
              <Badge className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 px-6 py-3 rounded-full text-lg font-medium">
                ✨ New Patient Special: 20% Off First Visit
              </Badge>
            </div>
          )}
        </div>
      </div>

      {/* Service Booking Modal */}
      {selectedServiceForBooking && (
        <ServiceBookingModal
          service={selectedServiceForBooking}
          isOpen={!!selectedServiceForBooking}
          onClose={closeBookingModal}
        />
      )}
    </section>
  );
};

export default ServicesSection;