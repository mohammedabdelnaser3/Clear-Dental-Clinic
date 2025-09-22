import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Card, Button, Input, Select, Badge } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';
import { prescriptionService } from '../../services/prescriptionService';
import { patientService } from '../../services/patientService';

// Patient Prescriptions Interfaces
interface PatientPrescription {
  _id: string;
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
    type: string;
  };
  medications: Array<{
    medication: {
      _id: string;
      name: string;
      category: string;
    };
    dosage: string;
    frequency: string;
    duration: string;
    instructions?: string;
  }>;
  diagnosis?: string;
  notes?: string;
  status: 'active' | 'completed' | 'cancelled' | 'expired';
  prescribedDate: string;
  expiryDate: string;
  maxRefills: number;
  currentRefills: number;
  refillHistory: Array<{
    date: string;
    dispensedBy?: string;
    notes?: string;
  }>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PrescriptionStats {
  totalPrescriptions: number;
  activePrescriptions: number;
  expiredPrescriptions: number;
  pendingRefills: number;
}

const Prescriptions: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [prescriptions, setPrescriptions] = useState<PatientPrescription[]>([]);
  const [filteredPrescriptions, setFilteredPrescriptions] = useState<PatientPrescription[]>([]);
  const [prescriptionStats, setPrescriptionStats] = useState<PrescriptionStats>({
    totalPrescriptions: 0,
    activePrescriptions: 0,
    expiredPrescriptions: 0,
    pendingRefills: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('date_desc');
  const [selectedPrescription, setSelectedPrescription] = useState<PatientPrescription | null>(null);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [patientId, setPatientId] = useState<string | null>(null);

  // Fetch patient's prescriptions
  const fetchPatientPrescriptions = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      setError(null);

      // Get patient record linked to user
      try {
        const patientsResponse = await patientService.getPatientsByUserId(user.id, { page: 1, limit: 1 });
        if (patientsResponse.data && patientsResponse.data.length > 0) {
          const currentPatientId = patientsResponse.data[0].id;
          setPatientId(currentPatientId);

          // Fetch prescriptions for this patient
          const prescriptionsResponse = await prescriptionService.getPrescriptionsByPatient(currentPatientId, {
            limit: 100
          });

          let prescriptionsData = [];
          if (prescriptionsResponse?.data?.prescriptions) {
            prescriptionsData = prescriptionsResponse.data.prescriptions;
          } else if (prescriptionsResponse?.data?.data) {
            prescriptionsData = prescriptionsResponse.data.data;
          } else if (Array.isArray(prescriptionsResponse?.data)) {
            prescriptionsData = prescriptionsResponse.data;
          }

          setPrescriptions(prescriptionsData);

          // Calculate stats
          const stats = {
            totalPrescriptions: prescriptionsData.length,
            activePrescriptions: prescriptionsData.filter((p: PatientPrescription) => 
              p.status === 'active' && new Date(p.expiryDate) > new Date()
            ).length,
            expiredPrescriptions: prescriptionsData.filter((p: PatientPrescription) => 
              p.status === 'expired' || new Date(p.expiryDate) <= new Date()
            ).length,
            pendingRefills: prescriptionsData.filter((p: PatientPrescription) => 
              p.status === 'active' && p.currentRefills < p.maxRefills
            ).length
          };
          setPrescriptionStats(stats);
        } else {
          // If no patient record found, set empty state but don't show error
          setPrescriptions([]);
          setPrescriptionStats({
            totalPrescriptions: 0,
            activePrescriptions: 0,
            expiredPrescriptions: 0,
            pendingRefills: 0
          });
        }
      } catch (patientError) {
        console.warn('No patient record found for user');
        // Set empty state for no patient record
        setPrescriptions([]);
        setPrescriptionStats({
          totalPrescriptions: 0,
          activePrescriptions: 0,
          expiredPrescriptions: 0,
          pendingRefills: 0
        });
      }

    } catch (err) {
      console.error('Error fetching prescriptions:', err);
      setError(t('prescriptions.errorLoading') || 'Failed to load prescriptions');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, t]);

  useEffect(() => {
    fetchPatientPrescriptions();
  }, [fetchPatientPrescriptions]);

  // Filter and sort prescriptions
  useEffect(() => {
    let filtered = [...prescriptions];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(prescription =>
        prescription.medications.some(med => 
          med.medication.name.toLowerCase().includes(searchTerm.toLowerCase())
        ) ||
        prescription.diagnosis?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prescription.dentist.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prescription.dentist.lastName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'expired') {
        filtered = filtered.filter(p => 
          p.status === 'expired' || new Date(p.expiryDate) <= new Date()
        );
      } else {
        filtered = filtered.filter(p => p.status === statusFilter);
      }
    }

    // Apply sorting
    switch (sortBy) {
      case 'date_desc':
        filtered.sort((a, b) => new Date(b.prescribedDate).getTime() - new Date(a.prescribedDate).getTime());
        break;
      case 'date_asc':
        filtered.sort((a, b) => new Date(a.prescribedDate).getTime() - new Date(b.prescribedDate).getTime());
        break;
      case 'medication_name':
        filtered.sort((a, b) => {
          const aName = a.medications[0]?.medication.name || '';
          const bName = b.medications[0]?.medication.name || '';
          return aName.localeCompare(bName);
        });
        break;
      case 'dentist_name':
        filtered.sort((a, b) => 
          `${a.dentist.firstName} ${a.dentist.lastName}`.localeCompare(
            `${b.dentist.firstName} ${b.dentist.lastName}`
          )
        );
        break;
      default:
        break;
    }

    setFilteredPrescriptions(filtered);
  }, [prescriptions, searchTerm, statusFilter, sortBy]);

  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(i18n.language, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }, [i18n.language]);

  const getStatusBadge = useCallback((prescription: PatientPrescription) => {
    const isExpired = new Date(prescription.expiryDate) <= new Date();
    
    if (isExpired || prescription.status === 'expired') {
      return <Badge variant="gray" size="sm">{t('prescriptions.expired')}</Badge>;
    }
    
    switch (prescription.status) {
      case 'active':
        return <Badge variant="success" size="sm">{t('prescriptions.active')}</Badge>;
      case 'completed':
        return <Badge variant="primary" size="sm">{t('prescriptions.completed')}</Badge>;
      case 'cancelled':
        return <Badge variant="danger" size="sm">{t('prescriptions.cancelled')}</Badge>;
      default:
        return <Badge variant="gray" size="sm">{prescription.status}</Badge>;
    }
  }, [t]);

  const getMedicationSummary = (medications: PatientPrescription['medications']) => {
    if (medications.length === 1) {
      return medications[0].medication.name;
    }
    return `${medications[0].medication.name} + ${medications.length - 1} ${t('prescriptions.moreMedications')}`;
  };

  const handleViewPrescription = (prescription: PatientPrescription) => {
    setSelectedPrescription(prescription);
    setShowPrescriptionModal(true);
  };

  const handlePrintPrescription = (prescription: PatientPrescription) => {
    // Create a printable version of the prescription
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const printContent = `
        <html>
          <head>
            <title>${t('prescriptions.prescription')} - ${prescription._id}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
              .info-section { margin-bottom: 20px; }
              .medications { margin-top: 20px; }
              .medication-item { margin-bottom: 10px; padding: 10px; border: 1px solid #ddd; }
              .footer { margin-top: 30px; font-size: 12px; color: #666; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>${t('prescriptions.prescription')}</h1>
              <p>ID: ${prescription._id}</p>
            </div>
            
            <div class="info-section">
              <h3>${t('prescriptions.patientInfo')}</h3>
              <p><strong>${t('prescriptions.patient')}:</strong> ${user?.firstName} ${user?.lastName}</p>
              <p><strong>${t('prescriptions.prescribedBy')}:</strong> Dr. ${prescription.dentist.firstName} ${prescription.dentist.lastName}</p>
              <p><strong>${t('prescriptions.clinic')}:</strong> ${prescription.clinic.name}</p>
              <p><strong>${t('prescriptions.prescribedDate')}:</strong> ${formatDate(prescription.prescribedDate)}</p>
              <p><strong>${t('prescriptions.expiryDate')}:</strong> ${formatDate(prescription.expiryDate)}</p>
            </div>

            ${prescription.diagnosis ? `
              <div class="info-section">
                <h3>${t('prescriptions.diagnosis')}</h3>
                <p>${prescription.diagnosis}</p>
              </div>
            ` : ''}

            <div class="medications">
              <h3>${t('prescriptions.medications')}</h3>
              ${prescription.medications.map(med => `
                <div class="medication-item">
                  <h4>${med.medication.name}</h4>
                  <p><strong>${t('prescriptions.dosage')}:</strong> ${med.dosage}</p>
                  <p><strong>${t('prescriptions.frequency')}:</strong> ${med.frequency}</p>
                  <p><strong>${t('prescriptions.duration')}:</strong> ${med.duration}</p>
                  ${med.instructions ? `<p><strong>${t('prescriptions.instructions')}:</strong> ${med.instructions}</p>` : ''}
                </div>
              `).join('')}
            </div>

            ${prescription.notes ? `
              <div class="info-section">
                <h3>${t('prescriptions.notes')}</h3>
                <p>${prescription.notes}</p>
              </div>
            ` : ''}

            <div class="footer">
              <p>${t('prescriptions.printDisclaimer')}</p>
              <p>${t('prescriptions.printDate')}: ${new Date().toLocaleDateString()}</p>
            </div>
          </body>
        </html>
      `;
      
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleDownloadPrescription = (prescription: PatientPrescription) => {
    // Create downloadable text/JSON version
    const prescriptionData = {
      id: prescription._id,
      patient: `${user?.firstName} ${user?.lastName}`,
      doctor: `Dr. ${prescription.dentist.firstName} ${prescription.dentist.lastName}`,
      clinic: prescription.clinic.name,
      prescribedDate: prescription.prescribedDate,
      expiryDate: prescription.expiryDate,
      diagnosis: prescription.diagnosis,
      medications: prescription.medications.map(med => ({
        name: med.medication.name,
        dosage: med.dosage,
        frequency: med.frequency,
        duration: med.duration,
        instructions: med.instructions
      })),
      notes: prescription.notes,
      refills: `${prescription.currentRefills}/${prescription.maxRefills}`
    };

    const dataStr = JSON.stringify(prescriptionData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `prescription_${prescription._id}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="container mx-auto px-4 py-8">
          {/* Loading Skeleton */}
          <div className="animate-pulse space-y-6">
            <div className="flex justify-between items-center">
              <div className="space-y-2">
                <div className="h-8 bg-gray-300 rounded w-64"></div>
                <div className="h-4 bg-gray-300 rounded w-96"></div>
              </div>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow-lg p-6">
                  <div className="h-6 bg-gray-300 rounded w-24 mb-2"></div>
                  <div className="h-8 bg-gray-300 rounded w-16"></div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex space-x-4 mb-6">
                <div className="h-10 bg-gray-300 rounded flex-1"></div>
                <div className="h-10 bg-gray-300 rounded w-32"></div>
                <div className="h-10 bg-gray-300 rounded w-32"></div>
              </div>
              
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="space-y-2 flex-1">
                        <div className="h-5 bg-gray-300 rounded w-48"></div>
                        <div className="h-4 bg-gray-300 rounded w-32"></div>
                      </div>
                      <div className="h-6 bg-gray-300 rounded w-16"></div>
                    </div>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="h-4 bg-gray-300 rounded"></div>
                      <div className="h-4 bg-gray-300 rounded"></div>
                      <div className="h-4 bg-gray-300 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t('prescriptions.title')}
          </h1>
          <p className="text-gray-600 text-lg">
            {t('prescriptions.patientSubtitle')}
        </p>
      </div>
      
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 text-red-700">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg hover:shadow-xl transition-shadow duration-200 border-0">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-blue-100">{t('prescriptions.totalPrescriptions')}</p>
                  <p className="text-2xl font-bold">{prescriptionStats.totalPrescriptions}</p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg hover:shadow-xl transition-shadow duration-200 border-0">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-green-100">{t('prescriptions.activePrescriptions')}</p>
                  <p className="text-2xl font-bold">{prescriptionStats.activePrescriptions}</p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg hover:shadow-xl transition-shadow duration-200 border-0">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-red-100">{t('prescriptions.expiredPrescriptions')}</p>
                  <p className="text-2xl font-bold">{prescriptionStats.expiredPrescriptions}</p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg hover:shadow-xl transition-shadow duration-200 border-0">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-purple-100">{t('prescriptions.pendingRefills')}</p>
                  <p className="text-2xl font-bold">{prescriptionStats.pendingRefills}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-8 shadow-lg border-0 bg-gradient-to-r from-gray-50 to-blue-50">
          <div className="p-6">
            <div className="flex flex-col md:flex-row gap-4 md:items-center">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder={t('prescriptions.searchPlaceholder') || 'Search medications, diagnosis, or doctor...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                  leftIcon={
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  }
                />
              </div>

              <div className="flex gap-3">
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-32"
                  options={[
                    { value: 'all', label: t('prescriptions.allStatuses') || 'All Statuses' },
                    { value: 'active', label: t('prescriptions.active') || 'Active' },
                    { value: 'completed', label: t('prescriptions.completed') || 'Completed' },
                    { value: 'expired', label: t('prescriptions.expired') || 'Expired' },
                    { value: 'cancelled', label: t('prescriptions.cancelled') || 'Cancelled' }
                  ]}
                />

                <Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-36"
                  options={[
                    { value: 'date_desc', label: t('prescriptions.sortByNewest') || 'Newest First' },
                    { value: 'date_asc', label: t('prescriptions.sortByOldest') || 'Oldest First' },
                    { value: 'medication_name', label: t('prescriptions.sortByMedication') || 'By Medication' },
                    { value: 'dentist_name', label: t('prescriptions.sortByDoctor') || 'By Doctor' }
                  ]}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Prescriptions List */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <div className="p-6">
            {filteredPrescriptions.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {searchTerm || statusFilter !== 'all' 
                    ? t('prescriptions.noMatchingPrescriptions')
                    : t('prescriptions.noPrescriptions')
                  }
                </h3>
                <p className="text-gray-600 mb-6">
                  {searchTerm || statusFilter !== 'all'
                    ? t('prescriptions.adjustFilters')
                    : t('prescriptions.noPrescriptionsDescription')
                  }
                </p>
                {(!searchTerm && statusFilter === 'all') && (
                  <Link to="/appointments/create">
                    <Button variant="primary">
                      {t('prescriptions.bookAppointment')}
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPrescriptions.map((prescription) => (
                  <div key={prescription._id} 
                       className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-all duration-200 hover:border-blue-200">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-4">
                      <div className="flex-1 mb-4 lg:mb-0">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                              {getMedicationSummary(prescription.medications)}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {t('prescriptions.prescribedBy')} Dr. {prescription.dentist.firstName} {prescription.dentist.lastName}
                            </p>
                            <p className="text-sm text-gray-600">
                              📍 {prescription.clinic.name}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            {getStatusBadge(prescription)}
                          </div>
                        </div>

                        <div className="grid md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-gray-700">{t('prescriptions.prescribedDate')}:</span>
                            <br />
                            <span className="text-gray-600">{formatDate(prescription.prescribedDate)}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">{t('prescriptions.expiryDate')}:</span>
                            <br />
                            <span className="text-gray-600">{formatDate(prescription.expiryDate)}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">{t('prescriptions.refills')}:</span>
                            <br />
                            <span className="text-gray-600">
                              {prescription.currentRefills} / {prescription.maxRefills}
                            </span>
                          </div>
                        </div>

                        {prescription.diagnosis && (
                          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                            <span className="font-medium text-gray-700">{t('prescriptions.diagnosis')}:</span>
                            <p className="text-gray-600 mt-1">{prescription.diagnosis}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2 lg:ml-6">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewPrescription(prescription)}
                          className="text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          {t('prescriptions.view')}
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePrintPrescription(prescription)}
                          className="text-green-600 border-green-200 hover:bg-green-50"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                          </svg>
                          {t('prescriptions.print')}
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadPrescription(prescription)}
                          className="text-purple-600 border-purple-200 hover:bg-purple-50"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          {t('prescriptions.download')}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Prescription Details Modal */}
        {showPrescriptionModal && selectedPrescription && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto w-full">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {t('prescriptions.prescriptionDetails')}
                  </h2>
                  <button
                    onClick={() => setShowPrescriptionModal(false)}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Prescription Info */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">{t('prescriptions.prescriptionInfo')}</h3>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">{t('prescriptions.prescriptionId')}:</span>
                        <p className="text-gray-900 font-mono">{selectedPrescription._id}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">{t('prescriptions.status')}:</span>
                        <div className="mt-1">{getStatusBadge(selectedPrescription)}</div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">{t('prescriptions.prescribedDate')}:</span>
                        <p className="text-gray-900">{formatDate(selectedPrescription.prescribedDate)}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">{t('prescriptions.expiryDate')}:</span>
                        <p className="text-gray-900">{formatDate(selectedPrescription.expiryDate)}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">{t('prescriptions.prescribedBy')}:</span>
                        <p className="text-gray-900">Dr. {selectedPrescription.dentist.firstName} {selectedPrescription.dentist.lastName}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">{t('prescriptions.clinic')}:</span>
                        <p className="text-gray-900">{selectedPrescription.clinic.name}</p>
                      </div>
                    </div>
                  </div>

                  {/* Diagnosis */}
                  {selectedPrescription.diagnosis && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">{t('prescriptions.diagnosis')}</h3>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-gray-700">{selectedPrescription.diagnosis}</p>
                      </div>
                    </div>
                  )}

                  {/* Medications */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">{t('prescriptions.medications')}</h3>
                    <div className="space-y-4">
                      {selectedPrescription.medications.map((med, index) => (
                        <div key={index} className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <h4 className="font-semibold text-gray-900 mb-2">{med.medication.name}</h4>
                          <div className="grid md:grid-cols-2 gap-3 text-sm">
                            <div>
                              <span className="font-medium text-gray-700">{t('prescriptions.dosage')}:</span>
                              <p className="text-gray-900">{med.dosage}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">{t('prescriptions.frequency')}:</span>
                              <p className="text-gray-900">{med.frequency}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">{t('prescriptions.duration')}:</span>
                              <p className="text-gray-900">{med.duration}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">{t('prescriptions.category')}:</span>
                              <p className="text-gray-900">{med.medication.category}</p>
                            </div>
                          </div>
                          {med.instructions && (
                            <div className="mt-3">
                              <span className="font-medium text-gray-700">{t('prescriptions.instructions')}:</span>
                              <p className="text-gray-900 mt-1">{med.instructions}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Refill Information */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">{t('prescriptions.refillInformation')}</h3>
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">{t('prescriptions.maxRefills')}:</span>
                          <p className="text-gray-900">{selectedPrescription.maxRefills}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">{t('prescriptions.currentRefills')}:</span>
                          <p className="text-gray-900">{selectedPrescription.currentRefills}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">{t('prescriptions.refillsRemaining')}:</span>
                          <p className="text-gray-900">{selectedPrescription.maxRefills - selectedPrescription.currentRefills}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  {selectedPrescription.notes && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">{t('prescriptions.notes')}</h3>
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p className="text-gray-700">{selectedPrescription.notes}</p>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-3 pt-6 border-t">
                    <Button
                      variant="outline"
                      onClick={() => handlePrintPrescription(selectedPrescription)}
                    >
                      {t('prescriptions.print')}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleDownloadPrescription(selectedPrescription)}
                    >
                      {t('prescriptions.download')}
                    </Button>
                    <Button
                      variant="primary"
                      onClick={() => setShowPrescriptionModal(false)}
                    >
                      {t('prescriptions.close')}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Prescriptions;
