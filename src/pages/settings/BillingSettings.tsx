import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Card, Button, Alert, Badge } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';

interface BillingInfo {
  plan: {
    name: string;
    price: number;
    interval: 'monthly' | 'yearly';
    features: string[];
  };
  nextBillingDate: string;
  paymentMethod: {
    type: 'card' | 'bank';
    last4: string;
    brand?: string;
    expiryMonth?: number;
    expiryYear?: number;
  };
  billingAddress: {
    name: string;
    company?: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}

interface Invoice {
  id: string;
  date: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  downloadUrl: string;
}

const BillingSettings: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  
  // Mock billing data - would come from API in real app
  const [billingInfo] = useState<BillingInfo>({
    plan: {
      name: 'Professional',
      price: 99,
      interval: 'monthly',
      features: [
        t('settings.billing.plans.professional.features.0'),
        t('settings.billing.plans.professional.features.1'),
        t('settings.billing.plans.professional.features.2'),
        t('settings.billing.plans.professional.features.3'),
        t('settings.billing.plans.professional.features.4')
      ]
    },
    nextBillingDate: '2023-07-20',
    paymentMethod: {
      type: 'card',
      last4: '4242',
      brand: 'Visa',
      expiryMonth: 12,
      expiryYear: 2025
    },
    billingAddress: {
      name: 'Dr. John Smith',
      company: 'Smith Dental Clinic',
      street: '123 Main Street',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'US'
    }
  });

  const [invoices] = useState<Invoice[]>([
    {
      id: 'INV-2023-06-001',
      date: '2023-06-20',
      amount: 99,
      status: 'paid',
      downloadUrl: '/api/invoices/INV-2023-06-001/download'
    },
    {
      id: 'INV-2023-05-001',
      date: '2023-05-20',
      amount: 99,
      status: 'paid',
      downloadUrl: '/api/invoices/INV-2023-05-001/download'
    },
    {
      id: 'INV-2023-04-001',
      date: '2023-04-20',
      amount: 99,
      status: 'paid',
      downloadUrl: '/api/invoices/INV-2023-04-001/download'
    }
  ]);

  const plans = [
    {
      name: 'Basic',
      price: 29,
      interval: 'monthly' as const,
      features: [
        t('settings.billing.plans.basic.features.0'),
        t('settings.billing.plans.basic.features.1'),
        t('settings.billing.plans.basic.features.2')
      ],
      recommended: false
    },
    {
      name: 'Professional',
      price: 99,
      interval: 'monthly' as const,
      features: [
        t('settings.billing.plans.professional.features.0'),
        t('settings.billing.plans.professional.features.1'),
        t('settings.billing.plans.professional.features.2'),
        t('settings.billing.plans.professional.features.3'),
        t('settings.billing.plans.professional.features.4')
      ],
      recommended: true
    },
    {
      name: 'Enterprise',
      price: 199,
      interval: 'monthly' as const,
      features: [
        t('settings.billing.plans.enterprise.features.0'),
        t('settings.billing.plans.enterprise.features.1'),
        t('settings.billing.plans.enterprise.features.2'),
        t('settings.billing.plans.enterprise.features.3'),
        t('settings.billing.plans.enterprise.features.4')
      ],
      recommended: false
    }
  ];

  const handlePlanChange = async (planName: string) => {
    setLoading(true);
    setMessage(null);

    try {
      // API call to change plan
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMessage({ type: 'success', text: t('settings.billing.messages.planChangeSuccess', { planName }) });
    } catch (_error) {
      setMessage({ type: 'error', text: t('settings.billing.messages.planChangeError') });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePaymentMethod = () => {
    // Open payment method update modal/form
    console.log('Update payment method');
  };

  const handleCancelSubscription = async () => {
    setLoading(true);
    setMessage(null);

    try {
      // API call to cancel subscription
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMessage({ type: 'success', text: t('settings.billing.messages.cancelSuccess') });
      setShowCancelModal(false);
    } catch (_error) {
      setMessage({ type: 'error', text: t('settings.billing.messages.cancelError') });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(i18n.language, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="success">{t('settings.billing.billingHistory.status.paid')}</Badge>;
      case 'pending':
        return <Badge variant="warning">{t('settings.billing.billingHistory.status.pending')}</Badge>;
      case 'failed':
        return <Badge variant="danger">{t('settings.billing.billingHistory.status.failed')}</Badge>;
      default:
        return <Badge variant="gray">{status}</Badge>;
    }
  };

  if (user?.role !== 'admin') {
    return (
      <Card className="p-6">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">{t('settings.billing.accessRestricted.title')}</h3>
          <p className="mt-1 text-sm text-gray-500">
            {t('settings.billing.accessRestricted.description')}
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {message && (
        <Alert
          variant={message.type}
          className="mb-6"
          dismissible
        >
          {message.text}
        </Alert>
      )}

      {/* Current Plan */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900">{t('settings.billing.currentPlan.title')}</h3>
            <p className="text-sm text-gray-600 mt-1">
              {t('settings.billing.currentPlan.description', { planName: billingInfo.plan.name })}
            </p>
          </div>
          <Badge variant="primary" size="lg">
            {billingInfo.plan.name}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="text-3xl font-bold text-gray-900">
              ${billingInfo.plan.price}
              <span className="text-lg font-normal text-gray-600">/{t(`settings.billing.intervals.${billingInfo.plan.interval}`)}</span>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {t('settings.billing.currentPlan.nextBillingDate', { date: formatDate(billingInfo.nextBillingDate) })}
            </p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">{t('settings.billing.currentPlan.featuresTitle')}</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              {billingInfo.plan.features.map((feature, index) => (
                <li key={index} className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Card>

      {/* Available Plans */}
      <Card className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">{t('settings.billing.availablePlans.title')}</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isCurrent = plan.name === billingInfo.plan.name;
            return (
              <div
                key={plan.name}
                className={`relative border rounded-lg p-6 ${
                  plan.recommended ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
                } ${isCurrent ? 'bg-blue-50' : 'bg-white'}`}
              >
                {plan.recommended && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge variant="primary">{t('settings.billing.availablePlans.recommended')}</Badge>
                  </div>
                )}
                
                <div className="text-center">
                  <h4 className="text-lg font-medium text-gray-900">{t(`settings.billing.plans.${plan.name.toLowerCase()}.name`)}</h4>
                  <div className="mt-2">
                    <span className="text-3xl font-bold text-gray-900">${plan.price}</span>
                    <span className="text-gray-600">/{t(`settings.billing.intervals.${plan.interval}`)}</span>
                  </div>
                </div>
                
                <ul className="mt-6 space-y-3">
                  {plan.features.map((_, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-600">{t(`settings.billing.plans.${plan.name.toLowerCase()}.features.${index}`)}</span>
                    </li>
                  ))}
                </ul>
                
                <div className="mt-6">
                  {isCurrent ? (
                    <Button variant="outline" className="w-full" disabled>
                      {t('settings.billing.availablePlans.buttons.current')}
                    </Button>
                  ) : (
                    <Button
                      variant={plan.recommended ? 'primary' : 'outline'}
                      className="w-full"
                      onClick={() => handlePlanChange(plan.name)}
                      isLoading={loading}
                    >
                      {plan.price > billingInfo.plan.price ? t('settings.billing.availablePlans.buttons.upgrade') : t('settings.billing.availablePlans.buttons.downgrade')}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Payment Method */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">{t('settings.billing.paymentMethods.title')}</h3>
          <Button variant="outline" onClick={handleUpdatePaymentMethod}>
            {t('settings.billing.paymentMethods.buttons.update')}
          </Button>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="w-12 h-8 bg-gray-100 rounded flex items-center justify-center">
            {billingInfo.paymentMethod.brand === 'Visa' && (
              <span className="text-xs font-bold text-blue-600">VISA</span>
            )}
            {billingInfo.paymentMethod.brand === 'Mastercard' && (
              <span className="text-xs font-bold text-red-600">MC</span>
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">
              •••• •••• •••• {billingInfo.paymentMethod.last4}
            </p>
            <p className="text-xs text-gray-600">
              {t('settings.billing.paymentMethods.cardExpiry', { month: billingInfo.paymentMethod.expiryMonth, year: billingInfo.paymentMethod.expiryYear })}
            </p>
          </div>
        </div>
      </Card>

      {/* Billing Address */}
      <Card className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">{t('settings.billing.billingAddress.title')}</h3>
        
        <div className="text-sm text-gray-600">
          <p className="font-medium text-gray-900">{billingInfo.billingAddress.name}</p>
          {billingInfo.billingAddress.company && (
            <p>{billingInfo.billingAddress.company}</p>
          )}
          <p>{billingInfo.billingAddress.street}</p>
          <p>
            {billingInfo.billingAddress.city}, {billingInfo.billingAddress.state} {billingInfo.billingAddress.zipCode}
          </p>
          <p>{billingInfo.billingAddress.country}</p>
        </div>
      </Card>

      {/* Billing History */}
      <Card className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">{t('settings.billing.billingHistory.title')}</h3>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('settings.billing.billingHistory.table.invoice')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('settings.billing.billingHistory.table.date')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('settings.billing.billingHistory.table.amount')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('settings.billing.billingHistory.table.status')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('settings.billing.billingHistory.table.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {invoice.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {formatDate(invoice.date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${invoice.amount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(invoice.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(invoice.downloadUrl, '_blank')}
                    >
                      {t('settings.billing.billingHistory.table.download')}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Danger Zone */}
      <Card className="p-6 border-red-200">
        <h3 className="text-lg font-medium text-red-900 mb-2">{t('settings.billing.dangerZone.title')}</h3>
        <p className="text-sm text-red-600 mb-4">
          {t('settings.billing.dangerZone.description')}
        </p>
        <Button
          variant="outline"
          className="border-red-300 text-red-700 hover:bg-red-50"
          onClick={() => setShowCancelModal(true)}
        >
          {t('settings.billing.dangerZone.buttons.cancel')}
        </Button>
      </Card>

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">{t('settings.billing.cancelModal.title')}</h3>
            <p className="text-sm text-gray-600 mb-6">
              {t('settings.billing.cancelModal.description', { date: formatDate(billingInfo.nextBillingDate) })}
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowCancelModal(false)}
              >
                {t('settings.billing.cancelModal.buttons.keep')}
              </Button>
              <Button
                variant="primary"
                className="bg-red-600 hover:bg-red-700"
                onClick={handleCancelSubscription}
                isLoading={loading}
              >
                {t('settings.billing.cancelModal.buttons.cancel')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillingSettings;