# AppointmentForm Multi-Branch Integration Plan

## Overview
Integrate multi-branch clinic selection into the existing AppointmentForm.tsx without breaking current functionality.

---

## Current Structure Analysis

### Existing State Variables
```typescript
const [formData, setFormData] = useState({
  patientId: '',
  dentistId: '',
  service: '',
  date: new Date().toISOString().split('T')[0],
  timeSlot: '',
  notes: '',
  emergency: false,
  patientSearch: '',
  clinicId: FALLBACK_CLINIC_ID
});
```

### Existing Dependencies
- `useClinic()` hook for selectedClinic
- `appointmentService` for API calls
- `patientService` for patient lookup
- Hardcoded `FALLBACK_CLINIC_ID = '687468107e70478314c346be'`

---

## Integration Steps

### Step 1: Add Branch State ✅
**Priority:** HIGH  
**Risk:** LOW

**Changes:**
```typescript
// Add new state for branch selection
const [selectedBranch, setSelectedBranch] = useState<string>('');
const [branches, setBranches] = useState<string[]>([]);
const [clinics, setClinics] = useState<Clinic[]>([]);
const [filteredClinics, setFilteredClinics] = useState<Clinic[]>([]);
```

**Why:** Need to track which branch is selected to filter clinics

---

### Step 2: Load Branches on Mount ✅
**Priority:** HIGH  
**Risk:** LOW

**Changes:**
```typescript
useEffect(() => {
  const loadBranches = async () => {
    const response = await clinicService.getBranches();
    if (response.success && response.data) {
      setBranches(response.data);
      // Auto-select first branch if only one exists
      if (response.data.length === 1) {
        setSelectedBranch(response.data[0]);
      }
    }
  };
  loadBranches();
}, []);
```

**Why:** Need to populate branch dropdown

---

### Step 3: Load and Filter Clinics ✅
**Priority:** HIGH  
**Risk:** LOW

**Changes:**
```typescript
useEffect(() => {
  const loadClinics = async () => {
    const response = await clinicService.getAllClinics();
    if (response.success && response.data) {
      setClinics(response.data);
      
      // Filter by selected branch
      if (selectedBranch) {
        const filtered = response.data.filter(
          c => c.branchName === selectedBranch
        );
        setFilteredClinics(filtered);
        
        // Auto-select clinic if only one in branch
        if (filtered.length === 1) {
          setFormData(prev => ({
            ...prev,
            clinicId: filtered[0].id
          }));
        }
      } else {
        setFilteredClinics(response.data);
      }
    }
  };
  loadClinics();
}, [selectedBranch]);
```

**Why:** Filter clinics based on selected branch

---

### Step 4: Add Branch Selection UI ✅
**Priority:** HIGH  
**Risk:** MEDIUM

**Changes:** Add before service selection step
```tsx
{/* Branch Selection - New Step 0 */}
{!isPatientUser && (
  <div className="mb-6">
    <label className="block text-sm font-medium text-gray-700 mb-2">
      Select Branch
    </label>
    <Select
      value={selectedBranch}
      onChange={(e) => {
        setSelectedBranch(e.target.value);
        // Reset clinic selection when branch changes
        setFormData(prev => ({ ...prev, clinicId: '' }));
      }}
      options={branches.map(branch => ({
        value: branch,
        label: branch
      }))}
      placeholder="Choose a branch..."
    />
  </div>
)}
```

**Why:** Users need to select branch before clinic

---

### Step 5: Update Clinic Dropdown ✅
**Priority:** HIGH  
**Risk:** LOW

**Changes:**
```tsx
<Select
  value={formData.clinicId}
  onChange={(e) => setFormData(prev => ({ ...prev, clinicId: e.target.value }))}
  options={filteredClinics.map(clinic => ({
    value: clinic.id,
    label: `${clinic.name}${clinic.branchName ? ` - ${clinic.branchName}` : ''}`
  }))}
  placeholder="Select clinic..."
  disabled={!selectedBranch}
/>
```

**Why:** Show only clinics from selected branch

---

### Step 6: Integrate Doctor Availability (Phase 2) ⏳
**Priority:** MEDIUM  
**Risk:** MEDIUM

**Changes:**
```typescript
// Add doctor schedule state
const [availableDoctors, setAvailableDoctors] = useState<any[]>([]);

// Fetch available doctors when date and clinic change
useEffect(() => {
  if (formData.clinicId && formData.date) {
    const loadAvailableDoctors = async () => {
      const doctors = await doctorScheduleService.getAvailableDoctorsForDate(
        formData.clinicId,
        new Date(formData.date)
      );
      setAvailableDoctors(doctors);
    };
    loadAvailableDoctors();
  }
}, [formData.clinicId, formData.date]);
```

**Why:** Only show doctors who are available on selected date

---

### Step 7: Update Time Slot Generation (Phase 2) ⏳
**Priority:** MEDIUM  
**Risk:** HIGH

**Current Logic:**
- Uses hardcoded clinic hours
- Doesn't check doctor schedules

**New Logic:**
```typescript
const generateTimeSlots = (doctorSchedule: DoctorSchedule) => {
  return doctorScheduleService.generateTimeSlots(
    doctorSchedule.startTime,
    doctorSchedule.endTime,
    doctorSchedule.slotDuration
  );
};
```

**Why:** Generate slots based on actual doctor availability

---

### Step 8: Add Conflict Detection (Phase 2) ⏳
**Priority:** MEDIUM  
**Risk:** MEDIUM

**Changes:**
```typescript
const checkConflicts = async (doctorId: string, date: string, timeSlot: string) => {
  // Call existing appointment conflict check
  const response = await appointmentService.checkConflicts({
    doctorId,
    date,
    timeSlot,
    duration: selectedService.duration
  });
  
  return response.hasConflict;
};
```

**Why:** Prevent double-booking

---

## Implementation Sequence

### Phase 1: Basic Branch Selection (Today)
1. ✅ Add branch state variables
2. ✅ Load branches from API
3. ✅ Add branch selection UI
4. ✅ Filter clinics by branch
5. ✅ Update clinic dropdown
6. ✅ Test branch selection flow

**Estimated Time:** 2 hours  
**Risk Level:** LOW

### Phase 2: Doctor Availability (Next)
1. ⏳ Integrate doctorScheduleService
2. ⏳ Load available doctors for date
3. ⏳ Filter doctor dropdown
4. ⏳ Update time slot generation
5. ⏳ Test doctor filtering

**Estimated Time:** 3 hours  
**Risk Level:** MEDIUM

### Phase 3: Conflict Detection & Polish (Future)
1. ⏳ Add conflict checking
2. ⏳ Show availability indicators
3. ⏳ Add loading states
4. ⏳ Add error handling
5. ⏳ Add user feedback messages

**Estimated Time:** 2 hours  
**Risk Level:** MEDIUM

---

## Risk Mitigation

### Breaking Changes Prevention
- ✅ Keep existing FALLBACK_CLINIC_ID as default
- ✅ Make branch selection optional initially
- ✅ Preserve all existing form logic
- ✅ Add new features incrementally

### Testing Strategy
1. Test with branch selection ✅
2. Test without branch selection ✅
3. Test with single branch ✅
4. Test with multiple branches ✅
5. Test clinic filtering ✅
6. Test form submission ✅

### Rollback Plan
If issues occur:
1. Branch selection can be hidden with feature flag
2. Existing hardcoded clinic ID still works
3. Doctor selection still functional without filtering
4. Time slots still generate with default logic

---

## Code Changes Summary

### Files to Modify
1. `src/pages/appointment/AppointmentForm.tsx` - Main integration
2. `src/i18n/locales/en.json` - Translation keys (optional)
3. `src/i18n/locales/ar.json` - Translation keys (optional)

### Files Created (Already Done)
1. ✅ `src/services/doctorScheduleService.ts`
2. ✅ `src/services/clinicService.ts` (enhanced)
3. ✅ `src/types/clinic.ts` (updated)

### New Dependencies
- `doctorScheduleService` - For doctor availability
- `clinicService.getBranches()` - For branch list
- `clinicService.getClinicsByBranch()` - For filtering

---

## Translation Keys Needed

### English (en.json)
```json
{
  "appointmentForm": {
    "selectBranch": "Select Branch",
    "selectBranchPlaceholder": "Choose a clinic branch...",
    "noBranchesAvailable": "No branches available",
    "branchRequired": "Please select a branch",
    "noClinicsInBranch": "No clinics available in this branch",
    "doctorNotAvailable": "Doctor not available on selected date",
    "selectAvailableDoctor": "Select an available doctor"
  }
}
```

### Arabic (ar.json)
```json
{
  "appointmentForm": {
    "selectBranch": "اختر الفرع",
    "selectBranchPlaceholder": "اختر فرع العيادة...",
    "noBranchesAvailable": "لا توجد فروع متاحة",
    "branchRequired": "يرجى اختيار الفرع",
    "noClinicsInBranch": "لا توجد عيادات متاحة في هذا الفرع",
    "doctorNotAvailable": "الطبيب غير متاح في التاريخ المحدد",
    "selectAvailableDoctor": "اختر طبيباً متاحاً"
  }
}
```

---

## Success Criteria

### Phase 1 Complete When:
- ✅ Branch dropdown shows all branches
- ✅ Selecting branch filters clinics
- ✅ Clinic dropdown only shows branch clinics
- ✅ Form submission still works
- ✅ No console errors
- ✅ Existing functionality preserved

### Phase 2 Complete When:
- ⏳ Doctor dropdown shows only available doctors
- ⏳ Time slots generated from doctor schedule
- ⏳ Conflict detection prevents double-booking
- ⏳ User sees helpful error messages
- ⏳ Loading states provide feedback

---

## Next Immediate Action

**Start Phase 1 Implementation:**
1. Open `AppointmentForm.tsx`
2. Add branch state variables
3. Add branch loading useEffect
4. Add branch selection UI component
5. Update clinic filtering logic
6. Test in browser

**Estimated Time to Phase 1 Complete:** 2 hours

---

**Status:** Ready to implement  
**Last Updated:** October 3, 2025

