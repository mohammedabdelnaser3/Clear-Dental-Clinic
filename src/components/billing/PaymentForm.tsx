import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DollarSign, CreditCard, Shield, Lock, Eye, EyeOff } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Textarea from '../ui/Textarea';
import Card from '../ui/Card';
import PaymentStatusIndicator from './PaymentStatusIndicator';
import { billingService } from '../../services/billingService';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { paymentGateway } from '../../services/paymentGateway';

// Enhanced validation schema with security requirements
const getPaymentSchema = (t: (key: string) => string) => z.object({
  amount: z.number()
    .min(0.01, t('paymentForm.validation.amountRequired'))
    .refine(val => val <= 1000000, t('paymentForm.validation.amountMax')),
  method: z.string().min(1, t('paymentForm.validation.methodRequired')),
  reference: z.string().optional().nullable(),
  notes: z.string().max(500, t('paymentForm.validation.notesMax')).optional().nullable(),
  paymentDate: z.string().min(1, t('paymentForm.validation.dateRequired')),
  // Credit card fields (when applicable)
  cardNumber: z.string().optional(),
  expiryDate: z.string().optional(),
  cvv: z.string().optional(),
  cardholderName: z.string().optional()
});

type PaymentFormData = z.infer<ReturnType<typeof getPaymentSchema>>;

interface BillingRecord {
  _id: string;
  invoiceNumber: string;
  patient: {
    firstName: string;
    lastName: string;
  };
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  paymentStatus: string;
}

interface PaymentFormProps {
  billingRecord: BillingRecord;
  onSave: () => void;
  onCancel: () => void;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({
  billingRecord,
  onSave,
  onCancel
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [showCardDetails, setShowCardDetails] = useState(false);
  const [showCvv, setShowCvv] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<PaymentFormData>({
    resolver: zodResolver(getPaymentSchema(t)),
    defaultValues: {
      amount: billingRecord.balanceAmount,
      method: '',
      reference: '',
      notes: '',
      paymentDate: format(new Date(), 'yyyy-MM-dd')
    }
  });

  const watchedAmount = watch('amount');
  const watchedMethod = watch('method');
  const watchedCardNumber = watch('cardNumber');
  const watchedExpiryDate = watch('expiryDate');
  const watchedCvv = watch('cvv');
  const watchedCardholderName = watch('cardholderName');

  const paymentMethodOptions = [
    { value: '', label: t('paymentForm.selectPaymentMethod') },
    { value: 'cash', label: t('paymentForm.cash') },
    { value: 'credit_card', label: t('paymentForm.creditCard') },
    { value: 'debit_card', label: t('paymentForm.debitCard') },
    { value: 'check', label: t('paymentForm.check') },
    { value: 'bank_transfer', label: t('paymentForm.bankTransfer') },
    { value: 'insurance', label: t('paymentForm.insurancePayment') },
    { value: 'other', label: t('paymentForm.other') }
  ];

  const handleAmountChange = (amount: number) => {
    const validAmount = Math.min(Math.max(0, amount), billingRecord.balanceAmount);
    setValue('amount', validAmount);
  };

  const setFullPayment = () => {
    handleAmountChange(billingRecord.balanceAmount);
  };

  const setPartialPayment = (percentage: number) => {
    const amount = (billingRecord.balanceAmount * percentage) / 100;
    handleAmountChange(Math.round(amount * 100) / 100);
  };

  const maskCardNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    // Add spaces every 4 digits
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  const validateCardNumber = (cardNumber: string) => {
    // Basic Luhn algorithm validation
    const digits = cardNumber.replace(/\D/g, '');
    if (digits.length < 13 || digits.length > 19) return false;
    
    let sum = 0;
    let isEven = false;
    
    for (let i = digits.length - 1; i >= 0; i--) {
      let digit = parseInt(digits[i]);
      
      if (isEven) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      
      sum += digit;
      isEven = !isEven;
    }
    
    return sum % 10 === 0;
  };

  const handlePaymentMethodChange = (method: string) => {
    setValue('method', method);
    setShowCardDetails(method === 'credit_card' || method === 'debit_card');
  };

  const maskExpiry = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    if (digits.length <= 2) return digits;
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  };

  const simulatePaymentProcessing = async () => {
    setProcessingPayment(true);
    setPaymentStatus('processing');
    
    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulate success/failure (90% success rate)
    const isSuccess = Math.random() > 0.1;
    
    if (isSuccess) {
      setPaymentStatus('success');
      toast.success(t('paymentForm.paymentSuccess'));
    } else {
      setPaymentStatus('failed');
      toast.error(t('paymentForm.paymentFailed'));
    }
    
    setProcessingPayment(false);
    
    return isSuccess;
  };

  const onSubmit = async (data: PaymentFormData) => {
    try {
      setLoading(true);

      if (data.amount > billingRecord.balanceAmount) {
        toast.error(t('paymentForm.errorAmountExceedsBalance', { balance: billingRecord.balanceAmount.toFixed(2) }));
        return;
      }

      // If card payment, validate and tokenize securely
      let secureReference: string | null = data.reference?.trim() || null;
      if (data.method === 'credit_card' || data.method === 'debit_card') {
        // Validate presence
        if (!data.cardholderName || !data.cardNumber || !data.expiryDate || !data.cvv) {
          toast.error(t('paymentForm.validation.cardDetailsRequired'));
          return;
        }

        const cleanedCardNumber = data.cardNumber.replace(/\D/g, '');
        if (!validateCardNumber(cleanedCardNumber)) {
          toast.error(t('paymentForm.validation.cardNumberInvalid'));
          return;
        }

        const expiryDigits = data.expiryDate.replace(/\D/g, '');
        if (expiryDigits.length !== 4) {
          toast.error(t('paymentForm.validation.expiryInvalid'));
          return;
        }
        const mm = parseInt(expiryDigits.slice(0, 2));
        const yy = parseInt(expiryDigits.slice(2));
        if (mm < 1 || mm > 12) {
          toast.error(t('paymentForm.validation.expiryInvalid'));
          return;
        }

        if (!/^\d{3,4}$/.test(data.cvv)) {
          toast.error(t('paymentForm.validation.cvvInvalid'));
          return;
        }

        // Tokenize card (PCI: do not send/store PAN/CVV)
        const tokenResult = await paymentGateway.tokenizeCard({
          cardNumber: cleanedCardNumber,
          cardholderName: data.cardholderName,
          expiryMonth: mm,
          expiryYear: yy,
          cvv: data.cvv
        });

        if (!tokenResult.success) {
          toast.error(t('paymentForm.paymentFailed'));
          return;
        }

        const processResult = await paymentGateway.processPayment({
          amount: data.amount,
          method: data.method,
          token: tokenResult.token!
        });

        if (!processResult.success) {
          toast.error(processResult.message || t('paymentForm.paymentFailed'));
          return;
        }

        secureReference = processResult.transactionId ?? tokenResult.token ?? null;
      }

      // Send only non-sensitive payment data to backend
      await billingService.addPayment(billingRecord._id, {
        amount: data.amount,
        method: data.method,
        reference: secureReference || undefined,
        notes: data.notes?.trim() || undefined,
        paymentDate: data.paymentDate
      });
      toast.success(t('paymentForm.successMessage'));
      onSave();
    } catch (_error: unknown) {
      const errorMessage = _error instanceof Error ? _error.message : t('paymentForm.errorMessage');
      toast.error(errorMessage);
      console.error('Error adding payment:', _error);
    } finally {
      setLoading(false);
    }
  };

  const getNewStatus = () => {
    if (!watchedAmount || watchedAmount <= 0) return billingRecord.paymentStatus;
    return watchedAmount >= billingRecord.balanceAmount ? 'paid' : 'partial';
  };

  const getNewBalance = () => {
    return Math.max(0, billingRecord.balanceAmount - (watchedAmount || 0));
  };

  const isValidPayment = watchedAmount > 0 && watchedAmount <= billingRecord.balanceAmount;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Invoice Summary */}
      <Card className="p-4 bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
          <DollarSign className="h-5 w-5 mr-2" />
          {t('paymentForm.invoiceSummary')}
        </h3>
        <div className="mt-2">
          <PaymentStatusIndicator
            status={getNewStatus() as any}
            amount={watchedAmount || 0}
            totalAmount={billingRecord.balanceAmount}
            size="sm"
            showProgress
          />
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600">{t('paymentForm.invoiceNumber')}</p>
            <p className="font-medium">#{billingRecord.invoiceNumber}</p>
          </div>
          <div>
            <p className="text-gray-600">{t('paymentForm.patient')}</p>
            <p className="font-medium">
              {billingRecord.patient.firstName} {billingRecord.patient.lastName}
            </p>
          </div>
          <div>
            <p className="text-gray-600">{t('paymentForm.totalAmount')}</p>
            <p className="font-medium">${billingRecord.totalAmount.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-gray-600">{t('paymentForm.paidAmount')}</p>
            <p className="font-medium text-green-600">${billingRecord.paidAmount.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-gray-600">{t('paymentForm.currentBalance')}</p>
            <p className="font-medium text-red-600">${billingRecord.balanceAmount.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-gray-600">{t('paymentForm.newBalance')}</p>
            <p className={`font-medium ${
              getNewBalance() === 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              ${getNewBalance().toFixed(2)}
            </p>
          </div>
        </div>
      </Card>

      {/* Payment Amount */}
      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
          {t('paymentForm.paymentAmount')}
        </label>
        <div className="space-y-3">
          <Input
            id="amount"
            type="number"
            min="0.01"
            max={billingRecord.balanceAmount}
            step="0.01"
            {...register('amount', { valueAsNumber: true })}
            error={errors.amount?.message}
            placeholder={t('paymentForm.paymentAmountPlaceholder')}
          />
          
          {/* Quick Amount Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={setFullPayment}
            >
              {t('paymentForm.fullPayment')} (${billingRecord.balanceAmount.toFixed(2)})
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPartialPayment(50)}
            >
              {t('paymentForm.partialPayment50')} (${(billingRecord.balanceAmount * 0.5).toFixed(2)})
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPartialPayment(25)}
            >
              {t('paymentForm.partialPayment25')} (${(billingRecord.balanceAmount * 0.25).toFixed(2)})
            </Button>
          </div>
        </div>
      </div>

      {/* Payment Method */}
      <div>
        <label htmlFor="method" className="block text-sm font-medium text-gray-700 mb-1">
          {t('paymentForm.paymentMethod')}
        </label>
        <Select
          id="method"
          {...register('method')}
          options={paymentMethodOptions}
          error={errors.method?.message}
          onChange={(e) => handlePaymentMethodChange(e.target.value)}
        />
      </div>

      {/* PCI Compliance Note */}
      {showCardDetails && (
        <Card className="p-4 bg-slate-50 border border-slate-200">
          <div className="flex items-center text-slate-700 mb-3 text-sm">
            <Shield className="h-4 w-4 mr-2" />
            {t('paymentForm.pciNotice', { defaultValue: 'We securely tokenize card data and never store PAN/CVV.' })}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('paymentForm.cardholderName')}
              </label>
              <Input
                id="cardholderName"
                value={watchedCardholderName || ''}
                {...register('cardholderName')}
                placeholder={t('paymentForm.cardholderNamePlaceholder')}
                error={errors.cardholderName?.message}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('paymentForm.cardNumber')}
              </label>
              <Input
                id="cardNumber"
                value={maskCardNumber(watchedCardNumber || '')}
                onChange={(e) => setValue('cardNumber', maskCardNumber(e.target.value))}
                placeholder="•••• •••• •••• ••••"
                error={errors.cardNumber?.message}
                inputMode="numeric"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('paymentForm.expiryDate')}
              </label>
              <Input
                id="expiryDate"
                value={maskExpiry(watchedExpiryDate || '')}
                onChange={(e) => setValue('expiryDate', maskExpiry(e.target.value))}
                placeholder="MM/YY"
                error={errors.expiryDate?.message}
                inputMode="numeric"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('paymentForm.cvv')}
              </label>
              <div className="relative">
                <Input
                  id="cvv"
                  type={showCvv ? 'text' : 'password'}
                  value={watchedCvv || ''}
                  {...register('cvv')}
                  placeholder={t('paymentForm.cvvPlaceholder')}
                  error={errors.cvv?.message}
                  inputMode="numeric"
                  maxLength={4}
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
                  onClick={() => setShowCvv(!showCvv)}
                  aria-label={showCvv ? t('paymentForm.hideCvv') : t('paymentForm.showCvv')}
                >
                  {showCvv ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500 flex items-center">
                <Lock className="h-3 w-3 mr-1" />
                {t('paymentForm.secureCvv', { defaultValue: 'CVV is never stored or logged.' })}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Payment Date */}
      <div>
        <label htmlFor="paymentDate" className="block text-sm font-medium text-gray-700 mb-1">
          {t('paymentForm.paymentDate')}
        </label>
        <Input
          id="paymentDate"
          type="date"
          {...register('paymentDate')}
          error={errors.paymentDate?.message}
          max={format(new Date(), 'yyyy-MM-dd')}
        />
      </div>

      {/* Reference Number */}
      <div>
        <label htmlFor="reference" className="block text-sm font-medium text-gray-700 mb-1">
          {t('paymentForm.referenceNumber')}
        </label>
        <Input
          id="reference"
          {...register('reference')}
          placeholder={t('paymentForm.referencePlaceholder')}
          error={errors.reference?.message}
        />
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
          {t('paymentForm.paymentNotes')}
        </label>
        <Textarea
          id="notes"
          {...register('notes')}
          placeholder={t('paymentForm.notesPlaceholder')}
          rows={3}
          maxLength={500}
        />
      </div>

      {/* Payment Preview */}
      <Card className="p-4 bg-blue-50">
        <h4 className="font-medium text-blue-900 mb-2 flex items-center">
          <CreditCard className="h-4 w-4 mr-2" />
          {t('paymentForm.paymentPreview')}
        </h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-blue-700">{t('paymentForm.previewAmount')}</span>
            <span className="font-medium text-blue-900">
              ${(watchedAmount || 0).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-blue-700">{t('paymentForm.previewRemaining')}</span>
            <span className={`font-medium ${
              getNewBalance() === 0 ? 'text-green-600' : 'text-blue-900'
            }`}>
              ${getNewBalance().toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-blue-700">{t('paymentForm.previewStatus')}</span>
            <span className="font-medium text-blue-900 capitalize">
              {getNewStatus()}
            </span>
          </div>
        </div>
      </Card>

      {/* Validation Messages */}
      {watchedAmount > billingRecord.balanceAmount && (
        <div role="alert" className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">
            {t('paymentForm.errorAmountExceedsBalance', { balance: billingRecord.balanceAmount.toFixed(2) })}
          </p>
        </div>
      )}

      {watchedAmount === billingRecord.balanceAmount && (
        <div role="alert" className="p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-600">
            {t('paymentForm.infoFullSettlement')}
          </p>
        </div>
      )}

      {watchedAmount > 0 && watchedAmount < billingRecord.balanceAmount && (
        <div role="alert" className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-600">
            {t('paymentForm.infoPartialPayment', { balance: getNewBalance().toFixed(2) })}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          disabled={isSubmitting}
        >
          {t('paymentForm.cancel')}
        </Button>
        <Button 
          type="submit" 
          disabled={loading || !isValidPayment || isSubmitting}
        >
          {loading ? t('paymentForm.processing') : t('paymentForm.addPayment')}
        </Button>
      </div>
    </form>
  );
};