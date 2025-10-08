import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, X, Search } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Textarea from '../ui/Textarea';
import Modal from '../ui/Modal';
import { MedicationList } from '../medications/MedicationList';
import { prescriptionService } from '../../services/prescriptionService';
import { patientService } from '../../services/patientService';
import { appointmentService } from '../../services/appointmentService';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { useClinic } from '../../context/ClinicContext';

const getPrescriptionSchema = (t: (key: string) => string) => z.object({
  patient: z.string().min(1, t('prescriptionForm.validation.patientRequired')),
  appointment: z.string().optional(),
  medications: z.array(z.object({
    medication: z.string().min(1, t('prescriptionForm.validation.medicationRequired')),
    medicationName: z.string().optional(),
    dosage: z.string().min(1, t('prescriptionForm.validation.dosageRequired')),
    frequency: z.string().min(1, t('prescriptionForm.validation.frequencyRequired')),
    duration: z.string().min(1, t('prescriptionForm.validation.durationRequired')),
    instructions: z.string().optional()
  })).min(1, t('prescriptionForm.validation.atLeastOneMedication')),
  diagnosis: z.string().min(1, t('prescriptionForm.validation.diagnosisRequired')),
  notes: z.string().optional(),
  expiryDate: z.string().min(1, t('prescriptionForm.validation.expiryDateRequired')),
  maxRefills: z.number().min(0).max(10, t('prescriptionForm.validation.maxRefillsExceeded'))
});

type PrescriptionFormData = z.infer<ReturnType<typeof getPrescriptionSchema>>;

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Appointment {
  _id: string;
  date: string;
  time: string;
  type: string;
}


interface Prescription {
  _id: string;
  patient: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  appointment?: {
    _id: string;
    date: string;
  };
  medications: Array<{
    medication: {
      _id: string;
      name: string;
    };
    dosage: string;
    frequency: string;
    duration: string;
    instructions?: string;
  }>;
  diagnosis: string;
  notes?: string;
  expiryDate: string;
  maxRefills: number;
}

interface PrescriptionFormProps {
  prescription?: Prescription | null;
  patientId: string;
  appointmentId?: string;
  onSave: () => void;
  onCancel: () => void;
}

export const PrescriptionForm: React.FC<PrescriptionFormProps> = ({
  prescription,
  patientId,
  appointmentId,
  onSave,
  onCancel
}) => {
  const { t } = useTranslation();
  const { selectedClinic } = useClinic();
  const prescriptionSchema = getPrescriptionSchema(t);
  // const { user } = useAuth(); // Commented out as not currently used
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isMedicationModalOpen, setIsMedicationModalOpen] = useState(false);
  const [selectedMedicationIndex, setSelectedMedicationIndex] = useState<number | null>(null);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitted },
    reset,
    watch,
    setValue,
    clearErrors,
    trigger
  } = useForm<PrescriptionFormData>({
    resolver: zodResolver(prescriptionSchema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      patient: patientId || '',
      appointment: '',
      medications: [{
        medication: '',
        medicationName: '',
        dosage: '',
        frequency: '',
        duration: '',
        instructions: ''
      }],
      diagnosis: '',
      notes: '',
      expiryDate: '',
      maxRefills: 3
    }
  });

  const {
    fields: medicationFields,
    append: appendMedication,
    remove: removeMedication
  } = useFieldArray({
    control,
    name: 'medications'
  });

  const selectedPatient = watch('patient');


  // Fetch patients
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const response = await patientService.getPatients({ limit: 100 });
        setPatients((response.data as unknown) as Patient[]);
      } catch (_error) {
        console.error('Error fetching patients:', _error);
      }
    };

    if (!patientId) {
      fetchPatients();
    }
  }, [patientId]);

  // Fetch appointments for selected patient
  useEffect(() => {
    const fetchAppointments = async () => {
      if (!selectedPatient) {
        setAppointments([]);
        return;
      }

      console.log('Fetching appointments for patient:', selectedPatient);
      console.log('Patient type:', typeof selectedPatient);

      // Check if selectedPatient is a patient ID or patient name
      let patientId = selectedPatient;
      
      // If it's a patient name (contains @), try to find the patient ID
      if (typeof selectedPatient === 'string' && selectedPatient.includes('@')) {
        console.log('Looking for patient:', selectedPatient);
        console.log('Available patients:', patients.length);
        console.log('Patients list:', patients.map(p => `${p.firstName} ${p.lastName} (${p.email})`));
        
        const patient = patients.find(p => 
          `${p.firstName} ${p.lastName} (${p.email})` === selectedPatient
        );
        if (patient) {
          patientId = (patient as any).id || (patient as any)._id;
          console.log('Found patient:', patient);
          console.log('Patient ID:', patientId);
          console.log('Patient _id:', (patient as any)._id);
          console.log('Patient id:', (patient as any).id);
        } else {
          console.log('Patient not found in patients list, skipping appointment fetch');
          console.log('Expected format:', selectedPatient);
          setAppointments([]);
          return;
        }
      }

      try {
        const response = await appointmentService.getAppointments({
          patientId: patientId,
          status: 'completed',
          limit: 50
        });
        
        // Ensure response is an array before setting
        const appointmentData = Array.isArray(response) ? response : [];
        setAppointments(appointmentData as unknown as Appointment[]);
      } catch (_error) {
        console.error('Error fetching appointments:', _error);
        setAppointments([]); // Ensure appointments is always an array
      }
    };

    fetchAppointments();
  }, [selectedPatient]);

  // Set default expiry date (30 days from now)
  useEffect(() => {
    if (!prescription) {
      const defaultExpiryDate = new Date();
      defaultExpiryDate.setDate(defaultExpiryDate.getDate() + 30);
      setValue('expiryDate', defaultExpiryDate.toISOString().split('T')[0]);
    }
  }, [prescription, setValue]);

  // Pre-fill patient when patientId is provided
  useEffect(() => {
    if (patientId && !prescription) {
      setValue('patient', patientId, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true
      });
      clearErrors('patient');
    }
  }, [patientId, prescription, setValue, clearErrors]);

  // Pre-fill appointment when appointmentId is provided
  useEffect(() => {
    if (appointmentId && !prescription) {
      setValue('appointment', appointmentId);
    }
  }, [appointmentId, prescription, setValue]);

  // Load prescription data for editing
  useEffect(() => {
    if (prescription) {
      reset({
        patient: prescription.patient._id,
        appointment: prescription.appointment?._id || '',
        medications: prescription.medications.map(med => ({
          medication: med.medication._id,
          medicationName: med.medication.name,
          dosage: med.dosage,
          frequency: med.frequency,
          duration: med.duration,
          instructions: med.instructions || ''
        })),
        diagnosis: prescription.diagnosis,
        notes: prescription.notes || '',
        expiryDate: prescription.expiryDate.split('T')[0],
        maxRefills: prescription.maxRefills
      });
    }
  }, [prescription, reset]);

  const handleSelectMedication = (medication: any) => {
    if (selectedMedicationIndex !== null) {
      console.log('Selected medication:', medication);
      console.log('Setting medication ID for index:', selectedMedicationIndex);
      
      // Set medication ID first and foremost (use id or _id)
      const medicationId = medication._id || medication.id;
      setValue(`medications.${selectedMedicationIndex}.medication`, medicationId, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true
      });
      
      // Set other fields
      setValue(`medications.${selectedMedicationIndex}.medicationName`, medication.name, {
        shouldValidate: true,
        shouldDirty: true
      });
      setValue(`medications.${selectedMedicationIndex}.dosage`, medication.dosage || '', {
        shouldValidate: true
      });
      setValue(`medications.${selectedMedicationIndex}.frequency`, medication.frequency || '', {
        shouldValidate: true
      });
      setValue(`medications.${selectedMedicationIndex}.duration`, medication.duration || '', {
        shouldValidate: true
      });
      setValue(`medications.${selectedMedicationIndex}.instructions`, medication.instructions || '', {
        shouldValidate: true
      });
      
      // Clear validation errors for this medication
      clearErrors(`medications.${selectedMedicationIndex}.medication`);
      clearErrors(`medications.${selectedMedicationIndex}.dosage`);
      clearErrors(`medications.${selectedMedicationIndex}.frequency`);
      clearErrors(`medications.${selectedMedicationIndex}.duration`);
      
      // Force validation trigger with multiple attempts
      setTimeout(() => {
        console.log('Triggering validation for medication ID:', medicationId);
        setValue(`medications.${selectedMedicationIndex}.medication`, medicationId, {
          shouldValidate: true,
          shouldDirty: true,
          shouldTouch: true
        });
        trigger(`medications.${selectedMedicationIndex}.medication`);
      }, 100);
      
      setTimeout(() => {
        console.log('Second validation trigger');
        setValue(`medications.${selectedMedicationIndex}.medication`, medicationId, {
          shouldValidate: true,
          shouldDirty: true,
          shouldTouch: true
        });
        trigger(`medications.${selectedMedicationIndex}.medication`);
      }, 200);
      
      console.log('Medication field updated with ID:', medicationId);
    }
    setIsMedicationModalOpen(false);
    setSelectedMedicationIndex(null);
  };

  const handleAddMedication = () => {
    appendMedication({
      medication: '',
      medicationName: '',
      dosage: '',
      frequency: '',
      duration: '',
      instructions: ''
    });
  };

  const handleSelectMedicationFromList = (index: number) => {
    setSelectedMedicationIndex(index);
    setIsMedicationModalOpen(true);
  };

  const onSubmit = async (data: PrescriptionFormData) => {
    try {
      setLoading(true);
      
      // Get the clinic ID from the clinic context
      const clinicId = selectedClinic?.id;
      console.log('Clinic from context:', selectedClinic);
      console.log('Clinic ID found:', clinicId);

      if (!clinicId) {
        console.log('Clinic not available in context');
        toast.error('Clinic information is missing. Please contact support.');
        setLoading(false);
        return;
      }
      
      // Log form data for debugging
      console.log('Form data before processing:', data);
      
      // Convert patient name to patient ID if needed
      let patientId = data.patient;
      if (typeof data.patient === 'string' && data.patient.includes('@')) {
        const patient = patients.find(p => 
          `${p.firstName} ${p.lastName} (${p.email})` === data.patient
        );
        if (patient) {
          patientId = (patient as any).id || (patient as any)._id;
          console.log('Converted patient name to ID:', patientId);
        } else {
          console.error('Patient not found for prescription creation');
          toast.error('Patient not found. Please try again.');
          setLoading(false);
          return;
        }
      }
      
      const prescriptionData = {
        patientId: patientId,
        clinicId: clinicId,
        appointmentId: data.appointment || undefined,
        medications: data.medications.map(med => ({
          medicationId: med.medication,
          dosage: med.dosage,
          frequency: med.frequency,
          duration: med.duration,
          instructions: med.instructions || undefined,
          startDate: new Date().toISOString(),
          endDate: undefined
        })),
        diagnosis: data.diagnosis,
        notes: data.notes || undefined,
        expiryDate: data.expiryDate,
        refillsAllowed: data.maxRefills
      };

      console.log('Prescription data to send:', prescriptionData);

      if (prescription) {
        console.log('Updating prescription:', prescription._id);
        await prescriptionService.updatePrescription(prescription._id, prescriptionData);
        toast.success(t('prescriptionForm.messages.successUpdate'));
      } else {
        console.log('Creating new prescription');
        await prescriptionService.createPrescription(prescriptionData);
        toast.success(t('prescriptionForm.messages.successCreate'));
      }
      
      onSave();
    } catch (_error: any) {
      const errorMessage = _error.response?.data?.message || _error.response?.data?.error || t('prescriptionForm.messages.errorSave');
      toast.error(errorMessage);
      console.error('Error saving prescription:', _error);
    } finally {
      setLoading(false);
    }
  };

  const patientOptions = (Array.isArray(patients) ? patients : []).map(patient => ({
    value: (patient as any).id || (patient as any)._id,
    label: `${patient.firstName} ${patient.lastName} (${patient.email})`
  }));

  const appointmentOptions = [
    { value: '', label: t('prescriptionForm.appointment.noSpecificAppointment') },
    ...(Array.isArray(appointments) ? appointments.map(appointment => ({
      value: appointment._id,
      label: `${format(new Date(appointment.date), 'MMM dd, yyyy')} - ${appointment.type}`
    })) : [])
  ];

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Patient Selection */}
        {!patientId && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('prescriptionForm.fields.patient')}
            </label>
            <Select
              {...register('patient', {
                onChange: () => {
                  // Clear patient error when a selection is made
                  if (isSubmitted) {
                    clearErrors('patient');
                  }
                }
              })}
              options={patientOptions}
              error={errors.patient?.message}
            />
          </div>
        )}

        {/* Appointment Selection */}
        {selectedPatient && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('prescriptionForm.fields.relatedAppointment')}
            </label>
            <Select
              {...register('appointment')}
              options={appointmentOptions}
              error={errors.appointment?.message}
            />
          </div>
        )}

        {/* Diagnosis */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('prescriptionForm.fields.diagnosis')}
          </label>
          <Textarea
            {...register('diagnosis')}
            placeholder={t('prescriptionForm.placeholders.diagnosis')}
            rows={3}
            error={errors.diagnosis?.message}
          />
        </div>

        {/* Medications */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <label className="block text-sm font-medium text-gray-700">
              {t('prescriptionForm.fields.medications')}
            </label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddMedication}
              className="flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              {t('prescriptionForm.actions.addMedication')}
            </Button>
          </div>
          
          <div className="space-y-4">
            {medicationFields.map((field, index) => (
              <div key={field.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-sm font-medium text-gray-700">
                    {t('prescriptionForm.medicationItem', { index: index + 1 })}
                  </h4>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleSelectMedicationFromList(index)}
                      className="flex items-center gap-1"
                    >
                      <Search className="h-4 w-4" />
                      {t('prescriptionForm.actions.selectMedication')}
                    </Button>
                    {medicationFields.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeMedication(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs text-gray-600 mb-1">{t('prescriptionForm.fields.medication')}</label>
                    <div className="relative">
                      <Input
                        {...register(`medications.${index}.medicationName`)}
                        placeholder={t('prescriptionForm.placeholders.medicationName')}
                        
                        className={`bg-gray-50 cursor-pointer ${
                          errors.medications?.[index]?.medication ? 'border-red-300' : ''
                        }`}
                        error={errors.medications?.[index]?.medication?.message}
                        onClick={() => handleSelectMedicationFromList(index)}
                      />
                      {!watch(`medications.${index}.medicationName`) ? (
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <Search className="h-4 w-4 text-gray-400" />
                        </div>
                      ) : (
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <div className="h-4 w-4 bg-green-500 rounded-full flex items-center justify-center">
                            <svg className="h-2 w-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>
                    {/* Hidden field for medication ID */}
                    <input
                      type="hidden"
                      {...register(`medications.${index}.medication`)}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">{t('prescriptionForm.fields.dosage')}</label>
                    <Input
                      {...register(`medications.${index}.dosage`)}
                      placeholder={t('prescriptionForm.placeholders.dosage')}
                      error={errors.medications?.[index]?.dosage?.message}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">{t('prescriptionForm.fields.frequency')}</label>
                    <Input
                      {...register(`medications.${index}.frequency`)}
                      placeholder={t('prescriptionForm.placeholders.frequency')}
                      error={errors.medications?.[index]?.frequency?.message}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">{t('prescriptionForm.fields.duration')}</label>
                    <Input
                      {...register(`medications.${index}.duration`)}
                      placeholder={t('prescriptionForm.placeholders.duration')}
                      error={errors.medications?.[index]?.duration?.message}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">{t('prescriptionForm.fields.instructions')}</label>
                    <Input
                      {...register(`medications.${index}.instructions`)}
                      placeholder={t('prescriptionForm.placeholders.instructions')}
                      error={errors.medications?.[index]?.instructions?.message}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {errors.medications && (
            <p className="text-sm text-red-600 mt-1">{errors.medications.message}</p>
          )}
        </div>

        {/* Prescription Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('prescriptionForm.fields.expiryDate')}
            </label>
            <Input
              type="date"
              {...register('expiryDate')}
              error={errors.expiryDate?.message}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('prescriptionForm.fields.maxRefills')}
            </label>
            <Input
              type="number"
              min="0"
              max="10"
              {...register('maxRefills', { valueAsNumber: true })}
              error={errors.maxRefills?.message}
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('prescriptionForm.fields.additionalNotes')}
          </label>
          <Textarea
            {...register('notes')}
            placeholder={t('prescriptionForm.placeholders.notes')}
            rows={3}
            error={errors.notes?.message}
          />
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            {t('prescriptionForm.actions.cancel')}
          </Button>
          <Button
            type="submit"
            isLoading={loading}
            disabled={loading}
          >
            {prescription ? t('prescriptionForm.actions.update') : t('prescriptionForm.actions.create')}
          </Button>
        </div>
      </form>

      {/* Medication Selection Modal */}
      <Modal
        isOpen={isMedicationModalOpen}
        onClose={() => {
          setIsMedicationModalOpen(false);
          setSelectedMedicationIndex(null);
        }}
        title={t('prescriptionForm.selectMedicationTitle')}
        size="lg"
      >
        <MedicationList
          onSelectMedication={handleSelectMedication}
          selectionMode={true}
        />
      </Modal>
    </>
  );
};