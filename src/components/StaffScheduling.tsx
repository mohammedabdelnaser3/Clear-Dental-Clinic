import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Users, Plus, Edit, Trash2 } from 'lucide-react';
import { Card, Button, Select, Modal, Spinner } from './ui';
import { useAuth } from '../hooks/useAuth';
import adminService from '../services/adminService';
import ScheduleCalendar from './ScheduleCalendar';
import ScheduleForm from './ScheduleForm';
import ConflictDetection from './ConflictDetection';

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

interface Clinic {
  _id: string;
  name: string;
  address: string;
}

const StaffScheduling: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedClinic, setSelectedClinic] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<StaffSchedule | null>(null);
  const [filters, setFilters] = useState({
    staffId: '',
    shiftType: '',
    status: ''
  });

  // Fetch clinics
  const { data: clinicsData } = useQuery({
    queryKey: ['clinics'],
    queryFn: () => adminService.getAdminClinics(),
    enabled: !!user && (user.role === 'admin' || user.role === 'staff'),
  });

  // Fetch staff members for selected clinic
  const { data: staffData } = useQuery({
    queryKey: ['staff', selectedClinic],
    queryFn: () => adminService.getStaffByClinic(selectedClinic),
    enabled: !!selectedClinic,
  });

  // Fetch schedules
  const { data: schedulesData, isLoading: schedulesLoading } = useQuery({
    queryKey: ['schedules', selectedClinic, selectedDate, filters],
    queryFn: () => {
      const startDate = new Date(selectedDate);
      startDate.setDate(startDate.getDate() - 7);
      const endDate = new Date(selectedDate);
      endDate.setDate(endDate.getDate() + 7);
      
      return adminService.getStaffSchedules({
        clinicId: selectedClinic,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        ...filters
      });
    },
    enabled: !!selectedClinic,
  });

  // Create schedule mutation
  const createScheduleMutation = useMutation({
    mutationFn: (scheduleData: any) => adminService.createStaffSchedule(scheduleData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      setShowScheduleForm(false);
    },
  });

  // Update schedule mutation
  const updateScheduleMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => adminService.updateStaffSchedule(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      setEditingSchedule(null);
      setShowScheduleForm(false);
    },
  });

  // Delete schedule mutation
  const deleteScheduleMutation = useMutation({
    mutationFn: (id: string) => adminService.deleteStaffSchedule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
    },
  });

  const clinics: Clinic[] = clinicsData?.data?.clinics || [];
  const staff: StaffMember[] = staffData?.data?.staff || [];
  const schedules: StaffSchedule[] = (schedulesData?.data as any)?.items || [];

  useEffect(() => {
    if (clinics.length > 0 && !selectedClinic) {
      setSelectedClinic(clinics[0]._id);
    }
  }, [clinics, selectedClinic]);

  const handleCreateSchedule = (scheduleData: any) => {
    createScheduleMutation.mutate({
      ...scheduleData,
      clinicId: selectedClinic,
    });
  };

  const handleUpdateSchedule = (scheduleData: any) => {
    if (editingSchedule) {
      updateScheduleMutation.mutate({
        id: editingSchedule._id,
        data: scheduleData,
      });
    }
  };

  const handleDeleteSchedule = (scheduleId: string) => {
    if (window.confirm(t('staff_scheduling.delete_confirmation'))) {
      deleteScheduleMutation.mutate(scheduleId);
    }
  };

  const handleEditSchedule = (schedule: StaffSchedule) => {
    setEditingSchedule(schedule);
    setShowScheduleForm(true);
  };

  const getShiftTypeColor = (shiftType: string) => {
    const colors = {
      morning: 'bg-yellow-100 text-yellow-800',
      afternoon: 'bg-blue-100 text-blue-800',
      evening: 'bg-purple-100 text-purple-800',
      night: 'bg-gray-100 text-gray-800',
      'full-day': 'bg-green-100 text-green-800',
    };
    return colors[shiftType as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      scheduled: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      'no-show': 'bg-orange-100 text-orange-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('staff_scheduling.title')}</h1>
          <p className="text-gray-600">{t('staff_scheduling.description')}</p>
        </div>
        <Button
          onClick={() => {
            setEditingSchedule(null);
            setShowScheduleForm(true);
          }}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          {t('staff_scheduling.add_schedule')}
        </Button>
      </div>

      {/* Filters and Controls */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('staff_scheduling.clinic')}
            </label>
            <Select
              value={selectedClinic}
              onChange={(e) => setSelectedClinic(e.target.value)}
              options={[
                { value: '', label: t('staff_scheduling.select_clinic') },
                ...clinics.map((clinic) => ({
                  value: clinic._id,
                  label: clinic.name
                }))
              ]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('staff_scheduling.staff_member')}
            </label>
            <Select
              value={filters.staffId}
              onChange={(e) => setFilters({ ...filters, staffId: e.target.value })}
              options={[
                { value: '', label: t('staff_scheduling.all_staff') },
                ...staff.map((member) => ({
                  value: member._id,
                  label: `${member.firstName} ${member.lastName} (${member.role})`
                }))
              ]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('staff_scheduling.shift_type')}
            </label>
            <Select
              value={filters.shiftType}
              onChange={(e) => setFilters({ ...filters, shiftType: e.target.value })}
              options={[
                { value: '', label: t('staff_scheduling.all_shifts') },
                { value: 'morning', label: t('staff_scheduling.morning') },
                { value: 'afternoon', label: t('staff_scheduling.afternoon') },
                { value: 'evening', label: t('staff_scheduling.evening') },
                { value: 'night', label: t('staff_scheduling.night') },
                { value: 'full-day', label: t('staff_scheduling.full_day') }
              ]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('staff_scheduling.status')}
            </label>
            <Select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              options={[
                { value: '', label: t('staff_scheduling.all_status') },
                { value: 'scheduled', label: t('staff_scheduling.scheduled') },
                { value: 'completed', label: t('staff_scheduling.completed') },
                { value: 'cancelled', label: t('staff_scheduling.cancelled') },
                { value: 'no-show', label: t('staff_scheduling.no_show') }
              ]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('staff_scheduling.view_mode')}
            </label>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'calendar' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setViewMode('calendar')}
                className="flex items-center gap-1"
              >
                <Calendar className="h-4 w-4" />
                Calendar
              </Button>
              <Button
                variant={viewMode === 'list' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="flex items-center gap-1"
              >
                <Users className="h-4 w-4" />
                {t('staff_scheduling.list')}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Conflict Detection */}
      {selectedClinic && (
        <ConflictDetection
          clinicId={selectedClinic}
          schedules={schedules}
          onResolveConflict={() => {
            // Handle conflict resolution
            queryClient.invalidateQueries({ queryKey: ['schedules'] });
          }}
        />
      )}

      {/* Main Content */}
      {schedulesLoading ? (
        <div className="flex justify-center items-center h-64">
          <Spinner size="lg" />
        </div>
      ) : (
        <div>
          {viewMode === 'calendar' ? (
            <ScheduleCalendar
              schedules={schedules}
              staff={staff}
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
              onEditSchedule={handleEditSchedule}
              onDeleteSchedule={handleDeleteSchedule}
              getShiftTypeColor={getShiftTypeColor}
              getStatusColor={getStatusColor}
            />
          ) : (
            <Card>
              <div className="p-4 border-b">
                <h3 className="text-lg font-semibold">{t('staff_scheduling.schedule_list')}</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('staff_scheduling.staff_member')}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('staff_scheduling.date')}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('staff_scheduling.time')}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('staff_scheduling.shift_type')}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('staff_scheduling.status')}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('staff_scheduling.actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {schedules.map((schedule) => (
                      <tr key={schedule._id}>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {schedule.staffId.firstName} {schedule.staffId.lastName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {schedule.staffId.role}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(schedule.date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          {schedule.startTime} - {schedule.endTime}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getShiftTypeColor(schedule.shiftType)}`}>
                            {schedule.shiftType}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(schedule.status)}`}>
                            {schedule.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditSchedule(schedule)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteSchedule(schedule._id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Schedule Form Modal */}
      {showScheduleForm && (
        <Modal
          isOpen={showScheduleForm}
          onClose={() => {
            setShowScheduleForm(false);
            setEditingSchedule(null);
          }}
          title={editingSchedule ? 'Edit Schedule' : 'Create Schedule'}
          size="lg"
        >
          <ScheduleForm
            schedule={editingSchedule}
            staff={staff}
            onSubmit={editingSchedule ? handleUpdateSchedule : handleCreateSchedule}
            onCancel={() => {
              setShowScheduleForm(false);
              setEditingSchedule(null);
            }}
            isLoading={createScheduleMutation.isLoading || updateScheduleMutation.isLoading}
          />
        </Modal>
      )}
    </div>
  );
};

export default StaffScheduling;