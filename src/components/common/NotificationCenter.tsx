import React, { useState, useEffect } from 'react';
import { Bell, X, Check, CheckCheck, Trash2, Calendar, FileText, AlertCircle, MessageSquare, Info } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  _id: string;
  userId: string;
  type: 'appointment' | 'prescription' | 'message' | 'cancellation' | 'reminder' | 'system';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  data?: {
    appointmentId?: string;
    prescriptionId?: string;
    messageId?: string;
    actionUrl?: string;
  };
}

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, filter]);

  const fetchNotifications = async (pageNum: number = 1) => {
    try {
      setLoading(true);
      const response = await api.get('/notifications', {
        params: {
          page: pageNum,
          limit: 20,
          unreadOnly: filter === 'unread'
        }
      });

      if (response.data.success) {
        const newNotifications = response.data.data.notifications || response.data.data;
        if (pageNum === 1) {
          setNotifications(newNotifications);
        } else {
          setNotifications(prev => [...prev, ...newNotifications]);
        }
        setHasMore(newNotifications.length === 20);
        setPage(pageNum);
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Failed to fetch notifications:', error);
      }
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await api.patch(`/notifications/${notificationId}/read`);
      setNotifications(prev =>
        prev.map(n => n._id === notificationId ? { ...n, read: true } : n)
      );
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Failed to mark as read:', error);
      }
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch('/notifications/mark-all-read');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      toast.success('All notifications marked as read');
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Failed to mark all as read:', error);
      }
      toast.error('Failed to mark all as read');
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await api.delete(`/notifications/${notificationId}`);
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
      toast.success('Notification deleted');
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Failed to delete notification:', error);
      }
      toast.error('Failed to delete notification');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'appointment':
        return <Calendar className="w-5 h-5 text-blue-600" />;
      case 'prescription':
        return <FileText className="w-5 h-5 text-green-600" />;
      case 'message':
        return <MessageSquare className="w-5 h-5 text-purple-600" />;
      case 'cancellation':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'reminder':
        return <Bell className="w-5 h-5 text-orange-600" />;
      case 'system':
        return <Info className="w-5 h-5 text-gray-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'appointment':
        return 'bg-blue-50 border-blue-200';
      case 'prescription':
        return 'bg-green-50 border-green-200';
      case 'message':
        return 'bg-purple-50 border-purple-200';
      case 'cancellation':
        return 'bg-red-50 border-red-200';
      case 'reminder':
        return 'bg-orange-50 border-orange-200';
      case 'system':
        return 'bg-gray-50 border-gray-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification._id);
    }

    if (notification.data?.actionUrl) {
      window.location.href = notification.data.actionUrl;
      onClose();
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-25 z-40"
        onClick={onClose}
      />

      {/* Notification Panel */}
      <div className="fixed right-0 top-0 h-full w-full sm:w-96 bg-white shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center">
            <Bell className="w-6 h-6 text-blue-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">
              Notifications
              {unreadCount > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-red-500 text-white rounded-full">
                  {unreadCount}
                </span>
              )}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              filter === 'unread'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Unread {unreadCount > 0 && `(${unreadCount})`}
          </button>
        </div>

        {/* Actions Bar */}
        {notifications.length > 0 && unreadCount > 0 && (
          <div className="flex items-center justify-end p-3 border-b border-gray-200 bg-gray-50">
            <button
              onClick={markAllAsRead}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center"
            >
              <CheckCheck className="w-4 h-4 mr-1" />
              Mark all as read
            </button>
          </div>
        )}

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {loading && notifications.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <Bell className="w-16 h-16 text-gray-300 mb-4" />
              <p className="text-lg font-medium">No notifications</p>
              <p className="text-sm">You're all caught up!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                    !notification.read ? 'bg-blue-50/50' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 flex-shrink-0 ${getNotificationColor(notification.type)}`}>
                      {getNotificationIcon(notification.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className={`text-sm font-semibold ${
                            !notification.read ? 'text-gray-900' : 'text-gray-700'
                          }`}>
                            {notification.title}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-2">
                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                          </p>
                        </div>

                        <div className="flex items-center ml-2">
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full mr-2"></div>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification._id);
                            }}
                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                            title="Delete notification"
                          >
                            <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-600" />
                          </button>
                        </div>
                      </div>

                      {!notification.read && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification._id);
                          }}
                          className="text-xs text-blue-600 hover:text-blue-700 mt-2 flex items-center"
                        >
                          <Check className="w-3 h-3 mr-1" />
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Load More */}
          {hasMore && notifications.length > 0 && (
            <div className="p-4 text-center">
              <button
                onClick={() => fetchNotifications(page + 1)}
                disabled={loading}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Load more'}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default NotificationCenter;

