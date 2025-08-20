import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button, Input, Textarea, Select, Card, Alert } from '../../components/ui';
import { patientService } from '../../services';
import type { Patient as PatientType } from '../../types';

const PatientForm: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [newAllergy, setNewAllergy] = useState('');
  const [newCondition, setNewCondition] = useState('');
  
  // Form state
  const [formData, setFormData] = useState<PatientType>({
    id: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: new Date(),
    gender: 'male',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'US'
    },
    medicalHistory: {
      allergies: [],
      conditions: [],
      medications: [],
      notes: ''
    },
    treatmentRecords: [],
    preferredClinicId: '',
    isActive: true,
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    },
    createdAt: new Date(),
    updatedAt: new Date()
  });

  // Fetch patient data if in edit mode
  useEffect(() => {
    if (isEditMode) {
      setIsLoading(true);
      const fetchPatient = async () => {
        try {
          const data = await patientService.getPatientById(id!);
          setFormData(data);
        } catch (err: any) {
          setError(err.message || 'Failed to fetch patient data');
        } finally {
          setIsLoading(false);
        }
      };
      fetchPatient();
    }
  }, [id, isEditMode]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name.startsWith('emergencyContact.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        emergencyContact: {
          ...prev.emergencyContact!,
          [field]: value
        }
      }));
    } else if (name.startsWith('address.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [field]: value
        }
      }));
    } else if (name === 'medicalHistory.notes') {
      setFormData(prev => ({
        ...prev,
        medicalHistory: {
          ...prev.medicalHistory,
          notes: value
        }
      }));
    } else if (name === 'dateOfBirth') {
      setFormData(prev => ({ ...prev, [name]: new Date(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleAddAllergy = () => {
    if (newAllergy.trim()) {
      setFormData(prev => ({
        ...prev,
        medicalHistory: {
          ...prev.medicalHistory,
          allergies: [...prev.medicalHistory.allergies, newAllergy.trim()]
        }
      }));
      setNewAllergy('');
    }
  };

  const handleRemoveAllergy = (index: number) => {
    setFormData(prev => ({
      ...prev,
      medicalHistory: {
        ...prev.medicalHistory,
        allergies: prev.medicalHistory.allergies.filter((_, i) => i !== index)
      }
    }));
  };

  const handleAddCondition = () => {
    if (newCondition.trim()) {
      setFormData(prev => ({
        ...prev,
        medicalHistory: {
          ...prev.medicalHistory,
          conditions: [...prev.medicalHistory.conditions, newCondition.trim()]
        }
      }));
      setNewCondition('');
    }
  };

  const handleRemoveCondition = (index: number) => {
    setFormData(prev => ({
      ...prev,
      medicalHistory: {
        ...prev.medicalHistory,
        conditions: prev.medicalHistory.conditions.filter((_, i) => i !== index)
      }
    }));
  };

  const validateForm = () => {
    if (!formData.firstName.trim()) {
      setError(t('patient_form.first_name_required'));
      return false;
    }
    if (!formData.lastName.trim()) {
      setError(t('patient_form.last_name_required'));
      return false;
    }
    if (!formData.email.trim()) {
      setError(t('patient_form.email_required'));
      return false;
    }
    if (!formData.phone.trim()) {
      setError(t('patient_form.phone_required'));
      return false;
    }
    if (!formData.dateOfBirth) {
      setError(t('patient_form.date_of_birth_required'));
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      if (isEditMode) {
        await patientService.updatePatient(id!, formData);
      } else {
        await patientService.createPatient(formData);
      }
      
      setSuccess(isEditMode ? t('patient_form.patient_updated_successfully') : t('patient_form.patient_created_successfully'));
      
      setTimeout(() => {
        if (isEditMode) {
          navigate(`/patients/${id}`);
        } else {
          navigate('/patients');
        }
      }, 1500);
    } catch (err: any) {
      setError(err.message || t('patient_form.error_saving_patient'));
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && isEditMode) {
    return (
      <div className="py-6">
        <Card>
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {isEditMode ? t('patient_form.edit_patient') : t('patient_form.add_new_patient')}
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            {isEditMode ? t('patient_form.update_patient_info') : t('patient_form.create_new_patient_record')}
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="error" className="mb-6" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" className="mb-6" onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <h2 className="text-lg font-medium text-gray-900 mb-4">{t('patient_form.personal_information')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={t('patient_form.first_name')}
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              required
            />
            <Input
              label={t('patient_form.last_name')}
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              required
            />
            <Input
              label={t('patient_form.email')}
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
            <Input
              label={t('patient_form.phone')}
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleInputChange}
              required
            />
            <Input
               label={t('patient_form.date_of_birth')}
               name="dateOfBirth"
               type="date"
               value={formData.dateOfBirth.toISOString().split('T')[0]}
               onChange={handleInputChange}
               required
             />
            <Select
              label={t('patient_form.gender')}
              name="gender"
              value={formData.gender}
              onChange={handleInputChange}
              options={[
                { value: 'male', label: t('patient_form.male') },
                { value: 'female', label: t('patient_form.female') },
                { value: 'other', label: t('patient_form.other') }
              ]}
            />
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-medium text-gray-900 mb-4">{t('patient_form.address_information')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
               <Input
                 label={t('patient_form.street_address')}
                 name="address.street"
                 value={formData.address.street}
                 onChange={handleInputChange}
               />
             </div>
             <Input
               label={t('patient_form.city')}
               name="address.city"
               value={formData.address.city}
               onChange={handleInputChange}
             />
             <Input
               label={t('patient_form.state')}
               name="address.state"
               value={formData.address.state}
               onChange={handleInputChange}
             />
             <Input
               label={t('patient_form.zip_code')}
               name="address.zipCode"
               value={formData.address.zipCode}
               onChange={handleInputChange}
             />
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-medium text-gray-900 mb-4">{t('patient_form.emergency_contact')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
               label={t('patient_form.contact_name')}
               name="emergencyContact.name"
               value={formData.emergencyContact?.name || ''}
               onChange={handleInputChange}
             />
             <Input
               label={t('patient_form.contact_phone')}
               name="emergencyContact.phone"
               type="tel"
               value={formData.emergencyContact?.phone || ''}
               onChange={handleInputChange}
             />
             <Input
               label={t('patient_form.relationship')}
               name="emergencyContact.relationship"
               value={formData.emergencyContact?.relationship || ''}
               onChange={handleInputChange}
             />
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-medium text-gray-900 mb-4">{t('patient_form.medical_information')}</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-md font-medium text-gray-700 mb-2">{t('patient_form.allergies')}</h3>
              <div className="flex gap-2 mb-2">
                <Input
                  placeholder={t('patient_form.add_allergy')}
                  value={newAllergy}
                  onChange={(e) => setNewAllergy(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddAllergy())}
                />
                <Button type="button" onClick={handleAddAllergy} variant="outline">
                  {t('patient_form.add')}
                </Button>
              </div>
              {formData.medicalHistory.allergies.length > 0 && (
                <div className="space-y-1">
                  {formData.medicalHistory.allergies.map((allergy, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                      <span>{allergy}</span>
                      <Button
                         type="button"
                         variant="outline"
                         size="sm"
                         onClick={() => handleRemoveAllergy(index)}
                       >
                         {t('patient_form.remove')}
                       </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="text-md font-medium text-gray-700 mb-2">{t('patient_form.medical_conditions')}</h3>
              <div className="flex gap-2 mb-2">
                <Input
                  placeholder={t('patient_form.add_medical_condition')}
                  value={newCondition}
                  onChange={(e) => setNewCondition(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCondition())}
                />
                <Button type="button" onClick={handleAddCondition} variant="outline">
                  {t('patient_form.add')}
                </Button>
              </div>
              {formData.medicalHistory.conditions.length > 0 && (
                <div className="space-y-1">
                  {formData.medicalHistory.conditions.map((condition, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                      <span>{condition}</span>
                      <Button
                         type="button"
                         variant="outline"
                         size="sm"
                         onClick={() => handleRemoveCondition(index)}
                       >
                         {t('patient_form.remove')}
                       </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <Textarea
                label={t('patient_form.medical_notes')}
                name="medicalHistory.notes"
                value={formData.medicalHistory.notes}
                onChange={handleInputChange}
                rows={4}
                placeholder={t('patient_form.additional_medical_notes')}
              />
            </div>
          </div>
        </Card>

        <div className="flex justify-end space-x-3">
          <Link to="/patients">
            <Button type="button" variant="outline">
              {t('patient_form.cancel')}
            </Button>
          </Link>
          <Button type="submit" isLoading={isLoading}>
            {isEditMode ? t('patient_form.update_patient') : t('patient_form.create_patient')}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default PatientForm;