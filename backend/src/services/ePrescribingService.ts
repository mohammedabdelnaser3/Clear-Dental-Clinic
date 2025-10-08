/**
 * ePrescribing Service - Surescripts Integration
 * 
 * This service provides integration with Surescripts (or compatible) e-prescribing APIs
 * Handles electronic prescription sending, medication history, and formulary checking
 */

import axios, { AxiosInstance } from 'axios';
import { AppError } from '../middleware/errorHandler';

interface SurescriptsConfig {
  baseUrl: string;
  apiKey: string;
  username: string;
  password: string;
  practiceId: string;
  environment: 'sandbox' | 'production';
}

interface Medication {
  ndc: string; // National Drug Code
  name: string;
  genericName?: string;
  strength: string;
  dosageForm: string;
}

interface PrescriptionRequest {
  patientId: string;
  prescriberId: string;
  medication: Medication;
  directions: string;
  quantity: number;
  refills: number;
  daysSupply: number;
  pharmacyNCPDP?: string; // Pharmacy identifier
  substitutionAllowed: boolean;
  priorAuthorizationRequired?: boolean;
}

interface MedicationHistoryResponse {
  medications: Array<{
    name: string;
    genericName: string;
    ndc: string;
    strength: string;
    dosageForm: string;
    lastFillDate: Date;
    prescriber: string;
    pharmacy: string;
    status: 'active' | 'discontinued' | 'completed';
  }>;
  retrieved: Date;
}

interface DrugInteractionCheck {
  severity: 'mild' | 'moderate' | 'severe' | 'contraindicated';
  description: string;
  drug1: string;
  drug2: string;
  clinicalEffects: string[];
  recommendations: string[];
}

interface FormularyCheckResult {
  covered: boolean;
  tier: number;
  copay?: number;
  priorAuthRequired: boolean;
  quantityLimit?: number;
  alternatives?: Array<{
    name: string;
    genericName: string;
    tier: number;
    copay: number;
  }>;
}

class EPrescribingService {
  private client: AxiosInstance;
  private config: SurescriptsConfig;
  private enabled: boolean;

  constructor() {
    // Load configuration from environment variables
    this.config = {
      baseUrl: process.env.SURESCRIPTS_BASE_URL || 'https://api-sandbox.surescripts.com',
      apiKey: process.env.SURESCRIPTS_API_KEY || '',
      username: process.env.SURESCRIPTS_USERNAME || '',
      password: process.env.SURESCRIPTS_PASSWORD || '',
      practiceId: process.env.SURESCRIPTS_PRACTICE_ID || '',
      environment: (process.env.SURESCRIPTS_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox'
    };

    // Service is enabled only if credentials are configured
    this.enabled = !!(this.config.apiKey && this.config.username && this.config.password);

    if (this.enabled) {
      this.client = axios.create({
        baseURL: this.config.baseUrl,
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
          'X-Practice-ID': this.config.practiceId
        },
        auth: {
          username: this.config.username,
          password: this.config.password
        }
      });

      // Request interceptor for logging
      this.client.interceptors.request.use(
        (config) => {
          console.log(`[ePrescribing] ${config.method?.toUpperCase()} ${config.url}`);
          return config;
        },
        (error) => {
          console.error('[ePrescribing] Request error:', error);
          return Promise.reject(error);
        }
      );

      // Response interceptor for error handling
      this.client.interceptors.response.use(
        (response) => response,
        (error) => {
          console.error('[ePrescribing] Response error:', error.response?.data || error.message);
          throw new AppError(
            error.response?.data?.message || 'ePrescribing service error',
            error.response?.status || 500
          );
        }
      );
    } else {
      console.warn('[ePrescribing] Service disabled - credentials not configured');
      // Create a dummy client for type safety
      this.client = {} as AxiosInstance;
    }
  }

  /**
   * Check if the service is enabled and configured
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Send electronic prescription to pharmacy
   */
  async sendPrescription(prescriptionData: PrescriptionRequest): Promise<{
    success: boolean;
    prescriptionId: string;
    status: string;
    sentAt: Date;
  }> {
    if (!this.enabled) {
      console.warn('[ePrescribing] Service not enabled, returning mock response');
      return {
        success: true,
        prescriptionId: `MOCK-${Date.now()}`,
        status: 'sent',
        sentAt: new Date()
      };
    }

    try {
      const response = await this.client.post('/v1/prescriptions', {
        patient: {
          id: prescriptionData.patientId
        },
        prescriber: {
          id: prescriptionData.prescriberId,
          practiceId: this.config.practiceId
        },
        medication: {
          ndc: prescriptionData.medication.ndc,
          name: prescriptionData.medication.name,
          strength: prescriptionData.medication.strength,
          dosageForm: prescriptionData.medication.dosageForm
        },
        directions: prescriptionData.directions,
        quantity: prescriptionData.quantity,
        refills: prescriptionData.refills,
        daysSupply: prescriptionData.daysSupply,
        substitutionAllowed: prescriptionData.substitutionAllowed,
        pharmacy: {
          ncpdp: prescriptionData.pharmacyNCPDP
        },
        priorAuthorizationRequired: prescriptionData.priorAuthorizationRequired || false
      });

      return {
        success: true,
        prescriptionId: response.data.prescriptionId,
        status: response.data.status,
        sentAt: new Date()
      };
    } catch (error: any) {
      console.error('[ePrescribing] Failed to send prescription:', error);
      throw new AppError('Failed to send electronic prescription', 500);
    }
  }

  /**
   * Get patient medication history from Surescripts network
   */
  async getMedicationHistory(patientId: string): Promise<MedicationHistoryResponse> {
    if (!this.enabled) {
      console.warn('[ePrescribing] Service not enabled, returning mock medication history');
      return {
        medications: [],
        retrieved: new Date()
      };
    }

    try {
      const response = await this.client.get(`/v1/patients/${patientId}/medication-history`);

      return {
        medications: response.data.medications.map((med: any) => ({
          name: med.name,
          genericName: med.genericName,
          ndc: med.ndc,
          strength: med.strength,
          dosageForm: med.dosageForm,
          lastFillDate: new Date(med.lastFillDate),
          prescriber: med.prescriber,
          pharmacy: med.pharmacy,
          status: med.status
        })),
        retrieved: new Date()
      };
    } catch (error: any) {
      console.error('[ePrescribing] Failed to fetch medication history:', error);
      // Return empty history rather than failing completely
      return {
        medications: [],
        retrieved: new Date()
      };
    }
  }

  /**
   * Check for drug-drug interactions
   */
  async checkDrugInteractions(medications: string[]): Promise<DrugInteractionCheck[]> {
    if (!this.enabled) {
      console.warn('[ePrescribing] Service not enabled, returning mock interaction check');
      return this.mockDrugInteractionCheck(medications);
    }

    try {
      const response = await this.client.post('/v1/drug-interactions/check', {
        medications
      });

      return response.data.interactions.map((interaction: any) => ({
        severity: interaction.severity,
        description: interaction.description,
        drug1: interaction.drug1,
        drug2: interaction.drug2,
        clinicalEffects: interaction.clinicalEffects || [],
        recommendations: interaction.recommendations || []
      }));
    } catch (error: any) {
      console.error('[ePrescribing] Failed to check drug interactions:', error);
      // Return mock data as fallback
      return this.mockDrugInteractionCheck(medications);
    }
  }

  /**
   * Check formulary coverage and alternatives
   */
  async checkFormulary(
    medicationNDC: string,
    patientInsuranceId?: string
  ): Promise<FormularyCheckResult> {
    if (!this.enabled) {
      console.warn('[ePrescribing] Service not enabled, returning mock formulary check');
      return {
        covered: true,
        tier: 2,
        copay: 15,
        priorAuthRequired: false,
        quantityLimit: 90,
        alternatives: []
      };
    }

    try {
      const response = await this.client.post('/v1/formulary/check', {
        ndc: medicationNDC,
        insuranceId: patientInsuranceId
      });

      return {
        covered: response.data.covered,
        tier: response.data.tier,
        copay: response.data.copay,
        priorAuthRequired: response.data.priorAuthRequired,
        quantityLimit: response.data.quantityLimit,
        alternatives: response.data.alternatives || []
      };
    } catch (error: any) {
      console.error('[ePrescribing] Failed to check formulary:', error);
      // Return generic coverage info as fallback
      return {
        covered: true,
        tier: 2,
        copay: undefined,
        priorAuthRequired: false,
        alternatives: []
      };
    }
  }

  /**
   * Search for medications in the drug database
   */
  async searchMedications(searchTerm: string, limit: number = 20): Promise<Medication[]> {
    if (!this.enabled) {
      console.warn('[ePrescribing] Service not enabled, returning mock medication search');
      return this.mockMedicationSearch(searchTerm, limit);
    }

    try {
      const response = await this.client.get('/v1/medications/search', {
        params: {
          q: searchTerm,
          limit
        }
      });

      return response.data.medications.map((med: any) => ({
        ndc: med.ndc,
        name: med.name,
        genericName: med.genericName,
        strength: med.strength,
        dosageForm: med.dosageForm
      }));
    } catch (error: any) {
      console.error('[ePrescribing] Failed to search medications:', error);
      return this.mockMedicationSearch(searchTerm, limit);
    }
  }

  /**
   * Verify prescriber credentials with DEA/NPI
   */
  async verifyPrescriber(npi: string, deaNumber?: string): Promise<{
    valid: boolean;
    prescriber: {
      name: string;
      npi: string;
      deaNumber?: string;
      specialties: string[];
    };
  }> {
    if (!this.enabled) {
      return {
        valid: true,
        prescriber: {
          name: 'Mock Prescriber',
          npi,
          deaNumber,
          specialties: ['Dentistry']
        }
      };
    }

    try {
      const response = await this.client.post('/v1/prescribers/verify', {
        npi,
        deaNumber
      });

      return {
        valid: response.data.valid,
        prescriber: response.data.prescriber
      };
    } catch (error: any) {
      console.error('[ePrescribing] Failed to verify prescriber:', error);
      return {
        valid: false,
        prescriber: {
          name: '',
          npi,
          deaNumber,
          specialties: []
        }
      };
    }
  }

  // ============================================================================
  // Mock Data Helpers (used when service is disabled or as fallbacks)
  // ============================================================================

  private mockDrugInteractionCheck(medications: string[]): DrugInteractionCheck[] {
    // Basic mock interaction logic for common dental medications
    const interactions: DrugInteractionCheck[] = [];

    // Check for common interactions
    if (medications.includes('warfarin') && medications.includes('ibuprofen')) {
      interactions.push({
        severity: 'severe',
        description: 'Increased risk of bleeding',
        drug1: 'Warfarin',
        drug2: 'Ibuprofen',
        clinicalEffects: ['Increased anticoagulant effect', 'Gastrointestinal bleeding risk'],
        recommendations: ['Consider alternative pain management', 'Monitor INR closely', 'Use acetaminophen instead']
      });
    }

    if (medications.includes('metronidazole') && medications.includes('alcohol')) {
      interactions.push({
        severity: 'moderate',
        description: 'Disulfiram-like reaction possible',
        drug1: 'Metronidazole',
        drug2: 'Alcohol',
        clinicalEffects: ['Nausea', 'Vomiting', 'Flushing', 'Tachycardia'],
        recommendations: ['Avoid alcohol during treatment and for 48 hours after']
      });
    }

    return interactions;
  }

  private mockMedicationSearch(searchTerm: string, limit: number): Medication[] {
    // Common dental medications database (mock)
    const dentalMeds: Medication[] = [
      { ndc: '00781-1506-10', name: 'Amoxicillin 500mg Capsule', genericName: 'Amoxicillin', strength: '500mg', dosageForm: 'Capsule' },
      { ndc: '00093-2264-01', name: 'Ibuprofen 600mg Tablet', genericName: 'Ibuprofen', strength: '600mg', dosageForm: 'Tablet' },
      { ndc: '00179-0155-01', name: 'Hydrocodone-Acetaminophen 5-325mg Tablet', genericName: 'Hydrocodone/Acetaminophen', strength: '5-325mg', dosageForm: 'Tablet' },
      { ndc: '00093-3109-01', name: 'Clindamycin 150mg Capsule', genericName: 'Clindamycin', strength: '150mg', dosageForm: 'Capsule' },
      { ndc: '66336-0718-30', name: 'Azithromycin 250mg Tablet', genericName: 'Azithromycin', strength: '250mg', dosageForm: 'Tablet' },
      { ndc: '00378-0613-93', name: 'Penicillin VK 500mg Tablet', genericName: 'Penicillin V Potassium', strength: '500mg', dosageForm: 'Tablet' },
      { ndc: '00093-0147-01', name: 'Metronidazole 500mg Tablet', genericName: 'Metronidazole', strength: '500mg', dosageForm: 'Tablet' },
      { ndc: '00781-5092-10', name: 'Amoxicillin-Clavulanate 875-125mg Tablet', genericName: 'Amoxicillin/Clavulanate', strength: '875-125mg', dosageForm: 'Tablet' },
      { ndc: '00378-3967-01', name: 'Acetaminophen 500mg Tablet', genericName: 'Acetaminophen', strength: '500mg', dosageForm: 'Tablet' },
      { ndc: '00228-2063-10', name: 'Chlorhexidine Gluconate 0.12% Oral Rinse', genericName: 'Chlorhexidine', strength: '0.12%', dosageForm: 'Solution' }
    ];

    const searchLower = searchTerm.toLowerCase();
    return dentalMeds
      .filter(med => 
        med.name.toLowerCase().includes(searchLower) ||
        med.genericName?.toLowerCase().includes(searchLower)
      )
      .slice(0, limit);
  }
}

// Export singleton instance
export const ePrescribingService = new EPrescribingService();
export default ePrescribingService;

