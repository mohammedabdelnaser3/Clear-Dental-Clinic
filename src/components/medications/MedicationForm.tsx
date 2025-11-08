import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, X, Pill } from 'lucide-react';
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
      if (import.meta.env.DEV) {
        console.error('Error saving medication:', _error);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Form Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg">
              <Pill className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                {medication ? t('medicationForm.updateMedication') : t('medicationForm.createMedication')}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {medication ? 'Update medication information and properties' : 'Add a new medication to the inventory'}
              </p>
            </div>
          </div>
        </div>

        {/* Basic Information Section */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <h4 className="text-lg font-semibold text-gray-900">Basic Information</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                {t('medicationForm.medicationName')} <span className="text-red-500">*</span>
              </label>
              <Input
                {...register('name')}
                placeholder={t('medicationForm.medicationNamePlaceholder')}
                error={errors.name?.message}
                className="border-gray-300 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
              {errors.name && (
                <p className="text-xs text-red-600 flex items-center space-x-1">
                  <X className="w-3 h-3" />
                  <span>{errors.name.message}</span>
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                {t('medicationForm.genericName')}
                <span className="text-gray-400 text-xs ml-1">(Optional)</span>
              </label>
              <Input
                {...register('genericName')}
                placeholder={t('medicationForm.genericNamePlaceholder')}
                error={errors.genericName?.message}
                className="border-gray-300 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Dosage Information Section */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <h4 className="text-lg font-semibold text-gray-900">Dosage Information</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                {t('medicationForm.dosage')} <span className="text-red-500">*</span>
              </label>
              <Input
                {...register('dosage')}
                placeholder={t('medicationForm.dosagePlaceholder')}
                error={errors.dosage?.message}
                className="border-gray-300 focus:ring-green-500 focus:border-green-500 transition-colors"
              />
              {errors.dosage && (
                <p className="text-xs text-red-600 flex items-center space-x-1">
                  <X className="w-3 h-3" />
                  <span>{errors.dosage.message}</span>
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                {t('medicationForm.frequency')} <span className="text-red-500">*</span>
              </label>
              <Input
                {...register('frequency')}
                placeholder={t('medicationForm.frequencyPlaceholder')}
                error={errors.frequency?.message}
                className="border-gray-300 focus:ring-green-500 focus:border-green-500 transition-colors"
              />
              {errors.frequency && (
                <p className="text-xs text-red-600 flex items-center space-x-1">
                  <X className="w-3 h-3" />
                  <span>{errors.frequency.message}</span>
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                {t('medicationForm.duration')} <span className="text-red-500">*</span>
              </label>
              <Input
                {...register('duration')}
                placeholder={t('medicationForm.durationPlaceholder')}
                error={errors.duration?.message}
                className="border-gray-300 focus:ring-green-500 focus:border-green-500 transition-colors"
              />
              {errors.duration && (
                <p className="text-xs text-red-600 flex items-center space-x-1">
                  <X className="w-3 h-3" />
                  <span>{errors.duration.message}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Category and Status Section */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <h4 className="text-lg font-semibold text-gray-900">Category & Status</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                {t('medicationForm.category')} <span className="text-red-500">*</span>
              </label>
              <Select
                {...register('category')}
                options={categories}
                error={errors.category?.message}
                className="border-gray-300 focus:ring-purple-500 focus:border-purple-500 transition-colors"
              />
              {errors.category && (
                <p className="text-xs text-red-600 flex items-center space-x-1">
                  <X className="w-3 h-3" />
                  <span>{errors.category.message}</span>
                </p>
              )}
            </div>
            
            <div className="flex items-center justify-center">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 w-full">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    {...register('isActive')}
                    id="isActive"
                    className="w-5 h-5"
                  />
                  <label htmlFor="isActive" className="text-sm font-semibold text-gray-700 cursor-pointer">
                    {t('medicationForm.activeMedication')}
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-1 ml-8">
                  Active medications are available for prescription
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Instructions Section */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
            <h4 className="text-lg font-semibold text-gray-900">Instructions</h4>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              {t('medicationForm.instructions')}
              <span className="text-gray-400 text-xs ml-1">(Optional)</span>
            </label>
            <Textarea
              {...register('instructions')}
              placeholder={t('medicationForm.instructionsPlaceholder')}
              rows={4}
              error={errors.instructions?.message}
              className="border-gray-300 focus:ring-orange-500 focus:border-orange-500 transition-colors resize-none"
            />
            <p className="text-xs text-gray-500">
              Provide special instructions for taking this medication
            </p>
          </div>
        </div>

        {/* Side Effects Section */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <h4 className="text-lg font-semibold text-gray-900">{t('medicationForm.sideEffects')}</h4>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => appendSideEffect({ effect: '' })}
              className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 border-red-200 hover:border-red-300 transition-colors"
            >
              <Plus className="h-4 w-4" />
              {t('medicationForm.addSideEffect')}
            </Button>
          </div>
          <div className="space-y-3">
            {sideEffectFields.map((field, index) => (
              <div key={field.id} className="flex gap-3 items-start">
                <div className="flex-1">
                  <Input
                    {...register(`sideEffects.${index}.effect`)}
                    placeholder={t('medicationForm.sideEffectPlaceholder')}
                    error={errors.sideEffects?.[index]?.effect?.message}
                    className="border-gray-300 focus:ring-red-500 focus:border-red-500 transition-colors"
                  />
                </div>
                {sideEffectFields.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeSideEffect(index)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 transition-colors"
                    aria-label={`Remove side effect ${index + 1}`}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Contraindications Section */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <h4 className="text-lg font-semibold text-gray-900">{t('medicationForm.contraindications')}</h4>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => appendContraindication({ contraindication: '' })}
              className="flex items-center gap-2 bg-yellow-50 hover:bg-yellow-100 text-yellow-600 border-yellow-200 hover:border-yellow-300 transition-colors"
            >
              <Plus className="h-4 w-4" />
              {t('medicationForm.addContraindication')}
            </Button>
          </div>
          <div className="space-y-3">
            {contraindicationFields.map((field, index) => (
              <div key={field.id} className="flex gap-3 items-start">
                <div className="flex-1">
                  <Input
                    {...register(`contraindications.${index}.contraindication`)}
                    placeholder={t('medicationForm.contraindicationPlaceholder')}
                    error={errors.contraindications?.[index]?.contraindication?.message}
                    className="border-gray-300 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                  />
                </div>
                {contraindicationFields.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeContraindication(index)}
                    className="text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 border-yellow-200 transition-colors"
                    aria-label={`Remove contraindication ${index + 1}`}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Actions */}
        <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
              className="px-6 py-2 border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400 transition-colors"
            >
              {t('medicationForm.cancel')}
            </Button>
            <Button
              type="submit"
              isLoading={loading}
              disabled={loading}
              className="px-8 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
            >
              {medication ? t('medicationForm.updateMedication') : t('medicationForm.createMedication')}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};