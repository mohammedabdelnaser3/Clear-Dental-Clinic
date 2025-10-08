import { Notification } from '../models';

/**
 * Helper functions for creating and sending notifications
 */

export interface NotificationData {
  userId: string;
  title: string;
  message: string;
  type?: 'general' | 'appointment_reminder' | 'appointment_confirmation' | 'appointment_cancellation' | 'system' | 'inventory_alert' | 'low_stock' | 'payment_success' | 'payment_failed' | 'insurance_update';
  link?: string;
  metadata?: Record<string, any>;
}

/**
 * Create and send a notification to a user
 */
export const createAndSendNotification = async (data: NotificationData): Promise<any> => {
  try {
    // Create notification in database
    const notification = await (Notification as any).createNotification(data);

    // Send real-time notification if WebSocket service is available
    if (global.webSocketService) {
      const sent = global.webSocketService.sendNotification(data.userId, {
        id: notification._id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        link: notification.link,
        metadata: data.metadata,
        createdAt: notification.createdAt
      });
      
      console.log(`Real-time notification ${sent ? 'sent' : 'queued'} for user ${data.userId}`);
    }

    return notification;
  } catch (error) {
    console.error('Error creating and sending notification:', error);
    throw error;
  }
};

/**
 * Create and send bulk notifications
 */
export const createAndSendBulkNotifications = async (
  userIds: string[],
  notificationData: Omit<NotificationData, 'userId'>
): Promise<{ count: number; notifications: any[] }> => {
  try {
    const notifications = userIds.map(userId => ({
      userId,
      ...notificationData,
      isRead: false,
      createdAt: new Date()
    }));

    const result = await (Notification as any).insertMany(notifications);

    // Send real-time notifications if WebSocket service is available
    if (global.webSocketService) {
      const realtimeData = {
        title: notificationData.title,
        message: notificationData.message,
        type: notificationData.type,
        link: notificationData.link,
        metadata: notificationData.metadata,
        createdAt: new Date()
      };
      
      const sentCount = global.webSocketService.sendBulkNotifications(userIds, realtimeData);
      console.log(`Real-time notifications sent to ${sentCount}/${userIds.length} connected users`);
    }

    return { count: result.length, notifications: result };
  } catch (error) {
    console.error('Error creating and sending bulk notifications:', error);
    throw error;
  }
};

/**
 * Send appointment reminder notifications
 */
export const sendAppointmentReminder = async (
  userId: string,
  appointmentData: any
): Promise<void> => {
  const notificationData: NotificationData = {
    userId,
    title: 'Appointment Reminder',
    message: `You have an appointment scheduled for ${appointmentData.date} at ${appointmentData.time}`,
    type: 'appointment_reminder',
    link: `/appointments/${appointmentData.id}`,
    metadata: { appointmentId: appointmentData.id }
  };

  await createAndSendNotification(notificationData);

  // Also send real-time appointment reminder if available
  if (global.webSocketService) {
    global.webSocketService.sendAppointmentReminder(userId, appointmentData);
  }
};

/**
 * Send appointment confirmation notifications
 */
export const sendAppointmentConfirmation = async (
  userId: string,
  appointmentData: any
): Promise<void> => {
  const notificationData: NotificationData = {
    userId,
    title: 'Appointment Confirmed',
    message: `Your appointment has been confirmed for ${appointmentData.date} at ${appointmentData.time}`,
    type: 'appointment_confirmation',
    link: `/appointments/${appointmentData.id}`,
    metadata: { appointmentId: appointmentData.id }
  };

  await createAndSendNotification(notificationData);
};

/**
 * Send appointment cancellation notifications
 */
export const sendAppointmentCancellation = async (
  userId: string,
  appointmentData: any,
  reason?: string
): Promise<void> => {
  const notificationData: NotificationData = {
    userId,
    title: 'Appointment Cancelled',
    message: `Your appointment scheduled for ${appointmentData.date} at ${appointmentData.time} has been cancelled${reason ? `: ${reason}` : ''}`,
    type: 'appointment_cancellation',
    link: `/appointments`,
    metadata: { appointmentId: appointmentData.id, reason }
  };

  await createAndSendNotification(notificationData);
};

/**
 * Send inventory alerts
 */
export const sendInventoryAlert = async (
  clinicId: string,
  alertData: {
    type: 'low_stock' | 'out_of_stock' | 'expiring_soon';
    items: any[];
    message: string;
  }
): Promise<void> => {
  // Send to clinic staff and admins
  if (global.webSocketService) {
    global.webSocketService.sendToClinic(clinicId, 'inventory-alert', alertData);
  }

  // Also create database notifications for clinic staff
  // This would require getting all staff members for the clinic
  // Implementation depends on your user-clinic relationship structure
};

/**
 * Send low stock alerts
 */
export const sendLowStockAlert = async (
  clinicId: string,
  items: any[]
): Promise<void> => {
  const alertData = {
    type: 'low_stock' as const,
    items,
    message: `${items.length} item(s) are running low in stock`
  };

  await sendInventoryAlert(clinicId, alertData);
};

/**
 * Send system announcements
 */
export const sendSystemAnnouncement = async (
  title: string,
  message: string,
  targetRole?: string,
  clinicId?: string
): Promise<void> => {
  if (global.webSocketService) {
    const announcementData = {
      title,
      message,
      type: 'system',
      createdAt: new Date()
    };

    if (targetRole) {
      global.webSocketService.sendToRole(targetRole, 'system-announcement', announcementData);
    } else if (clinicId) {
      global.webSocketService.sendToClinic(clinicId, 'system-announcement', announcementData);
    } else {
      global.webSocketService.sendSystemAnnouncement(announcementData);
    }
  }
};

/**
 * Send payment notifications
 */
export const sendPaymentNotification = async (
  userId: string,
  paymentData: {
    status: 'success' | 'failed' | 'pending';
    amount: number;
    invoiceNumber: string;
  }
): Promise<void> => {
  const { status, amount, invoiceNumber } = paymentData;
  
  const notificationData: NotificationData = {
    userId,
    title: status === 'success' ? 'Payment Successful' : status === 'failed' ? 'Payment Failed' : 'Payment Pending',
    message: status === 'success' 
      ? `Your payment of $${amount} for invoice ${invoiceNumber} was processed successfully`
      : status === 'failed'
      ? `Your payment of $${amount} for invoice ${invoiceNumber} failed. Please try again`
      : `Your payment of $${amount} for invoice ${invoiceNumber} is being processed`,
    type: status === 'success' ? 'payment_success' : 'payment_failed',
    link: `/billing/invoices/${invoiceNumber}`,
    metadata: { amount, invoiceNumber, status }
  };

  await createAndSendNotification(notificationData);
};

export default {
  createAndSendNotification,
  createAndSendBulkNotifications,
  sendAppointmentReminder,
  sendAppointmentConfirmation,
  sendAppointmentCancellation,
  sendInventoryAlert,
  sendLowStockAlert,
  sendSystemAnnouncement,
  sendPaymentNotification
};

