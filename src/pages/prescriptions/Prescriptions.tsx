import React from 'react';
import { PrescriptionList } from '../../components/prescriptions/PrescriptionList';
import { useTranslation } from 'react-i18next';

const Prescriptions: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{t('prescriptions.title')}</h1>
        <p className="text-gray-600 mt-2">
          {t('prescriptions.description')}
        </p>
      </div>
      
      <PrescriptionList />
    </div>
  );
};

export default Prescriptions;