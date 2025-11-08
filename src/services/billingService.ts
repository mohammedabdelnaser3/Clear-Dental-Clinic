import api from './api';

export interface BillingRecord {
  _id: string;
  patient: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    address?: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
    };
  };
  appointment?: {
    _id: string;
    date: string;
    type: string;
  };
  treatmentRecord?: {
    _id: string;
    treatment: string;
  };
  clinic: {
    _id: string;
    name: string;
    address?: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
    };
    phone?: string;
    email?: string;
  };
  dentist: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  invoiceNumber: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  paymentMethod?: string;
  paymentStatus: 'pending' | 'partial' | 'paid' | 'overdue';
  paymentHistory?: Array<{
    amount: number;
    method: string;
    date: string;
    reference?: string;
  }>;
  insuranceInfo?: {
    provider: string;
    policyNumber: string;
    coverageAmount: number;
  };
  dueDate: string;
  paidDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBillingData {
  patient: string;
  appointment?: string;
  treatmentRecord?: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paymentMethod?: string;
  insuranceInfo?: {
    provider: string;
    policyNumber: string;
    coverageAmount: number;
  };
  dueDate: string;
  notes?: string;
}

export interface UpdateBillingData extends Partial<CreateBillingData> {}

export interface PaymentData {
  amount: number;
  method: string;
  reference?: string;
  notes?: string;
  paymentDate: string;
}

export interface BillingFilters {
  page?: number;
  limit?: number;
  search?: string;
  paymentStatus?: string;
  patient?: string;
  dentist?: string;
  clinic?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
}

export interface BillingResponse {
  billingRecords: BillingRecord[];
  totalRecords: number;
  totalPages: number;
  currentPage: number;
}

export interface RevenueStats {
  totalRevenue: number;
  paidAmount: number;
  pendingAmount: number;
  overdueAmount: number;
  monthlyRevenue: Array<{
    month: string;
    revenue: number;
    invoices: number;
  }>;
  paymentMethodBreakdown: Array<{
    method: string;
    amount: number;
    count: number;
  }>;
}

export interface BillingSummary {
  totalInvoices: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  overdueAmount: number;
  averageInvoiceAmount: number;
  paymentRate: number;
}

class BillingService {
  private baseURL = '/billing';

  // Get all billing records with filters
  async getBillingRecords(filters: BillingFilters = {}) {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(`${this.baseURL}?${params.toString()}`);
    return response;
  }

  // Get billing record by ID
  async getBillingRecord(id: string) {
    const response = await api.get(`${this.baseURL}/${id}`);
    return response;
  }

  // Create new billing record
  async createBillingRecord(data: CreateBillingData) {
    const response = await api.post(this.baseURL, data);
    return response;
  }

  // Update billing record
  async updateBillingRecord(id: string, data: UpdateBillingData) {
    const response = await api.put(`${this.baseURL}/${id}`, data);
    return response;
  }

  // Delete billing record (soft delete)
  async deleteBillingRecord(id: string) {
    const response = await api.delete(`${this.baseURL}/${id}`);
    return response;
  }

  // Get billing records by patient
  async getBillingByPatient(patientId: string, filters: BillingFilters = {}) {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(`${this.baseURL}/patient/${patientId}?${params.toString()}`);
    return response;
  }

  // Get overdue billing records
  async getOverdueBilling(filters: BillingFilters = {}) {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(`${this.baseURL}/overdue?${params.toString()}`);
    return response;
  }

  // Add payment to billing record
  async addPayment(billingId: string, paymentData: PaymentData) {
    const response = await api.post(`${this.baseURL}/${billingId}/payment`, paymentData);
    return response;
  }

  // Get revenue statistics
  async getRevenueStats(filters: {
    startDate?: string;
    endDate?: string;
    dentist?: string;
    clinic?: string;
  } = {}) {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(`${this.baseURL}/stats/revenue?${params.toString()}`);
    return response;
  }

  // Get billing summary
  async getBillingSummary(filters: {
    startDate?: string;
    endDate?: string;
    dentist?: string;
    clinic?: string;
  } = {}) {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(`${this.baseURL}/summary?${params.toString()}`);
    return response;
  }

  // Export billing data
  async exportBillingData(filters: BillingFilters = {}, format: 'csv' | 'pdf' = 'csv') {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });
    
    params.append('format', format);

    const response = await api.get(`${this.baseURL}/export?${params.toString()}`, {
      responseType: 'blob'
    });
    return response;
  }

  // Send invoice email
  async sendInvoiceEmail(billingId: string, emailData: {
    to?: string;
    subject?: string;
    message?: string;
  } = {}) {
    const response = await api.post(`${this.baseURL}/${billingId}/send-email`, emailData);
    return response;
  }

  // Generate invoice PDF
  async generateInvoicePDF(billingId: string) {
    const response = await api.get(`${this.baseURL}/${billingId}/pdf`, {
      responseType: 'blob'
    });
    return response;
  }

  // Bulk operations
  async bulkUpdateStatus(billingIds: string[], status: string) {
    const response = await api.put(`${this.baseURL}/bulk/status`, {
      billingIds,
      status
    });
    return response;
  }

  async bulkDelete(billingIds: string[]) {
    const response = await api.delete(`${this.baseURL}/bulk`, {
      data: { billingIds }
    });
    return response;
  }

  // Search billing records
  async searchBillingRecords(query: string, filters: BillingFilters = {}) {
    const params = new URLSearchParams();
    params.append('q', query);
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(`${this.baseURL}/search?${params.toString()}`);
    return response;
  }

  // Get payment history for a billing record
  async getPaymentHistory(billingId: string) {
    const response = await api.get(`${this.baseURL}/${billingId}/payments`);
    return response;
  }

  // Update payment
  async updatePayment(billingId: string, paymentId: string, paymentData: Partial<PaymentData>) {
    const response = await api.put(`${this.baseURL}/${billingId}/payment/${paymentId}`, paymentData);
    return response;
  }

  // Delete payment
  async deletePayment(billingId: string, paymentId: string) {
    const response = await api.delete(`${this.baseURL}/${billingId}/payment/${paymentId}`);
    return response;
  }

  // Get billing analytics
  async getBillingAnalytics(filters: {
    startDate?: string;
    endDate?: string;
    groupBy?: 'day' | 'week' | 'month' | 'year';
    dentist?: string;
    clinic?: string;
  } = {}) {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(`${this.baseURL}/analytics?${params.toString()}`);
    return response;
  }

  // Get top patients by billing amount
  async getTopPatients(filters: {
    startDate?: string;
    endDate?: string;
    limit?: number;
  } = {}) {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(`${this.baseURL}/top-patients?${params.toString()}`);
    return response;
  }

  // Get billing statistics for dashboard
  async getBillingStats(filters: {
    startDate?: string;
    endDate?: string;
    clinic?: string;
  } = {}) {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(`${this.baseURL}/stats?${params.toString()}`);
    return response;
  }

  // Get billing trends
  async getBillingTrends(filters: {
    startDate?: string;
    endDate?: string;
    period?: 'daily' | 'weekly' | 'monthly';
  } = {}) {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(`${this.baseURL}/trends?${params.toString()}`);
    return response;
  }
}

export const billingService = new BillingService();