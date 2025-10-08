import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Card } from '../../components/ui';
import { AnalyticsWidget } from '../../components/dashboard';
import { MedicationList } from '../../components/medications/MedicationList';
import { useAuth } from '../../hooks/useAuth';
import { medicationService } from '../../services/medicationService';
import {
  Pill,
  Plus,
  RefreshCw,
  Download,
  Filter,
  Clock,
  TrendingUp,
  CheckCircle,
  Activity,
  BarChart3,
  Shield,
  Zap
} from 'lucide-react';

interface MedicationStats {
  total: number;
  active: number;
  inactive: number;
  categories: { [key: string]: number };
  recentlyAdded: number;
  popularMedications: Array<{ name: string; usage: number }>;
}

const Medications: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<MedicationStats>({
    total: 0,
    active: 0,
    inactive: 0,
    categories: {},
    recentlyAdded: 0,
    popularMedications: []
  });
  const [showFilters, setShowFilters] = useState(false);

  const isPatient = user?.role === 'patient';
  const canManageMedications = user?.role === 'dentist' || user?.role === 'admin' || user?.role === 'super_admin';

  // Fetch medication statistics
  const fetchStats = useCallback(async () => {
    if (isPatient) return; // Patients don't need stats
    
    try {
      const response = await medicationService.getMedicationStats();
      if (response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error fetching medication stats:', error);
    }
  }, [isPatient]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  }, [fetchStats]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Calculate statistics for display
  const medicationMetrics = useMemo(() => {
    const activePercentage = stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0;
    const topCategory = Object.entries(stats.categories).reduce(
      (max, [category, count]) => count > max.count ? { category, count } : max,
      { category: 'none', count: 0 }
    );

    return {
      activePercentage,
      topCategory: topCategory.category,
      categoryCount: topCategory.count,
      growthRate: 12 // This would come from API in real implementation
    };
  }, [stats]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 shadow-xl border-b border-blue-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0">
            {/* Left Section */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="p-3 bg-gradient-to-br from-green-500 via-emerald-500 to-teal-600 rounded-xl shadow-lg">
                  <Pill className="w-8 h-8 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-white">
                  {isPatient ? t('medications.my_medications') : t('medications.medications')}
                </h1>
                <p className="text-blue-100/80 text-sm lg:text-base">
                  {isPatient 
                    ? t('medications.view_prescribed_medications')
                    : t('medications.manage_medication_inventory')
                  }
                </p>
                <div className="flex items-center space-x-4 mt-2 text-xs text-blue-200/70">
                  <span className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span>System Online</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>Last updated: {new Date().toLocaleTimeString()}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center space-x-3">
              <Button 
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : t('common.refresh')}
              </Button>
              
              {canManageMedications && (
                <>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30"
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Filters
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                  
                  <Button 
                    variant="primary" 
                    size="sm"
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Medication
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Statistics Cards - Only for staff/admin */}
        {canManageMedications && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <AnalyticsWidget
              title="Total Medications"
              type="metric"
              data={[{ label: 'Total', value: stats.total }]}
              icon={<Pill className="w-5 h-5" />}
              gradient="from-blue-500 to-blue-600"
              height="h-32"
              showLegend={false}
            />
            <AnalyticsWidget
              title="Active Medications"
              type="metric"
              data={[{ label: 'Active', value: stats.active }]}
              trend={{ value: medicationMetrics.activePercentage, isPositive: true, period: 'of total' }}
              icon={<CheckCircle className="w-5 h-5" />}
              gradient="from-green-500 to-green-600"
              height="h-32"
              showLegend={false}
            />
            <AnalyticsWidget
              title="Categories"
              type="metric"
              data={[{ label: 'Categories', value: Object.keys(stats.categories).length }]}
              icon={<BarChart3 className="w-5 h-5" />}
              gradient="from-purple-500 to-purple-600"
              height="h-32"
              showLegend={false}
            />
            <AnalyticsWidget
              title="Recently Added"
              type="metric"
              data={[{ label: 'New', value: stats.recentlyAdded }]}
              trend={{ value: medicationMetrics.growthRate, isPositive: true, period: 'this month' }}
              icon={<TrendingUp className="w-5 h-5" />}
              gradient="from-orange-500 to-orange-600"
              height="h-32"
              showLegend={false}
            />
          </div>
        )}

        {/* Quick Actions - Only for staff/admin */}
        {canManageMedications && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="p-6 border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50 hover:shadow-xl transition-all duration-300 cursor-pointer group">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl group-hover:scale-110 transition-transform">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Interaction Checker</h3>
                  <p className="text-sm text-gray-600">Check drug interactions</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-6 border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50 hover:shadow-xl transition-all duration-300 cursor-pointer group">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-xl group-hover:scale-110 transition-transform">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Usage Analytics</h3>
                  <p className="text-sm text-gray-600">View medication trends</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-6 border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50 hover:shadow-xl transition-all duration-300 cursor-pointer group">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl group-hover:scale-110 transition-transform">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Quick Prescribe</h3>
                  <p className="text-sm text-gray-600">Fast prescription creation</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Main Content */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50">
          <div className="p-6">
            <MedicationList />
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Medications;