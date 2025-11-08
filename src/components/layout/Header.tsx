import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { useClinic } from '../../hooks/useClinic';
import LanguageSwitcher from '../common/LanguageSwitcher';
import { NotificationDropdown } from '../notifications';
import {
  Menu,
  X,
  ChevronDown,
  Home,
  Calendar,
  Users,
  FileText,
  CreditCard,
  BarChart3,
  Settings,
  LogOut,
  ChevronRight,
  Stethoscope,
  Package
} from 'lucide-react';
import { Badge } from '../ui';
import { Button } from '../ui';

const Header = memo(() => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { clinics, selectedClinic, setSelectedClinicById } = useClinic();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const mobileMenuRef = useRef<HTMLDivElement>(null);
  
  // Search functionality removed

  // Optimized scroll handler with debouncing for performance
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 10);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Add animation class when component mounts
  useEffect(() => {
    const header = document.querySelector('header');
    if (header) {
      setTimeout(() => {
        header.classList.add('header-loaded');
      }, 100);
    }
  }, []);



  // Optimized click outside handler
  const handleClickOutside = useCallback((event: MouseEvent) => {
    const target = event.target as Node;

    // Batch state updates for better performance
    const updates: (() => void)[] = [];

    if (profileRef.current && !profileRef.current.contains(target)) {
      updates.push(() => setIsProfileOpen(false));
    }

    if (mobileMenuRef.current && !mobileMenuRef.current.contains(target)) {
      updates.push(() => setIsMenuOpen(false));
      // Restore body scroll when closing mobile menu
      updates.push(() => {
        document.body.style.overflow = 'unset';
      });
    }

    if (moreMenuRef.current && !moreMenuRef.current.contains(target)) {
      updates.push(() => setIsMoreMenuOpen(false));
    }

    // Execute all updates in a single batch
    if (updates.length > 0) {
      updates.forEach(update => update());
    }
  }, []);

  // Click outside handlers effect
  useEffect(() => {
    // Only add listener if any dropdown is open for performance
    if (isProfileOpen || isMenuOpen || isMoreMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isProfileOpen, isMenuOpen, isMoreMenuOpen, handleClickOutside]);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
    setIsProfileOpen(false);
    setIsMoreMenuOpen(false);
    // Restore body scroll when route changes
    document.body.style.overflow = 'unset';
  }, [location.pathname]);

  // Cleanup body scroll on unmount
  useEffect(() => {
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const toggleMenu = useCallback(() => {
    setIsMenuOpen(prev => {
      const newState = !prev;
      // Close other dropdowns when opening mobile menu
      if (newState) {
        setIsProfileOpen(false);
        setIsMoreMenuOpen(false);
        // Prevent body scroll when menu is open
        document.body.style.overflow = 'hidden';
      } else {
        // Restore body scroll when menu is closed
        document.body.style.overflow = 'unset';
      }
      return newState;
    });
  }, []);

  const toggleProfile = () => {
    setIsProfileOpen(!isProfileOpen);
    // Close other dropdowns
    if (!isProfileOpen) {
      setIsMenuOpen(false);
    }
  };



  const _toggleMoreMenu = () => {
    setIsMoreMenuOpen(!isMoreMenuOpen);
    // Close other dropdowns
    if (!isMoreMenuOpen) {
      setIsProfileOpen(false);
      setIsMenuOpen(false);
    }
  };

  const handleClinicChange = useCallback(async (clinicId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      setSelectedClinicById(clinicId);
    } catch (err) {
      setError('Failed to switch clinic. Please try again.');
      if (import.meta.env.DEV) {
        console.error('Clinic change error:', err);
      }
    } finally {
      setIsLoading(false);
    }
  }, [setSelectedClinicById]);

  const handleLogout = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      await logout();
    } catch (err) {
      setError('Logout failed. Please try again.');
      if (import.meta.env.DEV) {
        console.error('Logout error:', err);
      }
    } finally {
      setIsLoading(false);
    }
  }, [logout]);

  // Search submit logic removed with search UI cleanup

  // Enhanced keyboard shortcuts and accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K search shortcut removed

      // Escape to close dropdowns and restore focus
      if (e.key === 'Escape') {
        setIsProfileOpen(false);
        setIsMenuOpen(false);
        setIsMoreMenuOpen(false);

        // Restore focus to the trigger element
        if (isMenuOpen) {
          (document.querySelector('[aria-label*="Open menu"]') as HTMLElement)?.focus();
        }
        if (isProfileOpen) {
          (document.querySelector('[aria-label*="User menu"]') as HTMLElement)?.focus();
        }
      }

      // Tab navigation enhancement for mobile menu
      if (e.key === 'Tab' && isMenuOpen) {
        const mobileMenu = mobileMenuRef.current;
        if (mobileMenu) {
          const focusableElements = mobileMenu.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          const firstElement = focusableElements[0] as HTMLElement;
          const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

          if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          } else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isMenuOpen, isProfileOpen]);

  // Enhanced keyboard navigation for dropdowns (scoped to each dropdown)
  const handleDropdownKeyDown = (e: React.KeyboardEvent, type: 'profile' | 'more') => {
    const isProfile = type === 'profile';
    const isMore = type === 'more';
    const isOpen = isProfile ? isProfileOpen : isMore ? isMoreMenuOpen : false;
    const containerRef = isProfile ? profileRef : moreMenuRef;
    const dropdown = containerRef.current?.querySelector('[role="menu"]') as HTMLElement | null;
    const focusableItems: HTMLElement[] = dropdown
      ? Array.from(dropdown.querySelectorAll('a, button')) as HTMLElement[]
      : [];

    if (!isOpen) {
      // Open dropdown on Enter or Space when closed
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (isProfile) {
          setIsProfileOpen(true);
        } else if (isMore) {
          setIsMoreMenuOpen(true);
        }
        // Move focus to first item when opening via keyboard
        setTimeout(() => {
          focusableItems[0]?.focus();
        }, 0);
      }
      return;
    }

    const currentIndex = focusableItems.findIndex(el => el === document.activeElement);

    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        if (isProfile) {
          setIsProfileOpen(false);
          // Return focus to trigger button
          (containerRef.current?.querySelector('[aria-label*="User menu"]') as HTMLElement)?.focus?.();
        } else if (isMore) {
          setIsMoreMenuOpen(false);
          (containerRef.current?.querySelector('[aria-expanded="true"]') as HTMLElement)?.focus?.();
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (focusableItems.length) {
          const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % focusableItems.length : 0;
          focusableItems[nextIndex]?.focus();
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (focusableItems.length) {
          const prevIndex = currentIndex >= 0 ? (currentIndex - 1 + focusableItems.length) % focusableItems.length : focusableItems.length - 1;
          focusableItems[prevIndex]?.focus();
        }
        break;
      case 'Tab':
        // Trap focus within the dropdown menu
        if (focusableItems.length) {
          e.preventDefault();
          if (e.shiftKey) {
            const prevIndex = currentIndex >= 0 ? (currentIndex - 1 + focusableItems.length) % focusableItems.length : focusableItems.length - 1;
            focusableItems[prevIndex]?.focus();
          } else {
            const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % focusableItems.length : 0;
            focusableItems[nextIndex]?.focus();
          }
        }
        break;
      default:
        break;
    }
  };

  const isActive = useCallback((path: string) => {
    return location.pathname === path;
  }, [location.pathname]);

  const _hasAccess = useCallback((roles: string[]) => {
    return user && roles.includes(user.role);
  }, [user]);

  // Get breadcrumb for current page
  const getBreadcrumb = () => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    if (pathSegments.length === 0) return null;

    const breadcrumbMap: { [key: string]: string } = {
      dashboard: t('dashboard.title'),
      appointments: t('appointments.title'),
      patients: t('patients.patients'),
      medications: t('medications.medications'),
      prescriptions: t('prescriptions.prescriptions'),
      billing: t('billing.title'),
      reports: t('reports.title'),
      staffScheduling: t('staffScheduling.title'),
      clinics: t('clinics'),
      search: t('search', 'Search'),
      profile: t('profile'),
      settings: t('settings'),
      admin: t('admin', 'Admin'),
      'multi-clinic': t('multiClinic', 'Multi-Clinic Dashboard'),
    };

    return pathSegments.map((segment, index) => ({
      name: breadcrumbMap[segment] || segment,
      path: '/' + pathSegments.slice(0, index + 1).join('/'),
      isLast: index === pathSegments.length - 1
    }));
  };

  const breadcrumb = useMemo(() => getBreadcrumb(), [location.pathname, t]);

  // Memoized navigation link component for performance
  const _NavigationLink = memo(({
    to,
    icon: Icon,
    label,
    shortLabel,
    color,
    variant = 'desktop',
    onClick
  }: {
    to: string;
    icon: any;
    label: string;
    shortLabel?: string;
    color: string;
    variant?: 'desktop' | 'tablet' | 'mobile';
    onClick?: () => void;
  }) => {
    const active = isActive(to);

    if (variant === 'mobile') {
      return (
        <Link
          to={to}
          className={`flex items-center px-4 py-4 rounded-xl text-base font-medium transition-all duration-200 min-h-[56px] active:bg-blue-200 active:scale-95 ${active ? 'bg-blue-100 text-blue-700 shadow-sm' : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600 hover:translate-x-1'
            }`}
          onClick={onClick}
        >
          <div className={`flex items-center justify-center w-10 h-10 rounded-lg bg-${color}-50 mr-4 flex-shrink-0`}>
            {typeof Icon === 'string' ? (
              Icon === 'medication' ? (
                <svg className={`w-5 h-5 text-${color}-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              ) : (
                <svg className={`w-5 h-5 text-${color}-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              )
            ) : (
              <Icon className={`w-5 h-5 text-${color}-600`} />
            )}
          </div>
          <span className="flex-1">{label}</span>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </Link>
      );
    }

    if (variant === 'tablet') {
      return (
        <Link
          to={to}
          className={`inline-flex items-center p-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 ${active ? 'bg-blue-100 text-blue-700 shadow-sm' : 'text-gray-600 hover:bg-gray-100 hover:text-blue-600'
            }`}
          title={label}
        >
          {typeof Icon === 'string' ? (
            Icon === 'medication' ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            )
          ) : (
            <Icon className="w-5 h-5" />
          )}
        </Link>
      );
    }

    // Desktop variant
    return (
      <Link
        to={to}
        className={`inline-flex items-center px-3 xl:px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 ${active ? 'bg-blue-100 text-blue-700 shadow-sm' : 'text-gray-600 hover:bg-gray-100 hover:text-blue-600'
          }`}
      >
        {typeof Icon === 'string' ? (
          Icon === 'medication' ? (
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          ) : (
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          )
        ) : (
          <Icon className="w-4 h-4 mr-2" />
        )}
        <span className="hidden xl:inline">{label}</span>
        <span className="xl:hidden">{shortLabel || label}</span>
      </Link>
    );
  });

  // Memoized navigation items for performance
  const _navigationItems = useMemo(() => [
    {
      path: '/dashboard',
      icon: Home,
      label: t('dashboard'),
      shortLabel: 'Dashboard',
      color: 'blue',
      roles: ['dentist', 'staff', 'admin', 'patient']
    },
    {
      path: '/appointments',
      icon: Calendar,
      label: t('appointments'),
      shortLabel: 'Appointments',
      color: 'green',
      roles: ['dentist', 'staff', 'admin', 'patient']
    },
    {
      path: '/patients',
      icon: Users,
      label: t('patients'),
      shortLabel: 'Patients',
      color: 'purple',
      roles: ['dentist', 'staff', 'admin']
    },
    {
      path: '/medications',
      icon: 'medication',
      label: t('medications.medications'),
      shortLabel: 'Meds',
      color: 'orange',
      roles: ['dentist', 'admin']
    },
    {
      path: '/prescriptions',
      icon: FileText,
      label: t('prescriptions.prescriptions'),
      shortLabel: 'Scripts',
      color: 'indigo',
      roles: ['dentist', 'staff', 'admin', 'patient']
    }
  ], [t]);

  const _moreNavigationItems = useMemo(() => [
    {
      path: '/billing',
      icon: CreditCard,
      label: t('billing.title'),
      color: 'emerald',
      roles: ['dentist', 'staff', 'admin']
    },
    {
      path: '/inventory',
      icon: Package,
      label: t('inventory.title'),
      color: 'cyan',
      roles: ['dentist', 'staff', 'admin']
    },
    {
      path: '/reports',
      icon: BarChart3,
      label: t('reports.title'),
      color: 'pink',
      roles: ['dentist', 'staff', 'admin', 'patient']
    },
    {
      path: '/staff-scheduling',
      icon: Calendar,
      label: t('staffScheduling'),
      color: 'yellow',
      roles: ['dentist', 'staff', 'admin']
    },
    {
      path: '/treatments',
      icon: Stethoscope,
      label: t('treatments.title'),
      color: 'violet',
      roles: ['dentist', 'staff', 'admin']
    },
    {
      path: '/clinics',
      icon: 'building',
      label: t('clinics'),
      color: 'red',
      roles: ['admin']
    }
  ], [t]);

  return (
    <>
      {/* Skip Links for Accessibility */}
      <div className="sr-only focus-within:not-sr-only">
        <a
          href="#main-content"
          className="absolute top-0 left-0 bg-blue-600 text-white px-4 py-2 rounded-br-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 z-[100]"
        >
          Skip to main content
        </a>
        <a
          href="#main-navigation"
          className="absolute top-0 left-32 bg-blue-600 text-white px-4 py-2 rounded-br-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 z-[100]"
        >
          Skip to navigation
        </a>
      </div>

      <header className={`bg-gradient-to-r from-blue-50/95 via-white/98 to-blue-50/95 backdrop-blur-lg ${isScrolled ? 'shadow-lg border-b border-blue-100/80' : 'border-b border-gray-100/60'} sticky top-0 z-50 transition-all duration-300`} role="banner">
        <div className="w-full px-4 sm:px-6 lg:px-8 transition-all duration-300">
          <div className={`flex justify-between items-center transition-all duration-300 ${isScrolled ? 'h-14' : 'h-16'}`}>
            {/* Logo and Navigation */}
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center space-x-3">
                <Link to="/" className="flex items-center group">
                  <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 text-white rounded-2xl mr-4 shadow-lg group-hover:shadow-blue-200/50 transition-all duration-300 group-hover:scale-105 group-active:scale-95 ring-2 ring-blue-100/50 animate-pulse-subtle">
                    <Stethoscope className="w-7 h-7 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent transition-all duration-300">
                      DentalPro
                    </span>
                    <span className="text-xs text-blue-500 font-semibold -mt-1 tracking-wide">MANAGER</span>
                  </div>
                </Link>
              </div>

              {/* Search removed for a cleaner professional header */}
            </div>

            {/* Desktop Navigation */}
            {user && (
              <nav id="main-navigation" className="hidden lg:flex lg:items-center lg:space-x-2" role="navigation" aria-label="Main navigation">
                <Link
                  to="/dashboard"
                  className={`inline-flex items-center px-4 xl:px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-105 ${isActive('/dashboard') ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-200/50' : 'text-gray-600 hover:bg-gray-100 hover:text-blue-600 hover:shadow-md'}`}
                >
                  <Home className="w-4 h-4 mr-2" />
                  <span className="hidden xl:inline">{t('navigation.dashboard', 'Dashboard')}</span>
                  <span className="xl:hidden">{t('navigation.dashboard_short', 'Dashboard')}</span>
                </Link>
                <Link
                  to="/appointments"
                  className={`inline-flex items-center px-4 xl:px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-105 ${isActive('/appointments') ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-200/50' : 'text-gray-600 hover:bg-gray-100 hover:text-blue-600 hover:shadow-md'}`}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  <span className="hidden xl:inline">{t('navigation.appointments', 'Appointments')}</span>
                  <span className="xl:hidden">{t('navigation.appointments_short', 'Appointments')}</span>
                </Link>
                {(user?.role === 'dentist' || user?.role === 'staff' || user?.role === 'admin') && (
                  <Link
                    to="/patients"
                    className={`inline-flex items-center px-4 xl:px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-105 ${isActive('/patients') ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-200/50' : 'text-gray-600 hover:bg-gray-100 hover:text-blue-600 hover:shadow-md'}`}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    <span className="hidden xl:inline">{t('Patients')}</span>
                    <span className="xl:hidden">Patients</span>
                  </Link>
                )}
                {(user?.role === 'dentist' || user?.role === 'admin') && (
                  <Link
                    to="/medications"
                    className={`inline-flex items-center px-4 xl:px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-105 ${isActive('/medications') ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-200/50' : 'text-gray-600 hover:bg-gray-100 hover:text-blue-600 hover:shadow-md'}`}
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                    <span className="hidden xl:inline">{t('medications.medications')}</span>
                    <span className="xl:hidden">Meds</span>
                  </Link>
                )}
                <Link
                  to="/prescriptions"
                  className={`inline-flex items-center px-4 xl:px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-105 ${isActive('/prescriptions') ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-200/50' : 'text-gray-600 hover:bg-gray-100 hover:text-blue-600 hover:shadow-md'}`}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  <span className="hidden xl:inline">{t('prescriptions.prescriptions')}</span>
                  <span className="xl:hidden">Scripts</span>
                </Link>

                {/* More dropdown */}
                <div className="relative" ref={moreMenuRef}>
                  <button
                    onClick={_toggleMoreMenu}
                    onKeyDown={(e) => handleDropdownKeyDown(e, 'more')}
                    className={`inline-flex items-center px-4 xl:px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-105 ${isMoreMenuOpen ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100 hover:text-blue-600 hover:shadow-md'}`}
                    aria-expanded={isMoreMenuOpen}
                    aria-haspopup="true"
                    aria-label="More navigation options"
                  >
                    <Menu className="w-4 h-4 mr-2" />
                    <span className="hidden xl:inline">More</span>
                    <span className="xl:hidden">More</span>
                    <ChevronDown className={`w-4 h-4 ml-1 transition-transform duration-200 ${isMoreMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isMoreMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                      <div className="py-2" role="menu" onKeyDown={(e) => handleDropdownKeyDown(e, 'more')}>
                        {_moreNavigationItems.filter(item => _hasAccess(item.roles)).map((item) => (
                          <Link
                            key={item.path}
                            to={item.path}
                            className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-150"
                            onClick={() => setIsMoreMenuOpen(false)}
                            role="menuitem"
                          >
                            {typeof item.icon === 'string' ? (
                              item.icon === 'building' ? (
                                <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                              ) : (
                                React.createElement(item.icon as any, { className: 'w-4 h-4 mr-3' })
                              )
                            ) : (
                              React.createElement(item.icon as any, { className: 'w-4 h-4 mr-3' })
                            )}
                            {item.label}
                          </Link>
                        ))}
                        {user?.role === 'admin' && (
                          <>
                            <Link
                              to="/admin/multi-clinic"
                              className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-150"
                              onClick={() => setIsMoreMenuOpen(false)}
                              role="menuitem"
                            >
                              <BarChart3 className="w-4 h-4 mr-3" />
                              {t('multiClinic', 'Multi-Clinic Dashboard')}
                            </Link>
                            <Link
                              to="/admin/homepage"
                              className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-150"
                              onClick={() => setIsMoreMenuOpen(false)}
                              role="menuitem"
                            >
                              <Home className="w-4 h-4 mr-3" />
                              {t('adminHomepage', 'Homepage Manager')}
                            </Link>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </nav>
            )}

            {/* Tablet Navigation - Condensed */}
            {user && (
              <nav className="hidden md:flex lg:hidden md:items-center md:space-x-1" role="navigation" aria-label="Tablet navigation">
                <Link
                  to="/dashboard"
                  className={`inline-flex items-center p-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 ${isActive('/dashboard') ? 'bg-blue-100 text-blue-700 shadow-sm' : 'text-gray-600 hover:bg-gray-100 hover:text-blue-600'}`}
                  title={t('dashboard')}
                >
                  <Home className="w-5 h-5" />
                </Link>
                <Link
                  to="/appointments"
                  className={`inline-flex items-center p-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 ${isActive('/appointments') ? 'bg-blue-100 text-blue-700 shadow-sm' : 'text-gray-600 hover:bg-gray-100 hover:text-blue-600'}`}
                  title={t('appointments')}
                >
                  <Calendar className="w-5 h-5" />
                </Link>
                {(user.role === 'dentist' || user.role === 'staff' || user.role === 'admin') && (
                  <Link
                    to="/patients"
                    className={`inline-flex items-center p-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 ${isActive('/patients') ? 'bg-blue-100 text-blue-700 shadow-sm' : 'text-gray-600 hover:bg-gray-100 hover:text-blue-600'}`}
                    title={t('patients')}
                  >
                    <Users className="w-5 h-5" />
                  </Link>
                )}
                <Link
                  to="/prescriptions"
                  className={`inline-flex items-center p-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 ${isActive('/prescriptions') ? 'bg-blue-100 text-blue-700 shadow-sm' : 'text-gray-600 hover:bg-gray-100 hover:text-blue-600'}`}
                  title={t('prescriptions.prescriptions')}
                >
                  <FileText className="w-5 h-5" />
                </Link>

                {/* Tablet More Menu */}
                <div className="relative" ref={moreMenuRef}>
                  <button
                    onClick={_toggleMoreMenu}
                    onKeyDown={(e) => handleDropdownKeyDown(e, 'more')}
                    className={`inline-flex items-center p-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 ${isMoreMenuOpen ? 'bg-blue-100 text-blue-700 shadow-sm' : 'text-gray-600 hover:bg-gray-100 hover:text-blue-600'}`}
                    title="More options"
                    aria-expanded={isMoreMenuOpen}
                    aria-haspopup="true"
                  >
                    <Menu className="w-5 h-5" />
                  </button>

                  {isMoreMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                      <div className="py-2" role="menu" onKeyDown={(e) => handleDropdownKeyDown(e, 'more')}>
                        {(user.role === 'dentist' || user.role === 'admin') && (
                          <Link
                            to="/medications"
                            className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-150"
                            onClick={() => setIsMoreMenuOpen(false)}
                            role="menuitem"
                          >
                            <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                            </svg>
                            {t('medications.medications')}
                          </Link>
                        )}
                        {_moreNavigationItems.filter(item => _hasAccess(item.roles)).map((item) => (
                          <Link
                            key={item.path}
                            to={item.path}
                            className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-150"
                            onClick={() => setIsMoreMenuOpen(false)}
                            role="menuitem"
                          >
                            {typeof item.icon === 'string' ? (
                              item.icon === 'building' ? (
                                <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                              ) : (
                                React.createElement(item.icon as any, { className: 'w-4 h-4 mr-3' })
                              )
                            ) : (
                              React.createElement(item.icon as any, { className: 'w-4 h-4 mr-3' })
                            )}
                            {item.label}
                          </Link>
                        ))}
                        {user?.role === 'admin' && (
                          <>
                            <Link
                              to="/admin/multi-clinic"
                              className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-150"
                              onClick={() => setIsMoreMenuOpen(false)}
                              role="menuitem"
                            >
                              <BarChart3 className="w-4 h-4 mr-3" />
                              {t('multiClinic', 'Multi-Clinic Dashboard')}
                            </Link>
                            <Link
                              to="/admin/homepage"
                              className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-150"
                              onClick={() => setIsMoreMenuOpen(false)}
                              role="menuitem"
                            >
                              <Home className="w-4 h-4 mr-3" />
                              {t('adminHomepage', 'Homepage Manager')}
                            </Link>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </nav>
            )}

            {/* Right side controls */}
            <div className="flex items-center space-x-3 sm:space-x-4">
              {/* Quick Actions - Desktop Only removed for streamlined header */}

              {/* Loading indicator */}
              {isLoading && (
                <div className="flex items-center justify-center w-8 h-8">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
                </div>
              )}

              {/* Error indicator */}
              {error && (
                <div className="flex items-center">
                  <button
                    onClick={() => setError(null)}
                    className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition-colors duration-200"
                    title={error}
                    aria-label={`Error: ${error}. Click to dismiss.`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                </div>
              )}
              {/* Online status and time display removed for simplicity */}

              {/* Enhanced Notifications */}
              {user && (
                <div className="flex items-center">
                  <div className="relative">
                    <NotificationDropdown />
                  </div>
                </div>
              )}

              {/* Language Switcher - Hidden on mobile, visible on tablet+ */}
              <div className="hidden sm:flex items-center">
                <LanguageSwitcher variant="menu" showIcon={true} showLabel={false} />
              </div>

              {/* Clinic Selector - Only for staff/admin/dentist - Hidden on mobile, visible on tablet+ */}
              {user && user.role !== 'patient' && clinics.length > 1 && (
                <div className="hidden lg:block">
                  <div className="relative inline-block">
                    <select
                      className="appearance-none pl-3 pr-9 py-2 text-sm border border-gray-200 bg-white rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer hover:border-gray-300 transition-colors duration-200 min-h-[44px]"
                      value={selectedClinic?.id || ''}
                      onChange={(e) => handleClinicChange(e.target.value)}
                      aria-label={`Select clinic. Currently selected: ${selectedClinic?.name || 'None'}`}
                      aria-describedby="clinic-selector-help"
                    >
                      {clinics.map((clinic) => (
                        <option key={clinic.id} value={clinic.id}>
                          {clinic.name}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                      <ChevronDown className="h-4 w-4" aria-hidden="true" />
                    </div>
                    <span id="clinic-selector-help" className="sr-only">
                      Choose which clinic location to manage
                    </span>
                  </div>
                </div>
              )}

              {/* User Profile */}
              {user ? (
                <div className="relative" ref={profileRef}>
                  <button
                    onClick={toggleProfile}
                    onKeyDown={(e) => handleDropdownKeyDown(e, 'profile')}
                    className="flex items-center space-x-3 sm:space-x-4 p-3 rounded-2xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 min-h-[48px] min-w-[48px] hover:shadow-md group"
                    aria-label={`User menu for ${user.firstName} ${user.lastName}. Role: ${user.role}`}
                    aria-expanded={isProfileOpen}
                    aria-haspopup="true"
                    aria-describedby="user-menu-help"
                  >
                    <span className="sr-only">Open user menu</span>
                    <div className="relative">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 flex items-center justify-center text-white shadow-lg ring-2 ring-white/50 transition-all duration-200 group-hover:ring-4 group-hover:ring-blue-100 group-hover:scale-105">
                        <span className="text-base font-bold">
                          {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                        </span>
                      </div>
                      {user.role === 'admin' && (
                        <div className="absolute -top-1 -right-1 h-5 w-5 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-lg">
                          <span className="text-xs text-white font-bold">A</span>
                        </div>
                      )}
                      {user.role === 'dentist' && (
                        <div className="absolute -top-1 -right-1 h-5 w-5 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-lg">
                          <Stethoscope className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="hidden lg:block text-left ml-4">
                      <p className="text-sm font-bold text-gray-800">{user.firstName} {user.lastName}</p>
                      <p className="text-xs text-gray-500 capitalize flex items-center font-medium">
                        {user.role}
                        {selectedClinic && (
                          <>
                            <span className="mx-1">•</span>
                            <span className="truncate max-w-24">{selectedClinic.name}</span>
                          </>
                        )}
                      </p>
                    </div>
                    <ChevronDown className={`hidden lg:block h-4 w-4 text-gray-400 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
                    <span id="user-menu-help" className="sr-only">
                      Access profile settings, account preferences, and sign out
                    </span>
                  </button>

                  {/* Profile dropdown */}
                  {isProfileOpen && (
                    <div
                      className="absolute right-0 mt-3 w-72 sm:w-80 bg-white rounded-xl shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none z-50 transform transition-all duration-200 ease-out"
                      role="menu"
                      aria-orientation="vertical"
                      aria-labelledby="user-menu"
                      onKeyDown={(e) => handleDropdownKeyDown(e, 'profile')}
                    >
                      <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                        <div className="flex items-center space-x-3">
                          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 flex items-center justify-center text-white shadow-lg">
                            <span className="text-lg font-semibold">
                              {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                            </span>
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">{user.firstName} {user.lastName}</p>
                            <p className="text-sm text-gray-600 truncate">{user.email}</p>
                            <Badge variant={user.role === 'admin' ? 'danger' : user.role === 'dentist' ? 'success' : 'primary'} size="sm" className="mt-1">
                              {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="py-2">
                        <Link
                          to="/profile"
                          className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-150 min-h-[44px] active:bg-blue-100"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-medium">{t('profile')}</p>
                            <p className="text-xs text-gray-500">Manage your account</p>
                          </div>
                        </Link>
                        <Link
                          to="/settings"
                          className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-150 min-h-[44px] active:bg-blue-100"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                            <Settings className="w-4 h-4 text-gray-600" />
                          </div>
                          <div>
                            <p className="font-medium">{t('settings')}</p>
                            <p className="text-xs text-gray-500">Preferences & privacy</p>
                          </div>
                        </Link>
                      </div>
                      <div className="border-t border-gray-100 py-2">
                        <button
                          onClick={handleLogout}
                          className="flex items-center w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors duration-150 min-h-[44px] active:bg-red-100"
                        >
                          <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                            <LogOut className="w-4 h-4 text-red-600" />
                          </div>
                          <div className="text-left">
                            <p className="font-medium">{t('auth.signOut')}</p>
                            <p className="text-xs text-red-500">Sign out of your account</p>
                          </div>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex space-x-3">
                  <Link to="/login">
                    <Button variant="outline" size="sm">
                      {t('auth.login')}
                    </Button>
                  </Link>
                  <Link to="/register">
                    <Button variant="primary" size="sm">
                      {t('auth.signUp')}
                    </Button>
                  </Link>
                </div>
              )}

              {/* Mobile menu button */}
              {user && (
                <div className="flex items-center md:hidden">
                  <button
                    onClick={toggleMenu}
                    className="inline-flex items-center justify-center p-3 rounded-2xl text-gray-500 hover:text-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-all duration-300 min-h-[52px] min-w-[52px] active:bg-blue-100 active:scale-95 hover:scale-105 hover:shadow-md"
                    aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
                    aria-expanded={isMenuOpen}
                  >
                    <span className="sr-only">{isMenuOpen ? 'Close main menu' : 'Open main menu'}</span>
                    <div className="relative">
                      <div className={`transform transition-all duration-300 ease-in-out ${isMenuOpen ? 'rotate-180 scale-90' : 'rotate-0 scale-100'}`}>
                        <div className={`absolute inset-0 transition-opacity duration-300 ${isMenuOpen ? 'opacity-0' : 'opacity-100'}`}>
                          <Menu className="block h-6 w-6" />
                        </div>
                        <div className={`transition-opacity duration-300 ${isMenuOpen ? 'opacity-100' : 'opacity-0'}`}>
                          <X className="block h-6 w-6" />
                        </div>
                      </div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile menu overlay */}
        {isMenuOpen && user && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden transition-opacity duration-300 ease-in-out"
              onClick={() => setIsMenuOpen(false)}
              aria-hidden="true"
            />

            {/* Slide-out menu */}
            <div className={`fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white shadow-2xl z-50 md:hidden transform transition-transform duration-300 ease-in-out ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'
              }`}>
              {/* Menu header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 flex items-center justify-center text-white shadow-lg">
                    <span className="text-sm font-semibold">
                      {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{user?.firstName} {user?.lastName}</p>
                    <Badge variant={user?.role === 'admin' ? 'danger' : user?.role === 'dentist' ? 'success' : 'primary'} size="sm">
                      {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
                    </Badge>
                  </div>
                </div>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                  aria-label="Close menu"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Menu content */}
              <div className="flex-1 overflow-y-auto">
                <div className="pt-2 pb-3 space-y-1 px-2">
                  {/* Mobile search removed */}

                  {/* Clinic Selector - Mobile */}
                  {user?.role !== 'patient' && clinics?.length > 1 && (
                    <div className="px-3 py-2">
                      <label htmlFor="mobile-clinic-selector" className="block text-xs font-medium text-blue-600 mb-1 px-1">
                        {t('common.selectClinic', 'Select Clinic')}
                      </label>
                      <div className="relative">
                        <select
                          id="mobile-clinic-selector"
                          className="appearance-none w-full pl-4 pr-10 py-3 text-sm border border-blue-200 bg-white rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer hover:border-blue-300 transition-colors duration-200 min-h-[44px]"
                          value={selectedClinic?.id || ''}
                          onChange={(e) => handleClinicChange(e.target.value)}
                          aria-label={`Select clinic. Currently selected: ${selectedClinic?.name || 'None'}`}
                          aria-describedby="mobile-clinic-help"
                        >
                          {clinics.map((clinic) => (
                            <option key={clinic.id} value={clinic.id}>
                              {clinic.name}
                            </option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                          <ChevronDown className="h-4 w-4" aria-hidden="true" />
                        </div>
                        <span id="mobile-clinic-help" className="sr-only">
                          Choose which clinic location to manage
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Language Switcher - Mobile */}
                  <div className="px-3 py-2 sm:hidden">
                    <LanguageSwitcher variant="menu" showIcon={true} showLabel={true} />
                  </div>

                  <div className="border-t border-gray-200 my-2" role="separator" aria-hidden="true"></div>

                  {/* Mobile Navigation Links */}
                  <nav role="navigation" aria-label="Mobile navigation" className="space-y-1 px-2">

                    <Link
                      to="/dashboard"
                      className={`flex items-center px-4 py-4 rounded-xl text-base font-medium transition-all duration-200 min-h-[56px] active:bg-blue-200 active:scale-95 ${isActive('/dashboard') ? 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 shadow-sm' : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600 hover:translate-x-1'}`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100 mr-4 flex-shrink-0 shadow-sm transition-all duration-300 group-hover:scale-110">
                        <Home className="w-5 h-5 text-blue-600" />
                      </div>
                      <span className="flex-1">{t('dashboard')}</span>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </Link>
                    <Link
                      to="/appointments"
                      className={`flex items-center px-4 py-4 rounded-xl text-base font-medium transition-all duration-200 min-h-[56px] active:bg-blue-200 active:scale-95 ${isActive('/appointments') ? 'bg-blue-100 text-blue-700 shadow-sm' : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600 hover:translate-x-1'}`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-50 mr-4 flex-shrink-0">
                        <Calendar className="w-5 h-5 text-green-600" />
                      </div>
                      <span className="flex-1">{t('appointments')}</span>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </Link>
                    {(user.role === 'dentist' || user.role === 'staff' || user.role === 'admin') && (
                      <Link
                        to="/patients"
                        className={`flex items-center px-4 py-4 rounded-xl text-base font-medium transition-all duration-200 min-h-[56px] active:bg-blue-200 active:scale-95 ${isActive('/patients') ? 'bg-blue-100 text-blue-700 shadow-sm' : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600 hover:translate-x-1'}`}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-purple-50 mr-4 flex-shrink-0">
                          <Users className="w-5 h-5 text-purple-600" />
                        </div>
                        <span className="flex-1">{t('patients')}</span>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </Link>
                    )}
                    {(user.role === 'dentist' || user.role === 'admin') && (
                      <Link
                        to="/medications"
                        className={`flex items-center px-4 py-4 rounded-xl text-base font-medium transition-all duration-200 min-h-[56px] active:bg-blue-200 active:scale-95 ${isActive('/medications') ? 'bg-blue-100 text-blue-700 shadow-sm' : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600 hover:translate-x-1'}`}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-orange-50 mr-4 flex-shrink-0">
                          <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                          </svg>
                        </div>
                        <span className="flex-1">{t('medications.medications')}</span>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </Link>
                    )}

                    <Link
                      to="/prescriptions"
                      className={`flex items-center px-4 py-4 rounded-xl text-base font-medium transition-all duration-200 min-h-[56px] active:bg-blue-200 active:scale-95 ${isActive('/prescriptions') ? 'bg-blue-100 text-blue-700 shadow-sm' : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600 hover:translate-x-1'}`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-indigo-50 mr-4 flex-shrink-0">
                        <FileText className="w-5 h-5 text-indigo-600" />
                      </div>
                      <span className="flex-1">{t('prescriptions.prescriptions')}</span>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </Link>

                    {(user.role === 'dentist' || user.role === 'staff' || user.role === 'admin') && (
                      <Link
                        to="/billing"
                        className={`flex items-center px-4 py-4 rounded-xl text-base font-medium transition-all duration-200 min-h-[56px] active:bg-blue-200 active:scale-95 ${isActive('/billing') ? 'bg-blue-100 text-blue-700 shadow-sm' : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600 hover:translate-x-1'}`}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-50 mr-4 flex-shrink-0">
                          <CreditCard className="w-5 h-5 text-emerald-600" />
                        </div>
                        <span className="flex-1">{t('billing.title')}</span>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </Link>
                    )}

                    <Link
                      to="/inventory"
                      className={`flex items-center px-4 py-4 rounded-xl text-base font-medium transition-all duration-200 min-h-[56px] active:bg-blue-200 active:scale-95 ${isActive('/inventory') ? 'bg-blue-100 text-blue-700 shadow-sm' : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600 hover:translate-x-1'}`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-cyan-50 mr-4 flex-shrink-0">
                        <Package className="w-5 h-5 text-cyan-600" />
                      </div>
                      <span className="flex-1">{t('inventory.title')}</span>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </Link>

                    <Link
                      to="/reports"
                      className={`flex items-center px-4 py-4 rounded-xl text-base font-medium transition-all duration-200 min-h-[56px] active:bg-blue-200 active:scale-95 ${isActive('/reports') ? 'bg-blue-100 text-blue-700 shadow-sm' : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600 hover:translate-x-1'}`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-pink-50 mr-4 flex-shrink-0">
                        <BarChart3 className="w-5 h-5 text-pink-600" />
                      </div>
                      <span className="flex-1">{t('reports.title')}</span>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </Link>

                    {(user.role === 'dentist' || user.role === 'staff' || user.role === 'admin') && (
                      <Link
                        to="/staff-scheduling"
                        className={`flex items-center px-4 py-4 rounded-xl text-base font-medium transition-all duration-200 min-h-[56px] active:bg-blue-200 active:scale-95 ${isActive('/staff-scheduling') ? 'bg-blue-100 text-blue-700 shadow-sm' : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600 hover:translate-x-1'}`}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-yellow-50 mr-4 flex-shrink-0">
                          <Calendar className="w-5 h-5 text-yellow-600" />
                        </div>
                        <span className="flex-1">{t('staffScheduling')}</span>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </Link>
                    )}

                    {(user.role === 'dentist' || user.role === 'staff' || user.role === 'admin') && (
                      <Link
                        to="/treatments"
                        className={`flex items-center px-4 py-4 rounded-xl text-base font-medium transition-all duration-200 min-h-[56px] active:bg-blue-200 active:scale-95 ${isActive('/treatments') ? 'bg-blue-100 text-blue-700 shadow-sm' : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600 hover:translate-x-1'}`}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-violet-50 mr-4 flex-shrink-0">
                          <Stethoscope className="w-5 h-5 text-violet-600" />
                        </div>
                        <span className="flex-1">{t('treatments.title')}</span>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </Link>
                    )}

                    {user.role === 'admin' && (
                      <Link
                        to="/clinics"
                        className={`flex items-center px-4 py-4 rounded-xl text-base font-medium transition-all duration-200 min-h-[56px] active:bg-blue-200 active:scale-95 ${isActive('/clinics') ? 'bg-blue-100 text-blue-700 shadow-sm' : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600 hover:translate-x-1'}`}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-red-50 mr-4 flex-shrink-0">
                          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        <span className="flex-1">{t('clinics')}</span>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </Link>
                    )}

                    {user.role === 'admin' && (
                      <>
                        <Link
                          to="/admin/multi-clinic"
                          className={`flex items-center px-4 py-4 rounded-xl text-base font-medium transition-all duration-200 min-h-[56px] active:bg-blue-200 active:scale-95 ${isActive('/admin/multi-clinic') ? 'bg-blue-100 text-blue-700 shadow-sm' : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600 hover:translate-x-1'}`}
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-indigo-50 mr-4 flex-shrink-0">
                            <BarChart3 className="w-5 h-5 text-indigo-600" />
                          </div>
                          <span className="flex-1">{t('multiClinic', 'Multi-Clinic Dashboard')}</span>
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        </Link>
                        <Link
                          to="/admin/homepage"
                          className={`flex items-center px-4 py-4 rounded-xl text-base font-medium transition-all duration-200 min-h-[56px] active:bg-blue-200 active:scale-95 ${isActive('/admin/homepage') ? 'bg-blue-100 text-blue-700 shadow-sm' : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600 hover:translate-x-1'}`}
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-50 mr-4 flex-shrink-0">
                            <Home className="w-5 h-5 text-blue-600" />
                          </div>
                          <span className="flex-1">{t('adminHomepage', 'Homepage Manager')}</span>
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        </Link>
                      </>
                    )}
                  </nav>

                  <div className="pt-4 pb-3 border-t border-gray-200 mt-2" role="separator">
                    <div className="flex items-center px-3 py-2">
                      <div className="flex-shrink-0">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-500 to-blue-700 flex items-center justify-center text-white shadow-lg">
                          <span className="text-base font-semibold">
                            {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                          </span>
                        </div>
                      </div>
                      <div className="ml-3 flex-1 min-w-0">
                        <div className="text-base font-medium text-gray-800 truncate">{user.firstName} {user.lastName}</div>
                        <div className="text-sm font-medium text-gray-500 truncate">{user.email}</div>
                        <Badge variant={user.role === 'admin' ? 'danger' : user.role === 'dentist' ? 'success' : 'primary'} size="sm" className="mt-1">
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </Badge>
                      </div>
                    </div>
                    <div className="mt-3 space-y-1 px-2">
                      <Link
                        to="/profile"
                        className="flex items-center px-4 py-4 rounded-xl text-base font-medium text-gray-600 hover:bg-gray-50 hover:text-blue-600 transition-all duration-200 min-h-[56px] active:bg-blue-100 active:scale-95 hover:translate-x-1"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-50 mr-4 flex-shrink-0">
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <span className="flex-1">{t('profile')}</span>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </Link>
                      <Link
                        to="/settings"
                        className="flex items-center px-4 py-4 rounded-xl text-base font-medium text-gray-600 hover:bg-gray-50 hover:text-blue-600 transition-all duration-200 min-h-[56px] active:bg-blue-100 active:scale-95 hover:translate-x-1"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-50 mr-4 flex-shrink-0">
                          <Settings className="w-5 h-5 text-gray-600" />
                        </div>
                        <span className="flex-1">{t('settings')}</span>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </Link>
                      <button
                        onClick={() => {
                          handleLogout();
                          setIsMenuOpen(false);
                        }}
                        className="flex items-center w-full text-left px-4 py-4 rounded-xl text-base font-medium text-red-600 hover:bg-red-50 transition-all duration-200 min-h-[56px] active:bg-red-100 active:scale-95 hover:translate-x-1"
                      >
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-red-50 mr-4 flex-shrink-0">
                          <LogOut className="w-5 h-5 text-red-600" />
                        </div>
                        <span className="flex-1">{t('auth.signOut')}</span>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </header>

      {/* Enhanced Breadcrumb bar */}
      {user && breadcrumb && breadcrumb.length > 0 && (
        <div className="bg-gradient-to-r from-gray-50/90 via-white/95 to-gray-50/90 backdrop-blur-sm border-b border-gray-100/80">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-2">
            <nav className="flex items-center text-sm text-gray-600 overflow-x-auto scrollbar-hide" aria-label="Breadcrumb navigation">
              <Link to="/dashboard" className="hover:text-blue-600 whitespace-nowrap transition-colors min-h-[32px] flex items-center font-medium hover:bg-blue-50 px-2 py-1 rounded-lg">
                {t('navigation.dashboard')}
              </Link>
              {breadcrumb.map((item) => (
                <div key={item.path} className="flex items-center flex-shrink-0">
                  <ChevronRight className="mx-1 sm:mx-2 h-4 w-4 text-gray-400 flex-shrink-0" aria-hidden="true" />
                  {item.isLast ? (
                    <span
                      className="text-gray-700 font-medium truncate max-w-[120px] sm:max-w-[200px] lg:max-w-none"
                      aria-current="page"
                    >
                      {item.name}
                    </span>
                  ) : (
                    <Link
                      to={item.path}
                      className="hover:text-blue-600 whitespace-nowrap transition-colors min-h-[32px] flex items-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                      aria-label={`Navigate to ${item.name}`}
                    >
                      {item.name}
                    </Link>
                  )}
                </div>
              ))}
            </nav>
          </div>
        </div>
      )}
    </>
  );
});

Header.displayName = 'Header';

export default Header;