import { Request, Response } from 'express';
import { Patient, Prescription, Medication } from '../models';
import { AuthenticatedRequest } from '../types';
import {
  catchAsync,
  createNotFoundError,
  createValidationError
} from '../middleware/errorHandler';

// Get patient's medical record
export const getPatientMedicalRecord = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { patientId } = req.params;

  const patient = await (Patient as any).findById(patientId)
    .populate('medicationHistory.prescribedBy', 'firstName lastName specialization')
    .populate('medicalHistory.updatedBy', 'firstName lastName');

  if (!patient) {
    throw createNotFoundError('Patient');
  }

  // Check if user has access to this patient's records
  if (req.user.role === 'patient' && req.user._id.toString() !== patient.userId?.toString()) {
    throw createValidationError('authorization', 'Access denied to medical records');
  }

  res.json({
    success: true,
    data: {
      medicalHistory: patient.medicalHistory,
      medicationHistory: patient.medicationHistory
    }
  });
});

// Update patient's medical record
export const updatePatientMedicalRecord = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { patientId } = req.params;
  const updateData = req.body;

  const patient = await (Patient as any).findById(patientId);
  if (!patient) {
    throw createNotFoundError('Patient');
  }

  // Only healthcare providers can update medical records
  if (!['admin', 'dentist', 'staff'].includes(req.user.role)) {
    throw createValidationError('authorization', 'Only healthcare providers can update medical records');
  }

  await (patient as any).updateMedicalRecord(updateData, req.user._id);

  res.json({
    success: true,
    message: 'Medical record updated successfully',
    data: {
      medicalHistory: patient.medicalHistory
    }
  });
});

// Add medication to patient's history
export const addMedicationToHistory = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { patientId } = req.params;
  const medicationData = {
    ...req.body,
    prescribedBy: req.user._id
  };

  const patient = await (Patient as any).findById(patientId);
  if (!patient) {
    throw createNotFoundError('Patient');
  }

  // Only healthcare providers can add medications
  if (!['admin', 'dentist', 'staff'].includes(req.user.role)) {
    throw createValidationError('authorization', 'Only healthcare providers can add medications');
  }

  await (patient as any).addMedicationToHistory(medicationData);

  res.json({
    success: true,
    message: 'Medication added to history successfully',
    data: {
      medicationHistory: patient.medicationHistory
    }
  });
});

// Get patient's active medications
export const getActiveMedications = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { patientId } = req.params;

  const patient = await (Patient as any).findById(patientId)
    .populate('medicationHistory.prescribedBy', 'firstName lastName specialization');

  if (!patient) {
    throw createNotFoundError('Patient');
  }

  // Check access
  if (req.user.role === 'patient' && req.user._id.toString() !== patient.userId?.toString()) {
    throw createValidationError('authorization', 'Access denied');
  }

  const activeMedications = (patient as any).getActiveMedications();

  res.json({
    success: true,
    data: { activeMedications }
  });
});

// Get patient's prescriptions
export const getPatientPrescriptions = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { patientId } = req.params;
  const { status, limit = 10, skip = 0 } = req.query;

  // Verify patient exists and user has access
  const patient = await (Patient as any).findById(patientId);
  if (!patient) {
    throw createNotFoundError('Patient');
  }

  if (req.user.role === 'patient' && req.user._id.toString() !== patient.userId?.toString()) {
    throw createValidationError('authorization', 'Access denied');
  }

  const prescriptions = await (Prescription as any).findByPatient(patientId, {
    status,
    limit: Number(limit),
    skip: Number(skip)
  });

  res.json({
    success: true,
    data: { prescriptions }
  });
});

// Get specific prescription details
export const getPrescriptionDetails = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { prescriptionId } = req.params;

  const prescription = await (Prescription as any).findById(prescriptionId)
    .populate('patientId', 'firstName lastName userId')
    .populate('dentistId', 'firstName lastName specialization')
    .populate('clinicId', 'name address phone')
    .populate('medications.medicationId', 'name genericName category instructions warnings');

  if (!prescription) {
    throw createNotFoundError('Prescription');
  }

  // Check access
  if (req.user.role === 'patient' && req.user._id.toString() !== prescription.patientId.userId?.toString()) {
    throw createValidationError('authorization', 'Access denied to prescription details');
  }

  res.json({
    success: true,
    data: { prescription }
  });
});

// Update medication status in patient's history
export const updateMedicationStatus = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { patientId, medicationHistoryId } = req.params;
  const { status, reason, notes } = req.body;

  const patient = await (Patient as any).findById(patientId);
  if (!patient) {
    throw createNotFoundError('Patient');
  }

  // Only healthcare providers can update medication status
  if (!['admin', 'dentist', 'staff'].includes(req.user.role)) {
    throw createValidationError('authorization', 'Only healthcare providers can update medication status');
  }

  const medication = patient.medicationHistory.id(medicationHistoryId);
  if (!medication) {
    throw createNotFoundError('Medication record');
  }

  medication.status = status;
  if (reason) medication.reason = reason;
  if (notes) medication.notes = notes;
  if (status === 'completed' || status === 'discontinued') {
    medication.endDate = new Date();
  }

  await patient.save();

  res.json({
    success: true,
    message: 'Medication status updated successfully',
    data: { medication }
  });
});

// Add allergy to patient's record
export const addAllergy = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { patientId } = req.params;
  const { allergen, severity, reaction } = req.body;

  const patient = await (Patient as any).findById(patientId);
  if (!patient) {
    throw createNotFoundError('Patient');
  }

  // Only healthcare providers can add allergies
  if (!['admin', 'dentist', 'staff'].includes(req.user.role)) {
    throw createValidationError('authorization', 'Only healthcare providers can add allergies');
  }

  // Check if allergy already exists
  const existingAllergy = patient.medicalHistory.allergies.find(
    (allergy: any) => allergy.allergen.toLowerCase() === allergen.toLowerCase()
  );

  if (existingAllergy) {
    throw createValidationError('allergy', 'This allergy is already recorded');
  }

  patient.medicalHistory.allergies.push({
    allergen,
    severity: severity || 'moderate',
    reaction,
    dateIdentified: new Date()
  });

  patient.medicalHistory.lastUpdated = new Date();
  patient.medicalHistory.updatedBy = req.user._id;

  await patient.save();

  res.json({
    success: true,
    message: 'Allergy added successfully',
    data: {
      allergies: patient.medicalHistory.allergies
    }
  });
});

// Remove allergy from patient's record
export const removeAllergy = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { patientId, allergyId } = req.params;

  const patient = await (Patient as any).findById(patientId);
  if (!patient) {
    throw createNotFoundError('Patient');
  }

  // Only healthcare providers can remove allergies
  if (!['admin', 'dentist', 'staff'].includes(req.user.role)) {
    throw createValidationError('authorization', 'Only healthcare providers can remove allergies');
  }

  patient.medicalHistory.allergies.pull(allergyId);
  patient.medicalHistory.lastUpdated = new Date();
  patient.medicalHistory.updatedBy = req.user._id;

  await patient.save();

  res.json({
    success: true,
    message: 'Allergy removed successfully',
    data: {
      allergies: patient.medicalHistory.allergies
    }
  });
});

// Get medication reminders for patient
export const getMedicationReminders = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { patientId } = req.params;

  const patient = await (Patient as any).findById(patientId)
    .populate('medicationHistory.prescribedBy', 'firstName lastName');

  if (!patient) {
    throw createNotFoundError('Patient');
  }

  // Check access
  if (req.user.role === 'patient' && req.user._id.toString() !== patient.userId?.toString()) {
    throw createValidationError('authorization', 'Access denied');
  }

  // Get active prescriptions for detailed medication schedule
  const activePrescriptions = await (Prescription as any).findActive(patientId);
  
  const reminders: any[] = [];
  
  // Process current medications from medical history
  const activeMedications = (patient as any).getActiveMedications();
  activeMedications.forEach((med: any) => {
    if (med.frequency) {
      // Parse frequency to create reminders (simple implementation)
      const times = parseFrequencyToTimes(med.frequency);
      times.forEach((time: string) => {
        reminders.push({
          medicationName: med.medicationName,
          dosage: med.dosage,
          time: time,
          frequency: med.frequency,
          notes: med.notes,
          prescribedBy: med.prescribedBy
        });
      });
    }
  });

  // Process active prescriptions
  activePrescriptions.forEach((prescription: any) => {
    prescription.medications.forEach((med: any) => {
      if (med.frequency) {
        const times = parseFrequencyToTimes(med.frequency);
        times.forEach((time: string) => {
          reminders.push({
            prescriptionId: prescription._id,
            medicationName: med.medicationId.name,
            dosage: med.dosage,
            time: time,
            frequency: med.frequency,
            instructions: med.instructions,
            startDate: med.startDate,
            endDate: med.endDate
          });
        });
      }
    });
  });

  res.json({
    success: true,
    data: { reminders: reminders.sort((a, b) => a.time.localeCompare(b.time)) }
  });
});

// Helper function to parse medication frequency to reminder times
function parseFrequencyToTimes(frequency: string): string[] {
  const times: string[] = [];
  
  // Simple frequency parsing - can be enhanced
  const freq = frequency.toLowerCase();
  
  if (freq.includes('once') || freq.includes('1 time') || freq.includes('daily')) {
    times.push('08:00'); // Morning
  } else if (freq.includes('twice') || freq.includes('2 times') || freq.includes('bid')) {
    times.push('08:00', '20:00'); // Morning and evening
  } else if (freq.includes('three times') || freq.includes('3 times') || freq.includes('tid')) {
    times.push('08:00', '14:00', '20:00'); // Morning, afternoon, evening
  } else if (freq.includes('four times') || freq.includes('4 times') || freq.includes('qid')) {
    times.push('08:00', '12:00', '16:00', '20:00'); // Every 6 hours
  } else if (freq.includes('every 8 hours')) {
    times.push('08:00', '16:00', '00:00');
  } else if (freq.includes('every 6 hours')) {
    times.push('06:00', '12:00', '18:00', '00:00');
  } else if (freq.includes('every 4 hours')) {
    times.push('08:00', '12:00', '16:00', '20:00', '00:00', '04:00');
  } else {
    // Default to morning if frequency not recognized
    times.push('08:00');
  }
  
  return times;
}