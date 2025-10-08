import api from './api';

export interface Notification {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: 'general' | 'appointment_reminder' | 'appointment_confirmation' | 'appointment_cancellation' | 'system';
  link?: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationStatistics {
  totalNotifications: number;
  unreadCount: number;
  readCount: number;
  typeDistribution: Record<string, { total: number; unread: number }>;
}

export interface PaginatedNotifications {
  notifications: Notification[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

class NotificationService {
  // Check if notification API is available
  async isApiAvailable(): Promise<boolean> {
    try {
      await api.get('/api/v1/notifications/unread/count');
      return true;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return false;
      }
      // Other errors might be temporary, so we assume API is available
      return true;
    }
  }

  // Get user notifications with pagination
  async getUserNotifications(params?: {
    page?: number;
    limit?: number;
    isRead?: boolean;
    type?: string;
  }) {
    const response = await api.get('/api/v1/notifications', { params });
    return response.data;
  }

  // Get unread notifications count
  async getUnreadCount(): Promise<{ success: boolean; data: { count: number } }> {
    const response = await api.get('/api/v1/notifications/unread/count');
    return response.data;
  }

  // Get unread notifications
  async getUnreadNotifications(limit = 10): Promise<{ success: boolean; data: { notifications: Notification[] } }> {
    const response = await api.get('/api/v1/notifications/unread', { params: { limit } });
    return response.data;
  }

  // Get recent notifications
  async getRecentNotifications(limit = 5): Promise<{ success: boolean; data: { notifications: Notification[] } }> {
    const response = await api.get('/api/v1/notifications/recent', { params: { limit } });
    return response.data;
  }

  // Get notification statistics
  async getStatistics(): Promise<{ success: boolean; data: NotificationStatistics }> {
    const response = await api.get('/api/v1/notifications/statistics');
    return response.data;
  }

  // Get notifications by type
  async getNotificationsByType(type: string, params?: { page?: number; limit?: number }) {
    const response = await api.get(`/api/v1/notifications/type/${type}`, { params });
    return response.data;
  }

  // Get notification by ID
  async getNotificationById(id: string): Promise<{ success: boolean; data: { notification: Notification } }> {
    const response = await api.get(`/api/v1/notifications/${id}`);
    return response.data;
  }

  // Mark notification as read
  async markAsRead(id: string): Promise<{ success: boolean; message: string; data: { notification: Notification } }> {
    const response = await api.patch(`/api/v1/notifications/${id}/read`);
    return response.data;
  }

  // Mark notification as unread
  async markAsUnread(id: string): Promise<{ success: boolean; message: string; data: { notification: Notification } }> {
    const response = await api.patch(`/api/v1/notifications/${id}/unread`);
    return response.data;
  }

  // Mark all notifications as read
  async markAllAsRead(): Promise<{ success: boolean; message: string }> {
    const response = await api.put('/api/v1/notifications/mark-all-read');
    return response.data;
  }

  // Delete notification
  async deleteNotification(id: string): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/api/v1/notifications/${id}`);
    return response.data;
  }

  // Delete all notifications
  async deleteAllNotifications(): Promise<{ success: boolean; message: string }> {
    const response = await api.delete('/api/v1/notifications/delete-all');
    return response.data;
  }

  // Update notification
  async updateNotification(id: string, data: { title?: string; message?: string; link?: string }): Promise<{ success: boolean; message: string; data: { notification: Notification } }> {
    const response = await api.put(`/api/v1/notifications/${id}`, data);
    return response.data;
  }

  // Admin functions
  async createNotification(data: {
    userId: string;
    title: string;
    message: string;
    type?: string;
    link?: string;
  }): Promise<{ success: boolean; message: string; data: { notification: Notification } }> {
    const response = await api.post('/api/v1/notifications', data);
    return response.data;
  }

  async createBulkNotifications(data: {
    userIds: string[];
    title: string;
    message: string;
    type?: string;
    link?: string;
  }): Promise<{ success: boolean; message: string; data: { count: number } }> {
    const response = await api.post('/api/v1/notifications/bulk', data);
    return response.data;
  }

  async cleanupOldNotifications(days = 30): Promise<{ success: boolean; message: string }> {
    const response = await api.delete('/api/v1/notifications/cleanup', { params: { days } });
    return response.data;
  }
}

export const notificationService = new NotificationService();