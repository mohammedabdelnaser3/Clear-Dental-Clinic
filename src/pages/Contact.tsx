import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Input, Textarea, Select, Alert } from '../components/ui';

const Contact: React.FC = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });

  const [formStatus, setFormStatus] = useState<{
    success: boolean;
    message: string;
    show: boolean;
  } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simulate form submission
    setTimeout(() => {
      setFormStatus({
        success: true,
        message: t('form.successMessage'),
        show: true
      });
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
      });
      
      // Hide alert after 5 seconds
      setTimeout(() => {
        setFormStatus(prev => prev ? { ...prev, show: false } : null);
      }, 5000);
    }, 1000);
  };

  const subjectOptions = [
    { value: '', label: t('form.subjectOptions.select') },
    { value: 'general', label: t('form.subjectOptions.general') },
    { value: 'sales', label: t('form.subjectOptions.sales') },
    { value: 'support', label: t('form.subjectOptions.support') },
    { value: 'demo', label: t('form.subjectOptions.demo') },
    { value: 'partnership', label: t('form.subjectOptions.partnership') },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <section className="py-12 md:py-16 mb-12">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">{t('contact.hero.title')}</h1>
          <p className="text-xl text-gray-600 mb-8">{t('contact.hero.description')}</p>
        </div>
      </section>

      {/* Contact Form and Info Section */}
      <section className="py-12 mb-12">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex flex-col md:flex-row gap-12">
            {/* Contact Form */}
            <div className="md:w-2/3">
              <h2 className="text-2xl font-bold mb-6">{t('contactForm.title')}</h2>
              
              {formStatus && formStatus.show && (
                <Alert 
                  variant={formStatus.success ? 'success' : 'error'}
                  title={formStatus.success ? t('contactForm.success') : t('contactForm.error')}
                  dismissible
                  onClose={() => setFormStatus(null)}
                  className="mb-6"
                >
                  {formStatus.message}
                </Alert>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label={t('contactForm.name.label')}
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder={t('contactForm.name.placeholder')}
                    required
                  />
                  
                  <Input
                    label={t('contactForm.email.label')}
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder={t('contactForm.email.placeholder')}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label={t('contactForm.phone.label')}
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder={t('contactForm.phone.placeholder')}
                  />
                  
                  <Select
                    label={t('contactForm.subject.label')}
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    options={subjectOptions}
                    required
                  />
                </div>
                
                <Textarea
                  label={t('contactForm.message.label')}
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder={t('contactForm.message.placeholder')}
                    rows={6}
                    required
                />
                
                <div>
                  <Button type="submit" variant="primary" size="lg">{t('contactForm.submit')}</Button>
                </div>
              </form>
            </div>
            
            {/* Contact Information */}
            <div className="md:w-1/3 bg-gray-50 p-6 rounded-lg">
              <h2 className="text-2xl font-bold mb-6">{t('contactInfo.title')}</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">{t('contactInfo.address.title')}</h3>
                  <p className="text-gray-600" dangerouslySetInnerHTML={{ __html: t('contactInfo.address.value') }} />
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-2">{t('contactInfo.contactDetails.title')}</h3>
                  <p className="text-gray-600 mb-1">
                    <span className="font-medium">{t('contactInfo.contactDetails.email')}:</span> {t('contactInfo.contactDetails.emailValue')}
                  </p>
                  <p className="text-gray-600 mb-1">
                    <span className="font-medium">{t('contactInfo.contactDetails.phone')}:</span> {t('contactInfo.contactDetails.phoneValue')}
                  </p>
                  <p className="text-gray-600">
                    <span className="font-medium">{t('contactInfo.contactDetails.support')}:</span> {t('contactInfo.contactDetails.supportValue')}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-2">{t('contactInfo.businessHours.title')}</h3>
                  <p className="text-gray-600 mb-1">
                    <span className="font-medium">{t('contactInfo.businessHours.weekdays')}:</span> {t('contactInfo.businessHours.weekdaysValue')}
                  </p>
                  <p className="text-gray-600">
                    <span className="font-medium">{t('contactInfo.businessHours.weekends')}:</span> {t('contactInfo.businessHours.closed')}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-2">{t('info.followUs')}</h3>
                  <div className="flex space-x-4">
                    <a href="#" className="text-gray-600 hover:text-blue-600">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                      </svg>
                    </a>
                    <a href="#" className="text-gray-600 hover:text-blue-400">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723 10.054 10.054 0 01-3.127 1.184 4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                      </svg>
                    </a>
                    <a href="#" className="text-gray-600 hover:text-blue-700">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="py-12 mb-12">
        <div className="container mx-auto px-4 max-w-6xl">
          <h2 className="text-2xl font-bold mb-6">{t('contact.map.title')}</h2>
          <div className="w-full h-96 bg-gray-200 rounded-lg overflow-hidden">
            {/* Placeholder for map - in a real app, you would integrate Google Maps or similar */}
            <div className="w-full h-full flex items-center justify-center bg-gray-300">
              <p className="text-gray-600">{t('contact.map.placeholder')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-12 bg-gray-50 rounded-xl mb-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-12">{t('contact.faq.title')}</h2>
          
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-2">{t('contact.faq.questions.gettingStarted.question')}</h3>
              <p className="text-gray-600">
                {t('contact.faq.questions.gettingStarted.answer')}
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-2">{t('contact.faq.questions.training.question')}</h3>
              <p className="text-gray-600">
                {t('contact.faq.questions.training.answer')}
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-2">{t('contact.faq.questions.security.question')}</h3>
              <p className="text-gray-600">
                {t('contact.faq.questions.security.answer')}
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-2">{t('contact.faq.questions.integration.question')}</h3>
              <p className="text-gray-600">
                {t('contact.faq.questions.integration.answer')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">{t('contact.cta.title')}</h2>
          <p className="text-xl mb-8 max-w-3xl mx-auto">
            {t('contact.cta.description')}
          </p>
          <div className="flex justify-center gap-4">
            <Button variant="secondary" size="lg" onClick={() => window.location.href = '/register'}>
              {t('contact.cta.startTrial')}
            </Button>
            <Button 
              variant="outline" 
              className="text-white border-white hover:bg-white hover:text-blue-600" 
              size="lg"
              onClick={() => {
                const formElement = document.querySelector('form');
                if (formElement) {
                  formElement.scrollIntoView({ behavior: 'smooth' });
                }
              }}
            >
              {t('contact.cta.contactUs')}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;