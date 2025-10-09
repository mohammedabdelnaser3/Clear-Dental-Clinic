# Implementation Plan

- [x] 1. Add profile image upload route alias





  - Add `/users/profile-image` route that points to the same controller as `/users/upload-image`
  - Place the new route in `backend/src/routes/userRoutes.ts` after the existing upload-image route
  - Use the same middleware and controller: `uploadSingle('profileImage'), uploadUserProfileImage`
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 2. Fix patientOwnerOrStaff middleware authorization logic





  - [x] 2.1 Update middleware function signature to async


    - Change the middleware function in `backend/src/middleware/auth.ts` to return `Promise<void>`
    - Update the function to use async/await syntax
    - _Requirements: 3.1, 3.2, 3.3_

  - [x] 2.2 Add database query to fetch patient record


    - Import Patient model at the top of the file
    - Add `await Patient.findById(patientId)` to fetch the patient record
    - Add null check for patient record and return 404 if not found
    - _Requirements: 3.1, 3.2, 3.3_



  - [x] 2.3 Update ownership comparison logic

    - Replace the comparison of `authReq.user._id` with `patientId`
    - Update to compare `authReq.user._id` with `patient.userId`
    - Ensure both IDs are converted to strings for comparison
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_




  - [x] 2.4 Add error handling for database queries
    - Wrap the patient fetch logic in try-catch block
    - Return 500 error with appropriate message on database errors
    - Log errors to console for debugging
    - _Requirements: 3.1, 4.1, 4.2, 4.3, 4.4, 4.5_
-

- [x] 3. Verify and test the fixes


  - [x] 3.1 Test profile image upload endpoint


    - Start the backend server
    - Use a REST client or frontend to POST to `/users/profile-image` with an image file
    - Verify the response is 200 OK with the image URL
    - Verify the image is saved correctly
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 4.3_


  - [x] 3.2 Test patient data fetching

    - Login as a patient user
    - Fetch patient data via GET `/patients/user/:userId` where userId is the authenticated user's ID
    - Verify the response is 200 OK with patient data
    - Verify no 403 errors occur
    - _Requirements: 2.1, 2.2, 2.3, 4.1, 4.2_



  - [x] 3.3 Test patient data updating
    - Login as a patient user
    - Update patient data via PUT `/patients/:id` where id is the patient record ID
    - Verify the response is 200 OK with updated patient data
    - Verify no 403 errors occur
    - _Requirements: 3.1, 3.2, 3.3, 4.1, 4.2, 4.5_



  - [x] 3.4 Test authorization boundaries
    - Login as patient A
    - Try to fetch patient B's data via GET `/patients/user/:userIdB`
    - Verify the response is 403 Forbidden
    - Try to update patient B's data via PUT `/patients/:patientIdB`
    - Verify the response is 403 Forbidden


    - _Requirements: 2.4, 3.4, 5.1, 5.2_

  - [x] 3.5 Test staff and admin access

    - Login as a staff user
    - Fetch any patient's data via GET `/patients/user/:userId`
    - Verify the response is 200 OK
    - Update any patient's data via PUT `/patients/:id`
    - Verify the response is 200 OK
    - Repeat with admin user
    - _Requirements: 2.5, 3.5, 5.3_
-

- [x] 4. Verify frontend integration


  - [x] 4.1 Test patient profile page


    - Login as a patient
    - Navigate to the profile page
    - Verify the page loads without errors
    - Verify patient data is displayed correctly
    - _Requirements: 4.1, 4.6_


  - [x] 4.2 Test patient settings page
    - Login as a patient
    - Navigate to the settings page
    - Verify the page loads without errors
    - Verify patient data is displayed correctly
    - _Requirements: 4.2, 4.6_


  - [x] 4.3 Test profile image upload from frontend
    - Login as a patient
    - Navigate to settings or profile page
    - Click the profile image upload button
    - Select an image file
    - Verify the image uploads successfully
    - Verify the new image is displayed
    - _Requirements: 1.1, 1.2, 1.3, 4.3_

  - [x] 4.4 Test profile information updates

    - Login as a patient
    - Navigate to settings page
    - Update personal information (name, phone, etc.)
    - Save changes
    - Verify the changes are saved successfully
    - Verify no authorization errors occur
    - _Requirements: 3.1, 3.2, 3.3, 4.5_


  - [x] 4.5 Test medical history updates

    - Login as a patient
    - Navigate to settings page
    - Update medical history (allergies, conditions, etc.)
    - Save changes
    - Verify the changes are saved successfully
    - _Requirements: 3.1, 3.2, 3.3, 4.5_
