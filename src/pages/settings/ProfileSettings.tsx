import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, Button, Input, Select, Alert, Avatar } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';

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
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const { updateProfile } = await import('../../services/userService');
      await updateProfile(formData);
              setMessage({ type: 'success', text: t('settings.profileSettings.messages.updateSuccess') });
    } catch (_error) {
              const errorMessage = _error instanceof Error ? _error.message : t('settings.profileSettings.messages.updateError');
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setMessage({ type: 'error', text: t('settings.profileSettings.messages.avatarSizeLimit') });
        return;
      }
      try {
        setLoading(true);
        const { uploadProfileImage } = await import('../../services/userService');
await uploadProfileImage(file);
        setMessage({ type: 'success', text: t('settings.profileSettings.messages.avatarUploadSuccess') });
        // Update the form data with the new profile image URL
        // Note: You might want to refresh the user context here
      } catch (_error) {
        const errorMessage = _error instanceof Error ? _error.message : t('settings.profileSettings.messages.avatarUploadError');
        setMessage({ type: 'error', text: errorMessage });
      } finally {
        setLoading(false);
      }
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
            <label className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-2 cursor-pointer hover:bg-blue-700 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
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
            <Input
              label={t('settings.profileSettings.personalInfo.firstName')}
              value={formData.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              required
            />
            <Input
                              label={t('settings.profileSettings.personalInfo.lastName')}
              value={formData.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
                              label={t('settings.profileSettings.personalInfo.email')}
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              required
            />
            <Input
                              label={t('settings.profileSettings.personalInfo.phone')}
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
                              label={t('settings.profileSettings.personalInfo.dob')}
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
            />
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
                <Input
                                      label={t('settings.profileSettings.personalInfo.address.zip')}
                  value={formData.address.zipCode}
                  onChange={(e) => handleInputChange('address.zipCode', e.target.value)}
                />
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
              disabled={loading}
            >
              {loading ? t('settings.profileSettings.buttons.saving') : t('settings.profileSettings.buttons.saveChanges')}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default ProfileSettings;