import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Card, Badge } from '../components/ui';
import HeroSection from '../components/homepage/HeroSection';
import ServicesSection from '../components/homepage/ServicesSection';
import {
  Phone,
  MapPin,
  Clock,
  Star,
  Shield,
  Award,
  Users,
  Calendar,
  Smile,
  CheckCircle,
  Mail,
  Facebook,
  Twitter,
  Instagram,
  MessageCircle,
  ArrowRight,
  Heart,
  Zap,

} from 'lucide-react';

import { getUsersByRole } from '../services/userService';
import type { User as UserType } from '../types';
import { useNavigate } from 'react-router-dom'
import { useSectionImpression } from '../hooks/useSectionImpression'
import { trackEvent } from '../utils/analytics'

const Home: React.FC = () => {
  const { t } = useTranslation();
  const [dentists, setDentists] = useState<UserType[]>([]);
  const [, setLoading] = useState(true);

  // Fetch real data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [dentistsResponse] = await Promise.all([
          getUsersByRole('dentist', { limit: 6 })
        ]);

        if (dentistsResponse.success) {
          setDentists(dentistsResponse.data);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const clinicLocations = {
    attsa: {
      name: 'Dr. Gamal Abdel Nasser Center for Laser Dental Implants and Aesthetics',
      address: 'In front of Attsa Preparatory School, Attsa, Fayoum, Egypt',
      phone: '+201017848825',
      hours: {
        weekdays: 'Sunday - Thursday: 12:00 PM - 11:00 PM',
        friday: 'Friday: Closed',
        saturday: 'Saturday: 12:00 PM - 11:00 PM',
        emergency: '24/7 Emergency Care Available'
      },
      mapUrl: 'https://maps.google.com/?q=Attsa+Preparatory+School+Attsa+Fayoum+Egypt',
      services: [
        'Dental treatment',
        'Laser filling',
        'Root canal filling',
        'Children\'s filling',
        'Regular filling',
        'Regular and surgical extraction',
        'Implants',
        'Installation',
        'Teeth whitening services'
      ]
    },
    fayoum: {
      name: 'Center for Laser Dental Implants and Aesthetics',
      address: 'Al-Nabawi Street, in front of General Hospital, Fayoum, Egypt',
      phone: '+201017848825',
      hours: {
        weekdays: 'Sunday - Thursday: 12:00 PM - 11:00 PM',
        friday: 'Friday: Closed',
        saturday: 'Saturday: 12:00 PM - 11:00 PM',
        emergency: '24/7 Emergency Care Available'
      },
      mapUrl: 'https://maps.google.com/?q=Al-Nabawi+Street+General+Hospital+Fayoum+Egypt',
      services: [
        'Dental treatment',
        'Laser filling',
        'Root canal filling',
        'Children\'s filling',
        'Regular filling',
        'Regular and surgical extraction',
        'Implants',
        'Installation',
        'Teeth whitening services'
      ]
    }
  };

  const _services = [
    {
      icon: <Zap className="w-8 h-8" />,
      title: 'Laser Dental Treatment',
      description: 'Advanced laser technology for precise, comfortable, and minimally invasive dental procedures with faster healing times.'
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: 'Dental Implants',
      description: 'State-of-the-art dental implants to replace missing teeth with natural-looking, permanent solutions.'
    },
    {
      icon: <Star className="w-8 h-8" />,
      title: 'Cosmetic Dentistry',
      description: 'Professional teeth whitening, veneers, and aesthetic treatments to give you the perfect smile.'
    },
    {
      icon: <Heart className="w-8 h-8" />,
      title: 'Root Canal Treatment',
      description: 'Pain-free root canal procedures using modern techniques to save your natural teeth.'
    },
    {
      icon: <Smile className="w-8 h-8" />,
      title: 'Pediatric Dentistry',
      description: 'Specialized dental care for children in a comfortable, child-friendly environment.'
    },
    {
      icon: <CheckCircle className="w-8 h-8" />,
      title: 'Oral Surgery',
      description: 'Expert surgical procedures including extractions, wisdom teeth removal, and advanced oral surgery.'
    }
  ];

  const testimonials = [
    {
      name: 'Ahmed Hassan',
      rating: 5,
      text: 'Dr. Gamal and his team provided exceptional care during my dental implant procedure. The laser technology made the process virtually painless, and the results exceeded my expectations.',
      treatment: 'Dental Implants'
    },
    {
      name: 'Fatima Al-Zahra',
      rating: 5,
      text: 'I was amazed by the professionalism and modern equipment at the clinic. My root canal treatment was completed efficiently with minimal discomfort. Highly recommended!',
      treatment: 'Root Canal Treatment'
    },
    {
      name: 'Mohamed Abdel Rahman',
      rating: 5,
      text: 'The teeth whitening service transformed my smile completely. The staff was friendly and the clinic environment was very clean and comfortable.',
      treatment: 'Teeth Whitening'
    },
    {
      name: 'Nour El-Din',
      rating: 5,
      text: 'Excellent pediatric care for my children. Dr. Moamen was patient and gentle, making the dental visit a positive experience for my kids.',
      treatment: 'Pediatric Dentistry'
    }
  ];

  // Use real dentist data or fallback to static data
  const teamMembers = dentists.length > 0 ? dentists.slice(0, 2).map(dentist => {
    // Map real doctor images based on their names
    let doctorImage = '/images/dr-placeholder.jpg';
    if (dentist.firstName?.toLowerCase().includes('gamal')) {
      doctorImage = '/images/Dr.Gamal.jpg';
    } else if (dentist.firstName?.toLowerCase().includes('moamen')) {
      doctorImage = '/images/Dr.Momen.jpg';
    }

    return {
      name: `${dentist.firstName} ${dentist.lastName}`,
      title: 'Dentist',
      credentials: dentist.specialization || 'General Dentistry',
      image: dentist.profileImage || doctorImage,
      phone: dentist.phone
    };
  }) : [
    {
      name: 'Dr. Gamal Abdel Nasser Khattab',
      title: 'Lead Dentist & Practice Owner',
      credentials: 'Oral and Dental Medicine and Surgery Specialist',
      image: '/images/Dr.Gamal.jpg',
      phone: '+201070721469'
    },
    {
      name: 'Dr. Moamen Al-Banna',
      title: 'Senior Dentist',
      credentials: 'Oral and Dental Medicine and Surgery Specialist',
      image: '/images/Dr.Momen.jpg',
      phone: '+201070721470'
    }
  ];

  const [currentTestimonialIndex, setCurrentTestimonialIndex] = useState(0);
  const navigate = useNavigate()
  const statsRef = useSectionImpression('home.stats')
  const newPatientRef = useSectionImpression('home.new_patient')
  const clinicsRef = useSectionImpression('home.clinics')
  const testimonialsRef = useSectionImpression('home.testimonials')
  const teamRef = useSectionImpression('home.team')
  const whyUsRef = useSectionImpression('home.why_us')
  const newsletterRef = useSectionImpression('home.newsletter')
  const footerRef = useSectionImpression('home.footer')
  const [newsletterEmail, setNewsletterEmail] = useState('')

  const handleNextTestimonial = () => {
    setCurrentTestimonialIndex((prevIndex) => (prevIndex + 1) % testimonials.length);
  };

  const handlePrevTestimonial = () => {
    setCurrentTestimonialIndex((prevIndex) => (prevIndex - 1 + testimonials.length) % testimonials.length);
  };

  // Clinic Locations - Updated to focus on single location without selection
  return (
    <div className="min-h-screen">

      {/* Enhanced Hero Section */}
      <HeroSection />

      {/* Quick Stats Section */}
      <section className="py-16 bg-white" role="region" aria-label="Practice statistics" ref={statsRef}>
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-blue-600 mb-2">10K+</div>
              <div className="text-gray-600 font-medium">Happy Patients</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-green-600 mb-2">15+</div>
              <div className="text-gray-600 font-medium">Years Experience</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-purple-600 mb-2">24/7</div>
              <div className="text-gray-600 font-medium">Emergency Care</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-orange-600 mb-2">4.9★</div>
              <div className="text-gray-600 font-medium">Patient Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* New Patient CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-50 to-indigo-50" role="region" aria-label="New patient information" ref={newPatientRef}>
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <Badge className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full mb-4">
                New Patient Special - 20% Off First Visit
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Start Your Journey to Perfect Oral Health
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Join our growing family of satisfied patients across Fayoum and Attsa. Experience the difference of modern laser dentistry.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <Card className="p-8 text-center hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border-0 bg-white/80 backdrop-blur-sm">
                <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Create Account</h3>
                <p className="text-gray-600 mb-6">
                  Quick 2-minute signup to access our patient portal and manage your care.
                </p>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white w-full" onClick={() => { trackEvent('cta_card_click', { card: 'sign_up' }); navigate('/register') }}>
                  Sign Up Free
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Card>

              <Card className="p-8 text-center hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border-0 bg-white/80 backdrop-blur-sm">
                <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center">
                  <Calendar className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Book Appointment</h3>
                <p className="text-gray-600 mb-6">
                  Choose your preferred time slot with our easy online booking system.
                </p>
                <Button className="bg-green-600 hover:bg-green-700 text-white w-full" onClick={() => { trackEvent('cta_card_click', { card: 'schedule_now' }); navigate('/appointments/create') }}>
                  Schedule Now
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Card>

              <Card className="p-8 text-center hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border-0 bg-white/80 backdrop-blur-sm">
                <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center">
                  <Smile className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Get Treatment</h3>
                <p className="text-gray-600 mb-6">
                  Receive personalized care from our experienced dental professionals.
                </p>
                <Button variant="outline" className="border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white w-full" onClick={() => { trackEvent('cta_card_click', { card: 'learn_more' }); navigate('/services') }}>
                  Learn More
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Card>
            </div>

            <div className="text-center">
              <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-6 mb-6">
                <p className="text-lg text-gray-700 mb-4">
                  <strong className="text-green-600">🎉 New Patient Special:</strong> Get 20% off your first consultation and treatment at either location
                </p>
                <p className="text-sm text-gray-600">
                  *Valid for new patients only. Cannot be combined with other offers. Expires December 31, 2024.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4">
                  <Phone className="w-5 h-5 mr-2" />
                  Call Now: +201017848825
                </Button>
                <Button size="lg" variant="outline" className="border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white px-8 py-4">
                  <MessageCircle className="w-5 h-5 mr-2" />
                  WhatsApp Booking
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Clinic Locations */}
      <section className="py-20 bg-white" role="region" aria-label="Clinic locations" ref={clinicsRef}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="bg-green-100 text-green-800 px-4 py-2 rounded-full mb-4">
              Two Convenient Locations
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Visit Our Modern Clinics
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Choose from our two state-of-the-art locations in Fayoum Governorate, both equipped with the latest laser dental technology.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 max-w-7xl mx-auto">
            {/* Attsa Location */}
            <Card className="p-8 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                  <MapPin className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Attsa Branch</h3>
                  <p className="text-blue-600 font-medium">Main Location</p>
                </div>
              </div>

              <h4 className="text-lg font-semibold text-gray-900 mb-4">
                {clinicLocations.attsa.name}
              </h4>

              <div className="space-y-4 mb-6">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-gray-700 font-medium">
                      {clinicLocations.attsa.address}
                    </p>
                    <a
                      href={clinicLocations.attsa.mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium inline-flex items-center mt-1"
                    >
                      View on Google Maps <ArrowRight className="w-3 h-3 ml-1" />
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-blue-600" />
                  <a
                    href={`tel:${clinicLocations.attsa.phone}`}
                    className="text-gray-700 hover:text-blue-600 font-medium"
                  >
                    {clinicLocations.attsa.phone}
                  </a>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-blue-600 mt-1" />
                  <div className="text-gray-700">
                    <p className="font-medium">{clinicLocations.attsa.hours.weekdays}</p>
                    <p className="text-red-600">{clinicLocations.attsa.hours.friday}</p>
                    <p className="font-medium">{clinicLocations.attsa.hours.saturday}</p>
                    <p className="text-green-600 font-medium text-sm mt-1">{clinicLocations.attsa.hours.emergency}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mb-6">
                <Button className="flex-1 bg-blue-600 hover:bg-blue-700">
                  <Calendar className="w-4 h-4 mr-2" />
                  Book Appointment
                </Button>
                <Button variant="outline" className="flex-1">
                  <Phone className="w-4 h-4 mr-2" />
                  Call Now
                </Button>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm text-gray-600 mb-2 font-medium">Available Services:</p>
                <div className="flex flex-wrap gap-2">
                  {clinicLocations.attsa.services.slice(0, 4).map((service, index) => (
                    <Badge key={index} className="bg-blue-50 text-blue-700 text-xs">
                      {service}
                    </Badge>
                  ))}
                  <Badge className="bg-gray-100 text-gray-600 text-xs">
                    +{clinicLocations.attsa.services.length - 4} more
                  </Badge>
                </div>
              </div>
            </Card>

            {/* Fayoum Location */}
            <Card className="p-8 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                  <MapPin className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Fayoum Branch</h3>
                  <p className="text-green-600 font-medium">City Center</p>
                </div>
              </div>

              <h4 className="text-lg font-semibold text-gray-900 mb-4">
                {clinicLocations.fayoum.name}
              </h4>

              <div className="space-y-4 mb-6">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-gray-700 font-medium">
                      {clinicLocations.fayoum.address}
                    </p>
                    <a
                      href={clinicLocations.fayoum.mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-600 hover:text-green-700 text-sm font-medium inline-flex items-center mt-1"
                    >
                      View on Google Maps <ArrowRight className="w-3 h-3 ml-1" />
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-green-600" />
                  <a
                    href={`tel:${clinicLocations.fayoum.phone}`}
                    className="text-gray-700 hover:text-green-600 font-medium"
                  >
                    {clinicLocations.fayoum.phone}
                  </a>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-green-600 mt-1" />
                  <div className="text-gray-700">
                    <p className="font-medium">{clinicLocations.fayoum.hours.weekdays}</p>
                    <p className="text-red-600">{clinicLocations.fayoum.hours.friday}</p>
                    <p className="font-medium">{clinicLocations.fayoum.hours.saturday}</p>
                    <p className="text-green-600 font-medium text-sm mt-1">{clinicLocations.fayoum.hours.emergency}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mb-6">
                <Button className="flex-1 bg-green-600 hover:bg-green-700">
                  <Calendar className="w-4 h-4 mr-2" />
                  Book Appointment
                </Button>
                <Button variant="outline" className="flex-1">
                  <Phone className="w-4 h-4 mr-2" />
                  Call Now
                </Button>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm text-gray-600 mb-2 font-medium">Available Services:</p>
                <div className="flex flex-wrap gap-2">
                  {clinicLocations.fayoum.services.slice(0, 4).map((service, index) => (
                    <Badge key={index} className="bg-green-50 text-green-700 text-xs">
                      {service}
                    </Badge>
                  ))}
                  <Badge className="bg-gray-100 text-gray-600 text-xs">
                    +{clinicLocations.fayoum.services.length - 4} more
                  </Badge>
                </div>
              </div>
            </Card>
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-600 mb-4">
              <strong>Both locations offer:</strong> Free parking • Wheelchair accessible • Modern equipment • Sterilized environment
            </p>
            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white px-8 py-4" onClick={() => { trackEvent('clinic_cta_click', { action: 'book_either_location' }); navigate('/appointments/create') }}>
              <Calendar className="w-5 h-5 mr-2" />
              Book at Either Location
            </Button>
          </div>
        </div>
      </section>

      {/* Enhanced Dental Services Section */}
      <ServicesSection 
        showFilters={false} 
        maxServices={6} 
        showBookingIntegration={true}
      />

      {/* Patient Testimonials Section */}
      <section className="py-16 bg-white" role="region" aria-label="Patient testimonials" ref={testimonialsRef}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {t('home.testimonials.title')}
            </h2>
            <p className="text-xl text-gray-600">
              {t('home.testimonials.description')}
            </p>
          </div>

          <div className="relative max-w-4xl mx-auto">
            <div className="flex overflow-hidden">
              {testimonials.map((testimonial, index) => (
                <div key={index} className="w-full flex-shrink-0 transition-transform duration-500" style={{ transform: `translateX(-${currentTestimonialIndex * 100}%)` }}>
                  <Card className="p-6 mx-auto max-w-md">
                    <div className="flex items-center mb-4">
                      <div className="flex text-yellow-400 mr-2">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-current" />
                        ))}
                      </div>
                      <Badge className="bg-blue-100 text-blue-800 text-xs">
                        {testimonial.treatment}
                      </Badge>
                    </div>
                    <p className="text-gray-600 mb-4 italic">
                      "{testimonial.text}"
                    </p>
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <Smile className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{testimonial.name}</p>
                        <p className="text-sm text-gray-500">{t('home.testimonials.verifiedPatient')}</p>
                      </div>
                    </div>
                  </Card>
                </div>
              ))}
            </div>
            <div className="flex justify-center mt-6 gap-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => { trackEvent('testimonial_dot_click', { index }); setCurrentTestimonialIndex(index) }}
                  className={`w-3 h-3 rounded-full ${currentTestimonialIndex === index ? 'bg-blue-600' : 'bg-gray-300'} transition-colors`}
                  aria-label={`View testimonial ${index + 1}`}
                />
              ))}
            </div>
            <button
              onClick={() => { trackEvent('testimonial_nav', { direction: 'prev' }); handlePrevTestimonial() }}
              className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-white p-2 rounded-full shadow-md hover:bg-gray-100"
              aria-label="Previous testimonial"
            >
              ←
            </button>
            <button
              onClick={() => { trackEvent('testimonial_nav', { direction: 'next' }); handleNextTestimonial() }}
              className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-white p-2 rounded-full shadow-md hover:bg-gray-100"
              aria-label="Next testimonial"
            >
              →
            </button>
          </div>
        </div>
      </section>

      {/* Meet Our Team Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50" role="region" aria-label="Meet our team" ref={teamRef}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full mb-4">
              Expert Team
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Meet Our Dental Specialists
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our experienced team of dental professionals is dedicated to providing you with the highest quality care using the latest techniques and technology.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
            {teamMembers.map((member, index) => (
              <Card key={index} className="p-8 text-center hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-3 bg-white/80 backdrop-blur-sm">
                <div className="relative mb-6">
                  <div className="w-32 h-32 mx-auto rounded-full overflow-hidden bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                    <img
                      src={member.image}
                      alt={member.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCIgdmlld0JveD0iMCAwIDEyOCAxMjgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMjgiIGhlaWdodD0iMTI4IiBmaWxsPSIjRjNGNEY2IiByeD0iNjQiLz4KPHN2ZyB4PSIzMiIgeT0iMzIiIHdpZHRoPSI2NCIgaGVpZ2h0PSI2NCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSIjOUNBM0FGIj4KICA8cGF0aCBkPSJNMTIgMTJjMi4yMSAwIDQtMS43OSA0LTRzLTEuNzktNC00LTQtNCAxLjc5LTQgNCAxLjc5IDQgNCA0em0wIDJjLTIuNjcgMC04IDEuMzQtOCA0djJoMTZ2LTJjMC0yLjY2LTUuMzMtNC04LTR6Ii8+Cjwvc3ZnPgo8L3N2Zz4K`;
                      }}
                    />
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <Award className="w-4 h-4 text-white" />
                  </div>
                </div>

                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {member.name}
                </h3>
                <p className="text-blue-600 font-semibold mb-3">
                  {member.title}
                </p>
                <p className="text-gray-600 mb-4 leading-relaxed">
                  {member.credentials}
                </p>

                {member.phone && (
                  <div className="flex items-center justify-center gap-2 text-gray-600 mb-6">
                    <Phone className="w-4 h-4" />
                    <a
                      href={`tel:${member.phone}`}
                      className="hover:text-blue-600 transition-colors"
                    >
                      {member.phone}
                    </a>
                  </div>
                )}

                <div className="flex justify-center gap-3">
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                    <Calendar className="w-4 h-4 mr-2" />
                    Book with {member.name.split(' ')[1]}
                  </Button>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-100">
                  <div className="flex justify-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span>15+ Years</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4 text-blue-400" />
                      <span>1000+ Patients</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-600 mb-6">
              Both doctors are available at both locations. Schedule your appointment at your preferred clinic.
            </p>
            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4" onClick={() => { trackEvent('team_cta_click'); navigate('/about') }}>
              <Users className="w-5 h-5 mr-2" />
              Meet Our Full Team
            </Button>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-16 md:py-24 bg-white" role="region" aria-label="Why choose us" ref={whyUsRef}>
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge className="bg-purple-100 text-purple-800 px-4 py-2 rounded-full mb-4">
              Why Choose Clear Dental Centers
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Advanced Care, Exceptional Results
            </h2>
            <p className="text-xl text-gray-600">
              Experience the difference of modern laser dentistry combined with personalized care and years of expertise.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <Card className="p-8 text-center hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-3">
              <div className="mb-6">
                <img
                  src="/images/laser-technology.jpg"
                  alt="Laser Technology"
                  className="w-full h-48 object-cover rounded-2xl mx-auto"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjIwMCIgeT0iMTUwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOUNBM0FGIiBmb250LXNpemU9IjE4Ij5MYXNlciBUZWNobm9sb2d5PC90ZXh0Pgo8L3N2Zz4K`;
                  }}
                />
              </div>
              <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Advanced Laser Technology</h3>
              <p className="text-gray-600 leading-relaxed">
                State-of-the-art laser equipment for precise, minimally invasive procedures with faster healing and reduced discomfort.
              </p>
            </Card>

            <Card className="p-8 text-center hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-3">
              <div className="mb-6">
                <img
                  src="/images/experienced-doctors.jpg"
                  alt="Experienced Doctors"
                  className="w-full h-48 object-cover rounded-2xl mx-auto"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjIwMCIgeT0iMTUwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOUNBM0FGIiBmb250LXNpemU9IjE4Ij5FeHBlcmllbmNlZCBEb2N0b3JzPC90ZXh0Pgo8L3N2Zz4K`;
                  }}
                />
              </div>
              <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Expert Specialists</h3>
              <p className="text-gray-600 leading-relaxed">
                Highly qualified oral and dental medicine specialists with over 15 years of experience in advanced dental procedures.
              </p>
            </Card>

            <Card className="p-8 text-center hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-3">
              <div className="mb-6">
                <img
                  src="/images/patient-comfort.jpg"
                  alt="Patient Comfort"
                  className="w-full h-48 object-cover rounded-2xl mx-auto"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjIwMCIgeT0iMTUwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOUNBM0FGIiBmb250LXNpemU9IjE4Ij5QYXRpZW50IENvbWZvcnQ8L3RleHQ+Cjwvc3ZnPgo=`;
                  }}
                />
              </div>
              <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Patient-Centered Care</h3>
              <p className="text-gray-600 leading-relaxed">
                Comfortable, modern facilities with a focus on patient comfort, safety, and personalized treatment plans for every individual.
              </p>
            </Card>
          </div>

          <div className="text-center">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto mb-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">15+</div>
                <div className="text-gray-600">Years Experience</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">5000+</div>
                <div className="text-gray-600">Happy Patients</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">2</div>
                <div className="text-gray-600">Modern Locations</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600 mb-2">24/7</div>
                <div className="text-gray-600">Emergency Care</div>
              </div>
            </div>

            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4" onClick={() => { trackEvent('why_us_cta_click'); navigate('/services') }}>
              <Calendar className="w-5 h-5 mr-2" />
              Experience the Difference
            </Button>
          </div>
        </div>
      </section>

      {/* Newsletter & Contact Section */}
      <section className="py-16 bg-blue-600 text-white" role="region" aria-label="Newsletter signup" ref={newsletterRef}>
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t('home.newsletter.title')}
            </h2>
            <p className="text-xl mb-8 opacity-90">
              {t('home.newsletter.description')}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto mb-8">
              <input
                type="email"
                placeholder={t('home.newsletter.emailPlaceholder')}
                className="flex-1 px-4 py-3 rounded-lg text-gray-900 placeholder-gray-500"
              />
              <Button className="bg-white text-blue-600 hover:bg-gray-100 px-6 py-3">
                <Mail className="w-4 h-4 mr-2" />
                {t('home.newsletter.subscribe')}
              </Button>
            </div>

            <div className="flex justify-center gap-6">
              <a href="#" className="text-white hover:text-blue-200 transition-colors">
                <Facebook className="w-6 h-6" />
              </a>
              <a href="#" className="text-white hover:text-blue-200 transition-colors">
                <Twitter className="w-6 h-6" />
              </a>
              <a href="#" className="text-white hover:text-blue-200 transition-colors">
                <Instagram className="w-6 h-6" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12" role="contentinfo">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Company Info */}
            <div>
              <h3 className="text-xl font-bold mb-4">Clear Dental Centers</h3>
              <p className="text-gray-400 mb-4">
                Advanced laser dental care with expert specialists serving the Fayoum community since 2015. Your smile is our priority.
              </p>
              <div className="flex gap-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <Facebook className="w-5 h-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <Twitter className="w-5 h-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <Instagram className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-lg font-semibold mb-4">{t('home.footer.quickLinks.title')}</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">{t('home.footer.quickLinks.aboutUs')}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{t('home.footer.quickLinks.ourServices')}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{t('home.footer.quickLinks.ourTeam')}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{t('home.footer.quickLinks.patientPortal')}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{t('home.footer.quickLinks.insurance')}</a></li>
              </ul>
            </div>

            {/* Services */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Our Services</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Laser Dental Treatment</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Dental Implants</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Root Canal Treatment</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Teeth Whitening</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pediatric Dentistry</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Oral Surgery</a></li>
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Contact Information</h4>
              <div className="space-y-3 text-gray-400">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  <a href="tel:+201017848825" className="hover:text-white transition-colors">
                    +201017848825
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <a href="mailto:info@cleardentalcenters.com" className="hover:text-white transition-colors">
                    info@cleardentalcenters.com
                  </a>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 mt-1" />
                  <div>
                    <p className="mb-2">Attsa Branch: In front of Attsa Preparatory School, Attsa, Fayoum</p>
                    <p>Fayoum Branch: Al-Nabawi Street, in front of General Hospital, Fayoum</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <div>
                    <p>Sun-Thu: 12:00 PM - 11:00 PM</p>
                    <p>Sat: 12:00 PM - 11:00 PM</p>
                    <p className="text-red-400">Friday: Closed</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-gray-400 text-sm">
                © 2024 Clear Dental Centers. All rights reserved. | Dr. Gamal Abdel Nasser Center for Laser Dental Implants and Aesthetics
              </p>
              <div className="flex gap-6 text-sm text-gray-400">
                <a href="#" className="hover:text-white transition-colors">{t('home.footer.privacyPolicy')}</a>
                <a href="#" className="hover:text-white transition-colors">{t('home.footer.termsOfService')}</a>
                <a href="#" className="hover:text-white transition-colors">{t('home.footer.hipaaNotice')}</a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Chat Widget */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg">
          <MessageCircle className="w-6 h-6" />
        </Button>
      </div>
    </div>
  );
};

export default Home;