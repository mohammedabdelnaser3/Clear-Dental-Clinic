# Prescription Creation Process - Complete Guide

## Date: October 2, 2025

## Overview

This document explains the complete end-to-end process of creating a prescription in the Smart Clinic application, from the user interface through to the database.

---

## Table of Contents

1. [User Workflow](#user-workflow)
2. [Technical Architecture](#technical-architecture)
3. [Step-by-Step Process](#step-by-step-process)
4. [Data Flow](#data-flow)
5. [Component Breakdown](#component-breakdown)
6. [API Integration](#api-integration)
7. [Database Storage](#database-storage)
8. [Validation & Error Handling](#validation--error-handling)

---

## User Workflow

### Entry Points

There are **two ways** to create a prescription:

#### Option 1: From Appointment Details Page
```
User Flow:
1. Navigate to Appointments → Click on an appointment
2. View appointment details
3. Click "Create Prescription" button
4. Form opens pre-filled with:
   ✓ Patient (from appointment)
   ✓ Appointment (linked automatically)
5. Fill in remaining fields
6. Submit
```

#### Option 2: From Prescriptions Page
```
User Flow:
1. Navigate to Prescriptions
2. Click "New Prescription" button
3. Form opens empty
4. Select patient from dropdown
5. Optionally select related appointment
6. Fill in all fields
7. Submit
```

---

## Technical Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────┐         ┌──────────────────┐             │
│  │ AppointmentDetail│────────▶│ PrescriptionForm │             │
│  │     Page         │         │    Component     │             │
│  └──────────────────┘         └──────────────────┘             │
│                                        │                         │
│                                        │                         │
│  ┌──────────────────┐                 │                         │
│  │  Prescriptions   │────────────────▶│                         │
│  │     Page         │                 │                         │
│  └──────────────────┘                 │                         │
│                                        │                         │
├────────────────────────────────────────┼─────────────────────────┤
│                    FRONTEND SERVICES   │                         │
├────────────────────────────────────────┼─────────────────────────┤
│                                        │                         │
│                                        ▼                         │
│                          ┌──────────────────────┐               │
│                          │ prescriptionService  │               │
│                          │    (API Client)      │               │
│                          └──────────────────────┘               │
│                                        │                         │
│                                        │ HTTP POST               │
│                                        │                         │
├────────────────────────────────────────┼─────────────────────────┤
│                      BACKEND API       │                         │
├────────────────────────────────────────┼─────────────────────────┤
│                                        │                         │
│                                        ▼                         │
│                    ┌─────────────────────────┐                  │
│                    │  /api/v1/prescriptions  │                  │
│                    │       (POST Route)      │                  │
│                    └─────────────────────────┘                  │
│                                        │                         │
│                                        ▼                         │
│                    ┌─────────────────────────┐                  │
│                    │  Validation Middleware  │                  │
│                    │   (express-validator)   │                  │
│                    └─────────────────────────┘                  │
│                                        │                         │
│                                        ▼                         │
│                    ┌─────────────────────────┐                  │
│                    │ Authorization Middleware│                  │
│                    │   (dentist role check)  │                  │
│                    └─────────────────────────┘                  │
│                                        │                         │
│                                        ▼                         │
│                    ┌─────────────────────────┐                  │
│                    │ createPrescription      │                  │
│                    │     Controller          │                  │
│                    └─────────────────────────┘                  │
│                                        │                         │
├────────────────────────────────────────┼─────────────────────────┤
│                     DATABASE           │                         │
├────────────────────────────────────────┼─────────────────────────┤
│                                        │                         │
│                                        ▼                         │
│                          ┌──────────────────────┐               │
│                          │  MongoDB (Mongoose)  │               │
│                          │  Prescription Model  │               │
│                          └──────────────────────┘               │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

---

## Step-by-Step Process

### Phase 1: Form Initialization

#### Step 1.1: User Opens Form
```typescript
// From AppointmentDetail.tsx
const handleCreatePrescription = useCallback(() => {
  setShowPrescriptionModal(true);
}, []);

// Modal renders with PrescriptionForm
<Modal isOpen={showPrescriptionModal} onClose={...}>
  <PrescriptionForm
    patientId={appointment.patientId._id}
    appointmentId={appointment._id}
    onSave={handlePrescriptionSaved}
    onCancel={handlePrescriptionCancel}
  />
</Modal>
```

#### Step 1.2: Form Component Initializes
```typescript
// PrescriptionForm.tsx
const PrescriptionForm: React.FC<PrescriptionFormProps> = ({
  prescription,
  patientId,        // Pre-filled from appointment
  appointmentId,    // Pre-filled from appointment
  onSave,
  onCancel
}) => {
  // Initialize React Hook Form
  const { register, control, handleSubmit, ... } = useForm({
    resolver: zodResolver(prescriptionSchema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: {
      patient: patientId || '',
      appointment: '',
      medications: [{
        medication: '',
        medicationName: '',
        dosage: '',
        frequency: '',
        duration: '',
        instructions: ''
      }],
      diagnosis: '',
      notes: '',
      expiryDate: '',
      maxRefills: 3
    }
  });
  
  // ... rest of component
};
```

#### Step 1.3: Data Fetching
```typescript
// Fetch patient data
useEffect(() => {
  const fetchPatients = async () => {
    try {
      const response = await patientService.getPatients({ limit: 100 });
      setPatients(response.data);
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  };
  
  if (!patientId) {
    fetchPatients(); // Only if patient not pre-filled
  }
}, [patientId]);

// Fetch appointments for selected patient
useEffect(() => {
  const fetchAppointments = async () => {
    if (!selectedPatient) return;
    
    try {
      const response = await appointmentService.getAppointments({
        patientId: selectedPatient,
        status: 'completed',
        limit: 50
      });
      setAppointments(response);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    }
  };
  
  fetchAppointments();
}, [selectedPatient]);

// Set default expiry date (30 days from now)
useEffect(() => {
  if (!prescription) {
    const defaultExpiryDate = new Date();
    defaultExpiryDate.setDate(defaultExpiryDate.getDate() + 30);
    setValue('expiryDate', defaultExpiryDate.toISOString().split('T')[0]);
  }
}, [prescription, setValue]);

// Pre-fill appointment if provided
useEffect(() => {
  if (appointmentId && !prescription) {
    setValue('appointment', appointmentId);
  }
}, [appointmentId, prescription, setValue]);
```

---

### Phase 2: User Fills Form

#### Step 2.1: Patient Selection (if not pre-filled)
```typescript
// User selects patient from dropdown
<Select
  {...register('patient', {
    onChange: () => {
      if (isSubmitted) {
        clearErrors('patient');
      }
    }
  })}
  options={patientOptions}
  error={isSubmitted ? errors.patient?.message : undefined}
/>

// patientOptions format:
[
  { 
    value: "673abc123...", 
    label: "John Doe (john@email.com)" 
  },
  // ... more patients
]
```

#### Step 2.2: Appointment Selection (optional)
```typescript
// User can link to specific appointment
<Select
  {...register('appointment')}
  options={appointmentOptions}
  error={errors.appointment?.message}
/>

// appointmentOptions format:
[
  { value: '', label: 'No specific appointment' },
  { 
    value: "673def456...", 
    label: "Oct 15, 2025 - Routine Checkup" 
  },
  // ... more appointments
]
```

#### Step 2.3: Diagnosis Entry
```typescript
// User enters diagnosis
<Textarea
  {...register('diagnosis')}
  placeholder="Enter the diagnosis for this prescription"
  rows={3}
  error={errors.diagnosis?.message}
/>

// Example: "Periodontal infection requiring antibiotic treatment"
```

#### Step 2.4: Medication Selection

##### Opening Medication Modal
```typescript
// User clicks "Select Medication" button
const handleSelectMedicationFromList = (index: number) => {
  setSelectedMedicationIndex(index);
  setIsMedicationModalOpen(true);
};

<Button onClick={() => handleSelectMedicationFromList(0)}>
  <Search className="h-4 w-4" />
  Select Medication
</Button>
```

##### Selecting Medication
```typescript
// MedicationList component renders all available medications
<Modal isOpen={isMedicationModalOpen} ...>
  <MedicationList
    onSelectMedication={handleSelectMedication}
    selectionMode={true}
  />
</Modal>

// User clicks on a medication
const handleSelectMedication = (medication: any) => {
  if (selectedMedicationIndex !== null) {
    console.log('Selected medication:', medication);
    
    // Update ALL medication fields using setValue
    setValue(`medications.${selectedMedicationIndex}.medication`, 
      medication._id, 
      { shouldValidate: true, shouldDirty: true, shouldTouch: true }
    );
    setValue(`medications.${selectedMedicationIndex}.medicationName`, 
      medication.name,
      { shouldValidate: true, shouldDirty: true }
    );
    setValue(`medications.${selectedMedicationIndex}.dosage`, 
      medication.dosage || '',
      { shouldValidate: true }
    );
    setValue(`medications.${selectedMedicationIndex}.frequency`, 
      medication.frequency || '',
      { shouldValidate: true }
    );
    setValue(`medications.${selectedMedicationIndex}.duration`, 
      medication.duration || '',
      { shouldValidate: true }
    );
    setValue(`medications.${selectedMedicationIndex}.instructions`, 
      medication.instructions || '',
      { shouldValidate: true }
    );
    
    // Clear validation error
    clearErrors(`medications.${selectedMedicationIndex}.medication`);
    
    console.log('Medication field updated with ID:', medication._id);
  }
  
  setIsMedicationModalOpen(false);
  setSelectedMedicationIndex(null);
};
```

##### Adding More Medications
```typescript
// User can add multiple medications
const handleAddMedication = () => {
  appendMedication({
    medication: '',
    medicationName: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: ''
  });
};

<Button onClick={handleAddMedication}>
  <Plus className="h-4 w-4" />
  Add Medication
</Button>
```

#### Step 2.5: Expiry Date & Refills
```typescript
// Expiry Date (default: 30 days from now)
<Input
  type="date"
  {...register('expiryDate')}
  error={errors.expiryDate?.message}
/>

// Maximum Refills (default: 3)
<Input
  type="number"
  min="0"
  max="10"
  {...register('maxRefills', { valueAsNumber: true })}
  error={errors.maxRefills?.message}
/>
```

#### Step 2.6: Additional Notes (optional)
```typescript
<Textarea
  {...register('notes')}
  placeholder="Any additional notes or special instructions"
  rows={3}
  error={errors.notes?.message}
/>
```

---

### Phase 3: Form Submission

#### Step 3.1: Client-Side Validation
```typescript
// Zod schema validation
const prescriptionSchema = z.object({
  patient: z.string().min(1, "Patient is required"),
  appointment: z.string().optional(),
  medications: z.array(z.object({
    medication: z.string().min(1, "Medication is required"),
    medicationName: z.string().optional(),
    dosage: z.string().min(1, "Dosage is required"),
    frequency: z.string().min(1, "Frequency is required"),
    duration: z.string().min(1, "Duration is required"),
    instructions: z.string().optional()
  })).min(1, "At least one medication is required"),
  diagnosis: z.string().min(1, "Diagnosis is required"),
  notes: z.string().optional(),
  expiryDate: z.string().min(1, "Expiry date is required"),
  maxRefills: z.number().min(0).max(10)
});

// Validation happens on submit
<form onSubmit={handleSubmit(onSubmit)}>
  {/* form fields */}
</form>
```

#### Step 3.2: Data Transformation
```typescript
const onSubmit = async (data: PrescriptionFormData) => {
  try {
    setLoading(true);
    
    // Log form data for debugging
    console.log('Form data before processing:', data);
    
    // Get clinic ID from user data
    const userDataStr = localStorage.getItem('user');
    const userData = userDataStr ? JSON.parse(userDataStr) : null;
    const clinicId = userData?.clinic || userData?.clinicId;

    if (!clinicId) {
      toast.error('Clinic information is missing. Please contact support.');
      setLoading(false);
      return;
    }
    
    // Transform data to match backend API expectations
    const prescriptionData = {
      patientId: data.patient,                    // Renamed
      clinicId: clinicId,                         // Added from user
      appointmentId: data.appointment || undefined,
      medications: data.medications.map(med => ({
        medicationId: med.medication,             // Renamed
        dosage: med.dosage,
        frequency: med.frequency,
        duration: med.duration,
        instructions: med.instructions || undefined,
        startDate: new Date().toISOString(),     // Added (current date)
        endDate: undefined                        // Added (optional)
      })),
      diagnosis: data.diagnosis,
      notes: data.notes || undefined,
      expiryDate: data.expiryDate,
      refillsAllowed: data.maxRefills             // Renamed
    };

    console.log('Prescription data to send:', prescriptionData);
    
    // ... API call
  } catch (error) {
    // ... error handling
  }
};
```

**Data Transformation Summary:**
```javascript
// Frontend Form Data
{
  patient: "673abc...",           → patientId: "673abc..."
  appointment: "673def...",       → appointmentId: "673def..."
  medications: [{
    medication: "673ghi...",      → medicationId: "673ghi..."
    medicationName: "Clindamycin", (removed - not sent to backend)
    dosage: "300mg",              → dosage: "300mg"
    frequency: "4 times daily",   → frequency: "4 times daily"
    duration: "7-10 days",        → duration: "7-10 days"
    instructions: "Take with..."  → instructions: "Take with..."
                                  + startDate: "2025-10-02T..."
                                  + endDate: undefined
  }],
                                  + clinicId: "673jkl..." (from user)
  diagnosis: "Infection",         → diagnosis: "Infection"
  notes: "Follow up...",          → notes: "Follow up..."
  expiryDate: "2025-11-01",       → expiryDate: "2025-11-01"
  maxRefills: 3                   → refillsAllowed: 3
}
```

#### Step 3.3: API Request
```typescript
// Call prescriptionService
if (prescription) {
  console.log('Updating prescription:', prescription._id);
  await prescriptionService.updatePrescription(prescription._id, prescriptionData);
  toast.success('Prescription updated successfully');
} else {
  console.log('Creating new prescription');
  await prescriptionService.createPrescription(prescriptionData);
  toast.success('Prescription created successfully');
}

onSave(); // Callback to parent component
```

---

### Phase 4: Backend Processing

#### Step 4.1: Route Handling
```typescript
// backend/src/routes/prescriptions.ts
router.post('/',
  [
    // Validation middleware
    body('patientId').isMongoId().withMessage('Valid patient ID is required'),
    body('clinicId').isMongoId().withMessage('Valid clinic ID is required'),
    body('appointmentId').optional().isMongoId().withMessage('Invalid appointment ID'),
    body('medications').isArray({ min: 1 }).withMessage('At least one medication is required'),
    body('medications.*.medicationId').isMongoId().withMessage('Valid medication ID is required'),
    body('medications.*.dosage').notEmpty().withMessage('Medication dosage is required'),
    body('medications.*.frequency').notEmpty().withMessage('Medication frequency is required'),
    body('medications.*.duration').notEmpty().withMessage('Medication duration is required'),
    body('medications.*.instructions').optional().isString(),
    body('medications.*.startDate').isISO8601().withMessage('Valid start date is required'),
    body('medications.*.endDate').optional().isISO8601(),
    body('diagnosis').notEmpty().withMessage('Diagnosis is required'),
    body('notes').optional().isString(),
    body('status').optional().isIn(['active', 'completed', 'cancelled', 'expired']),
    body('expiryDate').optional().isISO8601(),
    body('refillsAllowed').optional().isInt({ min: 0 }),
    body('refillsUsed').optional().isInt({ min: 0 })
  ],
  handleValidationErrors,  // Check for validation errors
  authorize('dentist'),    // Check user is authorized
  createPrescription       // Controller function
);
```

#### Step 4.2: Controller Processing
```typescript
// backend/src/controllers/prescriptionController.ts
export const createPrescription = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  // 1. Verify patient exists
  const patient = await Patient.findById(req.body.patientId);
  if (!patient) {
    return next(new AppError('Patient not found', 404));
  }
  
  // 2. Verify medications exist
  for (const med of req.body.medications) {
    const medication = await Medication.findById(med.medicationId);
    if (!medication) {
      return next(new AppError(`Medication with ID ${med.medicationId} not found`, 404));
    }
  }
  
  // 3. Add dentist ID from authenticated user
  const prescriptionData = {
    ...req.body,
    dentistId: req.user._id,
    issuedDate: new Date()
  };
  
  // 4. Create prescription in database
  const prescription = await Prescription.create(prescriptionData);
  
  // 5. Populate related data for response
  const populatedPrescription = await Prescription.findById(prescription._id)
    .populate('patientId', 'firstName lastName email')
    .populate('dentistId', 'firstName lastName')
    .populate('clinicId', 'name')
    .populate('medications.medicationId', 'name genericName');
  
  // 6. Return success response
  return res.status(201).json({
    success: true,
    data: populatedPrescription,
    message: 'Prescription created successfully'
  });
});
```

---

### Phase 5: Database Storage

#### Step 5.1: Mongoose Schema
```typescript
// backend/src/models/Prescription.ts
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
  timestamps: true // Adds createdAt and updatedAt
});
```

#### Step 5.2: Document in MongoDB
```javascript
// Final document stored in MongoDB
{
  _id: ObjectId("673abc123def456"),
  patientId: ObjectId("673def456abc789"),
  dentistId: ObjectId("673ghi789jkl012"),
  clinicId: ObjectId("673jkl012mno345"),
  appointmentId: ObjectId("673mno345pqr678"),
  medications: [
    {
      medicationId: ObjectId("673pqr678stu901"),
      dosage: "300mg",
      frequency: "4 times daily",
      duration: "7-10 days",
      instructions: "Take with full glass of water",
      startDate: ISODate("2025-10-02T10:30:00.000Z"),
      endDate: null
    }
  ],
  diagnosis: "Periodontal infection requiring antibiotic treatment",
  notes: "Patient advised to complete full course",
  status: "active",
  issuedDate: ISODate("2025-10-02T10:30:00.000Z"),
  expiryDate: ISODate("2025-11-01T00:00:00.000Z"),
  refillsAllowed: 3,
  refillsUsed: 0,
  createdAt: ISODate("2025-10-02T10:30:00.000Z"),
  updatedAt: ISODate("2025-10-02T10:30:00.000Z")
}
```

---

### Phase 6: Response & UI Update

#### Step 6.1: Backend Response
```json
{
  "success": true,
  "data": {
    "id": "673abc123def456",
    "patient": {
      "_id": "673def456abc789",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@email.com"
    },
    "dentist": {
      "_id": "673ghi789jkl012",
      "firstName": "Dr. Smith",
      "lastName": "Johnson"
    },
    "clinic": {
      "_id": "673jkl012mno345",
      "name": "Smart Dental Clinic"
    },
    "appointment": {
      "_id": "673mno345pqr678",
      "date": "2025-10-02"
    },
    "medications": [
      {
        "medication": {
          "_id": "673pqr678stu901",
          "name": "Clindamycin",
          "genericName": "Clindamycin HCl"
        },
        "dosage": "300mg",
        "frequency": "4 times daily",
        "duration": "7-10 days",
        "instructions": "Take with full glass of water"
      }
    ],
    "diagnosis": "Periodontal infection requiring antibiotic treatment",
    "notes": "Patient advised to complete full course",
    "maxRefills": 3,
    "refills": [],
    "createdAt": "2025-10-02T10:30:00.000Z",
    "updatedAt": "2025-10-02T10:30:00.000Z"
  },
  "message": "Prescription created successfully"
}
```

#### Step 6.2: Frontend Success Handling
```typescript
// Success toast notification
toast.success(t('prescriptionForm.successCreate'));
// → "Prescription created successfully"

// Close modal
onSave();

// Parent component refreshes data
const handlePrescriptionSaved = useCallback(() => {
  setShowPrescriptionModal(false);
  toast.success(t('appointmentDetail.prescriptionCreated'));
  // Could refresh appointment details to show new prescription
}, [t]);
```

---

## Complete Data Flow Diagram

```
┌───────────────────────────────────────────────────────────────────┐
│                    PRESCRIPTION CREATION FLOW                     │
└───────────────────────────────────────────────────────────────────┘

1. USER INTERACTION
   ┌─────────────┐
   │   User      │
   │  clicks     │──┐
   │  "Create    │  │
   │Prescription"│  │
   └─────────────┘  │
                    ▼
   ┌───────────────────────────────┐
   │  PrescriptionForm opens       │
   │  - Pre-filled patient         │
   │  - Pre-filled appointment     │
   │  - Default expiry date set    │
   └───────────────────────────────┘

2. DATA ENTRY
   ┌───────────────────────────────┐
   │  User fills form:             │
   │  ✓ Patient: John Doe          │
   │  ✓ Diagnosis: Infection       │
   │  ✓ Click "Select Medication"  │
   └───────────────────────────────┘
                    │
                    ▼
   ┌───────────────────────────────┐
   │  MedicationList Modal         │
   │  - Shows all medications      │
   │  - User selects Clindamycin   │
   └───────────────────────────────┘
                    │
                    ▼
   ┌───────────────────────────────┐
   │  handleSelectMedication()     │
   │  - setValue() called 6 times  │
   │  - medication ID stored       │
   │  - dosage, frequency filled   │
   │  - validation cleared         │
   │  Console: "Medication field   │
   │            updated with ID"   │
   └───────────────────────────────┘
                    │
                    ▼
   ┌───────────────────────────────┐
   │  User completes form:         │
   │  ✓ Expiry date: 30 days       │
   │  ✓ Max refills: 3             │
   │  ✓ Notes: (optional)          │
   │  ✓ Clicks "Create"            │
   └───────────────────────────────┘

3. VALIDATION
   ┌───────────────────────────────┐
   │  React Hook Form + Zod        │
   │  ✓ Patient: ✓ present         │
   │  ✓ Medication: ✓ has ID       │
   │  ✓ Dosage: ✓ filled           │
   │  ✓ Frequency: ✓ filled        │
   │  ✓ Duration: ✓ filled         │
   │  ✓ Diagnosis: ✓ filled        │
   │  ✓ Expiry: ✓ filled           │
   └───────────────────────────────┘
                    │
                    ▼
   ┌───────────────────────────────┐
   │  Data transformation:         │
   │  patient → patientId          │
   │  medication → medicationId    │
   │  + clinicId (from user)       │
   │  + dentistId (by backend)     │
   │  + startDate (current)        │
   │  + issuedDate (by backend)    │
   │  Console: "Prescription data  │
   │            to send"           │
   └───────────────────────────────┘

4. API REQUEST
   ┌───────────────────────────────┐
   │  POST /api/v1/prescriptions   │
   │  Headers:                     │
   │    Authorization: Bearer ...  │
   │  Body:                        │
   │    patientId: "673abc..."     │
   │    clinicId: "673def..."      │
   │    medications: [{...}]       │
   │    diagnosis: "..."           │
   │    ...                        │
   └───────────────────────────────┘
                    │
                    ▼
   ┌───────────────────────────────┐
   │  BACKEND VALIDATION           │
   │  ✓ JWT token valid            │
   │  ✓ User is dentist            │
   │  ✓ Patient exists             │
   │  ✓ Medications exist          │
   │  ✓ All required fields        │
   └───────────────────────────────┘
                    │
                    ▼
   ┌───────────────────────────────┐
   │  createPrescription()         │
   │  - Add dentistId from token   │
   │  - Add issuedDate = now       │
   │  - Prescription.create()      │
   │  - Populate relationships     │
   └───────────────────────────────┘

5. DATABASE
   ┌───────────────────────────────┐
   │  MongoDB Insert               │
   │  Collection: prescriptions    │
   │  Document created with:       │
   │  - All prescription data      │
   │  - ObjectId references        │
   │  - Timestamps                 │
   └───────────────────────────────┘

6. RESPONSE
   ┌───────────────────────────────┐
   │  201 Created                  │
   │  {                            │
   │    success: true,             │
   │    data: {                    │
   │      id: "673abc...",         │
   │      patient: {...},          │
   │      medications: [{...}],    │
   │      ...                      │
   │    },                         │
   │    message: "Success"         │
   │  }                            │
   └───────────────────────────────┘
                    │
                    ▼
   ┌───────────────────────────────┐
   │  FRONTEND UPDATES             │
   │  ✓ Close modal                │
   │  ✓ Show success toast         │
   │  ✓ Refresh parent view        │
   │  Console: "Creating new       │
   │            prescription"      │
   └───────────────────────────────┘
                    │
                    ▼
   ┌───────────────────────────────┐
   │  USER SEES                    │
   │  ✓ "Prescription created      │
   │     successfully" message     │
   │  ✓ Back to appointment view   │
   │  ✓ Can see new prescription   │
   └───────────────────────────────┘
```

---

## Key Components

### 1. PrescriptionForm Component
**Location:** `src/components/prescriptions/PrescriptionForm.tsx`

**Responsibilities:**
- Render form UI
- Handle user input
- Validate data (Zod schema)
- Manage medication selection
- Transform data for API
- Submit to backend

**Key Functions:**
- `handleSelectMedication()` - Handles medication selection from modal
- `handleAddMedication()` - Adds new medication row
- `onSubmit()` - Processes and submits form data

### 2. MedicationList Component
**Location:** `src/components/medications/MedicationList.tsx`

**Responsibilities:**
- Display available medications
- Allow searching/filtering
- Handle medication selection
- Return selected medication to parent

**Selection Mode:**
```typescript
<MedicationList
  onSelectMedication={handleSelectMedication}
  selectionMode={true}
/>
```

### 3. Prescription Service
**Location:** `src/services/prescriptionService.ts`

**Responsibilities:**
- API communication
- HTTP request handling
- Error handling
- TypeScript interfaces

**Key Method:**
```typescript
async createPrescription(data: CreatePrescriptionData) {
  const response = await api.post('/api/v1/prescriptions', data);
  return response;
}
```

### 4. Backend Controller
**Location:** `backend/src/controllers/prescriptionController.ts`

**Responsibilities:**
- Validate request data
- Check authorization
- Verify related entities exist
- Create database record
- Return response

### 5. Mongoose Model
**Location:** `backend/src/models/Prescription.ts`

**Responsibilities:**
- Define schema
- Data validation
- Default values
- Relationships (refs)
- Timestamps

---

## Validation & Error Handling

### Frontend Validation (Zod)
```typescript
// Real-time validation as user types (after first submit)
{
  patient: z.string().min(1, "Patient is required"),
  medications: z.array(...).min(1, "At least one medication required"),
  diagnosis: z.string().min(1, "Diagnosis is required"),
  expiryDate: z.string().min(1, "Expiry date is required"),
  // ... more validations
}
```

### Backend Validation (express-validator)
```typescript
// Validation middleware before controller
[
  body('patientId').isMongoId(),
  body('medications').isArray({ min: 1 }),
  body('medications.*.medicationId').isMongoId(),
  body('medications.*.dosage').notEmpty(),
  // ... more validations
]
```

### Error Scenarios

#### 1. Missing Required Field
```typescript
// User submits without diagnosis
→ Zod validation fails
→ Error message shows: "Diagnosis is required"
→ Form not submitted
```

#### 2. Invalid Medication ID
```typescript
// Medication not found in database
→ Backend returns 404
→ Frontend shows: "Medication with ID ... not found"
→ User can try again
```

#### 3. Unauthorized Access
```typescript
// User is not a dentist
→ authorize('dentist') middleware blocks
→ Returns 403 Forbidden
→ Frontend shows: "You don't have permission"
```

#### 4. Network Error
```typescript
// Server unreachable
→ Axios catches error
→ Shows: "Failed to save prescription"
→ Console logs full error for debugging
```

---

## Summary

### Complete Flow in One Sentence
User opens form → fills patient/diagnosis/medication → validates locally → sends to API → backend validates → creates in MongoDB → returns success → UI updates.

### Time Estimates
- **Form filling:** 2-3 minutes (user time)
- **API request:** 200-500ms
- **Database write:** 50-100ms
- **Total process:** <1 second after submit

### Success Criteria
✅ Prescription created in database  
✅ All relationships properly linked  
✅ User sees success message  
✅ Form closes  
✅ Data appears in prescription list  

---

## Troubleshooting

### Common Issues

#### Issue: "Medication is required" even after selection
**Cause:** Hidden medication ID field not updated  
**Solution:** Use `setValue()` with proper options (fixed in latest version)

#### Issue: "Clinic information is missing"
**Cause:** User object in localStorage doesn't have clinic  
**Solution:** Ensure user login populates clinic data

#### Issue: "Patient not found"
**Cause:** Invalid patient ID or patient deleted  
**Solution:** Verify patient exists before form submission

---

## Related Documentation

- [Prescription Form Fixes](./PRESCRIPTION_FORM_FIXES.md)
- [Medication Selection Fix](./MEDICATION_SELECTION_FIX.md)
- [Prescription Form Validation Fix](./PRESCRIPTION_FORM_VALIDATION_FIX.md)
- [API Documentation](./API_DOCUMENTATION.md)

---

**Last Updated:** October 2, 2025

