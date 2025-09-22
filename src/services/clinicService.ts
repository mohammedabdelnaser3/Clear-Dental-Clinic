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

// Use the actual clinic ID from the database (Dr. Gamal Abdel Nasser Center)
// const SINGLE_CLINIC_ID = '687468107e70478314c346b6';

// Get all clinics
export const getAllClinics = async (): Promise<ApiResponse<Clinic[]>> => {
  try {
    const response = await api.get('/api/v1/clinics/public');
    
    if (response.data?.data) {
      const clinics = response.data.data.map(transformClinicData);
      return {
        success: true,
        data: clinics,
        message: 'Clinics retrieved successfully'
      };
    } else {
      return {
        success: false,
        data: [],
        message: 'No clinics found'
      };
    }
  } catch (error: any) {
    return {
      success: false,
      data: [],
      message: error.response?.data?.message || error.message || 'Failed to retrieve clinics'
    };
  }
};

// Get single clinic data (backward compatibility)
export const getClinic = async (): Promise<ApiResponse<Clinic | null>> => {
  try {
    const clinicsResponse = await getAllClinics();
    
    if (clinicsResponse.success && clinicsResponse.data.length > 0) {
      return {
        success: true,
        data: clinicsResponse.data[0],
        message: 'Clinic retrieved successfully'
      };
    } else {
      return {
        success: false,
        data: null,
        message: 'No clinics found'
      };
    }
  } catch (error: any) {
    return {
      success: false,
      data: null,
      message: error.message || 'Failed to retrieve clinic'
    };
  }
};