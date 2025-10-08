import { Schema, model, Document, Types } from 'mongoose';

export interface IMessage extends Document {
  _id: Types.ObjectId;
  
  // Participants
  senderId: Types.ObjectId;
  recipientId: Types.ObjectId;
  
  // Message Content
  subject?: string;
  content: string;
  messageType: 'text' | 'appointment' | 'prescription' | 'lab_result' | 'insurance' | 'billing';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  
  // Status
  status: 'draft' | 'sent' | 'delivered' | 'read' | 'archived';
  isRead: boolean;
  readAt?: Date;
  
  // Thread Information
  threadId?: Types.ObjectId; // For message threading/replies
  isReply: boolean;
  originalMessageId?: Types.ObjectId;
  
  // Attachments
  attachments?: Array<{
    filename: string;
    originalName: string;
    path: string;
    mimeType: string;
    size: number;
    uploadedAt: Date;
  }>;
  
  // Related Records
  relatedRecords?: {
    appointmentId?: Types.ObjectId;
    patientId?: Types.ObjectId;
    treatmentId?: Types.ObjectId;
    prescriptionId?: Types.ObjectId;
    billingId?: Types.ObjectId;
  };
  
  // Security and Compliance
  isEncrypted: boolean;
  encryptionKey?: string;
  isHipaaCompliant: boolean;
  
  // Scheduling (for delayed messages)
  scheduledSendTime?: Date;
  isScheduled: boolean;
  
  // Audit
  createdAt: Date;
  updatedAt: Date;
  sentAt?: Date;
  archivedAt?: Date;
  deletedAt?: Date;
}

const messageSchema = new Schema<IMessage>({
  senderId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Sender ID is required']
  },
  recipientId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Recipient ID is required']
  },
  
  // Message Content
  subject: {
    type: String,
    trim: true,
    maxlength: [200, 'Subject cannot exceed 200 characters']
  },
  content: {
    type: String,
    required: [true, 'Message content is required'],
    trim: true,
    maxlength: [5000, 'Message content cannot exceed 5000 characters']
  },
  messageType: {
    type: String,
    enum: ['text', 'appointment', 'prescription', 'lab_result', 'insurance', 'billing'],
    default: 'text'
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  
  // Status
  status: {
    type: String,
    enum: ['draft', 'sent', 'delivered', 'read', 'archived'],
    default: 'draft'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  
  // Thread Information
  threadId: {
    type: Schema.Types.ObjectId,
    ref: 'Message'
  },
  isReply: {
    type: Boolean,
    default: false
  },
  originalMessageId: {
    type: Schema.Types.ObjectId,
    ref: 'Message'
  },
  
  // Attachments
  attachments: [{
    filename: {
      type: String,
      required: true,
      trim: true
    },
    originalName: {
      type: String,
      required: true,
      trim: true
    },
    path: {
      type: String,
      required: true,
      trim: true
    },
    mimeType: {
      type: String,
      required: true,
      trim: true
    },
    size: {
      type: Number,
      required: true,
      min: [0, 'File size cannot be negative']
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Related Records
  relatedRecords: {
    appointmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Appointment'
    },
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'Patient'
    },
    treatmentId: {
      type: Schema.Types.ObjectId,
      ref: 'TreatmentRecord'
    },
    prescriptionId: {
      type: Schema.Types.ObjectId,
      ref: 'Prescription'
    },
    billingId: {
      type: Schema.Types.ObjectId,
      ref: 'Billing'
    }
  },
  
  // Security and Compliance
  isEncrypted: {
    type: Boolean,
    default: false
  },
  encryptionKey: {
    type: String,
    select: false // Never include in queries
  },
  isHipaaCompliant: {
    type: Boolean,
    default: true
  },
  
  // Scheduling
  scheduledSendTime: {
    type: Date
  },
  isScheduled: {
    type: Boolean,
    default: false
  },
  
  // Audit
  sentAt: {
    type: Date
  },
  archivedAt: {
    type: Date
  },
  deletedAt: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
messageSchema.index({ senderId: 1, recipientId: 1 });
messageSchema.index({ senderId: 1 });
messageSchema.index({ recipientId: 1 });
messageSchema.index({ threadId: 1 });
messageSchema.index({ status: 1 });
messageSchema.index({ isRead: 1 });
messageSchema.index({ messageType: 1 });
messageSchema.index({ priority: 1 });
messageSchema.index({ scheduledSendTime: 1 });
messageSchema.index({ createdAt: -1 });
messageSchema.index({ sentAt: -1 });

// Compound indexes
messageSchema.index({ recipientId: 1, isRead: 1 });
messageSchema.index({ senderId: 1, recipientId: 1, createdAt: -1 });
messageSchema.index({ threadId: 1, createdAt: 1 });

// Virtual for attachment count
messageSchema.virtual('attachmentCount').get(function() {
  return this.attachments?.length || 0;
});

// Virtual for has attachments
messageSchema.virtual('hasAttachments').get(function() {
  return (this.attachments?.length || 0) > 0;
});

// Instance methods
messageSchema.methods.send = function() {
  this.status = 'sent';
  this.sentAt = new Date();
  return this.save();
};

messageSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

// Static methods
messageSchema.statics.findUserMessages = function(userId: any, options: any = {}) {
  return this.find({ $or: [{ senderId: userId }, { recipientId: userId }] }, null, options);
};

messageSchema.statics.findConversation = function(user1Id: any, user2Id: any) {
  return this.find({
    $or: [
      { senderId: user1Id, recipientId: user2Id },
      { senderId: user2Id, recipientId: user1Id }
    ]
  }).sort({ createdAt: 1 });
};

// Pre-save middleware
messageSchema.pre('save', function(next) {
  // Set sentAt when status changes to sent
  if (this.isModified('status') && this.status === 'sent' && !this.sentAt) {
    this.sentAt = new Date();
  }
  
  // Set readAt when isRead changes to true
  if (this.isModified('isRead') && this.isRead && !this.readAt) {
    this.readAt = new Date();
    this.status = 'read';
  }
  
  // Set threadId to self._id if not a reply and no threadId exists
  if (!this.isReply && !this.threadId && this.isNew) {
    this.threadId = this._id;
  }
  
  // If it's a reply, inherit threadId from original message if not set
  if (this.isReply && this.originalMessageId && !this.threadId) {
    // This would require a pre-hook to fetch the original message
    // For now, we'll handle this in the application layer
  }
  
  next();
});

// Static methods
messageSchema.statics.findConversation = function(userId1: string, userId2: string, options: any = {}) {
  const { skip = 0, limit = 20 } = options;
  
  return this.find({
    $or: [
      { senderId: userId1, recipientId: userId2 },
      { senderId: userId2, recipientId: userId1 }
    ],
    deletedAt: { $exists: false }
  })
  .populate('senderId', 'firstName lastName profileImage')
  .populate('recipientId', 'firstName lastName profileImage')
  .sort({ createdAt: -1 })
  .skip(skip)
  .limit(limit);
};

messageSchema.statics.findThreadMessages = function(threadId: string) {
  return this.find({ 
    threadId,
    deletedAt: { $exists: false }
  })
  .populate('senderId', 'firstName lastName profileImage')
  .populate('recipientId', 'firstName lastName profileImage')
  .sort({ createdAt: 1 });
};

messageSchema.statics.findUserMessages = function(userId: string, type: 'sent' | 'received' | 'all' = 'all', options: any = {}) {
  const { skip = 0, limit = 20, status, messageType } = options;
  
  let query: any = { deletedAt: { $exists: false } };
  
  if (type === 'sent') {
    query.senderId = userId;
  } else if (type === 'received') {
    query.recipientId = userId;
  } else {
    query.$or = [
      { senderId: userId },
      { recipientId: userId }
    ];
  }
  
  if (status) {
    query.status = status;
  }
  
  if (messageType) {
    query.messageType = messageType;
  }
  
  return this.find(query)
    .populate('senderId', 'firstName lastName profileImage')
    .populate('recipientId', 'firstName lastName profileImage')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

messageSchema.statics.findUnreadMessages = function(userId: string) {
  return this.find({
    recipientId: userId,
    isRead: false,
    deletedAt: { $exists: false }
  })
  .populate('senderId', 'firstName lastName profileImage')
  .sort({ createdAt: -1 });
};

messageSchema.statics.getUnreadCount = function(userId: string) {
  return this.countDocuments({
    recipientId: userId,
    isRead: false,
    deletedAt: { $exists: false }
  });
};

messageSchema.statics.findScheduledMessages = function() {
  return this.find({
    isScheduled: true,
    scheduledSendTime: { $lte: new Date() },
    status: 'draft'
  });
};

messageSchema.statics.getConversationList = function(userId: string) {
  return this.aggregate([
    // Match messages involving the user
    {
      $match: {
        $or: [
          { senderId: new Types.ObjectId(userId) },
          { recipientId: new Types.ObjectId(userId) }
        ],
        deletedAt: { $exists: false }
      }
    },
    // Sort by creation date
    { $sort: { createdAt: -1 } },
    // Group by conversation partner
    {
      $group: {
        _id: {
          $cond: {
            if: { $eq: ['$senderId', new Types.ObjectId(userId)] },
            then: '$recipientId',
            else: '$senderId'
          }
        },
        lastMessage: { $first: '$$ROOT' },
        unreadCount: {
          $sum: {
            $cond: {
              if: {
                $and: [
                  { $eq: ['$recipientId', new Types.ObjectId(userId)] },
                  { $eq: ['$isRead', false] }
                ]
              },
              then: 1,
              else: 0
            }
          }
        }
      }
    },
    // Lookup user details
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'conversationPartner'
      }
    },
    { $unwind: '$conversationPartner' },
    // Project final structure
    {
      $project: {
        conversationPartner: {
          _id: '$conversationPartner._id',
          firstName: '$conversationPartner.firstName',
          lastName: '$conversationPartner.lastName',
          profileImage: '$conversationPartner.profileImage',
          role: '$conversationPartner.role'
        },
        lastMessage: 1,
        unreadCount: 1
      }
    },
    // Sort by last message date
    { $sort: { 'last(Message as any).createdAt': -1 } }
  ]);
};

// Instance methods
messageSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  this.status = 'read';
  return this.save();
};

messageSchema.methods.archive = function() {
  this.status = 'archived';
  this.archivedAt = new Date();
  return this.save();
};

messageSchema.methods.softDelete = function() {
  this.deletedAt = new Date();
  return this.save();
};

messageSchema.methods.send = function() {
  if (this.isScheduled && this.scheduledSendTime && this.scheduledSendTime > new Date()) {
    // Don't send scheduled messages before their time
    return Promise.resolve(this);
  }
  
  this.status = 'sent';
  this.sentAt = new Date();
  this.isScheduled = false;
  return this.save();
};

messageSchema.methods.addAttachment = function(attachment: {
  filename: string;
  originalName: string;
  path: string;
  mimeType: string;
  size: number;
}) {
  if (!this.attachments) {
    this.attachments = [];
  }
  
  this.attachments.push({
    ...attachment,
    uploadedAt: new Date()
  });
  
  return this.save();
};

// Instance methods
messageSchema.methods.send = function() {
  this.sentAt = new Date();
  this.messageStatus = 'sent';
  return this.save();
};

messageSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

messageSchema.methods.archive = function() {
  this.isArchived = true;
  this.archivedAt = new Date();
  return this.save();
};

messageSchema.methods.softDelete = function() {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

// Static methods
messageSchema.statics.findUserMessages = function(userId: string, type?: string, options: any = {}) {
  const { skip = 0, limit = 10 } = options;
  const query: any = {
    $or: [
      { senderId: userId },
      { recipientId: userId }
    ],
    isDeleted: { $ne: true }
  };
  
  if (type) {
    query.messageType = type;
  }
  
  return this.find(query)
    .populate('senderId', 'firstName lastName role')
    .populate('recipientId', 'firstName lastName role')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

messageSchema.statics.findConversation = function(userId1: string, userId2: string, options: any = {}) {
  const { skip = 0, limit = 10 } = options;
  return this.find({
    $or: [
      { senderId: userId1, recipientId: userId2 },
      { senderId: userId2, recipientId: userId1 }
    ],
    isDeleted: { $ne: true }
  })
    .populate('senderId', 'firstName lastName role')
    .populate('recipientId', 'firstName lastName role')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

messageSchema.statics.getConversationList = function(userId: string) {
  return this.aggregate([
    {
      $match: {
        $or: [
          { senderId: new Types.ObjectId(userId) },
          { recipientId: new Types.ObjectId(userId) }
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
            { $eq: ['$senderId', new Types.ObjectId(userId)] },
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
                  { $eq: ['$recipientId', new Types.ObjectId(userId)] },
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
};

messageSchema.statics.findThreadMessages = function(threadId: string) {
  return this.find({ threadId, isDeleted: { $ne: true } })
    .populate('senderId', 'firstName lastName role')
    .populate('recipientId', 'firstName lastName role')
    .sort({ createdAt: 1 });
};

messageSchema.statics.findUnreadMessages = function(userId: string) {
  return this.find({
    recipientId: userId,
    isRead: false,
    isDeleted: { $ne: true }
  })
    .populate('senderId', 'firstName lastName role')
    .sort({ createdAt: -1 });
};

messageSchema.statics.getUnreadCount = function(userId: string) {
  return this.countDocuments({
    recipientId: userId,
    isRead: false,
    isDeleted: { $ne: true }
  });
};

messageSchema.statics.findScheduledMessages = function() {
  return this.find({
    messageType: 'scheduled',
    scheduledSendTime: { $lte: new Date() },
    messageStatus: 'scheduled'
  })
    .populate('senderId', 'firstName lastName')
    .populate('recipientId', 'firstName lastName');
};

const Message = model<IMessage>('Message', messageSchema);
export default Message;
