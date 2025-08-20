import React from 'react';
import { Link } from 'react-router-dom';
import { Button, Card } from '../components/ui';
import { useTranslation } from 'react-i18next';

const Services: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <section className="py-12 md:py-16 mb-12">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">{t('services.hero.title')}</h1>
        <p className="text-lg text-gray-600 mb-8">
          {t('services.hero.description')}
        </p>
        </div>
      </section>

      {/* Main Services Section */}
      <section className="py-12 mb-12">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
            <div className="flex flex-col">
              <div className="bg-blue-100 p-2 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-4">{t('services.mainServices.appointment.title')}</h2>
              <p className="text-gray-600 mb-4">
                {t('services.mainServices.appointment.description')}
              </p>
              <ul className="list-disc list-inside text-gray-600 mb-6 space-y-2">
                <li>{t('services.mainServices.appointment.features.0')}</li>
                <li>{t('services.mainServices.appointment.features.1')}</li>
                <li>{t('services.mainServices.appointment.features.2')}</li>
                <li>{t('services.mainServices.appointment.features.3')}</li>
                <li>{t('services.mainServices.appointment.features.4')}</li>
              </ul>
              <div className="mt-auto">
                <Link to="/register">
                  <Button variant="outline">{t('services.learnMore')}</Button>
                </Link>
              </div>
            </div>
            
            <div className="flex flex-col">
              <div className="bg-green-100 p-2 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-4">{t('services.mainServices.patient.title')}</h2>
              <p className="text-gray-600 mb-4">
                {t('services.mainServices.patient.description')}
              </p>
              <ul className="list-disc list-inside text-gray-600 mb-6 space-y-2">
                <li>{t('services.mainServices.patient.features.0')}</li>
                <li>{t('services.mainServices.patient.features.1')}</li>
                <li>{t('services.mainServices.patient.features.2')}</li>
                <li>{t('services.mainServices.patient.features.3')}</li>
                <li>{t('services.mainServices.patient.features.4')}</li>
              </ul>
              <div className="mt-auto">
                <Link to="/register">
                  <Button variant="outline">{t('services.learnMore')}</Button>
                </Link>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="flex flex-col">
              <div className="bg-purple-100 p-2 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-4">{t('services.mainServices.reporting.title')}</h2>
              <p className="text-gray-600 mb-4">
                {t('services.mainServices.reporting.description')}
              </p>
              <ul className="list-disc list-inside text-gray-600 mb-6 space-y-2">
                <li>{t('services.mainServices.reporting.features.0')}</li>
                <li>{t('services.mainServices.reporting.features.1')}</li>
                <li>{t('services.mainServices.reporting.features.2')}</li>
                <li>{t('services.mainServices.reporting.features.3')}</li>
                <li>{t('services.mainServices.reporting.features.4')}</li>
              </ul>
              <div className="mt-auto">
                <Link to="/register">
                  <Button variant="outline">{t('services.learnMore')}</Button>
                </Link>
              </div>
            </div>
            
            <div className="flex flex-col">
              <div className="bg-red-100 p-2 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-4">{t('services.mainServices.billing.title')}</h2>
              <p className="text-gray-600 mb-4">
                {t('services.mainServices.billing.description')}
              </p>
              <ul className="list-disc list-inside text-gray-600 mb-6 space-y-2">
                <li>{t('services.mainServices.billing.features.0')}</li>
                <li>{t('services.mainServices.billing.features.1')}</li>
                <li>{t('services.mainServices.billing.features.2')}</li>
                <li>{t('services.mainServices.billing.features.3')}</li>
                <li>{t('services.mainServices.billing.features.4')}</li>
              </ul>
              <div className="mt-auto">
                <Link to="/register">
                  <Button variant="outline">{t('services.learnMore')}</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Additional Services */}
      <section className="py-12 bg-gray-50 rounded-xl mb-12">
        <div className="container mx-auto px-4 max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-12">{t('services.additionalServices.title')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-3">{t('services.additionalServices.telemedicine.title')}</h3>
                <p className="text-gray-600 mb-4">
                  {t('services.additionalServices.telemedicine.description')}
                </p>
                <Link to="/register">
                  <Button variant="link" className="text-blue-600 hover:text-blue-800 p-0">
                    {t('services.learnMoreLink')}
                  </Button>
                </Link>
              </div>
            </Card>
            
            <Card>
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-3">{t('additionalServices.multiClinic.title')}</h3>
                <p className="text-gray-600 mb-4">
                  {t('additionalServices.multiClinic.description')}
                </p>
                <Link to="/register">
                  <Button variant="link" className="text-blue-600 hover:text-blue-800 p-0">
                    {t('services.learnMoreLink')}
                  </Button>
                </Link>
              </div>
            </Card>
            
            <Card>
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-3">{t('services.additionalServices.customIntegrations.title')}</h3>
                <p className="text-gray-600 mb-4">
                  {t('services.additionalServices.customIntegrations.description')}
                </p>
                <Link to="/register">
                  <Button variant="link" className="text-blue-600 hover:text-blue-800 p-0">
                    {t('services.learnMoreLink')}
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-12 mb-12">
        <div className="container mx-auto px-4 max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-6">{t('services.pricing.title')}</h2>
          <p className="text-xl text-gray-600 text-center mb-12 max-w-3xl mx-auto">
            {t('services.pricing.description')}
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border-2 border-gray-200">
              <div className="p-6">
                <h3 className="text-2xl font-bold mb-2">{t('services.pricing.plans.basic.title')}</h3>
                <p className="text-gray-600 mb-6">{t('services.pricing.plans.basic.description')}</p>
                <p className="text-4xl font-bold mb-6">{t('services.pricing.plans.basic.price')}<span className="text-xl text-gray-600 font-normal">{t('services.pricing.plans.basic.period')}</span></p>
                <ul className="mb-8 space-y-3">
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{t('services.pricing.plans.basic.features.0')}</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{t('services.pricing.plans.basic.features.1')}</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Patient records</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Basic reporting</span>
                  </li>
                </ul>
                <Link to="/register">
                  <Button variant="outline" isFullWidth>Get Started</Button>
                </Link>
              </div>
            </Card>
            
            <Card className="border-2 border-blue-500 shadow-lg transform md:-translate-y-4">
              <div className="bg-blue-500 text-white text-center py-2 text-sm font-semibold">
                MOST POPULAR
              </div>
              <div className="p-6">
                <h3 className="text-2xl font-bold mb-2">Professional</h3>
                <p className="text-gray-600 mb-6">For growing practices</p>
                <p className="text-4xl font-bold mb-6">$199<span className="text-xl text-gray-600 font-normal">/month</span></p>
                <ul className="mb-8 space-y-3">
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Up to 5 providers</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>All Basic features</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Advanced reporting</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Telemedicine</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Priority support</span>
                  </li>
                </ul>
                <Link to="/register">
                  <Button variant="primary" isFullWidth>Get Started</Button>
                </Link>
              </div>
            </Card>
            
            <Card className="border-2 border-gray-200">
              <div className="p-6">
                <h3 className="text-2xl font-bold mb-2">Enterprise</h3>
                <p className="text-gray-600 mb-6">For large organizations</p>
                <p className="text-4xl font-bold mb-6">Custom<span className="text-xl text-gray-600 font-normal"></span></p>
                <ul className="mb-8 space-y-3">
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Unlimited providers</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>All Professional features</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Multi-clinic management</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Custom integrations</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Dedicated account manager</span>
                  </li>
                </ul>
                <Link to="/contact">
                  <Button variant="outline" isFullWidth>Contact Sales</Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Transform Your Practice?</h2>
          <p className="text-xl mb-8 max-w-3xl mx-auto">
            Join thousands of healthcare providers who are streamlining their operations with our platform.
          </p>
          <div className="flex justify-center gap-4">
            <Link to="/register">
              <Button variant="secondary" size="lg">Start Free Trial</Button>
            </Link>
            <Link to="/contact">
              <Button variant="outline" className="text-white border-white hover:bg-white hover:text-blue-600" size="lg">Schedule Demo</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Services;