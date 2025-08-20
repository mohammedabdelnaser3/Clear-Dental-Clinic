import React from 'react';
import { Users, Smile, Award, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface StatItem {
  icon: React.ReactNode;
  value: string;
  label: string;
  color: string;
}

const StatsSection: React.FC = () => {
  const { t } = useTranslation();

  const stats: StatItem[] = [
    {
      icon: <Users className="w-8 h-8" />,
      value: '10,000+',
      label: t('stats.patients'),
      color: 'text-blue-600'
    },
    {
      icon: <Smile className="w-8 h-8" />,
      value: '4.9/5',
      label: t('stats.rating'),
      color: 'text-green-600'
    },
    {
      icon: <Award className="w-8 h-8" />,
      value: '15+',
      label: t('stats.years'),
      color: 'text-purple-600'
    },
    {
      icon: <Clock className="w-8 h-8" />,
      value: '24/7',
      label: t('stats.emergency'),
      color: 'text-orange-600'
    }
  ];

  return (
    <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t('stats.title')}
          </h2>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">
            {t('stats.description')}
          </p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div 
              key={index}
              className="text-center group animate-fade-in-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={`inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full mb-4 group-hover:scale-110 transition-transform duration-300 ${stat.color}`}>
                {stat.icon}
              </div>
              <div className="text-3xl md:text-4xl font-bold mb-2 group-hover:scale-105 transition-transform duration-300">
                {stat.value}
              </div>
              <p className="text-sm opacity-90 group-hover:opacity-100 transition-opacity duration-300">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
