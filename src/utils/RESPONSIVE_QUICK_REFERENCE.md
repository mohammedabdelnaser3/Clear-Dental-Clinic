# Responsive Utilities - Quick Reference Card

## Import Statements

```tsx
// Hooks
import { 
  useResponsive, 
  useMediaQuery,
  useIsMobile,
  useIsTablet,
  useIsDesktop,
  useIsWide,
  useIsTouchDevice 
} from '@/hooks';

// Utilities
import {
  // Breakpoint checking
  isBreakpoint,
  isMobileOrTablet,
  isDesktopOrWide,
  
  // Responsive values
  getResponsiveValue,
  getGridColumns,
  getResponsiveSpacing,
  
  // Conditional rendering
  shouldRender,
  getResponsiveClasses,
  
  // Touch detection
  isTouchSupported,
  isMobileDevice,
  isTabletDevice,
  getTouchTargetSize,
  getPointerType,
  hasHoverCapability,
  
  // Layout utilities
  getContainerMaxWidth,
  getResponsiveFontSize,
  getLayoutOrientation,
  getResponsiveGap,
  
  // Constants
  BREAKPOINTS,
  MEDIA_QUERIES
} from '@/utils/responsive';
```

## Breakpoints

| Name | Range | Pixels |
|------|-------|--------|
| mobile | < 768px | 0 - 767 |
| tablet | 768px - 1024px | 768 - 1023 |
| desktop | 1024px - 1440px | 1024 - 1439 |
| wide | > 1440px | 1440+ |

## Common Patterns

### 1. Basic Responsive Layout
```tsx
const { isMobile, breakpoint } = useResponsive();
const columns = getGridColumns(breakpoint);
const gap = getResponsiveGap(breakpoint);

<div className={`grid grid-cols-${columns} ${gap}`}>
  {/* Content */}
</div>
```

### 2. Show/Hide Based on Breakpoint
```tsx
const { breakpoint } = useResponsive();

{shouldRender(breakpoint, 'mobile') && <MobileOnly />}
{shouldRender(breakpoint, ['tablet', 'desktop', 'wide']) && <TabletUp />}
{shouldRender(breakpoint, undefined, 'mobile') && <HideOnMobile />}
```

### 3. Touch-Optimized Button
```tsx
const { breakpoint } = useResponsive();
const touchSize = getTouchTargetSize(breakpoint);
const canHover = hasHoverCapability();

<button className={`btn ${touchSize} ${canHover ? 'hover:bg-blue-700' : ''}`}>
  Click
</button>
```

### 4. Conditional Layout
```tsx
const { isMobile } = useResponsive();

{isMobile ? <MobileLayout /> : <DesktopLayout />}
```

### 5. Responsive Classes
```tsx
const { breakpoint } = useResponsive();
const classes = getResponsiveClasses(breakpoint, {
  mobile: 'flex-col space-y-2',
  tablet: 'flex-row space-x-4',
  desktop: 'grid grid-cols-3 gap-6',
  default: 'flex'
});

<div className={classes}>{/* Content */}</div>
```

### 6. Custom Media Query
```tsx
const isLandscape = useMediaQuery('(orientation: landscape)');
const isDark = useMediaQuery('(prefers-color-scheme: dark)');
const isPrint = useMediaQuery('print');
```

### 7. Touch Detection
```tsx
const isTouch = useIsTouchDevice();
const pointerType = getPointerType(); // 'coarse' | 'fine' | 'none'

{isTouch ? <TouchUI /> : <MouseUI />}
```

### 8. Responsive Container
```tsx
const { breakpoint } = useResponsive();
const maxWidth = getContainerMaxWidth(breakpoint);

<div className={`container mx-auto ${maxWidth} px-4`}>
  {/* Content */}
</div>
```

## Hook Return Values

### useResponsive()
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

### useMediaQuery(query)
```typescript
boolean // true if query matches
```

## Function Quick Reference

| Function | Purpose | Example |
|----------|---------|---------|
| `getGridColumns(bp)` | Get column count | `getGridColumns('mobile')` → `1` |
| `getResponsiveGap(bp)` | Get gap class | `getResponsiveGap('tablet')` → `'gap-4'` |
| `getTouchTargetSize(bp)` | Get touch size | `getTouchTargetSize('mobile')` → `'min-h-[44px] min-w-[44px]'` |
| `shouldRender(bp, show?, hide?)` | Check if render | `shouldRender('mobile', 'mobile')` → `true` |
| `isMobileOrTablet(bp)` | Check mobile/tablet | `isMobileOrTablet('tablet')` → `true` |
| `isDesktopOrWide(bp)` | Check desktop/wide | `isDesktopOrWide('desktop')` → `true` |
| `getContainerMaxWidth(bp)` | Get max width | `getContainerMaxWidth('desktop')` → `'max-w-5xl'` |
| `getLayoutOrientation(bp)` | Get orientation | `getLayoutOrientation('mobile')` → `'vertical'` |
| `hasHoverCapability()` | Check hover | `hasHoverCapability()` → `true/false` |
| `isTouchSupported()` | Check touch | `isTouchSupported()` → `true/false` |

## Default Values

### Grid Columns
- mobile: 1
- tablet: 2
- desktop: 3
- wide: 4

### Spacing/Gap
- mobile: 'gap-3' / '4'
- tablet: 'gap-4' / '6'
- desktop: 'gap-6' / '8'
- wide: 'gap-8' / '10'

### Container Max Width
- mobile: 'max-w-full'
- tablet: 'max-w-3xl'
- desktop: 'max-w-5xl'
- wide: 'max-w-7xl'

## Tailwind Integration

```tsx
// Combine with Tailwind responsive classes
<div className={`
  px-4 sm:px-6 lg:px-8
  ${getResponsiveGap(breakpoint)}
  grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3
`}>
  {/* Content */}
</div>
```

## Common Use Cases

### Navigation
```tsx
const { isMobile } = useResponsive();
{isMobile ? <MobileNav /> : <DesktopNav />}
```

### Forms
```tsx
const { breakpoint } = useResponsive();
const orientation = getLayoutOrientation(breakpoint);
<form className={`flex ${orientation === 'vertical' ? 'flex-col' : 'flex-row'}`}>
```

### Tables
```tsx
const { isMobile } = useResponsive();
{isMobile ? <CardView data={data} /> : <TableView data={data} />}
```

### Modals
```tsx
const { isMobile } = useResponsive();
<Modal fullScreen={isMobile}>
```

### Sidebars
```tsx
const { breakpoint } = useResponsive();
{shouldRender(breakpoint, ['desktop', 'wide']) && <Sidebar />}
```

## Testing Checklist

- [ ] Test on mobile (< 768px)
- [ ] Test on tablet (768px - 1024px)
- [ ] Test on desktop (1024px - 1440px)
- [ ] Test on wide screens (> 1440px)
- [ ] Test touch interactions
- [ ] Test hover states
- [ ] Test orientation changes
- [ ] Test with keyboard navigation
- [ ] Verify touch target sizes (min 44x44px)
- [ ] Check color contrast
- [ ] Test with screen readers

## Resources

- **Detailed Guide**: `src/utils/RESPONSIVE_UTILITIES_GUIDE.md`
- **System Overview**: `src/utils/RESPONSIVE_SYSTEM_README.md`
- **Examples**: `src/components/examples/ResponsiveExample.tsx`
- **Design Spec**: `.kiro/specs/dentist-profile-responsive-ui/design.md`

## Tips

1. **Mobile-First**: Always design for mobile first, then enhance
2. **Touch Targets**: Minimum 44x44px on mobile
3. **Performance**: Use specific hooks to avoid unnecessary re-renders
4. **Accessibility**: Test with keyboard and screen readers
5. **Real Devices**: Test on actual devices, not just browser tools
6. **Hover**: Don't rely on hover for critical functionality
7. **Memoization**: Memoize expensive calculations based on breakpoint
8. **SSR**: Hooks handle SSR correctly, no special handling needed
