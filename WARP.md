# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Development Commands

### Frontend Development
```bash
# Start development server (Vite on port 5173)
npm run dev

# Build for production (TypeScript compilation + Vite build)
npm run build

# Run linter
npm run lint

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Preview production build
npm run preview

# Check translation coverage
npm run check:translations
```

### Backend Development
```bash
cd backend

# Start development server with nodemon (port 3001)
npm run dev

# Build TypeScript to JavaScript
npm run build

# Run production build
npm start

# Run linter
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Run tests
npm test

# Seed database with sample data
npm run seed

# Reset and seed database
npm run seed:reset

# Seed specific data types
npm run seed:admin
npm run seed:medications
npm run seed:multibranch
```

### Running Tests
- Frontend tests use Jest with React Testing Library in jsdom environment
- Backend tests use Jest with ts-jest in node environment
- Test files are located in `__tests__` directories or named `*.test.ts(x)` or `*.spec.ts(x)`
- Use `npm test -- path/to/test-file.test.ts` to run a single test file

## Project Architecture

### Monorepo Structure
This is a monorepo with the frontend at the root and backend in the `backend/` directory:
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript + MongoDB

### Authentication & Authorization
- JWT-based authentication with Firebase Auth integration
- User roles: admin, dentist, patient, staff
- Protected routes use `ProtectedRoute` component with optional `requiredRole` prop
- Auth state managed via `AuthContext` with `useAuth()` hook
- Backend auth middleware validates JWT tokens

### Frontend Architecture

#### Component Organization
Components are organized by **feature/domain** (not by component type):
- `components/appointment/` - Appointment-related components
- `components/patient/` - Patient management components
- `components/billing/` - Billing components
- `components/medications/` - Medication components
- `components/prescriptions/` - Prescription components
- `components/clinic/` - Clinic management components
- `components/dashboard/` - Dashboard components
- `components/layout/` - Layout components (Header, Footer, Sidebar)
- `components/auth/` - Auth components (ProtectedRoute, RoleBasedProfile)
- `components/common/` - Shared/reusable components
- `components/ui/` - Base UI components (Button, Modal, Table, Tabs)

#### Pages & Routing
- Pages are in `pages/` organized by feature
- Routes defined in `App.tsx`
- **IMPORTANT**: Specific routes must be defined BEFORE parameterized routes
  - ✅ Correct: `/appointments/create` before `/appointments/:id`
  - ❌ Wrong: `/appointments/:id` before `/appointments/create` (will break routing)
- Public routes: `/`, `/about`, `/services`, `/contact`, `/privacy`, `/terms`
- Auth routes: `/login`, `/register`, `/forgot-password`, `/reset-password`
- Protected routes: `/dashboard`, `/appointments`, `/patients`, `/medications`, etc.
- Admin-only routes: `/admin/*`, `/clinics` (require admin role)

#### State Management
- **React Context API** for global state
- Key contexts:
  - `AuthContext` - User authentication state
  - `ClinicContext` - Multi-clinic management
  - `LanguageContext` - i18n language switching
  - `NotificationContext` - Real-time notifications
  - `AppProvider` - Wraps all context providers

#### API Integration
- Services in `services/` directory (e.g., `appointmentService.ts`, `patientService.ts`)
- Base API client in `services/api.ts` with Axios
- WebSocket integration via `websocketService.ts` for real-time updates
- API base URL: `http://localhost:3001/api/v1` (configurable via `VITE_API_URL`)

#### Responsive Design System
A comprehensive responsive system exists with hooks and utilities:
- **Hooks**: `useResponsive()`, `useMediaQuery()`, `useIsMobile()`, `useIsTablet()`, `useIsDesktop()`, `useIsTouchDevice()`
- **Breakpoints**: mobile (<768px), tablet (768-1024px), desktop (1024-1440px), wide (>1440px)
- **Utilities** in `utils/responsive.ts`: `getGridColumns()`, `getTouchTargetSize()`, `shouldRender()`, etc.
- Follow **mobile-first** design approach
- See `src/utils/RESPONSIVE_SYSTEM_README.md` for comprehensive guide

#### Internationalization (i18n)
- Uses **i18next** with English and Arabic support
- Translation files in `public/locales/{en,ar}/`
- Language switching via `LanguageContext`
- **RTL support** for Arabic
- Use translation keys via `useTranslation()` hook: `const { t } = useTranslation();`
- Check translation coverage with `npm run check:translations`

### Backend Architecture

#### API Structure
- RESTful API with versioned endpoints: `/api/v1/*`
- Main routes in `backend/src/routes/`:
  - `/auth` - Authentication (login, register, password reset)
  - `/users` - User management
  - `/patients` - Patient records and medical history
  - `/clinics` - Clinic management (admin only)
  - `/appointments` - Appointment scheduling
  - `/treatments` - Treatment records
  - `/medications` - Medication catalog
  - `/prescriptions` - Digital prescriptions
  - `/billing` - Billing and payments
  - `/staff-schedules` - Staff scheduling
  - `/admin` - Admin operations

#### MVC Pattern
- **Models** (`models/`): Mongoose schemas (User, Patient, Appointment, Clinic, etc.)
- **Controllers** (`controllers/`): Request handlers, business logic delegation
- **Services** (`services/`): Reusable business logic (NotificationService, PayPalService, StripeService)
- **Middleware** (`middleware/`): Auth, validation, error handling, rate limiting
- **Routes** (`routes/`): Route definitions and middleware binding

#### Real-time Features
- **Socket.io** integration for real-time updates
- WebSocket initialization in `server.ts` via `initWebSocket()`
- WebSocket utilities in `utils/websocket.ts` and `utils/websocketInstance.ts`

#### Security
- Helmet for security headers
- CORS with whitelist (localhost:3000, 5173, 5174, 5175)
- Rate limiting (general + stricter auth rate limits)
- express-mongo-sanitize against NoSQL injection
- HPP (HTTP Parameter Pollution) prevention
- JWT token validation

#### Database
- **MongoDB** with Mongoose ODM
- Database connection in `config/database.ts`
- Seeders in `seeders/` for sample data
- Path aliases: `@/*` maps to `./src/*`

### Key Technical Patterns

#### Error Handling
- Frontend: `ErrorBoundary` component wraps the entire app
- Frontend: Toast notifications via `react-hot-toast`
- Frontend: Global error handler in `utils/errorHandler.ts`
- Backend: Global error handler middleware in `middleware/errorHandler.ts`
- Backend: `AppError` class for custom errors
- Backend: `asyncHandler` wrapper for async route handlers

#### Form Handling
- **React Hook Form** with **Zod** validation
- Form schemas defined with Zod for type-safe validation
- Error messages displayed inline

#### Path Aliases
- Frontend: `@/` → `./src/`
- Backend: `@/` → `./src/`, plus specific aliases like `@/models/*`, `@/controllers/*`

#### TypeScript Configuration
- Frontend: Strict mode disabled for flexibility (see `tsconfig.json`)
- Backend: Strict mode disabled (see `backend/tsconfig.json`)
- Type definitions in dedicated `types/` directories

## Important Development Notes

### Routing Best Practice
When adding new routes in `App.tsx`, always define specific routes BEFORE parameterized routes:
```tsx
// ✅ Correct order
<Route path="/appointments/create" element={...} />
<Route path="/appointments/:id" element={...} />

// ❌ Wrong order - will break /appointments/create
<Route path="/appointments/:id" element={...} />
<Route path="/appointments/create" element={...} />
```

### Multi-Clinic Support
This system supports multiple dental clinic locations:
- Centralized management via `/admin/multi-clinic` dashboard
- Clinic selection and switching via `ClinicContext`
- Cross-clinic patient records and staff scheduling
- Unified reporting and analytics

### Performance Optimizations
- Console error handling setup in `utils/consoleUtils.ts`
- Performance optimizations initialized in `utils/preloader.ts`
- Vite HMR with polling for hot reload
- Chunk size warning limit: 1000kb

### Testing Guidelines
- Frontend tests: Place in `__tests__/` or name `*.test.tsx`
- Backend tests: Place in `__tests__/` or name `*.test.ts`
- Use Jest matchers and React Testing Library queries
- Mock external dependencies (API calls, Firebase)
- Test coverage reports in `coverage/` directory

### Environment Variables
Required environment variables are documented in:
- Frontend `.env.example` or README (API URL, Firebase config)
- Backend `.env.example` or README (MongoDB URI, JWT secret, email config, etc.)

## Working with the Codebase

### Adding a New Feature
1. **Frontend**:
   - Create components in appropriate feature directory
   - Add types in `types/`
   - Create service functions in `services/`
   - Add page component in `pages/`
   - Add route in `App.tsx` (remember route ordering!)
   - Add translations in `public/locales/{en,ar}/`

2. **Backend**:
   - Create Mongoose model in `models/`
   - Create controller in `controllers/`
   - Add routes in `routes/`
   - Add validation middleware if needed
   - Update API documentation

### Code Style
- Use **functional components** with hooks (no class components)
- Use **TypeScript interfaces** for props and data types
- Use **TailwindCSS** utility classes for styling
- Follow **mobile-first** responsive design
- Use **async/await** for asynchronous operations
- Implement proper **error handling** for all API calls

### Common Gotchas
- Ensure TypeScript files use `.ts` or `.tsx` extensions
- Import paths use `@/` alias for src imports
- React Router v6 syntax (not v5)
- Vite uses `import.meta.env` (not `process.env`) for environment variables in frontend
- Backend runs on port 3001, frontend on 5173
- MongoDB connection string must be valid and accessible

## Documentation Files
The project has extensive documentation:
- `README.md` - Project overview and features
- `DEVELOPER_GUIDE.md` - Detailed development guide
- `API_DOCUMENTATION.md` - API endpoint documentation
- `USER_GUIDE.md` - End-user instructions
- `DOCUMENTATION.md` - Technical architecture documentation
- `.kiro/steering/*.md` - Product, tech stack, and structure guidance
- `src/utils/RESPONSIVE_SYSTEM_README.md` - Responsive design system
