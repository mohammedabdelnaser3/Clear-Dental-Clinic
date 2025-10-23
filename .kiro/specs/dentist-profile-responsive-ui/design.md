# Design Document

## Overview

This design document outlines the architecture and implementation approach for creating role-specific profile and settings pages for dentists, while implementing comprehensive responsive design patterns across the entire DentalPro Manager application. The solution maintains backward compatibility with existing patient pages while introducing dentist-specific functionality.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Application Layer                       │
│                         (App.tsx)                            │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ├─── Route: /profile
                       │    └─── RoleBasedProfile Component
                       │         ├─── DentistProfile (role: dentist)
                       │         └─── PatientProfile (role: patient)
                       │
                       ├─── Route: /settings
                       │    └─── RoleBasedSettings Component
                       │         ├─── DentistSettings (role: dentist)
                       │         └─── PatientSettings (role: patient)
                       │
                       └─── Responsive Layout System
                            ├─── Mobile (< 768px)
                            ├─── Tablet (768px - 1024px)
                            └─── Desktop (> 1024px)
```

### Component Hierarchy

```
RoleBasedProfile
├── DentistProfile
│   ├── ProfileHeader (with dentist info)
│   ├── ProfessionalInfoCard
│   ├── ClinicAffiliationsCard
│   ├── AvailabilityCard
│   ├── AppointmentsCard
│   └── QuickActionsCard
│
└── PatientProfile (existing)
    ├── ProfileHeader
    ├── AppointmentsCard
    ├── MedicalHistoryCard
    └── QuickActionsCard

RoleBasedSettings
├── DentistSettings
│   ├── SettingsHeader
│   ├── TabNavigation
│   ├── PersonalInfoSection
│   ├── ProfessionalInfoSection
│   ├── ClinicAssociationsSection
│   ├── AvailabilitySection
│   ├── SecuritySection
│   └── PreferencesSection
│
└── PatientSettings (existing)
    ├── SettingsHeader
    ├── TabNavigation
    ├── PersonalInfoSection
    ├── MedicalHistorySection
    ├── EmergencyContactSection
    ├── SecuritySection
    └── PreferencesSection
```

## Components and Interfaces

### 1. RoleBasedProfile Component

**Purpose:** Route users to the appropriate profile page based on their role.

**Props:**
```typescript
interface RoleBasedProfileProps {
  // No props needed - uses useAuth hook
}
```

**Implementation:**
```typescript
const RoleBasedProfile: React.FC = () => {
  const { user } = useAuth();
  
  if (!user) return <Navigate to="/login" />;
  
  return user.role === 'dentist' ? <DentistProfile /> : <PatientProfile />;
};
```

### 2. DentistProfile Component

**Purpose:** Display dentist-specific profile information with professional details.

**State Management:**
```typescript
interface DentistProfileState {
  dentist: Dentist | null;
  appointments: Appointment[];
  clinics: Clinic[];
  loading: boolean;
  error: string | null;
  activeTab: 'overview' | 'appointments' | 'clinics' | 'availability';
}
```

**Key Features:**
- Professional credentials display (specialization, license number)
- Bio and professional summary
- Clinic affiliations with locations
- Appointment statistics
- Availability calendar
- Quick actions (edit profile, manage schedule, view appointments)

**Responsive Behavior:**
- Mobile: Single column, stacked cards, collapsible sections
- Tablet: Two-column grid for stats, single column for main content
- Desktop: Three-column layout with sidebar

### 3. RoleBasedSettings Component

**Purpose:** Route users to the appropriate settings page based on their role.

**Implementation:**
```typescript
const RoleBasedSettings: React.FC = () => {
  const { user } = useAuth();
  
  if (!user) return <Navigate to="/login" />;
  
  return user.role === 'dentist' ? <DentistSettings /> : <PatientSettings />;
};
```

### 4. DentistSettings Component

**Purpose:** Provide comprehensive settings management for dentists.

**State Management:**
```typescript
interface DentistSettingsState {
  formData: {
    // Personal info
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    gender: string;
    address: Address;
    
    // Professional info
    specialization: string;
    licenseNumber: string;
    bio: string;
    yearsOfExperience: number;
    education: string[];
    certifications: string[];
    
    // Clinic associations
    clinicIds: string[];
    primaryClinicId: string;
  };
  activeSection: string;
  loading: boolean;
  uploadingImage: boolean;
  message: { type: 'success' | 'error'; text: string } | null;
  validationErrors: Record<string, string>;
}
```

**Sections:**
1. **Personal Information** - Basic user details
2. **Professional Information** - Credentials, specialization, bio
3. **Clinic Associations** - Manage clinic affiliations
4. **Availability** - Set working hours and availability
5. **Security** - Password change, 2FA settings
6. **Preferences** - Notifications, language, timezone

**Responsive Behavior:**
- Mobile: Vertical tab navigation, full-width forms, single-column inputs
- Tablet: Horizontal tab navigation, two-column forms where appropriate
- Desktop: Horizontal tab navigation, multi-column forms, sidebar navigation

### 5. Responsive Layout System

**Breakpoints:**
```typescript
const breakpoints = {
  mobile: '< 768px',
  tablet: '768px - 1024px',
  desktop: '> 1024px',
  wide: '> 1440px'
};
```

**Tailwind CSS Classes:**
```css
/* Mobile-first approach */
.responsive-grid {
  @apply grid grid-cols-1;
  @apply md:grid-cols-2;
  @apply lg:grid-cols-3;
  @apply xl:grid-cols-4;
}

.responsive-container {
  @apply container mx-auto px-4;
  @apply sm:px-6;
  @apply lg:px-8;
}

.responsive-card {
  @apply p-4;
  @apply sm:p-6;
  @apply lg:p-8;
}

.responsive-text {
  @apply text-sm;
  @apply sm:text-base;
  @apply lg:text-lg;
}
```

## Data Models

### Dentist Extended Model

```typescript
interface Dentist extends User {
  specialization: string;
  licenseNumber: string;
  bio: string;
  yearsOfExperience?: number;
  education?: string[];
  certifications?: string[];
  clinics: Clinic[];
  primaryClinicId?: string;
  availability?: {
    [clinicId: string]: {
      [day: string]: {
        start: string;
        end: string;
        breaks?: { start: string; end: string }[];
      }[];
    };
  };
  profileImage?: string;
  rating?: number;
  reviewCount?: number;
}
```

### User Model (Base)

```typescript
interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: 'patient' | 'dentist' | 'staff' | 'admin';
  dateOfBirth?: string;
  gender?: string;
  address?: Address;
  profileImage?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Address Model

```typescript
interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}
```

## Error Handling

### Error Types

1. **Authentication Errors (401)**
   - Redirect to login
   - Clear local storage
   - Display session expired message

2. **Authorization Errors (403)**
   - Display permission denied message
   - Redirect to appropriate page

3. **Not Found Errors (404)**
   - Display resource not found message
   - Provide navigation options

4. **Validation Errors (422)**
   - Display field-specific errors
   - Highlight invalid fields
   - Prevent form submission

5. **Network Errors**
   - Display connection error message
   - Provide retry option
   - Cache form data locally

### Error Display Strategy

```typescript
interface ErrorHandlingStrategy {
  // Toast notifications for quick feedback
  toast: {
    success: 3000ms,
    error: 4000ms,
    warning: 3500ms
  };
  
  // Inline errors for form validation
  inline: {
    position: 'below-field',
    style: 'text-red-600 text-sm mt-1'
  };
  
  // Alert banners for page-level errors
  banner: {
    position: 'top-of-content',
    dismissible: true,
    autoHide: false
  };
}
```

## Testing Strategy

### Unit Tests

1. **Component Tests**
   - RoleBasedProfile routing logic
   - RoleBasedSettings routing logic
   - DentistProfile data display
   - DentistSettings form validation
   - Responsive utility functions

2. **Hook Tests**
   - useAuth role detection
   - useResponsive breakpoint detection
   - Form state management hooks

3. **Utility Tests**
   - Validation functions
   - Data transformation functions
   - Responsive helper functions

### Integration Tests

1. **Profile Flow**
   - Dentist login → Profile page → Correct data display
   - Patient login → Profile page → Correct data display
   - Profile image upload → Success → Image display

2. **Settings Flow**
   - Navigate to settings → Correct role-based page
   - Update personal info → Save → Verify changes
   - Update professional info (dentist) → Save → Verify changes
   - Change password → Success → Login with new password

3. **Responsive Behavior**
   - Resize viewport → Layout adapts correctly
   - Mobile navigation → Menu collapses/expands
   - Touch interactions → Buttons respond correctly

### E2E Tests

1. **Complete User Journeys**
   - Dentist registration → Profile setup → Settings configuration
   - Patient registration → Profile setup → Settings configuration
   - Profile updates → Reflection across system

2. **Cross-Device Testing**
   - Mobile device testing (iOS Safari, Android Chrome)
   - Tablet testing (iPad, Android tablets)
   - Desktop testing (Chrome, Firefox, Safari, Edge)

### Responsive Testing Matrix

| Component | Mobile | Tablet | Desktop | Test Cases |
|-----------|--------|--------|---------|------------|
| DentistProfile | ✓ | ✓ | ✓ | Layout, navigation, image upload |
| DentistSettings | ✓ | ✓ | ✓ | Forms, tabs, validation |
| PatientProfile | ✓ | ✓ | ✓ | Layout, cards, actions |
| PatientSettings | ✓ | ✓ | ✓ | Forms, sections, medical history |
| Header | ✓ | ✓ | ✓ | Menu collapse, search, profile dropdown |
| Dashboard | ✓ | ✓ | ✓ | Grid layout, charts, cards |
| Appointments | ✓ | ✓ | ✓ | Calendar, list view, filters |
| Tables | ✓ | ✓ | ✓ | Horizontal scroll, card transformation |

## Responsive Design Patterns

### 1. Navigation Pattern

**Mobile:**
- Hamburger menu
- Full-screen overlay
- Bottom navigation bar (optional)
- Swipe gestures

**Tablet:**
- Collapsible sidebar
- Top navigation with dropdowns
- Breadcrumbs

**Desktop:**
- Full navigation bar
- Mega menus
- Persistent sidebar

### 2. Form Pattern

**Mobile:**
- Single column
- Full-width inputs
- Large touch targets (min 44x44px)
- Floating labels
- Bottom-fixed action buttons

**Tablet:**
- Two-column layout for related fields
- Grouped sections
- Inline validation

**Desktop:**
- Multi-column layout
- Inline labels
- Grouped sections with visual hierarchy
- Sticky action buttons

### 3. Table Pattern

**Mobile:**
- Card-based layout
- Vertical stacking
- Expandable rows
- Swipe actions

**Tablet:**
- Horizontal scroll
- Fixed first column
- Compact view

**Desktop:**
- Full table display
- Sortable columns
- Inline actions
- Pagination

### 4. Dashboard Pattern

**Mobile:**
- Vertical card stack
- Collapsible sections
- Priority-based ordering
- Pull-to-refresh

**Tablet:**
- 2-column grid
- Resizable cards
- Drag-and-drop (optional)

**Desktop:**
- 3-4 column grid
- Customizable layout
- Multiple widgets
- Real-time updates

## API Integration

### Endpoints

```typescript
// Dentist Profile
GET    /api/v1/dentists/:id
PUT    /api/v1/dentists/:id
POST   /api/v1/dentists/:id/upload-image
GET    /api/v1/dentists/:id/clinics
GET    /api/v1/dentists/:id/appointments
GET    /api/v1/dentists/:id/availability

// User Profile (shared)
GET    /api/v1/users/me
PUT    /api/v1/users/me
POST   /api/v1/users/me/upload-image
PUT    /api/v1/users/me/password

// Patient Profile (existing)
GET    /api/v1/patients/user/:userId
PUT    /api/v1/patients/:id
```

### Request/Response Examples

**Update Dentist Profile:**
```typescript
PUT /api/v1/dentists/:id
Request:
{
  firstName: "John",
  lastName: "Smith",
  phone: "+1234567890",
  specialization: "Orthodontics",
  licenseNumber: "DDS-12345",
  bio: "Experienced orthodontist...",
  address: {
    street: "123 Main St",
    city: "New York",
    state: "NY",
    zipCode: "10001",
    country: "US"
  }
}

Response:
{
  success: true,
  data: {
    id: "dentist-123",
    firstName: "John",
    lastName: "Smith",
    // ... full dentist object
  }
}
```

## Security Considerations

1. **Role-Based Access Control**
   - Verify user role on both client and server
   - Prevent unauthorized access to dentist-specific endpoints
   - Validate permissions for profile updates

2. **Data Validation**
   - Client-side validation for UX
   - Server-side validation for security
   - Sanitize all user inputs
   - Validate file uploads (type, size, content)

3. **Image Upload Security**
   - Validate file types (whitelist: jpg, png, gif)
   - Limit file size (max 5MB)
   - Scan for malware
   - Generate unique filenames
   - Store in secure location

4. **Session Management**
   - Refresh tokens on profile updates
   - Handle session expiration gracefully
   - Clear sensitive data on logout

## Performance Optimization

1. **Code Splitting**
   - Lazy load role-specific components
   - Split by route
   - Reduce initial bundle size

2. **Image Optimization**
   - Compress uploaded images
   - Generate multiple sizes (thumbnail, medium, large)
   - Use WebP format with fallbacks
   - Lazy load images

3. **Caching Strategy**
   - Cache user profile data
   - Invalidate on updates
   - Use SWR for data fetching

4. **Responsive Images**
   - Use srcset for different screen sizes
   - Serve appropriate image sizes
   - Implement progressive loading

## Accessibility

1. **Keyboard Navigation**
   - All interactive elements accessible via keyboard
   - Logical tab order
   - Focus indicators
   - Skip links

2. **Screen Reader Support**
   - Semantic HTML
   - ARIA labels and roles
   - Descriptive alt text
   - Form labels

3. **Touch Targets**
   - Minimum 44x44px on mobile
   - Adequate spacing between elements
   - Visual feedback on interaction

4. **Color Contrast**
   - WCAG AA compliance minimum
   - Sufficient contrast ratios
   - Don't rely solely on color

## Migration Strategy

1. **Phase 1: Create New Components**
   - Build DentistProfile component
   - Build DentistSettings component
   - Build RoleBasedProfile wrapper
   - Build RoleBasedSettings wrapper

2. **Phase 2: Update Routing**
   - Update App.tsx routes
   - Add role-based routing logic
   - Test routing for all user types

3. **Phase 3: Implement Responsive Design**
   - Update existing components with responsive classes
   - Test on multiple devices
   - Fix layout issues

4. **Phase 4: Testing & Refinement**
   - Comprehensive testing
   - Bug fixes
   - Performance optimization
   - Accessibility audit

5. **Phase 5: Deployment**
   - Deploy to staging
   - User acceptance testing
   - Deploy to production
   - Monitor for issues

## Design Decisions

### Why Role-Based Routing?

**Decision:** Use wrapper components (RoleBasedProfile, RoleBasedSettings) instead of conditional rendering within a single component.

**Rationale:**
- Cleaner separation of concerns
- Easier to maintain and test
- Better code splitting opportunities
- Simpler to add new roles in the future

### Why Mobile-First Responsive Design?

**Decision:** Implement mobile-first CSS with progressive enhancement.

**Rationale:**
- Majority of users access healthcare apps on mobile
- Easier to scale up than scale down
- Better performance on mobile devices
- Forces focus on essential features

### Why Separate Dentist and Patient Components?

**Decision:** Create separate components instead of a single component with role-based conditionals.

**Rationale:**
- Different data requirements
- Different UI/UX needs
- Easier to maintain
- Better performance (no unnecessary code loading)
- Clearer code organization

### Why Tailwind CSS for Responsive Design?

**Decision:** Use Tailwind's responsive utilities instead of custom media queries.

**Rationale:**
- Consistent breakpoints across application
- Faster development
- Smaller CSS bundle
- Better maintainability
- Built-in mobile-first approach
