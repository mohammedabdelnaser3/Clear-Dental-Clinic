# DentalPro Manager - Developer Guide

## Table of Contents

1. [Getting Started](#getting-started)
2. [Development Environment Setup](#development-environment-setup)
3. [Project Structure](#project-structure)
4. [Coding Standards](#coding-standards)
5. [Working with the Frontend](#working-with-the-frontend)
6. [Working with the Backend](#working-with-the-backend)
7. [Database Operations](#database-operations)
8. [Testing](#testing)
9. [Internationalization](#internationalization)
10. [Deployment](#deployment)
11. [Troubleshooting](#troubleshooting)

## Getting Started

This guide provides developers with the information needed to set up, develop, and maintain the DentalPro Manager application.

### Prerequisites

- Node.js (v14+)
- npm or yarn
- MongoDB (local installation or Atlas account)
- Git
- Code editor (VS Code recommended)

## Development Environment Setup

### Clone the Repository

```bash
git clone <repository-url>
cd dental-pro-manager
```

### Frontend Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend development server will start at http://localhost:5173

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Start development server
npm run dev
```

The backend API server will start at http://localhost:3001

### Environment Configuration

Create the following environment files:

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

## Project Structure

### Frontend Structure

```
src/
├── assets/         # Static assets (images, icons)
├── components/     # Reusable UI components
│   ├── appointment/  # Appointment-related components
│   ├── auth/         # Authentication components
│   ├── billing/      # Billing-related components
│   ├── charts/       # Chart components
│   ├── clinic/       # Clinic-related components
│   ├── common/       # Common UI components
│   ├── layout/       # Layout components
│   ├── medications/  # Medication-related components
│   ├── patient/      # Patient-related components
│   ├── prescriptions/ # Prescription-related components
│   └── ui/           # Basic UI components
├── config/         # Configuration files
├── context/        # React context providers
├── hooks/          # Custom React hooks
├── i18n/           # Internationalization setup and translations
│   └── locales/      # Translation files
├── pages/          # Page components for each route
│   ├── admin/        # Admin pages
│   ├── appointment/  # Appointment pages
│   ├── auth/         # Authentication pages
│   ├── billing/      # Billing pages
│   ├── clinics/      # Clinic management pages
│   ├── dashboard/    # Dashboard pages
│   ├── medications/  # Medication pages
│   ├── patient/      # Patient pages
│   ├── prescriptions/ # Prescription pages
│   ├── profile/      # User profile pages
│   ├── reports/      # Report pages
│   └── settings/     # Settings pages
├── services/       # API service functions
├── types/          # TypeScript type definitions
├── utils/          # Utility functions
├── App.tsx         # Main application component
└── main.tsx        # Application entry point
```

### Backend Structure

```
backend/
├── src/
│   ├── config/         # Configuration files
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

## Coding Standards

### General Guidelines

- Use TypeScript for type safety
- Follow ESLint rules configured in the project
- Write meaningful comments for complex logic
- Use descriptive variable and function names
- Keep functions small and focused on a single responsibility
- Write unit tests for critical functionality

### Frontend Guidelines

- Use functional components with hooks
- Organize components by feature/domain
- Use React Context for global state management
- Implement proper error handling for API calls
- Follow accessibility best practices
- Use TailwindCSS for styling

### Backend Guidelines

- Follow RESTful API design principles
- Implement proper validation for all inputs
- Use async/await for asynchronous operations
- Implement comprehensive error handling
- Use environment variables for configuration
- Follow the controller-service pattern

## Working with the Frontend

### Component Development

When creating new components:

1. Place them in the appropriate directory under `src/components/`
2. Use TypeScript interfaces for props
3. Export the component as the default export
4. Create an index.ts file for barrel exports if needed

Example component:

```tsx
import React from 'react';

interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
}

const Button: React.FC<ButtonProps> = ({ 
  label, 
  onClick, 
  variant = 'primary', 
  disabled = false 
}) => {
  const baseClasses = 'px-4 py-2 rounded font-medium focus:outline-none';
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  };
  
  
  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]}`}
      onClick={onClick}
      disabled={disabled}
    >
      {label}
    </button>
  );
};

export default Button;
```

### Adding New Pages

1. Create a new file in the appropriate directory under `src/pages/`
2. Add the route in `App.tsx`
3. Update navigation components if needed

### Working with API Services

API calls should be centralized in service files under `src/services/`:

```typescript
import axios from 'axios';
import { Patient } from '../types';

const API_URL = import.meta.env.VITE_API_URL;

export const getPatients = async (page = 1, limit = 10) => {
  try {
    const response = await axios.get(`${API_URL}/patients`, {
      params: { page, limit },
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching patients:', error);
    throw error;
  }
};

export const createPatient = async (patientData: Omit<Patient, '_id'>) => {
  try {
    const response = await axios.post(`${API_URL}/patients`, patientData, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error creating patient:', error);
    throw error;
  }
};
```

## Working with the Backend

### Creating API Endpoints

1. Define the route in the appropriate file under `src/routes/`
2. Implement the controller function in `src/controllers/`
3. Add validation middleware if needed

Example route definition:

```typescript
import { Router } from 'express';
import { getPatients, getPatient, createPatient, updatePatient, deletePatient } from '../controllers/patientController';
import { protect } from '../middleware/authMiddleware';
import { validatePatientInput } from '../middleware/validationMiddleware';

const router = Router();

router.route('/')
  .get(protect, getPatients)
  .post(protect, validatePatientInput, createPatient);

router.route('/:id')
  .get(protect, getPatient)
  .put(protect, validatePatientInput, updatePatient)
  .delete(protect, deletePatient);

export default router;
```

Example controller:

```typescript
import { Request, Response, NextFunction } from 'express';
import Patient from '../models/Patient';
import { AppError } from '../middleware/errorHandler';

// @desc    Get all patients
// @route   GET /api/v1/patients
// @access  Private
export const getPatients = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    
    const total = await Patient.countDocuments();
    const patients = await Patient.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    res.status(200).json({
      success: true,
      count: total,
      pagination: {
        current: page,
        total: Math.ceil(total / limit)
      },
      data: patients
    });
  } catch (error) {
    next(error);
  }
};
```

### Creating Models

Define Mongoose models in `src/models/` with TypeScript interfaces:

```typescript
import mongoose, { Schema } from 'mongoose';
import { IPatient } from '../types';

const patientSchema = new Schema<IPatient>({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email']
  },
  // Additional fields...
}, {
  timestamps: true
});

export default mongoose.model<IPatient>('Patient', patientSchema);
```

## Database Operations

### Connecting to MongoDB

The application uses Mongoose to connect to MongoDB. The connection is established in `src/config/database.ts`.

### Data Migrations

For data migrations, use the scripts in the `backend` directory:

- `populate-atlas-patients.js`: Populate the database with sample patients
- `migrate-patient-links.js`: Update patient-user relationships

### Backup and Restore

For MongoDB Atlas:

1. Use the Atlas UI to create scheduled backups
2. Use `mongodump` and `mongorestore` for manual backups

## Testing

### Frontend Testing

The project uses Jest and React Testing Library for frontend tests:

```bash
# Run frontend tests
npm test

# Run tests with coverage
npm test -- --coverage
```

Example component test:

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import Button from './Button';

describe('Button component', () => {
  test('renders button with label', () => {
    const handleClick = jest.fn();
    render(<Button label="Click me" onClick={handleClick} />);
    
    const button = screen.getByText('Click me');
    expect(button).toBeInTheDocument();
  });
  
  test('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button label="Click me" onClick={handleClick} />);
    
    const button = screen.getByText('Click me');
    fireEvent.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Backend Testing

For backend tests, use Jest with Supertest:

```bash
# Navigate to backend directory
cd backend

# Run backend tests
npm test
```

Example API test:

```typescript
import request from 'supertest';
import app from '../src/app';
import mongoose from 'mongoose';

describe('Patient API', () => {
  let token: string;
  
  beforeAll(async () => {
    // Login and get token
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });
    
    token = response.body.token;
  });
  
  afterAll(async () => {
    await mongoose.connection.close();
  });
  
  test('GET /api/v1/patients should return patients', async () => {
    const response = await request(app)
      .get('/api/v1/patients')
      .set('Authorization', `Bearer ${token}`);
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
  });
});
```

## Internationalization

The application uses i18next for internationalization.

### Adding New Translations

1. Add new translation keys to `src/i18n/locales/en.json`
2. Add corresponding translations to other language files (e.g., `ar.json`)

Example translation file structure:

```json
{
  "common": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit"
  },
  "patient": {
    "title": "Patients",
    "newPatient": "New Patient",
    "details": "Patient Details",
    "fields": {
      "firstName": "First Name",
      "lastName": "Last Name",
      "email": "Email",
      "phone": "Phone"
    }
  }
}
```

### Using Translations in Components

```tsx
import { useTranslation } from 'react-i18next';

const PatientForm = () => {
  const { t } = useTranslation();
  
  return (
    <div>
      <h2>{t('patient.newPatient')}</h2>
      <form>
        <label>{t('patient.fields.firstName')}</label>
        <input type="text" />
        
        <label>{t('patient.fields.lastName')}</label>
        <input type="text" />
        
        <button type="submit">{t('common.save')}</button>
        <button type="button">{t('common.cancel')}</button>
      </form>
    </div>
  );
};
```

## Deployment

### Frontend Deployment

Build the frontend for production:

```bash
npm run build
```

This creates optimized files in the `dist/` directory that can be deployed to:

- Vercel
- Netlify
- AWS S3 + CloudFront
- Any static hosting service

### Backend Deployment

Build the backend for production:

```bash
cd backend
npm run build
```

This compiles TypeScript to JavaScript in the `dist/` directory. The backend can be deployed to:

- Heroku
- AWS Elastic Beanstalk
- DigitalOcean App Platform
- Any Node.js hosting service

### Environment Variables for Production

Ensure these environment variables are set in your production environment:

**Frontend**
```
VITE_API_URL=https://api.your-production-domain.com/api/v1
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
```

**Backend**
```
PORT=3001
NODE_ENV=production
MONGODB_URI=your_production_mongodb_uri
JWT_SECRET=your_production_jwt_secret
JWT_EXPIRES_IN=90d
EMAIL_FROM=your_production_email@example.com
SMTP_HOST=your_production_smtp_host
SMTP_PORT=587
SMTP_USERNAME=your_production_smtp_username
SMTP_PASSWORD=your_production_smtp_password
FRONTEND_URL=https://your-production-domain.com
```

## Troubleshooting

### Common Issues

#### Frontend Issues

1. **API Connection Errors**
   - Check if the backend server is running
   - Verify the `VITE_API_URL` environment variable
   - Check for CORS issues in the browser console

2. **Build Errors**
   - Check for TypeScript errors
   - Verify all dependencies are installed
   - Clear the node_modules folder and reinstall dependencies

#### Backend Issues

1. **Database Connection Errors**
   - Verify the MongoDB connection string
   - Check network connectivity to the MongoDB server
   - Ensure IP whitelist settings in MongoDB Atlas

2. **Authentication Issues**
   - Check JWT secret configuration
   - Verify token expiration settings
   - Check for clock synchronization issues

### Debugging Tips

1. **Frontend Debugging**
   - Use React DevTools browser extension
   - Add console.log statements for debugging
   - Use the browser's network tab to inspect API calls

2. **Backend Debugging**
   - Use logging with different log levels
   - Run in development mode for detailed error messages
   - Use Postman or Insomnia to test API endpoints directly

---

This developer guide provides a comprehensive overview of the development process for the DentalPro Manager application. For additional support or questions, please contact the development team.