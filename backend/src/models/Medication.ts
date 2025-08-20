import mongoose, { Schema } from 'mongoose';
import { IMedication, IMedicationModel } from '../types';

const medicationSchema = new Schema<IMedication>({
  name: {
    type: String,
    required: [true, 'Medication name is required'],
    trim: true,
    maxlength: [200, 'Medication name cannot exceed 200 characters']
  },
  genericName: {
    type: String,
    trim: true,
    maxlength: [200, 'Generic name cannot exceed 200 characters']
  },
  dosage: {
    type: String,
    required: [true, 'Dosage is required'],
    trim: true,
    maxlength: [100, 'Dosage cannot exceed 100 characters']
  },
  frequency: {
    type: String,
    required: [true, 'Frequency is required'],
    trim: true,
    maxlength: [100, 'Frequency cannot exceed 100 characters']
  },
  duration: {
    type: String,
    required: [true, 'Duration is required'],
    trim: true,
    maxlength: [100, 'Duration cannot exceed 100 characters']
  },
  instructions: {
    type: String,
    trim: true,
    maxlength: [1000, 'Instructions cannot exceed 1000 characters']
  },
  sideEffects: [{
    type: String,
    trim: true,
    maxlength: [200, 'Side effect description cannot exceed 200 characters']
  }],
  contraindications: [{
    type: String,
    trim: true,
    maxlength: [200, 'Contraindication cannot exceed 200 characters']
  }],
  category: {
    type: String,
    enum: ['antibiotic', 'painkiller', 'anti-inflammatory', 'anesthetic', 'antiseptic', 'other'],
    default: 'other'
  },
  isActive: {
    type: Boolean,
    default: true
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
medicationSchema.index({ name: 1 });
medicationSchema.index({ genericName: 1 });
medicationSchema.index({ category: 1 });
medicationSchema.index({ isActive: 1 });

// Static method to search medications
medicationSchema.statics.searchMedications = function(searchTerm: string) {
  const searchRegex = new RegExp(searchTerm, 'i');
  return this.find({
    isActive: true,
    $or: [
      { name: searchRegex },
      { genericName: searchRegex },
      { category: searchRegex }
    ]
  });
};

// Static method to find by category
medicationSchema.statics.findByCategory = function(category: string) {
  return this.find({ category, isActive: true });
};

const Medication = mongoose.model<IMedication, IMedicationModel>('Medication', medicationSchema);

export default Medication;