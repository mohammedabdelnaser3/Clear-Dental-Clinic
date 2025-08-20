import api from './api';
import type { ApiResponse } from '../types';

export interface TreatmentRecord {
  _id: string;
  patient: {
    _id: string;
    firstName: string;
    lastName: string;
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
  treatment: string;
  procedure: string;
  diagnosis: string;
  notes?: string;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  startDate: string;
  endDate?: string;
  duration?: number; // in minutes
  cost?: number;
  attachments?: Array<{
    id: string;
    fileName: string;
    fileType: string;
    fileUrl: string;
    uploadedAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTreatmentData {
  patient: string;
  dentist: string;
  clinic: string;
  appointment?: string;
  treatment: string;
  procedure: string;
  diagnosis: string;
  notes?: string;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  startDate: string;
  endDate?: string;
  duration?: number;
  cost?: number;
}

export interface UpdateTreatmentData extends Partial<CreateTreatmentData> {}

export interface TreatmentFilters {
  page?: number;
  limit?: number;
  search?: string;
  patient?: string;
  dentist?: string;
  clinic?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  treatment?: string;
}

export interface TreatmentResponse {
  treatmentRecords: TreatmentRecord[];
  totalRecords: number;
  totalPages: number;
  currentPage: number;
}

// Helper function to transform treatment data
const transformTreatmentData = (treatment: any): TreatmentRecord => {
  return {
    _id: treatment._id,
    patient: treatment.patient,
    dentist: treatment.dentist,
    clinic: treatment.clinic,
    appointment: treatment.appointment,
    treatment: treatment.treatment,
    procedure: treatment.procedure,
    diagnosis: treatment.diagnosis,
    notes: treatment.notes,
    status: treatment.status,
    startDate: treatment.startDate,
    endDate: treatment.endDate,
    duration: treatment.duration,
    cost: treatment.cost,
    attachments: treatment.attachments,
    createdAt: treatment.createdAt,
    updatedAt: treatment.updatedAt
  };
};

class TreatmentService {
  private baseURL = '/treatments';

  // Get all treatment records with filters
  async getTreatmentRecords(filters: TreatmentFilters = {}): Promise<ApiResponse<TreatmentResponse>> {
    try {
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });

      const response = await api.get(`${this.baseURL}?${params.toString()}`);
      const treatmentRecords = response.data.data.treatmentRecords.map(transformTreatmentData);
      
      return {
        success: true,
        data: {
          treatmentRecords,
          totalRecords: response.data.data.totalRecords,
          totalPages: response.data.data.totalPages,
          currentPage: response.data.data.currentPage
        },
        message: 'Treatment records retrieved successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        data: {
          treatmentRecords: [],
          totalRecords: 0,
          totalPages: 0,
          currentPage: 0
        },
        message: error.response?.data?.message || error.message || 'Failed to fetch treatment records'
      };
    }
  }

  // Get treatment record by ID
  async getTreatmentRecord(id: string): Promise<ApiResponse<TreatmentRecord>> {
    try {
      const response = await api.get(`${this.baseURL}/${id}`);
      const treatmentRecord = transformTreatmentData(response.data.data);
      
      return {
        success: true,
        data: treatmentRecord,
        message: 'Treatment record retrieved successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        data: {} as TreatmentRecord,
        message: error.response?.data?.message || error.message || 'Failed to fetch treatment record'
      };
    }
  }

  // Create new treatment record
  async createTreatmentRecord(data: CreateTreatmentData) {
    try {
      const response = await api.post(this.baseURL, data);
      return response;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create treatment record';
      throw new Error(errorMessage);
    }
  }

  // Update treatment record
  async updateTreatmentRecord(id: string, data: UpdateTreatmentData) {
    try {
      const response = await api.put(`${this.baseURL}/${id}`, data);
      return response;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update treatment record';
      throw new Error(errorMessage);
    }
  }

  // Delete treatment record
  async deleteTreatmentRecord(id: string) {
    try {
      const response = await api.delete(`${this.baseURL}/${id}`);
      return response;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete treatment record';
      throw new Error(errorMessage);
    }
  }

  // Get treatment statistics
  async getTreatmentStats(filters: { startDate?: string; endDate?: string; dentist?: string; clinic?: string } = {}) {
    try {
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });

      const response = await api.get(`${this.baseURL}/stats?${params.toString()}`);
      return response;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch treatment statistics';
      throw new Error(errorMessage);
    }
  }
}

// Create and export service instance
const treatmentService = new TreatmentService();

// Export individual functions
export const getTreatmentRecords = treatmentService.getTreatmentRecords.bind(treatmentService);
export const getTreatmentRecord = treatmentService.getTreatmentRecord.bind(treatmentService);
export const createTreatmentRecord = treatmentService.createTreatmentRecord.bind(treatmentService);
export const updateTreatmentRecord = treatmentService.updateTreatmentRecord.bind(treatmentService);
export const deleteTreatmentRecord = treatmentService.deleteTreatmentRecord.bind(treatmentService);
export const getTreatmentStats = treatmentService.getTreatmentStats.bind(treatmentService);

// Export service instance as both named and default export
export { treatmentService };
export default treatmentService;