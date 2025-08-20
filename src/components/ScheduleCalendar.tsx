import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, Edit, Trash2, Clock, User } from 'lucide-react';
import { Card, Button } from './ui';

interface StaffSchedule {
  _id: string;
  staffId: {
    _id: string;
    firstName: string;
    lastName: string;
    role: string;
    email: string;
  };
  clinicId: {
    _id: string;
    name: string;
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
    daysOfWeek?: number[];
    endDate?: string;
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
}

interface ScheduleCalendarProps {
  schedules: StaffSchedule[];
  staff: StaffMember[];
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onEditSchedule: (schedule: StaffSchedule) => void;
  onDeleteSchedule: (scheduleId: string) => void;
  getShiftTypeColor: (shiftType: string) => string;
  getStatusColor: (status: string) => string;
}

const ScheduleCalendar: React.FC<ScheduleCalendarProps> = ({
  schedules,
  selectedDate,
  onDateChange,
  onEditSchedule,
  onDeleteSchedule,
  getShiftTypeColor,
  getStatusColor,
}) => {
  const { t } = useTranslation();
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate));

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const getSchedulesForDate = (date: Date | null) => {
    if (!date) return [];
    const dateString = date.toISOString().split('T')[0];
    return schedules.filter(schedule => 
      schedule.date.split('T')[0] === dateString
    );
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  const isToday = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelectedDate = (date: Date | null) => {
    if (!date) return false;
    return date.toDateString() === selectedDate.toDateString();
  };

  const days = getDaysInMonth(currentMonth);
  const monthNames = [
    t('scheduleCalendar.months.january'),
    t('scheduleCalendar.months.february'),
    t('scheduleCalendar.months.march'),
    t('scheduleCalendar.months.april'),
    t('scheduleCalendar.months.may'),
    t('scheduleCalendar.months.june'),
    t('scheduleCalendar.months.july'),
    t('scheduleCalendar.months.august'),
    t('scheduleCalendar.months.september'),
    t('scheduleCalendar.months.october'),
    t('scheduleCalendar.months.november'),
    t('scheduleCalendar.months.december'),
  ];
  const dayNames = [
    t('scheduleCalendar.days.sun'),
    t('scheduleCalendar.days.mon'),
    t('scheduleCalendar.days.tue'),
    t('scheduleCalendar.days.wed'),
    t('scheduleCalendar.days.thu'),
    t('scheduleCalendar.days.fri'),
    t('scheduleCalendar.days.sat'),
  ];

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <Card className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('prev')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const today = new Date();
                setCurrentMonth(today);
                onDateChange(today);
              }}
            >
              {t('scheduleCalendar.today')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('next')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Day headers */}
          {dayNames.map((day) => (
            <div
              key={day}
              className="p-2 text-center text-sm font-medium text-gray-500 border-b"
            >
              {day}
            </div>
          ))}

          {/* Calendar days */}
          {days.map((date, index) => {
            const daySchedules = getSchedulesForDate(date);
            const isCurrentDay = isToday(date);
            const isSelected = isSelectedDate(date);

            return (
              <div
                key={index}
                className={`min-h-[120px] p-1 border border-gray-200 cursor-pointer transition-colors ${
                  date
                    ? isSelected
                      ? 'bg-blue-50 border-blue-300'
                      : isCurrentDay
                      ? 'bg-yellow-50 border-yellow-300'
                      : 'hover:bg-gray-50'
                    : 'bg-gray-50'
                }`}
                onClick={() => date && onDateChange(date)}
              >
                {date && (
                  <>
                    <div className={`text-sm font-medium mb-1 ${
                      isCurrentDay ? 'text-yellow-700' : isSelected ? 'text-blue-700' : 'text-gray-900'
                    }`}>
                      {date.getDate()}
                    </div>
                    
                    {/* Schedules for this day */}
                    <div className="space-y-1">
                      {daySchedules.slice(0, 3).map((schedule) => (
                        <div
                          key={schedule._id}
                          className={`text-xs p-1 rounded cursor-pointer group relative ${
                            getShiftTypeColor(schedule.shiftType)
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditSchedule(schedule);
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <span className="truncate">
                              {schedule.staffId.firstName} {schedule.staffId.lastName.charAt(0)}.
                            </span>
                            <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onEditSchedule(schedule);
                                }}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                <Edit className="h-3 w-3" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteSchedule(schedule._id);
                                }}
                                className="text-red-600 hover:text-red-800"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                          <div className="text-xs opacity-75">
                            {schedule.startTime} - {schedule.endTime}
                          </div>
                        </div>
                      ))}
                      
                      {daySchedules.length > 3 && (
                        <div className="text-xs text-gray-500 text-center">
                          +{daySchedules.length - 3} more
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Selected Date Details */}
      {selectedDate && (
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4">
            Schedules for {selectedDate.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </h3>
          
          {getSchedulesForDate(selectedDate).length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No schedules for this date
            </p>
          ) : (
            <div className="space-y-3">
              {getSchedulesForDate(selectedDate)
                .sort((a, b) => a.startTime.localeCompare(b.startTime))
                .map((schedule) => (
                  <div
                    key={schedule._id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        <User className="h-8 w-8 text-gray-400" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {schedule.staffId.firstName} {schedule.staffId.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {schedule.staffId.role}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Clock className="h-4 w-4" />
                          {schedule.startTime} - {schedule.endTime}
                        </div>
                        <div className="flex gap-2 mt-1">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            getShiftTypeColor(schedule.shiftType)
                          }`}>
                            {schedule.shiftType}
                          </span>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            getStatusColor(schedule.status)
                          }`}>
                            {schedule.status}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEditSchedule(schedule)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onDeleteSchedule(schedule._id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default ScheduleCalendar;