import api from './api';

export interface Supplier {
  id: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  taxId?: string;
  website?: string;
  notes?: string;
  paymentTerms?: string;
  creditLimit?: number;
  isActive: boolean;
  rating?: number;
  totalOrders?: number;
  totalSpent?: number;
  fullAddress?: string;
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

export interface SupplierPerformance {
  name: string;
  totalOrders: number;
  totalSpent: number;
  rating?: number;
  averageOrderValue: number;
}

export interface SupplierDashboard {
  totalSuppliers: number;
  topSuppliers: SupplierPerformance[];
  inactiveSuppliers: {
    suppliers: Array<{
      id: string;
      name: string;
      contactPerson?: string;
      email?: string;
      totalOrders: number;
    }>;
    count: number;
  };
  ratings: {
    average: number;
    totalRated: number;
  };
  performance: SupplierPerformance[];
}

export interface CreateSupplierData {
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  taxId?: string;
  website?: string;
  notes?: string;
  paymentTerms?: string;
  creditLimit?: number;
  rating?: number;
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

class SupplierService {
  private baseURL = '/api/v1/suppliers';

  // Get all suppliers with filtering and pagination
  async getSuppliers(params: {
    page?: number;
    limit?: number;
    isActive?: boolean;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<ApiResponse<{ suppliers: Supplier[] }>> {
    const response = await api.get(this.baseURL, { params });
    return response.data;
  }

  // Get single supplier with supplied items
  async getSupplier(id: string): Promise<ApiResponse<{
    supplier: Supplier;
    suppliedItems: {
      items: Array<{
        id: string;
        name: string;
        sku: string;
        category: string;
        currentStock: number;
        minimumStock: number;
        costPrice: number;
      }>;
      count: number;
      totalValue: number;
    };
  }>> {
    const response = await api.get(`${this.baseURL}/${id}`);
    return response.data;
  }

  // Create new supplier
  async createSupplier(data: CreateSupplierData): Promise<ApiResponse<{ supplier: Supplier }>> {
    const response = await api.post(this.baseURL, data);
    return response.data;
  }

  // Update supplier
  async updateSupplier(id: string, data: Partial<CreateSupplierData>): Promise<ApiResponse<{ supplier: Supplier }>> {
    const response = await api.put(`${this.baseURL}/${id}`, data);
    return response.data;
  }

  // Delete supplier
  async deleteSupplier(id: string): Promise<ApiResponse<void>> {
    const response = await api.delete(`${this.baseURL}/${id}`);
    return response.data;
  }

  // Get active suppliers (for dropdowns)
  async getActiveSuppliers(): Promise<ApiResponse<{ suppliers: Supplier[] }>> {
    const response = await api.get(`${this.baseURL}/active`);
    return response.data;
  }

  // Get supplier performance data
  async getSupplierPerformance(supplierId?: string): Promise<ApiResponse<{
    performance: SupplierPerformance[];
    recentItems: Array<{
      id: string;
      name: string;
      sku: string;
      category: string;
      lastRestocked?: string;
      supplier: {
        id: string;
        name: string;
      };
    }>;
  }>> {
    const url = supplierId ? `${this.baseURL}/${supplierId}/performance` : `${this.baseURL}/performance`;
    const response = await api.get(url);
    return response.data;
  }

  // Update supplier rating
  async updateSupplierRating(id: string, rating: number, notes?: string): Promise<ApiResponse<{ supplier: Supplier }>> {
    const response = await api.put(`${this.baseURL}/${id}/rating`, { rating, notes });
    return response.data;
  }

  // Get suppliers dashboard data
  async getSuppliersDashboard(): Promise<ApiResponse<SupplierDashboard>> {
    const response = await api.get(`${this.baseURL}/dashboard`);
    return response.data;
  }

  // Import suppliers from CSV
  async importSuppliers(file: File): Promise<ApiResponse<any>> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post(`${this.baseURL}/import`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }

  // Export suppliers to CSV
  async exportSuppliers(): Promise<void> {
    const response = await api.get(`${this.baseURL}/export`, {
      responseType: 'blob'
    });
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `suppliers-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }

  // Get rating color class
  getRatingColor(rating?: number): string {
    if (!rating) return 'bg-gray-100 text-gray-800';
    
    if (rating >= 4.5) return 'bg-green-100 text-green-800';
    if (rating >= 3.5) return 'bg-blue-100 text-blue-800';
    if (rating >= 2.5) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  }

  // Format rating display
  formatRating(rating?: number): string {
    if (!rating) return 'No rating';
    return `${rating.toFixed(1)} ⭐`;
  }

  // Format currency
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  // Format address
  formatAddress(address?: Supplier['address']): string {
    if (!address) return '';
    
    const parts = [
      address.street,
      address.city,
      address.state,
      address.zipCode,
      address.country
    ].filter(Boolean);
    
    return parts.join(', ');
  }

  // Get supplier status color
  getStatusColor(isActive: boolean): string {
    return isActive 
      ? 'bg-green-100 text-green-800' 
      : 'bg-gray-100 text-gray-800';
  }

  // Validate email format
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Validate website URL format
  isValidWebsite(website: string): boolean {
    try {
      new URL(website);
      return true;
    } catch {
      return false;
    }
  }
}

export const supplierService = new SupplierService();
export default supplierService;
