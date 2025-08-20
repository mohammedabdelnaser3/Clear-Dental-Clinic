# DentalPro Manager - API Documentation

## Overview

This document provides detailed information about the DentalPro Manager API endpoints, request/response formats, and authentication requirements.

## Base URL

```
https://api.dentalpro-manager.com/api/v1
```

For local development:

```
http://localhost:3001/api/v1
```

## Authentication

Most API endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

### Rate Limiting

The API implements rate limiting to prevent abuse:

- General endpoints: 100 requests per 15 minutes (production)
- Authentication endpoints: 5 requests per 15 minutes (production)

## API Endpoints

### Authentication

#### Register a new user

```
POST /auth/register
```

**Request Body:**

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "password": "securePassword123",
  "role": "staff",
  "phone": "+1234567890"
}
```

**Response:**

```json
{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "_id": "user_id",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "role": "staff"
  }
}
```

#### Login

```
POST /auth/login
```

**Request Body:**

```json
{
  "email": "john.doe@example.com",
  "password": "securePassword123"
}
```

**Response:**

```json
{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "_id": "user_id",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "role": "staff"
  }
}
```

#### Request Password Reset

```
POST /auth/request-password-reset
```

**Request Body:**

```json
{
  "email": "john.doe@example.com"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Password reset email sent"
}
```

#### Reset Password

```
POST /auth/reset-password
```

**Request Body:**

```json
{
  "token": "reset_token_from_email",
  "password": "newSecurePassword123"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Password has been reset successfully"
}
```

### User Management

#### Get Current User

```
GET /users/me
```

**Response:**

```json
{
  "success": true,
  "data": {
    "_id": "user_id",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "role": "staff",
    "clinicId": "clinic_id"
  }
}
```

#### Update User Profile

```
PUT /users/me
```

**Request Body:**

```json
{
  "firstName": "John",
  "lastName": "Smith",
  "phone": "+1987654321"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "_id": "user_id",
    "firstName": "John",
    "lastName": "Smith",
    "email": "john.doe@example.com",
    "phone": "+1987654321"
  }
}
```

### Patient Management

#### Get All Patients

```
GET /patients
```

**Query Parameters:**

- `page`: Page number (default: 1)
- `limit`: Results per page (default: 10)
- `sort`: Sort field (default: "createdAt")
- `order`: Sort order ("asc" or "desc", default: "desc")
- `search`: Search term for patient name or email

**Response:**

```json
{
  "success": true,
  "count": 50,
  "pagination": {
    "current": 1,
    "total": 5
  },
  "data": [
    {
      "_id": "patient_id_1",
      "firstName": "Jane",
      "lastName": "Smith",
      "email": "jane.smith@example.com",
      "phone": "+1234567890",
      "dateOfBirth": "1990-01-15T00:00:00.000Z"
    },
    // More patients...
  ]
}
```

#### Get Patient by ID

```
GET /patients/:id
```

**Response:**

```json
{
  "success": true,
  "data": {
    "_id": "patient_id",
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "jane.smith@example.com",
    "phone": "+1234567890",
    "dateOfBirth": "1990-01-15T00:00:00.000Z",
    "address": {
      "street": "123 Main St",
      "city": "Anytown",
      "state": "CA",
      "zipCode": "12345",
      "country": "USA"
    },
    "medicalHistory": {
      "allergies": ["Penicillin"],
      "conditions": ["Hypertension"],
      "medications": ["Lisinopril"]
    },
    "dentalHistory": {
      "lastVisit": "2023-01-10T00:00:00.000Z",
      "treatments": ["Cleaning", "Filling"]
    },
    "insuranceInfo": {
      "provider": "DentalCare Insurance",
      "policyNumber": "DC123456789",
      "groupNumber": "GRP987654",
      "primarySubscriber": "Jane Smith"
    },
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-02-15T00:00:00.000Z"
  }
}
```

#### Create Patient

```
POST /patients
```

**Request Body:**

```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane.smith@example.com",
  "phone": "+1234567890",
  "dateOfBirth": "1990-01-15T00:00:00.000Z",
  "address": {
    "street": "123 Main St",
    "city": "Anytown",
    "state": "CA",
    "zipCode": "12345",
    "country": "USA"
  },
  "medicalHistory": {
    "allergies": ["Penicillin"],
    "conditions": ["Hypertension"],
    "medications": ["Lisinopril"]
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "_id": "new_patient_id",
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "jane.smith@example.com",
    "phone": "+1234567890",
    "dateOfBirth": "1990-01-15T00:00:00.000Z",
    "address": {
      "street": "123 Main St",
      "city": "Anytown",
      "state": "CA",
      "zipCode": "12345",
      "country": "USA"
    },
    "medicalHistory": {
      "allergies": ["Penicillin"],
      "conditions": ["Hypertension"],
      "medications": ["Lisinopril"]
    },
    "createdAt": "2023-06-01T00:00:00.000Z",
    "updatedAt": "2023-06-01T00:00:00.000Z"
  }
}
```

### Appointment Management

#### Get All Appointments

```
GET /appointments
```

**Query Parameters:**

- `page`: Page number (default: 1)
- `limit`: Results per page (default: 10)
- `sort`: Sort field (default: "appointmentDate")
- `order`: Sort order ("asc" or "desc", default: "asc")
- `startDate`: Filter by start date (format: YYYY-MM-DD)
- `endDate`: Filter by end date (format: YYYY-MM-DD)
- `status`: Filter by status ("scheduled", "completed", "cancelled")

**Response:**

```json
{
  "success": true,
  "count": 25,
  "pagination": {
    "current": 1,
    "total": 3
  },
  "data": [
    {
      "_id": "appointment_id_1",
      "patient": {
        "_id": "patient_id",
        "firstName": "Jane",
        "lastName": "Smith"
      },
      "appointmentDate": "2023-06-15T14:00:00.000Z",
      "duration": 60,
      "status": "scheduled",
      "type": "Cleaning",
      "notes": "Regular checkup"
    },
    // More appointments...
  ]
}
```

#### Create Appointment

```
POST /appointments
```

**Request Body:**

```json
{
  "patientId": "patient_id",
  "appointmentDate": "2023-06-15T14:00:00.000Z",
  "duration": 60,
  "type": "Cleaning",
  "notes": "Regular checkup"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "_id": "new_appointment_id",
    "patient": "patient_id",
    "appointmentDate": "2023-06-15T14:00:00.000Z",
    "duration": 60,
    "status": "scheduled",
    "type": "Cleaning",
    "notes": "Regular checkup",
    "createdAt": "2023-06-01T00:00:00.000Z",
    "updatedAt": "2023-06-01T00:00:00.000Z"
  }
}
```

### Clinic Management

#### Get All Clinics

```
GET /clinics
```

**Response:**

```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "_id": "clinic_id_1",
      "name": "Downtown Dental",
      "address": {
        "street": "123 Main St",
        "city": "Anytown",
        "state": "CA",
        "zipCode": "12345",
        "country": "USA"
      },
      "phone": "+1234567890",
      "email": "info@downtowndental.com"
    },
    // More clinics...
  ]
}
```

### Billing Management

#### Get All Invoices

```
GET /billing/invoices
```

**Query Parameters:**

- `page`: Page number (default: 1)
- `limit`: Results per page (default: 10)
- `status`: Filter by status ("paid", "unpaid", "overdue")
- `patientId`: Filter by patient ID

**Response:**

```json
{
  "success": true,
  "count": 15,
  "pagination": {
    "current": 1,
    "total": 2
  },
  "data": [
    {
      "_id": "invoice_id_1",
      "patient": {
        "_id": "patient_id",
        "firstName": "Jane",
        "lastName": "Smith"
      },
      "invoiceNumber": "INV-2023-001",
      "amount": 150.00,
      "status": "paid",
      "dueDate": "2023-06-30T00:00:00.000Z",
      "items": [
        {
          "description": "Dental Cleaning",
          "quantity": 1,
          "unitPrice": 100.00,
          "total": 100.00
        },
        {
          "description": "X-Ray",
          "quantity": 1,
          "unitPrice": 50.00,
          "total": 50.00
        }
      ],
      "createdAt": "2023-06-01T00:00:00.000Z"
    },
    // More invoices...
  ]
}
```

### Medication Management

#### Get All Medications

```
GET /medications
```

**Query Parameters:**

- `page`: Page number (default: 1)
- `limit`: Results per page (default: 20)
- `search`: Search term for medication name

**Response:**

```json
{
  "success": true,
  "count": 100,
  "pagination": {
    "current": 1,
    "total": 5
  },
  "data": [
    {
      "_id": "medication_id_1",
      "name": "Amoxicillin",
      "dosage": "500mg",
      "form": "Capsule",
      "description": "Antibiotic used to treat bacterial infections",
      "contraindications": ["Penicillin allergy"],
      "sideEffects": ["Diarrhea", "Nausea", "Rash"]
    },
    // More medications...
  ]
}
```

### Prescription Management

#### Create Prescription

```
POST /prescriptions
```

**Request Body:**

```json
{
  "patientId": "patient_id",
  "medications": [
    {
      "medicationId": "medication_id_1",
      "dosage": "500mg",
      "frequency": "Every 8 hours",
      "duration": "7 days",
      "instructions": "Take with food"
    }
  ],
  "notes": "For tooth infection"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "_id": "prescription_id",
    "patient": "patient_id",
    "prescribedBy": "user_id",
    "medications": [
      {
        "medication": "medication_id_1",
        "dosage": "500mg",
        "frequency": "Every 8 hours",
        "duration": "7 days",
        "instructions": "Take with food"
      }
    ],
    "notes": "For tooth infection",
    "createdAt": "2023-06-01T00:00:00.000Z",
    "updatedAt": "2023-06-01T00:00:00.000Z"
  }
}
```

## Error Responses

All API endpoints return consistent error responses:

```json
{
  "success": false,
  "error": {
    "statusCode": 400,
    "message": "Error message here"
  }
}
```

Common HTTP status codes:

- `400` - Bad Request (invalid input)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `409` - Conflict (e.g., duplicate email)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

## Pagination

Many endpoints that return lists support pagination with the following query parameters:

- `page`: Page number (default: 1)
- `limit`: Results per page (default varies by endpoint)

Paginated responses include a `pagination` object with the following properties:

```json
{
  "pagination": {
    "current": 1,     // Current page number
    "total": 5,       // Total number of pages
    "prev": null,     // Previous page number (null if on first page)
    "next": 2         // Next page number (null if on last page)
  }
}
```

## Filtering and Sorting

Many list endpoints support filtering and sorting with the following query parameters:

- `sort`: Field to sort by
- `order`: Sort order ("asc" or "desc")
- Additional endpoint-specific filter parameters

## Versioning

The API uses URL versioning (currently v1). Future versions will be accessible at `/api/v2`, etc.

---

This API documentation provides a comprehensive overview of the available endpoints and their usage. For additional support or questions, please contact the development team.