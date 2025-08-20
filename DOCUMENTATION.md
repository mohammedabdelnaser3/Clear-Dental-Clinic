# DentalPro Manager - Technical Documentation

## Table of Contents

1. [Introduction](#introduction)
2. [System Architecture](#system-architecture)
3. [Frontend Architecture](#frontend-architecture)
4. [Backend Architecture](#backend-architecture)
5. [Database Schema](#database-schema)
6. [Internationalization (i18n)](#internationalization-i18n)
7. [Authentication and Authorization](#authentication-and-authorization)
8. [API Endpoints](#api-endpoints)
9. [Development Setup](#development-setup)
10. [Deployment](#deployment)

## Introduction

DentalPro Manager is a comprehensive practice management system designed for dental clinics. It provides a complete solution for managing patients, appointments, billing, medications, prescriptions, and multi-clinic operations. This documentation provides technical details about the system architecture, components, and implementation.

## System Architecture

DentalPro Manager follows a modern client-server architecture:

- **Frontend**: React-based single-page application (SPA) with TypeScript
- **Backend**: Node.js/Express API server with TypeScript
- **Database**: MongoDB (document-oriented NoSQL database)
- **Authentication**: Firebase Authentication

The system is designed with a clear separation of concerns:

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Frontend  │ <──> │   Backend   │ <──> │   Database  │
│  React SPA  │      │ Express API │      │   MongoDB   │
└─────────────┘      └─────────────┘      └─────────────┘
```

## Frontend Architecture

### Technology Stack

- **Framework**: React with TypeScript
- **State Management**: React Context API
- **Routing**: React Router
- **UI Components**: Custom components with TailwindCSS
- **Form Handling**: React Hook Form with Zod validation
- **HTTP Client**: Axios
- **Internationalization**: i18next
- **Build Tool**: Vite

### Directory Structure

```
src/
├── assets/         # Static assets (images, icons)
├── components/     # Reusable UI components
├── config/         # Configuration files
├── context/        # React context providers
├── hooks/          # Custom React hooks
├── i18n/           # Internationalization setup and translations
├── pages/          # Page components for each route
├── services/       # API service functions
├── types/          # TypeScript type definitions
├── utils/          # Utility functions
├── App.tsx         # Main application component
└── main.tsx        # Application entry point
```

### Key Components

- **Layout Components**: Header, Footer, Layout wrapper
- **UI Components**: Button, Input, Modal, Card, etc.
- **Feature Components**: 
  - Appointment management (Calendar, TimeSlotPicker)
  - Patient management (PatientCard, PatientSearch)
  - Billing components (BillingForm, PaymentForm)
  - Medication and prescription management

### Routing Structure

The application uses React Router for navigation with the following route categories:

- **Public Routes**: Home, About, Services, Contact, Privacy, Terms
- **Authentication Routes**: Login, Register, ForgotPassword, ResetPassword
- **Protected Routes**: Dashboard, Appointments, Patients, Medications, Prescriptions, Billing, Settings, Reports, Profile, Clinics
- **Role-Based Routes**: Admin-specific routes (MultiClinicDashboard)

## Backend Architecture

### Technology Stack

- **Framework**: Express.js with TypeScript
- **Database ODM**: Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Custom middleware
- **Error Handling**: Global error handler middleware

### Directory Structure

```
backend/
├── src/
│   ├── config/         # Configuration files (database, etc.)
│   ├── controllers/    # Request handlers
│   ├── middleware/     # Express middleware
│   ├── models/         # Mongoose models
│   ├── routes/         # API route definitions
│   ├── types/          # TypeScript type definitions
│   ├── utils/          # Utility functions
│   ├── app.ts          # Express application setup
│   └── server.ts       # Server entry point
└── uploads/            # File uploads directory
```

### Security Measures

The backend implements several security measures:

- **Helmet**: HTTP header security
- **CORS**: Configured with whitelisted origins
- **Rate Limiting**: General and stricter limits for authentication routes
- **Data Sanitization**: Protection against NoSQL injection
- **Parameter Pollution Prevention**: Using HPP middleware
- **Secure Error Handling**: Custom error handling that doesn't leak sensitive information

## Database Schema

The application uses MongoDB with Mongoose ODM. Key models include:

- **User**: Staff members and administrators
- **Patient**: Patient information and medical history
- **Appointment**: Scheduling information
- **Clinic**: Clinic details for multi-clinic support
- **Billing**: Financial records and invoices
- **Medication**: Medication catalog
- **Prescription**: Patient prescriptions
- **TreatmentRecord**: Patient treatment history
- **Notification**: System notifications
- **StaffSchedule**: Staff availability and scheduling

## Internationalization (i18n)

The application supports multiple languages using i18next:

- Currently supported languages: English (en) and Arabic (ar)
- Translation files are stored in JSON format in `src/i18n/locales/`
- Language detection uses browser settings and localStorage
- The UI includes a language switcher component

## Authentication and Authorization

### Authentication Flow

1. Users register or log in through the authentication pages
2. Backend validates credentials and issues a JWT token
3. Token is stored in localStorage and included in API requests
4. Protected routes check for valid token using the ProtectedRoute component

### Authorization

- Role-based access control (admin, staff, etc.)
- Route protection based on user roles
- API endpoint protection using middleware

## API Endpoints

The API follows RESTful conventions with the following main routes:

- `/api/v1/auth`: Authentication endpoints (login, register, password reset)
- `/api/v1/users`: User management
- `/api/v1/patients`: Patient management
- `/api/v1/clinics`: Clinic management
- `/api/v1/appointments`: Appointment scheduling
- `/api/v1/treatments`: Treatment records
- `/api/v1/notifications`: User notifications
- `/api/v1/medications`: Medication management
- `/api/v1/prescriptions`: Prescription management
- `/api/v1/billing`: Billing and invoices
- `/api/v1/admin`: Administrative functions
- `/api/v1/staff-schedules`: Staff scheduling

## Development Setup

### Prerequisites

- Node.js (v14+)
- npm or yarn
- MongoDB instance (local or Atlas)

### Frontend Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Variables

Create `.env` files in both root and backend directories with the following variables:

**Frontend (.env)**
```
VITE_API_URL=http://localhost:3001/api/v1
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
```

**Backend (.env)**
```
PORT=3001
NODE_ENV=development
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=90d
EMAIL_FROM=your_email@example.com
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USERNAME=your_smtp_username
SMTP_PASSWORD=your_smtp_password
FRONTEND_URL=http://localhost:5173
```

## Deployment

### Frontend Deployment

The frontend can be built for production using:

```bash
npm run build
```

This creates optimized static files in the `dist/` directory that can be deployed to any static hosting service like Vercel, Netlify, or AWS S3.

### Backend Deployment

The backend can be built for production using:

```bash
cd backend
npm run build
```

This compiles TypeScript to JavaScript in the `dist/` directory. The backend can be deployed to services like Heroku, AWS Elastic Beanstalk, or any Node.js hosting platform.

### Database Deployment

For production, it's recommended to use MongoDB Atlas, which provides a fully managed MongoDB service with backups, scaling, and security features.

---

This documentation provides a comprehensive overview of the DentalPro Manager system architecture and implementation details. For specific code examples or more detailed explanations of particular features, please refer to the codebase or contact the development team.