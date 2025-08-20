import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { User, Pill, FileText, RefreshCw, Plus } from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Textarea from '../ui/Textarea';
import Modal from '../ui/Modal';
import { useAuth } from '../../hooks/useAuth';
import { prescriptionService } from '../../services/prescriptionService';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

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

interface PrescriptionDetailsProps {
  prescription: Prescription;
  onClose: () => void;
  onRefresh: () => void;
}

export const PrescriptionDetails: React.FC<PrescriptionDetailsProps> = ({
  prescription,
  onClose,
  onRefresh
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [isRefillModalOpen, setIsRefillModalOpen] = useState(false);
  const [refillNotes, setRefillNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const isExpired = new Date(prescription.expiryDate) < new Date();
  const canRefill = prescription.refills.length < prescription.maxRefills && !isExpired && prescription.status === 'active';
  const canManageRefills = user?.role === 'dentist' || user?.role === 'admin';

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      completed: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || colors.active;
  };

  const handleAddRefill = async () => {
    try {
      setLoading(true);
      await prescriptionService.addRefill(prescription._id, {
        notes: refillNotes || undefined
      });
      toast.success(t('prescriptionDetails.toasts.refillSuccess'));
      setIsRefillModalOpen(false);
      setRefillNotes('');
      onRefresh();
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('prescriptionDetails.toasts.refillError'));
      console.error('Error adding refill:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              {t('prescriptionDetails.title', { id: prescription._id.slice(-8) })}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={getStatusColor(prescription.status)}>
                {t(`prescriptionDetails.status.${prescription.status}`)}
              </Badge>
              {isExpired && (
                <Badge className="bg-red-100 text-red-800">
                  {t('prescriptionDetails.expired')}
                </Badge>
              )}
            </div>
          </div>
          {canManageRefills && canRefill && (
            <Button
              onClick={() => setIsRefillModalOpen(true)}
              className="flex items-center gap-2"
              size="sm"
            >
              <Plus className="h-4 w-4" />
              {t('prescriptionDetails.addRefill')}
            </Button>
          )}
        </div>

        {/* Patient Information */}
        <Card className="p-4">
          <h4 className="text-lg font-medium text-gray-900 mb-3 flex items-center gap-2">
            <User className="h-5 w-5" />
            {t('prescriptionDetails.patientInfo')}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">{t('prescriptionDetails.name')}</p>
              <p className="font-medium">
                {prescription.patient.firstName} {prescription.patient.lastName}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">{t('prescriptionDetails.email')}</p>
              <p className="font-medium">{prescription.patient.email}</p>
            </div>
          </div>
        </Card>

        {/* Prescription Information */}
        <Card className="p-4">
          <h4 className="text-lg font-medium text-gray-900 mb-3 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t('prescriptionDetails.prescriptionInfo')}
          </h4>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">{t('prescriptionDetails.diagnosis')}</p>
              <p className="text-gray-900">{prescription.diagnosis}</p>
            </div>
            
            {prescription.notes && (
              <div>
                <p className="text-sm text-gray-600 mb-1">{t('prescriptionDetails.notes')}</p>
                <p className="text-gray-900">{prescription.notes}</p>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">{t('prescriptionDetails.issuedDate')}</p>
                <p className="font-medium">
                  {format(new Date(prescription.issuedDate), 'MMM dd, yyyy')}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">{t('prescriptionDetails.expiryDate')}</p>
                <p className="font-medium">
                  {format(new Date(prescription.expiryDate), 'MMM dd, yyyy')}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">{t('prescriptionDetails.maxRefills')}</p>
                <p className="font-medium">{prescription.maxRefills}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Medications */}
        <Card className="p-4">
          <h4 className="text-lg font-medium text-gray-900 mb-3 flex items-center gap-2">
            <Pill className="h-5 w-5" />
            {t('prescriptionDetails.medications')}
          </h4>
          <div className="space-y-4">
            {prescription.medications.map((med, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h5 className="font-medium text-gray-900">{med.medication.name}</h5>
                    {med.medication.genericName && (
                      <p className="text-sm text-gray-600">
                        {t('prescriptionDetails.genericName', { name: med.medication.genericName })}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                  <div>
                    <p className="text-sm text-gray-600">{t('prescriptionDetails.dosage')}</p>
                    <p className="font-medium">{med.dosage}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">{t('prescriptionDetails.frequency')}</p>
                    <p className="font-medium">{med.frequency}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">{t('prescriptionDetails.duration')}</p>
                    <p className="font-medium">{med.duration}</p>
                  </div>
                </div>
                
                {med.instructions && (
                  <div className="mt-3">
                    <p className="text-sm text-gray-600">{t('prescriptionDetails.instructions')}</p>
                    <p className="text-gray-900">{med.instructions}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Refill History */}
        <Card className="p-4">
          <h4 className="text-lg font-medium text-gray-900 mb-3 flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            {t('prescriptionDetails.refillHistory', { count: prescription.refills.length, max: prescription.maxRefills })}
          </h4>
          
          {prescription.refills.length > 0 ? (
            <div className="space-y-3">
              {prescription.refills.map((refill, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">
                        {t('prescriptionDetails.refillTitle', { number: refill.refillNumber })}
                      </p>
                      <p className="text-sm text-gray-600">
                        {format(new Date(refill.date), 'MMM dd, yyyy HH:mm')}
                      </p>
                    </div>
                  </div>
                  {refill.notes && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600">{t('prescriptionDetails.notes')}</p>
                      <p className="text-sm text-gray-900">{refill.notes}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 text-center py-4">
              {t('prescriptionDetails.noRefills')}
            </p>
          )}
        </Card>

        {/* Provider Information */}
        <Card className="p-4">
          <h4 className="text-lg font-medium text-gray-900 mb-3">{t('prescriptionDetails.providerInfo')}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">{t('prescriptionDetails.prescribingDentist')}</p>
              <p className="font-medium">
                {t('prescriptionDetails.dentistPrefix')} {prescription.dentist.firstName} {prescription.dentist.lastName}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">{t('prescriptionDetails.clinic')}</p>
              <p className="font-medium">{prescription.clinic.name}</p>
            </div>
            {prescription.appointment && (
              <div className="md:col-span-2">
                <p className="text-sm text-gray-600">{t('prescriptionDetails.relatedAppointment')}</p>
                <p className="font-medium">
                  {format(new Date(prescription.appointment.date), 'MMM dd, yyyy')}
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Actions */}
        <div className="flex justify-end">
          <Button onClick={onClose} variant="outline">
            {t('prescriptionDetails.close')}
          </Button>
        </div>
      </div>

      {/* Add Refill Modal */}
      <Modal
        isOpen={isRefillModalOpen}
        onClose={() => {
          setIsRefillModalOpen(false);
          setRefillNotes('');
        }}
        title={t('prescriptionDetails.modal.title')}
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-2">
              {t('prescriptionDetails.modal.addingRefill', { count: prescription.refills.length + 1, max: prescription.maxRefills })}
            </p>
            <p className="text-sm text-gray-800">
              {t('prescriptionDetails.modal.patient', { name: `${prescription.patient.firstName} ${prescription.patient.lastName}` })}
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('prescriptionDetails.modal.notesLabel')}
            </label>
            <Textarea
              value={refillNotes}
              onChange={(e) => setRefillNotes(e.target.value)}
              placeholder={t('prescriptionDetails.modal.notesPlaceholder')}
              rows={3}
            />
          </div>
          
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setIsRefillModalOpen(false);
                setRefillNotes('');
              }}
              disabled={loading}
            >
              {t('prescriptionDetails.modal.cancel')}
            </Button>
            <Button
              onClick={handleAddRefill}
              isLoading={loading}
              disabled={loading}
            >
              {t('prescriptionDetails.modal.submit')}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};