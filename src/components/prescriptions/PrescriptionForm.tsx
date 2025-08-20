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

const getPrescriptionSchema = (t: (key: string) => string) => z.object({
  patient: z.string().min(1, t('prescriptionForm.validation.patientRequired')),
  appointment: z.string().optional(),
  medications: z.array(z.object({
    medication: z.string().min(1, t('prescriptionForm.validation.medicationRequired')),
    dosage: z.string().min(1, t('prescriptionForm.validation.dosageRequired')),
    frequency: z.string().min(1, t('prescriptionForm.validation.frequencyRequired')),
    duration: z.string().min(1, t('prescriptionForm.validation.durationRequired')),
    instructions: z.string().optional()
  })).min(1, t('prescriptionForm.validation.atLeastOneMedication')),
  diagnosis: z.string().min(1, t('prescriptionForm.validation.diagnosisRequired')),
  notes: z.string().optional(),
  expiryDate: z.string().min(1, t('prescriptionForm.validation.expiryDateRequired')),
  maxRefills: z.number().min(0).max(10)
});

type PrescriptionFormData = z.infer<ReturnType<typeof getPrescriptionSchema>>;

interface Patient {
  _id: string;
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

interface Medication {
  _id: string;
  name: string;
  genericName?: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
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
  patientId?: string;
  onSave: () => void;
  onCancel: () => void;
}

export const PrescriptionForm: React.FC<PrescriptionFormProps> = ({
  prescription,
  patientId,
  onSave,
  onCancel
}) => {
  const { t } = useTranslation();
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
    formState: { errors },
    reset,
    watch,
    setValue
  } = useForm<PrescriptionFormData>({
    resolver: zodResolver(prescriptionSchema),
    defaultValues: {
      patient: patientId || '',
      appointment: '',
      medications: [{
        medication: '',
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
    remove: removeMedication,
    update: updateMedication
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

      try {
        const response = await appointmentService.getAppointments({
          patientId: selectedPatient,
          status: 'completed',
          limit: 50
        });
        setAppointments(response as unknown as Appointment[]);
      } catch (_error) {
        console.error('Error fetching appointments:', _error);
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

  // Load prescription data for editing
  useEffect(() => {
    if (prescription) {
      reset({
        patient: prescription.patient._id,
        appointment: prescription.appointment?._id || '',
        medications: prescription.medications.map(med => ({
          medication: med.medication._id,
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

  const handleSelectMedication = (medication: Medication) => {
    if (selectedMedicationIndex !== null) {
      updateMedication(selectedMedicationIndex, {
        medication: medication._id,
        dosage: medication.dosage,
        frequency: medication.frequency,
        duration: medication.duration,
        instructions: medication.instructions || ''
      });
    }
    setIsMedicationModalOpen(false);
    setSelectedMedicationIndex(null);
  };

  const handleAddMedication = () => {
    appendMedication({
      medication: '',
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
      
      const prescriptionData = {
        patient: data.patient,
        appointment: data.appointment || undefined,
        medications: data.medications,
        diagnosis: data.diagnosis,
        notes: data.notes || undefined,
        expiryDate: data.expiryDate,
        maxRefills: data.maxRefills
      };

      if (prescription) {
        await prescriptionService.updatePrescription(prescription._id, prescriptionData);
        toast.success(t('prescriptionForm.successUpdate'));
      } else {
        await prescriptionService.createPrescription(prescriptionData);
        toast.success(t('prescriptionForm.successCreate'));
      }
      
      onSave();
    } catch (_error: any) {
              toast.error(_error.response?.data?.message || t('prescriptionForm.errorSave'));
      console.error('Error saving prescription:', _error);
    } finally {
      setLoading(false);
    }
  };

  const patientOptions = patients.map(patient => ({
    value: patient._id,
    label: `${patient.firstName} ${patient.lastName} (${patient.email})`
  }));

  const appointmentOptions = [
    { value: '', label: t('prescriptionForm.noSpecificAppointment') },
    ...appointments.map(appointment => ({
      value: appointment._id,
      label: `${format(new Date(appointment.date), 'MMM dd, yyyy')} - ${appointment.type}`
    }))
  ];

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Patient Selection */}
        {!patientId && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('prescriptionForm.patientLabel')}
            </label>
            <Select
              {...register('patient')}
              options={patientOptions}
              error={errors.patient?.message}
            />
          </div>
        )}

        {/* Appointment Selection */}
        {selectedPatient && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('prescriptionForm.relatedAppointmentLabel')}
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
            {t('prescriptionForm.diagnosisLabel')}
          </label>
          <Textarea
            {...register('diagnosis')}
            placeholder={t('prescriptionForm.diagnosisPlaceholder')}
            rows={3}
            error={errors.diagnosis?.message}
          />
        </div>

        {/* Medications */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <label className="block text-sm font-medium text-gray-700">
              {t('prescriptionForm.medicationsLabel')}
            </label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddMedication}
              className="flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              {t('prescriptionForm.addMedication')}
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
                      {t('prescriptionForm.selectMedicationButton')}
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
                    <Input
                      {...register(`medications.${index}.medication`)}
                      placeholder={t('prescriptionForm.medicationIdPlaceholder')}
                      readOnly
                      error={errors.medications?.[index]?.medication?.message}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">{t('prescriptionForm.dosageLabel')}</label>
                    <Input
                      {...register(`medications.${index}.dosage`)}
                      placeholder={t('prescriptionForm.dosagePlaceholder')}
                      error={errors.medications?.[index]?.dosage?.message}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">{t('prescriptionForm.frequencyLabel')}</label>
                    <Input
                      {...register(`medications.${index}.frequency`)}
                      placeholder={t('prescriptionForm.frequencyPlaceholder')}
                      error={errors.medications?.[index]?.frequency?.message}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">{t('prescriptionForm.durationLabel')}</label>
                    <Input
                      {...register(`medications.${index}.duration`)}
                      placeholder={t('prescriptionForm.durationPlaceholder')}
                      error={errors.medications?.[index]?.duration?.message}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">{t('prescriptionForm.instructionsLabel')}</label>
                    <Input
                      {...register(`medications.${index}.instructions`)}
                      placeholder={t('prescriptionForm.instructionsPlaceholder')}
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
              {t('prescriptionForm.expiryDateLabel')}
            </label>
            <Input
              type="date"
              {...register('expiryDate')}
              error={errors.expiryDate?.message}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('prescriptionForm.maxRefillsLabel')}
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
            {t('prescriptionForm.additionalNotesLabel')}
          </label>
          <Textarea
            {...register('notes')}
            placeholder={t('prescriptionForm.notesPlaceholder')}
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
            {t('prescriptionForm.cancelButton')}
          </Button>
          <Button
            type="submit"
            isLoading={loading}
            disabled={loading}
          >
            {prescription ? t('prescriptionForm.updateButton') : t('prescriptionForm.createButton')}
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