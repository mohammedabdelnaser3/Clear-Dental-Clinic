import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';

interface Filters {
  startDate: string;
  endDate: string;
  clinicId: string;
  patientName: string;
  status: string;
  sortBy: 'date' | 'createdAt' | 'status';
  sortOrder: 'asc' | 'desc';
}

interface AppointmentFilterPanelProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  isAdmin?: boolean; // For future use (admin-specific filters)
}

interface Clinic {
  _id: string;
  name: string;
}

const AppointmentFilterPanel: React.FC<AppointmentFilterPanelProps> = ({
  filters,
  onFiltersChange
}) => {
  const { t } = useTranslation();
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [localFilters, setLocalFilters] = useState<Filters>(filters);

  useEffect(() => {
    fetchClinics();
  }, []);

  const fetchClinics = async () => {
    try {
      const response = await api.get('/clinics', {
        params: { page: 1, limit: 100 }
      });
      if (response.data.success) {
        setClinics(response.data.data.clinics || response.data.data);
      }
    } catch (error) {
      console.error('Error fetching clinics:', error);
    }
  };

  const handleChange = (field: keyof Filters, value: string) => {
    setLocalFilters(prev => ({ ...prev, [field]: value }));
  };

  const applyFilters = () => {
    onFiltersChange(localFilters);
  };

  const resetFilters = () => {
    const defaultFilters: Filters = {
      startDate: '',
      endDate: '',
      clinicId: '',
      patientName: '',
      status: '',
      sortBy: 'date',
      sortOrder: 'asc'
    };
    setLocalFilters(defaultFilters);
    onFiltersChange(defaultFilters);
  };

  return (
    <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Date Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('appointmentFilter.startDate')}
          </label>
          <input
            type="date"
            value={localFilters.startDate}
            onChange={(e) => handleChange('startDate', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('appointmentFilter.endDate')}
          </label>
          <input
            type="date"
            value={localFilters.endDate}
            onChange={(e) => handleChange('endDate', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Clinic Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('appointmentFilter.clinic')}
          </label>
          <select
            value={localFilters.clinicId}
            onChange={(e) => handleChange('clinicId', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">{t('appointmentFilter.allClinics')}</option>
            {clinics.map(clinic => (
              <option key={clinic._id} value={clinic._id}>
                {clinic.name}
              </option>
            ))}
          </select>
        </div>

        {/* Patient Name Search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('appointmentFilter.patientName')}
          </label>
          <input
            type="text"
            placeholder={t('appointmentFilter.searchPlaceholder')}
            value={localFilters.patientName}
            onChange={(e) => handleChange('patientName', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('appointmentFilter.status')}
          </label>
          <select
            value={localFilters.status}
            onChange={(e) => handleChange('status', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">{t('appointmentFilter.allStatuses')}</option>
            <option value="scheduled">{t('appointments.scheduled')}</option>
            <option value="confirmed">{t('appointments.confirmed')}</option>
            <option value="in-progress">{t('appointments.inProgress')}</option>
            <option value="completed">{t('appointments.completed')}</option>
            <option value="cancelled">{t('appointments.cancelled')}</option>
            <option value="no-show">{t('appointments.noshow')}</option>
          </select>
        </div>

        {/* Sort Options */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('appointmentFilter.sortBy')}
          </label>
          <div className="flex gap-2">
            <select
              value={localFilters.sortBy}
              onChange={(e) => handleChange('sortBy', e.target.value as any)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="date">{t('appointmentFilter.sortOptions.date')}</option>
              <option value="createdAt">{t('appointmentFilter.sortOptions.createdAt')}</option>
              <option value="status">{t('appointmentFilter.sortOptions.status')}</option>
            </select>
            <select
              value={localFilters.sortOrder}
              onChange={(e) => handleChange('sortOrder', e.target.value as any)}
              className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="asc">{t('appointmentFilter.sortOrder.asc')}</option>
              <option value="desc">{t('appointmentFilter.sortOrder.desc')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 mt-4">
        <button
          onClick={resetFilters}
          className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <X className="w-4 h-4 inline mr-1" />
          {t('appointmentFilter.reset')}
        </button>
        <button
          onClick={applyFilters}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {t('appointmentFilter.applyFilters')}
        </button>
      </div>
    </div>
  );
};

export default AppointmentFilterPanel;

