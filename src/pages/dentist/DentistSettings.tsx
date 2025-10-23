import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { Card, Button, Input, Select, Alert, Avatar, Badge, Textarea } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';
import { dentistService, type Dentist, type DentistClinic, type DentistAvailability } from '../../services/dentistService';
import { userService } from '../../services/userService';
import {
  User,
  Phone,
  MapPin,
  Shield,
  Save,
  X,
  Check,
  AlertCircle,
  Camera,
  Briefcase,
  Settings,
  Building2,
  Clock,
  Award,
  GraduationCap,
  Globe,
  Bell
} from 'lucide-react';
import { validateEmail, validatePhone, validateRequired, validateZipCode } from '../../utils/validation';

const DentistSettings: React.FC = () => {
  const { user, refreshUser, changePassword } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeSection, setActiveSection] = useState('personal');
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [dentist, setDentist] = useState<Dentist | null>(null);
  const [clinics, setClinics] = useState<DentistClinic[]>([]);
  const [availability, setAvailability] = useState<DentistAvailability[]>([]);
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
    specialization: '',
    licenseNumber: '',
    bio: '',
    yearsOfExperience: 0,
    education: [] as string[],
    certifications: [] as string[]
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
    language: 'en',
    timezone: 'Africa/Cairo'
  });

  const [newEducation, setNewEducation] = useState('');
  const [newCertification, setNewCertification] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Keyboard navigation for tabs
  const handleTabKeyDown = (e: React.KeyboardEvent, sectionId: string) => {
    const sectionIds = sections.map(s => s.id);
    const currentIndex = sectionIds.indexOf(sectionId);
    
    switch (e.key) {
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : sectionIds.length - 1;
        setActiveSection(sectionIds[prevIndex]);
        // Focus management - focus the newly selected tab
        setTimeout(() => {
          const newTab = document.getElementById(`${sectionIds[prevIndex]}-tab`);
          newTab?.focus();
        }, 0);
        break;
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault();
        const nextIndex = currentIndex < sectionIds.length - 1 ? currentIndex + 1 : 0;
        setActiveSection(sectionIds[nextIndex]);
        // Focus management - focus the newly selected tab
        setTimeout(() => {
          const newTab = document.getElementById(`${sectionIds[nextIndex]}-tab`);
          newTab?.focus();
        }, 0);
        break;
      case 'Home':
        e.preventDefault();
        setActiveSection(sectionIds[0]);
        setTimeout(() => {
          const newTab = document.getElementById(`${sectionIds[0]}-tab`);
          newTab?.focus();
        }, 0);
        break;
      case 'End':
        e.preventDefault();
        setActiveSection(sectionIds[sectionIds.length - 1]);
        setTimeout(() => {
          const newTab = document.getElementById(`${sectionIds[sectionIds.length - 1]}-tab`);
          newTab?.focus();
        }, 0);
        break;
    }
  };

  useEffect(() => {
    const fetchDentistData = async () => {
      try {
        setLoading(true);
        setMessage(null);
        
        const userId = user?.id;
        if (!userId) {
          toast.error('User not authenticated. Please sign in again.');
          setLoading(false);
          return;
        }
        const dentistData = await dentistService.getDentistById(userId);
        setDentist(dentistData);
        
        // Populate form data
        setFormData({
          firstName: dentistData.firstName || '',
          lastName: dentistData.lastName || '',
          email: dentistData.email || '',
          phone: dentistData.phone || '',
          dateOfBirth: '',
          gender: 'male',
          address: {
            street: '',
            city: '',
            state: '',
            zipCode: '',
            country: 'Egypt'
          },
          specialization: dentistData.specialization || '',
          licenseNumber: dentistData.licenseNumber || '',
          bio: dentistData.bio || '',
          yearsOfExperience: dentistData.yearsOfExperience || 0,
          education: dentistData.education || [],
          certifications: dentistData.certifications || []
        });

        // Fetch clinics
        try {
          const clinicsData = await dentistService.getDentistClinics(userId);
          setClinics(clinicsData);
        } catch (err) {
          console.warn('Failed to fetch clinics:', err);
        }

        // Fetch availability
        try {
          const availabilityData = await dentistService.getDentistAvailability(userId);
          setAvailability(availabilityData);
        } catch (err) {
          console.warn('Failed to fetch availability:', err);
        }
      } catch (err: any) {
        console.error('Error fetching dentist data:', err);
        const errorMsg = err.message || 'Failed to load dentist data';
        toast.error(errorMsg);
        setMessage({ type: 'error', text: errorMsg });
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchDentistData();
    }
  }, [user?.id]);

  const handleInputChange = (field: string, value: string | number) => {
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
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleAddEducation = () => {
    if (newEducation.trim()) {
      setFormData(prev => ({
        ...prev,
        education: [...prev.education, newEducation.trim()]
      }));
      setNewEducation('');
    }
  };

  const handleRemoveEducation = (index: number) => {
    setFormData(prev => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index)
    }));
  };

  const handleAddCertification = () => {
    if (newCertification.trim()) {
      setFormData(prev => ({
        ...prev,
        certifications: [...prev.certifications, newCertification.trim()]
      }));
      setNewCertification('');
    }
  };

  const handleRemoveCertification = (index: number) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== index)
    }));
  };

  const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      const errorMsg = 'File size must be less than 5MB';
      toast.error(errorMsg);
      setMessage({ type: 'error', text: errorMsg });
      return;
    }

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
      
      if (refreshUser) {
        await refreshUser();
      }
      
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      console.error('Error uploading profile picture:', error);
      const errorMsg = error.message || 'Failed to upload profile picture';
      toast.error(errorMsg);
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    const firstNameValidation = validateRequired(formData.firstName, 'First name');
    if (!firstNameValidation.isValid) {
      errors.firstName = firstNameValidation.error!;
    }

    const lastNameValidation = validateRequired(formData.lastName, 'Last name');
    if (!lastNameValidation.isValid) {
      errors.lastName = lastNameValidation.error!;
    }

    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.isValid) {
      errors.email = emailValidation.error!;
    }

    const phoneValidation = validatePhone(formData.phone);
    if (!phoneValidation.isValid) {
      errors.phone = phoneValidation.error!;
    }

    const specializationValidation = validateRequired(formData.specialization, 'Specialization');
    if (!specializationValidation.isValid) {
      errors.specialization = specializationValidation.error!;
    }

    const licenseValidation = validateRequired(formData.licenseNumber, 'License number');
    if (!licenseValidation.isValid) {
      errors.licenseNumber = licenseValidation.error!;
    }

    const zipValidation = validateZipCode(formData.address.zipCode);
    if (!zipValidation.isValid) {
      errors['address.zipCode'] = zipValidation.error!;
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!validateForm()) {
      const errorMsg = 'Please fix the validation errors before submitting';
      toast.error(errorMsg);
      setMessage({ type: 'error', text: errorMsg });
      return;
    }

    if (!dentist?.id) {
      const errorMsg = 'Dentist ID not found. Please refresh the page and try again.';
      toast.error(errorMsg);
      setMessage({ type: 'error', text: errorMsg });
      return;
    }

    setLoading(true);

    try {
      const updateData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        specialization: formData.specialization,
        licenseNumber: formData.licenseNumber,
        bio: formData.bio,
        yearsOfExperience: formData.yearsOfExperience,
        education: formData.education,
        certifications: formData.certifications
      };
      
      await dentistService.updateDentist(dentist.id, updateData);
      toast.success('Profile updated successfully!');
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      
      if (refreshUser) {
        await refreshUser();
      }
      
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      console.error('Error updating dentist profile:', err);
      const errorMsg = err.message || 'Failed to update profile';
      toast.error(errorMsg);
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    
    if (!passwordData.currentPassword) {
      const errorMsg = 'Current password is required';
      toast.error(errorMsg);
      setMessage({ type: 'error', text: errorMsg });
      return;
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      const errorMsg = 'New passwords do not match';
      toast.error(errorMsg);
      setMessage({ type: 'error', text: errorMsg });
      return;
    }
    
    if (passwordData.newPassword.length < 8) {
      const errorMsg = 'Password must be at least 8 characters long';
      toast.error(errorMsg);
      setMessage({ type: 'error', text: errorMsg });
      return;
    }
    
    if (passwordData.currentPassword === passwordData.newPassword) {
      const errorMsg = 'New password must be different from current password';
      toast.error(errorMsg);
      setMessage({ type: 'error', text: errorMsg });
      return;
    }
    
    setLoading(true);
    try {
      await changePassword(passwordData.currentPassword, passwordData.newPassword);
      
      toast.success('Password updated successfully');
      setMessage({ type: 'success', text: 'Password updated successfully' });
      
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordFields(false);
      
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      console.error('Error changing password:', error);
      const errorMsg = error.message || 'Failed to update password';
      toast.error(errorMsg);
      setMessage({ type: 'error', text: errorMsg });
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

  const languageOptions = [
    { value: 'en', label: 'English' },
    { value: 'ar', label: 'Arabic' }
  ];

  const timezoneOptions = [
    { value: 'Africa/Cairo', label: 'Cairo (GMT+2)' },
    { value: 'Europe/London', label: 'London (GMT+0)' },
    { value: 'America/New_York', label: 'New York (GMT-5)' }
  ];

  const sections = [
    { id: 'personal', label: 'Personal Information', icon: <User className="w-4 h-4" /> },
    { id: 'professional', label: 'Professional Information', icon: <Briefcase className="w-4 h-4" /> },
    { id: 'clinics', label: 'Clinic Associations', icon: <Building2 className="w-4 h-4" /> },
    { id: 'availability', label: 'Availability', icon: <Clock className="w-4 h-4" /> },
    { id: 'security', label: 'Security', icon: <Shield className="w-4 h-4" /> },
    { id: 'preferences', label: 'Preferences', icon: <Settings className="w-4 h-4" /> }
  ];

  const calculateProfileCompletion = (): number => {
    let completed = 0;
    const total = 10;

    if (formData.firstName && formData.lastName) completed++;
    if (formData.email) completed++;
    if (formData.phone) completed++;
    if (formData.specialization) completed++;
    if (formData.licenseNumber) completed++;
    if (formData.bio) completed++;
    if (formData.yearsOfExperience > 0) completed++;
    if (formData.education.length > 0) completed++;
    if (formData.certifications.length > 0) completed++;
    if (clinics.length > 0) completed++;

    return Math.round((completed / total) * 100);
  };

  if (loading && !dentist) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center" role="status" aria-live="polite">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" aria-hidden="true"></div>
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Skip links for keyboard users */}
      <div className="sr-only focus-within:not-sr-only">
        <a
          href="#main-content"
          className="absolute top-4 left-4 z-50 px-4 py-2 bg-blue-600 text-white rounded-md shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Skip to main content
        </a>
        <a
          href="#settings-navigation"
          className="absolute top-4 left-40 z-50 px-4 py-2 bg-blue-600 text-white rounded-md shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Skip to navigation
        </a>
      </div>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div id="main-content" className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-1 sm:mb-2">Dentist Settings</h1>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600">
              Manage your professional profile and preferences
            </p>
          </div>

          {/* Profile Header Card */}
          <Card className="p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8 bg-gradient-to-r from-white to-blue-50 border-0 shadow-xl">
            <div className="flex flex-col lg:flex-row items-center lg:items-start gap-4 sm:gap-6 lg:gap-8">
              <div className="relative">
                <Avatar
                  src={user?.profileImage}
                  alt={`Dr. ${formData.firstName} ${formData.lastName}`}
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
                  aria-label="Upload profile picture"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage || loading}
                  className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 bg-blue-600 text-white rounded-full p-2 sm:p-3 hover:bg-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed min-w-[44px] min-h-[44px] flex items-center justify-center"
                  aria-label="Upload profile picture"
                >
                  {uploadingImage ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                </button>
              </div>
              
              <div className="flex-1 text-center lg:text-left">
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                  Dr. {formData.firstName} {formData.lastName}
                </h2>
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 sm:gap-3 mb-2 sm:mb-3">
                  <Badge className="bg-blue-100 text-blue-800 px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium">
                    {formData.specialization || 'Dentist'}
                  </Badge>
                  <Badge className="bg-green-100 text-green-800 px-2 sm:px-3 py-1 text-xs sm:text-sm">
                    Profile {calculateProfileCompletion()}% Complete
                  </Badge>
                </div>
                <p className="text-sm sm:text-base lg:text-lg text-gray-600 break-words">{formData.email}</p>
              </div>
            </div>
          </Card>

          {/* Navigation Tabs - Horizontal on tablet/desktop, Vertical on mobile */}
          <div id="settings-navigation" className="mb-6 sm:mb-8">
            {/* Mobile: Vertical tabs */}
            <div className="block md:hidden">
              <div className="space-y-2" role="tablist" aria-label="Settings sections">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    id={`${section.id}-tab-mobile`}
                    onClick={() => setActiveSection(section.id)}
                    onKeyDown={(e) => handleTabKeyDown(e, section.id)}
                    disabled={loading}
                    role="tab"
                    aria-selected={activeSection === section.id}
                    aria-controls={`${section.id}-section`}
                    aria-label={`View ${section.label} settings`}
                    tabIndex={activeSection === section.id ? 0 : -1}
                    className={`w-full flex items-center gap-3 py-3 px-4 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      activeSection === section.id
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                    }`}
                  >
                    <span aria-hidden="true">{section.icon}</span>
                    <span className="flex-1 text-left">{section.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Tablet/Desktop: Horizontal tabs */}
            <div className="hidden md:block border-b border-gray-200">
              <nav className="-mb-px flex space-x-4 lg:space-x-8 overflow-x-auto" role="tablist" aria-label="Settings sections">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    id={`${section.id}-tab`}
                    onClick={() => setActiveSection(section.id)}
                    onKeyDown={(e) => handleTabKeyDown(e, section.id)}
                    disabled={loading}
                    role="tab"
                    aria-selected={activeSection === section.id}
                    aria-controls={`${section.id}-section`}
                    aria-label={`View ${section.label} settings`}
                    tabIndex={activeSection === section.id ? 0 : -1}
                    className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      activeSection === section.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <span aria-hidden="true">{section.icon}</span>
                    <span className="hidden lg:inline">{section.label}</span>
                    <span className="lg:hidden">{section.label.split(' ')[0]}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Messages */}
          {message && (
            <div role="alert" aria-live="polite" className="mb-6">
              <Alert variant={message.type} className="w-full">
                <div className="flex items-center gap-2">
                  {message.type === 'success' ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <AlertCircle className="w-4 h-4" />
                  )}
                  {message.text}
                </div>
              </Alert>
            </div>
          )}

          {/* Form Content */}
          <Card className="p-4 sm:p-6 lg:p-8">
            <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
              {/* Personal Information Section */}
              {activeSection === 'personal' && (
                <section 
                  id="personal-section" 
                  role="tabpanel" 
                  aria-labelledby="personal-tab"
                  className="space-y-4 sm:space-y-6"
                >
                  <div className="flex items-start sm:items-center gap-3 mb-4 sm:mb-6">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0" aria-hidden="true">
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
                        <p className="mt-1 text-sm text-red-600" role="alert" aria-live="polite">{validationErrors.firstName}</p>
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
                        <p className="mt-1 text-sm text-red-600" role="alert" aria-live="polite">{validationErrors.lastName}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <Input
                        label="Email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        required
                      />
                      {validationErrors.email && (
                        <p className="mt-1 text-sm text-red-600" role="alert" aria-live="polite">{validationErrors.email}</p>
                      )}
                    </div>
                    <div>
                      <Input
                        label="Phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        required
                      />
                      {validationErrors.phone && (
                        <p className="mt-1 text-sm text-red-600" role="alert" aria-live="polite">{validationErrors.phone}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
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

                  <fieldset className="space-y-4">
                    <legend className="text-sm font-medium text-gray-700">Address</legend>
                    <Input
                      label="Street"
                      value={formData.address.street}
                      onChange={(e) => handleInputChange('address.street', e.target.value)}
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                      <Input
                        label="City"
                        value={formData.address.city}
                        onChange={(e) => handleInputChange('address.city', e.target.value)}
                      />
                      <Select
                        label="State/Province"
                        options={stateOptions}
                        value={formData.address.state}
                        onChange={(e) => handleInputChange('address.state', e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                      <div>
                        <Input
                          label="ZIP Code"
                          value={formData.address.zipCode}
                          onChange={(e) => handleInputChange('address.zipCode', e.target.value)}
                        />
                        {validationErrors['address.zipCode'] && (
                          <p className="mt-1 text-sm text-red-600" role="alert" aria-live="polite">{validationErrors['address.zipCode']}</p>
                        )}
                      </div>
                      <Input
                        label="Country"
                        value={formData.address.country}
                        onChange={(e) => handleInputChange('address.country', e.target.value)}
                      />
                    </div>
                  </fieldset>

                  <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 sm:pt-6">
                    <Button type="submit" disabled={loading} className="w-full sm:w-auto min-h-[44px]">
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </section>
              )}

              {/* Professional Information Section */}
              {activeSection === 'professional' && (
                <section 
                  id="professional-section" 
                  role="tabpanel" 
                  aria-labelledby="professional-tab"
                  className="space-y-4 sm:space-y-6"
                >
                  <div className="flex items-start sm:items-center gap-3 mb-4 sm:mb-6">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0" aria-hidden="true">
                      <Briefcase className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Professional Information</h3>
                      <p className="text-sm sm:text-base text-gray-600">Manage your professional credentials and experience</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <Input
                        label="Specialization"
                        value={formData.specialization}
                        onChange={(e) => handleInputChange('specialization', e.target.value)}
                        required
                      />
                      {validationErrors.specialization && (
                        <p className="mt-1 text-sm text-red-600">{validationErrors.specialization}</p>
                      )}
                    </div>
                    <div>
                      <Input
                        label="License Number"
                        value={formData.licenseNumber}
                        onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
                        required
                      />
                      {validationErrors.licenseNumber && (
                        <p className="mt-1 text-sm text-red-600">{validationErrors.licenseNumber}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Input
                      label="Years of Experience"
                      type="number"
                      min="0"
                      value={formData.yearsOfExperience}
                      onChange={(e) => handleInputChange('yearsOfExperience', parseInt(e.target.value) || 0)}
                    />
                  </div>

                  <div>
                    <Textarea
                      label="Professional Bio"
                      value={formData.bio}
                      onChange={(e) => handleInputChange('bio', e.target.value)}
                      rows={4}
                      placeholder="Tell us about your professional background and expertise..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                      <GraduationCap className="w-4 h-4" />
                      Education
                    </label>
                    <div className="space-y-3">
                      {formData.education.map((edu, index) => (
                        <div key={index} className="flex items-start sm:items-center gap-2 p-3 bg-blue-50 rounded-lg">
                          <span className="flex-1 text-sm sm:text-base text-gray-700 break-words">{edu}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveEducation(index)}
                            className="text-red-600 hover:text-red-700 min-w-[44px] min-h-[44px] flex items-center justify-center flex-shrink-0"
                            aria-label="Remove education"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      <div className="flex flex-col sm:flex-row gap-2">
                        <div className="flex-1">
                          <Input
                            placeholder="Add education (e.g., DDS from University of Cairo)"
                            value={newEducation}
                            onChange={(e) => setNewEducation(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddEducation();
                              }
                            }}
                          />
                        </div>
                        <Button type="button" onClick={handleAddEducation} variant="outline" className="w-full sm:w-auto min-h-[44px]">
                          Add
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                      <Award className="w-4 h-4" />
                      Certifications
                    </label>
                    <div className="space-y-3">
                      {formData.certifications.map((cert, index) => (
                        <div key={index} className="flex items-start sm:items-center gap-2 p-3 bg-green-50 rounded-lg">
                          <span className="flex-1 text-sm sm:text-base text-gray-700 break-words">{cert}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveCertification(index)}
                            className="text-red-600 hover:text-red-700 min-w-[44px] min-h-[44px] flex items-center justify-center flex-shrink-0"
                            aria-label="Remove certification"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      <div className="flex flex-col sm:flex-row gap-2">
                        <div className="flex-1">
                          <Input
                            placeholder="Add certification (e.g., Board Certified Orthodontist)"
                            value={newCertification}
                            onChange={(e) => setNewCertification(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddCertification();
                              }
                            }}
                          />
                        </div>
                        <Button type="button" onClick={handleAddCertification} variant="outline" className="w-full sm:w-auto min-h-[44px]">
                          Add
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 sm:pt-6">
                    <Button type="submit" disabled={loading} className="w-full sm:w-auto min-h-[44px]">
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </section>
              )}

              {/* Clinic Associations Section */}
              {activeSection === 'clinics' && (
                <section 
                  id="clinics-section" 
                  role="tabpanel" 
                  aria-labelledby="clinics-tab"
                  className="space-y-4 sm:space-y-6"
                >
                  <div className="flex items-start sm:items-center gap-3 mb-4 sm:mb-6">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Clinic Associations</h3>
                      <p className="text-sm sm:text-base text-gray-600">Manage your clinic affiliations and primary clinic</p>
                    </div>
                  </div>

                  {clinics.length > 0 ? (
                    <div className="space-y-4">
                      {clinics.map((clinic) => (
                        <div key={clinic.id} className="p-4 sm:p-6 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                          <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between mb-4 gap-3">
                            <div className="flex items-start gap-3 flex-1">
                              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-gray-900 text-sm sm:text-base break-words">{clinic.name}</h4>
                                {clinic.branchName && (
                                  <p className="text-xs sm:text-sm text-gray-600 break-words">{clinic.branchName}</p>
                                )}
                              </div>
                            </div>
                            {clinic.isPrimary && (
                              <Badge className="bg-green-100 text-green-800 text-xs sm:text-sm flex-shrink-0">Primary</Badge>
                            )}
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-start gap-2 text-xs sm:text-sm text-gray-600">
                              <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                              <span className="break-words">
                                {clinic.address.street}, {clinic.address.city}, {clinic.address.state} {clinic.address.zipCode}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                              <Phone className="w-4 h-4 flex-shrink-0" />
                              <span className="break-words">{clinic.phone}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 sm:py-12 bg-gray-50 rounded-lg px-4">
                      <Building2 className="w-10 h-10 sm:w-12 sm:h-12 text-gray-600 mx-auto mb-3 sm:mb-4" />
                      <p className="text-sm sm:text-base text-gray-600">No clinic affiliations found</p>
                      <p className="text-xs sm:text-sm text-gray-500 mt-2">Contact your administrator to be assigned to clinics</p>
                    </div>
                  )}
                </section>
              )}

              {/* Availability Section */}
              {activeSection === 'availability' && (
                <section 
                  id="availability-section" 
                  role="tabpanel" 
                  aria-labelledby="availability-tab"
                  className="space-y-4 sm:space-y-6"
                >
                  <div className="flex items-start sm:items-center gap-3 mb-4 sm:mb-6">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Clock className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Availability</h3>
                      <p className="text-sm sm:text-base text-gray-600">Set your working hours for each clinic</p>
                    </div>
                  </div>

                  {availability.length > 0 ? (
                    <div className="space-y-4 sm:space-y-6">
                      {availability.map((avail) => (
                        <div key={avail.clinicId} className="p-4 sm:p-6 border border-gray-200 rounded-lg">
                          <h4 className="font-semibold text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base break-words">{avail.clinicName}</h4>
                          <div className="space-y-2 sm:space-y-3">
                            {Object.entries(avail.schedule).map(([day, slots]) => (
                              <div key={day} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-orange-50 rounded-lg gap-2">
                                <span className="font-medium text-gray-700 capitalize text-sm sm:text-base">{day}</span>
                                <div className="flex flex-wrap gap-2">
                                  {slots.map((slot, index) => (
                                    <span key={index} className="text-xs sm:text-sm text-gray-600 bg-white px-2 py-1 rounded">
                                      {slot.start} - {slot.end}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 sm:py-12 bg-gray-50 rounded-lg px-4">
                      <Clock className="w-10 h-10 sm:w-12 sm:h-12 text-gray-600 mx-auto mb-3 sm:mb-4" />
                      <p className="text-sm sm:text-base text-gray-600">No availability schedule set</p>
                      <p className="text-xs sm:text-sm text-gray-500 mt-2">Contact your administrator to set up your schedule</p>
                    </div>
                  )}
                </section>
              )}

              {/* Security Section */}
              {activeSection === 'security' && (
                <section 
                  id="security-section" 
                  role="tabpanel" 
                  aria-labelledby="security-tab"
                  className="space-y-4 sm:space-y-6"
                >
                  <div className="flex items-start sm:items-center gap-3 mb-4 sm:mb-6">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Shield className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Security</h3>
                      <p className="text-sm sm:text-base text-gray-600">Manage your password and security settings</p>
                    </div>
                  </div>

                  <div className="space-y-4 sm:space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-gray-50 rounded-lg gap-3">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 text-sm sm:text-base">Password</h4>
                        <p className="text-xs sm:text-sm text-gray-600">Change your account password</p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowPasswordFields(!showPasswordFields)}
                        className="w-full sm:w-auto min-h-[44px]"
                      >
                        {showPasswordFields ? 'Cancel' : 'Change Password'}
                      </Button>
                    </div>

                    {showPasswordFields && (
                      <form onSubmit={handlePasswordChange} className="space-y-4 p-4 sm:p-6 border border-gray-200 rounded-lg">
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
                          helperText="Must be at least 8 characters long"
                        />
                        <Input
                          label="Confirm New Password"
                          type="password"
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          required
                        />
                        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setShowPasswordFields(false);
                              setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                            }}
                            className="w-full sm:w-auto min-h-[44px]"
                          >
                            Cancel
                          </Button>
                          <Button type="submit" disabled={loading} className="w-full sm:w-auto min-h-[44px]">
                            {loading ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Updating...
                              </>
                            ) : (
                              <>
                                <Save className="w-4 h-4 mr-2" />
                                Update Password
                              </>
                            )}
                          </Button>
                        </div>
                      </form>
                    )}
                  </div>
                </section>
              )}

              {/* Preferences Section */}
              {activeSection === 'preferences' && (
                <section 
                  id="preferences-section" 
                  role="tabpanel" 
                  aria-labelledby="preferences-tab"
                  className="space-y-4 sm:space-y-6"
                >
                  <div className="flex items-start sm:items-center gap-3 mb-4 sm:mb-6">
                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Settings className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Preferences</h3>
                      <p className="text-sm sm:text-base text-gray-600">Customize your notification and display preferences</p>
                    </div>
                  </div>

                  <div className="space-y-4 sm:space-y-6">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-3 sm:mb-4 flex items-center gap-2">
                        <Bell className="w-4 h-4" />
                        Notifications
                      </h4>
                      <div className="space-y-3">
                        <label htmlFor="email-notifications" className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-gray-50 rounded-lg cursor-pointer gap-3 min-h-[44px]">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 text-sm sm:text-base">Email Notifications</div>
                            <div id="email-notifications-desc" className="text-xs sm:text-sm text-gray-600">Receive notifications via email</div>
                          </div>
                          <input
                            id="email-notifications"
                            type="checkbox"
                            checked={preferences.emailNotifications}
                            onChange={(e) => setPreferences(prev => ({ ...prev, emailNotifications: e.target.checked }))}
                            aria-describedby="email-notifications-desc"
                            className="h-6 w-6 text-blue-600 rounded focus:ring-blue-500 flex-shrink-0"
                          />
                        </label>
                        <label htmlFor="sms-notifications" className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-gray-50 rounded-lg cursor-pointer gap-3 min-h-[44px]">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 text-sm sm:text-base">SMS Notifications</div>
                            <div id="sms-notifications-desc" className="text-xs sm:text-sm text-gray-600">Receive notifications via SMS</div>
                          </div>
                          <input
                            id="sms-notifications"
                            type="checkbox"
                            checked={preferences.smsNotifications}
                            onChange={(e) => setPreferences(prev => ({ ...prev, smsNotifications: e.target.checked }))}
                            aria-describedby="sms-notifications-desc"
                            className="h-6 w-6 text-blue-600 rounded focus:ring-blue-500 flex-shrink-0"
                          />
                        </label>
                        <label htmlFor="appointment-reminders" className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-gray-50 rounded-lg cursor-pointer gap-3 min-h-[44px]">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 text-sm sm:text-base">Appointment Reminders</div>
                            <div id="appointment-reminders-desc" className="text-xs sm:text-sm text-gray-600">Get reminders for upcoming appointments</div>
                          </div>
                          <input
                            id="appointment-reminders"
                            type="checkbox"
                            checked={preferences.appointmentReminders}
                            onChange={(e) => setPreferences(prev => ({ ...prev, appointmentReminders: e.target.checked }))}
                            aria-describedby="appointment-reminders-desc"
                            className="h-6 w-6 text-blue-600 rounded focus:ring-blue-500 flex-shrink-0"
                          />
                        </label>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                          <Globe className="w-4 h-4" />
                          Language
                        </label>
                        <Select
                          options={languageOptions}
                          value={preferences.language}
                          onChange={(e) => setPreferences(prev => ({ ...prev, language: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Timezone
                        </label>
                        <Select
                          options={timezoneOptions}
                          value={preferences.timezone}
                          onChange={(e) => setPreferences(prev => ({ ...prev, timezone: e.target.value }))}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 sm:pt-6">
                    <Button type="button" disabled={loading} className="w-full sm:w-auto min-h-[44px]">
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save Preferences
                        </>
                      )}
                    </Button>
                  </div>
                </section>
              )}
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DentistSettings;
