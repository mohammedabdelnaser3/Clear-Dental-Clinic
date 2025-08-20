import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, Repeat, User } from 'lucide-react';
import { Card, Button, Select, Input, Checkbox } from './ui';

interface StaffSchedule {
  _id: string;
  staffId: {
    _id: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  date: string;
  startTime: string;
  endTime: string;
  shiftType: 'morning' | 'afternoon' | 'evening' | 'night' | 'full-day';
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  notes?: string;
  isRecurring: boolean;
  recurringPattern?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    interval: number;
    endDate?: string;
    daysOfWeek?: number[];
  };
  notifications: {
    enabled: boolean;
    reminderTime: number;
    channels: {
      email: boolean;
      sms: boolean;
      inApp: boolean;
    };
  };
}

interface StaffMember {
  _id: string;
  firstName: string;
  lastName: string;
  role: string;
  email: string;
  phone?: string;
}

interface ScheduleFormProps {
  schedule?: StaffSchedule | null;
  staff: StaffMember[];
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isLoading: boolean;
}

const ScheduleForm: React.FC<ScheduleFormProps> = ({
  schedule,
  staff,
  onSubmit,
  onCancel,
  isLoading,
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    staffId: '',
    date: '',
    startTime: '',
    endTime: '',
    shiftType: 'morning' as 'morning' | 'afternoon' | 'evening' | 'night' | 'full-day',
    status: 'scheduled' as 'scheduled' | 'completed' | 'cancelled' | 'no-show',
    notes: '',
    isRecurring: false,
    recurringPattern: {
      frequency: 'weekly' as 'daily' | 'weekly' | 'monthly',
      interval: 1,
      endDate: '',
      daysOfWeek: [] as number[],
    },
    notifications: {
      enabled: true,
      reminderTime: 60, // minutes before shift
      channels: {
        email: true,
        sms: false,
        inApp: true,
      },
    },
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (schedule) {
      setFormData({
        staffId: schedule.staffId._id,
        date: schedule.date.split('T')[0],
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        shiftType: schedule.shiftType,
        status: schedule.status,
        notes: schedule.notes || '',
        isRecurring: schedule.isRecurring,
        recurringPattern: {
          frequency: (schedule.recurringPattern?.frequency || 'weekly') as 'daily' | 'weekly' | 'monthly',
          interval: schedule.recurringPattern?.interval || 1,
          endDate: schedule.recurringPattern?.endDate || '',
          daysOfWeek: schedule.recurringPattern?.daysOfWeek || []
        },
        notifications: schedule.notifications || {
          enabled: true,
          reminderTime: 60,
          channels: {
            email: true,
            sms: false,
            inApp: true,
          },
        },
      });
    }
  }, [schedule]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.staffId) {
      newErrors.staffId = t('scheduleForm.validation.staffRequired');
    }

    if (!formData.date) {
      newErrors.date = t('scheduleForm.validation.dateRequired');
    }

    if (!formData.startTime) {
      newErrors.startTime = t('scheduleForm.validation.startTimeRequired');
    }

    if (!formData.endTime) {
      newErrors.endTime = t('scheduleForm.validation.endTimeRequired');
    }

    if (formData.startTime && formData.endTime) {
      const start = new Date(`2000-01-01T${formData.startTime}`);
      const end = new Date(`2000-01-01T${formData.endTime}`);
      if (start >= end) {
        newErrors.endTime = t('scheduleForm.validation.endTimeAfterStart');
      }
    }

    if (formData.isRecurring) {
      if (formData.recurringPattern.frequency === 'weekly' && formData.recurringPattern.daysOfWeek.length === 0) {
        newErrors.daysOfWeek = t('scheduleForm.validation.dayRequired');
      }
      if (!formData.recurringPattern.endDate) {
        newErrors.endDate = t('scheduleForm.validation.endDateRequired');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const handleRecurringPatternChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      recurringPattern: {
        ...prev.recurringPattern,
        [field]: value,
      },
    }));
  };

  const handleNotificationChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [field]: value,
      },
    }));
  };

  const handleDayOfWeekToggle = (day: number) => {
    const currentDays = formData.recurringPattern.daysOfWeek;
    const newDays = currentDays.includes(day)
      ? currentDays.filter(d => d !== day)
      : [...currentDays, day].sort();
    
    handleRecurringPatternChange('daysOfWeek', newDays);
  };

  const dayNames = [
    t('scheduleForm.days.sunday'),
    t('scheduleForm.days.monday'),
    t('scheduleForm.days.tuesday'),
    t('scheduleForm.days.wednesday'),
    t('scheduleForm.days.thursday'),
    t('scheduleForm.days.friday'),
    t('scheduleForm.days.saturday'),
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <User className="h-5 w-5 text-gray-500" />
          <h3 className="text-lg font-semibold">{t('scheduleForm.basicInfo.title')}</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('scheduleForm.basicInfo.staffMember')} *
            </label>
            <Select
              value={formData.staffId}
              onChange={(e) => handleInputChange('staffId', e.target.value)}
              className={errors.staffId ? 'border-red-500' : ''}
              options={[
                { value: '', label: t('scheduleForm.basicInfo.selectStaff') },
                ...staff.map((member) => ({
                  value: member._id,
                  label: `${member.firstName} ${member.lastName} (${member.role})`
                }))
              ]}
            />
            {errors.staffId && (
              <p className="text-red-500 text-xs mt-1">{errors.staffId}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('scheduleForm.basicInfo.date')} *
            </label>
            <Input
              type="date"
              value={formData.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
              className={errors.date ? 'border-red-500' : ''}
            />
            {errors.date && (
              <p className="text-red-500 text-xs mt-1">{errors.date}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('scheduleForm.basicInfo.startTime')} *
            </label>
            <Input
              type="time"
              value={formData.startTime}
              onChange={(e) => handleInputChange('startTime', e.target.value)}
              className={errors.startTime ? 'border-red-500' : ''}
            />
            {errors.startTime && (
              <p className="text-red-500 text-xs mt-1">{errors.startTime}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('scheduleForm.basicInfo.endTime')} *
            </label>
            <Input
              type="time"
              value={formData.endTime}
              onChange={(e) => handleInputChange('endTime', e.target.value)}
              className={errors.endTime ? 'border-red-500' : ''}
            />
            {errors.endTime && (
              <p className="text-red-500 text-xs mt-1">{errors.endTime}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('scheduleForm.basicInfo.shiftType')}
            </label>
            <Select
              value={formData.shiftType}
              onChange={(e) => handleInputChange('shiftType', e.target.value)}
              options={[
                { value: 'morning', label: t('scheduleForm.shiftTypes.morning') },
                { value: 'afternoon', label: t('scheduleForm.shiftTypes.afternoon') },
                { value: 'evening', label: t('scheduleForm.shiftTypes.evening') },
                { value: 'night', label: t('scheduleForm.shiftTypes.night') },
                { value: 'full-day', label: t('scheduleForm.shiftTypes.fullDay') }
              ]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('scheduleForm.basicInfo.status')}
            </label>
            <Select
              value={formData.status}
              onChange={(e) => handleInputChange('status', e.target.value)}
              options={[
                { value: 'scheduled', label: t('scheduleForm.statuses.scheduled') },
                { value: 'completed', label: t('scheduleForm.statuses.completed') },
                { value: 'cancelled', label: t('scheduleForm.statuses.cancelled') },
                { value: 'no-show', label: t('scheduleForm.statuses.noShow') }
              ]}
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('scheduleForm.basicInfo.notes')}
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={t('scheduleForm.basicInfo.notesPlaceholder')}
          />
        </div>
      </Card>

      {/* Recurring Schedule */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Repeat className="h-5 w-5 text-gray-500" />
          <h3 className="text-lg font-semibold">{t('scheduleForm.recurring.title')}</h3>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={formData.isRecurring}
              onChange={(e) => handleInputChange('isRecurring', e.target.checked)}
            />
            <label className="text-sm font-medium text-gray-700">
              {t('scheduleForm.recurring.makeRecurring')}
            </label>
          </div>

          {formData.isRecurring && (
            <div className="space-y-4 pl-6 border-l-2 border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('scheduleForm.recurring.frequency')}
                  </label>
                  <Select
                    value={formData.recurringPattern.frequency}
                    onChange={(e) => handleRecurringPatternChange('frequency', e.target.value)}
                    options={[
                      { value: 'daily', label: t('scheduleForm.frequencies.daily') },
                      { value: 'weekly', label: t('scheduleForm.frequencies.weekly') },
                      { value: 'monthly', label: t('scheduleForm.frequencies.monthly') }
                    ]}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('scheduleForm.recurring.interval')}
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.recurringPattern.interval}
                    onChange={(e) => handleRecurringPatternChange('interval', parseInt(e.target.value))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('scheduleForm.recurring.endDate')} *
                  </label>
                  <Input
                    type="date"
                    value={formData.recurringPattern.endDate}
                    onChange={(e) => handleRecurringPatternChange('endDate', e.target.value)}
                    className={errors.endDate ? 'border-red-500' : ''}
                  />
                  {errors.endDate && (
                    <p className="text-red-500 text-xs mt-1">{errors.endDate}</p>
                  )}
                </div>
              </div>

              {formData.recurringPattern.frequency === 'weekly' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('scheduleForm.recurring.daysOfWeek')} *
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {dayNames.map((day, index) => (
                      <label key={index} className="flex items-center gap-1 cursor-pointer">
                        <Checkbox
                          checked={formData.recurringPattern.daysOfWeek.includes(index)}
                          onChange={() => handleDayOfWeekToggle(index)}
                        />
                        <span className="text-sm">{day}</span>
                      </label>
                    ))}
                  </div>
                  {errors.daysOfWeek && (
                    <p className="text-red-500 text-xs mt-1">{errors.daysOfWeek}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Notifications */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="h-5 w-5 text-gray-500" />
          <h3 className="text-lg font-semibold">{t('scheduleForm.notifications.title')}</h3>
        </div>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={formData.notifications.enabled}
                onChange={(e) => handleNotificationChange('enabled', e.target.checked)}
              />
              <label className="text-sm font-medium text-gray-700">
                {t('scheduleForm.notifications.enable')}
              </label>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                checked={formData.notifications.channels.email}
                onChange={(e) => handleNotificationChange('channels', { ...formData.notifications.channels, email: e.target.checked })}
              />
              <label className="text-sm font-medium text-gray-700">
                {t('scheduleForm.notifications.email')}
              </label>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                checked={formData.notifications.channels.sms}
                onChange={(e) => handleNotificationChange('channels', { ...formData.notifications.channels, sms: e.target.checked })}
              />
              <label className="text-sm font-medium text-gray-700">
                {t('scheduleForm.notifications.sms')}
              </label>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                checked={formData.notifications.channels.inApp}
                onChange={(e) => handleNotificationChange('channels', { ...formData.notifications.channels, inApp: e.target.checked })}
              />
              <label className="text-sm font-medium text-gray-700">
                {t('scheduleForm.notifications.inApp')}
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('scheduleForm.notifications.reminderTime')}
            </label>
            <Select
              value={formData.notifications.reminderTime.toString()}
              onChange={(e) => handleNotificationChange('reminderTime', parseInt(e.target.value))}
              options={[
                { value: '15', label: t('scheduleForm.reminders.15min') },
                { value: '30', label: t('scheduleForm.reminders.30min') },
                { value: '60', label: t('scheduleForm.reminders.1hr') },
                { value: '120', label: t('scheduleForm.reminders.2hr') },
                { value: '1440', label: t('scheduleForm.reminders.1day') }
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          {t('scheduleForm.buttons.cancel')}
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? t('scheduleForm.buttons.saving') : schedule ? t('scheduleForm.buttons.update') : t('scheduleForm.buttons.create')}
        </Button>
      </div>
    </form>
  );
};

export default ScheduleForm;