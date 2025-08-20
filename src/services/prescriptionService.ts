import api from './api';

export interface Prescription {
  _id: string;
  patient: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  dentist: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  clinic: {
    _id: string;
    name: string;
  };
  appointment?: {
    _id: string;
    date: string;
    type: string;
  };
  medications: Array<{
    medication: {
      _id: string;
      name: string;
      category: string;
    };
    dosage: string;
    frequency: string;
    duration: string;
    instructions?: string;
  }>;
  diagnosis?: string;
  notes?: string;
  status: 'active' | 'completed' | 'cancelled' | 'expired';
  prescribedDate: string;
  expiryDate: string;
  maxRefills: number;
  currentRefills: number;
  refillHistory: Array<{
    date: string;
    dispensedBy?: string;
    notes?: string;
  }>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePrescriptionData {
  patient: string;
  appointment?: string;
  medications: Array<{
    medication: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions?: string;
  }>;
  diagnosis?: string;
  notes?: string;
  expiryDate: string;
  maxRefills: number;
}

export interface UpdatePrescriptionData extends Partial<CreatePrescriptionData> {
  status?: 'active' | 'completed' | 'cancelled' | 'expired';
}

export interface RefillData {
  dispensedBy?: string;
  notes?: string;
  refillDate?: string;
}

export interface PrescriptionFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  patient?: string;
  dentist?: string;
  clinic?: string;
  medication?: string;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
  isExpiring?: boolean;
  daysToExpiry?: number;
}

export interface PrescriptionResponse {
  prescriptions: Prescription[];
  totalRecords: number;
  totalPages: number;
  currentPage: number;
}

export interface PrescriptionStats {
  totalPrescriptions: number;
  activePrescriptions: number;
  expiredPrescriptions: number;
  expiringPrescriptions: number;
  completedPrescriptions: number;
  cancelledPrescriptions: number;
  averageRefills: number;
  topMedications: Array<{
    medication: string;
    count: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    count: number;
  }>;
}

class PrescriptionService {
  private baseURL = '/prescriptions';

  // Get all prescriptions with filters
  async getPrescriptions(filters: PrescriptionFilters = {}) {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(`${this.baseURL}?${params.toString()}`);
    return response;
  }

  // Get prescription by ID
  async getPrescription(id: string) {
    const response = await api.get(`${this.baseURL}/${id}`);
    return response;
  }

  // Create new prescription
  async createPrescription(data: CreatePrescriptionData) {
    const response = await api.post(this.baseURL, data);
    return response;
  }

  // Update prescription
  async updatePrescription(id: string, data: UpdatePrescriptionData) {
    const response = await api.put(`${this.baseURL}/${id}`, data);
    return response;
  }

  // Delete prescription (soft delete)
  async deletePrescription(id: string) {
    const response = await api.delete(`${this.baseURL}/${id}`);
    return response;
  }

  // Get prescriptions by patient
  async getPrescriptionsByPatient(patientId: string, filters: PrescriptionFilters = {}) {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(`${this.baseURL}/patient/${patientId}?${params.toString()}`);
    return response;
  }

  // Get active prescriptions
  async getActivePrescriptions(filters: PrescriptionFilters = {}) {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(`${this.baseURL}/active?${params.toString()}`);
    return response;
  }

  // Get expiring prescriptions
  async getExpiringPrescriptions(daysToExpiry: number = 30, filters: PrescriptionFilters = {}) {
    const params = new URLSearchParams();
    params.append('daysToExpiry', daysToExpiry.toString());
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(`${this.baseURL}/expiring?${params.toString()}`);
    return response;
  }

  // Add refill to prescription
  async addRefill(prescriptionId: string, refillData: RefillData = {}) {
    const response = await api.post(`${this.baseURL}/${prescriptionId}/refill`, refillData);
    return response;
  }

  // Get refill history
  async getRefillHistory(prescriptionId: string) {
    const response = await api.get(`${this.baseURL}/${prescriptionId}/refills`);
    return response;
  }

  // Update refill
  async updateRefill(prescriptionId: string, refillId: string, refillData: Partial<RefillData>) {
    const response = await api.put(`${this.baseURL}/${prescriptionId}/refill/${refillId}`, refillData);
    return response;
  }

  // Delete refill
  async deleteRefill(prescriptionId: string, refillId: string) {
    const response = await api.delete(`${this.baseURL}/${prescriptionId}/refill/${refillId}`);
    return response;
  }

  // Search prescriptions
  async searchPrescriptions(query: string, filters: PrescriptionFilters = {}) {
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

  // Get prescription statistics
  async getPrescriptionStats(filters: {
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

    const response = await api.get(`${this.baseURL}/stats?${params.toString()}`);
    return response;
  }

  // Bulk operations
  async bulkUpdateStatus(prescriptionIds: string[], status: string) {
    const response = await api.put(`${this.baseURL}/bulk/status`, {
      prescriptionIds,
      status
    });
    return response;
  }

  async bulkDelete(prescriptionIds: string[]) {
    const response = await api.delete(`${this.baseURL}/bulk`, {
      data: { prescriptionIds }
    });
    return response;
  }

  // Export prescriptions
  async exportPrescriptions(filters: PrescriptionFilters = {}, format: 'csv' | 'pdf' = 'csv') {
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

  // Generate prescription PDF
  async generatePrescriptionPDF(prescriptionId: string) {
    const response = await api.get(`${this.baseURL}/${prescriptionId}/pdf`, {
      responseType: 'blob'
    });
    return response;
  }

  // Send prescription email
  async sendPrescriptionEmail(prescriptionId: string, emailData: {
    to?: string;
    subject?: string;
    message?: string;
  } = {}) {
    const response = await api.post(`${this.baseURL}/${prescriptionId}/send-email`, emailData);
    return response;
  }

  // Check drug interactions
  async checkDrugInteractions(medicationIds: string[]) {
    const response = await api.post(`${this.baseURL}/check-interactions`, {
      medicationIds
    });
    return response;
  }

  // Get prescription templates
  async getPrescriptionTemplates() {
    const response = await api.get(`${this.baseURL}/templates`);
    return response;
  }

  // Create prescription template
  async createPrescriptionTemplate(templateData: {
    name: string;
    description?: string;
    medications: Array<{
      medication: string;
      dosage: string;
      frequency: string;
      duration: string;
      instructions?: string;
    }>;
    diagnosis?: string;
    notes?: string;
  }) {
    const response = await api.post(`${this.baseURL}/templates`, templateData);
    return response;
  }

  // Update prescription template
  async updatePrescriptionTemplate(templateId: string, templateData: any) {
    const response = await api.put(`${this.baseURL}/templates/${templateId}`, templateData);
    return response;
  }

  // Delete prescription template
  async deletePrescriptionTemplate(templateId: string) {
    const response = await api.delete(`${this.baseURL}/templates/${templateId}`);
    return response;
  }

  // Get prescription analytics
  async getPrescriptionAnalytics(filters: {
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

  // Get medication usage trends
  async getMedicationTrends(filters: {
    startDate?: string;
    endDate?: string;
    medication?: string;
    category?: string;
  } = {}) {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(`${this.baseURL}/medication-trends?${params.toString()}`);
    return response;
  }

  // Validate prescription
  async validatePrescription(prescriptionData: CreatePrescriptionData | UpdatePrescriptionData) {
    const response = await api.post(`${this.baseURL}/validate`, prescriptionData);
    return response;
  }

  // Get prescription recommendations
  async getPrescriptionRecommendations(patientId: string, symptoms?: string[]) {
    const response = await api.post(`${this.baseURL}/recommendations`, {
      patientId,
      symptoms
    });
    return response;
  }
}

export const prescriptionService = new PrescriptionService();