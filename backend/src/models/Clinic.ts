import mongoose, { Schema } from 'mongoose';
import { IClinic, IClinicModel, Day } from '../types';

const clinicSchema = new Schema<IClinic>({
  name: {
    type: String,
    required: [true, 'Clinic name is required'],
    trim: true,
    maxlength: [100, 'Clinic name cannot exceed 100 characters']
  },
  branchName: {
    type: String,
    trim: true,
    maxlength: [100, 'Branch name cannot exceed 100 characters'],
    index: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  address: {
    street: {
      type: String,
      required: [true, 'Street address is required'],
      trim: true,
      maxlength: [200, 'Street address cannot exceed 200 characters']
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
      maxlength: [100, 'City cannot exceed 100 characters']
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true,
      maxlength: [100, 'State cannot exceed 100 characters']
    },
    zipCode: {
      type: String,
      required: [true, 'Zip code is required'],
      trim: true,
      maxlength: [20, 'Zip code cannot exceed 20 characters']
    },
    country: {
      type: String,
      required: [true, 'Country is required'],
      trim: true,
      maxlength: [100, 'Country cannot exceed 100 characters']
    },
    coordinates: {
      latitude: {
        type: Number,
        min: [-90, 'Latitude must be between -90 and 90'],
        max: [90, 'Latitude must be between -90 and 90']
      },
      longitude: {
        type: Number,
        min: [-180, 'Longitude must be between -180 and 180'],
        max: [180, 'Longitude must be between -180 and 180']
      }
    }
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please provide a valid phone number']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email']
  },
  website: {
    type: String,
    trim: true,
    match: [/^https?:\/\/.+/, 'Please provide a valid website URL']
  },
  emergencyContact: {
    type: String,
    trim: true,
    match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please provide a valid emergency contact number']
  },
  operatingHours: [{
    day: {
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      required: [true, 'Day is required']
    },
    open: {
      type: String,
      required: function(this: any) {
        return !this.closed;
      },
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide time in HH:MM format']
    },
    close: {
      type: String,
      required: function(this: any) {
        return !this.closed;
      },
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide time in HH:MM format']
    },
    closed: {
      type: Boolean,
      default: false
    }
  }],
  services: [{
    type: String,
    trim: true,
    maxlength: [100, 'Service name cannot exceed 100 characters']
  }],
  staff: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }]
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
clinicSchema.index({ name: 1 });
clinicSchema.index({ branchName: 1 });
clinicSchema.index({ name: 1, branchName: 1 });
clinicSchema.index({ 'address.city': 1 });
clinicSchema.index({ 'address.state': 1 });
clinicSchema.index({ 'address.zipCode': 1 });
clinicSchema.index({ services: 1 });
clinicSchema.index({ staff: 1 });
clinicSchema.index({ 'address.coordinates.latitude': 1, 'address.coordinates.longitude': 1 });

// Virtual for full address
clinicSchema.virtual('fullAddress').get(function() {
  const { street, city, state, zipCode, country } = this.address;
  return `${street}, ${city}, ${state} ${zipCode}, ${country}`;
});

// Virtual for staff count
clinicSchema.virtual('staffCount').get(function() {
  return this.staff ? this.staff.length : 0;
});

// Virtual for services count
clinicSchema.virtual('servicesCount').get(function() {
  return this.services ? this.services.length : 0;
});

// Instance method to check if clinic is open on a specific day
clinicSchema.methods.isOpenOnDay = function(day: Day): boolean {
  const daySchedule = this.operatingHours.find((schedule: any) => schedule.day === day);
  return daySchedule ? !daySchedule.closed : false;
};

// Instance method to get operating hours for a specific day
clinicSchema.methods.getOperatingHoursForDay = function(day: Day) {
  return this.operatingHours.find((schedule: any) => schedule.day === day);
};

// Instance method to check if clinic offers a specific service
clinicSchema.methods.offersService = function(service: string): boolean {
  return this.services.includes(service);
};

// Static method to find clinics by city
clinicSchema.statics.findByCity = function(city: string) {
  return this.find({ 'address.city': new RegExp(city, 'i') });
};

// Static method to find clinics by state
clinicSchema.statics.findByState = function(state: string) {
  return this.find({ 'address.state': new RegExp(state, 'i') });
};

// Static method to find clinics offering specific service
clinicSchema.statics.findByService = function(service: string) {
  return this.find({ services: new RegExp(service, 'i') });
};

// Static method to find clinics within radius (requires coordinates)
clinicSchema.statics.findNearby = function(latitude: number, longitude: number, radiusInKm: number = 10) {
  return this.find({
    'address.coordinates': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: radiusInKm * 1000 // Convert km to meters
      }
    }
  });
};

// Static method to search clinics
clinicSchema.statics.searchClinics = function(searchTerm: string) {
  const searchRegex = new RegExp(searchTerm, 'i');
  return this.find({
    $or: [
      { name: searchRegex },
      { description: searchRegex },
      { 'address.city': searchRegex },
      { 'address.state': searchRegex },
      { services: searchRegex }
    ]
  });
};

// Static method to find clinics by name
clinicSchema.statics.findByName = function(name: string) {
  return this.find({ name: new RegExp(name, 'i') });
};

// Pre-save middleware to ensure operating hours for all days
clinicSchema.pre('save', function(next) {
  const days: Day[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  
  // Ensure we have operating hours for all days
  days.forEach(day => {
    const existingSchedule = (this as any).operatingHours.find((schedule: any) => schedule.day === day);
    if (!existingSchedule) {
      (this as any).operatingHours.push({
        day,
        open: '09:00',
        close: '17:00',
        closed: true // Default to closed if not specified
      });
    }
  });
  
  // Ensure email is lowercase
  if ((this as any).email) {
    (this as any).email = (this as any).email.toLowerCase();
  }
  
  next();
});

const Clinic = mongoose.model<IClinic, IClinicModel>('Clinic', clinicSchema);

export default Clinic;