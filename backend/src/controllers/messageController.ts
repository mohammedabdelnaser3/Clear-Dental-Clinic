import { Request, Response } from 'express';
import { Message, User } from '../models';
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
import { createAndSendNotification } from '../utils/notificationHelpers';

// Send a message
export const sendMessage = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const {
    recipientId,
    subject,
    content,
    messageType = 'text',
    priority = 'normal',
    scheduledSendTime,
    relatedRecords
  } = req.body;

  // Verify recipient exists and is active
  const recipient = await User.findOne({ _id: recipientId, isActive: true });
  if (!recipient) {
    throw createNotFoundError('Recipient user');
  }

  // Create message
  const messageData: any = {
    senderId: req.user._id,
    recipientId,
    content,
    messageType,
    priority,
    relatedRecords,
    isHipaaCompliant: true
  };

  if (subject) messageData.subject = subject;

  // Handle scheduled messages
  if (scheduledSendTime) {
    const scheduleDate = new Date(scheduledSendTime);
    if (scheduleDate > new Date()) {
      messageData.scheduledSendTime = scheduleDate;
      messageData.isScheduled = true;
      messageData.status = 'draft';
    }
  }

  const message = await (Message as any).create(messageData);

  // Send immediately if not scheduled
  if (!message.isScheduled) {
    await (message as any).send();
    
    // Send real-time notification to recipient
    await createAndSendNotification({
      userId: recipientId,
      title: 'New Message',
      message: `You have a new message from ${req.user.firstName} ${req.user.lastName}`,
      type: 'general',
      link: `/messages/${message._id}`,
      metadata: {
        messageId: message._id,
        senderId: req.user._id,
        senderName: `${req.user.firstName} ${req.user.lastName}`
      }
    });
  }

  res.status(201).json({
    success: true,
    message: message.isScheduled ? 'Message scheduled successfully' : 'Message sent successfully',
    data: { message }
  });
});

// Reply to a message
export const replyToMessage = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { originalMessageId } = req.params;
  const { content, priority = 'normal' } = req.body;

  // Find original message
  const originalMessage = await (Message as any).findById(originalMessageId)
    .populate('senderId', 'firstName lastName')
    .populate('recipientId', 'firstName lastName');

  if (!originalMessage) {
    throw createNotFoundError('Original message');
  }

  // Determine recipient (sender of original message if current user was recipient, or vice versa)
  const recipientId = originalMessage.senderId._id.toString() === req.user._id.toString()
    ? originalMessage.recipientId._id
    : originalMessage.senderId._id;

  // Create reply
  const reply = await (Message as any).create({
    senderId: req.user._id,
    recipientId,
    content,
    messageType: originalMessage.messageType,
    priority,
    isReply: true,
    originalMessageId: originalMessage._id,
    threadId: originalMessage.threadId || originalMessage._id,
    subject: originalMessage.subject ? `Re: ${originalMessage.subject}` : undefined,
    relatedRecords: originalMessage.relatedRecords,
    isHipaaCompliant: true
  });

  reply.sentAt = new Date();
  (reply as any).messageStatus = 'sent';
  await reply.save();

  // Send notification
  await createAndSendNotification({
    userId: recipientId.toString(),
    title: 'New Reply',
    message: `${req.user.firstName} ${req.user.lastName} replied to your message`,
    type: 'general',
    link: `/messages/${reply._id}`,
    metadata: {
      messageId: reply._id,
      threadId: reply.threadId,
      senderId: req.user._id
    }
  });

  res.status(201).json({
    success: true,
    message: 'Reply sent successfully',
    data: { message: reply }
  });
});

// Get user's messages
export const getUserMessages = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { page, limit, skip } = getPaginationParams(req);
  const { type = 'all', status, messageType } = req.query;

  const [messages, total] = await Promise.all([
    (Message as any).findUserMessages(req.user._id.toString(), type as any, {
      skip,
      limit,
      status,
      messageType
    }),
    (Message as any).countDocuments({
      $or: [
        { senderId: req.user._id },
        { recipientId: req.user._id }
      ],
      deletedAt: { $exists: false },
      ...(status && { status }),
      ...(messageType && { messageType })
    })
  ]);

  res.json({
    success: true,
    data: createPaginatedResponse(messages, total, page, limit)
  });
});

// Get conversation between two users
export const getConversation = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { userId } = req.params;
  const { page, limit, skip } = getPaginationParams(req);

  const [messages, total] = await Promise.all([
    (Message as any).findConversation(req.user._id.toString(), userId, { skip, limit }),
    (Message as any).countDocuments({
      $or: [
        { senderId: req.user._id, recipientId: userId },
        { senderId: userId, recipientId: req.user._id }
      ],
      deletedAt: { $exists: false }
    })
  ]);

  // Mark messages as read if current user is recipient
  const unreadMessages = messages.filter(
    (msg: any) => msg.recipientId._id.toString() === req.user._id.toString() && !msg.isRead
  );
  
  if (unreadMessages.length > 0) {
    await Message.updateMany(
      {
        _id: { $in: unreadMessages.map((msg: any) => msg._id) },
        recipientId: req.user._id
      },
      {
        isRead: true,
        readAt: new Date(),
        status: 'read'
      }
    );
  }

  res.json({
    success: true,
    data: createPaginatedResponse(messages.reverse(), total, page, limit)
  });
});

// Get conversation list
export const getConversationList = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const conversations = await (Message as any).aggregate([
    {
      $match: {
        $or: [
          { senderId: req.user._id },
          { recipientId: req.user._id }
        ],
        isDeleted: { $ne: true }
      }
    },
    {
      $sort: { createdAt: -1 }
    },
    {
      $group: {
        _id: {
          $cond: [
            { $eq: ['$senderId', req.user._id] },
            '$recipientId',
            '$senderId'
          ]
        },
        lastMessage: { $first: '$$ROOT' },
        unreadCount: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ['$recipientId', req.user._id] },
                  { $eq: ['$isRead', false] }
                ]
              },
              1,
              0
            ]
          }
        }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'otherUser'
      }
    },
    {
      $unwind: '$otherUser'
    }
  ]);

  res.json({
    success: true,
    data: { conversations }
  });
});

// Get message thread
export const getMessageThread = catchAsync(async (req: Request, res: Response) => {
  const { threadId } = req.params;

  const messages = await (Message as any).find({ threadId, isDeleted: { $ne: true } })
    .populate('senderId', 'firstName lastName role')
    .populate('recipientId', 'firstName lastName role')
    .sort({ createdAt: 1 });

  if (messages.length === 0) {
    throw createNotFoundError('Message thread');
  }

  res.json({
    success: true,
    data: { messages }
  });
});

// Get unread messages
export const getUnreadMessages = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const messages = await (Message as any).find({
    recipientId: req.user._id,
    isRead: false,
    isDeleted: { $ne: true }
  })
    .populate('senderId', 'firstName lastName role')
    .sort({ createdAt: -1 });
  
  const count = await (Message as any).countDocuments({
    recipientId: req.user._id,
    isRead: false,
    isDeleted: { $ne: true }
  });

  res.json({
    success: true,
    data: {
      messages,
      count
    }
  });
});

// Mark message as read
export const markMessageAsRead = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const message = await (Message as any).findById(id);
  if (!message) {
    throw createNotFoundError('Message');
  }

  // Only recipient can mark message as read
  if (message.recipientId.toString() !== req.user._id.toString()) {
    throw createValidationError('authorization', 'You can only mark your own messages as read');
  }

  if (!message.isRead) {
    await (message as any).markAsRead();
  }

  res.json({
    success: true,
    message: 'Message marked as read',
    data: { message }
  });
});

// Archive message
export const archiveMessage = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const message = await (Message as any).findById(id);
  if (!message) {
    throw createNotFoundError('Message');
  }

  // Only sender or recipient can archive
  const canArchive = message.senderId.toString() === req.user._id.toString() ||
                     message.recipientId.toString() === req.user._id.toString();

  if (!canArchive) {
    throw createValidationError('authorization', 'You can only archive your own messages');
  }

    (message as any).isArchived = true;
  message.archivedAt = new Date();
  await message.save();

  res.json({
    success: true,
    message: 'Message archived successfully',
    data: { message }
  });
});

// Delete message
export const deleteMessage = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const message = await (Message as any).findById(id);
  if (!message) {
    throw createNotFoundError('Message');
  }

  // Only sender or recipient can delete
  const canDelete = message.senderId.toString() === req.user._id.toString() ||
                    message.recipientId.toString() === req.user._id.toString();

  if (!canDelete) {
    throw createValidationError('authorization', 'You can only delete your own messages');
  }

    (message as any).isDeleted = true;
  message.deletedAt = new Date();
  await message.save();

  res.json({
    success: true,
    message: 'Message deleted successfully'
  });
});

// Get message by ID
export const getMessageById = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const message = await (Message as any).findById(id)
    .populate('senderId', 'firstName lastName profileImage role')
    .populate('recipientId', 'firstName lastName profileImage role')
    .populate('originalMessageId')
    .populate('relatedRecords.appointmentId')
    .populate('relatedRecords.patientId', 'firstName lastName')
    .populate('relatedRecords.prescriptionId');

  if (!message || message.deletedAt) {
    throw createNotFoundError('Message');
  }

  // Check authorization
  const canAccess = message.senderId._id.toString() === req.user._id.toString() ||
                    message.recipientId._id.toString() === req.user._id.toString();

  if (!canAccess) {
    throw createValidationError('authorization', 'You can only access your own messages');
  }

  // Mark as read if recipient is viewing
  if (message.recipientId._id.toString() === req.user._id.toString() && !message.isRead) {
    await (message as any).markAsRead();
  }

  res.json({
    success: true,
    data: { message }
  });
});

// Search messages
export const searchMessages = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { page, limit, skip } = getPaginationParams(req);
  const { query, type, dateFrom, dateTo } = req.query;

  if (!query) {
    throw createValidationError('query', 'Search query is required');
  }

  const searchQuery: any = {
    $or: [
      { senderId: req.user._id },
      { recipientId: req.user._id }
    ],
    deletedAt: { $exists: false },
    $text: { $search: query as string }
  };

  if (type) {
    searchQuery.messageType = type;
  }

  if (dateFrom || dateTo) {
    searchQuery.createdAt = {};
    if (dateFrom) {
      searchQuery.createdAt.$gte = new Date(dateFrom as string);
    }
    if (dateTo) {
      searchQuery.createdAt.$lte = new Date(dateTo as string);
    }
  }

  const [messages, total] = await Promise.all([
    (Message as any).find(searchQuery)
      .populate('senderId', 'firstName lastName profileImage')
      .populate('recipientId', 'firstName lastName profileImage')
      .sort({ score: { $meta: 'textScore' }, createdAt: -1 })
      .skip(skip)
      .limit(limit),
    (Message as any).countDocuments(searchQuery)
  ]);

  res.json({
    success: true,
    data: createPaginatedResponse(messages, total, page, limit)
  });
});

// Process scheduled messages (to be called by a cron job)
export const processScheduledMessages = catchAsync(async (req: Request, res: Response) => {
  const scheduledMessages = await (Message as any).find({
    messageType: 'scheduled',
    scheduledSendTime: { $lte: new Date() },
    messageStatus: 'scheduled'
  })
    .populate('senderId', 'firstName lastName')
    .populate('recipientId', 'firstName lastName');

  for (const message of scheduledMessages) {
    await (message as any).send();
    
    // Send notification
    await createAndSendNotification({
      userId: message.recipientId.toString(),
      title: 'Scheduled Message',
      message: 'You have received a scheduled message',
      type: 'general',
      link: `/messages/${message._id}`,
      metadata: {
        messageId: message._id,
        scheduled: true
      }
    });
  }

  res.json({
    success: true,
    message: `${scheduledMessages.length} scheduled messages processed`,
    data: { processedCount: scheduledMessages.length }
  });
});
