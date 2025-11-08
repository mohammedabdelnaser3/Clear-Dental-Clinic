import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { DollarSign, TrendingUp, Clock, AlertCircle, CreditCard, Receipt } from 'lucide-react';
import ReactDOM from 'react-dom';
import ReactLazy from 'react';
const BillingListLazy = React.lazy(() => import('../../components/billing/BillingList').then(m => ({ default: m.BillingList })));
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { billingService } from '../../services/billingService';
import { formatCurrency } from '../../utils/formatUtils';

interface BillingStats {
  totalRevenue: number;
  pendingAmount: number;
  overdueAmount: number;
  totalInvoices: number;
  paidInvoices: number;
  pendingInvoices: number;
  overdueInvoices: number;
}

const Billing: React.FC = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState<BillingStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await billingService.getBillingStats();
        setStats(response.data);
      } catch (error) {
        console.error('Error fetching billing stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ReactNode;
    trend?: string;
    color: string;
    bgColor: string;
  }> = ({ title, value, icon, trend, color, bgColor }) => (
    <Card className="p-6 hover:shadow-lg transition-shadow duration-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className={`text-2xl font-bold ${color}`}>{value}</p>
          {trend && (
            <p className="text-xs text-gray-500 mt-1 flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" />
              {trend}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-full ${bgColor}`}>
          {icon}
        </div>
      </div>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Receipt className="w-8 h-8 mr-3 text-blue-600" />
                {t('billing.title')}
              </h1>
              <p className="text-gray-600 mt-2">{t('billing.description')}</p>
            </div>
            <div className="mt-4 sm:mt-0">
              <Badge variant="success" className="text-sm">
                {t('billing.systemStatus.operational')}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="p-6 animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded"></div>
                  </div>
                  <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                </div>
              </Card>
            ))}
          </div>
        ) : stats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title={t('billing.stats.totalRevenue')}
              value={formatCurrency(stats.totalRevenue)}
              icon={<DollarSign className="w-6 h-6 text-green-600" />}
              trend="+12% from last month"
              color="text-green-600"
              bgColor="bg-green-100"
            />
            <StatCard
              title={t('billing.stats.pendingAmount')}
              value={formatCurrency(stats.pendingAmount)}
              icon={<Clock className="w-6 h-6 text-yellow-600" />}
              trend={`${stats.pendingInvoices} invoices`}
              color="text-yellow-600"
              bgColor="bg-yellow-100"
            />
            <StatCard
              title={t('billing.stats.overdueAmount')}
              value={formatCurrency(stats.overdueAmount)}
              icon={<AlertCircle className="w-6 h-6 text-red-600" />}
              trend={`${stats.overdueInvoices} invoices`}
              color="text-red-600"
              bgColor="bg-red-100"
            />
            <StatCard
              title={t('billing.stats.totalInvoices')}
              value={stats.totalInvoices}
              icon={<CreditCard className="w-6 h-6 text-blue-600" />}
              trend={`${stats.paidInvoices} paid`}
              color="text-blue-600"
              bgColor="bg-blue-100"
            />
          </div>
        ) : null}

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-sm">
          <React.Suspense fallback={
            <div className="p-6">
              <Card className="p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </Card>
            </div>
          }>
            <BillingListLazy />
          </React.Suspense>
        </div>
      </div>
    </div>
  );
};

export default Billing;