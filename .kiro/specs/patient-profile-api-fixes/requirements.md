# Requirements Document

## Introduction

This feature addresses three critical API errors preventing patients from accessing and managing their profile and settings:

1. **404 Error**: The profile image upload endpoint `/users/profile-image` does not exist on the server
2. **403 Error**: Patients receive "Access denied. Patients can only access their own data" when trying to fetch their own patient records via `/patients/user/:userId`
3. **403 Error**: Patients receive "Access denied. Patients can only access their own data" when trying to update their own patient records via `PUT /patients/:id`

These errors prevent patients from:
- Uploading or updating their profile pictures
- Viewing their profile information
- Updating their personal information, medical history, and emergency contacts
- Accessing their settings page
- Managing their account details

The root causes are:
- Frontend is calling `/users/profile-image` but backend only has `/users/upload-image`
- The `userOwnerOrStaff` middleware is incorrectly rejecting patients accessing their own data when fetching patient records
- The `patientOwnerOrStaff` middleware is incorrectly rejecting patients updating their own patient records

## Requirements

### Requirement 1: Fix Profile Image Upload Endpoint

**User Story:** As a patient, I want to upload my profile picture so that my account is personalized and easily identifiable.

#### Acceptance Criteria

1. WHEN a patient uploads a profile image THEN the system SHALL accept the request at the `/users/profile-image` endpoint
2. WHEN the backend receives a profile image upload request THEN it SHALL process the image using the existing upload logic
3. WHEN the upload is successful THEN the system SHALL return the updated profile image URL
4. WHEN the upload fails THEN the system SHALL return an appropriate error message with status code
5. IF the endpoint `/users/upload-image` exists THEN the system SHALL either create an alias route or update the frontend to use the correct endpoint

### Requirement 2: Fix Patient Data Access Authorization

**User Story:** As a patient, I want to access my own patient records so that I can view and manage my profile information.

#### Acceptance Criteria

1. WHEN a patient requests their own patient data via `/patients/user/:userId` THEN the system SHALL allow the request
2. WHEN the `userOwnerOrStaff` middleware validates a patient's request THEN it SHALL correctly identify that the patient is accessing their own data
3. WHEN a patient's userId matches the requested userId parameter THEN the system SHALL grant access
4. WHEN a patient attempts to access another user's data THEN the system SHALL deny access with a 403 error
5. WHEN staff or admin users access patient data THEN the system SHALL allow the request regardless of userId

### Requirement 3: Fix Patient Data Update Authorization

**User Story:** As a patient, I want to update my own patient information so that my profile remains accurate and up-to-date.

#### Acceptance Criteria

1. WHEN a patient updates their own patient record via `PUT /patients/:id` THEN the system SHALL allow the request
2. WHEN the `patientOwnerOrStaff` middleware validates a patient's update request THEN it SHALL correctly identify that the patient is updating their own data
3. WHEN a patient's userId matches the patient record's userId THEN the system SHALL grant update access
4. WHEN a patient attempts to update another patient's data THEN the system SHALL deny access with a 403 error
5. WHEN staff or admin users update patient data THEN the system SHALL allow the request regardless of patient ownership

### Requirement 4: Ensure Profile and Settings Pages Load Successfully

**User Story:** As a patient, I want to access my profile and settings pages without errors so that I can manage my account information.

#### Acceptance Criteria

1. WHEN a patient navigates to the profile page THEN the system SHALL load all patient data without authorization errors
2. WHEN a patient navigates to the settings page THEN the system SHALL load all patient data without authorization errors
3. WHEN the profile image upload button is clicked THEN the system SHALL successfully upload the image without 404 errors
4. WHEN patient data is fetched THEN the system SHALL use the correct API endpoints
5. WHEN patient data is updated THEN the system SHALL successfully save changes without authorization errors
6. IF any API call fails THEN the system SHALL display user-friendly error messages

### Requirement 5: Maintain Security and Authorization

**User Story:** As a system administrator, I want to ensure that patients can only access their own data so that patient privacy is maintained.

#### Acceptance Criteria

1. WHEN authorization middleware is updated THEN it SHALL maintain existing security constraints
2. WHEN a patient attempts to access another patient's data THEN the system SHALL deny access
3. WHEN staff or admin users access patient data THEN the system SHALL allow access based on their role
4. WHEN the fix is implemented THEN it SHALL not introduce any security vulnerabilities
5. WHEN authorization checks are performed THEN they SHALL correctly compare user IDs and roles
