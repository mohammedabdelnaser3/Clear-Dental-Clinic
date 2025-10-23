import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Card, Button, Input, Select, Alert, Avatar, Badge } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';
import { patientService } from '../../services/patientService';
import { userService } from '../../services/userService';
import type { Patient } from '../../types';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Shield,
  Save,
  X,
  Check,
  AlertCircle,
  Camera,
  Heart,
  Settings} from 'lucide-react';
import { validateEmail, validatePhone, validateRequired, validateZipCode, validateDate } from '../../utils/validation';

const PatientSettings: React.FC = () => {
  const { t } = useTranslation();
  const { user, refreshUser, changePassword } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeSection, setActiveSection] = useState('personal');
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [patient, setPatient] = useState<Patient | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        setLoading(true);
        setMessage(null);
        
        const userId = user?.id;
        if (!userId) {
          console.warn('No authenticated user ID available');
          toast.error('User not authenticated. Please sign in again.');
          setLoading(false);
          return;
        }
        const patientData = await patientService.getPatientsByUserId(userId);
        const patientRecord = patientData.data?.[0];
        
        if (!patientRecord) {
          console.warn('No patient record found for user:', user?.id);
          const errorMsg = 'Patient profile not found. Please contact support.';
          toast.error(errorMsg);
          setMessage({ type: 'error', text: errorMsg });
          return;
        }
        
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
        console.error('Error fetching patient data:', {
          error: err,
          message: err.message,
          status: err.response?.status,
          userId: user?.id
        });
        
        let errorMsg = 'Failed to load patient data';
        
        // Handle specific error cases
        if (err.response?.status === 401) {
          errorMsg = 'Your session has expired. Please log in again.';
          toast.error(errorMsg);
          setMessage({ type: 'error', text: errorMsg });
          // Redirect to login after a short delay
          setTimeout(() => {
            window.location.href = '/login';
          }, 2000);
        } else if (err.response?.status === 403) {
          errorMsg = 'You do not have permission to access this page.';
          toast.error(errorMsg);
          setMessage({ type: 'error', text: errorMsg });
        } else if (err.response?.status === 404) {
          errorMsg = 'Patient profile not found. Please contact support.';
          toast.error(errorMsg);
          setMessage({ type: 'error', text: errorMsg });
        } else if (err.code === 'ERR_NETWORK' || err.message.includes('Network Error')) {
          errorMsg = 'Network error. Please check your internet connection and try again.';
          toast.error(errorMsg);
          setMessage({ type: 'error', text: errorMsg });
        } else {
          errorMsg = err.message || errorMsg;
          toast.error(errorMsg);
          setMessage({ type: 'error', text: errorMsg });
        }
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchPatientData();
    }
  }, [user?.id]);

  const handleInputChange = (field: string, value: string) => {
    // Clear validation error for this field when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }

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

  const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      const errorMsg = 'File size must be less than 5MB';
      toast.error(errorMsg);
      setMessage({ type: 'error', text: errorMsg });
      return;
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      const errorMsg = 'Please upload a valid image file (JPG, PNG, or GIF)';
      toast.error(errorMsg);
      setMessage({ type: 'error', text: errorMsg });
      return;
    }

    try {
      setUploadingImage(true);
      setMessage(null);
      
      await userService.uploadProfileImage(file);
      toast.success('Profile picture updated successfully');
      setMessage({ type: 'success', text: 'Profile picture updated successfully' });
      
      // Refresh user context to show new image
      if (refreshUser) {
        try {
          await refreshUser();
        } catch (refreshErr: any) {
          console.error('Failed to refresh user after image upload:', refreshErr);
          // Don't show error to user as the upload was successful
        }
      }
      
      // Auto-dismiss success message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      console.error('Error uploading profile picture:', {
        error,
        message: error.message,
        status: error.response?.status
      });
      
      let errorMsg = 'Failed to upload profile picture';
      
      // Handle specific error cases
      if (error.response?.status === 401) {
        errorMsg = 'Your session has expired. Please log in again.';
        toast.error(errorMsg);
        setMessage({ type: 'error', text: errorMsg });
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else if (error.response?.status === 413) {
        errorMsg = 'File is too large. Please upload a smaller image.';
        toast.error(errorMsg);
        setMessage({ type: 'error', text: errorMsg });
      } else if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
        errorMsg = 'Network error. Please check your internet connection and try again.';
        toast.error(errorMsg);
        setMessage({ type: 'error', text: errorMsg });
      } else {
        errorMsg = error.message || errorMsg;
        toast.error(errorMsg);
        setMessage({ type: 'error', text: errorMsg });
      }
    } finally {
      setUploadingImage(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Validate required fields
    const firstNameValidation = validateRequired(formData.firstName, 'First name');
    if (!firstNameValidation.isValid) {
      errors.firstName = firstNameValidation.error!;
    }

    const lastNameValidation = validateRequired(formData.lastName, 'Last name');
    if (!lastNameValidation.isValid) {
      errors.lastName = lastNameValidation.error!;
    }

    // Validate email
    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.isValid) {
      errors.email = emailValidation.error!;
    }

    // Validate phone
    const phoneValidation = validatePhone(formData.phone);
    if (!phoneValidation.isValid) {
      errors.phone = phoneValidation.error!;
    }

    // Validate date of birth
    const dobValidation = validateDate(formData.dateOfBirth, 'Date of birth');
    if (!dobValidation.isValid) {
      errors.dateOfBirth = dobValidation.error!;
    }

    // Validate ZIP code
    const zipValidation = validateZipCode(formData.address.zipCode);
    if (!zipValidation.isValid) {
      errors['address.zipCode'] = zipValidation.error!;
    }

    // Validate emergency contact phone if provided
    if (formData.emergencyContact.phone) {
      const emergencyPhoneValidation = validatePhone(formData.emergencyContact.phone);
      if (!emergencyPhoneValidation.isValid) {
        errors['emergencyContact.phone'] = emergencyPhoneValidation.error!;
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    console.log(formData);

    // Validate form before submission
    if (!validateForm()) {
      const errorMsg = 'Please fix the validation errors before submitting';
      toast.error(errorMsg);
      setMessage({ type: 'error', text: errorMsg });
      return;
    }

    if (!patient?.id) {
      const errorMsg = 'Patient ID not found. Please refresh the page and try again.';
      toast.error(errorMsg);
      setMessage({ type: 'error', text: errorMsg });
      return;
    }

    setLoading(true);

    try {
      const updateData = {
        ...formData,
        dateOfBirth: new Date(formData.dateOfBirth),
        gender: formData.gender as 'male' | 'female' | 'other',
        id: patient?.id
      };
      
      await patientService.updatePatient(patient.id, updateData);
      toast.success('Profile updated successfully!');
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      
      // Auto-dismiss success message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      console.error('Error updating patient profile:', {
        error: err,
        message: err.message,
        status: err.response?.status,
        patientId: patient?.id
      });
      
      let errorMsg = 'Failed to update profile';
      
      // Handle specific error cases
      if (err.response?.status === 401) {
        errorMsg = 'Your session has expired. Please log in again.';
        toast.error(errorMsg);
        setMessage({ type: 'error', text: errorMsg });
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else if (err.response?.status === 403) {
        errorMsg = 'You do not have permission to update this profile.';
        toast.error(errorMsg);
        setMessage({ type: 'error', text: errorMsg });
      } else if (err.response?.status === 404) {
        errorMsg = 'Patient profile not found. Please refresh the page and try again.';
        toast.error(errorMsg);
        setMessage({ type: 'error', text: errorMsg });
      } else if (err.response?.status === 422) {
        errorMsg = 'Invalid data provided. Please check your inputs and try again.';
        toast.error(errorMsg);
        setMessage({ type: 'error', text: errorMsg });
      } else if (err.code === 'ERR_NETWORK' || err.message.includes('Network Error')) {
        errorMsg = 'Network error. Please check your internet connection and try again.';
        toast.error(errorMsg);
        setMessage({ type: 'error', text: errorMsg });
      } else {
        errorMsg = err.message || errorMsg;
        toast.error(errorMsg);
        setMessage({ type: 'error', text: errorMsg });
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    
    // Validation: Check if current password is provided
    if (!passwordData.currentPassword) {
      const errorMsg = 'Current password is required';
      toast.error(errorMsg);
      setMessage({ type: 'error', text: errorMsg });
      return;
    }
    
    // Validation: Check if passwords match
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      const errorMsg = 'New passwords do not match';
      toast.error(errorMsg);
      setMessage({ type: 'error', text: errorMsg });
      return;
    }
    
    // Validation: Check password length (min 8 characters)
    if (passwordData.newPassword.length < 8) {
      const errorMsg = 'Password must be at least 8 characters long';
      toast.error(errorMsg);
      setMessage({ type: 'error', text: errorMsg });
      return;
    }
    
    // Validation: Check if new password is different from current
    if (passwordData.currentPassword === passwordData.newPassword) {
      const errorMsg = 'New password must be different from current password';
      toast.error(errorMsg);
      setMessage({ type: 'error', text: errorMsg });
      return;
    }
    
    setLoading(true);
    try {
      // Call the changePassword method from useAuth hook
      await changePassword(passwordData.currentPassword, passwordData.newPassword);
      
      toast.success('Password updated successfully');
      setMessage({ type: 'success', text: 'Password updated successfully' });
      
      // Clear password fields on success
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      
      // Hide password fields on success
      setShowPasswordFields(false);
      
      // Auto-dismiss success message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      console.error('Error changing password:', {
        error,
        message: error.message,
        status: error.response?.status
      });
      
      let errorMsg = 'Failed to update password';
      
      // Handle specific error cases
      if (error.response?.status === 401) {
        errorMsg = 'Current password is incorrect. Please try again.';
        toast.error(errorMsg);
        setMessage({ type: 'error', text: errorMsg });
      } else if (error.response?.status === 403) {
        errorMsg = 'Your session has expired. Please log in again.';
        toast.error(errorMsg);
        setMessage({ type: 'error', text: errorMsg });
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else if (error.response?.status === 422) {
        errorMsg = 'Password does not meet security requirements. Please use a stronger password.';
        toast.error(errorMsg);
        setMessage({ type: 'error', text: errorMsg });
      } else if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
        errorMsg = 'Network error. Please check your internet connection and try again.';
        toast.error(errorMsg);
        setMessage({ type: 'error', text: errorMsg });
      } else {
        errorMsg = error.message || errorMsg;
        toast.error(errorMsg);
        setMessage({ type: 'error', text: errorMsg });
      }
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
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6">
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">{t('patientSettings.title')}</h1>
                <p className="text-base sm:text-lg lg:text-xl text-gray-600">
                  {t('patientSettings.subtitle')}
                </p>
              </div>
              <div className="flex gap-3">
              </div>
            </div>
          </div>

          {/* Profile Header Card */}
          <Card className="p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8 bg-gradient-to-r from-white to-blue-50 border-0 shadow-xl">
            <div className="flex flex-col lg:flex-row items-center lg:items-start gap-4 sm:gap-6 lg:gap-8">
              <div className="relative">
                <div className="relative">
                  <Avatar
                    src={user?.profileImage}
                    alt={`${formData.firstName} ${formData.lastName}`}
                    size="xl"
                    fallback={`${formData.firstName[0] || ''}${formData.lastName[0] || ''}`}
                    className="ring-4 ring-white shadow-2xl w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32"
                  />
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif"
                    onChange={handleProfilePictureUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage || loading}
                    className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 bg-blue-600 text-white rounded-full p-2 sm:p-3 hover:bg-blue-700 active:bg-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none min-w-[44px] min-h-[44px] flex items-center justify-center"
                  >
                    {uploadingImage ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
                    )}
                  </button>
                </div>
                <div className="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-1.5 sm:p-2">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-white rounded-full"></div>
                </div>
              </div>
              
              <div className="flex-1 text-center lg:text-left">
                <div className="mb-4">
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                    {formData.firstName} {formData.lastName}
                  </h2>
                  <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 sm:gap-3 mb-3">
                    <Badge className="bg-green-100 text-green-800 px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium">
                      {t('patientProfile.activePatient')}
                    </Badge>
                    <Badge className="bg-blue-100 text-blue-800 px-2 sm:px-3 py-1 text-xs sm:text-sm">
                      {t('patientSettings.profileComplete', { percent: 85 })}
                    </Badge>
                  </div>
                  <p className="text-gray-600 text-sm sm:text-base lg:text-lg break-all">{formData.email}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Navigation Tabs */}
          <div className="mb-6 sm:mb-8">
            {/* Mobile: Dropdown Navigation */}
            <div className="block sm:hidden mb-4">
              <label htmlFor="section-select" className="sr-only">Select Section</label>
              <select
                id="section-select"
                value={activeSection}
                onChange={(e) => setActiveSection(e.target.value)}
                disabled={loading}
                className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-base"
              >
                {sections.map((section) => (
                  <option key={section.id} value={section.id}>
                    {section.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Tablet & Desktop: Horizontal Tabs */}
            <div className="hidden sm:block border-b border-gray-200">
              <nav className="-mb-px flex space-x-4 lg:space-x-8 overflow-x-auto scrollbar-hide">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    disabled={loading}
                    className={`flex items-center gap-2 py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] ${
                      activeSection === section.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <span className="hidden sm:inline">{section.icon}</span>
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
          <Card className="p-4 sm:p-6 lg:p-8">
            <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
              {/* Personal Information Section */}
              {activeSection === 'personal' && (
                <div className="space-y-4 sm:space-y-6">
                  <div className="flex items-start sm:items-center gap-3 mb-4 sm:mb-6">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Personal Information</h3>
                      <p className="text-sm sm:text-base text-gray-600">Update your basic personal details</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <Input
                        label="First Name"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        required
                      />
                      {validationErrors.firstName && (
                        <p className="mt-1 text-sm text-red-600">{validationErrors.firstName}</p>
                      )}
                    </div>
                    <div>
                      <Input
                        label="Last Name"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        required
                      />
                      {validationErrors.lastName && (
                        <p className="mt-1 text-sm text-red-600">{validationErrors.lastName}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <Input
                        label="Date of Birth"
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                      />
                      {validationErrors.dateOfBirth && (
                        <p className="mt-1 text-sm text-red-600">{validationErrors.dateOfBirth}</p>
                      )}
                    </div>
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
                <div className="space-y-4 sm:space-y-6">
                  <div className="flex items-start sm:items-center gap-3 mb-4 sm:mb-6">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Mail className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Contact Details</h3>
                      <p className="text-sm sm:text-base text-gray-600">Manage your contact information</p>
                    </div>
                  </div>

                  <div className="space-y-4 sm:space-y-6">
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
                      {validationErrors.email && (
                        <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
                      )}
                    </div>
                    <div className="relative">
                      <Input
                        label="Phone Number"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder={t('patientSettings.contact.phonePlaceholder')}
                        className="pl-10"
                      />
                      <Phone className="w-4 h-4 absolute left-3 top-9 text-gray-400" />
                      {validationErrors.phone && (
                        <p className="mt-1 text-sm text-red-600">{validationErrors.phone}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Address Section */}
              {activeSection === 'address' && (
                <div className="space-y-4 sm:space-y-6">
                  <div className="flex items-start sm:items-center gap-3 mb-4 sm:mb-6">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Address Information</h3>
                      <p className="text-sm sm:text-base text-gray-600">Update your address details</p>
                    </div>
                  </div>

                  <div className="space-y-4 sm:space-y-6">
                    <Input
                      label="Street Address"
                      value={formData.address.street}
                      onChange={(e) => handleInputChange('address.street', e.target.value)}
                      placeholder={t('patientSettings.address.streetPlaceholder')}
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                      <Input
                        label="City"
                        value={formData.address.city}
                        onChange={(e) => handleInputChange('address.city', e.target.value)}
                        placeholder={t('patientSettings.address.cityPlaceholder')}
                      />
                      <Select
                        label="State/Province"
                        options={stateOptions}
                        value={formData.address.state}
                        onChange={(e) => handleInputChange('address.state', e.target.value)}
                      />
                      <div>
                        <Input
                          label="ZIP/Postal Code"
                          value={formData.address.zipCode}
                          onChange={(e) => handleInputChange('address.zipCode', e.target.value)}
                          placeholder={t('patientSettings.address.zipCodePlaceholder')}
                        />
                        {validationErrors['address.zipCode'] && (
                          <p className="mt-1 text-sm text-red-600">{validationErrors['address.zipCode']}</p>
                        )}
                      </div>
                    </div>
                    <Input
                      label="Country"
                      value={formData.address.country}
                      onChange={(e) => handleInputChange('address.country', e.target.value)}
                      placeholder={t('patientSettings.address.countryPlaceholder')}
                    />
                  </div>
                </div>
              )}

              {/* Emergency Contact Section */}
              {activeSection === 'emergency' && (
                <div className="space-y-4 sm:space-y-6">
                  <div className="flex items-start sm:items-center gap-3 mb-4 sm:mb-6">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Phone className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Emergency Contact</h3>
                      <p className="text-sm sm:text-base text-gray-600">Person to contact in case of emergency</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    <Input
                      label="Contact Name"
                      value={formData.emergencyContact.name}
                      onChange={(e) => handleInputChange('emergencyContact.name', e.target.value)}
                      placeholder={t('patientSettings.emergency.namePlaceholder')}
                    />
                    <div>
                      <Input
                        label="Phone Number"
                        type="tel"
                        value={formData.emergencyContact.phone}
                        onChange={(e) => handleInputChange('emergencyContact.phone', e.target.value)}
                        placeholder={t('patientSettings.emergency.phonePlaceholder')}
                      />
                      {validationErrors['emergencyContact.phone'] && (
                        <p className="mt-1 text-sm text-red-600">{validationErrors['emergencyContact.phone']}</p>
                      )}
                    </div>
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
                <div className="space-y-4 sm:space-y-6">
                  <div className="flex items-start sm:items-center gap-3 mb-4 sm:mb-6">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Heart className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Medical Information</h3>
                      <p className="text-sm sm:text-base text-gray-600">Update your medical history and conditions</p>
                    </div>
                  </div>

                  <div className="space-y-6 sm:space-y-8">
                    {/* Allergies */}
                    <div>
                      <h4 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">Allergies</h4>
                      <div className="flex flex-col sm:flex-row gap-2 mb-4">
                        <div className="flex-1">
                          <Input
                            placeholder={t('patientSettings.medical.allergyPlaceholder')}
                            value={newAllergy}
                            onChange={(e) => setNewAllergy(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddAllergy())}
                          />
                        </div>
                        <Button 
                          type="button" 
                          onClick={handleAddAllergy} 
                          variant="outline" 
                          disabled={loading || !newAllergy.trim()}
                          className="w-full sm:w-auto min-h-[44px]"
                        >
                          Add
                        </Button>
                      </div>
                      {formData.medicalHistory.allergies.length > 0 && (
                        <div className="space-y-2">
                          {formData.medicalHistory.allergies.map((allergy, index) => (
                            <div key={index} className="flex items-center justify-between bg-red-50 p-3 sm:p-4 rounded-lg gap-2">
                              <span className="text-red-800 text-sm sm:text-base break-words flex-1">{allergy}</span>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleRemoveAllergy(index)}
                                disabled={loading}
                                className="text-red-600 hover:text-red-700 flex-shrink-0 min-h-[44px] min-w-[44px] sm:min-w-0"
                              >
                                <span className="hidden sm:inline">Remove</span>
                                <X className="w-4 h-4 sm:hidden" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Medical Conditions */}
                    <div>
                      <h4 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">Medical Conditions</h4>
                      <div className="flex flex-col sm:flex-row gap-2 mb-4">
                        <div className="flex-1">
                          <Input
                            placeholder={t('patientSettings.medical.conditionPlaceholder')}
                            value={newCondition}
                            onChange={(e) => setNewCondition(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCondition())}
                          />
                        </div>
                        <Button 
                          type="button" 
                          onClick={handleAddCondition} 
                          variant="outline" 
                          disabled={loading || !newCondition.trim()}
                          className="w-full sm:w-auto min-h-[44px]"
                        >
                          Add
                        </Button>
                      </div>
                      {formData.medicalHistory.conditions.length > 0 && (
                        <div className="space-y-2">
                          {formData.medicalHistory.conditions.map((condition, index) => (
                            <div key={index} className="flex items-center justify-between bg-blue-50 p-3 sm:p-4 rounded-lg gap-2">
                              <span className="text-blue-800 text-sm sm:text-base break-words flex-1">{condition}</span>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleRemoveCondition(index)}
                                disabled={loading}
                                className="text-blue-600 hover:text-blue-700 flex-shrink-0 min-h-[44px] min-w-[44px] sm:min-w-0"
                              >
                                <span className="hidden sm:inline">Remove</span>
                                <X className="w-4 h-4 sm:hidden" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Medical Notes */}
                    <div>
                      <label className="block text-base sm:text-lg font-medium text-gray-900 mb-2">
                        Additional Medical Notes
                      </label>
                      <textarea
                        rows={4}
                        value={formData.medicalHistory.notes}
                        onChange={(e) => handleInputChange('medicalHistory.notes', e.target.value)}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                        placeholder={t('patientSettings.medical.notesPlaceholder')}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Security Section */}
              {activeSection === 'security' && (
                <div className="space-y-4 sm:space-y-6">
                  <div className="flex items-start sm:items-center gap-3 mb-4 sm:mb-6">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Shield className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Security Settings</h3>
                      <p className="text-sm sm:text-base text-gray-600">Manage your account security</p>
                    </div>
                  </div>

                  <div className="space-y-4 sm:space-y-6">
                    <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 text-sm sm:text-base">Change Password</h4>
                          <p className="text-xs sm:text-sm text-gray-600">Update your account password</p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowPasswordFields(!showPasswordFields)}
                          disabled={loading}
                          className="w-full sm:w-auto min-h-[44px]"
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
                          <div className="flex flex-col sm:flex-row gap-3">
                            <Button
                              type="button"
                              onClick={handlePasswordChange}
                              disabled={loading}
                              isLoading={loading}
                              className="bg-red-600 hover:bg-red-700 w-full sm:w-auto min-h-[44px]"
                            >
                              {loading ? 'Updating...' : 'Update Password'}
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setShowPasswordFields(false);
                                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                              }}
                              disabled={loading}
                              className="w-full sm:w-auto min-h-[44px]"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 text-sm sm:text-base">Two-Factor Authentication</h4>
                          <p className="text-xs sm:text-sm text-gray-600">Add an extra layer of security to your account</p>
                        </div>
                        <Badge className="bg-red-100 text-red-800 self-start sm:self-center">
                          Disabled
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Preferences Section */}
              {activeSection === 'preferences' && (
                <div className="space-y-4 sm:space-y-6">
                  <div className="flex items-start sm:items-center gap-3 mb-4 sm:mb-6">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Settings className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Preferences</h3>
                      <p className="text-sm sm:text-base text-gray-600">Customize your experience</p>
                    </div>
                  </div>

                  <div className="space-y-4 sm:space-y-6">
                    <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
                      <h4 className="font-medium text-gray-900 mb-4 text-sm sm:text-base">Notifications</h4>
                      <div className="space-y-4">
                        <div className="flex items-start sm:items-center justify-between gap-4">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 text-sm sm:text-base">Email Notifications</p>
                            <p className="text-xs sm:text-sm text-gray-600">Receive updates via email</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={preferences.emailNotifications}
                            onChange={(e) => setPreferences(prev => ({ ...prev, emailNotifications: e.target.checked }))}
                            className="h-5 w-5 sm:h-4 sm:w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded flex-shrink-0 mt-1 sm:mt-0"
                          />
                        </div>
                        <div className="flex items-start sm:items-center justify-between gap-4">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 text-sm sm:text-base">SMS Notifications</p>
                            <p className="text-xs sm:text-sm text-gray-600">Receive updates via SMS</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={preferences.smsNotifications}
                            onChange={(e) => setPreferences(prev => ({ ...prev, smsNotifications: e.target.checked }))}
                            className="h-5 w-5 sm:h-4 sm:w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded flex-shrink-0 mt-1 sm:mt-0"
                          />
                        </div>
                        <div className="flex items-start sm:items-center justify-between gap-4">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 text-sm sm:text-base">Appointment Reminders</p>
                            <p className="text-xs sm:text-sm text-gray-600">Get reminded about upcoming appointments</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={preferences.appointmentReminders}
                            onChange={(e) => setPreferences(prev => ({ ...prev, appointmentReminders: e.target.checked }))}
                            className="h-5 w-5 sm:h-4 sm:w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded flex-shrink-0 mt-1 sm:mt-0"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
                      <h4 className="font-medium text-gray-900 mb-4 text-sm sm:text-base">Language & Region</h4>
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
              <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 pt-6 sm:pt-8 border-t border-gray-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => window.location.reload()}
                  disabled={loading}
                  className="w-full sm:w-auto min-h-[44px] order-2 sm:order-1"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  isLoading={loading}
                  className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto sm:min-w-[120px] min-h-[44px] order-1 sm:order-2"
                >
                  {loading ? 'Saving...' : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PatientSettings;