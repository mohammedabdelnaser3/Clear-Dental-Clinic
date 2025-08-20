import mongoose, { Schema, Document } from 'mongoose';
import { IStaffSchedule, IStaffScheduleModel } from '../types';

// Remove local interface since it's now in types
/*
export interface IStaffSchedule extends Document {
  staffId: mongoose.Types.ObjectId;
  clinicId: mongoose.Types.ObjectId;
  date: Date;
  startTime: string;
  endTime: string;
  shiftType: 'morning' | 'afternoon' | 'evening' | 'night' | 'full-day';
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  notes?: string;
  isRecurring: boolean;
  recurringPattern?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    daysOfWeek?: number[]; // 0-6 (Sunday-Saturday)
    endDate?: Date;
  };
  notifications: {
    email: boolean;
    sms: boolean;
    inApp: boolean;
    reminderTime: number; // minutes before shift
  };
  conflictResolution?: {
    isConflict: boolean;
    conflictWith?: mongoose.Types.ObjectId[];
    resolvedBy?: mongoose.Types.ObjectId;
    resolvedAt?: Date;
  };
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
*/

const staffScheduleSchema = new Schema<IStaffSchedule>({
  staffId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Staff ID is required']
  },
  clinicId: {
    type: Schema.Types.ObjectId,
    ref: 'Clinic',
    required: [true, 'Clinic ID is required']
  },
  date: {
    type: Date,
    required: [true, 'Date is required']
  },
  startTime: {
    type: String,
    required: [true, 'Start time is required'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide a valid time format (HH:MM)']
  },
  endTime: {
    type: String,
    required: [true, 'End time is required'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide a valid time format (HH:MM)']
  },
  shiftType: {
    type: String,
    enum: ['morning', 'afternoon', 'evening', 'night', 'full-day'],
    required: [true, 'Shift type is required']
  },
  status: {
    type: String,
    enum: ['scheduled', 'completed', 'cancelled', 'no-show'],
    default: 'scheduled'
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringPattern: {
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly']
    },
    daysOfWeek: [{
      type: Number,
      min: 0,
      max: 6
    }],
    endDate: {
      type: Date
    }
  },
  notifications: {
    email: {
      type: Boolean,
      default: true
    },
    sms: {
      type: Boolean,
      default: false
    },
    inApp: {
      type: Boolean,
      default: true
    },
    reminderTime: {
      type: Number,
      default: 60, // 1 hour before
      min: 0,
      max: 1440 // max 24 hours
    }
  },
  conflictResolution: {
    isConflict: {
      type: Boolean,
      default: false
    },
    conflictWith: [{
      type: Schema.Types.ObjectId,
      ref: 'StaffSchedule'
    }],
    resolvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    resolvedAt: {
      type: Date
    }
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Created by is required']
  }
}, {
  timestamps: true
});

// Indexes
staffScheduleSchema.index({ staffId: 1, date: 1 });
staffScheduleSchema.index({ clinicId: 1, date: 1 });
staffScheduleSchema.index({ date: 1, status: 1 });

// Validation to ensure end time is after start time
staffScheduleSchema.pre('save', function(next) {
  const startHour = parseInt(this.startTime.split(':')[0]);
  const startMinute = parseInt(this.startTime.split(':')[1]);
  const endHour = parseInt(this.endTime.split(':')[0]);
  const endMinute = parseInt(this.endTime.split(':')[1]);
  
  const startTotalMinutes = startHour * 60 + startMinute;
  const endTotalMinutes = endHour * 60 + endMinute;
  
  if (endTotalMinutes <= startTotalMinutes) {
    return next(new Error('End time must be after start time'));
  }
  
  next();
});

// Static method to find schedules by clinic and date range
staffScheduleSchema.statics.findByClinicAndDateRange = function(clinicId: string, startDate: Date, endDate: Date) {
  return this.find({
    clinicId,
    date: { $gte: startDate, $lte: endDate }
  }).populate('staffId', 'firstName lastName role email phone');
};

// Static method to find staff availability
staffScheduleSchema.statics.findStaffAvailability = function(staffId: string, date: Date) {
  return this.find({
    staffId,
    date,
    status: { $in: ['scheduled', 'completed'] }
  });
};

// Static method to detect scheduling conflicts
staffScheduleSchema.statics.detectConflicts = function(staffId: string, date: Date, startTime: string, endTime: string, excludeId?: string) {
  const query: any = {
    staffId,
    date,
    status: { $in: ['scheduled', 'completed'] },
    $or: [
      {
        startTime: { $lte: startTime },
        endTime: { $gt: startTime }
      },
      {
        startTime: { $lt: endTime },
        endTime: { $gte: endTime }
      },
      {
        startTime: { $gte: startTime },
        endTime: { $lte: endTime }
      }
    ]
  };
  
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  
  return this.find(query);
};

// Static method to get staff schedules for calendar view
staffScheduleSchema.statics.getCalendarView = function(clinicId: string, startDate: Date, endDate: Date) {
  return this.find({
    clinicId,
    date: { $gte: startDate, $lte: endDate },
    status: { $in: ['scheduled', 'completed'] }
  })
  .populate('staffId', 'firstName lastName role email phone')
  .populate('clinicId', 'name')
  .sort({ date: 1, startTime: 1 });
};

const StaffSchedule = mongoose.model<IStaffSchedule, IStaffScheduleModel>('StaffSchedule', staffScheduleSchema);

export default StaffSchedule;