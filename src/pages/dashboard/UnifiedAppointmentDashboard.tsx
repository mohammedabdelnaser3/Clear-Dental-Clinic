import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import { Calendar, List, Filter, Clock, MapPin, User, Phone, Mail, Edit2, Trash2, RotateCcw, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, parseISO, addDays, subDays } from 'date-fns';
import { toast } from 'react-hot-toast';
import AppointmentFilterPanel from '../../components/appointment/AppointmentFilterPanel';
import QuickEditModal from '../../components/appointment/QuickEditModal';
import RescheduleModal from '../../components/appointment/RescheduleModal';
import CancelConfirmDialog from '../../components/appointment/CancelConfirmDialog';

interface Appointment {
  _id: string;
  patientId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateOfBirth: string;
  };
  dentistId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  clinicId: {
    _id: string;
    name: string;
    address: {
      street: string;
      city: string;
      state: string;
    };
    phone: string;
  };
  date: string;
  timeSlot: string;
  duration: number;
  serviceType: string;
  status: 'scheduled' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled' | 'no-show';
  notes?: string;
  emergency?: boolean;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
}

interface AppointmentsByClinic {
  [clinicName: string]: {
    clinic: Appointment['clinicId'];
    appointments: Appointment[];
    count: number;
  };
}

interface Filters {
  startDate: string;
  endDate: string;
  clinicId: string;
  patientName: string;
  status: string;
  sortBy: 'date' | 'createdAt' | 'status';
  sortOrder: 'asc' | 'desc';
}

type ViewMode = 'calendar' | 'list' | 'grouped';

const UnifiedAppointmentDashboard: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  // State management
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [appointmentsByClinic, setAppointmentsByClinic] = useState<AppointmentsByClinic>({});
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [stats, setStats] = useState<any>(null);

  // Modal states
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showQuickEdit, setShowQuickEdit] = useState(false);
  const [showReschedule, setShowReschedule] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // Filters
  const [filters, setFilters] = useState<Filters>({
    startDate: format(startOfWeek(new Date()), 'yyyy-MM-dd'),
    endDate: format(endOfWeek(new Date()), 'yyyy-MM-dd'),
    clinicId: '',
    patientName: '',
    status: '',
    sortBy: 'date',
    sortOrder: 'asc'
  });

  // Fetch appointments
  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const endpoint = isAdmin ? '/appointments/unified/admin' : '/appointments/unified/doctor';
      
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
        ...(filters.clinicId && { clinicId: filters.clinicId }),
        ...(filters.patientName && { patientName: filters.patientName }),
        ...(filters.status && { status: filters.status }),
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      });

      const response = await api.get(`${endpoint}?${params}`);
      
      if (response.data.success) {
        setAppointments(response.data.data.appointments);
        if (!isAdmin && response.data.data.appointmentsByClinic) {
          setAppointmentsByClinic(response.data.data.appointmentsByClinic);
        }
        setPagination(response.data.data.pagination);
        setStats(response.data.data.stats);
      }
    } catch (error: any) {
      console.error('Error fetching appointments:', error);
      toast.error(error.response?.data?.message || 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [pagination.page, filters]);

  // Handle quick edit
  const handleQuickEdit = async (appointmentId: string, updates: { timeSlot?: string; notes?: string; duration?: number }) => {
    try {
      const response = await api.patch(`/appointments/${appointmentId}/quick-update`, updates);
      
      if (response.data.success) {
        toast.success('Appointment updated successfully');
        fetchAppointments();
        setShowQuickEdit(false);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update appointment');
    }
  };

  // Handle cancel with notification
  const handleCancelAppointment = async (appointmentId: string, cancellationReason: string, notifyPatient: boolean) => {
    try {
      const response = await api.post(`/appointments/${appointmentId}/cancel-notify`, {
        cancellationReason,
        notifyPatient
      });
      
      if (response.data.success) {
        const notifications = response.data.data.notificationsSent;
        toast.success(
          `Appointment cancelled${notifyPatient ? ` (Email: ${notifications.email ? '✓' : '✗'}, SMS: ${notifications.sms ? '✓' : '✗'})` : ''}`
        );
        fetchAppointments();
        setShowCancelConfirm(false);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to cancel appointment');
    }
  };

  // Handle reschedule
  const handleReschedule = async (appointmentId: string, newDate: string, newTimeSlot: string, newDuration: number, reason: string) => {
    try {
      const response = await api.post(`/appointments/${appointmentId}/reschedule-enhanced`, {
        newDate,
        newTimeSlot,
        newDuration,
        reason
      });
      
      if (response.data.success) {
        const notifications = response.data.data.notificationsSent;
        toast.success(`Appointment rescheduled (Email: ${notifications.email ? '✓' : '✗'}, SMS: ${notifications.sms ? '✓' : '✗'})`);
        fetchAppointments();
        setShowReschedule(false);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reschedule appointment');
    }
  };

  // Filter appointments by selected date for calendar view
  const appointmentsForSelectedDate = useMemo(() => {
    return appointments.filter(apt => 
      isSameDay(parseISO(apt.date), selectedDate)
    );
  }, [appointments, selectedDate]);

  // Get week days for calendar view
  const weekDays = useMemo(() => {
    const start = startOfWeek(selectedDate);
    const end = endOfWeek(selectedDate);
    return eachDayOfInterval({ start, end });
  }, [selectedDate]);

  // Status badge colors
  const getStatusColor = (status: string) => {
    const colors = {
      scheduled: 'bg-blue-100 text-blue-800',
      confirmed: 'bg-green-100 text-green-800',
      'in-progress': 'bg-yellow-100 text-yellow-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
      'no-show': 'bg-orange-100 text-orange-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  // Render appointment card
  const renderAppointmentCard = (appointment: Appointment) => (
    <div
      key={appointment._id}
      className={`bg-white rounded-lg shadow-sm border-l-4 p-3 sm:p-4 mb-3 hover:shadow-md transition-shadow ${
        appointment.emergency ? 'border-red-500' : 'border-blue-500'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
        <div className="flex-1 min-w-0">
          {/* Patient Info */}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <User className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
              {appointment.patientId.firstName} {appointment.patientId.lastName}
            </h3>
            {appointment.emergency && (
              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 whitespace-nowrap">
                EMERGENCY
              </span>
            )}
          </div>

          {/* Appointment Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
            <div className="flex items-center text-xs sm:text-sm text-gray-600">
              <Clock className="w-4 h-4 mr-2 flex-shrink-0" />
              <span className="truncate">{format(parseISO(appointment.date), 'MMM dd, yyyy')} at {appointment.timeSlot} ({appointment.duration} min)</span>
            </div>
            <div className="flex items-center text-xs sm:text-sm text-gray-600">
              <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
              <span className="truncate">{appointment.clinicId.name}</span>
            </div>
            <div className="flex items-center text-xs sm:text-sm text-gray-600">
              <Phone className="w-4 h-4 mr-2 flex-shrink-0" />
              <span className="truncate">{appointment.patientId.phone}</span>
            </div>
            <div className="flex items-center text-xs sm:text-sm text-gray-600">
              <Mail className="w-4 h-4 mr-2 flex-shrink-0" />
              <span className="truncate">{appointment.patientId.email}</span>
            </div>
          </div>

          {/* Service Type & Status */}
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 text-sm font-medium rounded-full bg-blue-50 text-blue-700">
              {appointment.serviceType}
            </span>
            <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(appointment.status)}`}>
              {appointment.status.replace('-', ' ').toUpperCase()}
            </span>
          </div>

          {/* Notes */}
          {appointment.notes && (
            <p className="text-sm text-gray-600 mt-2">
              <span className="font-medium">Notes:</span> {appointment.notes}
            </p>
          )}

          {/* Cancellation Reason */}
          {appointment.cancellationReason && (
            <div className="mt-2 p-2 bg-red-50 rounded-md">
              <p className="text-sm text-red-700">
                <AlertCircle className="w-4 h-4 inline mr-1" />
                <span className="font-medium">Cancelled:</span> {appointment.cancellationReason}
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {appointment.status !== 'completed' && appointment.status !== 'cancelled' && (
          <div className="flex sm:flex-col gap-2 sm:ml-4 w-full sm:w-auto">
            <button
              onClick={() => {
                setSelectedAppointment(appointment);
                setShowQuickEdit(true);
              }}
              className="flex-1 sm:flex-none p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors min-h-[44px] sm:min-h-0"
              title="Quick Edit"
            >
              <Edit2 className="w-5 h-5 mx-auto" />
            </button>
            <button
              onClick={() => {
                setSelectedAppointment(appointment);
                setShowReschedule(true);
              }}
              className="flex-1 sm:flex-none p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors min-h-[44px] sm:min-h-0"
              title="Reschedule"
            >
              <RotateCcw className="w-5 h-5 mx-auto" />
            </button>
            <button
              onClick={() => {
                setSelectedAppointment(appointment);
                setShowCancelConfirm(true);
              }}
              className="flex-1 sm:flex-none p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors min-h-[44px] sm:min-h-0"
              title="Cancel"
            >
              <Trash2 className="w-5 h-5 mx-auto" />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  if (loading && appointments.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            {isAdmin ? 'All Appointments' : 'My Appointments'}
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            {isAdmin ? 'Manage all appointments across all clinics' : 'View and manage your appointments across all assigned clinics'}
          </p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4">
              <p className="text-xs sm:text-sm text-gray-600 mb-1 truncate">Total Appointments</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.totalAppointments || 0}</p>
            </div>
            {!isAdmin && (
              <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4">
                <p className="text-xs sm:text-sm text-gray-600 mb-1 truncate">Clinics</p>
                <p className="text-xl sm:text-2xl font-bold text-blue-600">{stats.clinicsCount || 0}</p>
              </div>
            )}
            <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4">
              <p className="text-xs sm:text-sm text-gray-600 mb-1 truncate">Today</p>
              <p className="text-xl sm:text-2xl font-bold text-green-600">{stats.todayCount || stats.todayAppointments || 0}</p>
            </div>
            {isAdmin && stats.byStatus && (
              <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4">
                <p className="text-xs sm:text-sm text-gray-600 mb-1 truncate">Confirmed</p>
                <p className="text-xl sm:text-2xl font-bold text-green-600">{stats.byStatus.confirmed || 0}</p>
              </div>
            )}
          </div>
        )}

        {/* Toolbar */}
        <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            {/* View Mode Toggles */}
            <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap min-h-[44px] sm:min-h-0 ${
                  viewMode === 'list'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <List className="w-4 h-4 sm:w-5 sm:h-5 inline mr-1 sm:mr-2" />
                <span className="text-sm sm:text-base">List</span>
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap min-h-[44px] sm:min-h-0 ${
                  viewMode === 'calendar'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 inline mr-1 sm:mr-2" />
                <span className="text-sm sm:text-base">Calendar</span>
              </button>
              {!isAdmin && (
                <button
                  onClick={() => setViewMode('grouped')}
                  className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap min-h-[44px] sm:min-h-0 ${
                    viewMode === 'grouped'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <MapPin className="w-4 h-4 sm:w-5 sm:h-5 inline mr-1 sm:mr-2" />
                  <span className="text-sm sm:text-base">By Clinic</span>
                </button>
              )}
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-3 sm:px-4 py-2 rounded-lg font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors whitespace-nowrap min-h-[44px] sm:min-h-0 w-full sm:w-auto"
            >
              <Filter className="w-4 h-4 sm:w-5 sm:h-5 inline mr-1 sm:mr-2" />
              <span className="text-sm sm:text-base">Filters</span>
              {(filters.clinicId || filters.patientName || filters.status) && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-blue-600 text-white rounded-full">
                  Active
                </span>
              )}
            </button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <AppointmentFilterPanel
              filters={filters}
              onFiltersChange={setFilters}
              isAdmin={isAdmin}
            />
          )}
        </div>

        {/* Content */}
        {viewMode === 'list' && (
          <div>
            {appointments.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments found</h3>
                <p className="text-gray-600">Try adjusting your filters or date range</p>
              </div>
            ) : (
              <>
                {appointments.map(renderAppointmentCard)}
                
                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6">
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                      disabled={pagination.page === 1}
                      className="px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      <ChevronLeft className="w-5 h-5 inline mr-1" />
                      Previous
                    </button>
                    <span className="text-gray-600">
                      Page {pagination.page} of {pagination.totalPages}
                    </span>
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                      disabled={pagination.page === pagination.totalPages}
                      className="px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Next
                      <ChevronRight className="w-5 h-5 inline ml-1" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {viewMode === 'calendar' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {format(selectedDate, 'MMMM yyyy')}
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedDate(subDays(selectedDate, 7))}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setSelectedDate(new Date())}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Today
                </button>
                <button
                  onClick={() => setSelectedDate(addDays(selectedDate, 7))}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Week Days */}
            <div className="grid grid-cols-7 gap-4 mb-4">
              {weekDays.map(day => (
                <div
                  key={day.toString()}
                  onClick={() => setSelectedDate(day)}
                  className={`p-4 rounded-lg cursor-pointer transition-colors ${
                    isSameDay(day, selectedDate)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="text-center">
                    <p className="text-xs font-medium mb-1">{format(day, 'EEE')}</p>
                    <p className="text-2xl font-bold">{format(day, 'd')}</p>
                    <p className="text-xs mt-1">
                      {appointments.filter(apt => isSameDay(parseISO(apt.date), day)).length} appts
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Selected Day Appointments */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {format(selectedDate, 'EEEE, MMMM d, yyyy')}
              </h3>
              {appointmentsForSelectedDate.length === 0 ? (
                <p className="text-gray-600 text-center py-8">No appointments for this day</p>
              ) : (
                appointmentsForSelectedDate.map(renderAppointmentCard)
              )}
            </div>
          </div>
        )}

        {viewMode === 'grouped' && !isAdmin && (
          <div>
            {Object.entries(appointmentsByClinic).map(([clinicName, data]) => (
              <div key={clinicName} className="mb-8">
                <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">{clinicName}</h2>
                      <p className="text-sm text-gray-600">
                        {data.clinic.address.city}, {data.clinic.address.state} • {data.clinic.phone}
                      </p>
                    </div>
                    <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full font-semibold">
                      {data.count} appointments
                    </span>
                  </div>
                </div>
                {data.appointments.map(renderAppointmentCard)}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showQuickEdit && selectedAppointment && (
        <QuickEditModal
          appointment={selectedAppointment}
          onClose={() => setShowQuickEdit(false)}
          onSave={handleQuickEdit}
        />
      )}

      {showReschedule && selectedAppointment && (
        <RescheduleModal
          appointment={selectedAppointment}
          onClose={() => setShowReschedule(false)}
          onReschedule={handleReschedule}
        />
      )}

      {showCancelConfirm && selectedAppointment && (
        <CancelConfirmDialog
          appointment={selectedAppointment}
          onClose={() => setShowCancelConfirm(false)}
          onConfirm={handleCancelAppointment}
        />
      )}
    </div>
  );
};

export default UnifiedAppointmentDashboard;

