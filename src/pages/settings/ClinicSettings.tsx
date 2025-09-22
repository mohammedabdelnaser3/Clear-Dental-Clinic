import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, Button, Input, Select, Alert, Badge } from '../../components/ui';
import { useClinic } from '../../hooks/useClinic';
import type { OperatingHours } from '../../types';

const ClinicSettings: React.FC = () => {
  const { t } = useTranslation();
  const { selectedClinic, updateClinic } = useClinic();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [formData, setFormData] = useState({
    name: selectedClinic?.name || '',
    description: selectedClinic?.description || '',
    phone: selectedClinic?.phone || '',
    email: selectedClinic?.email || '',
    website: selectedClinic?.website || '',
    address: {
      street: selectedClinic?.address?.street || '',
      city: selectedClinic?.address?.city || '',
      state: selectedClinic?.address?.state || '',
      zipCode: selectedClinic?.address?.zipCode || '',
      country: selectedClinic?.address?.country || 'US'
    },
    operatingHours: selectedClinic?.operatingHours || [
      { day: 'monday', open: '09:00', close: '17:00', closed: false },
      { day: 'tuesday', open: '09:00', close: '17:00', closed: false },
      { day: 'wednesday', open: '09:00', close: '17:00', closed: false },
      { day: 'thursday', open: '09:00', close: '17:00', closed: false },
      { day: 'friday', open: '09:00', close: '17:00', closed: false },
      { day: 'saturday', open: '09:00', close: '13:00', closed: false },
      { day: 'sunday', open: '09:00', close: '17:00', closed: true }
    ] as OperatingHours[],
    services: selectedClinic?.services || [],
    emergencyContact: selectedClinic?.emergencyContact || ''
  });

  const [newService, setNewService] = useState('');

  const handleInputChange = (field: string, value: any) => {
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

  const handleOperatingHoursChange = (day: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      operatingHours: prev.operatingHours.map(hours => 
        hours.day === day 
          ? { ...hours, [field]: value }
          : hours
      )
    }));
  };

  const handleAddService = () => {
    if (newService.trim() && !formData.services.includes(newService.trim())) {
      setFormData(prev => ({
        ...prev,
        services: [...prev.services, newService.trim()]
      }));
      setNewService('');
    }
  };

  const handleRemoveService = (service: string) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.filter(s => s !== service)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClinic) return;

    setLoading(true);
    setMessage(null);

    try {
      await updateClinic(selectedClinic.id, formData);
      setMessage({ type: 'success', text: t('settings.clinic.messages.updateSuccess') });
    } catch (_error) {
      setMessage({ type: 'error', text: t('settings.clinic.messages.updateError') });
    } finally {
      setLoading(false);
    }
  };

  const stateOptions = [
    { value: '', label: t('settings.clinic.address.state.select') },
    { value: 'AL', label: t('settings.clinic.address.state.alabama') },
    { value: 'AK', label: t('settings.clinic.address.state.alaska') },
    { value: 'AZ', label: t('settings.clinic.address.state.arizona') },
    { value: 'AR', label: t('settings.clinic.address.state.arkansas') },
    { value: 'CA', label: t('settings.clinic.address.state.california') },
    { value: 'CO', label: t('settings.clinic.address.state.colorado') },
    { value: 'CT', label: t('settings.clinic.address.state.connecticut') },
    { value: 'DE', label: t('settings.clinic.address.state.delaware') },
    { value: 'FL', label: t('settings.clinic.address.state.florida') },
    { value: 'GA', label: t('settings.clinic.address.state.georgia') },
    // Add more states as needed
  ];

  const daysOfWeek = [
    { key: 'monday', label: t('settings.clinic.operatingHours.days.monday') },
    { key: 'tuesday', label: t('settings.clinic.operatingHours.days.tuesday') },
    { key: 'wednesday', label: t('settings.clinic.operatingHours.days.wednesday') },
    { key: 'thursday', label: t('settings.clinic.operatingHours.days.thursday') },
    { key: 'friday', label: t('settings.clinic.operatingHours.days.friday') },
    { key: 'saturday', label: t('settings.clinic.operatingHours.days.saturday') },
    { key: 'sunday', label: t('settings.clinic.operatingHours.days.sunday') }
  ];

  if (!selectedClinic) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">{t('settings.clinic.noClinicSelected.title')}</h3>
          <p className="mt-1 text-sm text-gray-500">
            {t('settings.clinic.noClinicSelected.description')}
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Clinic Header */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{selectedClinic.name}</h2>
            <p className="text-gray-600">{selectedClinic.address.city}, {selectedClinic.address.state}</p>
          </div>
          <Badge variant="success">{t('settings.clinic.active')}</Badge>
        </div>
      </Card>

      {message && (
        <Alert
          variant={message.type}
          className="mb-6"
          dismissible
        >
          {message.text}
        </Alert>
      )}

      {/* Basic Information */}
      <Card className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">{t('settings.clinic.basicInfo.title')}</h3>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label={t('settings.clinic.basicInfo.clinicName')}
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              required
            />
            <Input
              label={t('settings.clinic.basicInfo.phone')}
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label={t('settings.clinic.basicInfo.email')}
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              required
            />
            <Input
              label={t('settings.clinic.basicInfo.website')}
              type="url"
              value={formData.website}
              onChange={(e) => handleInputChange('website', e.target.value)}
              placeholder={t('common.placeholders.website')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('settings.clinic.basicInfo.description')}
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder={t('settings.clinic.basicInfo.descriptionPlaceholder')}
            />
          </div>

          <Input
            label={t('settings.clinic.basicInfo.emergencyContact')}
            type="tel"
            value={formData.emergencyContact}
            onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
            placeholder={t('settings.clinic.basicInfo.emergencyContactPlaceholder')}
          />
        </form>
      </Card>

      {/* Address */}
      <Card className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">{t('settings.clinic.address.title')}</h3>
        
        <div className="space-y-4">
          <Input
            label={t('settings.clinic.address.street')}
            value={formData.address.street}
            onChange={(e) => handleInputChange('address.street', e.target.value)}
            required
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label={t('settings.clinic.address.city')}
              value={formData.address.city}
              onChange={(e) => handleInputChange('address.city', e.target.value)}
              required
            />
            <Select
              label={t('settings.clinic.address.state.label')}
              options={stateOptions}
              value={formData.address.state}
              onChange={(value) => handleInputChange('address.state', value)}
              required
            />
            <Input
              label={t('settings.clinic.address.zipCode')}
              value={formData.address.zipCode}
              onChange={(e) => handleInputChange('address.zipCode', e.target.value)}
              required
            />
          </div>
        </div>
      </Card>

      {/* Operating Hours */}
      <Card className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">{t('settings.clinic.operatingHours.title')}</h3>
        
        <div className="space-y-4">
          {daysOfWeek.map((day) => {
            const hours = formData.operatingHours.find(h => h.day === day.key);
            if (!hours) return null;
            return (
              <div key={day.key} className="flex items-center gap-4">
                <div className="w-24">
                  <span className="text-sm font-medium text-gray-700">{day.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!hours.closed}
                    onChange={(e) => handleOperatingHoursChange(day.key, 'closed', !e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-600">{t('settings.clinic.operatingHours.open')}</span>
                </div>
                {!hours.closed && (
                  <>
                    <Input
                      type="time"
                      value={hours.open}
                      onChange={(e) => handleOperatingHoursChange(day.key, 'open', e.target.value)}
                      className="w-32"
                    />
                    <span className="text-gray-500">{t('settings.clinic.operatingHours.to')}</span>
                    <Input
                      type="time"
                      value={hours.close}
                      onChange={(e) => handleOperatingHoursChange(day.key, 'close', e.target.value)}
                      className="w-32"
                    />
                  </>
                )}
                {hours.closed && (
                  <span className="text-sm text-gray-500 italic">{t('settings.clinic.operatingHours.closed')}</span>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Services */}
      <Card className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">{t('settings.clinic.services.title')}</h3>
        
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder={t('settings.clinic.services.addPlaceholder')}
              value={newService}
              onChange={(e) => setNewService(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddService())}
              className="flex-1"
            />
            <Button
              type="button"
              onClick={handleAddService}
              disabled={!newService.trim()}
            >
              {t('settings.clinic.services.addButton')}
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {formData.services.map((service, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="flex items-center gap-1"
              >
                {service}
                <button
                  type="button"
                  onClick={() => handleRemoveService(service)}
                  className="ml-1 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </Badge>
            ))}
          </div>
        </div>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSubmit}
          isLoading={loading}
          disabled={loading}
        >
          {t('settings.clinic.buttons.saveChanges')}
        </Button>
      </div>
    </div>
  );
};

export default ClinicSettings;