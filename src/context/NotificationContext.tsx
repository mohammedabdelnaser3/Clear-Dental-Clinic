/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { notificationService, type Notification } from '../services/notificationService';
import { useAuth } from '../hooks/useAuth';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  refreshNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshNotifications = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      
      const [notificationsResponse, countResponse] = await Promise.all([
        notificationService.getRecentNotifications(10),
        notificationService.getUnreadCount()
      ]);

      if (notificationsResponse.success) {
        setNotifications(notificationsResponse.data.notifications);
      }

      if (countResponse.success) {
        setUnreadCount(countResponse.data.count);
      }
    } catch (err: any) {
      // Check if it's a 404 error (notification endpoints not implemented)
      if (err.response?.status === 404) {
        console.warn('Notification endpoints not available, using mock data');
        // Use mock data for development
        setNotifications([
          {
            _id: 'mock-1',
            userId: user.id,
            title: 'Welcome to the Clinic System',
            message: 'Your account has been successfully created. You can now book appointments and manage your health records.',
            type: 'general',
            isRead: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            _id: 'mock-2',
            userId: user.id,
            title: 'Appointment Reminder',
            message: 'You have an upcoming appointment tomorrow at 2:00 PM. Please arrive 15 minutes early.',
            type: 'appointment_reminder',
            isRead: false,
            createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
            updatedAt: new Date(Date.now() - 3600000).toISOString()
          },
          {
            _id: 'mock-3',
            userId: user.id,
            title: 'System Maintenance',
            message: 'The system will undergo maintenance this weekend from 2:00 AM to 4:00 AM.',
            type: 'system',
            isRead: true,
            createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
            updatedAt: new Date(Date.now() - 86400000).toISOString()
          }
        ]);
        setUnreadCount(2);
        setError(null);
      } else if (err.code === 'ERR_NETWORK' || err.code === 'ECONNREFUSED') {
        // Network errors - silently fail and use empty state
        console.warn('Network error fetching notifications, will retry later');
        setNotifications([]);
        setUnreadCount(0);
        setError(null);
      } else {
        setError(err.message || 'Failed to fetch notifications');
        console.error('Error fetching notifications:', err);
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  const markAsRead = async (id: string) => {
    try {
      // Check if it's a mock notification
      if (id.startsWith('mock-')) {
        // Handle mock data locally
        setNotifications(prev => 
          prev.map(n => n._id === id ? { ...n, isRead: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
        return;
      }

      await notificationService.markAsRead(id);
      setNotifications(prev => 
        prev.map(n => n._id === id ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err: any) {
      console.error('Error marking notification as read:', err);
      // Don't throw error, just log it to prevent UI crashes
    }
  };

  const markAllAsRead = async () => {
    try {
      // Check if we have mock notifications
      const hasMockNotifications = notifications.some(n => n._id.startsWith('mock-'));
      
      if (hasMockNotifications) {
        // Handle mock data locally
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
        return;
      }

      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err: any) {
      console.error('Error marking all notifications as read:', err);
      // Don't throw error, just log it to prevent UI crashes
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const deletedNotification = notifications.find(n => n._id === id);
      
      // Check if it's a mock notification
      if (id.startsWith('mock-')) {
        // Handle mock data locally
        setNotifications(prev => prev.filter(n => n._id !== id));
        
        // Update unread count if the deleted notification was unread
        if (deletedNotification && !deletedNotification.isRead) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
        return;
      }

      await notificationService.deleteNotification(id);
      setNotifications(prev => prev.filter(n => n._id !== id));
      
      // Update unread count if the deleted notification was unread
      if (deletedNotification && !deletedNotification.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err: any) {
      console.error('Error deleting notification:', err);
      // Don't throw error, just log it to prevent UI crashes
    }
  };

  // Initial fetch when user changes
  useEffect(() => {
    if (user) {
      refreshNotifications();
    } else {
      setNotifications([]);
      setUnreadCount(0);
      setError(null);
    }
  }, [user]);

  // Periodic refresh every 30 seconds
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      refreshNotifications();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [user, refreshNotifications]);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    loading,
    error,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};