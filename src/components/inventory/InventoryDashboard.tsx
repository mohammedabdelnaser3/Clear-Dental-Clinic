import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Package, 
  AlertTriangle, 
  Activity, 
  Plus,
  Calendar,
  DollarSign,
  BarChart3,
  RefreshCcw
} from 'lucide-react';
import { ClinicSelector } from '../clinic';
import { Card, Button, Badge, Alert, Modal, ModalFooter, Input, Select, Textarea, DatePicker } from '../ui';
import { useAuth } from '../../hooks/useAuth';
import { useClinic } from '../../context';
import { inventoryService, type InventoryDashboard as DashboardData, type CreateInventoryItemData } from '../../services/inventoryService';
import toast from 'react-hot-toast';
import { format as formatDate } from 'date-fns';

// Define StockMovement interface
interface StockMovement {
  itemName: string;
  type: string;
  quantity: number;
  date: string;
  notes?: string;
}

interface InventoryDashboardProps {
  clinicId?: string;
}

const InventoryDashboard: React.FC<InventoryDashboardProps> = ({ clinicId }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { selectedClinic } = useClinic();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Add Item modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportFormat, setReportFormat] = useState<'json' | 'csv'>('json');
  const [reportStartDate, setReportStartDate] = useState<string>('');
  const [reportEndDate, setReportEndDate] = useState<string>('');
  
  // Handle clinic change
  const handleClinicChange = (newClinicId: string) => {
    // This function would typically navigate or update state with the new clinic ID
    console.log('Clinic changed to:', newClinicId);
    // Implementation depends on how clinic changes are handled in the application
  };
  const [newItem, setNewItem] = useState<Partial<CreateInventoryItemData>>({
    name: '',
    sku: '',
    category: 'supplies',
    unit: '',
    currentStock: 0,
    minimumStock: 0,
    costPrice: 0,
    description: '',
    location: '',
    expiryDate: '',
    batchNumber: '',
    barcode: ''
  });

  const canManageInventory = user?.role === 'admin' || user?.role === 'staff';

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
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

  // Add Item modal handlers
  const openAddItemModal = () => {
    if (!clinicId) {
      toast.error(t('inventory.errors.noClinicSelected') || 'Please select a clinic.');
      return;
    }
    setIsAddModalOpen(true);
  };
  const closeAddItemModal = () => setIsAddModalOpen(false);
  const handleFieldChange = (field: keyof CreateInventoryItemData, value: any) => {
    setNewItem(prev => ({ ...prev, [field]: value }));
  };
  const handleCreateItem = async () => {
    try {
      if (!clinicId) {
        toast.error(t('inventory.errors.noClinicSelected') || 'Please select a clinic.');
        return;
      }

      const required = ['name','sku','category','unit'] as const;
      for (const field of required) {
        const val = newItem[field];
        if (!val || (typeof val === 'string' && val.toString().trim() === '')) {
          toast.error(`Missing required field: ${field}`);
          return;
        }
      }

      const payload: CreateInventoryItemData = {
        name: String(newItem.name).trim(),
        sku: String(newItem.sku).trim().toUpperCase(),
        category: String(newItem.category),
        unit: String(newItem.unit).trim(),
        currentStock: Number(newItem.currentStock ?? 0),
        minimumStock: Number(newItem.minimumStock ?? 0),
        costPrice: Number(newItem.costPrice ?? 0),
        clinic: clinicId,
        ...(newItem.barcode ? { barcode: String(newItem.barcode).trim() } : {}),
        ...(newItem.maximumStock != null ? { maximumStock: Number(newItem.maximumStock) } : {}),
        ...(newItem.sellingPrice != null ? { sellingPrice: Number(newItem.sellingPrice) } : {}),
        ...(newItem.description ? { description: String(newItem.description).trim() } : {}),
        ...(newItem.location ? { location: String(newItem.location).trim() } : {}),
        ...(newItem.expiryDate ? { expiryDate: String(newItem.expiryDate) } : {}),
        ...(newItem.batchNumber ? { batchNumber: String(newItem.batchNumber).trim() } : {}),
      };

      if (payload.currentStock < 0 || payload.minimumStock < 0 || payload.costPrice < 0) {
        toast.error('Numeric values cannot be negative.');
        return;
      }

      setIsSubmitting(true);
      const response = await inventoryService.createInventoryItem(payload);
      if (response.success) {
        toast.success(t('inventory.itemCreated') || 'Item created successfully');
        closeAddItemModal();
        setNewItem({
          name: '',
          sku: '',
          category: 'supplies',
          unit: '',
          currentStock: 0,
          minimumStock: 0,
          costPrice: 0,
          description: '',
          location: '',
          expiryDate: '',
          batchNumber: '',
          barcode: ''
        });
        fetchDashboardData();
      } else {
        toast.error(response.message || 'Failed to create item');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err.message || 'Failed to create item');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openReportModal = () => setIsReportModalOpen(true);
  const closeReportModal = () => setIsReportModalOpen(false);
  const handleGenerateReport = async () => {
    try {
      setIsGeneratingReport(true);
      const params: { startDate?: string; endDate?: string; clinic?: string; format?: 'json' | 'csv' } = {};
      if (clinicId) params.clinic = clinicId;
      if (reportStartDate) params.startDate = reportStartDate;
      if (reportEndDate) params.endDate = reportEndDate;
      params.format = reportFormat;

      const response = await inventoryService.generateInventoryReport(params);
      if (response.success) {
        toast.success(t('inventory.reportGenerated') || 'Report generated');
        closeReportModal();
      } else {
        toast.error(response.message || 'Failed to generate report');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err.message || 'Failed to generate report');
    } finally {
      setIsGeneratingReport(false);
    }
  };

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
          <div className="mt-1">
            <Badge className="bg-gray-100 text-gray-800">
              {selectedClinic ? selectedClinic.name : (t('clinic.allClinics') || 'All Clinics')}
            </Badge>
          </div>
        </div>
        {canManageInventory && (
          <div className="flex gap-3">
            <Button variant="outline" onClick={fetchDashboardData}>
              {t('common.refresh')}
            </Button>
            <Button variant="outline" onClick={openReportModal}>
              <BarChart3 className="h-4 w-4 mr-2" />
              {t('inventory.generateReport') || 'Generate Report'}
            </Button>
            <Button variant="primary" onClick={openAddItemModal} disabled={!clinicId}>
              <Plus className="h-4 w-4 mr-2" />
              {t('inventory.addItem')}
            </Button>
          </div>
        )}
      </div>

      {/* Add Item Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={closeAddItemModal}
        title={t('inventory.addItem') || 'Add Item'}
        size="xl"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Name" value={String(newItem.name || '')} onChange={(e) => handleFieldChange('name', e.target.value)} />
          <Input label="SKU" value={String(newItem.sku || '')} onChange={(e) => handleFieldChange('sku', e.target.value)} helperText="Unique identifier (will be uppercased)" />
          <Select label="Category" value={String(newItem.category || 'supplies')} onChange={(e) => handleFieldChange('category', e.target.value)} options={inventoryService.getCategories()} />
          <Input label="Unit" value={String(newItem.unit || '')} onChange={(e) => handleFieldChange('unit', e.target.value)} placeholder="e.g., pieces, ml, boxes" />
          <Input label="Current Stock" type="number" min={0} value={Number(newItem.currentStock ?? 0)} onChange={(e) => handleFieldChange('currentStock', e.target.value)} />
          <Input label="Minimum Stock" type="number" min={0} value={Number(newItem.minimumStock ?? 0)} onChange={(e) => handleFieldChange('minimumStock', e.target.value)} />
          <Input label="Cost Price" type="number" min={0} step="0.01" value={Number(newItem.costPrice ?? 0)} onChange={(e) => handleFieldChange('costPrice', e.target.value)} />
          <Input label="Selling Price" type="number" min={0} step="0.01" value={Number(newItem.sellingPrice ?? 0)} onChange={(e) => handleFieldChange('sellingPrice', e.target.value)} />
          <Input label="Maximum Stock" type="number" min={0} value={Number(newItem.maximumStock ?? 0)} onChange={(e) => handleFieldChange('maximumStock', e.target.value)} />
          <Input label="Barcode" value={String(newItem.barcode || '')} onChange={(e) => handleFieldChange('barcode', e.target.value)} />
          <Input label="Location" value={String(newItem.location || '')} onChange={(e) => handleFieldChange('location', e.target.value)} />
          <DatePicker value={newItem.expiryDate ? new Date(String(newItem.expiryDate)) : undefined} onChange={(val) => handleFieldChange('expiryDate', (val as Date)?.toISOString()?.split('T')[0] || '')} placeholder="Expiry Date" />
          <Input label="Batch Number" value={String(newItem.batchNumber || '')} onChange={(e) => handleFieldChange('batchNumber', e.target.value)} />
          <Textarea label="Description" rows={3} value={String(newItem.description || '')} onChange={(e) => handleFieldChange('description', e.target.value)} />
        </div>
        <div className="mt-4">
          <ModalFooter
            onCancel={closeAddItemModal}
            onConfirm={handleCreateItem}
            confirmText={t('common.create') || 'Create'}
            isConfirmLoading={isSubmitting}
          />
        </div>
      </Modal>

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
        {dashboardData?.lowStockItems && ((dashboardData.lowStockItems.count ?? 0) > 0) && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                {t('inventory.lowStockAlert')}
              </h3>
              <Badge className="bg-yellow-100 text-yellow-800">
                {dashboardData.lowStockItems.count}
              </Badge>
            </div>

            <div className="space-y-3">
              {dashboardData?.lowStockItems?.items?.slice(0, 5).map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-600">{item.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-yellow-700">
                      {item.currentStock} {item.unit}
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
        )}
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
      {dashboardData?.expiringItems?.count > 0 && (
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

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">{t('inventory.dashboardTitle')}</h1>

      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <ClinicSelector onClinicSelected={handleClinicChange} selectedClinicId={clinicId} />
          <Button onClick={fetchDashboardData} variant="outline">
            <RefreshCcw className="h-4 w-4 mr-2" /> {t('common.refresh')}
          </Button>
        </div>
        <div className="flex space-x-3">
          <Button onClick={openReportModal} variant="secondary">
            <BarChart3 className="h-4 w-4 mr-2" /> {t('inventory.generateReport')}
          </Button>
          <Button onClick={openAddItemModal}>
            <Plus className="h-4 w-4 mr-2" /> {t('inventory.addItem')}
          </Button>
        </div>
      </div>

      {loading && <p>Loading dashboard data...</p>}
      {error && <Alert variant="error">{error}</Alert>}

      {!loading && !error && !dashboardData && (
        <Alert variant="info">{t('inventory.noDashboardData') || 'No dashboard data available. Please add some inventory items.'}</Alert>
      )}

      {dashboardData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          <Card className="p-6 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{t('inventory.totalItems')}</h3>
              <p className="text-3xl font-bold text-indigo-600">{dashboardData?.totalItems || 0}</p>
            </div>
            <Package className="h-10 w-10 text-indigo-400" />
          </Card>
          <Card className="p-6 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{t('inventory.lowStockItems')}</h3>
              <p className="text-3xl font-bold text-red-600">{dashboardData?.lowStockItems?.count || 0}</p>
            </div>
            <AlertTriangle className="h-10 w-10 text-red-400" />
          </Card>
          <Card className="p-6 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{t('inventory.totalValue')}</h3>
              <p className="text-3xl font-bold text-green-600">{formatCurrency(dashboardData?.totalValue || 0)}</p>
            </div>
            <DollarSign className="h-10 w-10 text-green-400" />
          </Card>
        </div>
      )}

      {dashboardData && (
        <div className="space-y-6">
          {/* Inventory Movement */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-500" /> {t('inventory.recentInventoryMovement')}
            </h3>
            {Boolean(dashboardData?.recentMovements?.length) ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('inventory.item')}
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('inventory.type')}
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('inventory.quantity')}
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('inventory.date')}
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('inventory.notes')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {dashboardData?.recentMovements?.map((movement) => (
                      <tr key={`${movement.inventoryItem.name}-${movement.createdAt}`}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{movement.inventoryItem.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <Badge className={getMovementTypeColor(movement.type)}>{t(`inventory.movementType.${movement.type}`)}</Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{movement.quantity}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{movement.createdAt ? formatDate(new Date(movement.createdAt), 'MMM dd, yyyy HH:mm') : ''}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{movement.description || movement.reason || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-600">{t('inventory.noRecentMovements')}</p>
            )}
          </Card>

          {/* Stock Summary by Category */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-500" /> {t('inventory.stockSummaryByCategory')}
            </h3>
            {dashboardData && (dashboardData as any).stockSummaryByCategory && Object.keys((dashboardData as any).stockSummaryByCategory).length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                {Object.entries((dashboardData as any).stockSummaryByCategory || {}).map(([category, count]) => (
                  <div key={category} className="p-4 border border-gray-200 rounded-lg">
                    <h4 className="font-medium text-gray-900 capitalize">{t(`inventory.category.${category}`)}</h4>
                    <p className="text-2xl font-bold text-indigo-600">{String(count)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">{t('inventory.noStockSummary')}</p>
            )}
          </Card>

          {/* Low Stock Items */}
          {dashboardData?.lowStockItems && (dashboardData?.lowStockItems?.count ?? 0) > 0 && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  {t('inventory.lowStockAlert')}
                </h3>
                <Badge className="bg-orange-100 text-orange-800">
                  {dashboardData?.lowStockItems?.count} {t('inventory.itemsLowStock')}
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dashboardData?.lowStockItems?.items?.map((item) => (
                  <div key={item.id} className="p-4 border border-orange-200 rounded-lg bg-orange-50">
                    <h4 className="font-medium text-gray-900">{item.name}</h4>
                    <p className="text-sm text-gray-600 mb-1">{item.sku}</p>
                    <p className="text-sm text-gray-600">
                      {t('inventory.currentStock')}: {item.currentStock} {item.unit}
                    </p>
                    <p className="text-sm text-gray-600">
                      {t('inventory.minimumStock')}: {item.minimumStock} {item.unit}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Expiring Items */}
          {dashboardData?.expiringItems && (dashboardData?.expiringItems?.count || 0) > 0 && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-red-500" />
                  {t('inventory.expiringItemsAlert')}
                </h3>
                <Badge className="bg-red-100 text-red-800">
                  {dashboardData?.expiringItems?.count} {t('inventory.expiringSoon')}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dashboardData?.expiringItems?.items?.map((item) => (
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
      )}

      {/* Add Item Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={closeAddItemModal}
        title={t('inventory.addNewItem') || 'Add New Item'}
        size="lg"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label={t('inventory.itemName') || 'Item Name'}
            value={newItem.name}
            onChange={(e) => handleFieldChange('name', e.target.value)}
            placeholder={t('inventory.itemNamePlaceholder') || 'e.g., Paracetamol 500mg'}
          />
          <Input
            label={t('inventory.sku') || 'SKU'}
            value={newItem.sku}
            onChange={(e) => handleFieldChange('sku', e.target.value)}
            placeholder={t('inventory.skuPlaceholder') || 'e.g., MED-PARA-500'}
          />
          <Select
            label={t('inventory.category') || 'Category'}
            value={newItem.category}
            options={[
              { value: 'medications', label: t('inventory.category.medications') },
              { value: 'supplies', label: t('inventory.category.supplies') },
              { value: 'equipment', label: t('inventory.category.equipment') },
              { value: 'vaccines', label: t('inventory.category.vaccines') },
            ]}
            onChange={(e) => handleFieldChange('category', e.target.value)}
          />
          <Input
            label={t('inventory.unit') || 'Unit'}
            value={newItem.unit}
            onChange={(e) => handleFieldChange('unit', e.target.value)}
            placeholder={t('inventory.unitPlaceholder') || 'e.g., tablets, bottles, boxes'}
          />
          <Input
            label={t('inventory.currentStock') || 'Current Stock'}
            type="number"
            value={newItem.currentStock}
            onChange={(e) => handleFieldChange('currentStock', parseInt(e.target.value))}
            placeholder="0"
          />
          <Input
            label={t('inventory.minimumStock') || 'Minimum Stock'}
            type="number"
            value={newItem.minimumStock}
            onChange={(e) => handleFieldChange('minimumStock', parseInt(e.target.value))}
            placeholder="0"
          />
          <Input
            label={t('inventory.costPrice') || 'Cost Price'}
            type="number"
            value={newItem.costPrice}
            onChange={(e) => handleFieldChange('costPrice', parseFloat(e.target.value))}
            placeholder="0.00"
            step="0.01"
          />
          <Input
            label={t('inventory.location') || 'Location'}
            value={newItem.location}
            onChange={(e) => handleFieldChange('location', e.target.value)}
            placeholder={t('inventory.locationPlaceholder') || 'e.g., Pharmacy Shelf A'}
          />
          <DatePicker
            value={newItem.expiryDate ? new Date(newItem.expiryDate as string) : undefined}
            onChange={(val) => handleFieldChange('expiryDate', (val as Date)?.toISOString()?.split('T')[0] || '')}
            placeholder={t('inventory.expiryDateOptional') || 'Expiry Date (Optional)'}
          />
          <Input
            label={t('inventory.batchNumber') || 'Batch Number'}
            value={newItem.batchNumber}
            onChange={(e) => handleFieldChange('batchNumber', e.target.value)}
            placeholder={t('inventory.batchNumberOptional') || 'Batch Number (Optional)'}
          />
          <Input
            label={t('inventory.barcode') || 'Barcode'}
            value={newItem.barcode}
            onChange={(e) => handleFieldChange('barcode', e.target.value)}
            placeholder={t('inventory.barcodeOptional') || 'Barcode (Optional)'}
          />
          <Textarea
            label={t('inventory.description') || 'Description'}
            value={newItem.description}
            onChange={(e) => handleFieldChange('description', e.target.value)}
            placeholder={t('inventory.descriptionPlaceholder') || 'Any additional details about the item'}
            className="md:col-span-2"
          />
        </div>
        <div className="mt-4">
          <ModalFooter
            onCancel={closeAddItemModal}
            onConfirm={handleCreateItem}
            confirmText={t('common.add') || 'Add'}
            isConfirmLoading={isSubmitting}
          />
        </div>
      </Modal>

      {/* Report Modal */}
      <Modal
        isOpen={isReportModalOpen}
        onClose={closeReportModal}
        title={t('inventory.generateReport') || 'Generate Report'}
        size="lg"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label={t('inventory.reportFormat') || 'Format'}
            value={reportFormat}
            options={[{ value: 'json', label: 'JSON' }, { value: 'csv', label: 'CSV' }]}
            onChange={(e) => setReportFormat(e.target.value as 'json' | 'csv')}
          />
          <div />
          <DatePicker
            value={reportStartDate ? new Date(reportStartDate) : undefined}
            onChange={(val) => setReportStartDate((val as Date)?.toISOString()?.split('T')[0] || '')}
            placeholder={t('inventory.startDate') || 'Start Date'}
          />
          <DatePicker
            value={reportEndDate ? new Date(reportEndDate) : undefined}
            onChange={(val) => setReportEndDate((val as Date)?.toISOString()?.split('T')[0] || '')}
            placeholder={t('inventory.endDate') || 'End Date'}
          />
        </div>
        <div className="mt-4">
          <ModalFooter
            onCancel={closeReportModal}
            onConfirm={handleGenerateReport}
            confirmText={t('inventory.generate') || 'Generate'}
            isConfirmLoading={isGeneratingReport}
          />
        </div>
      </Modal>
    </div>
  );
};

export default InventoryDashboard;

// Add interface for StockMovement
interface StockMovement {
  itemName: string;
  type: string;
  quantity: number;
  date: string;
  notes?: string;
}
