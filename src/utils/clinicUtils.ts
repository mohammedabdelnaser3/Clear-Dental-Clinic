/**
 * Utility functions for handling clinic data
 */

/**
 * Safely extracts clinic ID from various input types
 * Handles cases where entire clinic objects are passed instead of just IDs
 * 
 * @param clinicInput - Can be a string ID, clinic object, or null/undefined
 * @returns string clinic ID or undefined
 */
export const extractClinicId = (clinicInput: any): string | undefined => {
  if (!clinicInput) {
    return undefined;
  }
  
  // If it's already a string, return it
  if (typeof clinicInput === 'string') {
    return clinicInput;
  }
  
  // If it's an object, try to extract the ID
  if (typeof clinicInput === 'object' && clinicInput !== null) {
    // Try common ID field names
    return clinicInput.id || clinicInput._id || clinicInput.clinicId;
  }
  
  // Fallback: convert to string
  return String(clinicInput);
};

/**
 * Creates safe API parameters with proper clinic ID
 * 
 * @param clinicInput - Clinic ID or clinic object
 * @param additionalParams - Additional parameters to include
 * @returns Object with safe parameters for API calls
 */
export const createSafeApiParams = (
  clinicInput: any, 
  additionalParams: Record<string, any> = {}
): Record<string, any> => {
  const clinicId = extractClinicId(clinicInput);
  
  // Debug logging to catch any issues (development only)
  if (import.meta.env.DEV && clinicInput && typeof clinicInput === 'object' && clinicInput !== null) {
    console.log('🔍 createSafeApiParams received object:', {
      input: clinicInput,
      extractedId: clinicId,
      inputType: typeof clinicInput,
      hasId: 'id' in clinicInput,
      hasClinicId: 'clinicId' in clinicInput,
      has_id: '_id' in clinicInput
    });
  }
  
  const params = { ...additionalParams };
  
  if (clinicId) {
    // Ensure the clinicId is a string and not an object
    if (typeof clinicId === 'string') {
      params.clinicId = clinicId;
    } else {
      console.warn('⚠️ Clinic ID is not a string:', clinicId, typeof clinicId);
      params.clinicId = String(clinicId);
    }
  }
  
  return params;
};

/**
 * Validates that a clinic ID is a valid string
 * 
 * @param clinicId - Clinic ID to validate
 * @returns boolean indicating if the clinic ID is valid
 */
export const isValidClinicId = (clinicId: any): boolean => {
  return typeof clinicId === 'string' && clinicId.length > 0;
};
