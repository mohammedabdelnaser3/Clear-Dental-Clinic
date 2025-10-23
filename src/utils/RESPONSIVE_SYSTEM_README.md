# Responsive System Documentation

## Overview

The DentalPro Manager application includes a comprehensive responsive design system that provides hooks, utilities, and helper functions to create adaptive user interfaces across all device sizes.

## Quick Start

```tsx
import { useResponsive } from '@/hooks';
import { getGridColumns, getTouchTargetSize } from '@/utils/responsive';

function MyComponent() {
  const { isMobile, breakpoint } = useResponsive();
  const columns = getGridColumns(breakpoint);
  const touchSize = getTouchTargetSize(breakpoint);

  return (
    <div className={`grid grid-cols-${columns} gap-4`}>
      <button className={`btn ${touchSize}`}>
        {isMobile ? 'Tap' : 'Click'} Me
      </button>
    </div>
  );
}
```

## Architecture

### Breakpoints

The system uses four standard breakpoints:

| Breakpoint | Range | Use Case |
|------------|-------|----------|
| `mobile` | < 768px | Smartphones |
| `tablet` | 768px - 1024px | Tablets, small laptops |
| `desktop` | 1024px - 1440px | Standard desktops |
| `wide` | > 1440px | Large displays |

### File Structure

```
src/
├── hooks/
│   ├── useResponsive.ts          # Main breakpoint detection hook
│   ├── useMediaQuery.ts          # Custom media query hook
│   └── index.ts                  # Hook exports
├── utils/
│   ├── responsive.ts             # Helper functions and utilities
│   ├── RESPONSIVE_UTILITIES_GUIDE.md  # Detailed usage guide
│   └── RESPONSIVE_SYSTEM_README.md    # This file
└── components/
    └── examples/
        └── ResponsiveExample.tsx  # Example implementations
```

## Core Components

### 1. Hooks

#### useResponsive
Primary hook for detecting current breakpoint and screen size.

**Returns:**
- `isMobile`, `isTablet`, `isDesktop`, `isWide`: Boolean flags
- `breakpoint`: Current breakpoint name
- `width`: Current window width in pixels

#### useMediaQuery
Hook for custom CSS media queries.

**Parameters:**
- `query`: CSS media query string

**Returns:** Boolean indicating if query matches

#### Convenience Hooks
- `useIsMobile()`: Returns true if < 768px
- `useIsTablet()`: Returns true if 768px - 1024px
- `useIsDesktop()`: Returns true if >= 1024px
- `useIsWide()`: Returns true if >= 1440px
- `useIsTouchDevice()`: Returns true if touch is supported

### 2. Helper Functions

#### Breakpoint Checking
- `isBreakpoint(current, breakpoints)`: Check if current matches
- `isMobileOrTablet(breakpoint)`: Check if mobile or tablet
- `isDesktopOrWide(breakpoint)`: Check if desktop or wide

#### Responsive Values
- `getResponsiveValue(breakpoint, values)`: Get value for breakpoint
- `getGridColumns(breakpoint, config?)`: Get grid column count
- `getResponsiveSpacing(breakpoint, config?)`: Get spacing value

#### Conditional Rendering
- `shouldRender(breakpoint, showOn?, hideOn?)`: Determine if should render
- `getResponsiveClasses(breakpoint, classes)`: Get CSS classes

#### Touch Detection
- `isTouchSupported()`: Check touch support
- `isMobileDevice()`: Check if mobile via user agent
- `isTabletDevice()`: Check if tablet
- `getTouchTargetSize(breakpoint)`: Get touch target size class
- `getPointerType()`: Get pointer type (coarse/fine/none)
- `hasHoverCapability()`: Check hover support

#### Layout Utilities
- `getContainerMaxWidth(breakpoint)`: Get container max width
- `getResponsiveFontSize(breakpoint, size)`: Get font size class
- `getLayoutOrientation(breakpoint)`: Get layout orientation
- `getResponsiveGap(breakpoint)`: Get gap/spacing class

### 3. Constants

#### BREAKPOINTS
Object containing min/max values for each breakpoint:
```typescript
{
  mobile: { min: 0, max: 767 },
  tablet: { min: 768, max: 1023 },
  desktop: { min: 1024, max: 1439 },
  wide: { min: 1440, max: Infinity }
}
```

#### MEDIA_QUERIES
Predefined media query strings:
```typescript
{
  mobile: '(max-width: 767px)',
  tablet: '(min-width: 768px) and (max-width: 1023px)',
  desktop: '(min-width: 1024px) and (max-width: 1439px)',
  wide: '(min-width: 1440px)',
  minTablet: '(min-width: 768px)',
  minDesktop: '(min-width: 1024px)',
  minWide: '(min-width: 1440px)',
  maxMobile: '(max-width: 767px)',
  maxTablet: '(max-width: 1023px)',
  maxDesktop: '(max-width: 1439px)',
  touch: '(pointer: coarse)',
  hover: '(hover: hover)',
  portrait: '(orientation: portrait)',
  landscape: '(orientation: landscape)'
}
```

## Common Use Cases

### 1. Responsive Grid Layout

```tsx
import { useResponsive } from '@/hooks';
import { getGridColumns, getResponsiveGap } from '@/utils/responsive';

function ProductGrid({ products }) {
  const { breakpoint } = useResponsive();
  const columns = getGridColumns(breakpoint);
  const gap = getResponsiveGap(breakpoint);

  return (
    <div className={`grid grid-cols-${columns} ${gap}`}>
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
```

### 2. Conditional Component Rendering

```tsx
import { useResponsive } from '@/hooks';
import { shouldRender } from '@/utils/responsive';

function Dashboard() {
  const { breakpoint } = useResponsive();

  return (
    <div className="dashboard">
      {/* Show only on mobile */}
      {shouldRender(breakpoint, 'mobile') && <MobileHeader />}
      
      {/* Show on tablet and above */}
      {shouldRender(breakpoint, ['tablet', 'desktop', 'wide']) && <DesktopHeader />}
      
      {/* Hide on mobile */}
      {shouldRender(breakpoint, undefined, 'mobile') && <Sidebar />}
      
      <MainContent />
    </div>
  );
}
```

### 3. Touch-Optimized Interactions

```tsx
import { useResponsive, useIsTouchDevice } from '@/hooks';
import { getTouchTargetSize, hasHoverCapability } from '@/utils/responsive';

function ActionButton({ onClick, children }) {
  const { breakpoint } = useResponsive();
  const isTouch = useIsTouchDevice();
  const touchSize = getTouchTargetSize(breakpoint);
  const canHover = hasHoverCapability();

  return (
    <button
      onClick={onClick}
      className={`
        btn
        ${touchSize}
        ${canHover ? 'hover:bg-blue-700' : 'active:bg-blue-700'}
        ${isTouch ? 'active:scale-95 transition-transform' : ''}
      `}
    >
      {children}
    </button>
  );
}
```

### 4. Responsive Form Layout

```tsx
import { useResponsive } from '@/hooks';
import { getLayoutOrientation, getResponsiveGap } from '@/utils/responsive';

function ContactForm() {
  const { breakpoint } = useResponsive();
  const orientation = getLayoutOrientation(breakpoint);
  const gap = getResponsiveGap(breakpoint);

  return (
    <form className={`flex ${orientation === 'vertical' ? 'flex-col' : 'flex-row'} ${gap}`}>
      <div className="flex-1">
        <label>First Name</label>
        <input type="text" className="w-full" />
      </div>
      <div className="flex-1">
        <label>Last Name</label>
        <input type="text" className="w-full" />
      </div>
    </form>
  );
}
```

### 5. Adaptive Navigation

```tsx
import { useResponsive } from '@/hooks';
import { isMobileOrTablet } from '@/utils/responsive';

function Navigation() {
  const { breakpoint } = useResponsive();
  const [menuOpen, setMenuOpen] = useState(false);

  if (isMobileOrTablet(breakpoint)) {
    return (
      <MobileNav 
        isOpen={menuOpen} 
        onToggle={() => setMenuOpen(!menuOpen)} 
      />
    );
  }

  return <DesktopNav />;
}
```

### 6. Responsive Table/Card View

```tsx
import { useResponsive } from '@/hooks';

function DataList({ data }) {
  const { isMobile } = useResponsive();

  if (isMobile) {
    // Card view for mobile
    return (
      <div className="space-y-4">
        {data.map(item => (
          <DataCard key={item.id} data={item} />
        ))}
      </div>
    );
  }

  // Table view for larger screens
  return (
    <table className="w-full">
      <thead>
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {data.map(item => (
          <tr key={item.id}>
            <td>{item.name}</td>
            <td>{item.email}</td>
            <td>{item.status}</td>
            <td><Actions item={item} /></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

## Best Practices

### 1. Mobile-First Design
Always start with mobile layout and enhance for larger screens:

```tsx
// ✅ Good - Mobile first
<div className="flex-col md:flex-row lg:grid lg:grid-cols-3">

// ❌ Avoid - Desktop first
<div className="grid grid-cols-3 mobile:flex mobile:flex-col">
```

### 2. Performance Optimization
- Use specific hooks when you only need one value
- Memoize expensive calculations based on breakpoint
- Avoid unnecessary re-renders

```tsx
// ✅ Good - Only re-renders when mobile state changes
const isMobile = useIsMobile();

// ⚠️ Less optimal - Re-renders on any width change
const { width } = useResponsive();
```

### 3. Touch Target Sizes
Ensure all interactive elements are at least 44x44px on mobile:

```tsx
import { getTouchTargetSize } from '@/utils/responsive';

const touchSize = getTouchTargetSize(breakpoint);
<button className={`btn ${touchSize}`}>Click</button>
```

### 4. Accessibility
- Maintain logical tab order across breakpoints
- Ensure sufficient color contrast
- Test with keyboard navigation
- Verify screen reader compatibility

### 5. Testing
Test on real devices, not just browser dev tools:
- iOS Safari (iPhone, iPad)
- Android Chrome (various sizes)
- Different orientations
- Touch vs mouse interactions

### 6. Hover States
Don't rely on hover for critical functionality on touch devices:

```tsx
const canHover = hasHoverCapability();

{canHover ? (
  <HoverTooltip />
) : (
  <ClickTooltip />
)}
```

## Integration with Tailwind CSS

The responsive system works seamlessly with Tailwind's responsive utilities:

```tsx
function MyComponent() {
  const { breakpoint } = useResponsive();
  const gap = getResponsiveGap(breakpoint);

  return (
    <div className={`
      container mx-auto
      px-4 sm:px-6 lg:px-8
      ${gap}
    `}>
      {/* Tailwind responsive classes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {/* Content */}
      </div>
    </div>
  );
}
```

## Examples

See `src/components/examples/ResponsiveExample.tsx` for complete working examples including:
- Responsive grid layouts
- Conditional content rendering
- Touch-optimized buttons
- Responsive containers
- Adaptive navigation
- Responsive cards
- Dashboard layouts
- Form layouts

## Additional Documentation

- **Detailed Usage Guide**: `src/utils/RESPONSIVE_UTILITIES_GUIDE.md`
- **Example Components**: `src/components/examples/ResponsiveExample.tsx`
- **Hook Documentation**: See individual hook files in `src/hooks/`

## Troubleshooting

### Issue: Incorrect values on initial render
**Solution:** Hooks handle SSR correctly. Ensure you're not accessing `window` during SSR.

### Issue: Layout shifts during resize
**Solution:** Use CSS transitions and proper min/max constraints:
```css
.element {
  transition: all 0.3s ease;
  min-width: 0;
}
```

### Issue: Touch events not working
**Solution:** Check for touch support before adding listeners:
```tsx
if (isTouchSupported()) {
  element.addEventListener('touchstart', handler);
}
```

## Support

For questions or issues with the responsive system:
1. Check the detailed guide: `RESPONSIVE_UTILITIES_GUIDE.md`
2. Review example implementations: `ResponsiveExample.tsx`
3. Consult the design document: `.kiro/specs/dentist-profile-responsive-ui/design.md`

## Version History

- **v1.0.0** - Initial responsive system implementation
  - Core hooks (useResponsive, useMediaQuery)
  - Helper functions and utilities
  - Touch detection utilities
  - Layout helpers
  - Comprehensive documentation
