import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Plus, Edit, Trash2 } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Modal from '../ui/Modal';
import { MedicationForm } from './MedicationForm';
import { useAuth } from '../../hooks/useAuth';
import { medicationService } from '../../services/medicationService';
import { toast } from 'react-hot-toast';

interface Medication {
  _id: string;
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
  createdAt: string;
  updatedAt: string;
}

interface MedicationListProps {
  onSelectMedication?: (medication: Medication) => void;
  selectionMode?: boolean;
}

export const MedicationList: React.FC<MedicationListProps> = ({
  onSelectMedication,
  selectionMode = false
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null);

  const categories = [
    { value: 'all', label: t('medicationList.categories.all') },
    { value: 'antibiotic', label: t('medicationList.categories.antibiotic') },
    { value: 'painkiller', label: t('medicationList.categories.painkiller') },
    { value: 'anti-inflammatory', label: t('medicationList.categories.anti-inflammatory') },
    { value: 'anesthetic', label: t('medicationList.categories.anesthetic') },
    { value: 'antiseptic', label: t('medicationList.categories.antiseptic') },
    { value: 'other', label: t('medicationList.categories.other') }
  ];

  const fetchMedications = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 10,
        search: searchTerm,
        category: categoryFilter !== 'all' ? categoryFilter : undefined
      };
      
      let response;
      // If user is a patient, fetch only their prescribed medications
      if (user?.role === 'patient' && user?.id) {
        response = await medicationService.getPatientMedications(user.id, params);
      } else {
        response = await medicationService.getMedications(params);
      }
      
      // Ensure medications is always an array
      const medicationsData = response.data?.medications || response.data?.data || [];
      const totalPagesData = response.data?.totalPages || response.data?.pagination?.totalPages || 1;
      
      setMedications(Array.isArray(medicationsData) ? medicationsData : []);
      setTotalPages(totalPagesData);
    } catch (_error) {
      toast.error(t('medicationList.fetchError'));
      console.error('Error fetching medications:', _error);
      // Set empty array on error to prevent undefined access
      setMedications([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedications();
  }, [currentPage, searchTerm, categoryFilter, user?.id, user?.role]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleCategoryFilter = (category: string) => {
    setCategoryFilter(category);
    setCurrentPage(1);
  };

  const handleAddMedication = () => {
    setEditingMedication(null);
    setIsModalOpen(true);
  };

  const handleEditMedication = (medication: Medication) => {
    setEditingMedication(medication);
    setIsModalOpen(true);
  };

  const handleDeleteMedication = async (medicationId: string) => {
    if (!window.confirm(t('medicationList.deleteConfirmation'))) {
      return;
    }

    try {
      await medicationService.deleteMedication(medicationId);
      toast.success(t('medicationList.deleteSuccess'));
      fetchMedications();
    } catch (_error) {
      toast.error(t('medicationList.deleteError'));
      console.error('Error deleting medication:', _error);
    }
  };

  const handleMedicationSaved = () => {
    setIsModalOpen(false);
    setEditingMedication(null);
    fetchMedications();
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      antibiotic: 'bg-blue-100 text-blue-800',
      painkiller: 'bg-red-100 text-red-800',
      'anti-inflammatory': 'bg-orange-100 text-orange-800',
      anesthetic: 'bg-purple-100 text-purple-800',
      antiseptic: 'bg-green-100 text-green-800',
      other: 'bg-gray-100 text-gray-800'
    };
    return colors[category as keyof typeof colors] || colors.other;
  };

  const canManageMedications = user?.role === 'dentist' || user?.role === 'admin' || user?.role === 'super_admin';
  const isPatient = user?.role === 'patient';

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
          {selectionMode ? t('medicationList.selectTitle') : (isPatient ? t('medicationList.myTitle') : t('medicationList.title'))}
        </h2>
        {canManageMedications && !selectionMode && (
          <Button onClick={handleAddMedication} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            {t('medicationList.addMedication')}
          </Button>
        )}
      </div>

      {/* Filters */}
      {!isPatient && (
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder={t('medicationList.searchPlaceholder')}
                value={searchTerm}
                onChange={handleSearch}
                className="pl-10"
              />
            </div>
          </div>
          <div className="sm:w-48">
            <Select
              value={categoryFilter}
              onChange={(e) => handleCategoryFilter(e.target.value)}
              options={categories}
            />
          </div>
        </div>
      )}

      {/* Patient Info for Patient View */}
      {isPatient && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">{t('medicationList.patientInfoTitle')}</h3>
          <p className="text-blue-700 text-sm">
            {t('medicationList.patientInfoText')}
          </p>
        </div>
      )}

      {/* Medications Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {medications.length === 0 && !loading ? (
          <div className="col-span-full text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.78 0-2.678-2.153-1.415-3.414l5-5A2 2 0 009 11.172V5L8 4z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {isPatient ? t('medicationList.noMedicationsPrescribed') : t('medicationList.noMedicationsFound')}
            </h3>
            <p className="text-gray-500">
              {isPatient 
                ? t('medicationList.noMedicationsPrescribedInfo')
                : t('medicationList.noMedicationsMatchFilters')}
            </p>
          </div>
        ) : (
          medications.map((medication) => (
          <Card key={medication._id} className="p-6 hover:shadow-lg transition-shadow">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {medication.name}
                  </h3>
                  {medication.genericName && (
                    <p className="text-sm text-gray-600">
                      {t('medicationList.genericName', { name: medication.genericName })}
                    </p>
                  )}
                </div>
                <Badge className={getCategoryColor(medication.category)}>
                  {medication.category}
                </Badge>
              </div>

              {/* Dosage Info */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{t('medicationList.dosage')}:</span>
                  <span className="font-medium">{medication.dosage}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{t('medicationList.frequency')}:</span>
                  <span className="font-medium">{medication.frequency}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{t('medicationList.duration')}:</span>
                  <span className="font-medium">{medication.duration}</span>
                </div>
              </div>

              {/* Instructions */}
              {medication.instructions && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">{t('medicationList.instructions')}:</p>
                  <p className="text-sm text-gray-800">{medication.instructions}</p>
                </div>
              )}

              {/* Side Effects */}
              {medication.sideEffects && Array.isArray(medication.sideEffects) && medication.sideEffects.length > 0 && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">{t('medicationList.sideEffects')}:</p>
                  <div className="flex flex-wrap gap-1">
                    {medication.sideEffects.slice(0, 3).map((effect, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {effect}
                      </Badge>
                    ))}
                    {medication.sideEffects.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        {t('medicationList.moreItems', { count: medication.sideEffects.length - 3 })}
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-between items-center pt-4 border-t">
                {selectionMode ? (
                  <Button
                    onClick={() => onSelectMedication?.(medication)}
                    className="w-full"
                  >
                    {t('medicationList.select')}
                  </Button>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${
                        medication.isActive ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                      <span className="text-xs text-gray-600">
                        {medication.isActive ? t('medicationList.active') : t('medicationList.inactive')}
                      </span>
                    </div>
                    {canManageMedications && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditMedication(medication)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteMedication(medication._id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            {t('medicationList.previousPage')}
          </Button>
          <span className="text-sm text-gray-600">
            {t('medicationList.pageInfo', { currentPage, totalPages })}
          </span>
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            {t('medicationList.nextPage')}
          </Button>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingMedication(null);
        }}
        title={editingMedication ? t('medicationList.editMedication') : t('medicationList.addModalTitle')}
        size="lg"
      >
        <MedicationForm
          medication={editingMedication}
          onSave={handleMedicationSaved}
          onCancel={() => {
            setIsModalOpen(false);
            setEditingMedication(null);
          }}
        />
      </Modal>
    </div>
  );
};