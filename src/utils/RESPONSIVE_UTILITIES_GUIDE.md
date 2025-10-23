# Responsive Utilities Guide

This guide documents the responsive utility hooks and helper functions available in the DentalPro Manager application.

## Table of Contents

1. [Hooks](#hooks)
2. [Helper Functions](#helper-functions)
3. [Usage Examples](#usage-examples)
4. [Best Practices](#best-practices)

---

## Hooks

### useResponsive

Detects the current responsive breakpoint and provides boolean flags for each breakpoint.

**Breakpoints:**
- `mobile`: < 768px
- `tablet`: 768px - 1024px
- `desktop`: 1024px - 1440px
- `wide`: > 1440px

**Returns:**
```typescript
{
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isWide: boolean;
  breakpoint: 'mobile' | 'tablet' | 'desktop' | 'wide';
  width: number;
}
```

**Example:**
```tsx
import { useResponsive } from '@/hooks';

function MyComponent() {
  const { isMobile, breakpoint, width } = useResponsive();

  return (
    <div>
      {isMobile ? (
        <MobileLayout />
      ) : (
        <DesktopLayout />
      )}
      <p>Current breakpoint: {breakpoint}</p>
      <p>Window width: {width}px</p>
    </div>
  );
}
```

---

### useMediaQuery

Custom hook for detecting any CSS media query.

**Parameters:**
- `query` (string): CSS media query string

**Returns:** `boolean` - true if the media query matches

**Example:**
```tsx
import { useMediaQuery } from '@/hooks';

function MyComponent() {
  const isLandscape = useMediaQuery('(orientation: landscape)');
  const isPrint = useMediaQuery('print');
  const isDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  return (
    <div>
      {isLandscape && <p>Landscape mode</p>}
      {isDarkMode && <p>Dark mode preferred</p>}
    </div>
  );
}
```

---

### Predefined Media Query Hooks

Convenience hooks for common breakpoints:

```tsx
import { 
  useIsMobile, 
  useIsTablet, 
  useIsDesktop, 
  useIsWide,
  useIsTouchDevice 
} from '@/hooks';

function MyComponent() {
  const isMobile = useIsMobile();        // < 768px
  const isTablet = useIsTablet();        // 768px - 1024px
  const isDesktop = useIsDesktop();      // >= 1024px
  const isWide = useIsWide();            // >= 1440px
  const isTouch = useIsTouchDevice();    // Touch support

  return (
    <div>
      {isMobile && <MobileNav />}
      {isTouch && <TouchOptimizedButton />}
    </div>
  );
}
```

---

## Helper Functions

### Breakpoint Checking

#### isBreakpoint
Check if current breakpoint matches any of the provided breakpoints.

```tsx
import { isBreakpoint } from '@/utils/responsive';

const current = 'mobile';
isBreakpoint(current, 'mobile'); // true
isBreakpoint(current, ['mobile', 'tablet']); // true
isBreakpoint(current, 'desktop'); // false
```

#### isMobileOrTablet
```tsx
import { isMobileOrTablet } from '@/utils/responsive';

isMobileOrTablet('mobile'); // true
isMobileOrTablet('tablet'); // true
isMobileOrTablet('desktop'); // false
```

#### isDesktopOrWide
```tsx
import { isDesktopOrWide } from '@/utils/responsive';

isDesktopOrWide('desktop'); // true
isDesktopOrWide('wide'); // true
isDesktopOrWide('mobile'); // false
```

---

### Responsive Values

#### getResponsiveValue
Get different values based on current breakpoint.

```tsx
import { getResponsiveValue } from '@/utils/responsive';

const columns = getResponsiveValue(breakpoint, {
  mobile: 1,
  tablet: 2,
  desktop: 3,
  wide: 4,
  default: 2
});

const buttonSize = getResponsiveValue(breakpoint, {
  mobile: 'large',
  default: 'medium'
});
```

#### getGridColumns
Get number of columns for grid layout.

```tsx
import { getGridColumns } from '@/utils/responsive';

// Using defaults (mobile: 1, tablet: 2, desktop: 3, wide: 4)
const columns = getGridColumns(breakpoint);

// Custom configuration
const columns = getGridColumns(breakpoint, {
  mobile: 1,
  tablet: 3,
  desktop: 4,
  wide: 5
});
```

#### getResponsiveSpacing
Get spacing values based on breakpoint.

```tsx
import { getResponsiveSpacing } from '@/utils/responsive';

const padding = getResponsiveSpacing(breakpoint);
// Returns: '4' (mobile), '6' (tablet), '8' (desktop), '10' (wide)

// Custom spacing
const margin = getResponsiveSpacing(breakpoint, {
  mobile: '2',
  tablet: '4',
  desktop: '6',
  wide: '8'
});
```

---

### Conditional Rendering

#### shouldRender
Determine if component should render based on breakpoint.

```tsx
import { shouldRender } from '@/utils/responsive';

// Show only on mobile
if (shouldRender(breakpoint, 'mobile')) {
  return <MobileOnlyComponent />;
}

// Show on mobile and tablet
if (shouldRender(breakpoint, ['mobile', 'tablet'])) {
  return <SmallScreenComponent />;
}

// Hide on mobile
if (shouldRender(breakpoint, undefined, 'mobile')) {
  return <DesktopComponent />;
}

// Show on desktop, hide on tablet
if (shouldRender(breakpoint, ['desktop', 'wide'], 'tablet')) {
  return <LargeScreenComponent />;
}
```

#### getResponsiveClasses
Get CSS classes based on breakpoint.

```tsx
import { getResponsiveClasses } from '@/utils/responsive';

const className = getResponsiveClasses(breakpoint, {
  mobile: 'flex-col space-y-2',
  tablet: 'flex-row space-x-4',
  desktop: 'grid grid-cols-3 gap-6',
  default: 'flex'
});
```

---

### Touch Detection

#### isTouchSupported
Check if device supports touch events.

```tsx
import { isTouchSupported } from '@/utils/responsive';

if (isTouchSupported()) {
  // Add touch-specific event listeners
  element.addEventListener('touchstart', handleTouch);
} else {
  // Add mouse event listeners
  element.addEventListener('mousedown', handleMouse);
}
```

#### isMobileDevice
Check if device is likely a mobile device based on user agent.

```tsx
import { isMobileDevice } from '@/utils/responsive';

if (isMobileDevice()) {
  // Load mobile-specific features
  loadMobileApp();
}
```

#### isTabletDevice
Check if device is likely a tablet.

```tsx
import { isTabletDevice } from '@/utils/responsive';

if (isTabletDevice()) {
  // Optimize for tablet layout
  setTabletLayout();
}
```

#### getTouchTargetSize
Get appropriate touch target size class (minimum 44x44px on mobile).

```tsx
import { getTouchTargetSize } from '@/utils/responsive';

const touchClass = getTouchTargetSize(breakpoint);
// Returns: 'min-h-[44px] min-w-[44px]' on mobile, '' otherwise

<button className={`btn ${touchClass}`}>
  Click Me
</button>
```

#### getPointerType
Detect pointer type (touch vs mouse).

```tsx
import { getPointerType } from '@/utils/responsive';

const pointerType = getPointerType();
// Returns: 'coarse' (touch), 'fine' (mouse), or 'none'

if (pointerType === 'coarse') {
  // Optimize for touch interaction
  setLargerHitAreas();
}
```

#### hasHoverCapability
Check if device supports hover.

```tsx
import { hasHoverCapability } from '@/utils/responsive';

if (hasHoverCapability()) {
  // Enable hover effects
  enableHoverStates();
} else {
  // Use tap/click interactions only
  disableHoverStates();
}
```

---

### Layout Utilities

#### getContainerMaxWidth
Get container max width based on breakpoint.

```tsx
import { getContainerMaxWidth } from '@/utils/responsive';

const maxWidth = getContainerMaxWidth(breakpoint);
// Returns: 'max-w-full', 'max-w-3xl', 'max-w-5xl', or 'max-w-7xl'

<div className={`container mx-auto ${maxWidth}`}>
  Content
</div>
```

#### getResponsiveFontSize
Get responsive font size class.

```tsx
import { getResponsiveFontSize } from '@/utils/responsive';

const fontSize = getResponsiveFontSize(breakpoint, 'xl');
// Mobile: 'text-lg', Others: 'text-xl'

<h1 className={fontSize}>Title</h1>
```

#### getLayoutOrientation
Determine layout orientation.

```tsx
import { getLayoutOrientation } from '@/utils/responsive';

const orientation = getLayoutOrientation(breakpoint);
// Returns: 'vertical' (mobile) or 'horizontal' (tablet+)

<div className={orientation === 'vertical' ? 'flex-col' : 'flex-row'}>
  Content
</div>
```

#### getResponsiveGap
Get responsive gap/spacing between elements.

```tsx
import { getResponsiveGap } from '@/utils/responsive';

const gap = getResponsiveGap(breakpoint);
// Returns: 'gap-3', 'gap-4', 'gap-6', or 'gap-8'

<div className={`flex ${gap}`}>
  <div>Item 1</div>
  <div>Item 2</div>
</div>
```

---

### Constants

#### BREAKPOINTS
Breakpoint ranges for reference.

```tsx
import { BREAKPOINTS } from '@/utils/responsive';

console.log(BREAKPOINTS.mobile);  // { min: 0, max: 767 }
console.log(BREAKPOINTS.tablet);  // { min: 768, max: 1023 }
console.log(BREAKPOINTS.desktop); // { min: 1024, max: 1439 }
console.log(BREAKPOINTS.wide);    // { min: 1440, max: Infinity }
```

#### MEDIA_QUERIES
Predefined media query strings.

```tsx
import { MEDIA_QUERIES } from '@/utils/responsive';

const isMobile = useMediaQuery(MEDIA_QUERIES.mobile);
const isTouch = useMediaQuery(MEDIA_QUERIES.touch);
const hasHover = useMediaQuery(MEDIA_QUERIES.hover);
const isPortrait = useMediaQuery(MEDIA_QUERIES.portrait);
```

---

## Usage Examples

### Example 1: Responsive Card Grid

```tsx
import { useResponsive } from '@/hooks';
import { getGridColumns, getResponsiveGap } from '@/utils/responsive';

function CardGrid({ items }) {
  const { breakpoint } = useResponsive();
  const columns = getGridColumns(breakpoint);
  const gap = getResponsiveGap(breakpoint);

  return (
    <div className={`grid grid-cols-${columns} ${gap}`}>
      {items.map(item => (
        <Card key={item.id} data={item} />
      ))}
    </div>
  );
}
```

### Example 2: Conditional Component Rendering

```tsx
import { useResponsive } from '@/hooks';
import { shouldRender } from '@/utils/responsive';

function Dashboard() {
  const { breakpoint } = useResponsive();

  return (
    <div>
      {shouldRender(breakpoint, 'mobile') && <MobileHeader />}
      {shouldRender(breakpoint, ['tablet', 'desktop', 'wide']) && <DesktopHeader />}
      
      <main>
        {shouldRender(breakpoint, ['desktop', 'wide']) && <Sidebar />}
        <Content />
      </main>
    </div>
  );
}
```

### Example 3: Touch-Optimized Button

```tsx
import { useResponsive, useIsTouchDevice } from '@/hooks';
import { getTouchTargetSize } from '@/utils/responsive';

function ActionButton({ onClick, children }) {
  const { breakpoint } = useResponsive();
  const isTouch = useIsTouchDevice();
  const touchSize = getTouchTargetSize(breakpoint);

  return (
    <button
      onClick={onClick}
      className={`btn ${touchSize} ${isTouch ? 'active:scale-95' : 'hover:scale-105'}`}
    >
      {children}
    </button>
  );
}
```

### Example 4: Responsive Form Layout

```tsx
import { useResponsive } from '@/hooks';
import { getLayoutOrientation, getResponsiveGap } from '@/utils/responsive';

function ProfileForm() {
  const { breakpoint } = useResponsive();
  const orientation = getLayoutOrientation(breakpoint);
  const gap = getResponsiveGap(breakpoint);

  return (
    <form className={`flex ${orientation === 'vertical' ? 'flex-col' : 'flex-row'} ${gap}`}>
      <div className="flex-1">
        <label>First Name</label>
        <input type="text" />
      </div>
      <div className="flex-1">
        <label>Last Name</label>
        <input type="text" />
      </div>
    </form>
  );
}
```

### Example 5: Responsive Navigation

```tsx
import { useResponsive, useIsTouchDevice } from '@/hooks';
import { isMobileOrTablet, hasHoverCapability } from '@/utils/responsive';

function Navigation() {
  const { breakpoint } = useResponsive();
  const isTouch = useIsTouchDevice();
  const showHover = hasHoverCapability();

  if (isMobileOrTablet(breakpoint)) {
    return <MobileMenu />;
  }

  return (
    <nav className="flex space-x-4">
      {menuItems.map(item => (
        <NavItem 
          key={item.id} 
          item={item}
          showHover={showHover}
        />
      ))}
    </nav>
  );
}
```

### Example 6: Responsive Table/Card View

```tsx
import { useResponsive } from '@/hooks';

function DataList({ data }) {
  const { isMobile } = useResponsive();

  if (isMobile) {
    return (
      <div className="space-y-4">
        {data.map(item => (
          <Card key={item.id} data={item} />
        ))}
      </div>
    );
  }

  return (
    <table className="w-full">
      <thead>
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {data.map(item => (
          <tr key={item.id}>
            <td>{item.name}</td>
            <td>{item.email}</td>
            <td><Actions item={item} /></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

---

## Best Practices

### 1. Mobile-First Approach
Always design for mobile first, then enhance for larger screens:

```tsx
// Good
<div className="flex-col md:flex-row">

// Avoid
<div className="flex-row mobile:flex-col">
```

### 2. Use Hooks at Component Level
Call hooks at the top level of your component:

```tsx
// Good
function MyComponent() {
  const { breakpoint } = useResponsive();
  const isTouch = useIsTouchDevice();
  
  return <div>...</div>;
}

// Avoid
function MyComponent() {
  if (someCondition) {
    const { breakpoint } = useResponsive(); // ❌ Conditional hook call
  }
}
```

### 3. Minimize Re-renders
Use specific breakpoint checks instead of the full responsive state when possible:

```tsx
// Good - only re-renders when mobile state changes
const isMobile = useIsMobile();

// Less optimal - re-renders on any width change
const { width } = useResponsive();
```

### 4. Touch Target Sizes
Always ensure touch targets are at least 44x44px on mobile:

```tsx
import { getTouchTargetSize } from '@/utils/responsive';

const touchSize = getTouchTargetSize(breakpoint);
<button className={`btn ${touchSize}`}>Click</button>
```

### 5. Test on Real Devices
Always test responsive behavior on actual devices, not just browser dev tools:
- iOS Safari (iPhone, iPad)
- Android Chrome (various screen sizes)
- Different orientations (portrait/landscape)

### 6. Consider Touch vs Hover
Don't rely on hover states for critical functionality on touch devices:

```tsx
const hasHover = hasHoverCapability();

// Show tooltip on hover for mouse users, on click for touch users
{hasHover ? (
  <HoverTooltip />
) : (
  <ClickTooltip />
)}
```

### 7. Performance Optimization
Debounce resize events when using custom logic:

```tsx
import { useResponsive } from '@/hooks';
import { useMemo } from 'react';

function MyComponent() {
  const { breakpoint } = useResponsive();
  
  // Memoize expensive calculations
  const layout = useMemo(() => {
    return calculateComplexLayout(breakpoint);
  }, [breakpoint]);
  
  return <div>{layout}</div>;
}
```

### 8. Accessibility
Ensure responsive changes don't break accessibility:
- Maintain logical tab order
- Keep focus indicators visible
- Ensure sufficient color contrast at all sizes
- Test with screen readers

---

## Common Patterns

### Pattern 1: Responsive Container
```tsx
function ResponsiveContainer({ children }) {
  const { breakpoint } = useResponsive();
  const maxWidth = getContainerMaxWidth(breakpoint);
  const gap = getResponsiveGap(breakpoint);
  
  return (
    <div className={`container mx-auto px-4 ${maxWidth} ${gap}`}>
      {children}
    </div>
  );
}
```

### Pattern 2: Adaptive Navigation
```tsx
function AdaptiveNav() {
  const { isMobile } = useResponsive();
  const [isOpen, setIsOpen] = useState(false);
  
  return isMobile ? (
    <MobileNav isOpen={isOpen} onToggle={setIsOpen} />
  ) : (
    <DesktopNav />
  );
}
```

### Pattern 3: Responsive Modal
```tsx
function ResponsiveModal({ isOpen, onClose, children }) {
  const { isMobile } = useResponsive();
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      fullScreen={isMobile}
      className={isMobile ? 'h-full' : 'max-w-2xl'}
    >
      {children}
    </Modal>
  );
}
```

---

## Troubleshooting

### Issue: Hook returns incorrect values on initial render
**Solution:** Hooks handle SSR/initial render correctly. If you see issues, ensure you're not accessing window during SSR.

### Issue: Layout shifts during resize
**Solution:** Use CSS transitions and ensure proper min/max constraints:
```css
.responsive-element {
  transition: all 0.3s ease;
  min-width: 0; /* Prevent overflow */
}
```

### Issue: Touch events not working
**Solution:** Ensure you're checking for touch support before adding touch listeners:
```tsx
if (isTouchSupported()) {
  element.addEventListener('touchstart', handler);
}
```

---

## Additional Resources

- [MDN: Responsive Design](https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Responsive_Design)
- [Tailwind CSS Responsive Design](https://tailwindcss.com/docs/responsive-design)
- [Web.dev: Responsive Web Design Basics](https://web.dev/responsive-web-design-basics/)
- [WCAG Touch Target Size Guidelines](https://www.w3.org/WAI/WCAG21/Understanding/target-size.html)
