import React, { useState, useEffect } from 'react';
import { Search, Plus, Eye, Edit, Trash2, Calendar, User, Pill } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Modal from '../ui/Modal';
import { PrescriptionForm } from './PrescriptionForm';
import { PrescriptionDetails } from './PrescriptionDetails';
import { useAuth } from '../../hooks/useAuth';
import { prescriptionService } from '../../services/prescriptionService';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';

interface Prescription {
  _id: string;
  patient: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  dentist: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  clinic: {
    _id: string;
    name: string;
  };
  appointment?: {
    _id: string;
    date: string;
  };
  medications: Array<{
    medication: {
      _id: string;
      name: string;
      genericName?: string;
    };
    dosage: string;
    frequency: string;
    duration: string;
    instructions?: string;
  }>;
  diagnosis: string;
  notes?: string;
  status: 'active' | 'completed' | 'cancelled';
  issuedDate: string;
  expiryDate: string;
  refills: Array<{
    date: string;
    refillNumber: number;
    notes?: string;
  }>;
  maxRefills: number;
  createdAt: string;
  updatedAt: string;
}

interface PrescriptionListProps {
  patientId?: string;
}

export const PrescriptionList: React.FC<PrescriptionListProps> = ({ patientId }) => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [editingPrescription, setEditingPrescription] = useState<Prescription | null>(null);
  const [viewingPrescription, setViewingPrescription] = useState<Prescription | null>(null);

  const statusOptions = [
    { value: 'all', label: t('prescriptionList.filters.allStatus') },
    { value: 'active', label: t('prescriptionList.filters.active') },
    { value: 'completed', label: t('prescriptionList.filters.completed') },
    { value: 'cancelled', label: t('prescriptionList.filters.cancelled') }
  ];

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 10,
        search: searchTerm,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        patient: patientId
      };
      
      let response;
      
      // Use role-based endpoint selection
      if (user?.role === 'patient') {
        // Patients use the my-prescriptions endpoint
        response = await prescriptionService.getMyPrescriptions(params);
      } else if (patientId) {
        // Staff/dentists can view specific patient prescriptions
        response = await prescriptionService.getPrescriptionsByPatient(patientId, params);
      } else {
        // Staff/dentists view all prescriptions (filtered by their role)
        response = await prescriptionService.getPrescriptions(params);
      }
      
      // Ensure prescriptions is always an array
      const prescriptionsData = response?.data?.prescriptions || response?.data?.data || [];
      const totalPagesData = response?.data?.totalPages || response?.data?.pagination?.pages || 1;
      
      setPrescriptions(Array.isArray(prescriptionsData) ? prescriptionsData : []);
      setTotalPages(typeof totalPagesData === 'number' ? totalPagesData : 1);
    } catch (_error) {
      toast.error(t('prescriptionList.messages.fetchError'));
      console.error('Error fetching prescriptions:', _error);
      // Set empty array on error to prevent undefined access
      setPrescriptions([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrescriptions();
  }, [currentPage, searchTerm, statusFilter, patientId]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const handleAddPrescription = () => {
    setEditingPrescription(null);
    setIsFormModalOpen(true);
  };

  const handleEditPrescription = (prescription: Prescription) => {
    setEditingPrescription(prescription);
    setIsFormModalOpen(true);
  };

  const handleViewPrescription = (prescription: Prescription) => {
    setViewingPrescription(prescription);
    setIsDetailsModalOpen(true);
  };

  const handleDeletePrescription = async (prescriptionId: string) => {
    if (!window.confirm(t('prescriptionList.messages.deleteConfirmation'))) {
      return;
    }

    try {
      await prescriptionService.deletePrescription(prescriptionId);
      toast.success(t('prescriptionList.messages.deleteSuccess'));
      fetchPrescriptions();
    } catch (_error) {
      toast.error(t('prescriptionList.messages.deleteError'));
      console.error('Error deleting prescription:', _error);
    }
  };

  const handlePrescriptionSaved = () => {
    setIsFormModalOpen(false);
    setEditingPrescription(null);
    fetchPrescriptions();
  };

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      completed: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || colors.active;
  };

  const isExpired = (expiryDate: string) => {
    return new Date(expiryDate) < new Date();
  };

  const canManagePrescriptions = user?.role === 'dentist' || user?.role === 'admin';
  // const canViewAll = user?.role === 'dentist' || user?.role === 'admin' || user?.role === 'staff'; // Commented out as not currently used

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
          {patientId ? t('prescriptionList.header.patientPrescriptions') : t('prescriptionList.header.title')}
        </h2>
        {canManagePrescriptions && (
          <Button onClick={handleAddPrescription} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            {t('prescriptionList.actions.newPrescription')}
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
              placeholder={t('prescriptionList.search.placeholder')}
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

      {/* Prescriptions List */}
      <div className="space-y-4">
        {prescriptions.map((prescription) => (
          <Card key={prescription._id} className="p-6 hover:shadow-lg transition-shadow">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {t('prescriptionList.card.prescriptionNumber', { id: prescription._id.slice(-8) })}
                    </h3>
                    <Badge className={getStatusColor(prescription.status)}>
                      {t(`prescriptionList.status.${prescription.status}`)}
                    </Badge>
                    {isExpired(prescription.expiryDate) && (
                      <Badge className="bg-red-100 text-red-800">
                        {t('prescriptionList.status.expired')}
                      </Badge>
                    )}
                  </div>
                  {!patientId && (
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <User className="h-4 w-4" />
                      {prescription.patient.firstName} {prescription.patient.lastName}
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    {t('prescriptions.issued', { date: format(new Date(prescription.issuedDate), 'MMM dd, yyyy', { locale: i18n.language === 'ar' ? require('date-fns/locale/ar') : undefined }) })}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewPrescription(prescription)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  {canManagePrescriptions && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditPrescription(prescription)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeletePrescription(prescription._id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Diagnosis */}
              <div>
                <p className="text-sm text-gray-600 mb-1">{t('prescriptionList.card.diagnosis')}</p>
                <p className="text-sm text-gray-800">{prescription.diagnosis}</p>
              </div>

              {/* Medications */}
              <div>
                <p className="text-sm text-gray-600 mb-2">{t('prescriptionList.card.medications')}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {prescription.medications.map((med, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Pill className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-sm">{med.medication.name}</span>
                      </div>
                      <div className="space-y-1 text-xs text-gray-600">
                        <div>{t('prescriptions.dosage', { dosage: med.dosage })}</div>
                        <div>{t('prescriptions.frequency', { frequency: med.frequency })}</div>
                        <div>{t('prescriptions.duration', { duration: med.duration })}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Additional Info */}
              <div className="flex justify-between items-center text-sm text-gray-600">
                <div className="flex items-center gap-4">
                  <span>{t('prescriptionList.card.doctor', { firstName: prescription.dentist.firstName, lastName: prescription.dentist.lastName })}</span>
                  <span>{t('common.separator')}</span>
                  <span>{prescription.clinic.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span>{t('prescriptionList.card.refills', { current: prescription.refills.length, max: prescription.maxRefills })}</span>
                  <span>{t('common.separator')}</span>
                  <span>{t('prescriptionList.card.expires', { date: format(new Date(prescription.expiryDate), 'MMM dd, yyyy', { locale: i18n.language === 'ar' ? require('date-fns/locale/ar') : undefined }) })}</span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {prescriptions.length === 0 && (
        <div className="text-center py-12">
          <Pill className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">{t('prescriptionList.emptyState.noPrescriptionsFound')}</h3>
          <p className="text-gray-600 mb-4">
            {patientId 
              ? t('prescriptionList.emptyState.noPatientPrescriptions')
              : t('prescriptionList.emptyState.noFilteredPrescriptions')}
          </p>
          {canManagePrescriptions && (
            <Button onClick={handleAddPrescription}>
              {t('prescriptionList.emptyState.createFirstPrescription')}
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
            {t('prescriptionList.pagination.previous')}
          </Button>
          <span className="text-sm text-gray-600">
            {t('prescriptionList.pagination.pageOf', { currentPage, totalPages })}
          </span>
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            {t('prescriptionList.pagination.next')}
          </Button>
        </div>
      )}

      {/* Form Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingPrescription(null);
        }}
        title={editingPrescription ? t('prescriptionList.modal.editPrescription') : t('prescriptionList.modal.newPrescription')}
        size="lg"
      >
        <PrescriptionForm
          prescription={editingPrescription}
          patientId={patientId || ''}
          onSave={handlePrescriptionSaved}
          onCancel={() => {
            setIsFormModalOpen(false);
            setEditingPrescription(null);
          }}
        />
      </Modal>

      {/* Details Modal */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setViewingPrescription(null);
        }}
        title={t('prescriptionList.modal.prescriptionDetails')}
        size="lg"
      >
        {viewingPrescription && (
          <PrescriptionDetails
            prescription={viewingPrescription}
            onClose={() => {
              setIsDetailsModalOpen(false);
              setViewingPrescription(null);
            }}
            onRefresh={fetchPrescriptions}
          />
        )}
      </Modal>
    </div>
  );
};