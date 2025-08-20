import React from 'react';
import { useTranslation } from 'react-i18next';
import { BillingList } from '../../components/billing/BillingList';

const Billing: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{t('billing.title')}</h1>
        <p className="text-gray-600 mt-2">{t('billing.description')}</p>
      </div>
      
      <BillingList />
    </div>
  );
};

export default Billing;