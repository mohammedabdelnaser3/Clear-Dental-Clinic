import api from './api';
import type { Clinic, ApiResponse } from '../types';

// Helper function to transform backend clinic data
const transformClinicData = (clinic: any): Clinic => {
  return {
    id: clinic._id,
    name: clinic.name,
    address: clinic.address,
    phone: clinic.phone,
    email: clinic.email,
    website: clinic.website,
    operatingHours: clinic.operatingHours,
    services: clinic.services || [],
    staff: clinic.staff || [],
    isActive: clinic.isActive,
    createdAt: new Date(clinic.createdAt),
    updatedAt: new Date(clinic.updatedAt)
  };
};

// Get all clinics
export const getClinics = async (): Promise<ApiResponse<Clinic[]>> => {
  try {
    const response = await api.get('/clinics');
    const clinics = response.data.data.map(transformClinicData);
    
    return {
      success: true,
      data: clinics,
      message: 'Clinics retrieved successfully'
    };
  } catch (error: any) {
    return {
      success: false,
      data: [],
      message: error.response?.data?.message || error.message || 'Failed to retrieve clinics'
    };
  }
};

// Get clinic by ID
export const getClinicById = async (id: string): Promise<ApiResponse<Clinic | null>> => {
  try {
    const response = await api.get(`/clinics/${id}`);
    const clinic = transformClinicData(response.data.data);
    
    return {
      success: true,
      data: clinic,
      message: 'Clinic retrieved successfully'
    };
  } catch (error: any) {
    return {
      success: false,
      data: null,
      message: error.response?.data?.message || error.message || 'Failed to retrieve clinic'
    };
  }
};

// Create clinic
export const createClinic = async (clinicData: Omit<Clinic, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Clinic>> => {
  try {
    const response = await api.post('/clinics', clinicData);
    const clinic = transformClinicData(response.data.data);
    
    return {
      success: true,
      data: clinic,
      message: 'Clinic created successfully'
    };
  } catch (error: any) {
    return {
      success: false,
      data: {} as Clinic,
      message: error.response?.data?.message || error.message || 'Failed to create clinic'
    };
  }
};

// Update clinic
export const updateClinic = async (id: string, clinicData: Partial<Clinic>): Promise<ApiResponse<Clinic>> => {
  try {
    const response = await api.put(`/clinics/${id}`, clinicData);
    const clinic = transformClinicData(response.data.data);
    
    return {
      success: true,
      data: clinic,
      message: 'Clinic updated successfully'
    };
  } catch (error: any) {
    return {
      success: false,
      data: {} as Clinic,
      message: error.response?.data?.message || error.message || 'Failed to update clinic'
    };
  }
};

// Delete clinic
export const deleteClinic = async (id: string): Promise<ApiResponse<null>> => {
  try {
    await api.delete(`/clinics/${id}`);
    
    return {
      success: true,
      data: null,
      message: 'Clinic deleted successfully'
    };
  } catch (error: any) {
    return {
      success: false,
      data: null,
      message: error.response?.data?.message || error.message || 'Failed to delete clinic'
    };
  }
};