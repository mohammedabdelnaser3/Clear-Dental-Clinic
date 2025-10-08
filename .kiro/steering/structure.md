---
inclusion: always
---

# Project Structure

## Monorepo Layout

```
/                       # Frontend root
├── backend/            # Backend API server
├── src/                # Frontend source code
├── public/             # Static assets
└── dist/               # Frontend build output
```

## Frontend Structure (`src/`)

```
src/
├── assets/             # Static assets (images, icons)
├── components/         # React components (organized by feature)
│   ├── appointment/    # Appointment-related components
│   ├── auth/           # Authentication components
│   ├── billing/        # Billing components
│   ├── clinic/         # Clinic management components
│   ├── common/         # Shared/common components
│   ├── dashboard/      # Dashboard components
│   ├── layout/         # Layout components (Header, Footer, etc.)
│   ├── medications/    # Medication components
│   ├── patient/        # Patient management components
│   ├── prescriptions/  # Prescription components
│   ├── ui/             # Reusable UI components
│   └── ...             # Other feature-specific folders
├── config/             # Configuration files
├── context/            # React Context providers
├── hooks/              # Custom React hooks
├── i18n/               # Internationalization setup
├── locales/            # Translation files
├── pages/              # Page components (route-level)
│   ├── auth/           # Auth pages (Login, Register, etc.)
│   ├── dashboard/      # Dashboard pages
│   ├── appointment/    # Appointment pages
│   ├── patient/        # Patient pages
│   └── ...             # Other page folders
├── services/           # API service functions
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
├── App.tsx             # Main application component
└── main.tsx            # Application entry point
```

## Backend Structure (`backend/src/`)

```
backend/src/
├── config/             # Configuration (database, etc.)
├── controllers/        # Request handlers
├── middleware/         # Express middleware
├── models/             # Mongoose models
├── routes/             # API route definitions
├── scripts/            # Utility scripts
├── seeders/            # Database seeders
├── services/           # Business logic services
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
├── app.ts              # Express app setup
└── server.ts           # Server entry point
```

## Key Conventions

### Component Organization
- Components are organized by feature/domain (appointment, patient, billing, etc.)
- Shared/reusable components go in `components/common/` or `components/ui/`
- Page-level components go in `pages/` and correspond to routes

### Routing Structure
- Public routes: `/`, `/about`, `/services`, `/contact`, etc.
- Auth routes: `/login`, `/register`, `/forgot-password`, `/reset-password`
- Protected routes: `/dashboard`, `/appointments`, `/patients`, `/medications`, etc.
- Admin routes: `/admin/*`, `/clinics` (require admin role)
- Specific routes must be defined before parameterized routes (e.g., `/appointments/create` before `/appointments/:id`)

### API Structure
- RESTful API with versioned endpoints: `/api/v1/*`
- Routes: `/auth`, `/users`, `/patients`, `/clinics`, `/appointments`, `/treatments`, `/medications`, `/prescriptions`, `/billing`, `/admin`, `/staff-schedules`

### File Naming
- React components: PascalCase (e.g., `PatientCard.tsx`)
- Utilities/services: camelCase (e.g., `apiService.ts`)
- Types: PascalCase (e.g., `Patient.ts`)
- Pages: PascalCase matching route name

### TypeScript
- Strict mode disabled for flexibility
- Type definitions in dedicated `types/` folders
- Interface/type exports from index files

### Styling
- Tailwind CSS utility classes
- Responsive design with mobile-first approach
- Consistent spacing and color schemes

### State Management
- React Context API for global state (auth, theme, etc.)
- Local state with useState/useReducer for component-specific state
- Custom hooks for reusable stateful logic

### Error Handling
- ErrorBoundary component wraps the entire app
- Toast notifications for user feedback (react-hot-toast)
- Global error handler middleware in backend

### Internationalization
- i18next for translations
- Language files in `public/locales/` (en, ar)
- Language switcher in UI
- RTL support for Arabic
