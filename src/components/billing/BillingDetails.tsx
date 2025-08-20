import React, { useState } from 'react';
import { User, FileText, CreditCard, Building, Phone, Mail, MapPin, Printer, Download } from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Modal from '../ui/Modal';
import { PaymentForm } from './PaymentForm';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface BillingRecord {
  _id: string;
  patient: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    address?: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
    };
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
  clinic: {
    _id: string;
    name: string;
    address?: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
    };
    phone?: string;
    email?: string;
  };
  dentist: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  invoiceNumber: string;
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
  paidAmount: number;
  balanceAmount: number;
  paymentMethod?: string;
  paymentStatus: 'pending' | 'partial' | 'paid' | 'overdue';
  paymentHistory?: Array<{
    amount: number;
    method: string;
    date: string;
    reference?: string;
  }>;
  insuranceInfo?: {
    provider: string;
    policyNumber: string;
    coverageAmount: number;
  };
  dueDate: string;
  paidDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface BillingDetailsProps {
  billingRecord: BillingRecord;
  onClose: () => void;
  onRefresh: () => void;
}

export const BillingDetails: React.FC<BillingDetailsProps> = ({
  billingRecord,
  onClose,
  onRefresh
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      partial: 'bg-blue-100 text-blue-800',
      paid: 'bg-green-100 text-green-800',
      overdue: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || colors.pending;
  };

  const isOverdue = (dueDate: string, paymentStatus: string) => {
    return new Date(dueDate) < new Date() && paymentStatus !== 'paid';
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // In a real application, this would generate and download a PDF
    toast.success(t('billingDetails.pdfDownloadInfo'));
  };

  const handleAddPayment = () => {
    setIsPaymentModalOpen(true);
  };

  const handlePaymentAdded = () => {
    setIsPaymentModalOpen(false);
    onRefresh();
  };

  const canManageBilling = user?.role === 'dentist' || user?.role === 'admin' || user?.role === 'staff';

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Header */}
      <div className="flex justify-between items-start print:block">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 print:text-xl">
            {t('billingDetails.invoiceTitle', { invoiceNumber: billingRecord.invoiceNumber })}
          </h2>
          <div className="flex items-center gap-2 mt-2">
            <Badge className={getStatusColor(billingRecord.paymentStatus)}>
              {t(`billingDetails.paymentStatus.${billingRecord.paymentStatus}`)}
            </Badge>
            {isOverdue(billingRecord.dueDate, billingRecord.paymentStatus) && (
              <Badge className="bg-red-100 text-red-800">
                {t('billingDetails.overdue')}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex gap-2 print:hidden">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-1" />
            {t('billingDetails.print')}
          </Button>
          <Button variant="outline" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-1" />
            {t('billingDetails.downloadPDF')}
          </Button>
          {canManageBilling && billingRecord.balanceAmount > 0 && (
            <Button onClick={handleAddPayment}>
              <CreditCard className="h-4 w-4 mr-1" />
              {t('billingDetails.addPayment')}
            </Button>
          )}
        </div>
      </div>

      {/* Invoice Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:gap-4">
        {/* Clinic Information */}
        <Card className="p-4 print:shadow-none print:border">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
            <Building className="h-5 w-5 mr-2" />
            {t('billingDetails.fromClinic', { clinicName: billingRecord.clinic.name })}
          </h3>
          <div className="space-y-2 text-sm text-gray-600">
            {billingRecord.clinic.address && (
              <div className="flex items-start">
                <MapPin className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <p>{billingRecord.clinic.address.street}</p>
                  <p>
                    {billingRecord.clinic.address.city}, {billingRecord.clinic.address.state} {billingRecord.clinic.address.zipCode}
                  </p>
                </div>
              </div>
            )}
            {billingRecord.clinic.phone && (
              <div className="flex items-center">
                <Phone className="h-4 w-4 mr-2" />
                {billingRecord.clinic.phone}
              </div>
            )}
            {billingRecord.clinic.email && (
              <div className="flex items-center">
                <Mail className="h-4 w-4 mr-2" />
                {billingRecord.clinic.email}
              </div>
            )}
          </div>
        </Card>

        {/* Patient Information */}
        <Card className="p-4 print:shadow-none print:border">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
            <User className="h-5 w-5 mr-2" />
            {t('billingDetails.billTo', { patientName: `${billingRecord.patient.firstName} ${billingRecord.patient.lastName}` })}
          </h3>
          <div className="space-y-2 text-sm text-gray-600">
            {billingRecord.patient.address && (
              <div className="flex items-start">
                <MapPin className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <p>{billingRecord.patient.address.street}</p>
                  <p>
                    {billingRecord.patient.address.city}, {billingRecord.patient.address.state} {billingRecord.patient.address.zipCode}
                  </p>
                </div>
              </div>
            )}
            {billingRecord.patient.phone && (
              <div className="flex items-center">
                <Phone className="h-4 w-4 mr-2" />
                {billingRecord.patient.phone}
              </div>
            )}
            <div className="flex items-center">
              <Mail className="h-4 w-4 mr-2" />
              {billingRecord.patient.email}
            </div>
          </div>
        </Card>
      </div>

      {/* Invoice Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:gap-4">
        <Card className="p-4 print:shadow-none print:border">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('billingDetails.invoiceDetailsTitle')}</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">{t('billingDetails.invoiceDate')}:</span>
              <span className="font-medium">{format(new Date(billingRecord.createdAt), 'MMM dd, yyyy')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">{t('billingDetails.dueDate')}:</span>
              <span className="font-medium">{format(new Date(billingRecord.dueDate), 'MMM dd, yyyy')}</span>
            </div>
            {billingRecord.paidDate && (
              <div className="flex justify-between">
                <span className="text-gray-600">{t('billingDetails.paidDate')}:</span>
                <span className="font-medium">{format(new Date(billingRecord.paidDate), 'MMM dd, yyyy')}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">{t('billingDetails.provider')}:</span>
              <span className="font-medium">{t('billingDetails.dentistName', { firstName: billingRecord.dentist.firstName, lastName: billingRecord.dentist.lastName })}</span>
            </div>
            {billingRecord.appointment && (
              <div className="flex justify-between">
                <span className="text-gray-600">{t('billingDetails.appointment')}:</span>
                <span className="font-medium">
                  {billingRecord.appointment.type} - {format(new Date(billingRecord.appointment.date), 'MMM dd, yyyy')}
                </span>
              </div>
            )}
            {billingRecord.treatmentRecord && (
              <div className="flex justify-between">
                <span className="text-gray-600">{t('billingDetails.treatment')}:</span>
                <span className="font-medium">{billingRecord.treatmentRecord.treatment}</span>
              </div>
            )}
          </div>
        </Card>

        {/* Insurance Information */}
        {billingRecord.insuranceInfo && (
          <Card className="p-4 print:shadow-none print:border">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('billingDetails.insuranceInfoTitle')}</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">{t('billingDetails.insuranceProvider')}:</span>
                <span className="font-medium">{billingRecord.insuranceInfo.provider}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{t('billingDetails.policyNumber')}:</span>
                <span className="font-medium">{billingRecord.insuranceInfo.policyNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{t('billingDetails.coverageAmount')}:</span>
                <span className="font-medium">${billingRecord.insuranceInfo.coverageAmount.toFixed(2)}</span>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Items Table */}
      <Card className="p-4 print:shadow-none print:border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('billingDetails.invoiceItemsTitle')}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 font-medium text-gray-900">{t('billingDetails.itemDescription')}</th>
                <th className="text-center py-2 font-medium text-gray-900">{t('billingDetails.itemQuantity')}</th>
                <th className="text-right py-2 font-medium text-gray-900">{t('billingDetails.itemUnitPrice')}</th>
                <th className="text-right py-2 font-medium text-gray-900">{t('billingDetails.itemTotal')}</th>
              </tr>
            </thead>
            <tbody>
              {billingRecord.items.map((item, index) => (
                <tr key={index} className="border-b border-gray-100">
                  <td className="py-3 text-gray-900">{item.description}</td>
                  <td className="py-3 text-center text-gray-600">{item.quantity}</td>
                  <td className="py-3 text-right text-gray-600">${item.unitPrice.toFixed(2)}</td>
                  <td className="py-3 text-right font-medium text-gray-900">${item.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Totals */}
      <Card className="p-4 print:shadow-none print:border">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">{t('billingDetails.subtotal')}:</span>
            <span className="font-medium">${billingRecord.subtotal.toFixed(2)}</span>
          </div>
          {billingRecord.discountAmount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">{t('billingDetails.discount')}:</span>
              <span className="font-medium text-green-600">-${billingRecord.discountAmount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">{t('billingDetails.tax')}:</span>
            <span className="font-medium">${billingRecord.taxAmount.toFixed(2)}</span>
          </div>
          <div className="border-t border-gray-200 pt-2">
            <div className="flex justify-between text-lg font-semibold">
              <span className="text-gray-900">{t('billingDetails.totalAmount')}:</span>
              <span className="text-gray-900">${billingRecord.totalAmount.toFixed(2)}</span>
            </div>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">{t('billingDetails.paidAmount')}:</span>
            <span className="font-medium text-green-600">${billingRecord.paidAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-lg font-semibold">
            <span className={billingRecord.balanceAmount > 0 ? 'text-red-600' : 'text-green-600'}>
              {t('billingDetails.balanceDue')}:
            </span>
            <span className={billingRecord.balanceAmount > 0 ? 'text-red-600' : 'text-green-600'}>
              ${billingRecord.balanceAmount.toFixed(2)}
            </span>
          </div>
        </div>
      </Card>

      {/* Payment History */}
      {billingRecord.paymentHistory && billingRecord.paymentHistory.length > 0 && (
        <Card className="p-4 print:shadow-none print:border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('billingDetails.paymentHistoryTitle')}</h3>
          <div className="space-y-3">
            {billingRecord.paymentHistory.map((payment, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">${payment.amount.toFixed(2)}</p>
                  <p className="text-sm text-gray-600">
                    {payment.method} • {format(new Date(payment.date), 'MMM dd, yyyy')}
                  </p>
                  {payment.reference && (
                    <p className="text-xs text-gray-500">{t('billingDetails.paymentReference', { reference: payment.reference })}</p>
                  )}
                </div>
                <Badge className="bg-green-100 text-green-800">{t('billingDetails.paymentStatus.paid')}</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Notes */}
      {billingRecord.notes && (
        <Card className="p-4 print:shadow-none print:border">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            {t('billingDetails.notesTitle')}
          </h3>
          <p className="text-sm text-gray-600 whitespace-pre-wrap">{billingRecord.notes}</p>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 print:hidden">
        <Button variant="outline" onClick={onClose}>
          {t('common.close')}
        </Button>
      </div>

      {/* Payment Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title={t('billingDetails.addPayment')}
        size="lg"
      >
        <PaymentForm
          billingRecord={billingRecord}
          onSave={handlePaymentAdded}
          onCancel={() => setIsPaymentModalOpen(false)}
        />
      </Modal>
    </div>
  );
};