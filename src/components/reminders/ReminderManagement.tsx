import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, Clock, AlertTriangle, CheckCircle, Play, Settings, Activity } from 'lucide-react';
import { Card, Button, Badge, Alert } from '../ui';
import toast from 'react-hot-toast';

interface QueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  total: number;
}

interface SystemStatus {
  queue: QueueStats;
  cronJobs: Record<string, boolean>;
  appointments: {
    upcomingWeek: number;
    withRemindersEnabled: number;
  };
  timestamp: string;
}

interface ReminderManagementProps {
  showHeader?: boolean;
}

const ReminderManagement: React.FC<ReminderManagementProps> = ({ showHeader = true }) => {
  const { t } = useTranslation();
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const fetchSystemStatus = async () => {
    try {
      const response = await fetch('/api/v1/reminders/system-status', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setSystemStatus(data.data);
      } else {
        console.error('Failed to fetch system status');
      }
    } catch (error) {
      console.error('Error fetching system status:', error);
    } finally {
      setLoading(false);
    }
  };

  const triggerReminderBatch = async () => {
    setProcessing(true);
    
    try {
      const response = await fetch('/api/v1/reminders/batch/trigger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (response.ok) {
        toast.success(t('reminders.batchTriggerSuccess'));
        // Refresh status after triggering
        setTimeout(() => {
          fetchSystemStatus();
        }, 2000);
      } else {
        toast.error(t('reminders.batchTriggerError'));
      }
    } catch (error) {
      toast.error(t('reminders.batchTriggerError'));
      console.error('Error triggering reminder batch:', error);
    } finally {
      setProcessing(false);
    }
  };

  useEffect(() => {
    fetchSystemStatus();
    
    // Refresh status every 5 minutes
    const interval = setInterval(fetchSystemStatus, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">{t('common.loading')}</span>
      </div>
    );
  }

  if (!systemStatus) {
    return (
      <Alert variant="error">
        <AlertTriangle className="h-4 w-4" />
        {t('reminders.errors.failedToLoadStatus')}
      </Alert>
    );
  }

  const getQueueHealthStatus = () => {
    const { queue } = systemStatus;
    const failureRate = queue.total > 0 ? (queue.failed / queue.total) * 100 : 0;
    
    if (failureRate > 20) return 'critical';
    if (failureRate > 10) return 'warning';
    if (queue.active === 0 && queue.waiting > 10) return 'warning';
    return 'healthy';
  };

  const getCronHealthStatus = () => {
    const activeJobs = Object.values(systemStatus.cronJobs).filter(Boolean).length;
    const totalJobs = Object.keys(systemStatus.cronJobs).length;
    
    if (activeJobs < totalJobs * 0.5) return 'critical';
    if (activeJobs < totalJobs) return 'warning';
    return 'healthy';
  };

  const healthStatus = getQueueHealthStatus();
  const cronStatus = getCronHealthStatus();

  return (
    <div className="space-y-6">
      {showHeader && (
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Bell className="h-6 w-6" />
              {t('reminders.title')}
            </h2>
            <p className="text-gray-600">{t('reminders.subtitle')}</p>
          </div>
          <Button 
            onClick={triggerReminderBatch} 
            disabled={processing}
            variant="primary"
          >
            {processing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {t('reminders.triggeringBatch')}
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                {t('reminders.triggerBatch')}
              </>
            )}
          </Button>
        </div>
      )}

      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{t('reminders.queueHealth')}</h3>
              <p className="text-sm text-gray-600">{t('reminders.queueHealthDescription')}</p>
            </div>
            <Badge 
              className={
                healthStatus === 'healthy' ? 'bg-green-100 text-green-800' :
                healthStatus === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }
            >
              {healthStatus === 'healthy' && <CheckCircle className="h-3 w-3 mr-1" />}
              {healthStatus === 'warning' && <AlertTriangle className="h-3 w-3 mr-1" />}
              {healthStatus === 'critical' && <AlertTriangle className="h-3 w-3 mr-1" />}
              {t(`reminders.healthStatus.${healthStatus}`)}
            </Badge>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{t('reminders.scheduledTasks')}</h3>
              <p className="text-sm text-gray-600">{t('reminders.scheduledTasksDescription')}</p>
            </div>
            <Badge 
              className={
                cronStatus === 'healthy' ? 'bg-green-100 text-green-800' :
                cronStatus === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }
            >
              {cronStatus === 'healthy' && <CheckCircle className="h-3 w-3 mr-1" />}
              {cronStatus === 'warning' && <AlertTriangle className="h-3 w-3 mr-1" />}
              {cronStatus === 'critical' && <AlertTriangle className="h-3 w-3 mr-1" />}
              {t(`reminders.healthStatus.${cronStatus}`)}
            </Badge>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{t('reminders.upcomingAppointments')}</h3>
              <p className="text-sm text-gray-600">{t('reminders.upcomingAppointmentsDescription')}</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">
                {systemStatus.appointments.withRemindersEnabled}
              </div>
              <div className="text-sm text-gray-600">
                of {systemStatus.appointments.upcomingWeek}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Queue Statistics */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Activity className="h-5 w-5" />
            {t('reminders.queueStatistics')}
          </h3>
          <Button variant="outline" size="sm" onClick={fetchSystemStatus}>
            {t('common.refresh')}
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{systemStatus.queue.waiting}</div>
            <div className="text-sm text-blue-600">{t('reminders.queue.waiting')}</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{systemStatus.queue.active}</div>
            <div className="text-sm text-green-600">{t('reminders.queue.active')}</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{systemStatus.queue.delayed}</div>
            <div className="text-sm text-purple-600">{t('reminders.queue.delayed')}</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-600">{systemStatus.queue.completed}</div>
            <div className="text-sm text-gray-600">{t('reminders.queue.completed')}</div>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{systemStatus.queue.failed}</div>
            <div className="text-sm text-red-600">{t('reminders.queue.failed')}</div>
          </div>
        </div>
      </Card>

      {/* Scheduled Jobs Status */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Settings className="h-5 w-5" />
          {t('reminders.scheduledJobs')}
        </h3>

        <div className="space-y-3">
          {Object.entries(systemStatus.cronJobs).map(([jobName, isActive]) => (
            <div key={jobName} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                {isActive ? (
                  <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                ) : (
                  <div className="h-2 w-2 bg-red-500 rounded-full"></div>
                )}
                <span className="font-medium text-gray-900">
                  {t(`reminders.jobs.${jobName}`, jobName)}
                </span>
              </div>
              <Badge 
                className={
                  isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }
              >
                {isActive ? t('common.active') : t('common.inactive')}
              </Badge>
            </div>
          ))}
        </div>
      </Card>

      {/* Last Updated */}
      <div className="text-center text-sm text-gray-500">
        <Clock className="h-4 w-4 inline mr-1" />
        {t('reminders.lastUpdated')}: {new Date(systemStatus.timestamp).toLocaleString()}
      </div>
    </div>
  );
};

export default ReminderManagement;
