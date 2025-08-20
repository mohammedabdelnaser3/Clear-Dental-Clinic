import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from 'i18next';
import { Card, Button } from '../ui';
import type { Appointment } from '../../types';

interface AppointmentCalendarProps {
  appointments: Appointment[];
  onDateSelect?: (date: Date) => void;
  onAppointmentClick?: (appointment: Appointment) => void;
  selectedDate?: Date;
}

const AppointmentCalendar: React.FC<AppointmentCalendarProps> = ({
  appointments,
  onDateSelect,
  onAppointmentClick,
  selectedDate
}) => {
  const { t } = useTranslation();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get appointments for a specific date
  const getAppointmentsForDate = (date: Date) => {
    const dateStr = date.toDateString();
    return appointments.filter(apt => {
      const aptDate = typeof apt.date === 'string' ? new Date(apt.date) : apt.date;
      return aptDate.toDateString() === dateStr;
    });
  };

  // Generate calendar days for month view
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));

    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      days.push(new Date(date));
    }

    return days;
  };

  // Generate week days for week view
  const generateWeekDays = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const calendarDays = viewMode === 'month' ? generateCalendarDays() : generateWeekDays();

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() + 7);
    }
    setCurrentDate(newDate);
  };

  const navigate = (direction: 'prev' | 'next') => {
    if (viewMode === 'month') {
      navigateMonth(direction);
    } else {
      navigateWeek(direction);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'no-show': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-gray-900">
            {viewMode === 'month' 
              ? currentDate.toLocaleDateString(i18n.language || 'en', { month: 'long', year: 'numeric' })
              : `${t('appointmentCalendar.weekOf')} ${calendarDays[0]?.toLocaleDateString(i18n.language || 'en', { month: 'short', day: 'numeric' })}`
            }
          </h2>
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'month' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setViewMode('month')}
            >
              {t('appointmentCalendar.month')}
            </Button>
            <Button
              variant={viewMode === 'week' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setViewMode('week')}
            >
              {t('appointmentCalendar.week')}
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('prev')}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
            {t('appointmentCalendar.today')}
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('next')}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Day headers */}
        {[t('appointmentCalendar.dayNames.sun'), t('appointmentCalendar.dayNames.mon'), t('appointmentCalendar.dayNames.tue'), t('appointmentCalendar.dayNames.wed'), t('appointmentCalendar.dayNames.thu'), t('appointmentCalendar.dayNames.fri'), t('appointmentCalendar.dayNames.sat')].map(day => (
          <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
            {day}
          </div>
        ))}
        
        {/* Calendar days */}
        {calendarDays.map((date, index) => {
          const dayAppointments = getAppointmentsForDate(date);
          const isToday = date.toDateString() === today.toDateString();
          const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
          const isCurrentMonth = viewMode === 'week' || date.getMonth() === currentDate.getMonth();
          
          return (
            <div
              key={index}
              className={`
                min-h-[100px] p-2 border border-gray-200 cursor-pointer transition-colors
                ${isToday ? 'bg-blue-50 border-blue-200' : ''}
                ${isSelected ? 'bg-blue-100 border-blue-300' : ''}
                ${!isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'hover:bg-gray-50'}
              `}
              onClick={() => onDateSelect?.(date)}
            >
              <div className={`text-sm font-medium mb-1 ${
                isToday ? 'text-blue-600' : isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
              }`}>
                {date.getDate()}
              </div>
              
              <div className="space-y-1">
                {dayAppointments.slice(0, viewMode === 'month' ? 2 : 5).map(appointment => (
                  <div
                    key={appointment.id}
                    className={`
                      text-xs p-1 rounded cursor-pointer truncate
                      ${getStatusColor(appointment.status)}
                    `}
                    onClick={(e) => {
                      e.stopPropagation();
                      onAppointmentClick?.(appointment);
                    }}
                    title={`${appointment.timeSlot} - ${appointment.patientName} (${appointment.serviceType})`}
                  >
                    {appointment.timeSlot} {appointment.patientName}
                  </div>
                ))}
                
                {dayAppointments.length > (viewMode === 'month' ? 2 : 5) && (
                  <div className="text-xs text-gray-500 font-medium">
                    +{dayAppointments.length - (viewMode === 'month' ? 2 : 5)} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-blue-100"></div>
          <span>Scheduled</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-green-100"></div>
          <span>Confirmed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-gray-100"></div>
          <span>Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-red-100"></div>
          <span>Cancelled</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-orange-100"></div>
          <span>No Show</span>
        </div>
      </div>
    </Card>
  );
};

export default AppointmentCalendar;