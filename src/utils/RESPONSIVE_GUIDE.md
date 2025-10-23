# Responsive Design Guide

This guide explains how to use the responsive utilities, hooks, and components in the DentalPro Manager application.

## Breakpoints

The application uses the following breakpoints:

- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: 1024px - 1440px
- **Wide**: ≥ 1440px

## Hooks

### useResponsive

Detects the current responsive breakpoint and provides boolean flags.

```typescript
import { useResponsive } from '@/hooks';

function MyComponent() {
  const { isMobile, isTablet, isDesktop, isWide, breakpoint, width } = useResponsive();
  
  return (
    <div>
      {isMobile && <MobileView />}
      {isDesktop && <DesktopView />}
      <p>Current breakpoint: {breakpoint}</p>
      <p>Window width: {width}px</p>
    </div>
  );
}
```

### useMediaQuery

Custom media query detection for specific conditions.

```typescript
import { useMediaQuery } from '@/hooks';

function MyComponent() {
  const isLandscape = useMediaQuery('(orientation: landscape)');
  const isPrint = useMediaQuery('print');
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  
  return <div>{isLandscape ? 'Landscape' : 'Portrait'}</div>;
}
```

### Predefined Media Query Hooks

```typescript
import { useIsMobile, useIsTablet, useIsDesktop, useIsWide, useIsTouchDevice } from '@/hooks';

function MyComponent() {
  const isMobile = useIsMobile();
  const isTouch = useIsTouchDevice();
  
  return (
    <button className={isTouch ? 'min-h-[44px]' : 'min-h-[36px]'}>
      Click me
    </button>
  );
}
```

## Utility Functions

### getResponsiveValue

Get different values based on the current breakpoint.

```typescript
import { getResponsiveValue } from '@/utils';

const columns = getResponsiveValue({
  mobile: 1,
  tablet: 2,
  desktop: 3,
  wide: 4
});
```

### Breakpoint Checks

```typescript
import { isBreakpoint, isBreakpointOrBelow, isBreakpointOrAbove } from '@/utils';

if (isBreakpoint('mobile')) {
  // Mobile-specific logic
}

if (isBreakpointOrBelow('tablet')) {
  // Mobile or tablet
}

if (isBreakpointOrAbove('desktop')) {
  // Desktop or wide
}
```

## Responsive Classes

### Using Predefined Classes

```typescript
import { responsiveClasses } from '@/utils';

function MyComponent() {
  return (
    <div className={responsiveClasses.containerPadding}>
      <div className={responsiveClasses.grid1to3}>
        <Card className={responsiveClasses.cardPadding}>
          <h2 className={responsiveClasses.textLg}>Title</h2>
        </Card>
      </div>
    </div>
  );
}
```

### Available Responsive Classes

- `containerPadding`: `px-4 sm:px-6 lg:px-8`
- `cardPadding`: `px-4 py-3 sm:px-6 sm:py-4`
- `grid1to2`: Single column on mobile, 2 columns on desktop
- `grid1to3`: Single column on mobile, 2 on tablet, 3 on desktop
- `grid1to4`: Responsive 4-column grid
- `gapSm`, `gapMd`, `gapLg`: Responsive gap spacing
- `textSm`, `textBase`, `textLg`, `textXl`: Responsive text sizes
- `touchTarget`: Minimum 44x44px on mobile for touch
- `buttonPadding`: Touch-friendly button padding
- `inputPadding`: Touch-friendly input padding
- `modalPosition`: Modal positioning (bottom on mobile, center on desktop)
- `tableCellPadding`: Responsive table cell padding

## Component Usage

### Card Component

Cards automatically adjust padding based on screen size.

```typescript
<Card title="My Card" subtitle="Subtitle">
  Content here
</Card>
```

### Button Component

Buttons have touch-friendly sizes on mobile (minimum 44x44px).

```typescript
<Button size="sm">Small Button</Button>
<Button size="md">Medium Button</Button>
<Button size="lg">Large Button</Button>
```

### Modal Component

Modals display full-screen on mobile and centered on larger screens.

```typescript
<Modal
  isOpen={isOpen}
  onClose={handleClose}
  title="My Modal"
  size="md" // sm, md, lg, xl, full
>
  Modal content
</Modal>
```

### Table Component

Tables support horizontal scroll on mobile or card view transformation.

```typescript
// Standard table with horizontal scroll
<Table
  columns={columns}
  data={data}
  keyExtractor={(item) => item.id}
/>

// Card view on mobile, table on desktop
<Table
  columns={columns}
  data={data}
  keyExtractor={(item) => item.id}
  mobileCardView={true}
  cardRenderer={(item) => (
    <div>
      <h3>{item.name}</h3>
      <p>{item.description}</p>
    </div>
  )}
/>
```

### Form Components

All form components (Input, Select, Textarea, Checkbox, Radio) are touch-friendly on mobile.

```typescript
<Input
  label="Email"
  type="email"
  placeholder="Enter email"
/>

<Select
  label="Country"
  options={countries}
  size="md"
/>

<Textarea
  label="Description"
  rows={4}
/>

<Checkbox
  label="I agree to terms"
/>

<Radio
  label="Gender"
  options={[
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' }
  ]}
/>
```

## Best Practices

### 1. Mobile-First Approach

Always design for mobile first, then enhance for larger screens.

```typescript
// Good
<div className="text-sm sm:text-base lg:text-lg">

// Avoid
<div className="text-lg md:text-base sm:text-sm">
```

### 2. Touch Targets

Ensure interactive elements are at least 44x44px on mobile.

```typescript
<button className="min-h-[44px] min-w-[44px] sm:min-h-[36px] sm:min-w-[36px]">
  Click
</button>
```

### 3. Responsive Spacing

Use responsive padding and margins.

```typescript
<div className="p-4 sm:p-6 lg:p-8">
  <div className="space-y-3 sm:space-y-4 lg:space-y-6">
    {/* Content */}
  </div>
</div>
```

### 4. Conditional Rendering

Use hooks for conditional rendering based on screen size.

```typescript
const { isMobile } = useResponsive();

return (
  <>
    {isMobile ? (
      <MobileNavigation />
    ) : (
      <DesktopNavigation />
    )}
  </>
);
```

### 5. Grid Layouts

Use responsive grid classes for layouts.

```typescript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map(item => (
    <Card key={item.id}>{item.content}</Card>
  ))}
</div>
```

### 6. Text Sizing

Use responsive text sizes for better readability.

```typescript
<h1 className="text-2xl sm:text-3xl lg:text-4xl">
  Heading
</h1>
<p className="text-sm sm:text-base">
  Body text
</p>
```

### 7. Form Layouts

Stack form fields on mobile, use columns on larger screens.

```typescript
<form className="space-y-4">
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <Input label="First Name" />
    <Input label="Last Name" />
  </div>
  <Input label="Email" />
</form>
```

## Testing Responsive Design

### Browser DevTools

1. Open Chrome/Firefox DevTools (F12)
2. Click the device toolbar icon (Ctrl+Shift+M)
3. Test different device sizes
4. Test touch interactions

### Recommended Test Sizes

- **Mobile**: 375x667 (iPhone SE), 390x844 (iPhone 12)
- **Tablet**: 768x1024 (iPad), 820x1180 (iPad Air)
- **Desktop**: 1280x720, 1920x1080

### Touch Testing

Test on actual devices when possible:
- iOS Safari (iPhone, iPad)
- Android Chrome (various devices)
- Ensure all interactive elements are easily tappable

## Common Patterns

### Responsive Navigation

```typescript
const { isMobile } = useResponsive();

return (
  <nav>
    {isMobile ? (
      <HamburgerMenu />
    ) : (
      <FullNavigation />
    )}
  </nav>
);
```

### Responsive Sidebar

```typescript
<div className="flex flex-col lg:flex-row">
  <aside className="w-full lg:w-64 mb-4 lg:mb-0">
    Sidebar
  </aside>
  <main className="flex-1">
    Main content
  </main>
</div>
```

### Responsive Cards

```typescript
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
  {items.map(item => (
    <Card key={item.id} className="h-full">
      {item.content}
    </Card>
  ))}
</div>
```

### Responsive Modals

```typescript
<Modal
  isOpen={isOpen}
  onClose={handleClose}
  size="md"
  className="max-h-[90vh] overflow-y-auto"
>
  {/* Modal slides up from bottom on mobile, centered on desktop */}
  Content
</Modal>
```
