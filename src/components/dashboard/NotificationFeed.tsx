import React, { useState } from 'react';
import { Card, Button, Badge } from '../ui';
import {
  Bell,
  Calendar,
  Users,
  AlertCircle,
  CheckCircle,
  Clock,
  X,
  Settings,
  Filter,
  Trash2,
  User,
  CreditCard,
  ChevronRight
} from 'lucide-react';

export interface Notification {
  id: string;
  type: 'appointment' | 'patient' | 'payment' | 'system' | 'reminder' | 'alert';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  actionUrl?: string;
  actionLabel?: string;
  metadata?: {
    patientName?: string;
    appointmentTime?: string;
    amount?: number;
    clinicName?: string;
  };
}

interface NotificationFeedProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
  loading?: boolean;
  maxHeight?: string;
  showFilters?: boolean;
}

const NotificationFeed: React.FC<NotificationFeedProps> = ({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onClearAll,
  loading = false,
  maxHeight = 'max-h-96',
  showFilters = true
}) => {
  const [filter, setFilter] = useState<'all' | 'unread' | 'urgent'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const getNotificationIcon = (type: string, priority: string) => {
    const iconClass = `w-5 h-5 ${
      priority === 'urgent' ? 'text-red-500' : 
      priority === 'high' ? 'text-orange-500' : 
      priority === 'medium' ? 'text-blue-500' : 'text-gray-500'
    }`;

    switch (type) {
      case 'appointment':
        return <Calendar className={iconClass} />;
      case 'patient':
        return <Users className={iconClass} />;
      case 'payment':
        return <CreditCard className={iconClass} />;
      case 'system':
        return <Settings className={iconClass} />;
      case 'reminder':
        return <Clock className={iconClass} />;
      case 'alert':
        return <AlertCircle className={iconClass} />;
      default:
        return <Bell className={iconClass} />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatTimeAgo = (timestamp: Date): string => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread' && notification.read) return false;
    if (filter === 'urgent' && notification.priority !== 'urgent') return false;
    if (typeFilter !== 'all' && notification.type !== typeFilter) return false;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Bell className="w-5 h-5 text-blue-600" />
              {unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse"></div>
              )}
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              Notifications
              {unreadCount > 0 && (
                <Badge className="ml-2 bg-red-100 text-red-700 text-xs">
                  {unreadCount} new
                </Badge>
              )}
            </h3>
          </div>
          <div className="flex items-center space-x-2">
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={onMarkAllAsRead}
                className="text-xs"
              >
                Mark all read
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={onClearAll}
              className="text-xs text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Clear all
            </Button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b border-gray-100">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <div className="flex space-x-1">
                {['all', 'unread', 'urgent'].map((filterOption) => (
                  <Button
                    key={filterOption}
                    variant={filter === filterOption ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setFilter(filterOption as any)}
                    className="text-xs capitalize"
                  >
                    {filterOption}
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="text-xs border border-gray-200 rounded px-2 py-1 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">All types</option>
                <option value="appointment">Appointments</option>
                <option value="patient">Patients</option>
                <option value="payment">Payments</option>
                <option value="system">System</option>
                <option value="reminder">Reminders</option>
                <option value="alert">Alerts</option>
              </select>
            </div>
          </div>
        )}

        {/* Notifications List */}
        <div className={`${maxHeight} overflow-y-auto space-y-3`}>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-sm">
                {filter === 'all' ? 'No notifications yet' : `No ${filter} notifications`}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 rounded-xl border transition-all duration-200 hover:shadow-md group ${
                  notification.read 
                    ? 'bg-white border-gray-100' 
                    : 'bg-blue-50/50 border-blue-200 shadow-sm'
                }`}
              >
                <div className="flex items-start space-x-3">
                  {/* Icon */}
                  <div className={`p-2 rounded-lg flex-shrink-0 ${
                    notification.read ? 'bg-gray-100' : 'bg-white shadow-sm'
                  }`}>
                    {getNotificationIcon(notification.type, notification.priority)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className={`text-sm font-medium ${
                            notification.read ? 'text-gray-700' : 'text-gray-900'
                          }`}>
                            {notification.title}
                          </h4>
                          <Badge className={`text-xs ${getPriorityColor(notification.priority)}`}>
                            {notification.priority}
                          </Badge>
                        </div>
                        <p className={`text-sm ${
                          notification.read ? 'text-gray-500' : 'text-gray-600'
                        }`}>
                          {notification.message}
                        </p>
                        
                        {/* Metadata */}
                        {notification.metadata && (
                          <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500">
                            {notification.metadata.patientName && (
                              <span className="flex items-center space-x-1">
                                <User className="w-3 h-3" />
                                <span>{notification.metadata.patientName}</span>
                              </span>
                            )}
                            {notification.metadata.appointmentTime && (
                              <span className="flex items-center space-x-1">
                                <Clock className="w-3 h-3" />
                                <span>{notification.metadata.appointmentTime}</span>
                              </span>
                            )}
                            {notification.metadata.amount && (
                              <span className="flex items-center space-x-1">
                                <CreditCard className="w-3 h-3" />
                                <span>${notification.metadata.amount}</span>
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!notification.read && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onMarkAsRead(notification.id)}
                            className="text-xs px-2 py-1"
                          >
                            <CheckCircle className="w-3 h-3" />
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onDelete(notification.id)}
                          className="text-xs px-2 py-1 text-red-600 hover:text-red-700"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Action Button */}
                    {notification.actionUrl && notification.actionLabel && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs flex items-center space-x-1 hover:bg-blue-50"
                        >
                          <span>{notification.actionLabel}</span>
                          <ChevronRight className="w-3 h-3" />
                        </Button>
                      </div>
                    )}

                    {/* Timestamp */}
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs text-gray-400">
                        {formatTimeAgo(notification.timestamp)}
                      </span>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {filteredNotifications.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100 text-center">
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
            >
              View all notifications
              <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};

export default NotificationFeed;
