# Patient-User Linking Implementation

This document describes the implementation of linking patient records to user accounts in the dental management system.

## Overview

The system now supports linking patient records to user accounts, enabling:
- Patients to access their own medical records
- Better data organization and security
- User-specific patient data retrieval
- Proper access control for patient information

## Database Changes

### Patient Model Updates

The `Patient` schema has been enhanced with two new fields:

```javascript
// New fields in Patient schema
userId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'User',
  required: false,
  index: true
},
createdBy: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'User',
  required: true
}
```

- `userId`: Links the patient to their user account (optional for backward compatibility)
- `createdBy`: Tracks which user/staff member created the patient record

### TypeScript Interface Updates

The `IPatient` interface has been updated to include:

```typescript
interface IPatient {
  // ... existing fields
  userId?: string;     // Optional link to user account
  createdBy: string;   // Required - who created the record
}
```

## API Endpoints

### New Patient-User Linking Endpoints

#### Link Patient to User
```
POST /api/patients/:patientId/link-user
Body: { "userId": "user_id_here" }
```

#### Get Patients by User ID
```
GET /api/patients/user/:userId
```

#### Unlink Patient from User
```
DELETE /api/patients/:patientId/unlink-user
```

### Updated Existing Endpoints

#### Create Patient
```
POST /api/patients
Body: {
  // ... existing fields
  "userId": "optional_user_id"  // New optional field
}
```

#### Update Patient
```
PUT /api/patients/:id
Body: {
  // ... existing fields
  "userId": "optional_user_id"  // Can update user link
}
```

## Migration Process

### Automated Migration Script

Use the provided migration script to link existing patients to user accounts:

```bash
# Link existing patients to users by email/phone matching
node migrate-patient-links.js link

# Create user accounts for patients without linked users
node migrate-patient-links.js create-users

# Check current linking statistics
node migrate-patient-links.js stats
```

### Migration Strategy

1. **Email Matching**: Links patients to users with matching email addresses
2. **Phone Matching**: Links remaining patients to users with matching phone numbers
3. **User Creation**: Optionally creates user accounts for unlinked patients

### Environment Variables

Set these environment variables before running migration:

```env
MONGODB_URI=mongodb://localhost:27017/dental-management
DEFAULT_PATIENT_PASSWORD=TempPassword123!
```

## Utility Functions

The system includes utility functions for patient-user linking:

### `linkPatientsByEmail()`
- Matches patients and users by email address
- Returns statistics on successful links and errors

### `linkPatientsByPhone()`
- Matches patients and users by phone number
- Processes patients not linked by email

### `getLinkingStatistics()`
- Provides overview of linking status
- Shows total patients, users, and linking percentage

### `createUsersForUnlinkedPatients(defaultPassword)`
- Creates user accounts for patients without linked users
- Uses provided default password
- Automatically links created users to patients

## Security Considerations

1. **Access Control**: Only authorized users can link/unlink patients
2. **Validation**: All user and patient IDs are validated as MongoDB ObjectIds
3. **Authentication**: All endpoints require proper authentication
4. **Data Integrity**: Prevents duplicate links and maintains referential integrity

## Usage Examples

### Frontend Integration

```javascript
// Link a patient to a user account
const linkPatient = async (patientId, userId) => {
  const response = await fetch(`/api/patients/${patientId}/link-user`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ userId })
  });
  return response.json();
};

// Get all patients for a specific user
const getUserPatients = async (userId) => {
  const response = await fetch(`/api/patients/user/${userId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
};
```

### Backend Usage

```javascript
// Create a patient with user link
const newPatient = await Patient.create({
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  userId: req.body.userId,  // Link to user account
  createdBy: req.user._id   // Track who created it
});

// Find patients for a specific user
const userPatients = await Patient.find({ userId: userId });
```

## Troubleshooting

### Common Issues

1. **Migration Errors**: Check MongoDB connection and ensure proper permissions
2. **Duplicate Links**: The system prevents linking a patient to multiple users
3. **Invalid IDs**: Ensure all user and patient IDs are valid MongoDB ObjectIds
4. **Authentication**: Verify JWT tokens are properly configured

### Validation Errors

- `userId must be a valid MongoDB ObjectId`: Provided userId is not a valid ObjectId
- `Patient already linked to a user`: Attempting to link an already linked patient
- `User not found`: Provided userId doesn't exist in the database

## Future Enhancements

1. **Bulk Operations**: Support for bulk patient-user linking
2. **Audit Trail**: Track all linking/unlinking operations
3. **Patient Self-Registration**: Allow patients to create and link their own accounts
4. **Advanced Matching**: Use additional fields for patient-user matching
5. **Data Synchronization**: Sync patient and user profile information

## Testing

Run the migration script in test mode to verify the linking process:

```bash
# Check current statistics before migration
node migrate-patient-links.js stats

# Run the linking process
node migrate-patient-links.js link

# Verify results
node migrate-patient-links.js stats
```

The system maintains backward compatibility, so existing functionality continues to work while new linking features are available.