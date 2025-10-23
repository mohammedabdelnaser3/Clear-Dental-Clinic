import { useState, useEffect } from 'react';

export type Breakpoint = 'mobile' | 'tablet' | 'desktop' | 'wide';

interface ResponsiveState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isWide: boolean;
  breakpoint: Breakpoint;
  width: number;
}

/**
 * Hook to detect current responsive breakpoint
 * Breakpoints:
 * - mobile: < 768px
 * - tablet: 768px - 1024px
 * - desktop: 1024px - 1440px
 * - wide: > 1440px
 */
export const useResponsive = (): ResponsiveState => {
  const [state, setState] = useState<ResponsiveState>(() => {
    const width = typeof window !== 'undefined' ? window.innerWidth : 1024;
    return getResponsiveState(width);
  });

  useEffect(() => {
    const handleResize = () => {
      setState(getResponsiveState(window.innerWidth));
    };

    window.addEventListener('resize', handleResize);
    
    // Initial check
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return state;
};

function getResponsiveState(width: number): ResponsiveState {
  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;
  const isDesktop = width >= 1024 && width < 1440;
  const isWide = width >= 1440;

  let breakpoint: Breakpoint;
  if (isMobile) breakpoint = 'mobile';
  else if (isTablet) breakpoint = 'tablet';
  else if (isDesktop) breakpoint = 'desktop';
  else breakpoint = 'wide';

  return {
    isMobile,
    isTablet,
    isDesktop,
    isWide,
    breakpoint,
    width,
  };
}
