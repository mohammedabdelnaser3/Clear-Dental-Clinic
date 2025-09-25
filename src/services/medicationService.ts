import api from './api';

export interface Medication {
  _id: string;
  name: string;
  dosage: string;
  frequency: string;
  duration?: string;
  category: 'antibiotic' | 'painkiller' | 'anti-inflammatory' | 'anesthetic' | 'antiseptic' | 'other';
  instructions?: string;
  sideEffects?: string[];
  contraindications?: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMedicationData {
  name: string;
  dosage: string;
  frequency: string;
  duration?: string;
  category: 'antibiotic' | 'painkiller' | 'anti-inflammatory' | 'anesthetic' | 'antiseptic' | 'other';
  instructions?: string;
  sideEffects?: string[];
  contraindications?: string[];
}

export interface UpdateMedicationData extends Partial<CreateMedicationData> {}

export interface MedicationFilters {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  isActive?: boolean;
  patientId?: string;
}

export interface MedicationResponse {
  medications: Medication[];
  totalRecords: number;
  totalPages: number;
  currentPage: number;
}

class MedicationService {
  private baseURL = '/api/v1/medications';

  // Get all medications with filters
  async getMedications(filters: MedicationFilters = {}) {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(`${this.baseURL}?${params.toString()}`);
    return response;
  }

  // Get medication by ID
  async getMedication(id: string) {
    const response = await api.get(`${this.baseURL}/${id}`);
    return response;
  }

  // Create new medication
  async createMedication(data: CreateMedicationData) {
    const response = await api.post(this.baseURL, data);
    return response;
  }

  // Update medication
  async updateMedication(id: string, data: UpdateMedicationData) {
    const response = await api.put(`${this.baseURL}/${id}`, data);
    return response;
  }

  // Delete medication (soft delete)
  async deleteMedication(id: string) {
    const response = await api.delete(`${this.baseURL}/${id}`);
    return response;
  }

  // Search medications
  async searchMedications(query: string, filters: MedicationFilters = {}) {
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

  // Get medications by category
  async getMedicationsByCategory(category: string, filters: MedicationFilters = {}) {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(`${this.baseURL}/category/${category}?${params.toString()}`);
    return response;
  }

  // Get medication categories
  async getMedicationCategories() {
    const response = await api.get(`${this.baseURL}/categories`);
    return response;
  }

  // Bulk operations
  async bulkUpdateStatus(medicationIds: string[], isActive: boolean) {
    const response = await api.put(`${this.baseURL}/bulk/status`, {
      medicationIds,
      isActive
    });
    return response;
  }

  async bulkDelete(medicationIds: string[]) {
    const response = await api.delete(`${this.baseURL}/bulk`, {
      data: { medicationIds }
    });
    return response;
  }

  // Export medications
  async exportMedications(filters: MedicationFilters = {}, format: 'csv' | 'pdf' = 'csv') {
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

  // Get medication statistics
  async getMedicationStats() {
    const response = await api.get(`${this.baseURL}/stats`);
    return response;
  }

  // Get popular medications
  async getPopularMedications(limit: number = 10) {
    const response = await api.get(`${this.baseURL}/popular?limit=${limit}`);
    return response;
  }

  // Check medication interactions
  async checkInteractions(medicationIds: string[]) {
    const response = await api.post(`${this.baseURL}/interactions`, {
      medicationIds
    });
    return response;
  }

  // Get medication suggestions based on symptoms or conditions
  async getMedicationSuggestions(query: string) {
    const response = await api.get(`${this.baseURL}/suggestions?q=${encodeURIComponent(query)}`);
    return response;
  }

  // Validate medication data
  async validateMedication(data: CreateMedicationData | UpdateMedicationData) {
    const response = await api.post(`${this.baseURL}/validate`, data);
    return response;
  }

  // Get medication usage analytics
  async getMedicationAnalytics(filters: {
    startDate?: string;
    endDate?: string;
    category?: string;
    groupBy?: 'day' | 'week' | 'month';
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

  // Get patient medications (prescribed medications for a specific patient)
  async getPatientMedications(patientId: string, filters: MedicationFilters = {}) {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(`/api/v1/patients/${patientId}/medications?${params.toString()}`);
    return response;
  }
}

export const medicationService = new MedicationService();