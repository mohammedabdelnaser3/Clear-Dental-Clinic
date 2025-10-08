import api from './api';
import type { Patient, PatientReport, ApiResponse, PaginatedResponse } from '../types';
import { createSafeApiParams } from '../utils/clinicUtils';

// Helper function to transform backend patient data
const transformPatientData = (patient: any): Patient => {

  
  return {
    id: patient.id || patient._id, // Use patient.id if available, fallback to _id
    firstName: patient.firstName,
    lastName: patient.lastName,
    email: patient.email,
    phone: patient.phone,
    dateOfBirth: new Date(patient.dateOfBirth),
    gender: patient.gender || 'male',
    address: patient.address,
    medicalHistory: patient.medicalHistory || {
      allergies: [],
      medications: [],
      conditions: [],
      notes: ''
    },
    treatmentRecords: patient.treatmentRecords || [],
    preferredClinicId: patient.preferredClinicId || patient.preferredClinic,
    emergencyContact: patient.emergencyContact,
    isActive: patient.isActive !== undefined ? patient.isActive : true,
    userId: patient.userId, // Link to user account
    createdAt: new Date(patient.createdAt),
    updatedAt: new Date(patient.updatedAt)
  };
};

// Get all patients (role-based filtering applied on backend)
export const getPatients = async (params?: {
  search?: string;
  clinicId?: string;
  page?: number;
  limit?: number;
  patientId?: string; // For patient role - only their own data
}): Promise<PaginatedResponse<Patient>> => {
  try {
    // Ensure clinic ID is properly formatted
    const safeParams = params ? {
      ...params,
      ...createSafeApiParams(params.clinicId)
    } : undefined;
    
    const response = await api.get<PaginatedResponse<any>>('/api/v1/patients', { params: safeParams });
    

    
    return {
      ...response.data,
      data: response.data.data.map(transformPatientData),
      totalPages: Math.ceil(response.data.total / (params?.limit || 10))
    };
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch patients';
    throw new Error(errorMessage);
  }
};

// Get patient by ID
export const getPatientById = async (id: string): Promise<Patient> => {
  try {
    const response = await api.get<ApiResponse<any>>(`/api/v1/patients/${id}`);
    return transformPatientData(response.data.data);
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch patient';
    throw new Error(errorMessage);
  }
};

// Create a new patient
export const createPatient = async (patientData: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>): Promise<Patient> => {
  try {
    const response = await api.post<ApiResponse<any>>('/api/v1/patients', patientData);
    return transformPatientData(response.data.data);
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to create patient';
    throw new Error(errorMessage);
  }
};

// Update an existing patient
export const updatePatient = async (id: string, patientData: Partial<Patient>): Promise<Patient> => {
  try {
    const response = await api.put<ApiResponse<any>>(`/api/v1/patients/${id}`, patientData);
    return transformPatientData(response.data.data);
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to update patient';
    throw new Error(errorMessage);
  }
};

// Delete a patient
export const deletePatient = async (id: string): Promise<void> => {
  try {
    await api.delete(`/api/v1/patients/${id}`);
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to delete patient';
    throw new Error(errorMessage);
  }
};

// Get patient reports (role-based access control)
export const getPatientReports = async (patientId?: string): Promise<PatientReport[]> => {
  try {
    // If no patientId provided, backend will return reports based on user role
    console.log('patientId', patientId);
    const endpoint = patientId ? `/api/v1/patients/${patientId}/reports` : '/api/v1/reports/my-reports';
    const response = await api.get<ApiResponse<PatientReport[]>>(endpoint);
    return response.data.data || [];
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch patient reports';
    throw new Error(errorMessage);
  }
};

// Create patient report
export const createPatientReport = async (reportData: Omit<PatientReport, 'id' | 'createdAt' | 'updatedAt'>): Promise<PatientReport> => {
  try {
    const response = await api.post<ApiResponse<PatientReport>>(`/api/v1/patients/${reportData.patientId}/reports`, reportData);
    if (!response.data.data) {
      throw new Error('No data returned from server');
    }
    return response.data.data;
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to create patient report';
    throw new Error(errorMessage);
  }
};

// Update patient report
export const updatePatientReport = async (reportId: string, reportData: Partial<PatientReport>): Promise<PatientReport> => {
  try {
    const response = await api.put<ApiResponse<PatientReport>>(`/api/v1/reports/${reportId}`, reportData);
    if (!response.data.data) {
      throw new Error('No data returned from server');
    }
    return response.data.data;
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to update patient report';
    throw new Error(errorMessage);
  }
};

// Delete patient report
export const deletePatientReport = async (reportId: string): Promise<void> => {
  try {
    await api.delete(`/api/v1/reports/${reportId}`);
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to delete patient report';
    throw new Error(errorMessage);
  }
};

// Get patients by user ID (for linking user accounts to patient records)
export const getPatientsByUserId = async (userId: string, params?: {
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<Patient>> => {
  try {
    // Using a more reliable endpoint or adding fallback logic
    let response;
    try {
      response = await api.get<PaginatedResponse<any>>(`/api/v1/patients/user/${userId}`, { params });
    } catch (innerError) {
      // Fallback to alternative endpoint if the first one fails
      console.warn(`Error getting patient ID: ${innerError}`);
      // Return empty response instead of throwing error
      return {
        success: true,
        data: [],
        total: 0,
        page: params?.page || 1,
        limit: params?.limit || 10,
        totalPages: 0
      };
    }
    
    return {
      ...response.data,
      data: response.data.data.map(transformPatientData)
    };
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch patients for user';
    throw new Error(errorMessage);
  }
};

// Create service instance
const patientService = {
  getPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient,
  getPatientReports,
  createPatientReport,
  updatePatientReport,
  deletePatientReport,
  getPatientsByUserId
};

export { patientService };
export default patientService;