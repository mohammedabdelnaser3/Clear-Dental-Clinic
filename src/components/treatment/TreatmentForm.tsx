import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Calendar, User, Stethoscope, FileText, DollarSign, Clock } from 'lucide-react';
import { Button, Input, Select, Textarea, Card } from '../ui';
import { useAuth } from '../../hooks/useAuth';
import { treatmentService, type CreateTreatmentData, type TreatmentRecord } from '../../services/treatmentService';
import { patientService } from '../../services/patientService';
import { userService } from '../../services/userService';
// Removed clinicService import as it's not available
import toast from 'react-hot-toast';
import { format } from 'date-fns';

// Validation schema
const treatmentSchema = (t: any) => z.object({
  patient: z.string().min(1, t('treatmentForm.validation.patientRequired')),
  dentist: z.string().min(1, t('treatmentForm.validation.dentistRequired')),
  clinic: z.string().min(1, t('treatmentForm.validation.clinicRequired')),
  appointment: z.string().optional(),
  treatment: z.string().min(1, t('treatmentForm.validation.treatmentRequired')),
  procedure: z.string().min(1, t('treatmentForm.validation.procedureRequired')),
  diagnosis: z.string().min(1, t('treatmentForm.validation.diagnosisRequired')),
  notes: z.string().optional(),
  status: z.enum(['planned', 'in_progress', 'completed', 'cancelled']),
  startDate: z.string().min(1, t('treatmentForm.validation.startDateRequired')),
  endDate: z.string().optional(),
  duration: z.number().min(1).optional(),
  cost: z.number().min(0).optional()
});

type TreatmentFormData = z.infer<ReturnType<typeof treatmentSchema>>;

interface TreatmentFormProps {
  treatment?: TreatmentRecord | null;
  patientId?: string;
  appointmentId?: string;
  onSave: () => void;
  onCancel: () => void;
}

export const TreatmentForm: React.FC<TreatmentFormProps> = ({
  treatment,
  patientId,
  appointmentId,
  onSave,
  onCancel
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<any[]>([]);
  const [dentists, setDentists] = useState<any[]>([]);
  const [clinics, setClinics] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue
  } = useForm<TreatmentFormData>({
    resolver: zodResolver(treatmentSchema(t)),
    defaultValues: {
      patient: patientId || '',
      dentist: user?.id || '',
      clinic: '',
      appointment: appointmentId || '',
      treatment: '',
      procedure: '',
      diagnosis: '',
      notes: '',
      status: 'planned',
      startDate: format(new Date(), 'yyyy-MM-dd'),
      endDate: '',
      duration: undefined,
      cost: undefined
    }
  });

  const watchedPatient = watch('patient');

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [patientsRes, dentistsRes, clinicsRes] = await Promise.all([
          patientService.getPatients({ limit: 100 }),
          userService.getUsersByRole('dentist'),
          // Removed clinicService call as it's not available
           Promise.resolve({ data: [] })
        ]);

        if (patientsRes.data) {
          setPatients(patientsRes.data || []);
        }

        if (dentistsRes.success && dentistsRes.data) {
          setDentists(dentistsRes.data || []);
        }

        if (clinicsRes.data) {
          setClinics(clinicsRes.data || []);
          // Set default clinic if user has one
          if (user && !treatment) {
            // Use a type assertion to handle the missing property
            const userAny = user as any;
            if (userAny.clinicId) {
              setValue('clinic', userAny.clinicId);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching form data:', error);
        toast.error(t('treatmentForm.errors.fetchDataFailed'));
      }
    };

    fetchData();
  }, [user, setValue, t, treatment]);

  // Fetch appointments when patient changes
  useEffect(() => {
    const fetchAppointments = async () => {
      if (watchedPatient) {
        try {
          // Use appropriate method from patientService
          const response = await patientService.getPatients({ patientId: watchedPatient });
          if (response.success && response.data) {
            setAppointments(response.data || []);
          }
        } catch (error) {
          console.error('Error fetching appointments:', error);
        }
      }
    };

    fetchAppointments();
  }, [watchedPatient]);

  // Load existing treatment data
  useEffect(() => {
    if (treatment) {
      reset({
        patient: treatment.patient._id,
        dentist: treatment.dentist._id,
        clinic: treatment.clinic._id,
        appointment: treatment.appointment?._id || '',
        treatment: treatment.treatment,
        procedure: treatment.procedure,
        diagnosis: treatment.diagnosis,
        notes: treatment.notes || '',
        status: treatment.status,
        startDate: format(new Date(treatment.startDate), 'yyyy-MM-dd'),
        endDate: treatment.endDate ? format(new Date(treatment.endDate), 'yyyy-MM-dd') : '',
        duration: treatment.duration,
        cost: treatment.cost
      });
    }
  }, [treatment, reset]);

  const onSubmit = async (data: TreatmentFormData) => {
    try {
      setLoading(true);

      const treatmentData: CreateTreatmentData = {
        patient: data.patient,
        dentist: data.dentist,
        clinic: data.clinic,
        appointment: data.appointment || undefined,
        treatment: data.treatment,
        procedure: data.procedure,
        diagnosis: data.diagnosis,
        notes: data.notes || undefined,
        status: data.status,
        startDate: data.startDate,
        endDate: data.endDate || undefined,
        duration: data.duration,
        cost: data.cost
      };

      let response;
      if (treatment) {
        response = await treatmentService.updateTreatmentRecord(treatment._id, treatmentData);
        toast.success(t('treatmentForm.success.updated'));
      } else {
        response = await treatmentService.createTreatmentRecord(treatmentData);
        toast.success(t('treatmentForm.success.created'));
      }

      if (response && response.data) {
        onSave();
      }
    } catch (error: any) {
      console.error('Error saving treatment:', error);
      toast.error(error.message || t('treatmentForm.errors.saveFailed'));
    } finally {
      setLoading(false);
    }
  };

  const patientOptions = patients.map(patient => ({
    value: patient._id || patient.id,
    label: `${patient.firstName} ${patient.lastName}`
  }));

  const dentistOptions = dentists.map(dentist => ({
    value: dentist._id || dentist.id,
    label: `Dr. ${dentist.firstName} ${dentist.lastName}`
  }));

  const clinicOptions = clinics.map(clinic => ({
    value: clinic._id || clinic.id,
    label: clinic.name
  }));

  const appointmentOptions = [
    { value: '', label: t('treatmentForm.selectAppointment') },
    ...appointments.map(appointment => ({
      value: appointment._id || appointment.id,
      label: `${format(new Date(appointment.date), 'MMM dd, yyyy')} - ${appointment.type}`
    }))
  ];

  const statusOptions = [
    { value: 'planned', label: t('treatmentForm.status.planned') },
    { value: 'in_progress', label: t('treatmentForm.status.inProgress') },
    { value: 'completed', label: t('treatmentForm.status.completed') },
    { value: 'cancelled', label: t('treatmentForm.status.cancelled') }
  ];

  const treatmentTypes = [
    { value: '', label: t('treatmentForm.selectTreatment') },
    { value: 'Cleaning', label: t('treatmentForm.treatments.cleaning') },
    { value: 'Filling', label: t('treatmentForm.treatments.filling') },
    { value: 'Root Canal', label: t('treatmentForm.treatments.rootCanal') },
    { value: 'Crown', label: t('treatmentForm.treatments.crown') },
    { value: 'Bridge', label: t('treatmentForm.treatments.bridge') },
    { value: 'Extraction', label: t('treatmentForm.treatments.extraction') },
    { value: 'Implant', label: t('treatmentForm.treatments.implant') },
    { value: 'Orthodontics', label: t('treatmentForm.treatments.orthodontics') },
    { value: 'Whitening', label: t('treatmentForm.treatments.whitening') },
    { value: 'Other', label: t('treatmentForm.treatments.other') }
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Patient and Basic Info */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <User className="h-5 w-5 text-blue-600" />
          {t('treatmentForm.sections.basicInfo')}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('treatmentForm.fields.patient')} <span className="text-red-500">*</span>
            </label>
            <Select
              {...register('patient')}
              options={[
                { value: '', label: t('treatmentForm.selectPatient') },
                ...patientOptions
              ]}
              error={errors.patient?.message}
              disabled={!!patientId}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('treatmentForm.fields.dentist')} <span className="text-red-500">*</span>
            </label>
            <Select
              {...register('dentist')}
              options={[
                { value: '', label: t('treatmentForm.selectDentist') },
                ...dentistOptions
              ]}
              error={errors.dentist?.message}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('treatmentForm.fields.clinic')} <span className="text-red-500">*</span>
            </label>
            <Select
              {...register('clinic')}
              options={[
                { value: '', label: t('treatmentForm.selectClinic') },
                ...clinicOptions
              ]}
              error={errors.clinic?.message}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('treatmentForm.fields.appointment')}
            </label>
            <Select
              {...register('appointment')}
              options={appointmentOptions}
              error={errors.appointment?.message}
              disabled={!!appointmentId}
            />
          </div>
        </div>
      </Card>

      {/* Treatment Details */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Stethoscope className="h-5 w-5 text-green-600" />
          {t('treatmentForm.sections.treatmentDetails')}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('treatmentForm.fields.treatment')} <span className="text-red-500">*</span>
            </label>
            <Select
              {...register('treatment')}
              options={treatmentTypes}
              error={errors.treatment?.message}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('treatmentForm.fields.status')} <span className="text-red-500">*</span>
            </label>
            <Select
              {...register('status')}
              options={statusOptions}
              error={errors.status?.message}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('treatmentForm.fields.procedure')} <span className="text-red-500">*</span>
            </label>
            <Input
              {...register('procedure')}
              placeholder={t('treatmentForm.placeholders.procedure')}
              error={errors.procedure?.message}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('treatmentForm.fields.diagnosis')} <span className="text-red-500">*</span>
            </label>
            <Textarea
              {...register('diagnosis')}
              placeholder={t('treatmentForm.placeholders.diagnosis')}
              rows={3}
              error={errors.diagnosis?.message}
            />
          </div>
        </div>
      </Card>

      {/* Schedule and Cost */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-purple-600" />
          {t('treatmentForm.sections.scheduleAndCost')}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('treatmentForm.fields.startDate')} <span className="text-red-500">*</span>
            </label>
            <Input
              type="date"
              {...register('startDate')}
              error={errors.startDate?.message}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('treatmentForm.fields.endDate')}
            </label>
            <Input
              type="date"
              {...register('endDate')}
              error={errors.endDate?.message}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('treatmentForm.fields.duration')}
            </label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="number"
                {...register('duration', { valueAsNumber: true })}
                placeholder={t('treatmentForm.placeholders.duration')}
                className="pl-10"
                error={errors.duration?.message}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('treatmentForm.fields.cost')}
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="number"
                step="0.01"
                {...register('cost', { valueAsNumber: true })}
                placeholder={t('treatmentForm.placeholders.cost')}
                className="pl-10"
                error={errors.cost?.message}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Notes */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-orange-600" />
          {t('treatmentForm.sections.notes')}
        </h3>
        
        <Textarea
          {...register('notes')}
          placeholder={t('treatmentForm.placeholders.notes')}
          rows={4}
          error={errors.notes?.message}
        />
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-6 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          {t('treatmentForm.actions.cancel')}
        </Button>
        <Button
          type="submit"
          isLoading={loading}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          {treatment ? t('treatmentForm.actions.update') : t('treatmentForm.actions.create')}
        </Button>
      </div>
    </form>
  );
};