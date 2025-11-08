import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline/index.js';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Textarea from '../ui/Textarea';
import Card from '../ui/Card';
import { billingService } from '../../services/billingService';
import { patientService } from '../../services/patientService';
import { appointmentService } from '../../services/appointmentService';
import { treatmentService } from '../../services/treatmentService';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

const getBillingSchema = (t: (key: string) => string) => z.object({
  patient: z.string().min(1, t('billingForm.validation.patientRequired')),
  appointment: z.string().optional(),
  treatmentRecord: z.string().optional(),
  items: z.array(z.object({
    description: z.string().min(1, t('billingForm.validation.itemDescriptionRequired')),
    quantity: z.number().min(1, t('billingForm.validation.itemQuantityMin')),
    unitPrice: z.number().min(0, t('billingForm.validation.itemUnitPriceMin')),
    total: z.number().min(0, t('billingForm.validation.itemTotalMin'))
  })).min(1, t('billingForm.validation.atLeastOneItem')),
  subtotal: z.number().min(0, t('billingForm.validation.subtotalMin')),
  taxRate: z.number().min(0).max(100, t('billingForm.validation.taxRateMin')),
  taxAmount: z.number().min(0, t('billingForm.validation.taxAmountMin')),
  discountAmount: z.number().min(0, t('billingForm.validation.discountAmountMin')),
  totalAmount: z.number().min(0, t('billingForm.validation.totalAmountMin')),
  paymentMethod: z.string().optional(),
  insuranceProvider: z.string().optional(),
  insurancePolicyNumber: z.string().optional(),
  insuranceCoverageAmount: z.number().min(0).optional(),
  dueDate: z.string().min(1, t('billingForm.validation.dueDateRequired')),
  notes: z.string().optional()
});

type BillingFormData = z.infer<ReturnType<typeof getBillingSchema>>;

interface BillingRecord {
  _id: string;
  patient: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  appointment?: {
    _id: string;
    date: string;
    type: string;
  };
  treatmentRecord?: {
    _id: string;
    treatment: string;
  };
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paymentMethod?: string;
  insuranceInfo?: {
    provider: string;
    policyNumber: string;
    coverageAmount: number;
  };
  dueDate: string;
  notes?: string;
}

interface BillingFormProps {
  billingRecord?: BillingRecord | null;
  patientId?: string;
  onSave: () => void;
  onCancel: () => void;
}

interface Patient {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Appointment {
  _id: string;
  date: string;
  type: string;
  status: string;
}

interface TreatmentRecord {
  _id: string;
  treatment: string;
  date: string;
}

export const BillingForm: React.FC<BillingFormProps> = ({
  billingRecord,
  patientId,
  onSave,
  onCancel
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [treatmentRecords, setTreatmentRecords] = useState<TreatmentRecord[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<string>(patientId || '');
  const [taxRate, setTaxRate] = useState(10); // Default 10% tax

  const billingSchema = getBillingSchema(t);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset
  } = useForm<BillingFormData>({
    resolver: zodResolver(billingSchema),
    defaultValues: {
      patient: patientId || '',
      items: [{ description: '', quantity: 1, unitPrice: 0, total: 0 }],
      subtotal: 0,
      taxRate: 10,
      taxAmount: 0,
      discountAmount: 0,
      totalAmount: 0,
      dueDate: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd') // 30 days from now
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items'
  });

  const watchedItems = watch('items');
  const watchedDiscountAmount = watch('discountAmount');

  const paymentMethodOptions = [
    { value: '', label: t('billingForm.selectPaymentMethod') },
    { value: 'cash', label: t('billingForm.cash') },
    { value: 'credit_card', label: t('billingForm.creditCard') },
    { value: 'debit_card', label: t('billingForm.debitCard') },
    { value: 'check', label: t('billingForm.check') },
    { value: 'bank_transfer', label: t('billingForm.bankTransfer') },
    { value: 'insurance', label: t('billingForm.insurance') }
  ];

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

  // Fetch appointments and treatment records when patient changes
  useEffect(() => {
    const fetchPatientData = async () => {
      if (!selectedPatient) return;

      try {
        // Fetch appointments
        const appointmentsResponse = await appointmentService.getAppointments({
          patientId: selectedPatient,
          limit: 50
        });
        setAppointments((appointmentsResponse as any).data.appointments);

        // Fetch treatment records
        const treatmentsResponse = await treatmentService.getTreatmentRecords({
          patient: selectedPatient,
          limit: 50
        });
        setTreatmentRecords((treatmentsResponse as any).data.treatmentRecords);
      } catch (_error) {
        console.error('Error fetching patient data:', _error);
      }
    };

    fetchPatientData();
  }, [selectedPatient]);

  // Initialize form with existing billing record
  useEffect(() => {
    if (billingRecord) {
      reset({
        patient: billingRecord.patient._id,
        appointment: billingRecord.appointment?._id || '',
        treatmentRecord: billingRecord.treatmentRecord?._id || '',
        items: billingRecord.items,
        subtotal: billingRecord.subtotal,
        taxRate: (billingRecord.taxAmount / billingRecord.subtotal) * 100 || 10,
        taxAmount: billingRecord.taxAmount,
        discountAmount: billingRecord.discountAmount,
        totalAmount: billingRecord.totalAmount,
        paymentMethod: billingRecord.paymentMethod || '',
        insuranceProvider: billingRecord.insuranceInfo?.provider || '',
        insurancePolicyNumber: billingRecord.insuranceInfo?.policyNumber || '',
        insuranceCoverageAmount: billingRecord.insuranceInfo?.coverageAmount || 0,
        dueDate: format(new Date(billingRecord.dueDate), 'yyyy-MM-dd'),
        notes: billingRecord.notes || ''
      });
      setSelectedPatient(billingRecord.patient._id);
      setTaxRate((billingRecord.taxAmount / billingRecord.subtotal) * 100 || 10);
    }
  }, [billingRecord, reset]);

  // Calculate totals when items or discount change
  useEffect(() => {
    const round2 = (n: number) => Math.round(n * 100) / 100;
    const subtotal = watchedItems.reduce((sum, item) => {
      const itemTotal = (item.quantity || 0) * (item.unitPrice || 0);
      return sum + itemTotal;
    }, 0);

    const taxAmount = round2((subtotal * taxRate) / 100);
    const totalAmount = round2(subtotal + taxAmount - (watchedDiscountAmount || 0));

    setValue('subtotal', round2(subtotal));
    setValue('taxAmount', taxAmount);
    setValue('totalAmount', Math.max(0, totalAmount));

    // Update individual item totals
    watchedItems.forEach((item, index) => {
      const itemTotal = round2((item.quantity || 0) * (item.unitPrice || 0));
      setValue(`items.${index}.total`, itemTotal);
    });
  }, [watchedItems, watchedDiscountAmount, taxRate, setValue]);

  const handlePatientChange = (patientId: string) => {
    setSelectedPatient(patientId);
    setValue('patient', patientId);
    setValue('appointment', '');
    setValue('treatmentRecord', '');
  };

  const handleTaxRateChange = (rate: number) => {
    setTaxRate(rate);
    setValue('taxRate', rate);
  };

  const addItem = () => {
    append({ description: '', quantity: 1, unitPrice: 0, total: 0 });
  };

  const removeItem = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  const onSubmit = async (data: BillingFormData) => {
    try {
      setLoading(true);

      const billingData = {
        ...data,
        insuranceInfo: data.insuranceProvider ? {
          provider: data.insuranceProvider,
          policyNumber: data.insurancePolicyNumber || '',
          coverageAmount: data.insuranceCoverageAmount || 0
        } : undefined
      };

      if (billingRecord) {
        await billingService.updateBillingRecord(billingRecord._id, billingData);
        toast.success('Invoice updated successfully');
      } else {
        await billingService.createBillingRecord(billingData);
        toast.success('Invoice created successfully');
      }

      onSave();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save invoice');
      console.error('Error saving billing record:', error);
    } finally {
      setLoading(false);
    }
  };

  const patientOptions = patients.map(patient => ({
    value: patient._id,
    label: `${patient.firstName} ${patient.lastName} (${patient.email})`
  }));

  const appointmentOptions = [
    { value: '', label: 'No appointment' },
    ...appointments.map(appointment => ({
      value: appointment._id,
      label: `${appointment.type} - ${format(new Date(appointment.date), 'MMM dd, yyyy')}`
    }))
  ];

  const treatmentOptions = [
    { value: '', label: 'No treatment record' },
    ...treatmentRecords.map(treatment => ({
      value: treatment._id,
      label: `${treatment.treatment} - ${format(new Date(treatment.date), 'MMM dd, yyyy')}`
    }))
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Patient Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('billingForm.patient')} *
          </label>
          {patientId ? (
            <Input
              value={billingRecord ? `${billingRecord.patient.firstName} ${billingRecord.patient.lastName}` : t('billingForm.selectPatient')}
              disabled
            />
          ) : (
            <Select
              {...register('patient')}
              options={patientOptions}
              onChange={(e) => handlePatientChange(e.target.value)}
              error={errors.patient?.message}
            />
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('billingForm.dueDate')} *
          </label>
          <Input
            type="date"
            {...register('dueDate')}
            error={errors.dueDate?.message}
          />
        </div>
      </div>

      {/* Appointment and Treatment */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('billingForm.appointment')}
          </label>
          <Select
            {...register('appointment')}
            options={appointmentOptions}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('billingForm.treatmentRecord')}
          </label>
          <Select
            {...register('treatmentRecord')}
            options={treatmentOptions}
          />
        </div>
      </div>

      {/* Items */}
      <Card className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">{t('billingForm.invoiceItems')}</h3>
          <Button type="button" onClick={addItem} size="sm">
            <PlusIcon className="h-4 w-4 mr-1" />
            {t('billingForm.addItem')}
          </Button>
        </div>

        <div className="space-y-4">
          {fields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-12 gap-2 items-start">
              <div className="col-span-5">
                <Input
                  {...register(`items.${index}.description`)}
                  placeholder={t('billingForm.description')}
                  error={errors.items?.[index]?.description?.message}
                />
              </div>
              <div className="col-span-2">
                <Input
                  type="number"
                  min="1"
                  step="1"
                  {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                  placeholder={t('billingForm.quantity')}
                  error={errors.items?.[index]?.quantity?.message}
                />
              </div>
              <div className="col-span-2">
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  {...register(`items.${index}.unitPrice`, { valueAsNumber: true })}
                  placeholder={t('billingForm.unitPrice')}
                  error={errors.items?.[index]?.unitPrice?.message}
                />
              </div>
              <div className="col-span-2">
                <Input
                  type="number"
                  {...register(`items.${index}.total`, { valueAsNumber: true })}
                  placeholder={t('billingForm.total')}
                  disabled
                  className="bg-gray-50"
                />
              </div>
              <div className="col-span-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeItem(index)}
                  disabled={fields.length === 1}
                  className="text-red-600 hover:text-red-700"
                >
                  <TrashIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Totals */}
      <Card className="p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">{t('billingForm.summary')}</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('billingForm.subtotal')}
              </label>
              <Input
                type="number"
                {...register('subtotal', { valueAsNumber: true })}
                disabled
                className="bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('billingForm.taxRate')}
              </label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.01"
                {...register('taxRate', { 
                  valueAsNumber: true,
                  onChange: (e) => handleTaxRateChange(parseFloat(e.target.value) || 0)
                })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tax Amount
              </label>
              <Input
                type="number"
                {...register('taxAmount', { valueAsNumber: true })}
                disabled
                className="bg-gray-50"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('billingForm.discountAmount')}
              </label>
              <Input
                type="number"
                min="0"
                step="0.01"
                {...register('discountAmount', { valueAsNumber: true })}
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('billingForm.totalAmount')}
              </label>
              <Input
                type="number"
                {...register('totalAmount', { valueAsNumber: true })}
                disabled
                className="bg-gray-50 text-lg font-semibold"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Payment and Insurance */}
      <Card className="p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">{t('billingForm.paymentInformation')}</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('billingForm.paymentMethod')}
            </label>
            <Select
              {...register('paymentMethod')}
              options={paymentMethodOptions}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('billingForm.insuranceProvider')}
              </label>
              <Input
                {...register('insuranceProvider')}
                placeholder="Insurance company name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('billingForm.insurancePolicyNumber')}
              </label>
              <Input
                {...register('insurancePolicyNumber')}
                placeholder="Policy number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('billingForm.insuranceCoverageAmount')}
              </label>
              <Input
                type="number"
                min="0"
                step="0.01"
                {...register('insuranceCoverageAmount', { valueAsNumber: true })}
                placeholder="0.00"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('billingForm.notes')}
        </label>
        <Textarea
          {...register('notes')}
          placeholder="Additional notes or comments..."
          rows={3}
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          {t('billingForm.cancel')}
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? (billingRecord ? t('billingForm.updating') : t('billingForm.saving')) : (billingRecord ? t('billingForm.updateInvoice') : t('billingForm.createInvoice'))}
        </Button>
      </div>
    </form>
  );
};