import React from 'react';
import { useTranslation } from 'react-i18next';
import { MedicationList } from '../../components/medications/MedicationList';
import { useAuth } from '../../hooks/useAuth';

const Medications: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isPatient = user?.role === 'patient';

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          {isPatient ? t('medications.my_medications') : t('medications.medications')}
        </h1>
        <p className="text-gray-600 mt-2">
          {isPatient 
            ? t('medications.view_prescribed_medications')
            : t('medications.manage_medication_inventory')
          }
        </p>
      </div>
      
      <MedicationList />
    </div>
  );
};

export default Medications;