/**
 * Medication Safety Service
 * 
 * Provides comprehensive medication safety checks including:
 * - Drug-allergy interactions
 * - Drug-drug interactions
 * - Contraindications based on patient conditions
 * - Dosage validation
 * - Duplicate therapy detection
 */

import Patient from '../models/Patient';
import Prescription from '../models/Prescription';
import Medication from '../models/Medication';
import { ePrescribingService } from './ePrescribingService';
import mongoose from 'mongoose';

interface SafetyCheckResult {
  safe: boolean;
  warnings: SafetyWarning[];
  errors: SafetyError[];
  recommendations: string[];
}

interface SafetyWarning {
  type: 'allergy' | 'interaction' | 'contraindication' | 'duplicate' | 'dosage' | 'age' | 'pregnancy';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details: string;
  affectedDrugs?: string[];
  recommendation?: string;
}

interface SafetyError {
  type: 'allergy' | 'contraindication' | 'invalid-dosage';
  message: string;
  details: string;
}

interface MedicationToCheck {
  medicationId: string;
  name: string;
  genericName?: string;
  dosage: string;
  frequency: string;
  duration: string;
}

interface PatientMedicationHistory {
  allergies: string[];
  currentMedications: Array<{
    name: string;
    genericName?: string;
    dosage: string;
    status: string;
  }>;
  medicalConditions: string[];
  age: number;
  isPregnant?: boolean;
}

class MedicationSafetyService {
  /**
   * Perform comprehensive safety check before prescribing
   */
  async performSafetyCheck(
    patientId: string,
    newMedications: MedicationToCheck[]
  ): Promise<SafetyCheckResult> {
    const warnings: SafetyWarning[] = [];
    const errors: SafetyError[] = [];
    const recommendations: string[] = [];

    try {
      // Get patient medical history
      const patient: any = await Patient.findById(patientId)
        .select('medicalHistory dateOfBirth')
        .lean();

      if (!patient) {
        throw new Error('Patient not found');
      }

      const patientHistory: PatientMedicationHistory = {
        allergies: patient.medicalHistory?.allergies || [],
        currentMedications: [],
        medicalConditions: patient.medicalHistory?.conditions || [],
        age: this.calculateAge(patient.dateOfBirth)
      };

      // Get current active prescriptions
      const activePrescriptions = await Prescription.findActive(patientId);
      
      for (const prescription of activePrescriptions) {
        for (const med of prescription.medications) {
          if (med.medicationId) {
            const medication: any = med.medicationId;
            patientHistory.currentMedications.push({
              name: medication.name,
              genericName: medication.genericName,
              dosage: med.dosage,
              status: 'active'
            });
          }
        }
      }

      // 1. Check for allergies
      const allergyChecks = await this.checkAllergies(
        patientHistory.allergies,
        newMedications
      );
      warnings.push(...allergyChecks.warnings);
      errors.push(...allergyChecks.errors);

      // 2. Check for drug-drug interactions
      const interactionChecks = await this.checkDrugInteractions(
        patientHistory.currentMedications,
        newMedications
      );
      warnings.push(...interactionChecks.warnings);

      // 3. Check for contraindications based on conditions
      const contraindicationChecks = await this.checkContraindications(
        patientHistory.medicalConditions,
        newMedications
      );
      warnings.push(...contraindicationChecks.warnings);
      errors.push(...contraindicationChecks.errors);

      // 4. Check for duplicate therapy
      const duplicateChecks = this.checkDuplicateTherapy(
        patientHistory.currentMedications,
        newMedications
      );
      warnings.push(...duplicateChecks.warnings);

      // 5. Check dosage appropriateness
      const dosageChecks = this.checkDosage(
        newMedications,
        patientHistory.age
      );
      warnings.push(...dosageChecks.warnings);

      // 6. Age-specific warnings
      const ageWarnings = this.checkAgeAppropriate(
        newMedications,
        patientHistory.age
      );
      warnings.push(...ageWarnings);

      // Generate recommendations
      if (warnings.length > 0) {
        recommendations.push('Review all warnings before prescribing');
      }
      if (errors.length > 0) {
        recommendations.push('Resolve all critical errors before proceeding');
      }
      if (warnings.some(w => w.severity === 'high' || w.severity === 'critical')) {
        recommendations.push('Consider consulting with a pharmacist or specialist');
      }

      const safe = errors.length === 0 && 
                   !warnings.some(w => w.severity === 'critical');

      return {
        safe,
        warnings: warnings.sort((a, b) => this.severityScore(b.severity) - this.severityScore(a.severity)),
        errors,
        recommendations
      };
    } catch (error: any) {
      console.error('[MedicationSafety] Safety check error:', error);
      return {
        safe: false,
        warnings: [],
        errors: [{
          type: 'contraindication',
          message: 'Safety check failed',
          details: error.message
        }],
        recommendations: ['Unable to perform safety check. Please verify manually.']
      };
    }
  }

  /**
   * Check for drug allergies
   */
  private async checkAllergies(
    allergies: string[],
    newMedications: MedicationToCheck[]
  ): Promise<{ warnings: SafetyWarning[]; errors: SafetyError[] }> {
    const warnings: SafetyWarning[] = [];
    const errors: SafetyError[] = [];

    if (allergies.length === 0) {
      return { warnings, errors };
    }

    for (const medication of newMedications) {
      const medName = medication.name.toLowerCase();
      const genericName = medication.genericName?.toLowerCase() || '';

      for (const allergy of allergies) {
        const allergyLower = allergy.toLowerCase();

        // Direct match
        if (medName.includes(allergyLower) || genericName.includes(allergyLower)) {
          errors.push({
            type: 'allergy',
            message: `ALLERGY ALERT: ${medication.name}`,
            details: `Patient has documented allergy to ${allergy}. DO NOT PRESCRIBE.`
          });
          continue;
        }

        // Check for class allergies (e.g., "Penicillin" should flag "Amoxicillin")
        const classMatch = this.checkDrugClassAllergy(allergyLower, medName, genericName);
        if (classMatch) {
          errors.push({
            type: 'allergy',
            message: `CROSS-ALLERGY ALERT: ${medication.name}`,
            details: `Patient allergic to ${allergy}. ${medication.name} is in the same drug class and may cause allergic reaction.`
          });
        }
      }
    }

    return { warnings, errors };
  }

  /**
   * Check for drug-drug interactions
   */
  private async checkDrugInteractions(
    currentMedications: Array<{ name: string; genericName?: string }>,
    newMedications: MedicationToCheck[]
  ): Promise<{ warnings: SafetyWarning[] }> {
    const warnings: SafetyWarning[] = [];

    if (currentMedications.length === 0) {
      return { warnings };
    }

    // Build list of all medication names for interaction check
    const allMedNames = [
      ...currentMedications.map(m => m.genericName || m.name),
      ...newMedications.map(m => m.genericName || m.name)
    ];

    // Check interactions using ePrescribing service
    const interactions = await ePrescribingService.checkDrugInteractions(allMedNames);

    for (const interaction of interactions) {
      const severityMap: Record<string, 'low' | 'medium' | 'high' | 'critical'> = {
        'mild': 'low',
        'moderate': 'medium',
        'severe': 'high',
        'contraindicated': 'critical'
      };

      warnings.push({
        type: 'interaction',
        severity: severityMap[interaction.severity] || 'medium',
        message: `Drug Interaction: ${interaction.drug1} ↔ ${interaction.drug2}`,
        details: interaction.description,
        affectedDrugs: [interaction.drug1, interaction.drug2],
        recommendation: interaction.recommendations.join('. ')
      });
    }

    return { warnings };
  }

  /**
   * Check for contraindications based on medical conditions
   */
  private async checkContraindications(
    conditions: string[],
    newMedications: MedicationToCheck[]
  ): Promise<{ warnings: SafetyWarning[]; errors: SafetyError[] }> {
    const warnings: SafetyWarning[] = [];
    const errors: SafetyError[] = [];

    // Define contraindication rules for common dental medications
    const contraindicationRules: Record<string, string[]> = {
      'aspirin': ['bleeding disorder', 'hemophilia', 'active ulcer'],
      'ibuprofen': ['kidney disease', 'heart failure', 'active ulcer', 'asthma'],
      'naproxen': ['kidney disease', 'heart failure', 'active ulcer'],
      'codeine': ['respiratory depression', 'severe asthma', 'sleep apnea'],
      'tramadol': ['seizure disorder', 'epilepsy'],
      'amoxicillin': ['mononucleosis'],
      'erythromycin': ['long qt syndrome'],
      'metronidazole': ['liver disease'],
      'clindamycin': ['colitis', 'inflammatory bowel disease']
    };

    for (const medication of newMedications) {
      const medKey = (medication.genericName || medication.name).toLowerCase();
      
      // Check each condition against contraindications
      for (const [drug, contraindicatedConditions] of Object.entries(contraindicationRules)) {
        if (medKey.includes(drug)) {
          for (const condition of conditions) {
            const conditionLower = condition.toLowerCase();
            
            for (const contraindication of contraindicatedConditions) {
              if (conditionLower.includes(contraindication)) {
                const isCritical = ['bleeding disorder', 'hemophilia', 'severe asthma'].includes(contraindication);
                
                if (isCritical) {
                  errors.push({
                    type: 'contraindication',
                    message: `CONTRAINDICATION: ${medication.name}`,
                    details: `Patient has ${condition}. ${medication.name} is contraindicated.`
                  });
                } else {
                  warnings.push({
                    type: 'contraindication',
                    severity: 'high',
                    message: `Caution: ${medication.name} and ${condition}`,
                    details: `${medication.name} should be used with caution in patients with ${condition}.`,
                    recommendation: 'Consider alternative medication or adjust dosage'
                  });
                }
              }
            }
          }
        }
      }
    }

    return { warnings, errors };
  }

  /**
   * Check for duplicate therapy
   */
  private checkDuplicateTherapy(
    currentMedications: Array<{ name: string; genericName?: string }>,
    newMedications: MedicationToCheck[]
  ): { warnings: SafetyWarning[] } {
    const warnings: SafetyWarning[] = [];

    // Define drug classes for duplicate therapy detection
    const drugClasses: Record<string, string[]> = {
      'nsaid': ['ibuprofen', 'naproxen', 'aspirin', 'ketorolac', 'diclofenac'],
      'opioid': ['codeine', 'hydrocodone', 'oxycodone', 'tramadol', 'morphine'],
      'antibiotic-penicillin': ['amoxicillin', 'penicillin', 'ampicillin'],
      'antibiotic-macrolide': ['erythromycin', 'azithromycin', 'clarithromycin']
    };

    for (const newMed of newMedications) {
      const newMedName = (newMed.genericName || newMed.name).toLowerCase();

      for (const currentMed of currentMedications) {
        const currentMedName = (currentMed.genericName || currentMed.name).toLowerCase();

        // Check for exact duplicate
        if (newMedName === currentMedName) {
          warnings.push({
            type: 'duplicate',
            severity: 'high',
            message: `Duplicate Medication: ${newMed.name}`,
            details: `Patient is already taking ${currentMed.name}`,
            recommendation: 'Verify if this is an intentional dose increase or prescription error'
          });
          continue;
        }

        // Check for same drug class
        for (const [className, drugs] of Object.entries(drugClasses)) {
          const newInClass = drugs.some(d => newMedName.includes(d));
          const currentInClass = drugs.some(d => currentMedName.includes(d));

          if (newInClass && currentInClass) {
            warnings.push({
              type: 'duplicate',
              severity: 'medium',
              message: `Duplicate Therapy: ${className.toUpperCase()}`,
              details: `Patient already taking ${currentMed.name} (${className}). New prescription ${newMed.name} is in the same class.`,
              affectedDrugs: [currentMed.name, newMed.name],
              recommendation: 'Consider discontinuing current medication before starting new one'
            });
          }
        }
      }
    }

    return { warnings };
  }

  /**
   * Check dosage appropriateness
   */
  private checkDosage(
    medications: MedicationToCheck[],
    patientAge: number
  ): { warnings: SafetyWarning[] } {
    const warnings: SafetyWarning[] = [];

    // Define maximum recommended doses for common medications
    const maxDoses: Record<string, { max: number; unit: string; period: string }> = {
      'ibuprofen': { max: 3200, unit: 'mg', period: 'day' },
      'acetaminophen': { max: 4000, unit: 'mg', period: 'day' },
      'aspirin': { max: 4000, unit: 'mg', period: 'day' },
      'naproxen': { max: 1500, unit: 'mg', period: 'day' },
      'tramadol': { max: 400, unit: 'mg', period: 'day' }
    };

    for (const med of medications) {
      const medName = (med.genericName || med.name).toLowerCase();
      
      // Extract dosage amount from string (e.g., "400mg" -> 400)
      const dosageMatch = med.dosage.match(/(\d+)\s*mg/i);
      if (!dosageMatch) continue;
      
      const dosageAmount = parseInt(dosageMatch[1]);
      
      // Extract frequency (e.g., "3 times daily" -> 3)
      const frequencyMatch = med.frequency.match(/(\d+)/);
      const frequencyCount = frequencyMatch ? parseInt(frequencyMatch[1]) : 1;
      
      const dailyDose = dosageAmount * frequencyCount;

      // Check against max doses
      for (const [drug, limits] of Object.entries(maxDoses)) {
        if (medName.includes(drug)) {
          if (dailyDose > limits.max) {
            warnings.push({
              type: 'dosage',
              severity: 'high',
              message: `High Dosage Warning: ${med.name}`,
              details: `Prescribed daily dose (${dailyDose}${limits.unit}) exceeds maximum recommended dose (${limits.max}${limits.unit}/${limits.period})`,
              recommendation: 'Reduce dosage or frequency to stay within safe limits'
            });
          } else if (dailyDose > limits.max * 0.8) {
            warnings.push({
              type: 'dosage',
              severity: 'medium',
              message: `Dosage Near Maximum: ${med.name}`,
              details: `Prescribed daily dose (${dailyDose}${limits.unit}) is near maximum recommended dose (${limits.max}${limits.unit}/${limits.period})`,
              recommendation: 'Monitor patient closely for adverse effects'
            });
          }
        }
      }
    }

    return { warnings };
  }

  /**
   * Check age-appropriate prescribing
   */
  private checkAgeAppropriate(
    medications: MedicationToCheck[],
    patientAge: number
  ): SafetyWarning[] {
    const warnings: SafetyWarning[] = [];

    // Age-specific warnings
    for (const med of medications) {
      const medName = (med.genericName || med.name).toLowerCase();

      // Pediatric warnings (under 18)
      if (patientAge < 18) {
        if (medName.includes('aspirin') && patientAge < 16) {
          warnings.push({
            type: 'age',
            severity: 'critical',
            message: `Aspirin Not Recommended for Children`,
            details: `Patient is ${patientAge} years old. Aspirin in children under 16 is associated with Reye's syndrome risk.`,
            recommendation: 'Use acetaminophen or ibuprofen instead'
          });
        }

        if (medName.includes('codeine') && patientAge < 12) {
          warnings.push({
            type: 'age',
            severity: 'high',
            message: `Codeine Use in Children`,
            details: `Patient is ${patientAge} years old. Codeine not recommended in children under 12 due to serious breathing problems.`,
            recommendation: 'Consider alternative pain management'
          });
        }
      }

      // Geriatric warnings (over 65)
      if (patientAge > 65) {
        if (medName.includes('ibuprofen') || medName.includes('naproxen')) {
          warnings.push({
            type: 'age',
            severity: 'medium',
            message: `NSAID Use in Elderly`,
            details: `Patient is ${patientAge} years old. NSAIDs increase risk of GI bleeding and cardiovascular events in elderly.`,
            recommendation: 'Use lowest effective dose for shortest duration. Monitor closely.'
          });
        }

        if (medName.includes('tramadol') || medName.includes('codeine')) {
          warnings.push({
            type: 'age',
            severity: 'medium',
            message: `Opioid Use in Elderly`,
            details: `Patient is ${patientAge} years old. Increased risk of falls, confusion, and respiratory depression in elderly.`,
            recommendation: 'Start with reduced dose. Monitor closely for adverse effects.'
          });
        }
      }
    }

    return warnings;
  }

  /**
   * Check if medication is in same class as allergy
   */
  private checkDrugClassAllergy(allergy: string, medName: string, genericName: string): boolean {
    const drugClassMappings: Record<string, string[]> = {
      'penicillin': ['amoxicillin', 'ampicillin', 'penicillin'],
      'sulfa': ['sulfamethoxazole', 'sulfisoxazole'],
      'aspirin': ['aspirin', 'salicylate'],
      'nsaid': ['ibuprofen', 'naproxen', 'ketorolac', 'diclofenac']
    };

    for (const [allergyClass, drugs] of Object.entries(drugClassMappings)) {
      if (allergy.includes(allergyClass)) {
        return drugs.some(drug => medName.includes(drug) || genericName.includes(drug));
      }
    }

    return false;
  }

  /**
   * Calculate patient age from date of birth
   */
  private calculateAge(dateOfBirth: Date): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  /**
   * Get numeric severity score for sorting
   */
  private severityScore(severity: string): number {
    const scores: Record<string, number> = {
      'critical': 4,
      'high': 3,
      'medium': 2,
      'low': 1
    };
    return scores[severity] || 0;
  }

  /**
   * Get patient medication summary for display
   */
  async getPatientMedicationSummary(patientId: string): Promise<{
    allergies: string[];
    currentMedications: Array<{
      name: string;
      dosage: string;
      frequency: string;
      prescribedDate: Date;
    }>;
    medicalConditions: string[];
    age: number;
  }> {
    const patient: any = await Patient.findById(patientId)
      .select('medicalHistory dateOfBirth')
      .lean();

    if (!patient) {
      throw new Error('Patient not found');
    }

    const activePrescriptions = await Prescription.findActive(patientId);
    const currentMedications: Array<any> = [];

    for (const prescription of activePrescriptions) {
      for (const med of prescription.medications) {
        if (med.medicationId) {
          const medication: any = med.medicationId;
          currentMedications.push({
            name: medication.name,
            dosage: med.dosage,
            frequency: med.frequency,
            prescribedDate: prescription.issuedDate
          });
        }
      }
    }

    return {
      allergies: patient.medicalHistory?.allergies || [],
      currentMedications,
      medicalConditions: patient.medicalHistory?.conditions || [],
      age: this.calculateAge(patient.dateOfBirth)
    };
  }
}

// Export singleton instance
export const medicationSafetyService = new MedicationSafetyService();
export default medicationSafetyService;

