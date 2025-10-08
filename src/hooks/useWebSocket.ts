import { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import webSocketService from '../services/websocketService';
import { useAuth } from './useAuth';

interface NotificationData {
  id: string;
  title: string;
  message: string;
  type: string;
  link?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

// These interfaces are used by the webSocketService for type safety
interface AppointmentData {
  id: string;
  date: string;
  time: string;
  patientName?: string;
  dentistName?: string;
  status: string;
}

interface InventoryAlert {
  type: 'low_stock' | 'out_of_stock' | 'expiring_soon';
  items: any[];
  message: string;
}

interface SystemAnnouncement {
  title: string;
  message: string;
  type: string;
  createdAt: string;
}

// Add a local type for unsubscribe callbacks
type Unsubscribe = (() => void) | undefined;

export const useWebSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useAuth();

  // Move helpers above useEffect and memoize them so they are safe to use in dependencies
  const handleNotificationReceived = useCallback((notification: NotificationData) => {
    // Custom handling based on notification type
    switch (notification.type) {
      case 'appointment_confirmation':
        // Update appointment list if visible
        break;
      case 'payment_success':
        // Update billing/payment status
        break;
      case 'low_stock':
        // Update inventory status
        break;
      default:
        break;
    }

    // Trigger a custom event for other components to listen to
    window.dispatchEvent(
      new CustomEvent('newNotification', {
        detail: notification,
      }),
    );
  }, []);

  const getNotificationIcon = useCallback((type: string): string => {
    switch (type) {
      case 'appointment_reminder':
        return '⏰';
      case 'appointment_confirmation':
        return '✅';
      case 'appointment_cancellation':
        return '❌';
      case 'payment_success':
        return '💳';
      case 'payment_failed':
        return '⚠️';
      case 'inventory_alert':
      case 'low_stock':
        return '📦';
      case 'system':
        return '⚙️';
      default:
        return '🔔';
    }
  }, []);

  useEffect(() => {
    if (!user) {
      webSocketService.disconnect();
      return;
    }

    // Listen for custom connection events from the websocketService
    const handleConnectionChange = (event: Event) => {
      const ev = event as CustomEvent<boolean>;
      const connected = !!ev.detail;
      setIsConnected(connected);

      if (connected) {
        toast.success('Real-time notifications connected', {
          duration: 2000,
          position: 'bottom-right',
        });
      } else {
        toast.error('Real-time notifications disconnected', {
          duration: 2000,
          position: 'bottom-right',
        });
      }
    };

    window.addEventListener('websocket:connection', handleConnectionChange);

    // Cast the return of webSocketService.on to Unsubscribe so TS knows these may be functions
    const unsubscribeNotification = webSocketService.on('notification', (notification: NotificationData) => {
      // Show toast notification
      toast(notification.message, {
        duration: 5000,
        position: 'top-right',
        icon: getNotificationIcon(notification.type),
      });

      // You can add custom handling here based on notification type
      handleNotificationReceived(notification);
    }) as unknown as Unsubscribe;

    const unsubscribeAppointmentReminder = webSocketService.on('appointment_reminder', (appointment: AppointmentData) => {
      toast(`Appointment Reminder: You have an appointment on ${appointment.date} at ${appointment.time}`, {
        duration: 10000,
        position: 'top-right',
        icon: '⏰',
      });
    }) as unknown as Unsubscribe;

    const unsubscribeAppointmentUpdate = webSocketService.on('appointment_update', (appointment: AppointmentData) => {
      toast(`Appointment updated: ${appointment.status}`, {
        duration: 5000,
        position: 'top-right',
        icon: '📅',
      });
    }) as unknown as Unsubscribe;

    const unsubscribeInventoryAlert = webSocketService.on('inventory_alert', (alert: InventoryAlert) => {
      toast.error(alert.message, {
        duration: 8000,
        position: 'top-right',
      });
    }) as unknown as Unsubscribe;

    const unsubscribeSystemAnnouncement = webSocketService.on('system_announcement', (announcement: SystemAnnouncement) => {
      toast(`${announcement.title}: ${announcement.message}`, {
        duration: 15000,
        position: 'top-right',
        icon: '📢',
      });
    }) as unknown as Unsubscribe;

    // Clean up on unmount
    return () => {
      window.removeEventListener('websocket:connection', handleConnectionChange);
      // Use optional chaining to call unsubscribers if they exist
      unsubscribeNotification?.();
      unsubscribeAppointmentReminder?.();
      unsubscribeAppointmentUpdate?.();
      unsubscribeInventoryAlert?.();
      unsubscribeSystemAnnouncement?.();
    };
  }, [user, handleNotificationReceived, getNotificationIcon]);

  // Public methods
  // Small helper to safely call methods on the webSocketService.
  // It first tries to call a named method if present, otherwise it falls back to an `emit` call
  // (useful if the underlying implementation exposes an emit API but not specific typed methods).
  const callIfExists = useCallback((methodName: string, ...args: any[]) => {
    const svc = webSocketService as any;
    const fn = svc?.[methodName];
    if (typeof fn === 'function') {
      try {
        fn(...args);
      } catch (err) {
        // Avoid throwing from this hook; log for debugging.
        // eslint-disable-next-line no-console
        console.warn(`webSocketService.${methodName} threw an error`, err);
      }
      return;
    }

    // Fallback: try an `emit` style API if available
    if (typeof svc?.emit === 'function') {
      try {
        svc.emit(methodName, ...args);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn(`webSocketService.emit fallback for ${methodName} threw`, err);
      }
      return;
    }

    // If neither exists, log a warning (safe no-op)
    // eslint-disable-next-line no-console
    console.warn(`webSocketService does not implement ${methodName} and no emit fallback available`);
  }, []);

  const joinAppointmentRoom = useCallback((appointmentId: string) => {
    callIfExists('joinAppointmentRoom', appointmentId);
  }, [callIfExists]);

  const leaveAppointmentRoom = useCallback((appointmentId: string) => {
    callIfExists('leaveAppointmentRoom', appointmentId);
  }, [callIfExists]);

  const joinClinicRoom = useCallback((clinicId: string) => {
    callIfExists('joinClinicRoom', clinicId);
  }, [callIfExists]);

  const markNotificationAsRead = useCallback((notificationId: string) => {
    callIfExists('markNotificationAsRead', notificationId);
  }, [callIfExists]);

  const reconnect = useCallback(() => {
    // The underlying service exposes `connect`, not `reconnect`.
    // Use the safe caller so it falls back cleanly if needed.
    callIfExists('connect');
  }, [callIfExists]);

  return {
    isConnected,
    joinAppointmentRoom,
    leaveAppointmentRoom,
    joinClinicRoom,
    markNotificationAsRead,
    reconnect,
  };
};

export default useWebSocket;

