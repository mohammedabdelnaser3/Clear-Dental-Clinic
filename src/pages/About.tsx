import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Card } from '../components/ui';

const About: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <section className="py-12 md:py-16 mb-12">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">{t('hero.title')}</h1>
          <p className="text-xl text-gray-600 mb-8">{t('hero.description')}</p>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-12 mb-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex flex-col md:flex-row items-center gap-8 mb-12">
            <div className="md:w-1/2">
              <h2 className="text-3xl font-bold mb-4">{t('story.title')}</h2>
              <p className="text-gray-600 mb-4">{t('story.paragraph1')}</p>
              <p className="text-gray-600 mb-4">{t('story.paragraph2')}</p>
              <p className="text-gray-600">{t('story.paragraph3')}</p>
            </div>
            <div className="md:w-1/2">
              <img 
                src="/images/image2.jpg" 
                alt="Our team" 
                className="rounded-lg shadow-lg w-full h-auto" 
              />
            </div>
          </div>
        </div>
      </section>

      {/* Our Mission Section */}
      <section className="py-12 bg-blue-50 rounded-xl mb-12">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h2 className="text-3xl font-bold mb-6">{t('mission.title')}</h2>
          <p className="text-xl mb-8">{t('mission.description')}</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <Card>
              <div className="p-6">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">{t('mission.simplify.title')}</h3>
                <p className="text-gray-600">{t('mission.simplify.description')}</p>
              </div>
            </Card>
            
            <Card>
              <div className="p-6">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">{t('mission.empower.title')}</h3>
                <p className="text-gray-600">{t('mission.empower.description')}</p>
              </div>
            </Card>
            
            <Card>
              <div className="p-6">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">{t('mission.enhance.title')}</h3>
                <p className="text-gray-600">{t('mission.enhance.description')}</p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-12 mb-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-12">{t('team.title')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-32 h-32 bg-gray-200 rounded-full mx-auto mb-4 overflow-hidden">
                <img 
                  src="/images/team-1.jpg" 
                  alt="CEO" 
                  className="w-full h-full object-cover" 
                />
              </div>
              <h3 className="text-xl font-semibold mb-1">{t('team.member1.name')}</h3>
              <p className="text-gray-600 mb-2">{t('team.member1.role')}</p>
              <p className="text-gray-600 text-sm">{t('team.member1.bio')}</p>
            </div>
            
            <div className="text-center">
              <div className="w-32 h-32 bg-gray-200 rounded-full mx-auto mb-4 overflow-hidden">
                <img 
                  src="/images/team-2.jpg" 
                  alt="CTO" 
                  className="w-full h-full object-cover" 
                />
              </div>
              <h3 className="text-xl font-semibold mb-1">{t('team.member2.name')}</h3>
              <p className="text-gray-600 mb-2">{t('team.member2.role')}</p>
              <p className="text-gray-600 text-sm">{t('team.member2.bio')}</p>
            </div>
            
            <div className="text-center">
              <div className="w-32 h-32 bg-gray-200 rounded-full mx-auto mb-4 overflow-hidden">
                <img 
                  src="/images/team-3.jpg" 
                  alt="COO" 
                  className="w-full h-full object-cover" 
                />
              </div>
              <h3 className="text-xl font-semibold mb-1">{t('team.member3.name')}</h3>
              <p className="text-gray-600 mb-2">{t('team.member3.role')}</p>
              <p className="text-gray-600 text-sm">{t('team.member3.bio')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl text-white mb-12">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">{t('cta.title')}</h2>
          <p className="text-xl mb-8 max-w-3xl mx-auto">{t('cta.description')}</p>
          <div className="flex justify-center gap-4">
            <Link to="/contact">
              <Button variant="secondary" size="lg">{t('cta.contact')}</Button>
            </Link>
            <Link to="/register">
              <Button variant="outline" className="text-white border-white hover:bg-white hover:text-blue-600" size="lg">{t('cta.getStarted')}</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;