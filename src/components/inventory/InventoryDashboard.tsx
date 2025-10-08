import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Package, 
  AlertTriangle, 
  Activity, 
  Plus,
  Calendar,
  DollarSign,
  BarChart3
} from 'lucide-react';
import { Card, Button, Badge, Alert } from '../ui';
import { useAuth } from '../../hooks/useAuth';
import { inventoryService, type InventoryDashboard as DashboardData } from '../../services/inventoryService';
import toast from 'react-hot-toast';
import { format as formatDate } from 'date-fns';

interface InventoryDashboardProps {
  clinicId?: string;
}

const InventoryDashboard: React.FC<InventoryDashboardProps> = ({ clinicId }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canManageInventory = user?.role === 'admin' || user?.role === 'staff';

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await inventoryService.getInventoryDashboard(clinicId);
      
      if (response.success) {
        setDashboardData(response.data);
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      setError(err.message || t('inventory.errors.fetchFailed'));
      toast.error(t('inventory.errors.fetchFailed'));
      console.error('Error fetching inventory dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [clinicId]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };


  const getMovementTypeColor = (type: string) => {
    return inventoryService.getMovementTypeColor(type);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">{t('inventory.loading')}</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="error">
        <AlertTriangle className="h-4 w-4" />
        {error}
      </Alert>
    );
  }

  if (!dashboardData) {
    return (
      <Alert variant="warning">
        <Package className="h-4 w-4" />
        {t('inventory.noDashboardData')}
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="h-6 w-6" />
            {t('inventory.title')}
          </h2>
          <p className="text-gray-600">{t('inventory.subtitle')}</p>
        </div>
        {canManageInventory && (
          <div className="flex gap-3">
            <Button variant="outline" onClick={fetchDashboardData}>
              {t('common.refresh')}
            </Button>
            <Button variant="primary">
              <Plus className="h-4 w-4 mr-2" />
              {t('inventory.addItem')}
            </Button>
          </div>
        )}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('inventory.totalItems')}</p>
              <p className="text-2xl font-bold text-gray-900">{dashboardData.totalItems}</p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('inventory.totalValue')}</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(dashboardData.totalValue)}</p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('inventory.lowStockItems')}</p>
              <p className="text-2xl font-bold text-yellow-600">{dashboardData.lowStockItems.count}</p>
            </div>
            <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('inventory.expiringItems')}</p>
              <p className="text-2xl font-bold text-red-600">{dashboardData.expiringItems.count}</p>
            </div>
            <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
              <Calendar className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Stock Summary by Category */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {t('inventory.stockByCategory')}
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dashboardData.stockSummary.map((category) => (
            <div key={category._id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900 capitalize">
                  {t(`inventory.categories.${category._id}`, category._id)}
                </h4>
                <Badge className="bg-gray-100 text-gray-800">{category.totalItems} {t('inventory.items')}</Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{t('inventory.totalValue')}:</span>
                  <span className="font-medium">{formatCurrency(category.totalValue)}</span>
                </div>
                
                {category.lowStockItems > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-yellow-600">{t('inventory.lowStock')}:</span>
                    <span className="font-medium text-yellow-600">{category.lowStockItems}</span>
                  </div>
                )}
                
                {category.outOfStockItems > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-red-600">{t('inventory.outOfStock')}:</span>
                    <span className="font-medium text-red-600">{category.outOfStockItems}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Items */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              {t('inventory.lowStockAlert')}
            </h3>
            {dashboardData.lowStockItems.count > 0 && (
              <Badge className="bg-yellow-100 text-yellow-800">
                {dashboardData.lowStockItems.count}
              </Badge>
            )}
          </div>

          <div className="space-y-3">
            {dashboardData.lowStockItems.items.slice(0, 5).map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{item.name}</p>
                  <p className="text-sm text-gray-600">{item.sku}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-yellow-700">
                    {item.currentStock} {item.unit}
                  </p>
                  <p className="text-xs text-yellow-600">
                    {t('inventory.minStock')}: {item.minimumStock}
                  </p>
                </div>
              </div>
            ))}
            
            {dashboardData.lowStockItems.count === 0 && (
              <div className="text-center py-8 text-gray-500">
                <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                <p>{t('inventory.noLowStockItems')}</p>
              </div>
            )}

            {dashboardData.lowStockItems.count > 5 && (
              <div className="text-center">
                <Button variant="outline" size="sm">
                  {t('inventory.viewAllLowStock')} ({dashboardData.lowStockItems.count - 5} {t('inventory.more')})
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Recent Stock Movements */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-500" />
              {t('inventory.recentMovements')}
            </h3>
          </div>

          <div className="space-y-3">
            {dashboardData.recentMovements.map((movement) => (
              <div key={movement.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{movement.inventoryItem.name}</p>
                  <p className="text-sm text-gray-600">{movement.description || movement.reason}</p>
                  <p className="text-xs text-gray-500">
                    {formatDate(new Date(movement.createdAt), 'MMM dd, yyyy HH:mm')}
                  </p>
                </div>
                <div className="text-right">
                  <Badge className={getMovementTypeColor(movement.type)}>
                    {movement.type === 'in' ? '+' : movement.type === 'out' ? '-' : '±'}{movement.quantity}
                  </Badge>
                  <p className="text-xs text-gray-500 mt-1">
                    {movement.performedBy.firstName} {movement.performedBy.lastName}
                  </p>
                </div>
              </div>
            ))}
            
            {dashboardData.recentMovements.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Activity className="h-8 w-8 mx-auto mb-2" />
                <p>{t('inventory.noRecentMovements')}</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Expiring Items */}
      {dashboardData.expiringItems.count > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-red-500" />
              {t('inventory.expiringItemsAlert')}
            </h3>
            <Badge className="bg-red-100 text-red-800">
              {dashboardData.expiringItems.count} {t('inventory.expiringSoon')}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dashboardData.expiringItems.items.map((item) => (
              <div key={item.id} className="p-4 border border-red-200 rounded-lg bg-red-50">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{item.name}</h4>
                  <Badge className="bg-red-100 text-red-800">
                    {item.daysUntilExpiry !== null && item.daysUntilExpiry !== undefined && item.daysUntilExpiry <= 0 
                      ? t('inventory.expired')
                      : `${item.daysUntilExpiry || 0} ${t('inventory.daysLeft')}`
                    }
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mb-1">{item.sku}</p>
                <p className="text-sm text-gray-600">
                  {t('inventory.expiryDate')}: {formatDate(new Date(item.expiryDate!), 'MMM dd, yyyy')}
                </p>
                <p className="text-sm text-gray-600">
                  {t('inventory.currentStock')}: {item.currentStock} {item.unit}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default InventoryDashboard;
