# 🧪 Conflict Detection Testing Guide

## Phase 2D: Testing the Complete Conflict Detection System

This guide will walk you through testing the newly implemented conflict detection feature to ensure booked time slots are correctly marked as unavailable.

---

## 📋 Prerequisites

✅ Backend server running on port 3001  
✅ Frontend dev server running on port 5173  
✅ Database seeded with 3 branches and doctor schedules  
✅ At least one user account (patient or admin)  

---

## 🧪 Test Scenarios

### **Test 1: Fresh Date (No Bookings)**

**Objective:** Verify all slots show as available when there are no bookings.

**Steps:**
1. Navigate to: http://localhost:5173/appointments/new
2. Select a branch (e.g., "Main Branch - Fayoum")
3. Select a clinic from the filtered list
4. Select a future date (e.g., tomorrow or next week)
5. Observe the doctor availability section

**Expected Results:**
- ✅ Doctors with schedules for that day appear
- ✅ All time slots show as available (blue/white background)
- ✅ No gray "Booked" slots visible
- ✅ Console shows: `📍 Found 0 booked slots`
- ✅ Console shows: `✅ Generated X time slots (X available, 0 booked)`

---

### **Test 2: Create Appointment & Verify Conflict Detection**

**Objective:** Verify newly booked slots appear as unavailable.

**Steps:**

#### Part A: Create First Appointment
1. From Test 1, select an available time slot (e.g., 7:00 PM)
2. Complete the booking form
3. Submit the appointment
4. Note the date, time, and doctor

**Expected Results:**
- ✅ Appointment created successfully
- ✅ Success toast notification appears
- ✅ Redirected to appointments list

#### Part B: Verify Slot Shows as Booked
1. Navigate back to: http://localhost:5173/appointments/new
2. Select the SAME branch, clinic, and date
3. Select the SAME doctor

**Expected Results:**
- ✅ The previously booked time slot (7:00 PM) shows as GRAY
- ✅ The slot displays "Booked" label
- ✅ The slot is DISABLED (cannot click)
- ✅ Console shows: `📍 Found 1 booked slots: ["19:00"]`
- ✅ Console shows: `✅ Generated X time slots (X-1 available, 1 booked)`
- ✅ Other time slots remain available

---

### **Test 3: Multiple Bookings for Same Doctor**

**Objective:** Verify multiple booked slots are all marked correctly.

**Steps:**
1. Create 2-3 more appointments for the same doctor on the same date
2. Choose different time slots (e.g., 8:00 PM, 9:00 PM)
3. After each booking, return to the form and verify

**Expected Results:**
- ✅ Each new booking reduces available slots by 1
- ✅ All booked slots show as gray and disabled
- ✅ Console shows increasing booked count: `📍 Found 3 booked slots: ["19:00", "20:00", "21:00"]`
- ✅ Available slot count decreases accordingly

---

### **Test 4: Doctor-Specific Conflicts**

**Objective:** Verify conflicts are doctor-specific (Dr. A's bookings don't affect Dr. B).

**Steps:**
1. Book 2 slots for Dr. Jamal at 7:00 PM and 8:00 PM
2. Switch to Dr. Momen (different doctor, same date/clinic)
3. Check 7:00 PM and 8:00 PM time slots

**Expected Results:**
- ✅ Dr. Jamal: 7:00 PM and 8:00 PM show as booked (gray)
- ✅ Dr. Momen: 7:00 PM and 8:00 PM show as AVAILABLE (blue)
- ✅ Console shows different booked counts for each doctor
- ✅ Can book same time for different doctors

---

### **Test 5: Date-Specific Conflicts**

**Objective:** Verify conflicts are date-specific.

**Steps:**
1. Book October 7, 2025 at 7:00 PM for Dr. Jamal
2. Change date to October 8, 2025
3. Check 7:00 PM time slot

**Expected Results:**
- ✅ October 7: 7:00 PM shows as booked
- ✅ October 8: 7:00 PM shows as available
- ✅ Console shows: `📍 Fetching booked slots for: {date: "2025-10-08", ...}`
- ✅ No conflicts for different dates

---

### **Test 6: All Slots Booked**

**Objective:** Verify behavior when all time slots are booked.

**Steps:**
1. Book all available time slots for a specific doctor/date
2. Return to the booking form
3. Select that doctor and date

**Expected Results:**
- ✅ All time slots show as gray "Booked"
- ✅ No clickable slots available
- ✅ Optionally: A message appears: "No available time slots"
- ✅ Console shows: `✅ Generated X time slots (0 available, X booked)`

---

### **Test 7: Auto-Assign with Conflicts**

**Objective:** Verify "Auto-assign doctor" respects conflicts.

**Steps:**
1. Book some slots for Dr. Jamal
2. Do NOT select a specific doctor (leave auto-assign)
3. Observe time slots

**Expected Results:**
- ✅ Shows ALL available slots across ALL doctors
- ✅ Booked slots for any doctor show as unavailable
- ✅ Can select from any doctor's available slots
- ✅ Console shows aggregate booked slots

---

### **Test 8: Edit Appointment (Exclude Current)**

**Objective:** Verify editing an appointment doesn't conflict with itself.

**Steps:**
1. Create an appointment for October 10 at 7:00 PM
2. Navigate to edit that appointment
3. Try changing the time to 8:00 PM
4. Try keeping it at 7:00 PM

**Expected Results:**
- ✅ Changing to 8:00 PM: Works if 8:00 PM is available
- ✅ Keeping at 7:00 PM: Does NOT show conflict with itself
- ✅ Backend excludes current appointment ID from conflict check
- ✅ Can successfully update without false conflicts

---

### **Test 9: Branch/Clinic Isolation**

**Objective:** Verify conflicts are clinic-specific.

**Steps:**
1. Book October 15 at 7:00 PM at Fayoum clinic with Dr. Jamal
2. Switch to Atesa branch clinic
3. Check October 15 at 7:00 PM with Dr. Jamal (if available there)

**Expected Results:**
- ✅ Fayoum clinic: 7:00 PM booked
- ✅ Atesa clinic: 7:00 PM available (different clinic)
- ✅ Bookings are isolated by clinic ID

---

### **Test 10: Console Logging Verification**

**Objective:** Verify detailed logging is working correctly.

**Steps:**
1. Open browser DevTools (F12)
2. Go to Console tab
3. Perform any booking flow
4. Observe console output

**Expected Logs:**
```
📍 Fetching booked slots for: {date: "2025-10-07", clinicId: "...", doctorId: "..."}
📍 Found 2 booked slots: ["19:00", "20:30"]
✅ Generated 8 time slots (6 available, 2 booked) for 2025-10-07
```

**Verify:**
- ✅ Date format is correct
- ✅ Clinic ID and Doctor ID are valid
- ✅ Booked slots array matches actual bookings
- ✅ Count math is correct (total = available + booked)

---

## 🐛 Common Issues & Troubleshooting

### Issue 1: All Slots Show as Available (Bookings Not Detected)

**Symptoms:**
- Created appointments but slots still show as available
- Console shows: `📍 Found 0 booked slots`

**Possible Causes:**
1. Appointment status is not 'scheduled' or 'confirmed'
2. Wrong date format
3. Backend not returning booked slots
4. Frontend not calling getBookedSlots

**Debug Steps:**
```bash
# Check database for appointments
curl http://localhost:3001/api/v1/appointments

# Check booked-slots endpoint directly
curl "http://localhost:3001/api/v1/appointments/booked-slots?date=2025-10-07&clinicId=YOUR_CLINIC_ID"
```

---

### Issue 2: Error Fetching Booked Slots

**Symptoms:**
- Console shows API error
- Network tab shows 400/500 error

**Possible Causes:**
1. Invalid date format
2. Invalid clinic/doctor ID
3. Backend validation failing
4. CORS issues

**Debug Steps:**
1. Check Network tab for exact error message
2. Verify query parameters are correct
3. Check backend console for validation errors

---

### Issue 3: Slots Show as Booked When They're Not

**Symptoms:**
- Slots are gray but no appointments exist

**Possible Causes:**
1. Cancelled/completed appointments still counted
2. Wrong doctor ID being queried
3. Date timezone mismatch

**Debug Steps:**
1. Check appointment status in database
2. Verify backend only returns 'scheduled'/'confirmed'
3. Check date formatting consistency

---

## ✅ Success Criteria

All tests should pass with these results:

- ✅ Fresh dates show all slots as available
- ✅ Booked slots appear gray and disabled
- ✅ Console logging is accurate and detailed
- ✅ Multiple bookings cumulative correctly
- ✅ Doctor-specific conflicts work
- ✅ Date-specific conflicts work
- ✅ Clinic-specific isolation works
- ✅ Auto-assign respects conflicts
- ✅ Edit appointments work without self-conflict
- ✅ All visual states are correct (blue/amber/gray)

---

## 📊 Performance Checks

While testing, verify:

- ✅ Time slot generation is fast (<500ms)
- ✅ API call to get booked slots is fast (<2s)
- ✅ UI updates smoothly when switching doctors
- ✅ No infinite loops or excessive re-renders
- ✅ Network tab shows single API call per doctor selection

---

## 🎯 Next Steps After Testing

### If All Tests Pass:
1. ✅ Mark phase2-conflict-4 as complete
2. ✅ Proceed to Test 11: Complete multi-branch booking flow
3. ✅ Optional: Create admin schedule management interface
4. ✅ Production deployment preparation

### If Issues Found:
1. Document specific failing scenarios
2. Check error messages and logs
3. Debug and fix identified issues
4. Re-run tests

---

## 📝 Test Results Template

Use this template to document your test results:

```
# Conflict Detection Test Results
Date: _______________
Tester: _______________

Test 1: Fresh Date - [ ] PASS [ ] FAIL
Notes: _________________________________

Test 2: Create & Verify - [ ] PASS [ ] FAIL
Notes: _________________________________

Test 3: Multiple Bookings - [ ] PASS [ ] FAIL
Notes: _________________________________

Test 4: Doctor-Specific - [ ] PASS [ ] FAIL
Notes: _________________________________

Test 5: Date-Specific - [ ] PASS [ ] FAIL
Notes: _________________________________

Test 6: All Slots Booked - [ ] PASS [ ] FAIL
Notes: _________________________________

Test 7: Auto-Assign - [ ] PASS [ ] FAIL
Notes: _________________________________

Test 8: Edit Appointment - [ ] PASS [ ] FAIL
Notes: _________________________________

Test 9: Clinic Isolation - [ ] PASS [ ] FAIL
Notes: _________________________________

Test 10: Console Logging - [ ] PASS [ ] FAIL
Notes: _________________________________

Overall Result: [ ] ALL PASS [ ] SOME FAILURES

Issues Found:
- _________________________________
- _________________________________
```

---

## 🚀 Ready to Test!

1. Make sure both servers are running
2. Open browser to http://localhost:5173
3. Open DevTools Console
4. Follow the test scenarios above
5. Document your results

**Happy Testing! 🎉**

