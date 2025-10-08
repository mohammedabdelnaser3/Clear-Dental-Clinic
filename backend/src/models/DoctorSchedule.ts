import mongoose, { Schema, Document, Model } from 'mongoose';

// Interface for DoctorSchedule document
export interface IDoctorSchedule extends Document {
  _id: mongoose.Types.ObjectId;
  doctorId: mongoose.Types.ObjectId;
  clinicId: mongoose.Types.ObjectId;
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0=Sunday, 1=Monday, ..., 6=Saturday
  startTime: string; // Format: "HH:mm" (24-hour format, e.g., "14:30")
  endTime: string;   // Format: "HH:mm"
  isActive: boolean;
  notes?: string;
  effectiveFrom?: Date;
  effectiveUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Interface for model static methods
export interface IDoctorScheduleModel extends Model<IDoctorSchedule, {}, {}, {}, any, any, any> {
  findByDoctor(doctorId: string, isActive?: boolean): Promise<IDoctorSchedule[]>;
  findByClinic(clinicId: string, isActive?: boolean): Promise<IDoctorSchedule[]>;
  findByDoctorAndClinic(doctorId: string, clinicId: string, isActive?: boolean): Promise<IDoctorSchedule[]>;
  findByDoctorAndDay(doctorId: string, dayOfWeek: number, clinicId?: string): Promise<IDoctorSchedule[]>;
  getAvailableDoctorsForDay(clinicId: string, dayOfWeek: number): Promise<IDoctorSchedule[]>;
}

const doctorScheduleSchema = new Schema<IDoctorSchedule>({
  doctorId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Doctor ID is required'],
    index: true
  },
  clinicId: {
    type: Schema.Types.ObjectId,
    ref: 'Clinic',
    required: [true, 'Clinic ID is required'],
    index: true
  },
  dayOfWeek: {
    type: Number,
    required: [true, 'Day of week is required'],
    min: 0,
    max: 6,
    validate: {
      validator: function(value: number) {
        return Number.isInteger(value) && value >= 0 && value <= 6;
      },
      message: 'Day of week must be an integer between 0 (Sunday) and 6 (Saturday)'
    }
  },
  startTime: {
    type: String,
    required: [true, 'Start time is required'],
    validate: {
      validator: function(value: string) {
        // Validate HH:mm format
        return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value);
      },
      message: 'Start time must be in HH:mm format (e.g., "14:30")'
    }
  },
  endTime: {
    type: String,
    required: [true, 'End time is required'],
    validate: {
      validator: function(value: string) {
        // Validate HH:mm format
        return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value);
      },
      message: 'End time must be in HH:mm format (e.g., "18:00")'
    }
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters'],
    trim: true
  },
  effectiveFrom: {
    type: Date,
    default: Date.now
  },
  effectiveUntil: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function(doc: any, ret: any) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Compound indexes for efficient queries
doctorScheduleSchema.index({ doctorId: 1, clinicId: 1 });
doctorScheduleSchema.index({ doctorId: 1, dayOfWeek: 1 });
doctorScheduleSchema.index({ clinicId: 1, dayOfWeek: 1 });
doctorScheduleSchema.index({ doctorId: 1, clinicId: 1, dayOfWeek: 1 });
doctorScheduleSchema.index({ isActive: 1, doctorId: 1 });

// Pre-save validation: ensure start time is before end time
doctorScheduleSchema.pre('save', function(next) {
  const start = this.startTime.split(':').map(Number);
  const end = this.endTime.split(':').map(Number);
  
  const startMinutes = start[0] * 60 + start[1];
  const endMinutes = end[0] * 60 + end[1];
  
  if (startMinutes >= endMinutes) {
    return next(new Error('Start time must be before end time'));
  }
  
  next();
});

// Static method: Find schedules by doctor
doctorScheduleSchema.statics.findByDoctor = async function(
  doctorId: string,
  isActive: boolean = true
) {
  const query: any = { doctorId };
  if (isActive !== undefined) {
    query.isActive = isActive;
  }
  
  return this.find(query)
    .populate('doctorId', 'firstName lastName email')
    .populate('clinicId', 'name branchName address')
    .sort({ dayOfWeek: 1, startTime: 1 });
};

// Static method: Find schedules by clinic
doctorScheduleSchema.statics.findByClinic = async function(
  clinicId: string,
  isActive: boolean = true
) {
  const query: any = { clinicId };
  if (isActive !== undefined) {
    query.isActive = isActive;
  }
  
  return this.find(query)
    .populate('doctorId', 'firstName lastName email specialization')
    .populate('clinicId', 'name branchName')
    .sort({ dayOfWeek: 1, startTime: 1 });
};

// Static method: Find schedules by doctor and clinic
doctorScheduleSchema.statics.findByDoctorAndClinic = async function(
  doctorId: string,
  clinicId: string,
  isActive: boolean = true
) {
  const query: any = { doctorId, clinicId };
  if (isActive !== undefined) {
    query.isActive = isActive;
  }
  
  return this.find(query)
    .populate('doctorId', 'firstName lastName')
    .populate('clinicId', 'name branchName')
    .sort({ dayOfWeek: 1, startTime: 1 });
};

// Static method: Find schedules by doctor and day
doctorScheduleSchema.statics.findByDoctorAndDay = async function(
  doctorId: string,
  dayOfWeek: number,
  clinicId?: string
) {
  const query: any = {
    doctorId,
    dayOfWeek,
    isActive: true
  };
  
  if (clinicId) {
    query.clinicId = clinicId;
  }
  
  return this.find(query)
    .populate('doctorId', 'firstName lastName')
    .populate('clinicId', 'name branchName')
    .sort({ startTime: 1 });
};

// Static method: Get all available doctors for a specific day at a clinic
doctorScheduleSchema.statics.getAvailableDoctorsForDay = async function(
  clinicId: string,
  dayOfWeek: number
) {
  return this.find({
    clinicId,
    dayOfWeek,
    isActive: true
  })
    .populate('doctorId', 'firstName lastName email specialization')
    .populate('clinicId', 'name branchName')
    .sort({ startTime: 1 });
};

// Virtual: Get day name
doctorScheduleSchema.virtual('dayName').get(function() {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[this.dayOfWeek];
});

// Virtual: Get duration in minutes
doctorScheduleSchema.virtual('durationMinutes').get(function() {
  const start = this.startTime.split(':').map(Number);
  const end = this.endTime.split(':').map(Number);
  
  const startMinutes = start[0] * 60 + start[1];
  const endMinutes = end[0] * 60 + end[1];
  
  return endMinutes - startMinutes;
});

// Virtual: Check if schedule is currently effective
doctorScheduleSchema.virtual('isCurrentlyEffective').get(function() {
  const now = new Date();
  
  if (this.effectiveFrom && now < this.effectiveFrom) {
    return false;
  }
  
  if (this.effectiveUntil && now > this.effectiveUntil) {
    return false;
  }
  
  return this.isActive;
});

const DoctorSchedule = mongoose.model<IDoctorSchedule, IDoctorScheduleModel>(
  'DoctorSchedule',
  doctorScheduleSchema
);

export default DoctorSchedule;

