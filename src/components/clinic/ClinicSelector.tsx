import React from 'react';
import { useTranslation } from 'react-i18next';
import Badge from '../ui/Badge';
import Select from '../ui/Select';
import { useClinic } from '../../context';

interface ClinicSelectorProps {
  className?: string;
  onClinicSelected?: (newClinicId: string) => void;
  selectedClinicId?: string;
}

const ClinicSelector: React.FC<ClinicSelectorProps> = ({ className = '', onClinicSelected, selectedClinicId }) => {
  const { t } = useTranslation();
  const { clinics, selectedClinic, setSelectedClinicById, loading, error } = useClinic();

  const options = [
    { value: '', label: t('clinic.allClinics') || 'All Clinics' },
    ...clinics.map(c => ({ value: c.id, label: c.name }))
  ];

  const currentLabel = selectedClinic ? selectedClinic.name : (t('clinic.allClinics') || 'All Clinics');

  return (
    <div className={`flex items-center justify-between mb-4 ${className}`}>
      <div className="flex items-center gap-3">
        <h3 className="text-lg font-semibold text-gray-900">
          {t('clinic.selectClinic') || 'Select Clinic'}
        </h3>
        <Badge className="bg-gray-100 text-gray-800">
          {currentLabel}
        </Badge>
      </div>
      <div className="w-64">
        <Select
          label={t('clinic.clinic') || 'Clinic'}
          value={selectedClinic ? selectedClinic.id : ''}
          options={options}
          onChange={(e) => {
            const newClinicId = e.target.value;
            setSelectedClinicById(newClinicId);
            if (onClinicSelected) {
              onClinicSelected(newClinicId);
            }
          }}
          helperText={loading ? (t('clinic.loading') || 'Loading clinics...') : undefined}
          error={error || undefined}
        />
      </div>
    </div>
  );
};

export default ClinicSelector;