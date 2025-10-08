import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Card, Button, Input, Select, Badge } from '../../components/ui';
import { AnalyticsWidget } from '../../components/dashboard';
import { useAuth } from '../../hooks/useAuth';
import { prescriptionService } from '../../services/prescriptionService';
import {
  FileText,
  Clock,
  RefreshCw,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Plus,
  Activity
} from 'lucide-react';

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
  const [refreshing, setRefreshing] = useState(false);
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
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Fetch patient's prescriptions
  const fetchPatientPrescriptions = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      setError(null);

      // Use the new endpoint for patients to get their own prescriptions
      const prescriptionsResponse = await prescriptionService.getMyPrescriptions({
        limit: 100
      });

      let prescriptionsData = [];
      if (prescriptionsResponse?.data?.prescriptions) {
        prescriptionsData = prescriptionsResponse.data.prescriptions;
      } else if (prescriptionsResponse?.data?.data?.prescriptions) {
        prescriptionsData = prescriptionsResponse.data.data.prescriptions;
      } else if (prescriptionsResponse?.data?.data) {
        prescriptionsData = prescriptionsResponse.data.data;
      } else if (Array.isArray(prescriptionsResponse?.data)) {
        prescriptionsData = prescriptionsResponse.data;
      }

      // Ensure prescriptionsData is always an array
      if (!Array.isArray(prescriptionsData)) {
        prescriptionsData = [];
      }

      setPrescriptions(prescriptionsData);

      // Calculate stats - ensure prescriptionsData is an array
      const prescriptionsArray = Array.isArray(prescriptionsData) ? prescriptionsData : [];
      const stats = {
        totalPrescriptions: prescriptionsArray.length || 0,
        activePrescriptions: prescriptionsArray.filter((p: PatientPrescription) => 
          p?.status === 'active' && p?.expiryDate && new Date(p.expiryDate) > new Date()
        ).length || 0,
        expiredPrescriptions: prescriptionsArray.filter((p: PatientPrescription) => 
          p?.status === 'expired' || (p?.expiryDate && new Date(p.expiryDate) <= new Date())
        ).length || 0,
        pendingRefills: prescriptionsArray.filter((p: PatientPrescription) => 
          p?.status === 'active' && typeof p?.currentRefills === 'number' && typeof p?.maxRefills === 'number' && p.currentRefills < p.maxRefills
        ).length || 0
      };
      setPrescriptionStats(stats);

    } catch (err) {
      console.error('Error fetching prescriptions:', err);
      setError(t('prescriptions.errors.loading'));
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, t]);

  useEffect(() => {
    fetchPatientPrescriptions();
  }, [fetchPatientPrescriptions]);

  // Filter and sort prescriptions
  useEffect(() => {
    let filtered = Array.isArray(prescriptions) ? [...prescriptions] : [];

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
      return <Badge variant="gray" size="sm">{t('prescriptions.status.expired')}</Badge>;
    }
    
    switch (prescription.status) {
      case 'active':
        return <Badge variant="success" size="sm">{t('prescriptions.status.active')}</Badge>;
      case 'completed':
        return <Badge variant="primary" size="sm">{t('prescriptions.status.completed')}</Badge>;
      case 'cancelled':
        return <Badge variant="danger" size="sm">{t('prescriptions.status.cancelled')}</Badge>;
      default:
        return <Badge variant="gray" size="sm">{prescription.status}</Badge>;
    }
  }, [t]);

  // Add refresh functionality - moved before any conditional returns
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPatientPrescriptions();
    setRefreshing(false);
  }, [fetchPatientPrescriptions]);

  // Calculate enhanced statistics - moved before any conditional returns
  const enhancedStats = useMemo(() => {
    // Ensure all stats are numbers
    const totalPrescriptions = Number(prescriptionStats.totalPrescriptions) || 0;
    const activePrescriptions = Number(prescriptionStats.activePrescriptions) || 0;
    const expiredPrescriptions = Number(prescriptionStats.expiredPrescriptions) || 0;
    const pendingRefills = Number(prescriptionStats.pendingRefills) || 0;
    
    const activePercentage = totalPrescriptions > 0 
      ? Math.round((activePrescriptions / totalPrescriptions) * 100) 
      : 0;
    
    const expiredPercentage = totalPrescriptions > 0 
      ? Math.round((expiredPrescriptions / totalPrescriptions) * 100) 
      : 0;

    return {
      activePercentage,
      expiredPercentage,
      refillsAvailable: pendingRefills,
      totalPrescriptions,
      activePrescriptions,
      expiredPrescriptions
    };
  }, [prescriptionStats]);

  const getMedicationSummary = (medications: PatientPrescription['medications']) => {
    if (medications.length === 1) {
      return medications[0].medication.name;
    }
    return `${medications[0].medication.name} + ${medications.length - 1} ${t('prescriptions.card.moreMedications')}`;
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
            <title>${t('prescriptions.print.title')} - ${prescription._id}</title>
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
              <h1>${t('prescriptions.print.title')}</h1>
              <p>ID: ${prescription._id}</p>
            </div>
            
            <div class="info-section">
              <h3>${t('prescriptions.print.patientInfo')}</h3>
              <p><strong>${t('prescriptions.print.patient')}:</strong> ${user?.firstName} ${user?.lastName}</p>
              <p><strong>${t('prescriptions.print.prescribedBy')}:</strong> Dr. ${prescription.dentist.firstName} ${prescription.dentist.lastName}</p>
              <p><strong>${t('prescriptions.print.clinic')}:</strong> ${prescription.clinic.name}</p>
              <p><strong>${t('prescriptions.print.prescribedDate')}:</strong> ${formatDate(prescription.prescribedDate)}</p>
              <p><strong>${t('prescriptions.print.expiryDate')}:</strong> ${formatDate(prescription.expiryDate)}</p>
            </div>

            ${prescription.diagnosis ? `
              <div class="info-section">
                <h3>${t('prescriptions.print.diagnosis')}</h3>
                <p>${prescription.diagnosis}</p>
              </div>
            ` : ''}

            <div class="medications">
              <h3>${t('prescriptions.print.medications')}</h3>
              ${prescription.medications.map(med => `
                <div class="medication-item">
                  <h4>${med.medication.name}</h4>
                  <p><strong>${t('prescriptions.print.dosage')}:</strong> ${med.dosage}</p>
                  <p><strong>${t('prescriptions.print.frequency')}:</strong> ${med.frequency}</p>
                  <p><strong>${t('prescriptions.print.duration')}:</strong> ${med.duration}</p>
                  ${med.instructions ? `<p><strong>${t('prescriptions.print.instructions')}:</strong> ${med.instructions}</p>` : ''}
                </div>
              `).join('')}
            </div>

            ${prescription.notes ? `
              <div class="info-section">
                <h3>${t('prescriptions.print.notes')}</h3>
                <p>${prescription.notes}</p>
              </div>
            ` : ''}

            <div class="footer">
              <p>${t('prescriptions.print.disclaimer')}</p>
              <p>${t('prescriptions.print.printDate')}: ${new Date().toLocaleDateString()}</p>
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 shadow-xl border-b border-blue-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0">
            {/* Left Section */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="p-3 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-600 rounded-xl shadow-lg">
                  <FileText className="w-8 h-8 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-white">
                  {t('prescriptions.header.title')}
                </h1>
                <p className="text-blue-100/80 text-sm lg:text-base">
                  {t('prescriptions.header.subtitle')}
                </p>
                <div className="flex items-center space-x-4 mt-2 text-xs text-blue-200/70">
                  <span className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span>{t('prescriptions.header.systemOnline')}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{t('prescriptions.header.lastUpdated', { time: new Date().toLocaleTimeString() })}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center space-x-3">
              <Button 
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? t('prescriptions.header.refreshing') : t('prescriptions.header.refresh')}
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30"
              >
                <Filter className="w-4 h-4 mr-2" />
                {t('prescriptions.header.filters')}
              </Button>
              
              <Link to="/appointments/create">
                <Button 
                  variant="primary" 
                  size="sm"
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {t('prescriptions.header.newAppointment')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
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

        {/* Enhanced Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <AnalyticsWidget
            title={t('prescriptions.stats.totalPrescriptions')}
            type="metric"
            data={[{ label: t('prescriptions.stats.total'), value: enhancedStats.totalPrescriptions }]}
            icon={<FileText className="w-5 h-5" />}
            gradient="from-blue-500 to-blue-600"
            height="h-32"
            showLegend={false}
          />
          <AnalyticsWidget
            title={t('prescriptions.stats.activePrescriptions')}
            type="metric"
            data={[{ label: t('prescriptions.stats.active'), value: enhancedStats.activePrescriptions }]}
            trend={{ value: enhancedStats.activePercentage, isPositive: true, period: t('prescriptions.stats.ofTotal') }}
            icon={<CheckCircle className="w-5 h-5" />}
            gradient="from-green-500 to-green-600"
            height="h-32"
            showLegend={false}
          />
          <AnalyticsWidget
            title={t('prescriptions.stats.expiredPrescriptions')}
            type="metric"
            data={[{ label: t('prescriptions.stats.expired'), value: enhancedStats.expiredPrescriptions }]}
            trend={{ value: enhancedStats.expiredPercentage, isPositive: false, period: t('prescriptions.stats.ofTotal') }}
            icon={<XCircle className="w-5 h-5" />}
            gradient="from-red-500 to-red-600"
            height="h-32"
            showLegend={false}
          />
          <AnalyticsWidget
            title={t('prescriptions.stats.pendingRefills')}
            type="metric"
            data={[{ label: t('prescriptions.stats.refills'), value: enhancedStats.refillsAvailable }]}
            icon={<Activity className="w-5 h-5" />}
            gradient="from-purple-500 to-purple-600"
            height="h-32"
            showLegend={false}
          />
        </div>

        {/* Enhanced Search and Filters */}
        <Card className="mb-8 shadow-lg border-0 bg-gradient-to-br from-white to-gray-50/50">
          <div className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg">
                  <Search className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{t('prescriptions.searchAndFilter.title')}</h3>
                  <p className="text-sm text-gray-600">{t('prescriptions.searchAndFilter.subtitle')}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="flex items-center space-x-2"
                >
                  <Filter className="w-4 h-4" />
                  <span>{t('prescriptions.searchAndFilter.advancedFilters')}</span>
                </Button>
              </div>
            </div>
            
            <div className="mt-6 space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      type="text"
                      placeholder={t('prescriptions.searchAndFilter.searchPlaceholder')}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-white border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-40 bg-white border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                    options={[
                      { value: 'all', label: t('prescriptions.status.all') },
                      { value: 'active', label: t('prescriptions.status.active') },
                      { value: 'completed', label: t('prescriptions.status.completed') },
                      { value: 'expired', label: t('prescriptions.status.expired') },
                      { value: 'cancelled', label: t('prescriptions.status.cancelled') }
                    ]}
                  />

                  <Select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-40 bg-white border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                    options={[
                      { value: 'date_desc', label: t('prescriptions.sort.newest') },
                      { value: 'date_asc', label: t('prescriptions.sort.oldest') },
                      { value: 'medication_name', label: t('prescriptions.sort.byMedication') },
                      { value: 'dentist_name', label: t('prescriptions.sort.byDoctor') }
                    ]}
                  />
                </div>
              </div>
              
              {/* Results Summary */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="text-sm text-gray-600">
                  {t('prescriptions.searchAndFilter.resultsCount', { count: filteredPrescriptions.length })}
                </div>
                <div className="text-xs text-gray-500">
                  {t('prescriptions.searchAndFilter.lastUpdated', { time: new Date().toLocaleTimeString() })}
                </div>
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
                    ? t('prescriptions.emptyState.noMatchingPrescriptions')
                    : t('prescriptions.emptyState.noPrescriptions')
                  }
                </h3>
                <p className="text-gray-600 mb-6">
                  {searchTerm || statusFilter !== 'all'
                    ? t('prescriptions.emptyState.adjustFilters')
                    : t('prescriptions.emptyState.noPrescriptionsDescription')
                  }
                </p>
                {(!searchTerm && statusFilter === 'all') && (
                  <Link to="/appointments/create">
                    <Button variant="primary">
                      {t('prescriptions.emptyState.bookAppointment')}
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
                              {t('prescriptions.card.prescribedBy', { 
                                firstName: prescription.dentist.firstName, 
                                lastName: prescription.dentist.lastName 
                              })}
                            </p>
                            <p className="text-sm text-gray-600">
                              📍 {t('prescriptions.card.clinic', { name: prescription.clinic.name })}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            {getStatusBadge(prescription)}
                          </div>
                        </div>

                        <div className="grid md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-gray-700">{t('prescriptions.card.prescribedDate')}:</span>
                            <br />
                            <span className="text-gray-600">{formatDate(prescription.prescribedDate)}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">{t('prescriptions.card.expiryDate')}:</span>
                            <br />
                            <span className="text-gray-600">{formatDate(prescription.expiryDate)}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">{t('prescriptions.card.refills')}:</span>
                            <br />
                            <span className="text-gray-600">
                              {t('prescriptions.card.refillsCount', { 
                                current: prescription.currentRefills, 
                                max: prescription.maxRefills 
                              })}
                            </span>
                          </div>
                        </div>

                        {prescription.diagnosis && (
                          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                            <span className="font-medium text-gray-700">{t('prescriptions.card.diagnosis')}:</span>
                            <p className="text-gray-600 mt-1">{prescription.diagnosis}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2 lg:ml-6">
                        <Button
                          key={`view-${prescription._id}`}
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewPrescription(prescription)}
                          className="text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          {t('prescriptions.actions.view')}
                        </Button>

                        <Button
                          key={`print-${prescription._id}`}
                          variant="outline"
                          size="sm"
                          onClick={() => handlePrintPrescription(prescription)}
                          className="text-green-600 border-green-200 hover:bg-green-50"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                          </svg>
                          {t('prescriptions.actions.print')}
                        </Button>

                        <Button
                          key={`download-${prescription._id}`}
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadPrescription(prescription)}
                          className="text-purple-600 border-purple-200 hover:bg-purple-50"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          {t('prescriptions.actions.download')}
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
                    {t('prescriptions.modal.title')}
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
                    <h3 className="font-semibold text-gray-900 mb-3">{t('prescriptions.modal.prescriptionInfo')}</h3>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">{t('prescriptions.modal.prescriptionId')}:</span>
                        <p className="text-gray-900 font-mono">{selectedPrescription._id}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">{t('prescriptions.modal.status')}:</span>
                        <div className="mt-1">{getStatusBadge(selectedPrescription)}</div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">{t('prescriptions.modal.prescribedDate')}:</span>
                        <p className="text-gray-900">{formatDate(selectedPrescription.prescribedDate)}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">{t('prescriptions.modal.expiryDate')}:</span>
                        <p className="text-gray-900">{formatDate(selectedPrescription.expiryDate)}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">{t('prescriptions.modal.prescribedBy')}:</span>
                        <p className="text-gray-900">{t('prescriptions.modal.doctorName', { 
                          firstName: selectedPrescription.dentist.firstName, 
                          lastName: selectedPrescription.dentist.lastName 
                        })}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">{t('prescriptions.modal.clinic')}:</span>
                        <p className="text-gray-900">{selectedPrescription.clinic.name}</p>
                      </div>
                    </div>
                  </div>

                  {/* Diagnosis */}
                  {selectedPrescription.diagnosis && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">{t('prescriptions.modal.diagnosis')}</h3>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-gray-700">{selectedPrescription.diagnosis}</p>
                      </div>
                    </div>
                  )}

                  {/* Medications */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">{t('prescriptions.modal.medications')}</h3>
                    <div className="space-y-4">
                      {selectedPrescription.medications.map((med, index) => (
                        <div key={index} className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <h4 className="font-semibold text-gray-900 mb-2">{med.medication.name}</h4>
                          <div className="grid md:grid-cols-2 gap-3 text-sm">
                            <div>
                              <span className="font-medium text-gray-700">{t('prescriptions.modal.dosage')}:</span>
                              <p className="text-gray-900">{med.dosage}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">{t('prescriptions.modal.frequency')}:</span>
                              <p className="text-gray-900">{med.frequency}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">{t('prescriptions.modal.duration')}:</span>
                              <p className="text-gray-900">{med.duration}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">{t('prescriptions.modal.category')}:</span>
                              <p className="text-gray-900">{med.medication.category}</p>
                            </div>
                          </div>
                          {med.instructions && (
                            <div className="mt-3">
                              <span className="font-medium text-gray-700">{t('prescriptions.modal.instructions')}:</span>
                              <p className="text-gray-900 mt-1">{med.instructions}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Refill Information */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">{t('prescriptions.modal.refillInformation')}</h3>
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">{t('prescriptions.modal.maxRefills')}:</span>
                          <p className="text-gray-900">{selectedPrescription.maxRefills}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">{t('prescriptions.modal.currentRefills')}:</span>
                          <p className="text-gray-900">{selectedPrescription.currentRefills}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">{t('prescriptions.modal.refillsRemaining')}:</span>
                          <p className="text-gray-900">{selectedPrescription.maxRefills - selectedPrescription.currentRefills}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  {selectedPrescription.notes && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">{t('prescriptions.modal.notes')}</h3>
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
                      {t('prescriptions.modal.print')}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleDownloadPrescription(selectedPrescription)}
                    >
                      {t('prescriptions.modal.download')}
                    </Button>
                    <Button
                      variant="primary"
                      onClick={() => setShowPrescriptionModal(false)}
                    >
                      {t('prescriptions.modal.close')}
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
