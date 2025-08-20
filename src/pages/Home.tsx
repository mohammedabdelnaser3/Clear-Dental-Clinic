import React, { useState, useEffect } from 'react';
// Remove unused Link import since it's not being used anywhere in the code
import { useTranslation } from 'react-i18next';
import { Button, Card, Badge } from '../components/ui';
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
  // Zap,
  CheckCircle,
  Mail,
  Facebook,
  Twitter,
  Instagram,
  MessageCircle
} from 'lucide-react';

import { getUsersByRole } from '../services/userService';
import type { User as UserType } from '../types';

const Home: React.FC = () => {
  const { t } = useTranslation();
  const [selectedLocation, setSelectedLocation] = useState('attsa');
  const [dentists, setDentists] = useState<UserType[]>([]);
  const [_loading, setLoading] = useState(true);
  // Fetch real data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [dentistsResponse] = await Promise.all([
          getUsersByRole('dentist', { limit: 6 })
        ]);
        
        // Removed clinics state since it's not used
        
        if (dentistsResponse.success) {
          setDentists(dentistsResponse.data);
        }
      } catch (_error) {
        console.error('Error fetching data:', _error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const clinicLocations = {
    attsa: {
      name: t('clinicLocations.attsa.name'),
      address: t('clinicLocations.attsa.address'),
      phone: '+201017848825',
      hours: {
        weekdays: t('clinicLocations.attsa.hours.weekdays'),
        friday: t('clinicLocations.attsa.hours.friday'),
        emergency: t('clinicLocations.attsa.hours.emergency')
      },
      mapUrl: 'https://maps.google.com/?q=Attsa+Preparatory+School+Attsa+Fayoum+Egypt'
    },
    fayoum: {
      name: t('clinicLocations.fayoum.name'),
      address: t('clinicLocations.fayoum.address'),
      phone: '+201017848825',
      hours: {
        weekdays: t('clinicLocations.fayoum.hours.weekdays'),
        friday: t('clinicLocations.fayoum.hours.friday'),
        emergency: t('clinicLocations.fayoum.hours.emergency')
      },
      mapUrl: 'https://maps.google.com/?q=Al-Nabawi+Street+General+Hospital+Fayoum+Egypt'
    }
  };

  const services = [
    {
      icon: <Shield className="w-8 h-8" />,
      title: t('services.preventiveCare.title'),
      description: t('services.preventiveCare.description')
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: t('services.cosmeticDentistry.title'),
      description: t('services.cosmeticDentistry.description')
    },
    {
      icon: <Award className="w-8 h-8" />,
      title: t('services.restorativeDentistry.title'),
      description: t('services.restorativeDentistry.description')
    },
    {
      icon: <Calendar className="w-8 h-8" />,
      title: t('services.orthodontics.title'),
      description: t('services.orthodontics.description')
    },
    {
      icon: <Star className="w-8 h-8" />,
      title: t('services.oralSurgery.title'),
      description: t('services.oralSurgery.description')
    },
    {
      icon: <CheckCircle className="w-8 h-8" />,
      title: t('services.emergencyCare.title'),
      description: t('services.emergencyCare.description')
    }
  ];

  const testimonials = [
    {
      name: t('testimonials.testimonial1.name'),
      rating: 5,
      text: t('testimonials.testimonial1.text'),
      treatment: t('testimonials.testimonial1.treatment')
    },
    {
      name: t('testimonials.testimonial2.name'),
      rating: 5,
      text: t('testimonials.testimonial2.text'),
      treatment: t('testimonials.testimonial2.treatment')
    },
    {
      name: t('testimonials.testimonial3.name'),
      rating: 5,
      text: t('testimonials.testimonial3.text'),
      treatment: t('testimonials.testimonial3.treatment')
    }
  ];

  // Use real dentist data or fallback to static data
  // Remove unused teamMembers variable since it's not being used
  dentists.length > 0 ? dentists.slice(0, 3).map(dentist => ({
    name: `Dr. ${dentist.firstName} ${dentist.lastName}`,
    title: 'Dentist',
    credentials: dentist.specialization || 'General Dentistry',
    image: dentist.profileImage || '/images/dr-placeholder.jpg'
  })) : [
    {
      name: 'Dr. James Smith',
      title: 'Lead Dentist & Practice Owner',
      credentials: 'DDS, MS',
      image: '/images/dr-smith.jpg'
    },
    {
      name: 'Dr. Maria Garcia',
      title: 'Pediatric Dentist',
      credentials: 'DDS, Pediatric Specialist',
      image: '/images/dr-garcia.jpg'
    },
    {
      name: 'Dr. Robert Johnson',
      title: 'Oral Surgeon',
      credentials: 'DDS, Oral Surgery Specialist',
      image: '/images/dr-johnson.jpg'
    }
  ];

  return (
    <div className="min-h-screen">
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 to-indigo-100 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center">
            <div className="lg:w-1/2 mb-8 lg:mb-0">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                {t('hero.title')}
                <span className="text-blue-600"> {t('hero.subtitle')}</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                {t('hero.description')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg">
                  <Calendar className="w-5 h-5 mr-2" />
                  {t('hero.bookAppointment')}
                </Button>
                <Button variant="outline" size="lg" className="px-8 py-4 text-lg">
                  <Phone className="w-5 h-5 mr-2" />
                  {t('hero.callNow')}
                </Button>
              </div>
              <div className="flex items-center gap-6 text-sm text-gray-600">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                  {t('hero.hipaaCompliant')}
                </div>
                <div className="flex items-center">
                  <Shield className="w-5 h-5 text-blue-500 mr-2" />
                  {t('hero.adaCertified')}
                </div>
                <div className="flex items-center">
                  <Award className="w-5 h-5 text-yellow-500 mr-2" />
                  {t('home.hero.experience')}
                </div>
              </div>
            </div>
            <div className="lg:w-1/2 flex justify-center">
              <div className="relative">
                <img 
                  src="images/image1.jpg" 
                  alt="Modern dental office with happy patient" 
                  className="rounded-2xl shadow-2xl max-w-full h-auto"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDYwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI2MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjMwMCIgeT0iMjAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOUNBM0FGIiBmb250LXNpemU9IjI0Ij5EZW50YWwgT2ZmaWNlPC90ZXh0Pgo8L3N2Zz4K';
                  }}
                />
                <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-xl shadow-lg">
                  <div className="flex items-center gap-2">
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-current" />
                      ))}
                    </div>
                    <span className="text-sm font-medium">4.9/5 Rating</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">500+ Happy Patients</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Clinic Locations */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {t('home.locations.title')}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t('home.locations.description')}
            </p>
          </div>
          
          <div className="flex justify-center mb-8">
            <div className="bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setSelectedLocation('attsa')}
                className={`px-6 py-3 rounded-md font-medium transition-all ${
                  selectedLocation === 'attsa'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {t('home.locations.attsa')}
              </button>
              <button
                onClick={() => setSelectedLocation('fayoum')}
                className={`px-6 py-3 rounded-md font-medium transition-all ${
                  selectedLocation === 'fayoum'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {t('home.locations.fayoum')}
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="p-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                {clinicLocations[selectedLocation as keyof typeof clinicLocations].name}
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-gray-700">
                      {clinicLocations[selectedLocation as keyof typeof clinicLocations].address}
                    </p>
                    <a 
                      href={clinicLocations[selectedLocation as keyof typeof clinicLocations].mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      {t('home.locations.viewOnMaps')} →
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-blue-600" />
                  <a 
                    href={`tel:${clinicLocations[selectedLocation as keyof typeof clinicLocations].phone}`}
                    className="text-gray-700 hover:text-blue-600 font-medium"
                  >
                    {clinicLocations[selectedLocation as keyof typeof clinicLocations].phone}
                  </a>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-blue-600 mt-1" />
                  <div className="text-gray-700">
                    <p>{clinicLocations[selectedLocation as keyof typeof clinicLocations].hours.weekdays}</p>
                    <p>{clinicLocations[selectedLocation as keyof typeof clinicLocations].hours.friday}</p>
                    <p className="text-red-600 font-medium">{clinicLocations[selectedLocation as keyof typeof clinicLocations].hours.emergency}</p>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <Button className="flex-1">
                  <Calendar className="w-4 h-4 mr-2" />
                  {t('home.locations.bookHere')}
                </Button>
                <Button variant="outline">
                  <Phone className="w-4 h-4 mr-2" />
                  {t('home.locations.call')}
                </Button>
              </div>
            </Card>
            
            <div className="bg-gray-100 rounded-lg overflow-hidden">
              <iframe
                src={`https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3022.1422937950147!2d-73.98731968459391!3d40.75889497932681!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDDCsDQ1JzMyLjAiTiA3M8KwNTknMTQuNCJX!5e0!3m2!1sen!2sus!4v1234567890123`}
                width="100%"
                height="300"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Clinic Location Map"
              ></iframe>
            </div>
          </div>
        </div>
      </section>

      {/* Dental Services Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {t('home.homeServices.title')}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t('home.homeServices.description')}
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {services.map((service, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                <div className="text-blue-600 mb-4">
                  {service.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {service.title}
                </h3>
                <p className="text-gray-600 mb-4">
                  {service.description}
                </p>
                <Button variant="outline" size="sm">
                  {t('home.homeServices.learnMore')} →
                </Button>
              </Card>
            ))}
          </div>
          
          <div className="text-center">
            <Button size="lg" variant="outline">
              {t('home.homeServices.viewAll')}
            </Button>
            <div className="mt-4">
              <Badge className="bg-green-100 text-green-800 px-4 py-2 rounded-full">
                {t('home.homeServices.newPatientSpecial')}
              </Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Patient Testimonials Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {t('home.testimonials.title')}
            </h2>
            <p className="text-xl text-gray-600">
              {t('home.testimonials.description')}
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="p-6">
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
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4">
        <div className="container mx-auto px-4">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {t('home.whyChooseUs.title')}
            </h2>
            <p className="text-xl text-gray-600">
              {t('home.whyChooseUs.description')}
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{t('home.whyChooseUs.cards.experiencedTeam.title')}</h3>
              <p className="text-gray-600">
                {t('home.whyChooseUs.cards.experiencedTeam.description')}
              </p>
            </Card>
            <Card className="p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                <Smile className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{t('home.whyChooseUs.cards.patientCenteredCare.title')}</h3>
              <p className="text-gray-600">
                {t('home.whyChooseUs.cards.patientCenteredCare.description')}
              </p>
            </Card>
            <Card className="p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-purple-100 rounded-full flex items-center justify-center">
                <Award className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{t('home.whyChooseUs.cards.modernTechnology.title')}</h3>
              <p className="text-gray-600">
                {t('home.whyChooseUs.cards.modernTechnology.description')}
              </p>
            </Card>
          </div>
              <Card className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {t('home.team.experiencedDentists.title')}
                </h3>
                <p className="text-gray-600">
                  {t('home.team.experiencedDentists.description')}
                </p>
              </Card>
              <Card className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {t('home.team.gentleCare.title')}
                </h3>
                <p className="text-gray-600">
                  {t('home.team.gentleCare.description')}
                </p>
              </Card>
              <Card className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-purple-100 rounded-full flex items-center justify-center">
                  <Award className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {t('home.team.advancedTechnology.title')}
                </h3>
                <p className="text-gray-600">
                  {t('home.team.advancedTechnology.description')}
                </p>
              </Card>
            </div>
          </div>
          
          <div className="text-center">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Calendar className="w-4 h-4 mr-2" />
              {t('home.team.meetOurTeam')}
            </Button>
          </div>
        </div>
      </section>

      {/* Newsletter & Contact Section */}
      <section className="py-16 bg-blue-600 text-white">
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
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Company Info */}
            <div>
              <h3 className="text-xl font-bold mb-4">{t('home.footer.company.name')}</h3>
              <p className="text-gray-400 mb-4">
                {t('home.footer.company.description')}
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
              <h4 className="text-lg font-semibold mb-4">{t('home.footer.services.title')}</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">{t('home.footer.services.generalDentistry')}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{t('home.footer.services.cosmeticDentistry')}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{t('home.footer.services.oralSurgery')}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{t('home.footer.services.pediatricCare')}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{t('home.footer.services.emergencyCare')}</a></li>
              </ul>
            </div>
            
            {/* Contact Info */}
            <div>
              <h4 className="text-lg font-semibold mb-4">{t('home.footer.contactInfo.title')}</h4>
              <div className="space-y-3 text-gray-400">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  <a href={`tel:${t('home.footer.contactInfo.phone')}`}>
                    {t('home.footer.contactInfo.phone')}
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <a href={`mailto:${t('home.footer.contactInfo.email')}`}>
                    {t('home.footer.contactInfo.email')}
                  </a>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 mt-1" />
                  <div>
                    <p>{t('home.footer.contactInfo.addressAttsa')}</p>
                    <p>{t('home.footer.contactInfo.addressFayoum')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-gray-400 text-sm">
                {t('home.footer.copyright')}
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