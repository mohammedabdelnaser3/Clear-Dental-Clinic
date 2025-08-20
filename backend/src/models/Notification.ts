import mongoose, { Schema } from 'mongoose';
import { INotification, INotificationModel } from '../types';

const notificationSchema = new Schema<INotification>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true,
    maxlength: [500, 'Message cannot exceed 500 characters']
  },
  type: {
    type: String,
    enum: ['general', 'appointment_reminder', 'appointment_confirmation', 'appointment_cancellation', 'system'],
    required: [true, 'Notification type is required']
  },
  isRead: {
    type: Boolean,
    default: false
  },
  link: {
    type: String,
    trim: true,
    maxlength: [200, 'Link cannot exceed 200 characters']
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function(doc: any, ret: any) {
      if (ret._id) {
        ret.id = ret._id.toString();
        delete (ret as any)._id;
      }
      if (ret.__v) delete (ret as any).__v;
      return ret;
    }
  }
});

// Indexes
notificationSchema.index({ userId: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ isRead: 1 });
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

// Virtual for time ago
notificationSchema.virtual('timeAgo').get(function(this: INotification) {
  const now = new Date();
  const diff = now.getTime() - this.createdAt.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else {
    return 'Just now';
  }
});

// Instance method to mark as read
notificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  return this.save();
};

// Instance method to mark as unread
notificationSchema.methods.markAsUnread = function() {
  this.isRead = false;
  return this.save();
};

// Static method to find unread notifications for user
notificationSchema.statics.findUnreadByUser = function(userId: string) {
  return this.find({ userId, isRead: false }).sort({ createdAt: -1 });
};

// Static method to find unread notifications with limit
notificationSchema.statics.findUnread = function(userId: string, limit: number = 10) {
  return this.find({ userId, isRead: false }).sort({ createdAt: -1 }).limit(limit);
};

// Static method to find notifications by user
notificationSchema.statics.findByUser = function(userId: string, limit: number = 50) {
  return this.find({ userId }).sort({ createdAt: -1 }).limit(limit);
};

// Static method to find notifications by type
notificationSchema.statics.findByType = function(userId: string, type: string, options: { skip?: number; limit?: number } = {}) {
  const query = this.find({ userId, type }).sort({ createdAt: -1 });
  if (options.skip) query.skip(options.skip);
  if (options.limit) query.limit(options.limit);
  return query;
};

// Static method to mark all as read for user
notificationSchema.statics.markAllAsReadForUser = function(userId: string) {
  return this.updateMany({ userId, isRead: false }, { isRead: true });
};

// Static method to mark all as read (alias)
notificationSchema.statics.markAllAsRead = function(userId: string) {
  return this.updateMany({ userId, isRead: false }, { isRead: true });
};

// Static method to delete old notifications
notificationSchema.statics.deleteOldNotifications = function(daysOld: number = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  return this.deleteMany({ createdAt: { $lt: cutoffDate } });
};

// Static method to create notification
notificationSchema.statics.createNotification = function(data: {
  userId: string;
  title: string;
  message: string;
  type: string;
  link?: string;
}) {
  return this.create(data);
};

// Static method to create appointment reminder
notificationSchema.statics.createAppointmentReminder = function(
  userId: string,
  appointmentId: string,
  appointmentDate: Date,
  timeSlot: string
) {
  const formattedDate = appointmentDate.toLocaleDateString();
  return this.create({
    userId,
    title: 'Appointment Reminder',
    message: `You have an appointment scheduled for ${formattedDate} at ${timeSlot}`,
    type: 'reminder',
    link: `/appointments/${appointmentId}`
  });
};

// Static method to create appointment confirmation
notificationSchema.statics.createAppointmentConfirmation = function(
  userId: string,
  appointmentId: string,
  appointmentDate: Date,
  timeSlot: string
) {
  const formattedDate = appointmentDate.toLocaleDateString();
  return this.create({
    userId,
    title: 'Appointment Confirmed',
    message: `Your appointment for ${formattedDate} at ${timeSlot} has been confirmed`,
    type: 'appointment',
    link: `/appointments/${appointmentId}`
  });
};

// Static method to create appointment cancellation
notificationSchema.statics.createAppointmentCancellation = function(
  userId: string,
  appointmentDate: Date,
  timeSlot: string,
  reason?: string
) {
  const formattedDate = appointmentDate.toLocaleDateString();
  const message = reason 
    ? `Your appointment for ${formattedDate} at ${timeSlot} has been cancelled. Reason: ${reason}`
    : `Your appointment for ${formattedDate} at ${timeSlot} has been cancelled`;
    
  return this.create({
    userId,
    title: 'Appointment Cancelled',
    message,
    type: 'appointment'
  });
};

// Static method to get unread count
notificationSchema.statics.getUnreadCount = function(userId: string) {
  return this.countDocuments({ userId, isRead: false });
};

// Static method to mark as read (alias for instance method)
notificationSchema.statics.markAsRead = function(notificationId: string) {
  return this.findByIdAndUpdate(notificationId, { isRead: true }, { new: true });
};

// Static method to create schedule notification
notificationSchema.statics.createScheduleNotification = function(
  userId: string,
  type: string,
  title: string,
  message: string,
  scheduleData: any,
  channels: any
) {
  return this.create({
    userId,
    type,
    title,
    message,
    data: scheduleData,
    channels
  });
};

// Static method to create schedule reminder
notificationSchema.statics.createScheduleReminder = function(
  userId: string,
  scheduleId: string,
  clinicName: string,
  date: Date,
  startTime: string,
  endTime: string
) {
  const formattedDate = date.toLocaleDateString();
  return this.create({
    userId,
    title: 'Schedule Reminder',
    message: `You have a shift at ${clinicName} on ${formattedDate} from ${startTime} to ${endTime}`,
    type: 'schedule_reminder',
    data: {
      scheduleId,
      date,
      startTime,
      endTime
    },
    link: `/schedules/${scheduleId}`
  });
};

// Static method to create schedule change notification
notificationSchema.statics.createScheduleChange = function(
  userId: string,
  scheduleId: string,
  clinicName: string,
  date: Date,
  startTime: string,
  endTime: string,
  changeType: string
) {
  const formattedDate = date.toLocaleDateString();
  return this.create({
    userId,
    title: 'Schedule Updated',
    message: `Your shift at ${clinicName} on ${formattedDate} has been ${changeType}`,
    type: 'schedule_change',
    data: {
      scheduleId,
      date,
      startTime,
      endTime
    },
    link: `/schedules/${scheduleId}`
  });
};

// Static method to create schedule conflict notification
notificationSchema.statics.createScheduleConflict = function(
  userId: string,
  scheduleId: string,
  conflictDetails: string
) {
  return this.create({
    userId,
    title: 'Schedule Conflict Detected',
    message: `A scheduling conflict has been detected: ${conflictDetails}`,
    type: 'schedule_conflict',
    data: {
      scheduleId
    },
    link: `/schedules/${scheduleId}`
  });
};

const Notification = mongoose.model<INotification, INotificationModel>('Notification', notificationSchema);

export default Notification;