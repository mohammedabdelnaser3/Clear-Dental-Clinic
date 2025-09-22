import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, User, Phone, Mail, CheckCircle, AlertTriangle, Stethoscope, Clock } from 'lucide-react';
import { Button, Card, Input, Modal, LoadingSpinner } from '../ui';
import { useAuth } from '../../hooks';
import { appointmentService } from '../../services';
import toast from 'react-hot-toast';

interface AppointmentFormData {
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  service: string;
  preferredDate: string;
  preferredTime: string;
  notes: string;
  emergency: boolean;
}

interface TimeSlot {
  time: string;
  available: boolean;
}

const AppointmentBooking: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [formData, setFormData] = useState<AppointmentFormData>({
    patientName: user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : '',
    patientEmail: user?.email || '',
    patientPhone: user?.phone || '',
    service: '',
    preferredDate: '',
    preferredTime: '',
    notes: '',
    emergency: false
  });

  const services = [
    { value: 'consultation', label: t('appointments.services.consultation'), icon: '👨‍⚕️', duration: 30, description: t('appointments.services.consultationDesc') },
    { value: 'cleaning', label: t('appointments.services.cleaning'), icon: '🦷', duration: 60, description: t('appointments.services.cleaningDesc') },
    { value: 'filling', label: t('appointments.services.filling'), icon: '🔧', duration: 90, description: t('appointments.services.fillingDesc') },
    { value: 'whitening', label: t('appointments.services.whitening'), icon: '✨', duration: 90, description: t('appointments.services.whiteningDesc') },
    { value: 'crown', label: t('appointments.services.crown'), icon: '👑', duration: 120, description: t('appointments.services.crownDesc') },
    { value: 'orthodontics', label: t('appointments.services.orthodontics'), icon: '🦿', duration: 45, description: t('appointments.services.orthodonticsDesc') },
    { value: 'emergency', label: t('appointments.services.emergency'), icon: '🚨', duration: 60, description: t('appointments.services.emergencyDesc') }
  ];



  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30'
  ];

  // Generate available time slots for selected date
  useEffect(() => {
    if (selectedDate) {
      const slots = timeSlots.map(time => ({
        time,
        available: Math.random() > 0.3 // Simulate availability
      }));
      setAvailableSlots(slots);
    }
  }, [selectedDate]);

  const handleInputChange = (field: keyof AppointmentFormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setFormData(prev => ({
      ...prev,
      preferredDate: date
    }));
  };

  const handleTimeSelect = (time: string) => {
    setFormData(prev => ({
      ...prev,
      preferredTime: time
    }));
  };

  const validateForm = (): boolean => {
    const requiredFields = ['patientName', 'patientEmail', 'patientPhone', 'service', 'preferredDate', 'preferredTime'];
    for (const field of requiredFields) {
      if (!formData[field as keyof AppointmentFormData]) {
        toast.error(t('appointment.validation.required', { field: t(`appointment.fields.${field}`) }) || `Please fill in ${field}`);
        return false;
      }
    }
    
    if (!formData.patientEmail.includes('@')) {
      toast.error(t('appointment.validation.email'));
      return false;
    }
    
    return true;
  };

  const handleAutoBooking = async () => {
    if (!user?.id || !formData.service || !selectedDate) {
      toast.error('Please fill in all required fields before auto-booking');
      return;
    }

    setIsLoading(true);

    try {
      const autoBookData = {
        patientId: user.id,
        clinicId: '687468107e70478314c346be', // Default clinic ID
        serviceType: formData.service,
        date: selectedDate,
        duration: 60, // Default duration
        notes: formData.notes || '',
        emergency: formData.emergency || false
      };

      const result = await appointmentService.autoBookFirstAvailable(autoBookData);

      if (result.success && result.appointment) {
        toast.success(result.message || 'Appointment successfully auto-booked!', {
          duration: 5000
        });

        // Show additional info about the booked slot
        if (result.bookedSlot) {
          toast.success(
            `Booked at ${result.bookedSlot.time} with Dr. ${result.bookedSlot.dentistName}`,
            { duration: 7000 }
          );
        }

        setIsModalOpen(false);
        setFormData({
          patientName: user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : '',
          patientEmail: user?.email || '',
          patientPhone: user?.phone || '',
          service: '',
          preferredDate: '',
          preferredTime: '',
          notes: '',
          emergency: false
        });
      } else {
        toast.error(result.message || 'Failed to auto-book appointment. Please try selecting a time slot manually.');
      }
    } catch (error) {
      console.error('Auto-booking error:', error);
      toast.error('An error occurred while auto-booking. Please try again or select a time slot manually.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      const appointmentData = {
        patientId: user?.id || '',
        dentistId: '', // Will be assigned by backend based on availability
        service: formData.service, // Use service to match CreateAppointmentDto interface
        date: formData.preferredDate,
        timeSlot: formData.preferredTime,
        notes: formData.notes,
        emergency: formData.emergency
      };
      
      const response = await appointmentService.createAppointment(appointmentData);
      
      if (response) {
        toast.success(t('appointment.success'));
        setIsModalOpen(false);
        setFormData({
          patientName: user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : '',
          patientEmail: user?.email || '',
          patientPhone: user?.phone || '',
          service: '',
          preferredDate: '',
          preferredTime: '',
          notes: '',
          emergency: false
        });
      } else {
        toast.error(t('appointment.error'));
      }
    } catch (error) {
      console.error('Appointment booking error:', error);
      toast.error(t('appointment.error'));
    } finally {
      setIsLoading(false);
    }
  };

  const getNextAvailableDates = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 1; i <= 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      // Skip weekends (Saturday = 6, Sunday = 0)
      if (date.getDay() !== 0 && date.getDay() !== 6) {
        dates.push(date.toISOString().split('T')[0]);
      }
    }
    
    return dates;
  };

  return (
    <>
      <Button 
        onClick={() => setIsModalOpen(true)}
        className="btn-primary group"
      >
        <Calendar className="w-5 h-5 mr-2 group-hover:animate-pulse" />
        {t('appointment.bookNow')}
      </Button>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={t('appointment.title')}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Patient Information */}
          <div className="grid md:grid-cols-2 gap-4">
            <Input
              label={t('appointment.fields.patientName')}
              value={formData.patientName}
              onChange={(e) => handleInputChange('patientName', e.target.value)}
              leftIcon={<User className="w-4 h-4" />}
              required
            />
            <Input
              label={t('appointment.fields.patientEmail')}
              type="email"
              value={formData.patientEmail}
              onChange={(e) => handleInputChange('patientEmail', e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
              required
            />
            <Input
              label={t('appointment.fields.patientPhone')}
              value={formData.patientPhone}
              onChange={(e) => handleInputChange('patientPhone', e.target.value)}
              leftIcon={<Phone className="w-4 h-4" />}
              required
            />
          </div>

          {/* Enhanced Service Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              {t('appointment.fields.service')} <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {services.map((service) => (
                <button
                  key={service.value}
                  type="button"
                  onClick={() => handleInputChange('service', service.value)}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    formData.service === service.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">{service.icon}</span>
                    <div>
                      <div className="font-medium text-gray-900">{service.label}</div>
                      <div className="text-sm text-gray-500">{service.description}</div>
                      <div className="text-xs text-gray-400 mt-1">{service.duration} minutes</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Date Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('appointment.fields.preferredDate')}
            </label>
            <div className="grid grid-cols-3 gap-2 max-h-32 overflow-y-auto">
              {getNextAvailableDates().map((date) => (
                <button
                  key={date}
                  type="button"
                  onClick={() => handleDateSelect(date)}
                  className={`p-2 text-sm rounded-lg border transition-colors ${
                    selectedDate === date
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
                  }`}
                >
                  {new Date(date).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </button>
              ))}
            </div>
          </div>

          {/* Auto-booking option */}
          {selectedDate && (
            <div className="mb-6">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-blue-900 mb-1">
                      {t('appointment.autoBook.title') || 'Quick Book'}
                    </h3>
                    <p className="text-xs text-blue-700">
                      {t('appointment.autoBook.description') || 'Automatically book the first available time slot for this date'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAutoBooking}
                    disabled={isLoading || !selectedDate || !formData.service}
                    className="ml-4 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-md transition-colors"
                  >
                    {isLoading ? (
                      <>
                        <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        {t('appointment.autoBook.booking') || 'Booking...'}
                      </>
                    ) : (
                      t('appointment.autoBook.button') || 'Auto Book'
                    )}
                  </button>
                </div>
              </div>

              <div className="text-center text-sm text-gray-500 mb-4">
                {t('appointment.orSelectManually') || 'Or select a time slot manually:'}
              </div>
            </div>
          )}

          {/* Enhanced Time Slots */}
          {selectedDate && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                {t('appointment.fields.preferredTime')} <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {availableSlots.map((slot) => {
                  const hour = parseInt(slot.time.split(':')[0]);
                  const isPeakHour = (hour >= 10 && hour <= 12) || (hour >= 14 && hour <= 16);
                  
                  return (
                    <button
                      key={slot.time}
                      type="button"
                      onClick={() => handleTimeSelect(slot.time)}
                      disabled={!slot.available}
                      className={`p-3 text-sm rounded-lg border transition-all ${
                        !slot.available
                          ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                          : formData.preferredTime === slot.time
                          ? 'bg-blue-600 text-white border-blue-600 shadow-lg scale-105'
                          : isPeakHour
                          ? 'bg-yellow-50 text-yellow-800 border-yellow-300 hover:border-yellow-400 hover:bg-yellow-100'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300 hover:bg-blue-50'
                      }`}
                    >
                      <div className="font-medium">{slot.time}</div>
                      {isPeakHour && (
                        <div className="text-xs opacity-75 mt-1">Peak</div>
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Peak hours (10 AM - 12 PM, 2 PM - 4 PM) may have higher demand
              </p>
            </div>
          )}

          {/* Emergency Checkbox */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="emergency"
              checked={formData.emergency}
              onChange={(e) => handleInputChange('emergency', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="emergency" className="text-sm text-gray-700">
              {t('appointment.fields.emergency')}
            </label>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('appointment.fields.notes')}
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={t('appointment.fields.notesPlaceholder')}
            />
          </div>

          {/* Enhanced Summary */}
          {formData.preferredDate && formData.preferredTime && (
            <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <div className="flex items-center space-x-2 mb-4">
                <CheckCircle className="w-6 h-6 text-blue-600" />
                <h3 className="font-semibold text-blue-900 text-lg">Appointment Summary</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 text-gray-500 mr-2" />
                    <span className="text-sm font-medium text-gray-600">Date:</span>
                    <span className="text-sm text-gray-900 ml-auto">
                      {new Date(formData.preferredDate).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </span>
                  </div>
                  
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 text-gray-500 mr-2" />
                    <span className="text-sm font-medium text-gray-600">Time:</span>
                    <span className="text-sm text-gray-900 ml-auto">{formData.preferredTime}</span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center">
                    <Stethoscope className="w-4 h-4 text-gray-500 mr-2" />
                    <span className="text-sm font-medium text-gray-600">Service:</span>
                    <span className="text-sm text-gray-900 ml-auto">
                      {services.find(s => s.value === formData.service)?.label}
                    </span>
                  </div>
                  

                </div>
              </div>
              
              {formData.emergency && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center">
                    <AlertTriangle className="w-4 h-4 text-red-500 mr-2" />
                    <span className="text-sm font-medium text-red-800">Emergency Appointment</span>
                  </div>
                  <p className="text-xs text-red-600 mt-1">
                    This appointment will be prioritized for urgent care
                  </p>
                </div>
              )}
              
              <div className="mt-4 pt-4 border-t border-blue-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Estimated Duration:</span>
                  <span className="text-sm font-semibold text-blue-600">
                    {services.find(s => s.value === formData.service)?.duration || 60} minutes
                  </span>
                </div>
              </div>
            </Card>
          )}

          {/* Submit Button */}
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={isLoading}
            >
              {t('appointment.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="btn-primary"
            >
              {isLoading ? (
                <LoadingSpinner size="sm" className="mr-2" />
              ) : (
                <Calendar className="w-4 h-4 mr-2" />
              )}
              {t('appointment.submit')}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default AppointmentBooking;
