# Multi-Branch System - Testing Guide

**Date:** October 3, 2025  
**Status:** Ready for Testing

---

## 🚀 Quick Start

### Prerequisites
- ✅ Backend running on port 3001
- ✅ MongoDB Atlas connected and seeded
- ⏳ Frontend dev server starting

### Starting the Application

1. **Backend** (Already running ✅)
   - Port: 3001
   - MongoDB: Connected to Atlas
   - Data: 3 branches, 4 doctors, 25 schedules

2. **Frontend** (Starting now)
   ```bash
   npm run dev
   ```
   - Should open automatically in browser
   - Default URL: http://localhost:5175 or http://localhost:5173

---

## 🧪 Test Scenarios

### Test 1: Branch Selection UI ⭐ (PRIORITY)

**Steps:**
1. Open browser to `http://localhost:5175`
2. Click on "Appointments" or "Book Appointment"
3. Navigate to the service selection step

**Expected Results:**
- ✅ You should see a **branch selection dropdown** with gradient blue background
- ✅ Dropdown should show: Atesa, Fayoum, Minya (alphabetical order)
- ✅ MapPin icon visible next to "Select Clinic Branch" label
- ✅ Placeholder text: "Choose a branch..."

**What to Test:**
1. **Select Fayoum Branch**
   - Click dropdown and select "Fayoum"
   - Expected: "✓ 1 clinic available in Fayoum" message appears
   - Clinic should auto-select (only one clinic in Fayoum)

2. **Change to Atesa Branch**
   - Select "Atesa" from dropdown
   - Expected: Clinic selection resets
   - Expected: "✓ 1 clinic available in Atesa" message appears
   - Clinic should auto-select

3. **Change to Minya Branch**
   - Select "Minya" from dropdown
   - Expected: Same behavior as above

**Screenshots to Take:**
- [ ] Branch dropdown closed
- [ ] Branch dropdown open showing all branches
- [ ] Fayoum selected with feedback message
- [ ] Full appointment form with branch selected

---

### Test 2: Form Flow with Branch Selection

**Steps:**
1. Start new appointment
2. If you're not logged in as patient, select a patient
3. **Select Fayoum branch**
4. Select a service (e.g., "Consultation")
5. Select a date
6. Proceed through the form

**Expected Results:**
- ✅ Branch selection persists through steps
- ✅ Form doesn't lose branch data
- ✅ Can complete full booking flow
- ✅ No console errors

---

### Test 3: Edge Cases

**Test 3a: No Branch Selected**
1. Leave branch dropdown empty
2. Try to proceed
3. Expected: Should still work (shows all clinics)

**Test 3b: Single Branch Auto-Selection**
- If you only had one branch, it should auto-select
- Currently have 3 branches, so this won't trigger

**Test 3c: Branch with No Clinics**
- Not applicable (all our branches have clinics)
- But if tested, should show: "⚠️ No clinics available in this branch"

---

### Test 4: Responsive Design

**Desktop (1920x1080)**
- Branch selection box should be full width
- Text clearly readable
- Proper spacing

**Tablet (768px)**
- Branch selection responsive
- No overflow issues
- Touch-friendly dropdown

**Mobile (375px)**
- Branch selection works on mobile
- Dropdown easy to tap
- Feedback messages readable

---

## 🐛 Known Issues to Check

### Potential Issues
1. **Branch dropdown not showing**
   - Check if `branches.length > 1` condition is met
   - Check console for API errors loading branches

2. **Clinic not filtering**
   - Check if `selectedBranch` state is updating
   - Check console for filtering logic

3. **Form data not persisting**
   - Check if clinicId is being set correctly
   - Check sessionStorage for saved data

---

## 📊 Console Debugging

Open browser DevTools (F12) and check:

### Expected Console Logs
```
Loading branches...
Branches loaded: ["Atesa", "Fayoum", "Minya"]
Selected branch: Fayoum
Loading clinics...
Filtered clinics: 1
```

### Network Requests to Monitor
1. `GET /api/v1/clinics/public` - Should return 3 clinics with branchName
2. Branch filtering happens client-side (no API call)

---

## ✅ Success Criteria

### Phase 1 UI Testing Complete When:
- [ ] Branch dropdown visible and functional
- [ ] All 3 branches appear in dropdown
- [ ] Selecting branch filters clinics correctly
- [ ] Feedback message shows clinic count
- [ ] Auto-selection works for single clinic
- [ ] Form submission works with branch selected
- [ ] No console errors
- [ ] Responsive on all screen sizes

---

## 🎨 Visual Verification

### Branch Selection Component Should Look Like:

```
┌─────────────────────────────────────────────────┐
│  🗺️  Select Clinic Branch                       │
│                                                  │
│  ┌──────────────────────────────────────────┐  │
│  │ Fayoum                            ▼      │  │
│  └──────────────────────────────────────────┘  │
│                                                  │
│  ✓ 1 clinic available in Fayoum                │
└─────────────────────────────────────────────────┘
```

**Colors:**
- Background: Light blue gradient (`from-blue-50 to-indigo-50`)
- Border: Blue (`border-blue-200`)
- Dropdown: White background with gray border
- Text: Dark gray/black for labels
- Feedback: Green checkmark with gray text

---

## 🔍 Data Verification

### What the API Should Return

**GET /api/v1/clinics/public**
```json
{
  "success": true,
  "data": [
    {
      "name": "Clear",
      "branchName": "Fayoum",
      "address": { "city": "Fayoum", ... },
      "operatingHours": [...]
    },
    {
      "name": "Clear",
      "branchName": "Atesa",
      "address": { "city": "Atesa", ... },
      "operatingHours": [...]
    },
    {
      "name": "Clear",
      "branchName": "Minya",
      "address": { "city": "Minya", ... },
      "operatingHours": [...]
    }
  ]
}
```

**Verify:**
- ✅ Each clinic has a `branchName` field
- ✅ Branch names are: Atesa, Fayoum, Minya
- ✅ All required fields present

---

## 🚨 Troubleshooting

### Issue: Branch dropdown not showing
**Solutions:**
1. Check if API call to `/api/v1/clinics/public` is successful
2. Check browser console for errors
3. Verify `branches.length > 1` evaluates to true
4. Check if component is rendering (React DevTools)

### Issue: Clinics not filtering
**Solutions:**
1. Check `selectedBranch` state in React DevTools
2. Verify `branchName` field exists in clinic data
3. Check filtering logic in useEffect
4. Console.log `filteredClinics` to see results

### Issue: Form not submitting
**Solutions:**
1. Check if `formData.clinicId` is set
2. Verify clinic is selected
3. Check validation logic
4. Review submission handler

---

## 📸 Screenshots Checklist

Please capture:
- [ ] Branch dropdown (closed state)
- [ ] Branch dropdown (open state)
- [ ] Fayoum selected with feedback
- [ ] Atesa selected with feedback
- [ ] Minya selected with feedback
- [ ] Full form with branch selected
- [ ] Mobile view
- [ ] Tablet view
- [ ] Console showing no errors

---

## 🎯 After Testing: Report Format

**Test Report Template:**
```
✅ PASS / ❌ FAIL: Branch Selection UI

Browser: Chrome/Firefox/Safari (version)
Screen Size: Desktop/Tablet/Mobile

Results:
- Branch dropdown visible: YES/NO
- All branches appear: YES/NO
- Filtering works: YES/NO
- Auto-selection works: YES/NO
- Form submission works: YES/NO
- Console errors: YES/NO

Issues Found:
1. [Description]
2. [Description]

Screenshots:
- [Attach screenshots]
```

---

## ⏭️ Next: Phase 2 Testing

Once Phase 1 UI is verified, we'll test:
1. Doctor availability checking
2. Smart time slot generation
3. Conflict detection
4. End-to-end booking flow

---

## 🔗 Quick Links

- **Frontend:** http://localhost:5175 (or :5173)
- **Backend API:** http://localhost:3001/api/v1
- **API Docs:** http://localhost:3001/api/v1

---

**Happy Testing! 🚀**

If you encounter any issues, check the console first, then report back with:
1. What you were trying to do
2. What actually happened
3. Screenshot of the issue
4. Console errors (if any)

