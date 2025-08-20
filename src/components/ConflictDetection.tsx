import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Clock, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { Card, Button, Alert, Modal, Select } from './ui';
import adminService from '../services/adminService';

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

interface Conflict {
  id: string;
  staffId: string;
  staffName: string;
  date: string;
  conflictingSchedules: {
    schedule1: StaffSchedule;
    schedule2: StaffSchedule;
  };
  severity: 'high' | 'medium' | 'low';
  type: 'time_overlap' | 'double_booking' | 'insufficient_break';
  description: string;
}

interface ConflictDetectionProps {
  clinicId: string;
  schedules: StaffSchedule[];
  onResolveConflict: (conflictId: string) => void;
}

const ConflictDetection: React.FC<ConflictDetectionProps> = ({
  schedules,
  onResolveConflict,
}) => {
  const queryClient = useQueryClient();
  const [detectedConflicts, setDetectedConflicts] = useState<Conflict[]>([]);
  const [showResolutionModal, setShowResolutionModal] = useState(false);
  const [selectedConflict, setSelectedConflict] = useState<Conflict | null>(null);
  const [resolutionAction, setResolutionAction] = useState<'modify' | 'cancel' | 'reassign'>('modify');
  const [isResolving, setIsResolving] = useState(false);

  // Detect conflicts whenever schedules change
  useEffect(() => {
    detectConflicts();
  }, [schedules]);

  const detectConflicts = () => {
    const conflicts: Conflict[] = [];
    const schedulesByStaff = schedules.reduce((acc, schedule) => {
      const staffId = schedule.staffId._id;
      if (!acc[staffId]) {
        acc[staffId] = [];
      }
      acc[staffId].push(schedule);
      return acc;
    }, {} as Record<string, StaffSchedule[]>);

    // Check for conflicts within each staff member's schedules
    Object.entries(schedulesByStaff).forEach(([staffId, staffSchedules]) => {
      const sortedSchedules = staffSchedules.sort((a, b) => {
        const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime();
        if (dateCompare !== 0) return dateCompare;
        return a.startTime.localeCompare(b.startTime);
      });

      for (let i = 0; i < sortedSchedules.length - 1; i++) {
        const current = sortedSchedules[i];
        const next = sortedSchedules[i + 1];

        // Check if schedules are on the same date
        if (current.date.split('T')[0] === next.date.split('T')[0]) {
          const currentEnd = new Date(`2000-01-01T${current.endTime}`);
          const nextStart = new Date(`2000-01-01T${next.startTime}`);
          // Check for insufficient break time between shifts

          // Time overlap conflict
          if (currentEnd > nextStart) {
            conflicts.push({
              id: `${current._id}-${next._id}`,
              staffId,
              staffName: `${current.staffId.firstName} ${current.staffId.lastName}`,
              date: current.date,
              conflictingSchedules: {
                schedule1: current,
                schedule2: next,
              },
              severity: 'high',
              type: 'time_overlap',
              description: `Overlapping schedules: ${current.startTime}-${current.endTime} and ${next.startTime}-${next.endTime}`,
            });
          }
          // Insufficient break time (less than 30 minutes between shifts)
          else if (nextStart.getTime() - currentEnd.getTime() < 30 * 60 * 1000) {
            conflicts.push({
              id: `${current._id}-${next._id}-break`,
              staffId,
              staffName: `${current.staffId.firstName} ${current.staffId.lastName}`,
              date: current.date,
              conflictingSchedules: {
                schedule1: current,
                schedule2: next,
              },
              severity: 'medium',
              type: 'insufficient_break',
              description: `Insufficient break time between shifts (${Math.round((nextStart.getTime() - currentEnd.getTime()) / (1000 * 60))} minutes)`,
            });
          }
        }
      }
    });

    setDetectedConflicts(conflicts);
  };

  // Resolve conflict mutation
  const resolveConflictMutation = useMutation(
    async ({ action, scheduleId }: { action: string; scheduleId?: string }) => {
      if (action === 'cancel' && scheduleId) {
        await adminService.deleteStaffSchedule(scheduleId);
      }
      // Add other resolution actions as needed
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['schedules']);
        setShowResolutionModal(false);
        setSelectedConflict(null);
        onResolveConflict(selectedConflict?.id || '');
      },
    }
  );

  const handleResolveConflict = async () => {
    if (!selectedConflict) return;

    setIsResolving(true);
    try {
      if (resolutionAction === 'cancel') {
        // Let user choose which schedule to cancel
        const scheduleToCancel = selectedConflict.conflictingSchedules.schedule1._id;
        await resolveConflictMutation.mutateAsync({
          action: 'cancel',
          scheduleId: scheduleToCancel,
        });
      }
      // Add other resolution logic here
    } finally {
      setIsResolving(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getConflictIcon = (type: string) => {
    switch (type) {
      case 'time_overlap':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'double_booking':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'insufficient_break':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-500" />;
    }
  };

  if (detectedConflicts.length === 0) {
    return (
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <div className="ml-2">
          <h4 className="text-green-800 font-medium">No Conflicts Detected</h4>
          <p className="text-green-700 text-sm">All staff schedules are properly organized without conflicts.</p>
        </div>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <Alert className="border-red-200 bg-red-50">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <div className="ml-2">
          <h4 className="text-red-800 font-medium">
            {detectedConflicts.length} Scheduling Conflict{detectedConflicts.length > 1 ? 's' : ''} Detected
          </h4>
          <p className="text-red-700 text-sm">
            Please review and resolve the conflicts below to ensure proper staff scheduling.
          </p>
        </div>
      </Alert>

      <Card>
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Scheduling Conflicts</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={detectConflicts}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {detectedConflicts.map((conflict) => (
            <div key={conflict.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  {getConflictIcon(conflict.type)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-900">{conflict.staffName}</h4>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getSeverityColor(conflict.severity)}`}>
                        {conflict.severity.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{conflict.description}</p>
                    <div className="text-xs text-gray-500">
                      Date: {new Date(conflict.date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedConflict(conflict);
                    setShowResolutionModal(true);
                  }}
                >
                  Resolve
                </Button>
              </div>

              {/* Conflicting Schedules Details */}
              <div className="mt-3 ml-8 space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm font-medium text-gray-700 mb-1">Schedule 1</div>
                    <div className="text-sm text-gray-600">
                      {conflict.conflictingSchedules.schedule1.startTime} - {conflict.conflictingSchedules.schedule1.endTime}
                    </div>
                    <div className="text-xs text-gray-500">
                      {conflict.conflictingSchedules.schedule1.shiftType} shift
                    </div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm font-medium text-gray-700 mb-1">Schedule 2</div>
                    <div className="text-sm text-gray-600">
                      {conflict.conflictingSchedules.schedule2.startTime} - {conflict.conflictingSchedules.schedule2.endTime}
                    </div>
                    <div className="text-xs text-gray-500">
                      {conflict.conflictingSchedules.schedule2.shiftType} shift
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Resolution Modal */}
      {showResolutionModal && selectedConflict && (
        <Modal
        isOpen={showResolutionModal}
        onClose={() => {
          setShowResolutionModal(false);
          setSelectedConflict(null);
        }}
        title="Resolve Scheduling Conflict"
        size="lg"
      >
          <div className="space-y-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <h4 className="font-medium text-red-800">Conflict Details</h4>
              </div>
              <p className="text-sm text-red-700">{selectedConflict.description}</p>
              <p className="text-xs text-red-600 mt-1">
                Staff: {selectedConflict.staffName} | Date: {new Date(selectedConflict.date).toLocaleDateString()}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Resolution Action
              </label>
              <Select
                value={resolutionAction}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setResolutionAction(e.target.value as any)}
                options={[
                  { value: 'modify', label: 'Modify Schedule Times' },
                  { value: 'cancel', label: 'Cancel One Schedule' },
                  { value: 'reassign', label: 'Reassign to Different Staff' }
                ]}
              />
            </div>

            {resolutionAction === 'cancel' && (
              <Alert className="border-yellow-200 bg-yellow-50">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <div className="ml-2">
                  <p className="text-yellow-800 text-sm">
                    This will cancel the first conflicting schedule. You can manually reschedule if needed.
                  </p>
                </div>
              </Alert>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowResolutionModal(false);
                  setSelectedConflict(null);
                }}
                disabled={isResolving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleResolveConflict}
                disabled={isResolving}
              >
                {isResolving ? 'Resolving...' : 'Resolve Conflict'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ConflictDetection;