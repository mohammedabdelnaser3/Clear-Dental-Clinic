import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button, Card, Badge } from '../components/ui';
import ServiceBookingModal from '../components/services/ServiceBookingModal';
import { servicesService } from '../services/servicesService';
import { useServiceBooking } from '../hooks/useServiceBooking';
import type { Service } from '../types/services';
import {
  ArrowLeft,
  Star,
  Clock,
  MapPin,
  DollarSign,
  CheckCircle,
  Calendar,
  Phone,
  MessageCircle,
  Award,
  Sparkles,
  Users,
  Shield,
  Heart,
  ArrowRight
} from 'lucide-react';

const ServiceDetail: React.FC = () => {
  const { serviceId } = useParams<{ serviceId: string }>();
  const navigate = useNavigate();
  const [service, setService] = useState<Service | null>(null);
  const [relatedServices, setRelatedServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [_activeImageIndex, _setActiveImageIndex] = useState(0);

  const { contactForService } = useServiceBooking();

  useEffect(() => {
    if (!serviceId) {
      navigate('/services');
      return;
    }

    setLoading(true);
    try {
      const foundService = servicesService.getServiceById(serviceId);
      if (!foundService) {
        navigate('/services');
        return;
      }

      setService(foundService);
      
      // Get related services
      const related = servicesService.getRelatedServices(serviceId, 3);
      setRelatedServices(related);
    } catch (error) {
      console.error('Error loading service:', error);
      navigate('/services');
    } finally {
      setLoading(false);
    }
  }, [serviceId, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading service details...</p>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Not Found</h1>
          <p className="text-gray-600 mb-6">The service you're looking for doesn't exist.</p>
          <Link to="/services">
            <Button>View All Services</Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleBookNow = () => {
    setShowBookingModal(true);
  };

  const handleContact = (method: 'phone' | 'whatsapp') => {
    contactForService(service, method);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Link to="/" className="hover:text-blue-600">Home</Link>
            <span>/</span>
            <Link to="/services" className="hover:text-blue-600">Services</Link>
            <span>/</span>
            <span className="text-gray-900">{service.title}</span>
          </div>
        </div>
      </div>

      {/* Back Button */}
      <div className="container mx-auto px-4 py-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Services
        </button>
      </div>

      {/* Service Header */}
      <section className="bg-white">
        <div className="container mx-auto px-4 py-12">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Service Info */}
            <div>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center text-white">
                  {service.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    {service.isPopular && (
                      <Badge className="bg-orange-100 text-orange-800 px-2 py-1 text-xs">
                        <Award className="w-3 h-3 mr-1" />
                        Popular
                      </Badge>
                    )}
                    {service.isNew && (
                      <Badge className="bg-green-100 text-green-800 px-2 py-1 text-xs">
                        <Sparkles className="w-3 h-3 mr-1" />
                        New
                      </Badge>
                    )}
                  </div>
                  <h1 className="text-4xl font-bold text-gray-900">{service.title}</h1>
                </div>
              </div>

              <div className="flex items-center gap-6 mb-6">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-400 fill-current" />
                  <span className="font-semibold">{service.rating}</span>
                  <span className="text-gray-600">({service.reviewCount} reviews)</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="w-5 h-5" />
                  <span>{service.duration}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <DollarSign className="w-5 h-5" />
                  <span className="font-semibold">{service.price}</span>
                </div>
              </div>

              <p className="text-lg text-gray-700 mb-8 leading-relaxed">
                {service.description}
              </p>

              {/* Quick Actions */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={handleBookNow}
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4"
                >
                  <Calendar className="w-5 h-5 mr-2" />
                  Book Appointment
                </Button>
                <Button
                  onClick={() => handleContact('phone')}
                  variant="outline"
                  size="lg"
                  className="px-8 py-4"
                >
                  <Phone className="w-5 h-5 mr-2" />
                  Call Now
                </Button>
                <Button
                  onClick={() => handleContact('whatsapp')}
                  variant="outline"
                  size="lg"
                  className="px-8 py-4"
                >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  WhatsApp
                </Button>
              </div>
            </div>

            {/* Service Image */}
            <div className="relative">
              <img
                src={service.image}
                alt={service.title}
                className="w-full h-96 object-cover rounded-2xl shadow-lg"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjIwMCIgeT0iMTUwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOUNBM0FGIiBmb250LXNpemU9IjE4Ij4ke3NlcnZpY2UudGl0bGV9PC90ZXh0Pgo8L3N2Zz4=`;
                }}
              />
              
              {/* Trust Indicators */}
              <div className="absolute bottom-4 left-4 right-4">
                <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-green-600" />
                      <span className="text-sm font-medium">Safe & Sterile</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Heart className="w-5 h-5 text-red-500" />
                      <span className="text-sm font-medium">Patient Care</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Service Details */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Features */}
              <Card className="p-8 mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">What's Included</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {service.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Locations */}
              <Card className="p-8 mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Locations</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  {service.availableAt.map((location, index) => (
                    <div key={index} className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                      <MapPin className="w-5 h-5 text-blue-600" />
                      <div>
                        <div className="font-semibold text-gray-900">{location} Branch</div>
                        <div className="text-sm text-gray-600">Available for booking</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Process/What to Expect */}
              <Card className="p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">What to Expect</h2>
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-600 font-semibold text-sm">1</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Initial Consultation</h3>
                      <p className="text-gray-600">Comprehensive examination and treatment planning with our experienced dentist.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-600 font-semibold text-sm">2</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Treatment Procedure</h3>
                      <p className="text-gray-600">Professional treatment using modern equipment and techniques for optimal results.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-600 font-semibold text-sm">3</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Follow-up Care</h3>
                      <p className="text-gray-600">Post-treatment care instructions and follow-up appointments as needed.</p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Sidebar */}
            <div>
              {/* Booking Card */}
              <Card className="p-6 mb-8 sticky top-6">
                <div className="text-center mb-6">
                  <div className="text-3xl font-bold text-gray-900 mb-2">{service.price}</div>
                  <div className="text-gray-600">Starting price</div>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Duration:</span>
                    <span className="font-medium">{service.duration}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Rating:</span>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="font-medium">{service.rating}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Reviews:</span>
                    <span className="font-medium">{service.reviewCount}</span>
                  </div>
                </div>

                <Button
                  onClick={handleBookNow}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white mb-4"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Book Appointment
                </Button>

                <div className="flex gap-2">
                  <Button
                    onClick={() => handleContact('phone')}
                    variant="outline"
                    className="flex-1"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Call
                  </Button>
                  <Button
                    onClick={() => handleContact('whatsapp')}
                    variant="outline"
                    className="flex-1"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    WhatsApp
                  </Button>
                </div>

                <div className="mt-4 pt-4 border-t text-center">
                  <p className="text-sm text-gray-600">
                    <strong>Emergency?</strong> Call us 24/7
                  </p>
                  <p className="text-sm font-semibold text-blue-600">+201017848825</p>
                </div>
              </Card>

              {/* Trust Indicators */}
              <Card className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Why Choose Us</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-green-600" />
                    <span className="text-sm text-gray-700">Sterilized Equipment</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-blue-600" />
                    <span className="text-sm text-gray-700">Experienced Team</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Heart className="w-5 h-5 text-red-500" />
                    <span className="text-sm text-gray-700">Patient-Centered Care</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Award className="w-5 h-5 text-yellow-600" />
                    <span className="text-sm text-gray-700">Quality Guarantee</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Related Services */}
      {relatedServices.length > 0 && (
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Related Services</h2>
              <p className="text-gray-600">You might also be interested in these services</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {relatedServices.map((relatedService) => (
                <Card key={relatedService.id} className="group hover:shadow-lg transition-all duration-300">
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={relatedService.image}
                      alt={relatedService.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjIwMCIgeT0iMTUwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOUNBM0FGIiBmb250LXNpemU9IjE4Ij4ke3JlbGF0ZWRTZXJ2aWNlLnRpdGxlfTwvdGV4dD4KPC9zdmc+`;
                      }}
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{relatedService.title}</h3>
                    <p className="text-gray-600 mb-4">{relatedService.shortDescription}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="text-sm text-gray-600">{relatedService.rating}</span>
                      </div>
                      <Link to={`/services/${relatedService.id}`}>
                        <Button variant="outline" size="sm">
                          Learn More
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Service Booking Modal */}
      {showBookingModal && (
        <ServiceBookingModal
          service={service}
          isOpen={showBookingModal}
          onClose={() => setShowBookingModal(false)}
        />
      )}
    </div>
  );
};

export default ServiceDetail;