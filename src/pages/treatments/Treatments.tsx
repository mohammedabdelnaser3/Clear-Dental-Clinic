import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Activity, TrendingUp, Users, Calendar, Clock, DollarSign } from 'lucide-react';
import { SimpleTreatmentList } from '../../components/treatment/SimpleTreatmentList';
import { Card, Button } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';
import { treatmentService } from '../../services/treatmentService';

interface TreatmentStats {
  totalTreatments: number;
  completedTreatments: number;
  inProgressTreatments: number;
  plannedTreatments: number;
  totalRevenue: number;
  averageCost: number;
}

const Treatments: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [stats, setStats] = useState<TreatmentStats>({
    totalTreatments: 0,
    completedTreatments: 0,
    inProgressTreatments: 0,
    plannedTreatments: 0,
    totalRevenue: 0,
    averageCost: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await treatmentService.getTreatmentRecords({ limit: 1000 });
        
        if (response.success && response.data) {
          const treatments = response.data.treatmentRecords || [];
          
          const completedTreatments = treatments.filter(t => t.status === 'completed').length;
          const inProgressTreatments = treatments.filter(t => t.status === 'in_progress').length;
          const plannedTreatments = treatments.filter(t => t.status === 'planned').length;
          
          const totalRevenue = treatments
            .filter(t => t.status === 'completed' && t.cost)
            .reduce((sum, t) => sum + (t.cost || 0), 0);
          
          const averageCost = treatments.length > 0 
            ? treatments.reduce((sum, t) => sum + (t.cost || 0), 0) / treatments.length
            : 0;

          setStats({
            totalTreatments: treatments.length,
            completedTreatments,
            inProgressTreatments,
            plannedTreatments,
            totalRevenue,
            averageCost
          });
        }
      } catch (error) {
        console.error('Error fetching treatment stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: t('treatments.stats.totalTreatments'),
      value: stats.totalTreatments,
      icon: Activity,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: t('treatments.stats.completed'),
      value: stats.completedTreatments,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: t('treatments.stats.inProgress'),
      value: stats.inProgressTreatments,
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      title: t('treatments.stats.planned'),
      value: stats.plannedTreatments,
      icon: Calendar,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    }
  ];

  if (user?.role === 'dentist' || user?.role === 'admin') {
    statCards.push(
      {
        title: t('treatments.stats.totalRevenue'),
        value: `${t('common.currency')}${stats.totalRevenue.toFixed(2)}` as any,
        icon: DollarSign,
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-50'
      },
      {
        title: t('treatments.stats.averageCost'),
        value: `${t('common.currency')}${stats.averageCost.toFixed(2)}` as any,
        icon: TrendingUp,
        color: 'text-indigo-600',
        bgColor: 'bg-indigo-50'
      }
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 text-white">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">{t('treatments.title')}</h1>
            <p className="text-blue-100 text-lg">
              {t('treatments.pageDescription')}
            </p>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.totalTreatments}</div>
              <div className="text-sm text-blue-100">{t('treatments.totalRecords')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {loading ? '...' : stat.value}
                </p>
              </div>
              <div className={`p-3 rounded-full ${stat.bgColor}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      {(user?.role === 'dentist' || user?.role === 'admin' || user?.role === 'staff') && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {t('treatments.quickActions')}
          </h3>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={() => window.location.href = '/appointments'}
              className="flex items-center gap-2"
            >
              <Calendar className="h-4 w-4" />
              {t('treatments.viewAppointments')}
            </Button>
            <Button
              variant="outline"
              onClick={() => window.location.href = '/patients'}
              className="flex items-center gap-2"
            >
              <Users className="h-4 w-4" />
              {t('treatments.viewPatients')}
            </Button>
            <Button
              variant="outline"
              onClick={() => window.location.href = '/prescriptions'}
              className="flex items-center gap-2"
            >
              <Activity className="h-4 w-4" />
              {t('treatments.viewPrescriptions')}
            </Button>
          </div>
        </Card>
      )}

      {/* Treatment List */}
      <SimpleTreatmentList showPatientColumn={true} />
    </div>
  );
};

export default Treatments;
