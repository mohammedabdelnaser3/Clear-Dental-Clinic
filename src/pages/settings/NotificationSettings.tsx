import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, Button, Alert } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';

interface NotificationPreference {
  id: string;
  title: string;
  description: string;
  category: 'appointments' | 'patients' | 'system' | 'marketing';
  channels: {
    email: boolean;
    sms: boolean;
    push: boolean;
    inApp: boolean;
  };
}

const NotificationSettings: React.FC = () => {
  const { t } = useTranslation();
  const { } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [preferences, setPreferences] = useState<NotificationPreference[]>([
    {
      id: 'appointment-reminders',
      title: t('notificationSettings.preferences.appointmentReminders.title'),
      description: t('notificationSettings.preferences.appointmentReminders.description'),
      category: 'appointments',
      channels: { email: true, sms: true, push: true, inApp: true }
    },
    {
      id: 'appointment-confirmations',
      title: t('notificationSettings.preferences.appointmentConfirmations.title'),
      description: t('notificationSettings.preferences.appointmentConfirmations.description'),
      category: 'appointments',
      channels: { email: true, sms: false, push: true, inApp: true }
    },
    {
      id: 'appointment-cancellations',
      title: t('notificationSettings.preferences.appointmentCancellations.title'),
      description: t('notificationSettings.preferences.appointmentCancellations.description'),
      category: 'appointments',
      channels: { email: true, sms: true, push: true, inApp: true }
    },
    {
      id: 'new-patient-registration',
      title: t('notificationSettings.preferences.newPatientRegistration.title'),
      description: t('notificationSettings.preferences.newPatientRegistration.description'),
      category: 'patients',
      channels: { email: true, sms: false, push: true, inApp: true }
    },
    {
      id: 'patient-messages',
      title: t('notificationSettings.preferences.patientMessages.title'),
      description: t('notificationSettings.preferences.patientMessages.description'),
      category: 'patients',
      channels: { email: true, sms: false, push: true, inApp: true }
    },
    {
      id: 'system-updates',
      title: t('notificationSettings.preferences.systemUpdates.title'),
      description: t('notificationSettings.preferences.systemUpdates.description'),
      category: 'system',
      channels: { email: true, sms: false, push: false, inApp: true }
    },
    {
      id: 'security-alerts',
      title: t('notificationSettings.preferences.securityAlerts.title'),
      description: t('notificationSettings.preferences.securityAlerts.description'),
      category: 'system',
      channels: { email: true, sms: true, push: true, inApp: true }
    },
    {
      id: 'promotional-offers',
      title: t('notificationSettings.preferences.promotionalOffers.title'),
      description: t('notificationSettings.preferences.promotionalOffers.description'),
      category: 'marketing',
      channels: { email: false, sms: false, push: false, inApp: false }
    },
    {
      id: 'newsletter',
      title: t('notificationSettings.preferences.newsletter.title'),
      description: t('notificationSettings.preferences.newsletter.description'),
      category: 'marketing',
      channels: { email: false, sms: false, push: false, inApp: false }
    }
  ]);

  const [globalSettings, setGlobalSettings] = useState({
    emailNotifications: true,
    smsNotifications: true,
    pushNotifications: true,
    inAppNotifications: true,
    quietHours: {
      enabled: true,
      start: '22:00',
      end: '08:00'
    },
    frequency: 'immediate' as 'immediate' | 'hourly' | 'daily'
  });

  const handlePreferenceChange = (preferenceId: string, channel: keyof NotificationPreference['channels'], value: boolean) => {
    setPreferences(prev => prev.map(pref => 
      pref.id === preferenceId 
        ? { ...pref, channels: { ...pref.channels, [channel]: value } }
        : pref
    ));
  };

  const handleGlobalSettingChange = (setting: string, value: any) => {
    if (setting.startsWith('quietHours.')) {
      const field = setting.split('.')[1];
      setGlobalSettings(prev => ({
        ...prev,
        quietHours: {
          ...prev.quietHours,
          [field]: value
        }
      }));
    } else {
      setGlobalSettings(prev => ({
        ...prev,
        [setting]: value
      }));
    }
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    setMessage(null);

    try {
      // API call to save notification preferences
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      setMessage({ type: 'success', text: t('notificationSettings.messages.saveSuccess') });
    } catch (_error) {
      setMessage({ type: 'error', text: t('notificationSettings.messages.saveError') });
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'appointments':
        return (
          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      case 'patients':
        return (
          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
      case 'system':
        return (
          <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
      case 'marketing':
        return (
          <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        );
      case 'sms':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        );
      case 'push':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.868 19.718A8.97 8.97 0 003 12a9 9 0 0118 0 8.97 8.97 0 01-1.868 7.718M12 9v4" />
          </svg>
        );
      case 'inApp':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const groupedPreferences = preferences.reduce((acc, pref) => {
    if (!acc[pref.category]) {
      acc[pref.category] = [];
    }
    acc[pref.category].push(pref);
    return acc;
  }, {} as Record<string, NotificationPreference[]>);

  const categoryLabels = {
    appointments: t('notificationSettings.categories.appointments'),
    patients: t('notificationSettings.categories.patients'),
    system: t('notificationSettings.categories.system'),
    marketing: t('notificationSettings.categories.marketing')
  };

  return (
    <div className="space-y-6">
      {message && (
        <Alert
            variant={message.type}
            dismissible
          >
            {message.text}
          </Alert>
      )}

      {/* Global Settings */}
      <Card className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">{t('notificationSettings.global.title')}</h3>
        
        <div className="space-y-6">
          {/* Master Toggles */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[ 
              { key: 'emailNotifications', label: t('notificationSettings.global.channels.email'), icon: 'email' },
              { key: 'smsNotifications', label: t('notificationSettings.global.channels.sms'), icon: 'sms' },
              { key: 'pushNotifications', label: t('notificationSettings.global.channels.push'), icon: 'push', type: 'success' },
              { key: 'inAppNotifications', label: t('notificationSettings.global.channels.inApp'), icon: 'inApp' }
            ].map(({ key, label, icon }) => (
              <div key={key} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-2">
                  {getChannelIcon(icon)}
                  <span className="text-sm font-medium text-gray-900">{label}</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={globalSettings[key as keyof typeof globalSettings] as boolean}
                    onChange={(e) => handleGlobalSettingChange(key, e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            ))}
          </div>

          {/* Quiet Hours */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-md font-medium text-gray-900">{t('notificationSettings.global.quietHours.title')}</h4>
                <p className="text-sm text-gray-600">{t('notificationSettings.global.quietHours.description')}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={globalSettings.quietHours.enabled}
                  onChange={(e) => handleGlobalSettingChange('quietHours.enabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            {globalSettings.quietHours.enabled && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('notificationSettings.global.quietHours.startTime')}</label>
                  <input
                    type="time"
                    value={globalSettings.quietHours.start}
                    onChange={(e) => handleGlobalSettingChange('quietHours.start', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('notificationSettings.global.quietHours.endTime')}</label>
                  <input
                    type="time"
                    value={globalSettings.quietHours.end}
                    onChange={(e) => handleGlobalSettingChange('quietHours.end', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Notification Frequency */}
          <div className="border-t border-gray-200 pt-6">
            <h4 className="text-md font-medium text-gray-900 mb-4">{t('notificationSettings.global.frequency.title')}</h4>
            <div className="space-y-2">
              {[ 
                { value: 'immediate', label: t('notificationSettings.global.frequency.immediate.label'), description: t('notificationSettings.global.frequency.immediate.description') },
                { value: 'hourly', label: t('notificationSettings.global.frequency.hourly.label'), description: t('notificationSettings.global.frequency.hourly.description') },
                { value: 'daily', label: t('notificationSettings.global.frequency.daily.label'), description: t('notificationSettings.global.frequency.daily.description') }
              ].map((option) => (
                <label key={option.value} className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="frequency"
                    value={option.value}
                    checked={globalSettings.frequency === option.value}
                    onChange={(e) => handleGlobalSettingChange('frequency', e.target.value)}
                    className="mt-1 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900">{option.label}</div>
                    <div className="text-xs text-gray-600">{option.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Notification Preferences by Category */}
      {Object.entries(groupedPreferences).map(([category, prefs]) => (
        <Card key={category} className="p-6">
          <div className="flex items-center gap-3 mb-6">
            {getCategoryIcon(category)}
            <h3 className="text-lg font-medium text-gray-900">
              {categoryLabels[category as keyof typeof categoryLabels]}
            </h3>
          </div>
          
          <div className="space-y-4">
            {prefs.map((pref) => (
              <div key={pref.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">{pref.title}</h4>
                    <p className="text-xs text-gray-600 mt-1">{pref.description}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(pref.channels).map(([channel, enabled]) => (
                    <label key={channel} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={enabled}
                        onChange={(e) => handlePreferenceChange(pref.id, channel as keyof NotificationPreference['channels'], e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex items-center gap-1">
                        {getChannelIcon(channel)}
                        <span className="text-xs text-gray-700">
                          {t(`notificationSettings.channels.${channel}`)}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      ))}

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSaveSettings}
          isLoading={loading}
          disabled={loading}
        >
          {t('notificationSettings.buttons.save')}
        </Button>
      </div>
    </div>
  );
};

export default NotificationSettings;