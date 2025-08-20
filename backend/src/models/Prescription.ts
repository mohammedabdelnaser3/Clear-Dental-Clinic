import mongoose, { Schema } from 'mongoose';
import { IPrescription, IPrescriptionModel } from '../types';

const prescriptionSchema = new Schema<IPrescription>({
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
  appointmentId: {
    type: Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  medications: [{
    medicationId: {
      type: Schema.Types.ObjectId,
      ref: 'Medication',
      required: true
    },
    dosage: {
      type: String,
      required: [true, 'Dosage is required'],
      trim: true
    },
    frequency: {
      type: String,
      required: [true, 'Frequency is required'],
      trim: true
    },
    duration: {
      type: String,
      required: [true, 'Duration is required'],
      trim: true
    },
    instructions: {
      type: String,
      trim: true,
      maxlength: [500, 'Instructions cannot exceed 500 characters']
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    endDate: {
      type: Date
    }
  }],
  diagnosis: {
    type: String,
    required: [true, 'Diagnosis is required'],
    trim: true,
    maxlength: [500, 'Diagnosis cannot exceed 500 characters']
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled', 'expired'],
    default: 'active'
  },
  issuedDate: {
    type: Date,
    default: Date.now
  },
  expiryDate: {
    type: Date
  },
  refillsAllowed: {
    type: Number,
    default: 0,
    min: 0
  },
  refillsUsed: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function(doc: any, ret: any) {
      ret.id = ret._id;
      if (ret._id) delete (ret as any)._id;
      if (ret.__v) delete (ret as any).__v;
      
      // Map backend field names to frontend expected names
      if (ret.patientId) {
        (ret as any).patient = ret.patientId;
        delete (ret as any).patientId;
      }
      if (ret.dentistId) {
        (ret as any).dentist = ret.dentistId;
        delete (ret as any).dentistId;
      }
      if (ret.clinicId) {
        (ret as any).clinic = ret.clinicId;
        delete (ret as any).clinicId;
      }
      if (ret.appointmentId) {
        (ret as any).appointment = ret.appointmentId;
        delete ret.appointmentId;
      }
      
      // Map refill fields
      (ret as any).maxRefills = ret.refillsAllowed || 0;
      (ret as any).refills = [];
      for (let i = 0; i < (ret.refillsUsed || 0); i++) {
        (ret as any).refills.push({
          date: ret.updatedAt,
          refillNumber: i + 1,
          notes: 'Refill dispensed'
        });
      }
      if (ret.refillsAllowed !== undefined) delete (ret as any).refillsAllowed;
      if (ret.refillsUsed !== undefined) delete (ret as any).refillsUsed;
      
      // Map medication structure
      if (ret.medications) {
        ret.medications = ret.medications.map((med: any) => ({
          medicationId: med.medicationId,
          medication: med.medicationId,
          dosage: med.dosage,
          frequency: med.frequency,
          duration: med.duration,
          instructions: med.instructions,
          startDate: med.startDate,
          endDate: med.endDate,
// Remove duplicate medication property since it's already defined above
// Removed duplicate dosage property since it's already defined above
// frequency is already defined above, removing duplicate property
// duration is already defined above, removing duplicate property
// instructions is already defined above, removing duplicate property
        }));
      }
      
      return ret;
    }
  }
});

// Indexes
prescriptionSchema.index({ patientId: 1 });
prescriptionSchema.index({ dentistId: 1 });
prescriptionSchema.index({ clinicId: 1 });
prescriptionSchema.index({ status: 1 });
prescriptionSchema.index({ issuedDate: -1 });
prescriptionSchema.index({ expiryDate: 1 });

// Virtual for checking if prescription is expired
prescriptionSchema.virtual('isExpired').get(function() {
  return this.expiryDate && this.expiryDate < new Date();
});

// Virtual for checking if refills are available
prescriptionSchema.virtual('hasRefillsAvailable').get(function() {
  return this.refillsUsed < this.refillsAllowed;
});

// Instance method to add refill
prescriptionSchema.methods.addRefill = function() {
  if (this.refillsUsed < this.refillsAllowed) {
    this.refillsUsed += 1;
    return this.save();
  }
  throw new Error('No refills available');
};

// Static method to find by patient
prescriptionSchema.statics.findByPatient = function(patientId: string, options: any = {}) {
  const { status, limit = 10, skip = 0 } = options;
  const query: any = { patientId };
  
  if (status) {
    query.status = status;
  }
  
  return this.find(query)
    .populate('patientId', 'firstName lastName email phone')
    .populate('dentistId', 'firstName lastName specialization')
    .populate('clinicId', 'name address phone')
    .populate('medications.medicationId', 'name genericName category')
    .sort({ issuedDate: -1 })
    .limit(limit)
    .skip(skip);
};

// Static method to find active prescriptions
prescriptionSchema.statics.findActive = function(patientId?: string) {
  const query: any = { 
    status: 'active',
    $or: [
      { expiryDate: { $gte: new Date() } },
      { expiryDate: { $exists: false } }
    ]
  };
  
  if (patientId) {
    query.patientId = patientId;
  }
  
  return this.find(query)
    .populate('patientId', 'firstName lastName')
    .populate('dentistId', 'firstName lastName')
    .populate('medications.medicationId');
};

// Static method to find expiring prescriptions
prescriptionSchema.statics.findExpiring = function(days: number = 7) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  
  return this.find({
    status: 'active',
    expiryDate: {
      $gte: new Date(),
      $lte: futureDate
    }
  })
  .populate('patientId', 'firstName lastName email')
  .populate('dentistId', 'firstName lastName');
};

const Prescription = mongoose.model<IPrescription, IPrescriptionModel>('Prescription', prescriptionSchema);

export default Prescription;