import React from 'react';
import ProfileSettings from '../settings/ProfileSettings';
import { useTranslation } from 'react-i18next';

const Profile: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{t('profile.title')}</h1>
          <p className="text-gray-600 mt-2">
            {t('profile.description')}
          </p>
        </div>
        
        <ProfileSettings />
      </div>
    </div>
  );
};

export default Profile;