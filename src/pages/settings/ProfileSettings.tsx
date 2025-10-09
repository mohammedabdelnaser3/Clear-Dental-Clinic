import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Card, Button, Input, Select, Alert, Avatar } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';
import { validateEmail, validatePhone, validateRequired, validateZipCode, validateDate } from '../../utils/validation';

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  specialization: string;
  licenseNumber: string;
  bio: string;
}

const ProfileSettings: React.FC = () => {
  const { t } = useTranslation();
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<FormData>({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    dateOfBirth: (user as any)?.dateOfBirth || '',
    gender: (user as any)?.gender || '',
    address: {
      street: user?.address?.street || '',
      city: user?.address?.city || '',
      state: user?.address?.state || '',
      zipCode: user?.address?.zipCode || '',
      country: user?.address?.country || 'US'
    },
    specialization: user?.specialization || '',
    licenseNumber: user?.licenseNumber || '',
    bio: user?.bio || ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        dateOfBirth: user.dateOfBirth || '',
        gender: user.gender || '',
        address: {
          street: user.address?.street || '',
          city: user.address?.city || '',
          state: user.address?.state || '',
          zipCode: user.address?.zipCode || '',
          country: user.address?.country || 'US'
        },
        specialization: user.specialization || '',
        licenseNumber: user.licenseNumber || '',
        bio: user.bio || ''
      });
    }
  }, [user]);

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
      const addressField = field.split('.')[1] as keyof typeof formData.address;
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

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    console.log(formData);
    e.preventDefault();
    setMessage(null);

    // Validate form before submission
    if (!validateForm()) {
      const errorMsg = 'Please fix the validation errors before submitting';
      toast.error(errorMsg);
      setMessage({ type: 'error', text: errorMsg });
      return;
    }

    setLoading(true);

    try {
      const { updateProfile } = await import('../../services/userService');
      
      // Prepare update data - only include fields that can be updated
      const updateData: any = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        address: formData.address
      };

      // Add professional fields for dentists
      if (user?.role === 'dentist') {
        updateData.specialization = formData.specialization;
        updateData.licenseNumber = formData.licenseNumber;
        updateData.bio = formData.bio;
      }

      await updateProfile(updateData);
      
      // Refresh user context to show updated data
      try {
        await refreshUser();
      } catch (refreshErr: any) {
        console.error('Failed to refresh user after profile update:', refreshErr);
        // Don't show error to user as the update was successful
      }
      
      toast.success(t('settings.profile.updateSuccess'));
      setMessage({ type: 'success', text: t('settings.profile.updateSuccess') });
      
      // Auto-dismiss success message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (_error: any) {
      console.error('Error updating profile:', {
        error: _error,
        message: _error.message,
        status: _error.response?.status
      });
      
      let errorMessage = t('settings.profile.updateError');
      
      // Handle specific error cases
      if (_error.response?.status === 401) {
        errorMessage = 'Your session has expired. Please log in again.';
        toast.error(errorMessage);
        setMessage({ type: 'error', text: errorMessage });
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else if (_error.response?.status === 403) {
        errorMessage = 'You do not have permission to update this profile.';
        toast.error(errorMessage);
        setMessage({ type: 'error', text: errorMessage });
      } else if (_error.response?.status === 404) {
        errorMessage = 'Profile not found. Please refresh the page and try again.';
        toast.error(errorMessage);
        setMessage({ type: 'error', text: errorMessage });
      } else if (_error.response?.status === 422) {
        errorMessage = 'Invalid data provided. Please check your inputs and try again.';
        toast.error(errorMessage);
        setMessage({ type: 'error', text: errorMessage });
      } else if (_error.code === 'ERR_NETWORK' || _error.message.includes('Network Error')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
        toast.error(errorMessage);
        setMessage({ type: 'error', text: errorMessage });
      } else {
        errorMessage = _error instanceof Error ? _error.message : errorMessage;
        toast.error(errorMessage);
        setMessage({ type: 'error', text: errorMessage });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      const errorMsg = t('settings.profileSettings.messages.avatarSizeLimit');
      toast.error(errorMsg);
      setMessage({ type: 'error', text: errorMsg });
      return;
    }

    // Validate file type (jpg, jpeg, png, gif)
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      const errorMsg = t('settings.profileSettings.messages.avatarInvalidType');
      toast.error(errorMsg);
      setMessage({ type: 'error', text: errorMsg });
      return;
    }

    try {
      setUploadingImage(true);
      setMessage(null);
      
      const { uploadProfileImage } = await import('../../services/userService');
      await uploadProfileImage(file);
      
      const successMsg = t('settings.profileSettings.messages.avatarUploadSuccess');
      toast.success(successMsg);
      setMessage({ type: 'success', text: successMsg });
      
      // Refresh user context after successful upload
      try {
        await refreshUser();
      } catch (refreshErr: any) {
        console.error('Failed to refresh user after avatar upload:', refreshErr);
        // Don't show error to user as the upload was successful
      }
      
      // Auto-dismiss success message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (_error: any) {
      console.error('Error uploading avatar:', {
        error: _error,
        message: _error.message,
        status: _error.response?.status
      });
      
      let errorMessage = t('settings.profileSettings.messages.avatarUploadError');
      
      // Handle specific error cases
      if (_error.response?.status === 401) {
        errorMessage = 'Your session has expired. Please log in again.';
        toast.error(errorMessage);
        setMessage({ type: 'error', text: errorMessage });
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else if (_error.response?.status === 413) {
        errorMessage = 'File is too large. Please upload a smaller image.';
        toast.error(errorMessage);
        setMessage({ type: 'error', text: errorMessage });
      } else if (_error.code === 'ERR_NETWORK' || _error.message.includes('Network Error')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
        toast.error(errorMessage);
        setMessage({ type: 'error', text: errorMessage });
      } else {
        errorMessage = _error instanceof Error ? _error.message : errorMessage;
        toast.error(errorMessage);
        setMessage({ type: 'error', text: errorMessage });
      }
    } finally {
      setUploadingImage(false);
    }
  };

  const genderOptions = [
    { value: '', label: t('settings.profileSettings.personalInfo.gender.select') },
    { value: 'male', label: t('settings.profileSettings.personalInfo.gender.male') },
    { value: 'female', label: t('settings.profileSettings.personalInfo.gender.female') },
    { value: 'other', label: t('settings.profileSettings.personalInfo.gender.other') },
    { value: 'prefer-not-to-say', label: t('settings.profileSettings.personalInfo.gender.preferNotToSay') }
  ];

  const stateOptions = [
    { value: '', label: t('settings.profileSettings.personalInfo.address.state.select') },
    { value: 'AL', label: t('settings.profileSettings.personalInfo.address.state.alabama') },
    { value: 'AK', label: t('settings.profileSettings.personalInfo.address.state.alaska') },
    { value: 'AZ', label: t('settings.profileSettings.personalInfo.address.state.arizona') },
    { value: 'AR', label: t('settings.profileSettings.personalInfo.address.state.arkansas') },
    { value: 'CA', label: t('settings.profileSettings.personalInfo.address.state.california') },
    { value: 'CO', label: t('settings.profileSettings.personalInfo.address.state.colorado') },
    { value: 'CT', label: t('settings.profileSettings.personalInfo.address.state.connecticut') },
    { value: 'DE', label: t('settings.profileSettings.personalInfo.address.state.delaware') },
    { value: 'FL', label: t('settings.profileSettings.personalInfo.address.state.florida') },
    { value: 'GA', label: t('settings.profileSettings.personalInfo.address.state.georgia') },
    // Add more states as needed
  ];

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card className="p-6">
        <div className="flex items-center gap-6">
          <div className="relative">
            <Avatar
              src={(user as any)?.avatar}
              alt={`${user?.firstName || ''} ${user?.lastName || ''}`}
              size="xl"
              fallback={`${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`}
            />
            <label className={`absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-2 transition-all duration-300 shadow-lg transform ${uploadingImage || loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-blue-700 hover:shadow-xl hover:scale-110 active:scale-95'}`}>
              {uploadingImage ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif"
                onChange={handleAvatarChange}
                className="hidden"
                disabled={uploadingImage || loading}
              />
            </label>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {user?.firstName} {user?.lastName}
            </h2>
            <p className="text-gray-600">{user?.email}</p>
            <p className="text-sm text-gray-500 capitalize">{user?.role}</p>
          </div>
        </div>
      </Card>

      {/* Profile Form */}
      <Card className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">{t('settings.profileSettings.personalInfo.title')}</h3>
        
        {message && (
          <Alert
            variant={message.type}
            className="mb-6"
            dismissible
          >
            {message.text}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Input
                label={t('settings.profileSettings.personalInfo.firstName')}
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
                label={t('settings.profileSettings.personalInfo.lastName')}
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                required
              />
              {validationErrors.lastName && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.lastName}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Input
                label={t('settings.profileSettings.personalInfo.email')}
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
              />
              {validationErrors.email && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
              )}
            </div>
            <div>
              <Input
                label={t('settings.profileSettings.personalInfo.phone')}
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
              />
              {validationErrors.phone && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.phone}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Input
                label={t('settings.profileSettings.personalInfo.dob')}
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
              />
              {validationErrors.dateOfBirth && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.dateOfBirth}</p>
              )}
            </div>
            <Select
              label={t('settings.profileSettings.personalInfo.gender.label')}
              options={genderOptions}
              value={formData.gender}
              onChange={(e) => handleInputChange('gender', e.target.value)}
            />
          </div>

          {/* Address */}
          <div className="border-t border-gray-200 pt-6">
                          <h4 className="text-md font-medium text-gray-900 mb-4">{t('settings.profileSettings.personalInfo.address.title')}</h4>
            <div className="space-y-4">
              <Input
                                  label={t('settings.profileSettings.personalInfo.address.street')}
                value={formData.address.street}
                onChange={(e) => handleInputChange('address.street', e.target.value)}
              />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label={t('settings.profileSettings.personalInfo.address.city')}
                  value={formData.address.city}
                  onChange={(e) => handleInputChange('address.city', e.target.value)}
                />
                <Select
                  label={t('settings.profileSettings.personalInfo.address.state.label')}
                  options={stateOptions}
                  value={formData.address.state}
                  onChange={(e) => handleInputChange('address.state', e.target.value)}
                />
                <div>
                  <Input
                    label={t('settings.profileSettings.personalInfo.address.zip')}
                    value={formData.address.zipCode}
                    onChange={(e) => handleInputChange('address.zipCode', e.target.value)}
                  />
                  {validationErrors['address.zipCode'] && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors['address.zipCode']}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Professional Information (for dentists) */}
          {user?.role === 'dentist' && (
            <div className="border-t border-gray-200 pt-6">
              <h4 className="text-md font-medium text-gray-900 mb-4">{t('settings.profileSettings.professionalInfo.title')}</h4>
              <div className="space-y-4">
                <Input
                                      label={t('settings.profileSettings.professionalInfo.specialization')}
                  value={formData.specialization}
                  onChange={(e) => handleInputChange('specialization', e.target.value)}
                                      placeholder={t('settings.profileSettings.professionalInfo.specializationPlaceholder')}
                />
                <Input
                                      label={t('settings.profileSettings.professionalInfo.licenseNumber')}
                  value={formData.licenseNumber}
                  onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('settings.profileSettings.professionalInfo.bio')}
                  </label>
                  <textarea
                    rows={4}
                    value={formData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder={t('settings.profileSettings.professionalInfo.bioPlaceholder')}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end pt-6 border-t border-gray-200">
            <Button
              type="submit"
              isLoading={loading}
              disabled={loading || uploadingImage}
            >
              {loading ? 'Saving...' : t('settings.profile.saveChanges')}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default ProfileSettings;