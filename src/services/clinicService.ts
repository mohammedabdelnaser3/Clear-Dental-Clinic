import api from './api';
import type { Clinic, ApiResponse } from '../types';

// Helper function to transform backend clinic data
const transformClinicData = (clinic: any): Clinic => {
  return {
    id: clinic.id,
    name: clinic.name,
    branchName: clinic.branchName,
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
    // console.log('🏥 getAllClinics: Fetching from /api/v1/clinics/public...');
    const response = await api.get('/api/v1/clinics/public');
    // console.log('🏥 getAllClinics: Raw response:', response.data);
    
    // API returns double-nested structure: response.data.data.data
    const clinicsData = response.data?.data?.data;
    
    if (clinicsData && Array.isArray(clinicsData)) {
      console.log('🏥 getAllClinics: Found data array, transforming...');
      const clinics = clinicsData.map(transformClinicData);
      console.log('🏥 getAllClinics: Transformed', clinics.length, 'clinics:', clinics);
      return {
        success: true,
        data: clinics,
        message: 'Clinics retrieved successfully'
      };
    } else {
      console.warn('🏥 getAllClinics: No data array found. Structure:', response.data);
      return {
        success: false,
        data: [],
        message: 'No clinics found'
      };
    }
  } catch (error: any) {
    if (import.meta.env.DEV) {
      console.error('🏥 getAllClinics: Error:', error);
    }
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
    
    if (clinicsResponse.success && clinicsResponse.data && clinicsResponse.data.length > 0) {
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

// Get all unique branch names
export const getBranches = async (): Promise<ApiResponse<string[]>> => {
  try {
    console.log('🌱 getBranches: Starting...');
    const clinicsResponse = await getAllClinics();
    console.log('🌱 getBranches: Clinics response:', clinicsResponse);
    
    if (clinicsResponse.success && clinicsResponse.data) {
      console.log('🌱 getBranches: Total clinics:', clinicsResponse.data.length);
      
      const branches = [...new Set(
        clinicsResponse.data
          .map(clinic => {
            console.log('🌱 Clinic:', clinic.name, 'Branch:', clinic.branchName);
            return clinic.branchName;
          })
          .filter((branch): branch is string => !!branch)
      )];
      
      console.log('🌱 getBranches: Extracted branches:', branches);
      
      if (branches.length === 0) {
        return {
          success: false,
          data: [],
          message: 'No branches found in clinics'
        };
      }
      
      return {
        success: true,
        data: branches.sort(),
        message: 'Branches retrieved successfully'
      };
    } else {
      if (import.meta.env.DEV) {
        console.error('🌱 getBranches: Clinics response failed:', clinicsResponse);
      }
      return {
        success: false,
        data: [],
        message: clinicsResponse.message || 'No branches found'
      };
    }
  } catch (error: any) {
    if (import.meta.env.DEV) {
      console.error('🌱 getBranches: Error:', error);
    }
    return {
      success: false,
      data: [],
      message: error.message || 'Failed to retrieve branches'
    };
  }
};

// Get clinics by branch name
export const getClinicsByBranch = async (branchName: string): Promise<ApiResponse<Clinic[]>> => {
  try {
    const clinicsResponse = await getAllClinics();
    
    if (clinicsResponse.success && clinicsResponse.data) {
      const branchClinics = clinicsResponse.data.filter(
        clinic => clinic.branchName === branchName
      );
      
      return {
        success: true,
        data: branchClinics,
        message: `Clinics for ${branchName} branch retrieved successfully`
      };
    } else {
      return {
        success: false,
        data: [],
        message: 'No clinics found for this branch'
      };
    }
  } catch (error: any) {
    return {
      success: false,
      data: [],
      message: error.message || 'Failed to retrieve clinics for branch'
    };
  }
};

// Get clinic by ID
export const getClinicById = async (clinicId: string): Promise<ApiResponse<Clinic | null>> => {
  try {
    const response = await api.get(`/api/v1/clinics/${clinicId}`);
    
    if (response.data?.data) {
      const clinic = transformClinicData(response.data.data);
      return {
        success: true,
        data: clinic,
        message: 'Clinic retrieved successfully'
      };
    } else {
      return {
        success: false,
        data: null,
        message: 'Clinic not found'
      };
    }
  } catch (error: any) {
    return {
      success: false,
      data: null,
      message: error.response?.data?.message || error.message || 'Failed to retrieve clinic'
    };
  }
};