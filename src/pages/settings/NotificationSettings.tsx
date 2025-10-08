import React, { useState, useEffect } from 'react';
import { Bell, Mail, MessageSquare, Smartphone, Clock, CheckCircle, Save, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

interface NotificationPreferences {
  email: {
    enabled: boolean;
    appointments: boolean;
    reminders: boolean;
    cancellations: boolean;
    prescriptions: boolean;
    messages: boolean;
  };
  sms: {
    enabled: boolean;
    appointments: boolean;
    reminders: boolean;
    cancellations: boolean;
    prescriptions: boolean;
  };
  inApp: {
    enabled: boolean;
    appointments: boolean;
    reminders: boolean;
    cancellations: boolean;
    prescriptions: boolean;
    messages: boolean;
    system: boolean;
  };
  reminderIntervals: {
    '24h': boolean;
    '1h': boolean;
    '15min': boolean;
  };
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
}

const NotificationSettings: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email: {
      enabled: true,
      appointments: true,
      reminders: true,
      cancellations: true,
      prescriptions: true,
      messages: true
    },
    sms: {
      enabled: false,
      appointments: false,
      reminders: false,
      cancellations: false,
      prescriptions: false
    },
    inApp: {
      enabled: true,
      appointments: true,
      reminders: true,
      cancellations: true,
      prescriptions: true,
      messages: true,
      system: true
    },
    reminderIntervals: {
      '24h': true,
      '1h': true,
      '15min': true
    },
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00'
    }
  });

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users/notification-preferences');
      if (response.data.success && response.data.data) {
        setPreferences(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch preferences:', error);
      // Use defaults if fetch fails
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.put('/users/notification-preferences', preferences);
      toast.success('Notification preferences saved successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const updatePreference = (category: keyof NotificationPreferences, key: string, value: boolean | string) => {
    setPreferences(prev => ({
      ...prev,
      [category]: {
        ...(prev[category] as any),
        [key]: value
      }
    }));
  };

  const toggleAllInCategory = (category: 'email' | 'sms' | 'inApp', enabled: boolean) => {
    setPreferences(prev => {
      const categoryPrefs = prev[category];
      const updated: any = { enabled };
      
      Object.keys(categoryPrefs).forEach(key => {
        if (key !== 'enabled') {
          updated[key] = enabled;
        }
      });
      
      return {
        ...prev,
        [category]: updated
      };
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Notification Settings</h1>
        <p className="text-gray-600">
          Manage how and when you receive notifications about appointments, prescriptions, and messages.
        </p>
      </div>

      {/* Email Notifications */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
              <Mail className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Email Notifications</h2>
              <p className="text-sm text-gray-600">Receive updates via email</p>
            </div>
          </div>
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.email.enabled}
              onChange={(e) => toggleAllInCategory('email', e.target.checked)}
              className="sr-only peer"
            />
            <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {preferences.email.enabled && (
          <div className="space-y-3 pl-13">
            {[
              { key: 'appointments', label: 'Appointment confirmations', icon: CheckCircle },
              { key: 'reminders', label: 'Appointment reminders', icon: Clock },
              { key: 'cancellations', label: 'Cancellation notifications', icon: AlertCircle },
              { key: 'prescriptions', label: 'Prescription updates', icon: Bell },
              { key: 'messages', label: 'New messages', icon: MessageSquare }
            ].map(({ key, label, icon: Icon }) => (
              <label key={key} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
                <div className="flex items-center">
                  <Icon className="w-4 h-4 text-gray-400 mr-3" />
                  <span className="text-sm text-gray-700">{label}</span>
                </div>
                <input
                  type="checkbox"
                  checked={(preferences.email as any)[key]}
                  onChange={(e) => updatePreference('email', key, e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </label>
            ))}
          </div>
        )}
      </div>

      {/* SMS Notifications */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-3">
              <Smartphone className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">SMS Notifications</h2>
              <p className="text-sm text-gray-600">Receive text messages for important updates</p>
            </div>
          </div>
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.sms.enabled}
              onChange={(e) => toggleAllInCategory('sms', e.target.checked)}
              className="sr-only peer"
            />
            <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
          </label>
        </div>

        {preferences.sms.enabled && (
          <div className="space-y-3 pl-13">
            {[
              { key: 'appointments', label: 'Appointment confirmations' },
              { key: 'reminders', label: 'Appointment reminders' },
              { key: 'cancellations', label: 'Cancellation notifications' },
              { key: 'prescriptions', label: 'Prescription ready notifications' }
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
                <span className="text-sm text-gray-700">{label}</span>
                <input
                  type="checkbox"
                  checked={(preferences.sms as any)[key]}
                  onChange={(e) => updatePreference('sms', key, e.target.checked)}
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
              </label>
            ))}
          </div>
        )}
      </div>

      {/* In-App Notifications */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mr-3">
              <Bell className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">In-App Notifications</h2>
              <p className="text-sm text-gray-600">Show notifications in the application</p>
            </div>
          </div>
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.inApp.enabled}
              onChange={(e) => toggleAllInCategory('inApp', e.target.checked)}
              className="sr-only peer"
            />
            <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
          </label>
        </div>

        {preferences.inApp.enabled && (
          <div className="space-y-3 pl-13">
            {[
              { key: 'appointments', label: 'Appointment updates' },
              { key: 'reminders', label: 'Appointment reminders' },
              { key: 'cancellations', label: 'Cancellations' },
              { key: 'prescriptions', label: 'Prescription updates' },
              { key: 'messages', label: 'New messages' },
              { key: 'system', label: 'System notifications' }
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
                <span className="text-sm text-gray-700">{label}</span>
                <input
                  type="checkbox"
                  checked={(preferences.inApp as any)[key]}
                  onChange={(e) => updatePreference('inApp', key, e.target.checked)}
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Reminder Intervals */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="mb-4">
          <div className="flex items-center mb-2">
            <Clock className="w-5 h-5 text-orange-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Appointment Reminder Schedule</h2>
          </div>
          <p className="text-sm text-gray-600">Choose when to receive appointment reminders</p>
        </div>

        <div className="space-y-3">
          {[
            { key: '24h', label: '24 hours before', description: 'Day before appointment' },
            { key: '1h', label: '1 hour before', description: 'Shortly before appointment' },
            { key: '15min', label: '15 minutes before', description: 'Last minute reminder' }
          ].map(({ key, label, description }) => (
            <label key={key} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg cursor-pointer border border-gray-200">
              <div>
                <div className="text-sm font-medium text-gray-900">{label}</div>
                <div className="text-xs text-gray-500">{description}</div>
              </div>
              <input
                type="checkbox"
                checked={(preferences.reminderIntervals as any)[key]}
                onChange={(e) => updatePreference('reminderIntervals', key, e.target.checked)}
                className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
              />
            </label>
          ))}
        </div>
      </div>

      {/* Quiet Hours */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center mb-2">
              <Bell className="w-5 h-5 text-gray-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Quiet Hours</h2>
            </div>
            <p className="text-sm text-gray-600">Don't send notifications during specified hours</p>
          </div>
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.quietHours.enabled}
              onChange={(e) => updatePreference('quietHours', 'enabled', e.target.checked)}
              className="sr-only peer"
            />
            <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-600"></div>
          </label>
        </div>

        {preferences.quietHours.enabled && (
          <div className="grid grid-cols-2 gap-4 pl-7">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
              <input
                type="time"
                value={preferences.quietHours.start}
                onChange={(e) => updatePreference('quietHours', 'start', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
              <input
                type="time"
                value={preferences.quietHours.end}
                onChange={(e) => updatePreference('quietHours', 'end', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center font-medium"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Saving...
            </>
          ) : (
            <>
              <Save className="w-5 h-5 mr-2" />
              Save Preferences
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default NotificationSettings;
