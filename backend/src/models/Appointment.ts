import mongoose, { Schema, Model } from 'mongoose';
import { IAppointment, IAppointmentModel } from '../types';

const appointmentSchema = new Schema<IAppointment>({
  patientId: {
    type: Schema.Types.ObjectId,
    ref: 'Patient',
    required: [true, 'Patient ID is required']
  },
  dentistId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Dentist ID is required']
  },
  clinicId: {
    type: Schema.Types.ObjectId,
    ref: 'Clinic',
    required: [true, 'Clinic ID is required']
  },
  serviceType: {
    type: String,
    required: [true, 'Service type is required'],
    trim: true,
    maxlength: [100, 'Service type cannot exceed 100 characters']
  },
  date: {
    type: Date,
    required: [true, 'Appointment date is required'],
    validate: {
      validator: function(value: Date) {
        // Allow appointments to be scheduled for today or future dates
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return value >= today;
      },
      message: 'Appointment date cannot be in the past'
    }
  },
  timeSlot: {
    type: String,
    required: [true, 'Time slot is required'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide time in HH:MM format']
  },
  duration: {
    type: Number,
    required: [true, 'Duration is required'],
    min: [15, 'Minimum appointment duration is 15 minutes'],
    max: [480, 'Maximum appointment duration is 8 hours']
  },
  status: {
    type: String,
    enum: ['scheduled', 'confirmed', 'completed', 'cancelled', 'no-show', 'urgent'],
    default: 'scheduled'
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  emergency: {
    type: Boolean,
    default: false
  },
  notificationPreferences: {
    enabled: {
      type: Boolean,
      default: true
    },
    channels: {
      email: {
        type: Boolean,
        default: true
      },
      sms: {
        type: Boolean,
        default: true
      },
      inApp: {
        type: Boolean,
        default: true
      }
    },
    reminderTimes: {
      type: [Number],
      default: [24] // Default reminder 24 hours before appointment
    }
  },
  treatmentProvided: {
    type: String,
    trim: true
  },
  followUpRequired: {
    type: Boolean,
    default: false
  },
  followUpDate: {
    type: Date
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function(doc: any, ret: any) {
      ret.id = ret._id;
      if (ret._id) delete (ret as any)._id;
      if (ret.__v) delete (ret as any).__v;
      return ret;
    }
  }
});

// Indexes
appointmentSchema.index({ patientId: 1 });
appointmentSchema.index({ dentistId: 1 });
appointmentSchema.index({ clinicId: 1 });
appointmentSchema.index({ date: 1 });
appointmentSchema.index({ status: 1 });
appointmentSchema.index({ date: 1, timeSlot: 1 });
appointmentSchema.index({ dentistId: 1, date: 1, timeSlot: 1 }, { unique: true }); // Prevent double booking
appointmentSchema.index({ serviceType: 1 });
appointmentSchema.index({ createdAt: 1 });

// Compound indexes for common queries
appointmentSchema.index({ clinicId: 1, date: 1, status: 1 });
appointmentSchema.index({ patientId: 1, status: 1, date: 1 });
appointmentSchema.index({ dentistId: 1, status: 1, date: 1 });

// Virtual for appointment end time
appointmentSchema.virtual('endTime').get(function(this: any) {
  const [hours, minutes] = this.timeSlot.split(':').map(Number);
  const startTime = new Date(this.date);
  startTime.setHours(hours, minutes, 0, 0);
  
  const endTime = new Date(startTime.getTime() + this.duration * 60000);
  return `${endTime.getHours().toString().padStart(2, '0')}:${endTime.getMinutes().toString().padStart(2, '0')}`;
});

// Virtual for full date-time
appointmentSchema.virtual('dateTime').get(function(this: any) {
  const appointmentDate = new Date(this.date);
  const [hours, minutes] = this.timeSlot.split(':').map(Number);
  appointmentDate.setHours(hours, minutes, 0, 0);
  return appointmentDate;
});

// Virtual for appointment duration in hours
appointmentSchema.virtual('durationInHours').get(function(this: any) {
  return this.duration / 60;
});

// Instance method to check if appointment is in the past
appointmentSchema.methods.isPast = function(this: any): boolean {
  const appointmentDateTime = new Date(this.date);
  const [hours, minutes] = this.timeSlot.split(':').map(Number);
  appointmentDateTime.setHours(hours, minutes, 0, 0);
  return appointmentDateTime < new Date();
};

// Instance method to check if appointment is today
appointmentSchema.methods.isToday = function(this: any): boolean {
  const today = new Date();
  const appointmentDate = new Date(this.date);
  return appointmentDate.toDateString() === today.toDateString();
};

// Instance method to check if appointment can be cancelled
appointmentSchema.methods.canBeCancelled = function(this: any): boolean {
  return ['scheduled', 'confirmed'].includes(this.status) && !this.isPast();
};

// Instance method to check if appointment can be rescheduled
appointmentSchema.methods.canBeRescheduled = function(this: any): boolean {
  return ['scheduled', 'confirmed'].includes(this.status) && !this.isPast();
};

// Static method to find appointments by date range
appointmentSchema.statics.findByDateRange = function(startDate: Date, endDate: Date) {
  return this.find({
    date: {
      $gte: startDate,
      $lte: endDate
    }
  });
};

// Static method to find appointments for a specific dentist on a date
appointmentSchema.statics.findByDentistAndDate = function(dentistId: string, date: Date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  return this.find({
    dentistId,
    date: {
      $gte: startOfDay,
      $lte: endOfDay
    }
  });
};

// Static method to check for conflicts
appointmentSchema.statics.findConflicts = function(dentistId: string, date: Date, timeSlot: string, duration: number, excludeId?: string) {
  const [hours, minutes] = timeSlot.split(':').map(Number);
  const startTime = new Date(date);
  startTime.setHours(hours, minutes, 0, 0);
  const endTime = new Date(startTime.getTime() + duration * 60000);
  
  const query: any = {
    dentistId,
    date: {
      $gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
      $lt: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
    },
    status: { $in: ['scheduled', 'confirmed'] }
  };
  
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  
  return this.find(query).then((appointments: any[]) => {
    return appointments.filter((apt: any) => {
      const [aptHours, aptMinutes] = apt.timeSlot.split(':').map(Number);
      const aptStartTime = new Date(apt.date);
      aptStartTime.setHours(aptHours, aptMinutes, 0, 0);
      const aptEndTime = new Date(aptStartTime.getTime() + apt.duration * 60000);
      
      // Check for overlap
      return (startTime < aptEndTime && endTime > aptStartTime);
    });
  });
};

// Static method to get available time slots
appointmentSchema.statics.getAvailableTimeSlots = function(dentistId: string, date: Date, duration: number = 30) {
  const startHour = 9; // 9 AM
  const endHour = 17; // 5 PM
  const slotDuration = 30; // 30 minutes
  
  return (this as IAppointmentModel).findByDentistAndDate(dentistId, date).then((appointments: any[]) => {
    const bookedSlots = appointments
      .filter((apt: any) => ['scheduled', 'confirmed'].includes(apt.status))
      .map((apt: any) => {
        const [hours, minutes] = apt.timeSlot.split(':').map(Number);
        const startTime = hours * 60 + minutes;
        return {
          start: startTime,
          end: startTime + apt.duration
        };
      });
    
    const availableSlots = [];
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += slotDuration) {
        const slotStart = hour * 60 + minute;
        const slotEnd = slotStart + duration;
        
        // Check if this slot conflicts with any booked appointment
        const hasConflict = bookedSlots.some((booked: any) => 
          slotStart < booked.end && slotEnd > booked.start
        );
        
        if (!hasConflict && slotEnd <= endHour * 60) {
          const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          availableSlots.push({
            time: timeString,
            available: true
          });
        }
      }
    }
    
    return availableSlots;
  });
};

// Pre-save middleware for validation
appointmentSchema.pre('save', async function(this: any, next) {
  try {
    // Check for conflicts only if this is a new appointment or date/time changed
    if (this.isNew || this.isModified('date') || this.isModified('timeSlot') || this.isModified('duration')) {
      const conflicts = await (this.constructor as any).findConflicts(
        this.dentistId,
        this.date,
        this.timeSlot,
        this.duration,
        this._id
      );
      
      if (conflicts.length > 0) {
        throw new Error('This time slot conflicts with an existing appointment');
      }
    }
    
    next();
  } catch (error) {
    next(error as Error);
  }
});

const Appointment = mongoose.model<IAppointment, IAppointmentModel>('Appointment', appointmentSchema);

export default Appointment;