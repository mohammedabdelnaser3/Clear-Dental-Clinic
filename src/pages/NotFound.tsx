import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui';

const NotFound: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-gray-200">404</h1>
        <h2 className="text-3xl font-semibold mt-4 mb-6">{t('notFound.title')}</h2>
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          {t('notFound.description')}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/">
            <Button variant="primary">
              {t('notFound.goToHomepage')}
            </Button>
          </Link>
          <Link to="/contact">
            <Button variant="outline">
              {t('notFound.contactSupport')}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;