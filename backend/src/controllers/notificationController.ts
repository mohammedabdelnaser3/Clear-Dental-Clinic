import { Request, Response } from 'express';
import { Notification } from '../models';
import { AuthenticatedRequest } from '../types';
import {
  getPaginationParams,
  createPaginatedResponse
} from '../utils/helpers';
import {
  AppError,
  catchAsync,
  createNotFoundError,
  createValidationError
} from '../middleware/errorHandler';

// Get user notifications
export const getUserNotifications = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { page, limit, skip } = getPaginationParams(req);
  const { isRead, type } = req.query;

  const query: Record<string, any> = { userId: req.user._id };

  if (isRead !== undefined) {
    query.isRead = isRead === 'true';
  }

  if (type) {
    query.type = type;
  }

  const [notifications, total] = await Promise.all([
    Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Notification.countDocuments(query)
  ]);

  res.json({
    success: true,
    data: createPaginatedResponse(notifications, total, page, limit)
  });
});

// Get unread notifications count
export const getUnreadNotificationsCount = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const count = await Notification.countDocuments({
    userId: req.user._id,
    isRead: false
  });

  res.json({ success: true, data: { count } });
});

// Get unread notifications
export const getUnreadNotifications = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 10;
  const notifications = await Notification.findUnread(req.user._id.toString(), limit);
  res.json({ success: true, data: { notifications } });
});

// Mark notification as read
export const markNotificationAsRead = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const notification = await Notification.findById(req.params.id);
  if (!notification) {
    throw createNotFoundError('Notification');
  }

  if (notification.userId.toString() !== req.user._id.toString()) {
    throw createValidationError('authorization', 'You can only access your own notifications');
  }

  notification.markAsRead();
  await notification.save();

  res.json({
    success: true,
    message: 'Notification marked as read',
    data: { notification }
  });
});

// Mark notification as unread
export const markNotificationAsUnread = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const notification = await Notification.findById(req.params.id);
  if (!notification) {
    throw createNotFoundError('Notification');
  }

  if (notification.userId.toString() !== req.user._id.toString()) {
    throw createValidationError('authorization', 'You can only access your own notifications');
  }

  notification.markAsUnread();
  await notification.save();

  res.json({
    success: true,
    message: 'Notification marked as unread',
    data: { notification }
  });
});

// Mark all notifications as read
export const markAllNotificationsAsRead = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const result = await Notification.markAllAsRead(req.user._id.toString());
  res.json({
    success: true,
    message: `${result.modifiedCount} notifications marked as read`
  });
});

// Delete notification
export const deleteNotification = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const notification = await Notification.findById(req.params.id);
  if (!notification) {
    throw createNotFoundError('Notification');
  }

  if (notification.userId.toString() !== req.user._id.toString()) {
    throw createValidationError('authorization', 'You can only delete your own notifications');
  }

  await notification.deleteOne();
  res.json({ success: true, message: 'Notification deleted successfully' });
});

// Delete all notifications
export const deleteAllNotifications = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const result = await Notification.deleteMany({ userId: req.user._id });
  res.json({
    success: true,
    message: `${result.deletedCount} notifications deleted`
  });
});

// Create notification (admin only)
export const createNotification = catchAsync(async (req: Request, res: Response) => {
  const { userId, title, message, type = 'general', link } = req.body;

  const notification = await Notification.createNotification({
    userId,
    title,
    message,
    type,
    link
  });

  res.status(201).json({
    success: true,
    message: 'Notification created successfully',
    data: { notification }
  });
});

// Create bulk notifications (admin only)
export const createBulkNotifications = catchAsync(async (req: Request, res: Response) => {
  const { userIds, title, message, type = 'general', link } = req.body;

  if (!Array.isArray(userIds) || userIds.length === 0) {
    throw createValidationError('userIds', 'User IDs array is required');
  }

  const notifications = userIds.map(userId => ({
    userId,
    title,
    message,
    type,
    link,
    isRead: false,
    createdAt: new Date()
  }));

  const result = await Notification.insertMany(notifications);

  res.status(201).json({
    success: true,
    message: `${result.length} notifications created successfully`,
    data: { count: result.length }
  });
});

// Get notifications by type
export const getNotificationsByType = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { type } = req.params;
  const { page, limit, skip } = getPaginationParams(req);

  const [notifications, total] = await Promise.all([
    Notification.findByType(req.user._id.toString(), type, { skip, limit }),
    Notification.countDocuments({ userId: req.user._id, type })
  ]);

  res.json({
    success: true,
    data: createPaginatedResponse(notifications, total, page, limit)
  });
});

// Get notification statistics
export const getNotificationStatistics = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const [totalNotifications, unreadCount, typeStats] = await Promise.all([
    Notification.countDocuments({ userId: req.user._id }),
    Notification.countDocuments({ userId: req.user._id, isRead: false }),
    Notification.aggregate([
      { $match: { userId: req.user._id } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          unreadCount: {
            $sum: { $cond: [{ $eq: ['$isRead', false] }, 1, 0] }
          }
        }
      }
    ])
  ]);

  const typeDistribution = typeStats.reduce((acc, { _id, count, unreadCount }) => {
    acc[_id] = { total: count, unread: unreadCount };
    return acc;
  }, {});

  res.json({
    success: true,
    data: {
      totalNotifications,
      unreadCount,
      readCount: totalNotifications - unreadCount,
      typeDistribution
    }
  });
});

// Clean up old notifications (admin only)
export const cleanupOldNotifications = catchAsync(async (req: Request, res: Response) => {
  const days = parseInt(req.query.days as string) || 30;
  const result = await Notification.deleteOldNotifications(days);

  res.json({
    success: true,
    message: `${result.deletedCount} old notifications deleted`
  });
});

// Get recent notifications
export const getRecentNotifications = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 5;

  const notifications = await Notification.find({ userId: req.user._id })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  res.json({ success: true, data: { notifications } });
});

// Get notification by ID
export const getNotificationById = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const notification = await Notification.findById(req.params.id);
  if (!notification) {
    throw createNotFoundError('Notification');
  }

  if (notification.userId.toString() !== req.user._id.toString()) {
    throw createValidationError('authorization', 'You can only access your own notifications');
  }

  res.json({ success: true, data: { notification } });
});

// Update notification
export const updateNotification = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { title, message, link } = req.body;

  const notification = await Notification.findById(id);
  if (!notification) {
    throw createNotFoundError('Notification');
  }

  if (notification.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw createValidationError('authorization', 'You can only update your own notifications');
  }

  Object.assign(notification, {
    ...(title && { title }),
    ...(message && { message }),
    ...(link && { link })
  });

  await notification.save();

  res.json({
    success: true,
    message: 'Notification updated successfully',
    data: { notification }
  });
});