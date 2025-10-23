import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Plus, Eye, Calendar, User, Clock, CheckCircle, AlertCircle, Edit } from 'lucide-react';
import { Button, Input, Select, Card, Badge, Modal } from '../ui';
import { useAuth } from '../../hooks/useAuth';
import { treatmentService, type TreatmentRecord } from '../../services/treatmentService';
import { TreatmentForm } from './TreatmentForm';
import toast from 'react-hot-toast';
import { format as formatDate } from 'date-fns';

interface SimpleTreatmentListProps {
  patientId?: string;
  showPatientColumn?: boolean;
}

export const SimpleTreatmentList: React.FC<SimpleTreatmentListProps> = ({ 
  patientId, 
  showPatientColumn = true 
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [treatmentRecords, setTreatmentRecords] = useState<TreatmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showTreatmentForm, setShowTreatmentForm] = useState(false);
  const [selectedTreatment, setSelectedTreatment] = useState<TreatmentRecord | null>(null);
  const [showTreatmentDetails, setShowTreatmentDetails] = useState(false);

  const statusOptions = [
    { value: 'all', label: t('treatments.status.all') },
    { value: 'planned', label: t('treatments.status.planned') },
    { value: 'in_progress', label: t('treatments.status.inProgress') },
    { value: 'completed', label: t('treatments.status.completed') },
    { value: 'cancelled', label: t('treatments.status.cancelled') }
  ];

  const fetchTreatmentRecords = async () => {
    try {
      setLoading(true);
      const params = {
        page: 1,
        limit: 50,
        search: searchTerm,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        patient: patientId
      };
      
      const response = await treatmentService.getTreatmentRecords(params);
      
      if (response.success && response.data) {
        setTreatmentRecords(response.data.treatmentRecords || []);
      } else {
        setTreatmentRecords([]);
      }
    } catch (error) {
      toast.error(t('treatments.errors.fetchFailed'));
      console.error('Error fetching treatment records:', error);
      setTreatmentRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTreatmentRecords();
  }, [searchTerm, statusFilter, patientId]);

  const getStatusColor = (status: string) => {
    const colors = {
      planned: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || colors.planned;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'in_progress':
        return <Clock className="h-4 w-4" />;
      case 'cancelled':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  const canManageRecords = user?.role === 'dentist' || user?.role === 'admin' || user?.role === 'staff';

  const handleCreateTreatment = () => {
    setSelectedTreatment(null);
    setShowTreatmentForm(true);
  };

  const handleEditTreatment = (treatment: TreatmentRecord) => {
    setSelectedTreatment(treatment);
    setShowTreatmentForm(true);
  };

  const handleViewTreatment = (treatment: TreatmentRecord) => {
    setSelectedTreatment(treatment);
    setShowTreatmentDetails(true);
  };

  const handleTreatmentSaved = () => {
    setShowTreatmentForm(false);
    setSelectedTreatment(null);
    fetchTreatmentRecords();
  };

  const handleCloseTreatmentForm = () => {
    setShowTreatmentForm(false);
    setSelectedTreatment(null);
  };

  const handleCloseTreatmentDetails = () => {
    setShowTreatmentDetails(false);
    setSelectedTreatment(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">{t('treatments.loading')}</span>
      </div>
    );
  }

  return (
    <>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {patientId ? t('treatments.patientTreatments') : t('treatments.title')}
          </h2>
          <p className="text-gray-600">{t('treatments.subtitle')}</p>
        </div>
        {canManageRecords && (
          <Button onClick={handleCreateTreatment}>
            <Plus className="h-4 w-4 mr-2" />
            {t('treatments.addRecord')}
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder={t('treatments.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="sm:w-48">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={statusOptions}
            />
          </div>
        </div>
      </Card>

      {/* Treatment Records List */}
      <div className="space-y-4">
        {treatmentRecords.map((record) => (
          <Card key={record._id} className="p-6 hover:shadow-lg transition-shadow">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {record.treatment}
                    </h3>
                    <Badge className={getStatusColor(record.status)}>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(record.status)}
                        {t(`treatments.status.${record.status}`)}
                      </div>
                    </Badge>
                  </div>
                  {showPatientColumn && (
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <User className="h-4 w-4" />
                      {record.patient.firstName} {record.patient.lastName}
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    {formatDate(new Date(record.startDate), 'MMM dd, yyyy')}
                    {record.endDate && ` - ${formatDate(new Date(record.endDate), 'MMM dd, yyyy')}`}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewTreatment(record)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  {canManageRecords && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditTreatment(record)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">{t('treatments.diagnosis')}</p>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{record.diagnosis}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">{t('treatments.dentist')}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Dr. {record.dentist.firstName} {record.dentist.lastName}
                  </p>
                </div>
                {record.cost && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">{t('treatments.cost')}</p>
                    <p className="text-sm font-semibold text-green-600 mt-1">
                      {t('common.currency')}{record.cost.toFixed(2)}
                    </p>
                  </div>
                )}
              </div>

              {/* Notes Preview */}
              {record.notes && (
                <div className="border-t pt-4">
                  <p className="text-sm font-medium text-gray-700 mb-1">{t('treatments.notes')}</p>
                  <p className="text-sm text-gray-600 line-clamp-2">{record.notes}</p>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {treatmentRecords.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {t('treatments.noRecordsFound')}
          </h3>
          <p className="text-gray-600 mb-4">
            {patientId 
              ? t('treatments.noPatientRecords')
              : t('treatments.noFilteredRecords')
            }
          </p>
          {canManageRecords && (
            <Button onClick={handleCreateTreatment}>
              <Plus className="h-4 w-4 mr-2" />
              {t('treatments.createFirstRecord')}
            </Button>
          )}
        </div>
      )}
    </div>

    {/* Treatment Form Modal */}
    <Modal
      isOpen={showTreatmentForm}
      onClose={handleCloseTreatmentForm}
      title={selectedTreatment ? t('treatments.editRecord') : t('treatments.createRecord')}
      size="xl"
    >
      <TreatmentForm
        treatment={selectedTreatment}
        patientId={patientId}
        onSave={handleTreatmentSaved}
        onCancel={handleCloseTreatmentForm}
      />
    </Modal>

    {/* Treatment Details Modal */}
    <Modal
      isOpen={showTreatmentDetails}
      onClose={handleCloseTreatmentDetails}
      title={t('treatments.viewRecord')}
      size="lg"
    >
      {selectedTreatment && (
        <div className="space-y-6">
          {/* Treatment Header */}
          <div className="border-b pb-4">
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-xl font-semibold text-gray-900">
                {selectedTreatment.treatment}
              </h3>
              <Badge className={getStatusColor(selectedTreatment.status)}>
                <div className="flex items-center gap-1">
                  {getStatusIcon(selectedTreatment.status)}
                  {t(`treatments.status.${selectedTreatment.status}`)}
                </div>
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-400" />
                <span className="font-medium">{t('treatments.patient')}:</span>
                <span>{selectedTreatment.patient.firstName} {selectedTreatment.patient.lastName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="font-medium">{t('treatments.startDate')}:</span>
                <span>{formatDate(new Date(selectedTreatment.startDate), 'MMM dd, yyyy')}</span>
              </div>
            </div>
          </div>

          {/* Treatment Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">{t('treatments.procedure')}</h4>
              <p className="text-gray-600">{selectedTreatment.procedure}</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">{t('treatments.dentist')}</h4>
              <p className="text-gray-600">
                Dr. {selectedTreatment.dentist.firstName} {selectedTreatment.dentist.lastName}
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">{t('treatments.diagnosis')}</h4>
              <p className="text-gray-600">{selectedTreatment.diagnosis}</p>
            </div>
            {selectedTreatment.cost && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">{t('treatments.cost')}</h4>
                <p className="text-lg font-semibold text-green-600">
                  {t('common.currency')}{selectedTreatment.cost.toFixed(2)}
                </p>
              </div>
            )}
            {selectedTreatment.duration && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">{t('treatments.duration')}</h4>
                <p className="text-gray-600">{selectedTreatment.duration} {t('treatments.minutes')}</p>
              </div>
            )}
            {selectedTreatment.endDate && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">{t('treatments.endDate')}</h4>
                <p className="text-gray-600">{formatDate(new Date(selectedTreatment.endDate), 'MMM dd, yyyy')}</p>
              </div>
            )}
          </div>

          {/* Notes */}
          {selectedTreatment.notes && (
            <div className="border-t pt-4">
              <h4 className="font-semibold text-gray-900 mb-2">{t('treatments.notes')}</h4>
              <p className="text-gray-600 whitespace-pre-wrap">{selectedTreatment.notes}</p>
            </div>
          )}

          {/* Actions */}
          {canManageRecords && (
            <div className="border-t pt-4 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowTreatmentDetails(false);
                  handleEditTreatment(selectedTreatment);
                }}
              >
                <Edit className="h-4 w-4 mr-2" />
                {t('treatments.editRecord')}
              </Button>
            </div>
          )}
        </div>
      )}
    </Modal>
    </>
    );
}