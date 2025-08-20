import React from 'react';
import { Calendar, Phone, ArrowRight, Clock, Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui';

const AppointmentCTA: React.FC = () => {
  const { t } = useTranslation();

  const benefits = [
    {
      icon: <Clock className="w-5 h-5" />,
      text: t('appointmentCTA.fastBooking')
    },
    {
      icon: <Shield className="w-5 h-5" />,
      text: t('appointmentCTA.secure')
    },
    {
      icon: <Calendar className="w-5 h-5" />,
      text: t('appointmentCTA.flexible')
    }
  ];

  return (
    <section className="py-16 bg-gradient-to-r from-green-50 to-blue-50">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {t('appointmentCTA.title')}
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              {t('appointmentCTA.description')}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button size="lg" className="btn-primary group">
                <Calendar className="w-5 h-5 mr-2 group-hover:animate-pulse" />
                {t('appointmentCTA.bookOnline')}
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button variant="outline" size="lg" className="btn-outline group">
                <Phone className="w-5 h-5 mr-2" />
                {t('appointmentCTA.callNow')}
              </Button>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-center items-center gap-6 text-sm text-gray-600">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="text-green-500">
                    {benefit.icon}
                  </div>
                  <span>{benefit.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AppointmentCTA;
