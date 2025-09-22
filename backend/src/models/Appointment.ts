import mongoose, { Schema, Model } from 'mongoose';
import { IAppointment, IAppointmentModel } from '../types';
import Clinic from './Clinic'; // Import Clinic model to access operating hours

const appointmentSchema = new Schema<IAppointment>({
  patientId: {
    type: Schema.Types.ObjectId,
    ref: 'Patient',
    required: [true, 'Patient ID is required']
  },
  dentistId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false // Made optional - appointments can exist without dentists
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
appointmentSchema.statics.getAvailableTimeSlots = async function(dentistId: string, date: Date, duration: number = 30) {
  try {
    const appointmentModel = this as IAppointmentModel;
    
    // Find the dentist to get their assigned clinic
    const dentist = await mongoose.model('User').findById(dentistId).populate('assignedClinics');
    if (!dentist || !dentist.assignedClinics || dentist.assignedClinics.length === 0) {
      console.warn(`Dentist not found or not assigned to any clinic: ${dentistId}`);
      return []; // No slots if dentist or clinic is invalid
    }

    // For simplicity, we'll use the first assigned clinic's operating hours.
    // A more complex system might check schedules for a specific clinic if a dentist works at multiple.
    const clinic = await Clinic.findById(dentist.assignedClinics[0]);
    if (!clinic || !clinic.operatingHours) {
      console.warn(`Clinic or operating hours not found for dentist: ${dentistId}`);
      return []; // No slots if clinic hours aren't defined
    }
    
    // Determine operating hours for the specific day of the week
    const dayOfWeek = date.toLocaleString('en-US', { weekday: 'long' }).toLowerCase();
    const hoursForDay = clinic.operatingHours.find(h => h.day.toLowerCase() === dayOfWeek);

    if (!hoursForDay || hoursForDay.closed) {
      return []; // Clinic is closed on this day
    }

    const startHour = parseInt(hoursForDay.open.split(':')[0]);
    const startMinute = parseInt(hoursForDay.open.split(':')[1]);
    const endHour = parseInt(hoursForDay.close.split(':')[0]);
    const endMinute = parseInt(hoursForDay.close.split(':')[1]);

    const appointments = await appointmentModel.findByDentistAndDate(dentistId, date);
    
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
    const slotDuration = 30; // Assuming 30-minute slot increments for generation

    let currentTime = startHour * 60 + startMinute;
    const endTime = endHour * 60 + endMinute;
    
    while(currentTime + duration <= endTime) {
      const slotStart = currentTime;
      const slotEnd = slotStart + duration;

      const hasConflict = bookedSlots.some(booked => 
        slotStart < booked.end && slotEnd > booked.start
      );

      if (!hasConflict) {
        const hour = Math.floor(slotStart / 60);
        const minute = slotStart % 60;
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        
        const isPeak = hour >= 10 && hour < 14;
        
        availableSlots.push({
          id: `${dentistId}-${date.toISOString().split('T')[0]}-${timeString}`,
          time: timeString,
          isAvailable: true,
          isPeak: isPeak,
          available: true
        });
      }
      
      currentTime += slotDuration;
    }
    
    return availableSlots;
  } catch (error) {
    console.error("Error in getAvailableTimeSlots:", error);
    throw error; // Rethrow to be caught by the controller's error handler
  }
};

// Static method to get next available slot after the last booked appointment
appointmentSchema.statics.getNextSlotAfterLastBooking = async function(clinicId: string, date: Date, duration: number = 30) {
  try {
    // Get clinic operating hours
    const clinic = await Clinic.findById(clinicId);
    if (!clinic || !clinic.operatingHours) {
      console.warn(`Clinic or operating hours not found: ${clinicId}`);
      return null;
    }
    
    // Determine operating hours for the specific day of the week
    const dayOfWeek = date.toLocaleString('en-US', { weekday: 'long' }).toLowerCase();
    const hoursForDay = clinic.operatingHours.find(h => h.day.toLowerCase() === dayOfWeek);

    if (!hoursForDay || hoursForDay.closed) {
      return null; // Clinic is closed on this day
    }

    const startHour = parseInt(hoursForDay.open.split(':')[0]);
    const startMinute = parseInt(hoursForDay.open.split(':')[1]);
    const endHour = parseInt(hoursForDay.close.split(':')[0]);
    const endMinute = parseInt(hoursForDay.close.split(':')[1]);
    
    const clinicStartTime = startHour * 60 + startMinute;
    const clinicEndTime = endHour * 60 + endMinute;

    // Find all appointments for this clinic on this date (across all dentists)
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const appointments = await this.find({
      clinicId,
      date: {
        $gte: startOfDay,
        $lte: endOfDay
      },
      status: { $in: ['scheduled', 'confirmed'] }
    }).sort({ timeSlot: 1 });

    let nextAvailableTime = clinicStartTime;

    if (appointments.length > 0) {
      // Find the latest end time among all appointments
      let latestEndTime = 0;
      
      appointments.forEach((apt: any) => {
        const [hours, minutes] = apt.timeSlot.split(':').map(Number);
        const startTime = hours * 60 + minutes;
        const endTime = startTime + apt.duration;
        
        if (endTime > latestEndTime) {
          latestEndTime = endTime;
        }
      });
      
      // Set next available time to after the last appointment
      nextAvailableTime = latestEndTime;
    }

    // Check if the next slot fits within clinic hours
    if (nextAvailableTime + duration > clinicEndTime) {
      return null; // No time available after last booking within clinic hours
    }

    // Convert back to time string
    const hour = Math.floor(nextAvailableTime / 60);
    const minute = nextAvailableTime % 60;
    const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    
    
    const isPeak = hour >= 10 && hour < 14;

    return {
      time: timeString,
      isAvailable: true,
      isPeak: isPeak,
      available: true,
      id: `${clinicId}-${date.toISOString().split('T')[0]}-${timeString}`
    };
    
  } catch (error) {
    console.error("Error in getNextSlotAfterLastBooking:", error);
    throw error;
  }
};

// Pre-save middleware for validation
appointmentSchema.pre('save', async function(this: any, next) {
  try {
    // Check for conflicts only if this is a new appointment or date/time changed
    // AND if a dentist is assigned (conflicts can only occur with specific dentists)
    if ((this.isNew || this.isModified('date') || this.isModified('timeSlot') || this.isModified('duration')) && this.dentistId) {
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