import mongoose, { Schema } from 'mongoose';
import { IPatient, IPatientModel } from '../types';

const patientSchema = new Schema<IPatient>({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please provide a valid phone number']
  },
  dateOfBirth: {
    type: Date,
    required: [true, 'Date of birth is required'],
    validate: {
      validator: function(value: Date) {
        return value < new Date();
      },
      message: 'Date of birth must be in the past'
    }
  },
  address: {
    street: {
      type: String,
      required: false,
      trim: true,
      maxlength: [200, 'Street address cannot exceed 200 characters']
    },
    city: {
      type: String,
      required: false,
      trim: true,
      maxlength: [100, 'City cannot exceed 100 characters']
    },
    state: {
      type: String,
      required: false,
      trim: true,
      maxlength: [100, 'State cannot exceed 100 characters']
    },
    zipCode: {
      type: String,
      required: false,
      trim: true,
      maxlength: [20, 'Zip code cannot exceed 20 characters']
    },
    country: {
      type: String,
      required: false,
      trim: true,
      maxlength: [100, 'Country cannot exceed 100 characters']
    }
  },
  medicalHistory: {
    allergies: [{
      type: String,
      trim: true,
      maxlength: [200, 'Allergy description cannot exceed 200 characters']
    }],
    medications: [{
      type: String,
      trim: true,
      maxlength: [200, 'Medication description cannot exceed 200 characters']
    }],
    conditions: [{
      type: String,
      trim: true,
      maxlength: [200, 'Condition description cannot exceed 200 characters']
    }],
    notes: {
      type: String,
      trim: true,
      maxlength: [2000, 'Medical history notes cannot exceed 2000 characters']
    }
  },
  treatmentRecords: [{
    type: Schema.Types.ObjectId,
    ref: 'TreatmentRecord'
  }],
  preferredClinicId: {
    type: Schema.Types.ObjectId,
    ref: 'Clinic',
    required: [true, 'Preferred clinic is required']
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false, // Optional for existing patients
    index: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  emergencyContact: {
    name: {
      type: String,
      trim: true,
      maxlength: [100, 'Emergency contact name cannot exceed 100 characters']
    },
    phone: {
      type: String,
      trim: true,
      match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please provide a valid emergency contact phone number']
    },
    relationship: {
      type: String,
      trim: true,
      maxlength: [50, 'Relationship cannot exceed 50 characters']
    }
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
// Remove: patientSchema.index({ email: 1 });
patientSchema.index({ phone: 1 });
patientSchema.index({ preferredClinicId: 1 });
patientSchema.index({ isActive: 1 });
patientSchema.index({ firstName: 1, lastName: 1 });
patientSchema.index({ 'address.city': 1 });
patientSchema.index({ 'address.state': 1 });

// Virtual for full name
patientSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for age calculation
patientSchema.virtual('age').get(function() {
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
});

// Instance method to get full address
patientSchema.methods.getFullAddress = function(): string {
  const { street, city, state, zipCode, country } = this.address;
  return `${street}, ${city}, ${state} ${zipCode}, ${country}`;
};

// Static method to find by email
patientSchema.statics.findByEmail = function(email: string) {
  return this.findOne({ email: email.toLowerCase(), isActive: true });
};

// Static method to find by phone
patientSchema.statics.findByPhone = function(phone: string) {
  return this.findOne({ phone, isActive: true });
};

// Static method to find by clinic
patientSchema.statics.findByClinic = function(clinicId: string) {
  return this.find({ preferredClinicId: clinicId, isActive: true });
};

// Static method to search patients
patientSchema.statics.searchPatients = function(searchTerm: string, clinicId?: string) {
  const searchRegex = new RegExp(searchTerm, 'i');
  const query: any = {
    isActive: true,
    $or: [
      { firstName: searchRegex },
      { lastName: searchRegex },
      { email: searchRegex },
      { phone: searchRegex }
    ]
  };
  
  if (clinicId) {
    query.preferredClinicId = clinicId;
  }
  
  return this.find(query);
};

// Pre-save middleware
patientSchema.pre('save', function(next) {
  // Ensure email is lowercase
  if (this.email) {
    this.email = this.email.toLowerCase();
  }
  next();
});

const Patient = mongoose.model<IPatient, IPatientModel>('Patient', patientSchema);

export default Patient;