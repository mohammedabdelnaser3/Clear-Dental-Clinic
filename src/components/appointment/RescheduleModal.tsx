import React, { useState } from 'react';
import { X, Calendar, Clock, FileText, AlertCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface Appointment {
  _id: string;
  date: string;
  timeSlot: string;
  duration: number;
  patientId: {
    firstName: string;
    lastName: string;
  };
  clinicId: {
    name: string;
  };
}

interface RescheduleModalProps {
  appointment: Appointment;
  onClose: () => void;
  onReschedule: (appointmentId: string, newDate: string, newTimeSlot: string, newDuration: number, reason: string) => Promise<void>;
}

const RescheduleModal: React.FC<RescheduleModalProps> = ({
  appointment,
  onClose,
  onReschedule
}) => {
  const [newDate, setNewDate] = useState(format(parseISO(appointment.date), 'yyyy-MM-dd'));
  const [newTimeSlot, setNewTimeSlot] = useState(appointment.timeSlot);
  const [newDuration, setNewDuration] = useState(appointment.duration);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleReschedule = async () => {
    // Validation
    if (!newDate || !newTimeSlot) {
      setError('Please select both date and time');
      return;
    }

    if (!reason.trim()) {
      setError('Please provide a reason for rescheduling');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      await onReschedule(appointment._id, newDate, newTimeSlot, newDuration, reason);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reschedule appointment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Reschedule Appointment</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={loading}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Current Appointment Info */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm font-medium text-blue-900 mb-2">Current Appointment</p>
            <p className="text-sm text-blue-800">
              <strong>Patient:</strong> {appointment.patientId.firstName} {appointment.patientId.lastName}
            </p>
            <p className="text-sm text-blue-800">
              <strong>Date:</strong> {format(parseISO(appointment.date), 'MMM dd, yyyy')} at {appointment.timeSlot}
            </p>
            <p className="text-sm text-blue-800">
              <strong>Duration:</strong> {appointment.duration} minutes
            </p>
            <p className="text-sm text-blue-800">
              <strong>Clinic:</strong> {appointment.clinicId.name}
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* New Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Calendar className="w-4 h-4 inline mr-1" />
              New Date
            </label>
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              min={format(new Date(), 'yyyy-MM-dd')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            />
          </div>

          {/* New Time Slot */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Clock className="w-4 h-4 inline mr-1" />
              New Time
            </label>
            <input
              type="time"
              value={newTimeSlot}
              onChange={(e) => setNewTimeSlot(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            />
          </div>

          {/* New Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Clock className="w-4 h-4 inline mr-1" />
              Duration (minutes)
            </label>
            <select
              value={newDuration}
              onChange={(e) => setNewDuration(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            >
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={45}>45 minutes</option>
              <option value={60}>1 hour</option>
              <option value={90}>1.5 hours</option>
              <option value={120}>2 hours</option>
            </select>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <FileText className="w-4 h-4 inline mr-1" />
              Reason for Rescheduling *
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="e.g., Doctor unavailable, patient request, emergency..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              disabled={loading}
              required
            />
          </div>

          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <AlertCircle className="w-4 h-4 inline mr-1" />
              The patient will be notified via email and SMS about the rescheduled appointment.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleReschedule}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline mr-2"></div>
                Rescheduling...
              </>
            ) : (
              <>
                <Calendar className="w-4 h-4 inline mr-2" />
                Reschedule & Notify
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RescheduleModal;

