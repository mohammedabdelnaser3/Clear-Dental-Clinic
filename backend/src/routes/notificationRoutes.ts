import { Router } from 'express';
import {
  getUserNotifications,
  getUnreadNotificationsCount,
  getUnreadNotifications,
  markNotificationAsRead,
  markNotificationAsUnread,
  markAllNotificationsAsRead,
  deleteNotification,
  deleteAllNotifications,
  createNotification,
  createBulkNotifications,
  getNotificationsByType,
  getNotificationStatistics,
  cleanupOldNotifications,
  getRecentNotifications,
  getNotificationById,
  updateNotification
} from '../controllers/notificationController';
import {
  authenticate,
  adminOnly
} from '../middleware/auth';
import {
  validateMongoId,
  validatePagination,
  createMongoIdValidation,
  handleValidationErrors
} from '../middleware/validation';
import { body, query } from 'express-validator';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get user notifications
router.get('/', [
  ...validatePagination.slice(0, -1),
  query('isRead')
    .optional()
    .isBoolean()
    .withMessage('isRead must be a boolean'),
  query('type')
    .optional()
    .isIn(['general', 'appointment_reminder', 'appointment_confirmation', 'appointment_cancellation', 'system'])
    .withMessage('Invalid notification type')
], handleValidationErrors, getUserNotifications);

// Get unread notifications count
router.get('/unread/count', getUnreadNotificationsCount);

// Get unread notifications
router.get('/unread', [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
], handleValidationErrors, getUnreadNotifications);

// Get recent notifications
router.get('/recent', [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('Limit must be between 1 and 20')
], handleValidationErrors, getRecentNotifications);

// Get notification statistics
router.get('/statistics', getNotificationStatistics);

// Get notifications by type
router.get('/type/:type', [
  query('type')
    .isIn(['general', 'appointment_reminder', 'appointment_confirmation', 'appointment_cancellation', 'system'])
    .withMessage('Invalid notification type'),
  ...validatePagination.slice(0, -1)
], handleValidationErrors, getNotificationsByType);

// Mark all notifications as read
router.put('/mark-all-read', markAllNotificationsAsRead);

// Delete all notifications
router.delete('/delete-all', deleteAllNotifications);

// Admin routes for creating notifications
router.post('/', adminOnly, [
  body('userId')
    .isMongoId()
    .withMessage('Valid user ID is required'),
  body('title')
    .trim()
    .notEmpty()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title is required and must be between 1 and 200 characters'),
  body('message')
    .trim()
    .notEmpty()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Message is required and must be between 1 and 1000 characters'),
  body('type')
    .optional()
    .isIn(['general', 'appointment_reminder', 'appointment_confirmation', 'appointment_cancellation', 'system'])
    .withMessage('Invalid notification type'),
  body('link')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Link must not exceed 500 characters')
], handleValidationErrors, createNotification);

// Create bulk notifications (admin only)
router.post('/bulk', adminOnly, [
  body('userIds')
    .isArray({ min: 1 })
    .withMessage('User IDs array is required and must not be empty'),
  body('userIds.*')
    .isMongoId()
    .withMessage('Each user ID must be valid'),
  body('title')
    .trim()
    .notEmpty()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title is required and must be between 1 and 200 characters'),
  body('message')
    .trim()
    .notEmpty()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Message is required and must be between 1 and 1000 characters'),
  body('type')
    .optional()
    .isIn(['general', 'appointment_reminder', 'appointment_confirmation', 'appointment_cancellation', 'system'])
    .withMessage('Invalid notification type'),
  body('link')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Link must not exceed 500 characters')
], handleValidationErrors, createBulkNotifications);

// Clean up old notifications (admin only)
router.delete('/cleanup', adminOnly, [
  query('days')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Days must be between 1 and 365')
], handleValidationErrors, cleanupOldNotifications);

// Get notification by ID
router.get('/:id', [
  ...createMongoIdValidation('id')
], handleValidationErrors, getNotificationById);

// Update notification
router.put('/:id', [
  ...createMongoIdValidation('id'),
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  body('message')
    .optional()
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Message must be between 1 and 1000 characters'),
  body('link')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Link must not exceed 500 characters')
], handleValidationErrors, updateNotification);

// Mark notification as read
router.patch('/:id/read', [
  ...createMongoIdValidation('id')
], handleValidationErrors, markNotificationAsRead);

// Mark notification as unread
router.patch('/:id/unread', [
  ...createMongoIdValidation('id')
], handleValidationErrors, markNotificationAsUnread);

// Delete notification
router.delete('/:id', [
  ...createMongoIdValidation('id')
], handleValidationErrors, deleteNotification);

export default router;