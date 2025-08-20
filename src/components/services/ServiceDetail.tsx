import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Clock, 
  DollarSign, 
  CheckCircle, 
  // ArrowRight, 
  Star, 
  Users, 
  Shield, 
  // Award,
  Calendar,
  Phone,
  MessageCircle
} from 'lucide-react';
import { Card, Button } from '../ui';
import AppointmentBooking from '../appointment/AppointmentBooking';

interface ServiceDetailProps {
  serviceKey: string;
}

interface ServiceInfo {
  title: string;
  description: string;
  duration: string;
  price: string;
  benefits: string[];
  procedure: string[];
  aftercare: string[];
  faqs: Array<{
    question: string;
    answer: string;
  }>;
  testimonials: Array<{
    name: string;
    rating: number;
    comment: string;
    date: string;
  }>;
}

const ServiceDetail: React.FC<ServiceDetailProps> = ({ serviceKey }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('overview');

  const services: Record<string, ServiceInfo> = {
    'preventive-care': {
      title: t('services.preventiveCare.title'),
      description: t('services.preventiveCare.description'),
      duration: '30-60 minutes',
      price: '$50-150',
      benefits: [
        'Prevents cavities and gum disease',
        'Early detection of oral health issues',
        'Professional cleaning removes plaque and tartar',
        'Fresh breath and improved confidence',
        'Saves money on future dental treatments'
      ],
      procedure: [
        'Comprehensive oral examination',
        'Professional teeth cleaning',
        'X-rays if needed',
        'Oral cancer screening',
        'Treatment recommendations'
      ],
      aftercare: [
        'Brush twice daily with fluoride toothpaste',
        'Floss daily',
        'Use mouthwash as recommended',
        'Schedule follow-up appointments',
        'Maintain healthy diet'
      ],
      faqs: [
        {
          question: 'How often should I get a dental checkup?',
          answer: 'Most people should visit the dentist every 6 months for a routine checkup and cleaning.'
        },
        {
          question: 'Is dental cleaning painful?',
          answer: 'Dental cleaning is generally not painful, though some patients may experience mild discomfort.'
        },
        {
          question: 'What happens during a dental examination?',
          answer: 'The dentist will check your teeth, gums, and mouth for signs of disease or other problems.'
        }
      ],
      testimonials: [
        {
          name: 'Sarah M.',
          rating: 5,
          comment: 'Excellent preventive care! The staff is professional and the cleaning was thorough.',
          date: '2024-01-10'
        },
        {
          name: 'John D.',
          rating: 5,
          comment: 'Great experience. The dentist explained everything clearly and made me feel comfortable.',
          date: '2024-01-05'
        }
      ]
    },
    'cosmetic-dentistry': {
      title: t('services.cosmeticDentistry.title'),
      description: t('services.cosmeticDentistry.description'),
      duration: '1-3 hours',
      price: '$200-2000',
      benefits: [
        'Improves smile appearance',
        'Boosts self-confidence',
        'Corrects dental imperfections',
        'Long-lasting results',
        'Minimal discomfort'
      ],
      procedure: [
        'Initial consultation and smile analysis',
        'Treatment planning and preparation',
        'Procedure execution',
        'Post-treatment care instructions',
        'Follow-up appointments'
      ],
      aftercare: [
        'Avoid staining foods and drinks',
        'Maintain good oral hygiene',
        'Attend follow-up appointments',
        'Use recommended products',
        'Protect teeth from damage'
      ],
      faqs: [
        {
          question: 'How long do cosmetic procedures last?',
          answer: 'The longevity depends on the procedure, but most cosmetic treatments last 5-15 years with proper care.'
        },
        {
          question: 'Are cosmetic procedures covered by insurance?',
          answer: 'Most cosmetic procedures are not covered by insurance as they are considered elective.'
        },
        {
          question: 'Is cosmetic dentistry painful?',
          answer: 'Modern techniques and anesthesia make cosmetic procedures comfortable with minimal pain.'
        }
      ],
      testimonials: [
        {
          name: 'Emily R.',
          rating: 5,
          comment: 'Amazing results! My smile transformation exceeded my expectations.',
          date: '2024-01-15'
        },
        {
          name: 'Michael T.',
          rating: 5,
          comment: 'Professional service and beautiful results. Highly recommended!',
          date: '2024-01-08'
        }
      ]
    }
  };

  const service = services[serviceKey] || services['preventive-care'];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <Star className="w-4 h-4" /> },
    { id: 'procedure', label: 'Procedure', icon: <CheckCircle className="w-4 h-4" /> },
    { id: 'aftercare', label: 'Aftercare', icon: <Shield className="w-4 h-4" /> },
    { id: 'faqs', label: 'FAQs', icon: <MessageCircle className="w-4 h-4" /> },
    { id: 'testimonials', label: 'Reviews', icon: <Users className="w-4 h-4" /> }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Service Details</h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <Clock className="w-5 h-5 text-blue-600 mr-3" />
                    <span className="text-gray-700">Duration: {service.duration}</span>
                  </div>
                  <div className="flex items-center">
                    <DollarSign className="w-5 h-5 text-green-600 mr-3" />
                    <span className="text-gray-700">Price Range: {service.price}</span>
                  </div>
                </div>
              </Card>
              <Card className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Benefits</h3>
                <ul className="space-y-2">
                  {service.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
            <Card className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Why Choose This Service</h3>
              <p className="text-gray-600 leading-relaxed">
                {service.description}
              </p>
            </Card>
          </div>
        );
      
      case 'procedure':
        return (
          <Card className="p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">What to Expect</h3>
            <div className="space-y-4">
              {service.procedure.map((step, index) => (
                <div key={index} className="flex items-start">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-gray-700">{step}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        );
      
      case 'aftercare':
        return (
          <Card className="p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Aftercare Instructions</h3>
            <div className="space-y-4">
              {service.aftercare.map((instruction, index) => (
                <div key={index} className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{instruction}</span>
                </div>
              ))}
            </div>
          </Card>
        );
      
      case 'faqs':
        return (
          <div className="space-y-4">
            {service.faqs.map((faq, index) => (
              <Card key={index} className="p-6">
                <h4 className="font-semibold text-gray-900 mb-2">{faq.question}</h4>
                <p className="text-gray-600">{faq.answer}</p>
              </Card>
            ))}
          </div>
        );
      
      case 'testimonials':
        return (
          <div className="space-y-4">
            {service.testimonials.map((testimonial, index) => (
              <Card key={index} className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                  <div className="flex items-center">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                    ))}
                  </div>
                </div>
                <p className="text-gray-600 mb-2">{testimonial.comment}</p>
                <p className="text-sm text-gray-500">{new Date(testimonial.date).toLocaleDateString()}</p>
              </Card>
            ))}
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">{service.title}</h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">{service.description}</p>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
        <AppointmentBooking />
        <Button variant="outline" className="group">
          <Phone className="w-4 h-4 mr-2" />
          Call for Consultation
        </Button>
      </div>

      {/* Tabs */}
      <div className="mb-8">
        <div className="flex flex-wrap justify-center gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tab.icon}
              <span className="ml-2">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="mb-8">
        {renderTabContent()}
      </div>

      {/* CTA Section */}
      <Card className="p-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-center">
        <h3 className="text-2xl font-bold mb-4">Ready to Get Started?</h3>
        <p className="text-xl mb-6 opacity-90">
          Book your appointment today and take the first step towards a healthier smile.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <AppointmentBooking />
          <Button variant="outline" className="bg-white text-blue-600 hover:bg-gray-100">
            <Calendar className="w-4 h-4 mr-2" />
            Schedule Consultation
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default ServiceDetail;
