# CURL Test Commands for Patient API

## Prerequisites
1. Start your backend server: `npm run dev`
2. Get a valid JWT token by logging into your application
3. Replace `YOUR_TOKEN_HERE` with your actual token

## Test Commands

### 1. Test Server Connectivity
```bash
curl -X GET http://localhost:3009/api/v1/health \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n"
```

### 2. Test Patient Creation Without Authentication (Should Fail)
```bash
curl -X POST http://localhost:3009/api/v1/patients \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Mohamed",
    "lastName": "Abdelnasser Khattab",
    "email": "mohamedabdelnasser0123@gmail.com",
    "phone": "+201013320786",
    "dateOfBirth": "1990-01-15",
    "gender": "male",
    "address": {
      "street": "123 Main Street",
      "city": "Cairo",
      "state": "Cairo",
      "zipCode": "12345",
      "country": "Egypt"
    },
    "medicalHistory": {
      "allergies": [],
      "medications": [],
      "conditions": [],
      "notes": "No significant medical history"
    },
    "treatmentRecords": [],
    "preferredClinicId": "",
    "userId": "6879369cf9594e20abb3d14e",
    "isActive": true,
    "emergencyContact": {
      "name": "Emergency Contact",
      "phone": "+201013320786",
      "relationship": "Self"
    }
  }' \
  -w "\nStatus: %{http_code}\n"
```

### 3. Test Patient Creation With Authentication
```bash
curl -X POST http://localhost:3009/api/v1/patients \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "firstName": "Mohamed",
    "lastName": "Abdelnasser Khattab",
    "email": "mohamedabdelnasser0123@gmail.com",
    "phone": "+201013320786",
    "dateOfBirth": "1990-01-15",
    "gender": "male",
    "address": {
      "street": "123 Main Street",
      "city": "Cairo",
      "state": "Cairo",
      "zipCode": "12345",
      "country": "Egypt"
    },
    "medicalHistory": {
      "allergies": [],
      "medications": [],
      "conditions": [],
      "notes": "No significant medical history"
    },
    "treatmentRecords": [],
    "preferredClinicId": "",
    "userId": "6879369cf9594e20abb3d14e",
    "isActive": true,
    "emergencyContact": {
      "name": "Emergency Contact",
      "phone": "+201013320786",
      "relationship": "Self"
    }
  }' \
  -w "\nStatus: %{http_code}\n"
```

### 4. Test Get Patients By User ID
```bash
curl -X GET http://localhost:3009/api/v1/patients/user/6879369cf9594e20abb3d14e \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -w "\nStatus: %{http_code}\n"
```

### 5. Test Get All Patients (Staff/Admin Only)
```bash
curl -X GET http://localhost:3009/api/v1/patients \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -w "\nStatus: %{http_code}\n"
```

### 6. Test Get Patient By ID
```bash
curl -X GET http://localhost:3009/api/v1/patients/PATIENT_ID_HERE \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -w "\nStatus: %{http_code}\n"
```

## Expected Responses

### Successful Patient Creation (201)
```json
{
  "success": true,
  "message": "Patient created successfully",
  "data": {
    "patient": {
      "_id": "...",
      "firstName": "Mohamed",
      "lastName": "Abdelnasser Khattab",
      "email": "mohamedabdelnasser0123@gmail.com",
      "phone": "+201013320786",
      "userId": "6879369cf9594e20abb3d14e",
      "createdBy": "...",
      "createdAt": "...",
      "updatedAt": "..."
    }
  }
}
```

### 401 Unauthorized (No Token)
```json
{
  "success": false,
  "message": "Not authorized to access this route"
}
```

### 403 Forbidden (Insufficient Permissions)
```json
{
  "success": false,
  "message": "Access denied. Insufficient permissions."
}
```

### 422 Validation Error
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "firstName": ["First name is required"],
    "email": ["Email is invalid"]
  }
}
```

## Troubleshooting

### If you get 403 Forbidden:
1. Check if the user has the correct role
2. Verify the token is valid and not expired
3. Ensure the user has permission to create patients

### If you get 401 Unauthorized:
1. Check if the token is properly formatted
2. Verify the token hasn't expired
3. Ensure the Authorization header is correct

### If you get 422 Validation Error:
1. Check the request body format
2. Verify all required fields are present
3. Ensure data types are correct

### If you get Connection Refused:
1. Make sure the backend server is running
2. Check if the port 3009 is correct
3. Verify no firewall is blocking the connection
