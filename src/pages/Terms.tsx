import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Terms: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">{t('terms.title')}</h1>
        <p className="text-gray-600 mb-8">{t('terms.lastUpdated')}</p>
        
        <div className="prose prose-lg max-w-none">
          <p>{t('terms.introduction.p1')}</p>
          <p>{t('terms.introduction.p2')}</p>
          <p className="font-bold">{t('terms.introduction.p3')}</p>
          
          <h2 className="text-2xl font-bold mt-8 mb-4">{t('terms.accounts.title')}</h2>
          <p>{t('terms.accounts.p1')}</p>
          <p>{t('terms.accounts.p2')}</p>
          <p>{t('terms.accounts.p3')}</p>

          <h2 className="text-2xl font-bold mt-8 mb-4">{t('terms.intellectualProperty.title')}</h2>
          <p>{t('terms.intellectualProperty.p1')}</p>

          <h2 className="text-2xl font-bold mt-8 mb-4">{t('terms.links.title')}</h2>
          <p>{t('terms.links.p1')}</p>
          <p>{t('terms.links.p2')}</p>
          <p>{t('terms.links.p3')}</p>

          <h2 className="text-2xl font-bold mt-8 mb-4">{t('terms.termination.title')}</h2>
          <p>{t('terms.termination.p1')}</p>
          <p>{t('terms.termination.p2')}</p>
          <p>{t('terms.termination.p3')}</p>

          <h2 className="text-2xl font-bold mt-8 mb-4">{t('terms.indemnification.title')}</h2>
          <p>{t('terms.indemnification.p1')}</p>

          <h2 className="text-2xl font-bold mt-8 mb-4">{t('terms.limitationOfLiability.title')}</h2>
          <p>{t('terms.limitationOfLiability.p1')}</p>

          <h2 className="text-2xl font-bold mt-8 mb-4">{t('terms.disclaimer.title')}</h2>
          <p>{t('terms.disclaimer.p1')}</p>
          <p>{t('terms.disclaimer.p2')}</p>

          <h2 className="text-2xl font-bold mt-8 mb-4">{t('terms.governingLaw.title')}</h2>
          <p>{t('terms.governingLaw.p1')}</p>
          <p>{t('terms.governingLaw.p2')}</p>

          <h2 className="text-2xl font-bold mt-8 mb-4">{t('terms.changes.title')}</h2>
          <p>{t('terms.changes.p1')}</p>
          <p>{t('terms.changes.p2')}</p>

          <h2 className="text-2xl font-bold mt-8 mb-4">{t('terms.contact.title')}</h2>
          <p>{t('terms.contact.p1')}</p>
          <p className="mt-4" dangerouslySetInnerHTML={{ __html: t('terms.contact.address') }} />
        </div>
        
        <div className="mt-12 mb-8 text-center">
          <Link to="/contact" className="text-blue-600 hover:text-blue-800 font-medium">
            {t('terms.contact.link')}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Terms;