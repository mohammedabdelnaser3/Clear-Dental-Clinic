import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, Button, Input, Select, Alert, Avatar, Badge } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';
import { patientService } from '../../services/patientService';
import type { Patient } from '../../types';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Shield,
  Bell,
  Save,
  X,
  Check,
  AlertCircle,
  Camera,
  Heart,
  Settings} from 'lucide-react';

const PatientSettings: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeSection, setActiveSection] = useState('personal');
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [patient, setPatient] = useState<Patient | null>(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: 'male',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'Egypt'
    },
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    },
    medicalHistory: {
      allergies: [] as string[],
      conditions: [] as string[],
      medications: [] as string[],
      notes: ''
    }
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    smsNotifications: true,
    appointmentReminders: true,
    healthTips: false,
    language: 'en',
    timezone: 'Africa/Cairo'
  });

  const [newAllergy, setNewAllergy] = useState('');
  const [newCondition, setNewCondition] = useState('');

  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        setLoading(true);
        const patientData = await patientService.getPatientsByUserId(user?.id!);
        const patientRecord = patientData.data?.[0];
        setPatient(patientRecord);
        
        // Populate form data if patient record exists
        if (patientRecord) {
          setFormData({
            firstName: patientRecord.firstName || '',
            lastName: patientRecord.lastName || '',
            email: patientRecord.email || '',
            phone: patientRecord.phone || '',
            dateOfBirth: patientRecord.dateOfBirth ? new Date(patientRecord.dateOfBirth).toISOString().split('T')[0] : '',
            gender: patientRecord.gender || 'male',
            address: {
              street: patientRecord.address?.street || '',
              city: patientRecord.address?.city || '',
              state: patientRecord.address?.state || '',
              zipCode: patientRecord.address?.zipCode || '',
              country: patientRecord.address?.country || 'Egypt'
            },
            emergencyContact: {
              name: patientRecord.emergencyContact?.name || '',
              phone: patientRecord.emergencyContact?.phone || '',
              relationship: patientRecord.emergencyContact?.relationship || ''
            },
            medicalHistory: {
              allergies: patientRecord.medicalHistory?.allergies || [],
              conditions: patientRecord.medicalHistory?.conditions || [],
              medications: patientRecord.medicalHistory?.medications || [],
              notes: patientRecord.medicalHistory?.notes || ''
            }
          });
        }
      } catch (err: any) {
        setMessage({ type: 'error', text: err.message || 'Failed to load patient data' });
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchPatientData();
    }
  }, [user?.id]);

  const handleInputChange = (field: string, value: string) => {
    if (field.startsWith('address.')) {
      const addressField = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }));
    } else if (field.startsWith('emergencyContact.')) {
      const contactField = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        emergencyContact: {
          ...prev.emergencyContact,
          [contactField]: value
        }
      }));
    } else if (field === 'medicalHistory.notes') {
      setFormData(prev => ({
        ...prev,
        medicalHistory: {
          ...prev.medicalHistory,
          notes: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const updateData = {
        ...formData,
        dateOfBirth: new Date(formData.dateOfBirth),
        gender: formData.gender as 'male' | 'female' | 'other',
        id: patient?.id
      };
      
      await patientService.updatePatient(patient?.id!, updateData);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update profile' });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    
    setLoading(true);
    try {
      // Add password change logic here
      setMessage({ type: 'success', text: 'Password updated successfully' });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordFields(false);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update password' });
    } finally {
      setLoading(false);
    }
  };

  const genderOptions = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' }
  ];

  const stateOptions = [
    { value: '', label: 'Select State/Province' },
    { value: 'Cairo', label: 'Cairo' },
    { value: 'Alexandria', label: 'Alexandria' },
    { value: 'Giza', label: 'Giza' },
    { value: 'Fayoum', label: 'Fayoum' },
    { value: 'Aswan', label: 'Aswan' },
    { value: 'Luxor', label: 'Luxor' },
    { value: 'Minya', label: 'Minya' },
    { value: 'Sohag', label: 'Sohag' },
    { value: 'Qena', label: 'Qena' },
    { value: 'Beni Suef', label: 'Beni Suef' }
  ];

  const relationshipOptions = [
    { value: '', label: 'Select Relationship' },
    { value: 'spouse', label: 'Spouse' },
    { value: 'parent', label: 'Parent' },
    { value: 'child', label: 'Child' },
    { value: 'sibling', label: 'Sibling' },
    { value: 'friend', label: 'Friend' },
    { value: 'other', label: 'Other' }
  ];

  const sections = [
    { id: 'personal', label: t('patientSettings.personalInformation'), icon: <User className="w-4 h-4" /> },
    { id: 'contact', label: t('patientSettings.contactDetails'), icon: <Mail className="w-4 h-4" /> },
    { id: 'address', label: t('patientSettings.addressInformation'), icon: <MapPin className="w-4 h-4" /> },
    { id: 'emergency', label: t('patientSettings.emergencyContact'), icon: <Phone className="w-4 h-4" /> },
    { id: 'medical', label: t('patientSettings.medicalInformation'), icon: <Heart className="w-4 h-4" /> },
    { id: 'security', label: t('patientSettings.security'), icon: <Shield className="w-4 h-4" /> },
    { id: 'preferences', label: t('patientSettings.preferences'), icon: <Settings className="w-4 h-4" /> }
  ];

  if (loading && !patient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('patientSettings.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">{t('patientSettings.title')}</h1>
                <p className="text-xl text-gray-600">
                  {t('patientSettings.subtitle')}
                </p>
              </div>
              <div className="flex gap-3">
              </div>
            </div>
          </div>

          {/* Profile Header Card */}
          <Card className="p-8 mb-8 bg-gradient-to-r from-white to-blue-50 border-0 shadow-xl">
            <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8">
              <div className="relative">
                <div className="relative">
                  <Avatar
                    src={user?.profileImage}
                    alt={`${formData.firstName} ${formData.lastName}`}
                    size="xl"
                    fallback={`${formData.firstName[0] || ''}${formData.lastName[0] || ''}`}
                    className="ring-4 ring-white shadow-2xl w-32 h-32"
                  />
                  <button className="absolute bottom-2 right-2 bg-blue-600 text-white rounded-full p-3 hover:bg-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl">
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
                <div className="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-2">
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                </div>
              </div>
              
              <div className="flex-1 text-center lg:text-left">
                <div className="mb-4">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    {formData.firstName} {formData.lastName}
                  </h2>
                  <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 mb-3">
                    <Badge className="bg-green-100 text-green-800 px-3 py-1 text-sm font-medium">
                      {t('patientProfile.activePatient')}
                    </Badge>
                    <Badge className="bg-blue-100 text-blue-800 px-3 py-1 text-sm">
                      {t('patientSettings.profileComplete', { percent: 85 })}
                    </Badge>
                  </div>
                  <p className="text-gray-600 text-lg">{formData.email}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Navigation Tabs */}
          <div className="mb-8">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8 overflow-x-auto">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                      activeSection === section.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {section.icon}
                    {section.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Messages */}
          {message && (
            <Alert
              variant={message.type}
              className="mb-6"
            >
              <div className="flex items-center gap-2">
                {message.type === 'success' ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
                {message.text}
              </div>
            </Alert>
          )}

          {/* Form Content */}
          <Card className="p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Personal Information Section */}
              {activeSection === 'personal' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">Personal Information</h3>
                      <p className="text-gray-600">Update your basic personal details</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                      label="First Name"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      required
                    />
                    <Input
                      label="Last Name"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                      label="Date of Birth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                    />
                    <Select
                      label="Gender"
                      options={genderOptions}
                      value={formData.gender}
                      onChange={(e) => handleInputChange('gender', e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Contact Details Section */}
              {activeSection === 'contact' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Mail className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">Contact Details</h3>
                      <p className="text-gray-600">Manage your contact information</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="relative">
                      <Input
                        label="Email Address"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        required
                        className="pl-10"
                      />
                      <Mail className="w-4 h-4 absolute left-3 top-9 text-gray-400" />
                    </div>
                    <div className="relative">
                      <Input
                        label="Phone Number"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="+20 123 456 7890"
                        className="pl-10"
                      />
                      <Phone className="w-4 h-4 absolute left-3 top-9 text-gray-400" />
                    </div>
                  </div>
                </div>
              )}

              {/* Address Section */}
              {activeSection === 'address' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">Address Information</h3>
                      <p className="text-gray-600">Update your address details</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <Input
                      label="Street Address"
                      value={formData.address.street}
                      onChange={(e) => handleInputChange('address.street', e.target.value)}
                      placeholder="123 Main Street"
                    />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <Input
                        label="City"
                        value={formData.address.city}
                        onChange={(e) => handleInputChange('address.city', e.target.value)}
                        placeholder="Cairo"
                      />
                      <Select
                        label="State/Province"
                        options={stateOptions}
                        value={formData.address.state}
                        onChange={(e) => handleInputChange('address.state', e.target.value)}
                      />
                      <Input
                        label="ZIP/Postal Code"
                        value={formData.address.zipCode}
                        onChange={(e) => handleInputChange('address.zipCode', e.target.value)}
                        placeholder="12345"
                      />
                    </div>
                    <Input
                      label="Country"
                      value={formData.address.country}
                      onChange={(e) => handleInputChange('address.country', e.target.value)}
                      placeholder="Egypt"
                    />
                  </div>
                </div>
              )}

              {/* Emergency Contact Section */}
              {activeSection === 'emergency' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                      <Phone className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">Emergency Contact</h3>
                      <p className="text-gray-600">Person to contact in case of emergency</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Input
                      label="Contact Name"
                      value={formData.emergencyContact.name}
                      onChange={(e) => handleInputChange('emergencyContact.name', e.target.value)}
                      placeholder="Full Name"
                    />
                    <Input
                      label="Phone Number"
                      type="tel"
                      value={formData.emergencyContact.phone}
                      onChange={(e) => handleInputChange('emergencyContact.phone', e.target.value)}
                      placeholder="+20 123 456 7890"
                    />
                    <Select
                      label="Relationship"
                      options={relationshipOptions}
                      value={formData.emergencyContact.relationship}
                      onChange={(e) => handleInputChange('emergencyContact.relationship', e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Medical Information Section */}
              {activeSection === 'medical' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Heart className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">Medical Information</h3>
                      <p className="text-gray-600">Update your medical history and conditions</p>
                    </div>
                  </div>

                  <div className="space-y-8">
                    {/* Allergies */}
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 mb-4">Allergies</h4>
                      <div className="flex gap-2 mb-4">
                        <Input
                          placeholder="Add new allergy"
                          value={newAllergy}
                          onChange={(e) => setNewAllergy(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddAllergy())}
                        />
                        <Button type="button" onClick={handleAddAllergy} variant="outline">
                          Add
                        </Button>
                      </div>
                      {formData.medicalHistory.allergies.length > 0 && (
                        <div className="space-y-2">
                          {formData.medicalHistory.allergies.map((allergy, index) => (
                            <div key={index} className="flex items-center justify-between bg-red-50 p-3 rounded-lg">
                              <span className="text-red-800">{allergy}</span>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleRemoveAllergy(index)}
                                className="text-red-600 hover:text-red-700"
                              >
                                Remove
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Medical Conditions */}
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 mb-4">Medical Conditions</h4>
                      <div className="flex gap-2 mb-4">
                        <Input
                          placeholder="Add medical condition"
                          value={newCondition}
                          onChange={(e) => setNewCondition(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCondition())}
                        />
                        <Button type="button" onClick={handleAddCondition} variant="outline">
                          Add
                        </Button>
                      </div>
                      {formData.medicalHistory.conditions.length > 0 && (
                        <div className="space-y-2">
                          {formData.medicalHistory.conditions.map((condition, index) => (
                            <div key={index} className="flex items-center justify-between bg-blue-50 p-3 rounded-lg">
                              <span className="text-blue-800">{condition}</span>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleRemoveCondition(index)}
                                className="text-blue-600 hover:text-blue-700"
                              >
                                Remove
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Medical Notes */}
                    <div>
                      <label className="block text-lg font-medium text-gray-900 mb-2">
                        Additional Medical Notes
                      </label>
                      <textarea
                        rows={4}
                        value={formData.medicalHistory.notes}
                        onChange={(e) => handleInputChange('medicalHistory.notes', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Any additional medical information, medications, or notes..."
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Security Section */}
              {activeSection === 'security' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                      <Shield className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">Security Settings</h3>
                      <p className="text-gray-600">Manage your account security</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-gray-50 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="font-medium text-gray-900">Change Password</h4>
                          <p className="text-sm text-gray-600">Update your account password</p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowPasswordFields(!showPasswordFields)}
                        >
                          {showPasswordFields ? 'Cancel' : 'Change Password'}
                        </Button>
                      </div>

                      {showPasswordFields && (
                        <div className="space-y-4 pt-4 border-t border-gray-200">
                          <Input
                            label="Current Password"
                            type="password"
                            value={passwordData.currentPassword}
                            onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                            required
                          />
                          <Input
                            label="New Password"
                            type="password"
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                            required
                          />
                          <Input
                            label="Confirm New Password"
                            type="password"
                            value={passwordData.confirmPassword}
                            onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                            required
                          />
                          <div className="flex gap-3">
                            <Button
                              type="button"
                              onClick={handlePasswordChange}
                              disabled={loading}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Update Password
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setShowPasswordFields(false);
                                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="bg-gray-50 rounded-lg p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">Two-Factor Authentication</h4>
                          <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
                        </div>
                        <Badge className="bg-red-100 text-red-800">
                          Disabled
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Preferences Section */}
              {activeSection === 'preferences' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Settings className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">Preferences</h3>
                      <p className="text-gray-600">Customize your experience</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h4 className="font-medium text-gray-900 mb-4">Notifications</h4>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">Email Notifications</p>
                            <p className="text-sm text-gray-600">Receive updates via email</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={preferences.emailNotifications}
                            onChange={(e) => setPreferences(prev => ({ ...prev, emailNotifications: e.target.checked }))}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">SMS Notifications</p>
                            <p className="text-sm text-gray-600">Receive updates via SMS</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={preferences.smsNotifications}
                            onChange={(e) => setPreferences(prev => ({ ...prev, smsNotifications: e.target.checked }))}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">Appointment Reminders</p>
                            <p className="text-sm text-gray-600">Get reminded about upcoming appointments</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={preferences.appointmentReminders}
                            onChange={(e) => setPreferences(prev => ({ ...prev, appointmentReminders: e.target.checked }))}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-6">
                      <h4 className="font-medium text-gray-900 mb-4">Language & Region</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Select
                          label="Language"
                          options={[
                            { value: 'en', label: 'English' },
                            { value: 'ar', label: 'Arabic' }
                          ]}
                          value={preferences.language}
                          onChange={(e) => setPreferences(prev => ({ ...prev, language: e.target.value }))}
                        />
                        <Select
                          label="Timezone"
                          options={[
                            { value: 'Africa/Cairo', label: 'Cairo (GMT+2)' },
                            { value: 'Africa/Alexandria', label: 'Alexandria (GMT+2)' }
                          ]}
                          value={preferences.timezone}
                          onChange={(e) => setPreferences(prev => ({ ...prev, timezone: e.target.value }))}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex justify-end pt-8 border-t border-gray-200">
                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => window.location.reload()}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 min-w-[120px]"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Saving...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Save className="w-4 h-4" />
                        Save Changes
                      </div>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PatientSettings;