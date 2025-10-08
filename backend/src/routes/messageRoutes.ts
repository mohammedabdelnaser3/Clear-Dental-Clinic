import { Router } from 'express';
import {
  sendMessage,
  replyToMessage,
  getUserMessages,
  getConversation,
  getConversationList,
  getMessageThread,
  getUnreadMessages,
  markMessageAsRead,
  archiveMessage,
  deleteMessage,
  getMessageById,
  searchMessages,
  processScheduledMessages
} from '../controllers/messageController';
import {
  authenticate,
  adminOnly
} from '../middleware/auth';
import {
  createMongoIdValidation,
  paginationValidationRules,
  handleValidationErrors
} from '../middleware/validation';
import { body, query } from 'express-validator';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Send a message
router.post('/', [
  body('recipientId')
    .isMongoId()
    .withMessage('Valid recipient ID is required'),
  body('content')
    .trim()
    .notEmpty()
    .isLength({ min: 1, max: 5000 })
    .withMessage('Message content is required and must be between 1 and 5000 characters'),
  body('subject')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Subject cannot exceed 200 characters'),
  body('messageType')
    .optional()
    .isIn(['text', 'appointment', 'prescription', 'lab_result', 'insurance', 'billing'])
    .withMessage('Invalid message type'),
  body('priority')
    .optional()
    .isIn(['low', 'normal', 'high', 'urgent'])
    .withMessage('Invalid priority level'),
  body('scheduledSendTime')
    .optional()
    .isISO8601()
    .withMessage('Scheduled send time must be a valid date')
], handleValidationErrors, sendMessage);

// Get conversation list
router.get('/conversations', getConversationList);

// Get unread messages
router.get('/unread', getUnreadMessages);

// Search messages
router.get('/search', [
  query('query')
    .trim()
    .notEmpty()
    .withMessage('Search query is required'),
  query('type')
    .optional()
    .isIn(['text', 'appointment', 'prescription', 'lab_result', 'insurance', 'billing'])
    .withMessage('Invalid message type'),
  query('dateFrom')
    .optional()
    .isISO8601()
    .withMessage('Date from must be a valid date'),
  query('dateTo')
    .optional()
    .isISO8601()
    .withMessage('Date to must be a valid date'),
  ...paginationValidationRules
], handleValidationErrors, searchMessages);

// Process scheduled messages (admin only)
router.post('/process-scheduled', adminOnly, processScheduledMessages);

// Get user's messages
router.get('/', [
  query('type')
    .optional()
    .isIn(['sent', 'received', 'all'])
    .withMessage('Invalid message type filter'),
  query('status')
    .optional()
    .isIn(['draft', 'sent', 'delivered', 'read', 'archived'])
    .withMessage('Invalid status filter'),
  query('messageType')
    .optional()
    .isIn(['text', 'appointment', 'prescription', 'lab_result', 'insurance', 'billing'])
    .withMessage('Invalid message type'),
  ...paginationValidationRules
], handleValidationErrors, getUserMessages);

// Get conversation with specific user
router.get('/conversation/:userId', [
  ...createMongoIdValidation('userId'),
  ...paginationValidationRules
], handleValidationErrors, getConversation);

// Get message thread
router.get('/thread/:threadId', [
  ...createMongoIdValidation('threadId')
], handleValidationErrors, getMessageThread);

// Get message by ID
router.get('/:id', [
  ...createMongoIdValidation('id')
], handleValidationErrors, getMessageById);

// Reply to a message
router.post('/:originalMessageId/reply', [
  ...createMongoIdValidation('originalMessageId'),
  body('content')
    .trim()
    .notEmpty()
    .isLength({ min: 1, max: 5000 })
    .withMessage('Reply content is required and must be between 1 and 5000 characters'),
  body('priority')
    .optional()
    .isIn(['low', 'normal', 'high', 'urgent'])
    .withMessage('Invalid priority level')
], handleValidationErrors, replyToMessage);

// Mark message as read
router.put('/:id/read', [
  ...createMongoIdValidation('id')
], handleValidationErrors, markMessageAsRead);

// Archive message
router.put('/:id/archive', [
  ...createMongoIdValidation('id')
], handleValidationErrors, archiveMessage);

// Delete message
router.delete('/:id', [
  ...createMongoIdValidation('id')
], handleValidationErrors, deleteMessage);

export default router;
