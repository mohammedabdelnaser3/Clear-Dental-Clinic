import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, X } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Textarea from '../ui/Textarea';
import Checkbox from '../ui/Checkbox';
import { medicationService } from '../../services/medicationService';
import { toast } from 'react-hot-toast';

const T_PREFIX = 'medicationForm.validation';

const medicationSchema = (t: (key: string) => string) => z.object({
  name: z.string().min(1, t(`${T_PREFIX}.medicationNameRequired`)),
  genericName: z.string().optional(),
  dosage: z.string().min(1, t(`${T_PREFIX}.dosageRequired`)),
  frequency: z.string().min(1, t(`${T_PREFIX}.frequencyRequired`)),
  duration: z.string().min(1, t(`${T_PREFIX}.durationRequired`)),
  instructions: z.string().optional(),
  sideEffects: z.array(z.object({
    effect: z.string().min(1, t(`${T_PREFIX}.sideEffectRequired`))
  })),
  contraindications: z.array(z.object({
    contraindication: z.string().min(1, t(`${T_PREFIX}.contraindicationRequired`))
  })),
  category: z.enum(['antibiotic', 'painkiller', 'anti-inflammatory', 'anesthetic', 'antiseptic', 'other']),
  isActive: z.boolean()
});

type MedicationFormData = z.infer<ReturnType<typeof medicationSchema>>;

interface Medication {
  id: string;
  name: string;
  genericName?: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
  sideEffects: string[];
  contraindications: string[];
  category: 'antibiotic' | 'painkiller' | 'anti-inflammatory' | 'anesthetic' | 'antiseptic' | 'other';
  isActive: boolean;
}

interface MedicationFormProps {
  medication?: Medication | null;
  onSave: () => void;
  onCancel: () => void;
}

export const MedicationForm: React.FC<MedicationFormProps> = ({
  medication,
  onSave,
  onCancel
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<MedicationFormData>({
    resolver: zodResolver(medicationSchema(t)),
    defaultValues: {
      name: '',
      genericName: '',
      dosage: '',
      frequency: '',
      duration: '',
      instructions: '',
      sideEffects: [{ effect: '' }],
      contraindications: [{ contraindication: '' }],
      category: 'other',
      isActive: true
    }
  });

  const {
    fields: sideEffectFields,
    append: appendSideEffect,
    remove: removeSideEffect
  } = useFieldArray({
    control,
    name: 'sideEffects'
  });

  const {
    fields: contraindicationFields,
    append: appendContraindication,
    remove: removeContraindication
  } = useFieldArray({
    control,
    name: 'contraindications'
  });

  const categories = [
    { value: 'antibiotic', label: t('medicationForm.categories.antibiotic') },
    { value: 'painkiller', label: t('medicationForm.categories.painkiller') },
    { value: 'anti-inflammatory', label: t('medicationForm.categories.anti-inflammatory') },
    { value: 'anesthetic', label: t('medicationForm.categories.anesthetic') },
    { value: 'antiseptic', label: t('medicationForm.categories.antiseptic') },
    { value: 'other', label: t('medicationForm.categories.other') }
  ];

  useEffect(() => {
    if (medication) {
      reset({
        name: medication.name,
        genericName: medication.genericName || '',
        dosage: medication.dosage,
        frequency: medication.frequency,
        duration: medication.duration,
        instructions: medication.instructions || '',
        sideEffects: medication.sideEffects.length > 0 
          ? medication.sideEffects.map(effect => ({ effect }))
          : [{ effect: '' }],
        contraindications: medication.contraindications.length > 0
          ? medication.contraindications.map(contraindication => ({ contraindication }))
          : [{ contraindication: '' }],
        category: medication.category,
        isActive: medication.isActive
      });
    }
  }, [medication, reset]);

  const onSubmit = async (data: MedicationFormData) => {
    try {
      setLoading(true);
      
      // Transform data for API
      const medicationData = {
        name: data.name,
        genericName: data.genericName || undefined,
        dosage: data.dosage,
        frequency: data.frequency,
        duration: data.duration,
        instructions: data.instructions || undefined,
        sideEffects: data.sideEffects
          .filter(item => item.effect.trim() !== '')
          .map(item => item.effect),
        contraindications: data.contraindications
          .filter(item => item.contraindication.trim() !== '')
          .map(item => item.contraindication),
        category: data.category,
        isActive: data.isActive
      };

      if (medication) {
        console.log('medication',medication,medication.id);
        await medicationService.updateMedication(medication.id, medicationData);
        toast.success(t('medicationForm.successUpdate'));
      } else {
        await medicationService.createMedication(medicationData);
        toast.success(t('medicationForm.successCreate'));
      }
      
      onSave();
    } catch (_error: any) {
              toast.error(_error.response?.data?.message || t('medicationForm.errorSave'));
      console.error('Error saving medication:', _error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('medicationForm.medicationName')} *
          </label>
          <Input
            {...register('name')}
            placeholder={t('medicationForm.medicationNamePlaceholder')}
            error={errors.name?.message}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('medicationForm.genericName')}
          </label>
          <Input
            {...register('genericName')}
            placeholder={t('medicationForm.genericNamePlaceholder')}
            error={errors.genericName?.message}
          />
        </div>
      </div>

      {/* Dosage Information */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('medicationForm.dosage')} *
          </label>
          <Input
            {...register('dosage')}
            placeholder={t('medicationForm.dosagePlaceholder')}
            error={errors.dosage?.message}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('medicationForm.frequency')} *
          </label>
          <Input
            {...register('frequency')}
            placeholder={t('medicationForm.frequencyPlaceholder')}
            error={errors.frequency?.message}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('medicationForm.duration')} *
          </label>
          <Input
            {...register('duration')}
            placeholder={t('medicationForm.durationPlaceholder')}
            error={errors.duration?.message}
          />
        </div>
      </div>

      {/* Category and Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('medicationForm.category')} *
          </label>
          <Select
            {...register('category')}
            options={categories}
            error={errors.category?.message}
          />
        </div>
        
        <div className="flex items-center space-x-2 pt-6">
          <Checkbox
            {...register('isActive')}
            id="isActive"
          />
          <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
            {t('medicationForm.activeMedication')}
          </label>
        </div>
      </div>

      {/* Instructions */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('medicationForm.instructions')}
        </label>
        <Textarea
          {...register('instructions')}
          placeholder={t('medicationForm.instructionsPlaceholder')}
          rows={3}
          error={errors.instructions?.message}
        />
      </div>

      {/* Side Effects */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-medium text-gray-700">
            {t('medicationForm.sideEffects')}
          </label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => appendSideEffect({ effect: '' })}
            className="flex items-center gap-1"
          >
            <Plus className="h-4 w-4" />
            {t('medicationForm.addSideEffect')}
          </Button>
        </div>
        <div className="space-y-2">
          {sideEffectFields.map((field, index) => (
            <div key={field.id} className="flex gap-2">
              <Input
                {...register(`sideEffects.${index}.effect`)}
                placeholder={t('medicationForm.sideEffectPlaceholder')}
                error={errors.sideEffects?.[index]?.effect?.message}
              />
              {sideEffectFields.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeSideEffect(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Contraindications */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-medium text-gray-700">
            {t('medicationForm.contraindications')}
          </label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => appendContraindication({ contraindication: '' })}
            className="flex items-center gap-1"
          >
            <Plus className="h-4 w-4" />
            {t('medicationForm.addContraindication')}
          </Button>
        </div>
        <div className="space-y-2">
          {contraindicationFields.map((field, index) => (
            <div key={field.id} className="flex gap-2">
              <Input
                {...register(`contraindications.${index}.contraindication`)}
                placeholder={t('medicationForm.contraindicationPlaceholder')}
                error={errors.contraindications?.[index]?.contraindication?.message}
              />
              {contraindicationFields.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeContraindication(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-6 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          {t('medicationForm.cancel')}
        </Button>
        <Button
          type="submit"
          isLoading={loading}
          disabled={loading}
        >
          {medication ? t('medicationForm.updateMedication') : t('medicationForm.createMedication')}
        </Button>
      </div>
    </form>
  );
};