import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Spinner } from '../ui';
import type { TimeSlot } from '../../services/appointmentService';

interface TimeSlotPickerProps {
  selectedDate: Date;
  selectedTimeSlot?: string;
  onTimeSlotSelect: (timeSlot: string) => void;
  duration?: number;
  disabled?: boolean;
  availableTimeSlots?: TimeSlot[];
  isLoading?: boolean;
  onRefresh?: () => void;
}

const TimeSlotPicker: React.FC<TimeSlotPickerProps> = ({
  selectedDate,
  selectedTimeSlot,
  onTimeSlotSelect,
  duration = 30,
  disabled = false,
  availableTimeSlots = [],
  isLoading = false,
  onRefresh
}) => {
  const { t } = useTranslation();
  const [error] = useState<string | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);

  // Use provided time slots or empty array
  useEffect(() => {
    if (availableTimeSlots && availableTimeSlots.length > 0) {
      setTimeSlots(availableTimeSlots);
    } else {
      setTimeSlots([]);
    }
  }, [availableTimeSlots]);

  const formatTimeSlot = (time: string) => {
    if (!time) return '';
    
    // Handle both formats: "HH:MM" and ISO date strings
    let hourNum, minute;
    
    if (time.includes('T')) {
      // Handle ISO date string format
      const date = new Date(time);
      hourNum = date.getHours();
      minute = date.getMinutes().toString().padStart(2, '0');
    } else {
      // Handle HH:MM format
      const [hour, min] = time.split(':');
      hourNum = parseInt(hour);
      minute = min;
    }
    
    const ampm = hourNum >= 12 ? 'PM' : 'AM';
    const displayHour = hourNum > 12 ? hourNum - 12 : hourNum === 0 ? 12 : hourNum;
    return `${displayHour}:${minute} ${ampm}`;
  };

  const groupSlotsByPeriod = (slots: TimeSlot[]) => {
    const morning = slots.filter(slot => {
      // Handle both time formats
      const timeString = slot.time || (slot.startTime ? new Date(slot.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false}) : '');
      const hour = timeString ? parseInt(timeString.split(':')[0]) : 0;
      return hour < 12;
    });
    
    const afternoon = slots.filter(slot => {
      // Handle both time formats
      const timeString = slot.time || (slot.startTime ? new Date(slot.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false}) : '');
      const hour = timeString ? parseInt(timeString.split(':')[0]) : 0;
      return hour >= 12;
    });

    return { morning, afternoon };
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Spinner />
        <span className="ml-2 text-gray-600">{t('timeSlotPicker.loading')}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">{error}</div>
        <Button variant="outline" onClick={onRefresh}>
          {t('timeSlotPicker.tryAgain')}
        </Button>
      </div>
    );
  }

  const { morning, afternoon } = groupSlotsByPeriod(timeSlots);
  const availableSlots = timeSlots.filter(slot => slot.available);

  if (availableSlots.length === 0 && !isLoading) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-600 mb-4">
          {t('timeSlotPicker.noSlots', { date: selectedDate.toLocaleDateString() })}
        </div>
        <Button variant="outline" onClick={onRefresh}>
          {t('timeSlotPicker.refresh')}
        </Button>
      </div>
    );
  }

  const renderTimeSlots = (slots: TimeSlot[], title: string) => {
    const availableInPeriod = slots.filter(slot => slot.available);
    
    if (availableInPeriod.length === 0) {
      return null;
    }

    return (
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">{t(title.toLowerCase())}</h4>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
          {availableInPeriod.map((slot, index) => {
            // Get the time value from either time or startTime
            const timeValue = slot.time || slot.startTime || '';
            const slotId = `slot-${index}-${timeValue}`;
            
            return (
              <Button
                key={slotId}
                variant={selectedTimeSlot === timeValue ? 'primary' : 'outline'}
                size="sm"
                onClick={() => onTimeSlotSelect(timeValue)}
                disabled={disabled || !slot.available}
                className={`text-xs ${slot.isPeak ? 'border-yellow-400' : ''}`}
              >
                {formatTimeSlot(timeValue)}
                {slot.isPeak && <span className="absolute -top-1 -right-1 h-2 w-2 bg-yellow-400 rounded-full"></span>}
              </Button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">
          {t('timeSlotPicker.availableTimes', { date: selectedDate.toLocaleDateString() })}
        </h3>
        <Button variant="outline" size="sm" onClick={onRefresh}>
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {t('timeSlotPicker.refresh')}
        </Button>
      </div>

      {renderTimeSlots(morning, 'timeSlotPicker.morning')}
      {renderTimeSlots(afternoon, 'timeSlotPicker.afternoon')}

      {selectedTimeSlot && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-blue-800 font-medium">
              {t('timeSlotPicker.selected', { time: formatTimeSlot(selectedTimeSlot), date: selectedDate.toLocaleDateString() })}
            </span>
          </div>
          <p className="text-blue-700 text-sm mt-1">
            {t('timeSlotPicker.duration', { duration })}
          </p>
          
          {/* Show peak hour notice if applicable */}
          {timeSlots.find(slot => (slot.time === selectedTimeSlot || slot.startTime === selectedTimeSlot) && slot.isPeak) && (
            <div className="mt-2 flex items-center text-yellow-700 text-sm">
              <span className="inline-block h-3 w-3 rounded-full bg-yellow-400 mr-2"></span>
              {t('appointmentForm.peak_hour_notice') || 'This is a peak hour with higher demand'}
            </div>
          )}
        </div>
      )}

      <div className="text-xs text-gray-500 mt-4">
        <p>• {t('timeSlotPicker.timezoneInfo', { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone })}</p>
        <p>• {t('timeSlotPicker.slotDurationInfo', { duration })}</p>
        <p>• {t('timeSlotPicker.arrivalInfo')}</p>
      </div>
    </div>
  );
};

export default TimeSlotPicker;