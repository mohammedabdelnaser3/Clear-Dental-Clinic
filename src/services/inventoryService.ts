import api from './api';

export interface InventoryItem {
  id: string;
  name: string;
  description?: string;
  category: 'supplies' | 'materials' | 'equipment' | 'medications' | 'instruments' | 'other';
  subcategory?: string;
  sku: string;
  barcode?: string;
  clinic: {
    id: string;
    name: string;
  };
  currentStock: number;
  minimumStock: number;
  maximumStock?: number;
  unit: string;
  costPrice: number;
  sellingPrice?: number;
  supplier?: {
    id: string;
    name: string;
    contactPerson?: string;
  };
  supplierItemCode?: string;
  location?: string;
  expiryDate?: string;
  batchNumber?: string;
  isActive: boolean;
  isLowStock: boolean;
  lastRestocked?: string;
  lastUsed?: string;
  stockStatus: 'out_of_stock' | 'low_stock' | 'in_stock' | 'overstock';
  daysUntilExpiry?: number;
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
  updatedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  inventoryItem: {
    id: string;
    name: string;
    sku: string;
    category: string;
  };
  clinic: {
    id: string;
    name: string;
  };
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: 'purchase' | 'usage' | 'adjustment' | 'expired' | 'damaged' | 'transfer' | 'return' | 'other';
  description?: string;
  reference?: string;
  unitCost?: number;
  totalCost?: number;
  relatedDocument?: {
    type: 'purchase_order' | 'treatment' | 'prescription' | 'adjustment';
    id: string;
  };
  batchNumber?: string;
  expiryDate?: string;
  performedBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
  performedAt: string;
  notes?: string;
  direction: 'incoming' | 'outgoing' | 'adjustment';
  stockChange: number;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryDashboard {
  stockSummary: Array<{
    _id: string;
    totalItems: number;
    totalValue: number;
    lowStockItems: number;
    outOfStockItems: number;
  }>;
  lowStockItems: {
    items: InventoryItem[];
    count: number;
  };
  expiringItems: {
    items: InventoryItem[];
    count: number;
  };
  recentMovements: StockMovement[];
  totalValue: number;
  totalItems: number;
}

export interface CreateInventoryItemData {
  name: string;
  description?: string;
  category: string;
  subcategory?: string;
  sku: string;
  barcode?: string;
  clinic: string;
  currentStock: number;
  minimumStock: number;
  maximumStock?: number;
  unit: string;
  costPrice: number;
  sellingPrice?: number;
  supplier?: string;
  supplierItemCode?: string;
  location?: string;
  expiryDate?: string;
  batchNumber?: string;
}

export interface UpdateStockData {
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  reason: 'purchase' | 'usage' | 'adjustment' | 'expired' | 'damaged' | 'transfer' | 'return' | 'other';
  description?: string;
  reference?: string;
  unitCost?: number;
  batchNumber?: string;
  expiryDate?: string;
  notes?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  pagination?: {
    page: number;
    limit: number;
    totalPages: number;
    totalItems: number;
  };
}

class InventoryService {
  private baseURL = '/api/v1/inventory';

  // Get all inventory items with filtering and pagination
  async getInventoryItems(params: {
    page?: number;
    limit?: number;
    category?: string;
    isLowStock?: boolean;
    isActive?: boolean;
    search?: string;
    clinic?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<ApiResponse<{ items: InventoryItem[] }>> {
    const response = await api.get(this.baseURL, { params });
    return response.data;
  }

  // Get single inventory item with recent movements
  async getInventoryItem(id: string): Promise<ApiResponse<{ 
    item: InventoryItem; 
    recentMovements: StockMovement[] 
  }>> {
    const response = await api.get(`${this.baseURL}/${id}`);
    return response.data;
  }

  // Create new inventory item
  async createInventoryItem(data: CreateInventoryItemData): Promise<ApiResponse<{ item: InventoryItem }>> {
    const response = await api.post(this.baseURL, data);
    return response.data;
  }

  // Update inventory item
  async updateInventoryItem(id: string, data: Partial<CreateInventoryItemData>): Promise<ApiResponse<{ item: InventoryItem }>> {
    const response = await api.put(`${this.baseURL}/${id}`, data);
    return response.data;
  }

  // Delete inventory item
  async deleteInventoryItem(id: string): Promise<ApiResponse<void>> {
    const response = await api.delete(`${this.baseURL}/${id}`);
    return response.data;
  }

  // Update stock (add, remove, or adjust)
  async updateStock(id: string, data: UpdateStockData): Promise<ApiResponse<{ 
    item: InventoryItem; 
    movement: {
      type: string;
      quantity: number;
      previousStock: number;
      newStock: number;
    }
  }>> {
    const response = await api.post(`${this.baseURL}/${id}/stock`, data);
    return response.data;
  }

  // Get stock movements with filtering and pagination
  async getStockMovements(params: {
    page?: number;
    limit?: number;
    itemId?: string;
    clinic?: string;
    type?: 'in' | 'out' | 'adjustment';
    reason?: string;
    startDate?: string;
    endDate?: string;
    performedBy?: string;
  } = {}): Promise<ApiResponse<{ movements: StockMovement[] }>> {
    const response = await api.get(`${this.baseURL}/movements`, { params });
    return response.data;
  }

  // Get low stock items
  async getLowStockItems(clinic?: string): Promise<ApiResponse<{ items: InventoryItem[] }>> {
    const response = await api.get(`${this.baseURL}/low-stock`, {
      params: clinic ? { clinic } : {}
    });
    return response.data;
  }

  // Get expiring items
  async getExpiringItems(days: number = 30, clinic?: string): Promise<ApiResponse<{ items: InventoryItem[] }>> {
    const response = await api.get(`${this.baseURL}/expiring`, {
      params: { days, ...(clinic && { clinic }) }
    });
    return response.data;
  }

  // Get inventory dashboard data
  async getInventoryDashboard(clinic?: string): Promise<ApiResponse<InventoryDashboard>> {
    const response = await api.get(`${this.baseURL}/dashboard`, {
      params: clinic ? { clinic } : {}
    });
    return response.data;
  }

  // Generate inventory report
  async generateInventoryReport(params: {
    startDate?: string;
    endDate?: string;
    clinic?: string;
    category?: string;
    format?: 'json' | 'csv';
  } = {}): Promise<ApiResponse<any>> {
    const response = await api.get(`${this.baseURL}/report`, { params });
    return response.data;
  }

  // Get inventory categories for filters
  getCategories(): Array<{ value: string; label: string }> {
    return [
      { value: 'supplies', label: 'Supplies' },
      { value: 'materials', label: 'Materials' },
      { value: 'equipment', label: 'Equipment' },
      { value: 'medications', label: 'Medications' },
      { value: 'instruments', label: 'Instruments' },
      { value: 'other', label: 'Other' }
    ];
  }

  // Get stock movement reasons for filters
  getMovementReasons(): Array<{ value: string; label: string }> {
    return [
      { value: 'purchase', label: 'Purchase' },
      { value: 'usage', label: 'Usage' },
      { value: 'adjustment', label: 'Adjustment' },
      { value: 'expired', label: 'Expired' },
      { value: 'damaged', label: 'Damaged' },
      { value: 'transfer', label: 'Transfer' },
      { value: 'return', label: 'Return' },
      { value: 'other', label: 'Other' }
    ];
  }

  // Get stock status color class
  getStockStatusColor(status: string): string {
    switch (status) {
      case 'out_of_stock':
        return 'bg-red-100 text-red-800';
      case 'low_stock':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_stock':
        return 'bg-green-100 text-green-800';
      case 'overstock':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  // Get movement type color class
  getMovementTypeColor(type: string): string {
    switch (type) {
      case 'in':
        return 'bg-green-100 text-green-800';
      case 'out':
        return 'bg-red-100 text-red-800';
      case 'adjustment':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
}

export const inventoryService = new InventoryService();
export default inventoryService;
