import React, { useState, useEffect } from 'react';
import { Search, Plus, Eye, Edit, Trash2, DollarSign, Calendar, User, CreditCard } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select  from '../ui/Select';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Modal from '../ui/Modal';
import { BillingForm } from './BillingForm';
import { BillingDetails } from './BillingDetails';
import { PaymentForm } from './PaymentForm';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { billingService } from '../../services/billingService';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface BillingRecord {
  _id: string;
  patient: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
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

interface BillingListProps {
  patientId?: string;
}

export const BillingList: React.FC<BillingListProps> = ({ patientId }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [billingRecords, setBillingRecords] = useState<BillingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<BillingRecord | null>(null);
  const [viewingRecord, setViewingRecord] = useState<BillingRecord | null>(null);
  const [paymentRecord, setPaymentRecord] = useState<BillingRecord | null>(null);

  const statusOptions = [
    { value: 'all', label: t('billingList.allStatus') },
    { value: 'pending', label: t('billingList.pending') },
    { value: 'partial', label: t('billingList.partial') },
    { value: 'paid', label: t('billingList.paid') },
    { value: 'overdue', label: t('billingList.overdue') }
  ];

  const fetchBillingRecords = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 10,
        search: searchTerm,
        paymentStatus: statusFilter !== 'all' ? statusFilter : undefined,
        patient: patientId
      };
      
      let response;
      if (patientId) {
        response = await billingService.getBillingByPatient(patientId, params);
      } else {
        response = await billingService.getBillingRecords(params);
      }
      
      // Handle response data with fallbacks
      const billingRecordsData = response.data?.billingRecords || response.data || [];
      const totalPagesData = response.data?.totalPages || response.data?.pagination?.pages || 1;
      
      // Ensure billingRecordsData is an array
      setBillingRecords(Array.isArray(billingRecordsData) ? billingRecordsData : []);
      setTotalPages(typeof totalPagesData === 'number' ? totalPagesData : 1);
    } catch (_error) {
      toast.error(t('billingList.fetchError'));
      console.error('Error fetching billing records:', _error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingRecords();
  }, [currentPage, searchTerm, statusFilter, patientId]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const handleAddRecord = () => {
    setEditingRecord(null);
    setIsFormModalOpen(true);
  };

  const handleEditRecord = (record: BillingRecord) => {
    setEditingRecord(record);
    setIsFormModalOpen(true);
  };

  const handleViewRecord = (record: BillingRecord) => {
    setViewingRecord(record);
    setIsDetailsModalOpen(true);
  };

  const handleAddPayment = (record: BillingRecord) => {
    setPaymentRecord(record);
    setIsPaymentModalOpen(true);
  };

  const handleDeleteRecord = async (recordId: string) => {
    if (!window.confirm(t('billingList.deleteConfirmation'))) {
      return;
    }

    try {
      await billingService.deleteBillingRecord(recordId);
      toast.success(t('billingList.deleteSuccess'));
      fetchBillingRecords();
    } catch (_error) {
      toast.error(t('billingList.deleteError'));
      console.error('Error deleting billing record:', _error);
    }
  };

  const handleRecordSaved = () => {
    setIsFormModalOpen(false);
    setEditingRecord(null);
    fetchBillingRecords();
  };

  const handlePaymentAdded = () => {
    setIsPaymentModalOpen(false);
    setPaymentRecord(null);
    fetchBillingRecords();
  };

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

  const canManageBilling = user?.role === 'dentist' || user?.role === 'admin' || user?.role === 'staff';

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">
          {patientId ? t('billingList.patientBilling') : t('billingList.title')}
        </h2>
        {canManageBilling && (
          <Button onClick={handleAddRecord} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            {t('billingList.newInvoice')}
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder={t('billingList.searchPlaceholder')}
              value={searchTerm}
              onChange={handleSearch}
              className="pl-10"
            />
          </div>
        </div>
        <div className="sm:w-48">
          <Select
            value={statusFilter}
            onChange={(e) => handleStatusFilter(e.target.value)}
            options={statusOptions}
          />
        </div>
      </div>

      {/* Billing Records List */}
      <div className="space-y-4">
        {billingRecords.map((record) => (
          <Card key={record._id} className="p-6 hover:shadow-lg transition-shadow">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {t('billingList.invoice')} #{record.invoiceNumber}
                    </h3>
                    <Badge className={getStatusColor(record.paymentStatus)}>
                      {t(`billingList.${record.paymentStatus}`)}
                    </Badge>
                    {isOverdue(record.dueDate, record.paymentStatus) && (
                      <Badge className="bg-red-100 text-red-800">
                        {t('billingList.overdue')}
                      </Badge>
                    )}
                  </div>
                  {!patientId && (
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <User className="h-4 w-4" />
                      {record.patient.firstName} {record.patient.lastName}
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    {t('billingList.dueDateLabel')}: {format(new Date(record.dueDate), 'MMM dd, yyyy')}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewRecord(record)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  {canManageBilling && (
                    <>
                      {record.balanceAmount > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddPayment(record)}
                          className="text-green-600 hover:text-green-700"
                        >
                          <CreditCard className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditRecord(record)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteRecord(record._id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Amount Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">{t('billingList.totalAmount')}</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {t('common.currency')}{record.totalAmount.toFixed(2)}
                  </p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600">{t('billingList.paidAmount')}</p>
                  <p className="text-lg font-semibold text-green-600">
                    {t('common.currency')}{record.paidAmount.toFixed(2)}
                  </p>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <p className="text-sm text-gray-600">{t('billingList.balance')}</p>
                  <p className="text-lg font-semibold text-red-600">
                    {t('common.currency')}{record.balanceAmount.toFixed(2)}
                  </p>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">{t('billingList.items')}</p>
                  <p className="text-lg font-semibold text-blue-600">
                    {record.items.length}
                  </p>
                </div>
              </div>

              {/* Items Preview */}
              <div>
                <p className="text-sm text-gray-600 mb-2">{t('billingList.items')}:</p>
                <div className="space-y-1">
                  {record.items.slice(0, 3).map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-gray-800">
                        {item.description} (x{item.quantity})
                      </span>
                      <span className="font-medium">{t('common.currency')}{item.total.toFixed(2)}</span>
                    </div>
                  ))}
                  {record.items.length > 3 && (
                    <p className="text-sm text-gray-500">
                      +{record.items.length - 3} {t('billingList.moreItems')}
                    </p>
                  )}
                </div>
              </div>

              {/* Additional Info */}
              <div className="flex justify-between items-center text-sm text-gray-600">
                <div className="flex items-center gap-4">
                  <span>{t('prescriptions.doctor', { firstName: record.dentist.firstName, lastName: record.dentist.lastName })}</span>
                  <span>{t('common.separator')}</span>
                  <span>{record.clinic.name}</span>
                  {record.paymentMethod && (
                    <>
                      <span>{t('common.separator')}</span>
                      <span>{record.paymentMethod}</span>
                    </>
                  )}
                </div>
                {record.paidDate && (
                  <span>{t('billingList.paidOn')}: {format(new Date(record.paidDate), 'MMM dd, yyyy')}</span>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {billingRecords.length === 0 && (
        <div className="text-center py-12">
          <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">{t('billingList.noRecordsFound')}</h3>
          <p className="text-gray-600 mb-4">
            {patientId 
              ? t('billingList.noPatientRecords')
              : t('billingList.noFilteredRecords')}
          </p>
          {canManageBilling && (
            <Button onClick={handleAddRecord}>
              {t('billingList.createFirstInvoice')}
            </Button>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            {t('billingList.previous')}
          </Button>
          <span className="text-sm text-gray-600">
            {t('billingList.page')} {currentPage} / {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            {t('billingList.next')}
          </Button>
        </div>
      )}

      {/* Form Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingRecord(null);
        }}
        title={editingRecord ? t('billingList.editInvoice') : t('billingList.newInvoice')}
        size="lg"
      >
        <BillingForm
          billingRecord={editingRecord}
          patientId={patientId}
          onSave={handleRecordSaved}
          onCancel={() => {
            setIsFormModalOpen(false);
            setEditingRecord(null);
          }}
        />
      </Modal>

      {/* Details Modal */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setViewingRecord(null);
        }}
        title={t('billingList.invoiceDetails')}
        size="lg"
      >
        {viewingRecord && (
          <BillingDetails
            billingRecord={viewingRecord}
            onClose={() => {
              setIsDetailsModalOpen(false);
              setViewingRecord(null);
            }}
            onRefresh={fetchBillingRecords}
          />
        )}
      </Modal>

      {/* Payment Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setPaymentRecord(null);
        }}
        title={t('billingList.addPayment')}
      >
        {paymentRecord && (
          <PaymentForm
            billingRecord={paymentRecord}
            onSave={handlePaymentAdded}
            onCancel={() => {
              setIsPaymentModalOpen(false);
              setPaymentRecord(null);
            }}
          />
        )}
      </Modal>
    </div>
  );
};