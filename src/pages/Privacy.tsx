import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Privacy: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">{t('privacy.title')}</h1>
        <p className="text-gray-600 mb-8">{t('privacy.lastUpdated')}</p>
        
        <div className="prose prose-lg max-w-none">
          <p>{t('privacy.introduction')}</p>
          
          <h2 className="text-2xl font-bold mt-8 mb-4">{t('privacy.collection.title')}</h2>
          <p>{t('privacy.collection.intro')}</p>
          
          <h3 className="text-xl font-bold mt-6 mb-3">{t('privacy.collection.personalData.title')}</h3>
          <p>{t('privacy.collection.personalData.content')}</p>
          
          <h3 className="text-xl font-bold mt-6 mb-3">{t('privacy.collection.derivativeData.title')}</h3>
          <p>{t('privacy.collection.derivativeData.content')}</p>
          
          <h3 className="text-xl font-bold mt-6 mb-3">{t('privacy.collection.financialData.title')}</h3>
          <p>{t('privacy.collection.financialData.content')}</p>
          
          <h3 className="text-xl font-bold mt-6 mb-3">{t('privacy.collection.socialMediaData.title')}</h3>
          <p>{t('privacy.collection.socialMediaData.content')}</p>
          
          <h3 className="text-xl font-bold mt-6 mb-3">{t('privacy.collection.mobileDeviceData.title')}</h3>
          <p>{t('privacy.collection.mobileDeviceData.content')}</p>
          
          <h2 className="text-2xl font-bold mt-8 mb-4">{t('privacy.use.title')}</h2>
          <p>{t('privacy.use.intro')}</p>
          
          <ul className="list-disc pl-6 mt-3 mb-6 space-y-2">
            {(t('privacy.use.list', { returnObjects: true }) as string[]).map((item: string, index: number) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
          
          <h2 className="text-2xl font-bold mt-8 mb-4">{t('privacy.disclosure.title')}</h2>
          <p>{t('privacy.disclosure.intro')}</p>
          
          <h3 className="text-xl font-bold mt-6 mb-3">{t('privacy.disclosure.byLaw.title')}</h3>
          <p>{t('privacy.disclosure.byLaw.content')}</p>
          
          <h3 className="text-xl font-bold mt-6 mb-3">{t('privacy.disclosure.thirdParty.title')}</h3>
          <p>{t('privacy.disclosure.thirdParty.content')}</p>
          
          <h3 className="text-xl font-bold mt-6 mb-3">{t('privacy.disclosure.marketing.title')}</h3>
          <p>{t('privacy.disclosure.marketing.content')}</p>
          
          <h3 className="text-xl font-bold mt-6 mb-3">{t('privacy.disclosure.userInteractions.title')}</h3>
          <p>{t('privacy.disclosure.userInteractions.content')}</p>
          
          <h3 className="text-xl font-bold mt-6 mb-3">{t('privacy.disclosure.onlinePostings.title')}</h3>
          <p>{t('privacy.disclosure.onlinePostings.content')}</p>
          
          <h3 className="text-xl font-bold mt-6 mb-3">{t('privacy.disclosure.businessTransfers.title')}</h3>
          <p>{t('privacy.disclosure.businessTransfers.content')}</p>
          
          <h2 className="text-2xl font-bold mt-8 mb-4">{t('privacy.security.title')}</h2>
          <p>{t('privacy.security.content')}</p>
          
          <h2 className="text-2xl font-bold mt-8 mb-4">{t('privacy.childrenPolicy.title')}</h2>
          <p>{t('privacy.childrenPolicy.content')}</p>
          
          <h2 className="text-2xl font-bold mt-8 mb-4">{t('privacy.options.title')}</h2>
          <p>{t('privacy.options.intro')}</p>
          <ul className="list-disc pl-6 mt-3 mb-6 space-y-2">
            {(t('privacy.options.list', { returnObjects: true }) as string[]).map((item: string, index: number) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
          <p>{t('privacy.options.outro')}</p>
          
          <h2 className="text-2xl font-bold mt-8 mb-4">{t('privacy.contact.title')}</h2>
          <p>{t('privacy.contact.intro')}</p>
          <p className="mt-4" dangerouslySetInnerHTML={{ __html: t('privacy.contact.address') }} />
        </div>
        
        <div className="mt-12 mb-8 text-center">
          <Link to="/contact" className="text-blue-600 hover:text-blue-800 font-medium">
            {t('privacy.contact.link')}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Privacy;