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
  }))
  .min(1, t('prescriptionForm.validation.atLeastOneMedication'))
  .refine(
     (medications) => {
       // Check for duplicate medications
       const medicationIds = medications.map((med) => med.duration);
       return new Set(medicationIds).size === medicationIds.length;
     },
     {
       message: t('prescriptionForm.validation.duplicateMedications'),
       path: ['medications'],
     }
   ),
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
  const [searchTermForAutoComplete, setSearchTermForAutoComplete] = useState<string>('');
  const [recentMedications, setRecentMedications] = useState<any[]>([]);

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
      // Show validation in progress indicator
      toast.loading(t('prescriptionForm.validation.validatingData'), {
        id: 'prescription-validation'
      });
      
      // Validate all fields before proceeding
      const isValid = await trigger();
      if (!isValid) {
        toast.error(t('prescriptionForm.validation.formHasErrors'), {
          id: 'prescription-validation'
        });
        return;
      }
      
      // Proceed with submission
      toast.loading(t('prescriptionForm.validation.processingSubmission'), {
        id: 'prescription-validation'
      });
      setLoading(true);
      
      // Get the clinic ID from the clinic context
      const clinicId = selectedClinic?.id;
      
      if (!clinicId) {
        toast.error(t('prescriptionForm.validation.clinicMissing'), {
          id: 'prescription-validation'
        });
        setLoading(false);
        return;
      }
      
      // Validate patient information (required field)
      if (!data.patient) {
        toast.error(t('prescriptionForm.validation.patientRequired'), {
          id: 'prescription-validation'
        });
        setLoading(false);
        return;
      }
      
      // Convert patient name to patient ID if needed
      let patientId = data.patient;
      if (typeof data.patient === 'string' && data.patient.includes('@')) {
        const patient = patients.find(p => 
          `${p.firstName} ${p.lastName} (${p.email})` === data.patient
        );
        if (patient) {
          patientId = (patient as any).id || (patient as any)._id;
        } else {
          toast.error(t('prescriptionForm.validation.patientNotFound'), {
            id: 'prescription-validation'
          });
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

      // Show confirmation dialog before submitting
      const confirmSubmit = window.confirm(
        prescription 
          ? t('prescriptionForm.validation.confirmUpdate') 
          : t('prescriptionForm.validation.confirmCreate')
      );
      
      if (!confirmSubmit) {
        toast.dismiss('prescription-validation');
        setLoading(false);
        return;
      }
      
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
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-gradient-to-b from-gray-50 to-white p-6 rounded-xl shadow-md border border-gray-100 transition-all duration-300 hover:shadow-lg">
        {/* Personal Information Section */}
        <div className="bg-blue-50 p-5 rounded-lg border-l-4 border-blue-500 mb-6 shadow-sm transition-all duration-300 hover:shadow-md">
          <h3 className="text-lg font-semibold text-blue-800 mb-3 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
            {t('prescriptionForm.sections.personalInformation')}
          </h3>
          
          {/* Patient Selection - Required */}
          {!patientId && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('prescriptionForm.fields.patient')} <span className="text-red-500">*</span>
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
                className="border-blue-300 focus:ring-blue-500 focus:border-blue-500"
                required
              />
              {!errors.patient?.message && (
                <p className="mt-1 text-xs text-blue-600">
                  {t('prescriptionForm.helpers.patientRequired')}
                </p>
              )}
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
                className="border-gray-300 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}
        </div>

        {/* Diagnosis - Required */}
        <div className="bg-gray-50 p-5 rounded-lg border-l-4 border-indigo-400 shadow-sm transition-all duration-300 hover:shadow-md">
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
            </svg>
            {t('prescriptionForm.fields.diagnosis')} <span className="text-red-500">*</span>
          </label>
          <Textarea
            {...register('diagnosis')}
            placeholder={t('prescriptionForm.placeholders.diagnosis')}
            rows={3}
            error={errors.diagnosis?.message}
            className="border-gray-300 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        {/* Medications - Required */}
        <div className="bg-green-50 p-5 rounded-lg border-l-4 border-green-500 shadow-sm transition-all duration-300 hover:shadow-md">
          <div className="flex justify-between items-center mb-3">
            <label className="block text-sm font-medium text-gray-700 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              {t('prescriptionForm.fields.medications')} <span className="text-red-500">*</span>
            </label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddMedication}
              className="flex items-center gap-1 bg-green-100 hover:bg-green-200 text-green-700 border-green-300 transition-all duration-200 transform hover:scale-105"
            >
              <Plus className="h-4 w-4" />
              {t('prescriptionForm.actions.addMedication')}
            </Button>
          </div>
          
          <div className="space-y-4">
            {medicationFields.map((field, index) => (
              <div key={field.id} className="border border-green-200 rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-sm font-medium text-green-700">
                    {t('prescriptionForm.medicationItem', { index: index + 1 })}
                  </h4>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleSelectMedicationFromList(index)}
                      className="flex items-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-300"
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
                        className="bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 border-red-300"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">{t('prescriptionForm.fields.medication')}</label>
                    <div className="relative">
                      <div className="flex items-center">
                        <Input
                          {...register(`medications.${index}.medicationName`, {
                            onChange: (e) => {
                              // Auto-complete functionality
                              if (e.target.value.length > 2) {
                                // This will trigger a search in the modal when opened
                                setSearchTermForAutoComplete(e.target.value);
                              }
                            }
                          })}
                          placeholder={t('prescriptionForm.placeholders.medicationName')}
                          className={`bg-white border-r-0 rounded-r-none flex-grow ${
                            errors.medications?.[index]?.medication ? 'border-red-300' : 'border-gray-300'
                          }`}
                          error={errors.medications?.[index]?.medication?.message}
                          autoComplete="off"
                        />
                        <Button
                          type="button"
                          onClick={() => handleSelectMedicationFromList(index)}
                          className="h-10 rounded-l-none border border-l-0 border-gray-300 bg-gray-50 hover:bg-gray-100 flex-shrink-0"
                        >
                          <Search className="h-4 w-4 text-gray-600" />
                        </Button>
                      </div>
                      
                      {watch(`medications.${index}.medicationName`) && (
                        <div className="absolute top-0 right-12 flex items-center h-full">
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
                    <Select
                      {...register(`medications.${index}.dosage`)}
                      options={[
                        { value: '', label: t('prescriptionForm.placeholders.dosage') },
                        { value: '5mg', label: '5mg' },
                        { value: '10mg', label: '10mg' },
                        { value: '20mg', label: '20mg' },
                        { value: '25mg', label: '25mg' },
                        { value: '50mg', label: '50mg' },
                        { value: '100mg', label: '100mg' },
                        { value: '250mg', label: '250mg' },
                        { value: '500mg', label: '500mg' },
                        { value: '1g', label: '1g' },
                        { value: '5ml', label: '5ml' },
                        { value: '10ml', label: '10ml' },
                        { value: '15ml', label: '15ml' },
                        { value: '20ml', label: '20ml' }
                      ]}
                      className="border-gray-300 w-full"
                      error={errors.medications?.[index]?.dosage?.message}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">{t('prescriptionForm.fields.frequency')}</label>
                    <Select
                      {...register(`medications.${index}.frequency`)}
                      options={[
                        { value: '', label: t('prescriptionForm.placeholders.frequency') },
                        { value: 'Once daily', label: t('prescriptionForm.frequency.onceDaily', 'Once daily') },
                        { value: 'Twice daily', label: t('prescriptionForm.frequency.twiceDaily', 'Twice daily') },
                        { value: '3 times daily', label: t('prescriptionForm.frequency.threeTimesDaily', '3 times daily') },
                        { value: '4 times daily', label: t('prescriptionForm.frequency.fourTimesDaily', '4 times daily') },
                        { value: 'Every 4 hours', label: t('prescriptionForm.frequency.every4Hours', 'Every 4 hours') },
                        { value: 'Every 6 hours', label: t('prescriptionForm.frequency.every6Hours', 'Every 6 hours') },
                        { value: 'Every 8 hours', label: t('prescriptionForm.frequency.every8Hours', 'Every 8 hours') },
                        { value: 'Every 12 hours', label: t('prescriptionForm.frequency.every12Hours', 'Every 12 hours') },
                        { value: 'As needed', label: t('prescriptionForm.frequency.asNeeded', 'As needed') }
                      ]}
                      error={errors.medications?.[index]?.frequency?.message}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">{t('prescriptionForm.fields.duration')}</label>
                    <Select
                      {...register(`medications.${index}.duration`)}
                      options={[
                        { value: '', label: t('prescriptionForm.placeholders.duration') },
                        { value: '3 days', label: '3 days' },
                        { value: '5 days', label: '5 days' },
                        { value: '7 days', label: '7 days' },
                        { value: '10 days', label: '10 days' },
                        { value: '14 days', label: '14 days' },
                        { value: '21 days', label: '21 days' },
                        { value: '28 days', label: '28 days' },
                        { value: '30 days', label: '30 days' },
                        { value: 'As directed', label: 'As directed' }
                      ]}
                      className="border-gray-300 w-full"
                      error={errors.medications?.[index]?.duration?.message}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">{t('prescriptionForm.fields.instructions')}</label>
                    <Input
                      {...register(`medications.${index}.instructions`)}
                      placeholder={t('prescriptionForm.placeholders.instructions')}
                      className="border-gray-300 w-full"
                      error={errors.medications?.[index]?.instructions?.message}
                    />
                  </div>
                  
                  {/* Drug Interaction Warning */}
                  {medicationFields.length > 1 && index > 0 && (
                    <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                      <div className="flex items-start">
                        <svg className="h-5 w-5 text-yellow-400 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <div>
                          <p className="text-xs text-yellow-700 font-medium">{t('prescriptionForm.drugInteractionWarning.title', 'Potential Drug Interaction')}</p>
                          <p className="text-xs text-yellow-600">{t('prescriptionForm.drugInteractionWarning.message', 'Check for interactions between multiple medications before prescribing.')}</p>
                        </div>
                      </div>
                    </div>
                  )}
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
            className="px-6 py-2 border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            aria-label={t('prescriptionForm.aria.cancelButton')}
            data-testid="prescription-cancel-button"
          >
            {t('prescriptionForm.actions.cancel')}
          </Button>
          <Button
            type="submit"
            isLoading={loading}
            disabled={loading}
            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium rounded-md shadow-sm hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transform hover:scale-105"
            aria-label={prescription ? t('prescriptionForm.aria.updateButton') : t('prescriptionForm.aria.createButton')}
            data-testid="prescription-submit-button"
            onClick={() => {
              // Additional validation before form submission
              if (!loading) {
                // Trigger validation for all fields
                trigger().then(isValid => {
                  if (!isValid) {
                    toast.error(t('prescriptionForm.validation.checkRequiredFields'));
                    // Focus on the first error field
                    const firstErrorField = document.querySelector('[aria-invalid="true"]');
                    if (firstErrorField) {
                      (firstErrorField as HTMLElement).focus();
                    }
                  }
                });
                
                // Show confirmation toast
                toast.success(t('prescriptionForm.validation.confirmingSubmission'), {
                  id: 'prescription-validation',
                  duration: 1000
                });
              }
            }}
          >
            {prescription ? (
              <span className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                {t('prescriptionForm.actions.update')}
              </span>
            ) : (
              <span className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                {t('prescriptionForm.actions.create')}
              </span>
            )}
          </Button>
        </div>
      </form>

      {/* Medication Selection Modal */}
      <Modal
        isOpen={isMedicationModalOpen}
        onClose={() => {
          setIsMedicationModalOpen(false);
          setSelectedMedicationIndex(null);
          setSearchTermForAutoComplete('');
        }}
        title={t('prescriptionForm.selectMedicationTitle')}
        size="lg"
      >
        <div className="p-1">
          <MedicationList
            onSelectMedication={handleSelectMedication}
            selectionMode={true}
            initialSearchTerm={searchTermForAutoComplete}
            recentMedications={recentMedications}
          />
        </div>
      </Modal>
    </>
  );
};