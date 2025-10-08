import React, { useState } from 'react';
import { X, Trash2, AlertCircle, Mail, MessageSquare, Bell } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface Appointment {
  _id: string;
  date: string;
  timeSlot: string;
  patientId: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  clinicId: {
    name: string;
  };
  serviceType: string;
}

interface CancelConfirmDialogProps {
  appointment: Appointment;
  onClose: () => void;
  onConfirm: (appointmentId: string, cancellationReason: string, notifyPatient: boolean) => Promise<void>;
}

const CancelConfirmDialog: React.FC<CancelConfirmDialogProps> = ({
  appointment,
  onClose,
  onConfirm
}) => {
  const [cancellationReason, setCancellationReason] = useState('');
  const [notifyPatient, setNotifyPatient] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConfirm = async () => {
    if (!cancellationReason.trim()) {
      setError('Please provide a cancellation reason');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      await onConfirm(appointment._id, cancellationReason, notifyPatient);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to cancel appointment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mr-3">
              <Trash2 className="w-5 h-5 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Cancel Appointment</h2>
          </div>
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
          {/* Appointment Info */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-900 mb-2">Appointment Details</p>
            <div className="space-y-1 text-sm text-gray-700">
              <p><strong>Patient:</strong> {appointment.patientId.firstName} {appointment.patientId.lastName}</p>
              <p><strong>Date:</strong> {format(parseISO(appointment.date), 'MMM dd, yyyy')} at {appointment.timeSlot}</p>
              <p><strong>Service:</strong> {appointment.serviceType}</p>
              <p><strong>Clinic:</strong> {appointment.clinicId.name}</p>
            </div>
          </div>

          {/* Warning */}
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-900">Warning</p>
              <p className="text-sm text-red-700 mt-1">
                This action cannot be undone. The appointment will be permanently cancelled.
              </p>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Cancellation Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cancellation Reason *
            </label>
            <textarea
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              rows={3}
              placeholder="e.g., Doctor emergency, equipment malfunction, patient no-show..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              disabled={loading}
              required
            />
          </div>

          {/* Notify Patient Checkbox */}
          <div className="flex items-start">
            <input
              type="checkbox"
              id="notifyPatient"
              checked={notifyPatient}
              onChange={(e) => setNotifyPatient(e.target.checked)}
              className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              disabled={loading}
            />
            <label htmlFor="notifyPatient" className="ml-3">
              <p className="text-sm font-medium text-gray-900">
                Notify patient about cancellation
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Patient will receive notifications via:
              </p>
              <div className="flex items-center gap-3 mt-2 text-xs text-gray-600">
                <span className="flex items-center">
                  <Mail className="w-3 h-3 mr-1" />
                  Email to {appointment.patientId.email}
                </span>
                <span className="flex items-center">
                  <MessageSquare className="w-3 h-3 mr-1" />
                  SMS to {appointment.patientId.phone}
                </span>
                <span className="flex items-center">
                  <Bell className="w-3 h-3 mr-1" />
                  In-app notification
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={loading}
          >
            Keep Appointment
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline mr-2"></div>
                Cancelling...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 inline mr-2" />
                Cancel Appointment
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CancelConfirmDialog;

