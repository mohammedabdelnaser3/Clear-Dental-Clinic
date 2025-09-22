import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { useClinic } from '../../hooks/useClinic';
import LanguageSwitcher from '../common/LanguageSwitcher';
import { 
  Bell, 
  Menu, 
  X, 
  ChevronDown, 
  Home, 
  Calendar, 
  Users, 
  FileText, 
  CreditCard, 
  BarChart3, 
  Clock, 
  Settings, 
  LogOut,
  Search,
  ChevronRight,
  Stethoscope
} from 'lucide-react';
import { Badge } from '../ui';
import { Button } from '../ui';

const Header = () => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { clinics, selectedClinic, setSelectedClinicById } = useClinic();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [hasNotifications, setHasNotifications] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const location = useLocation();
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Check for scroll position to add shadow on scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Simulate notifications - in a real app, this would come from a notification service
  useEffect(() => {
    setHasNotifications(true);
  }, []);

  // Click outside handlers
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setIsMoreMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
    setIsProfileOpen(false);
    setIsNotificationOpen(false);
    setIsMoreMenuOpen(false);
  }, [location.pathname]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    // Close other dropdowns when opening mobile menu
    if (!isMenuOpen) {
      setIsProfileOpen(false);
      setIsNotificationOpen(false);
    }
  };

  const toggleProfile = () => {
    setIsProfileOpen(!isProfileOpen);
    // Close other dropdowns
    if (!isProfileOpen) {
      setIsNotificationOpen(false);
      setIsMenuOpen(false);
    }
  };

  const toggleNotifications = () => {
    setIsNotificationOpen(!isNotificationOpen);
    // Close other dropdowns
    if (!isNotificationOpen) {
      setIsProfileOpen(false);
      setIsMenuOpen(false);
      setIsMoreMenuOpen(false);
    }
  };

  const toggleMoreMenu = () => {
    setIsMoreMenuOpen(!isMoreMenuOpen);
    // Close other dropdowns
    if (!isMoreMenuOpen) {
      setIsProfileOpen(false);
      setIsNotificationOpen(false);
      setIsMenuOpen(false);
    }
  };

  const handleClinicChange = (clinicId: string) => {
    setSelectedClinicById(clinicId);
  };

  const handleLogout = async () => {
    await logout();
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to search page with query
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      // Clear search input after navigation
      setSearchQuery('');
      setIsSearchFocused(false);
      searchInputRef.current?.blur();
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchFocused(true);
      }
      
      // Escape to close dropdowns
      if (e.key === 'Escape') {
        setIsProfileOpen(false);
        setIsNotificationOpen(false);
        setIsMenuOpen(false);
        setIsMoreMenuOpen(false);
        setIsSearchFocused(false);
        searchInputRef.current?.blur();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Keyboard navigation for dropdowns
  const handleDropdownKeyDown = (e: React.KeyboardEvent, type: 'profile' | 'notifications') => {
    const isProfile = type === 'profile';
    const isOpen = isProfile ? isProfileOpen : isNotificationOpen;
    
    if (!isOpen) return;

    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        if (isProfile) {
          setIsProfileOpen(false);
        } else {
          setIsNotificationOpen(false);
        }
        break;
      case 'Tab':
        // Allow natural tab navigation
        break;
      default:
        break;
    }
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  // Get breadcrumb for current page
  const getBreadcrumb = () => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    if (pathSegments.length === 0) return null;
    
    const breadcrumbMap: { [key: string]: string } = {
      dashboard: t('navigation.dashboard'),
      appointments: t('navigation.appointments'),
      patients: t('navigation.patients'),
      medications: t('navigation.medications'),
      prescriptions: t('navigation.prescriptions'),
      billing: t('navigation.billing'),
      reports: t('navigation.reports'),
      'staff-scheduling': t('navigation.staffScheduling'),
      clinics: t('navigation.clinics'),
      search: t('navigation.search', 'Search'),
      profile: t('navigation.profile'),
      settings: t('navigation.settings'),
      admin: t('navigation.admin', 'Admin'),
      'multi-clinic': t('navigation.multiClinic', 'Multi-Clinic Dashboard'),
    };

    return pathSegments.map((segment, index) => ({
      name: breadcrumbMap[segment] || segment,
      path: '/' + pathSegments.slice(0, index + 1).join('/'),
      isLast: index === pathSegments.length - 1
    }));
  };

  const breadcrumb = getBreadcrumb();

  return (
    <>
      <header className={`bg-white/95 backdrop-blur-sm ${isScrolled ? 'shadow-lg border-b border-gray-100' : 'border-b border-transparent'} sticky top-0 z-50 transition-all duration-300`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo and Navigation */}
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center space-x-3">
                <Link to="/" className="flex items-center group">
                  <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 text-white rounded-xl mr-3 shadow-lg group-hover:shadow-xl transition-all duration-200 group-hover:scale-105">
                    <Stethoscope className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                      Clear
                    </span>
                  </div>
                </Link>
              </div>
              
              {/* Search Bar - Desktop */}
              {user && (
                <div className="hidden lg:flex items-center ml-8">
                  <form onSubmit={handleSearch} className="relative">
                    <div className={`flex items-center transition-all duration-200 ${isSearchFocused ? 'w-80' : 'w-64'}`}>
                      <Search className="absolute left-3 h-4 w-4 text-gray-400" />
                      <input
                        ref={searchInputRef}
                        type="text"
                        placeholder={t('common.search') || 'Search patients, appointments... (⌘K)'}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => setIsSearchFocused(true)}
                        onBlur={() => setIsSearchFocused(false)}
                        className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                        aria-label={t('common.search') || 'Search'}
                        autoComplete="off"
                      />
                    </div>
                  </form>
                </div>
              )}
            </div>
            
            {/* Desktop Navigation */}
            {user && (
              <nav className="hidden md:flex md:items-center md:space-x-1">
                <Link
                  to="/dashboard"
                  className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActive('/dashboard') ? 'bg-blue-100 text-blue-700 shadow-sm' : 'text-gray-600 hover:bg-gray-100 hover:text-blue-600'}`}
                >
                  <Home className="w-4 h-4 mr-2" />
                  {t('navigation.dashboard')}
                </Link>
                <Link
                  to="/appointments"
                  className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActive('/appointments') ? 'bg-blue-100 text-blue-700 shadow-sm' : 'text-gray-600 hover:bg-gray-100 hover:text-blue-600'}`}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  {t('navigation.appointments')}
                </Link>
                {(user.role === 'dentist' || user.role === 'staff' || user.role === 'admin') && (
                  <Link
                    to="/patients"
                    className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActive('/patients') ? 'bg-blue-100 text-blue-700 shadow-sm' : 'text-gray-600 hover:bg-gray-100 hover:text-blue-600'}`}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    {t('navigation.patients')}
                  </Link>
                )}
                {(user.role === 'dentist' || user.role === 'admin') && (
                  <Link
                    to="/medications"
                    className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActive('/medications') ? 'bg-blue-100 text-blue-700 shadow-sm' : 'text-gray-600 hover:bg-gray-100 hover:text-blue-600'}`}
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                    {t('navigation.medications')}
                  </Link>
                )}
                <Link
                  to="/prescriptions"
                  className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActive('/prescriptions') ? 'bg-blue-100 text-blue-700 shadow-sm' : 'text-gray-600 hover:bg-gray-100 hover:text-blue-600'}`}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  {t('navigation.prescriptions')}
                </Link>
                
                {/* More dropdown for additional pages */}
                <div className="relative" ref={moreMenuRef}>
                  <button
                    onClick={toggleMoreMenu}
                    className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive('/billing') || isActive('/reports') || isActive('/staff-scheduling') || isActive('/clinics') || isActive('/search')
                        ? 'bg-blue-100 text-blue-700 shadow-sm' 
                        : 'text-gray-600 hover:bg-gray-100 hover:text-blue-600'
                    }`}
                    aria-expanded={isMoreMenuOpen}
                    aria-haspopup="true"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                    More
                    <ChevronDown className={`ml-2 h-4 w-4 transition-transform duration-200 ${isMoreMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* More dropdown menu */}
                  {isMoreMenuOpen && (
                    <div className="absolute left-0 mt-2 w-56 bg-white rounded-xl shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50 transform transition-all duration-200 ease-out">
                      <div className="py-2">
                        {(user.role === 'dentist' || user.role === 'staff' || user.role === 'admin') && (
                          <Link
                            to="/billing"
                            className={`flex items-center px-4 py-3 text-sm transition-colors duration-150 ${
                              isActive('/billing') 
                                ? 'bg-blue-50 text-blue-700' 
                                : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                            }`}
                            onClick={() => setIsMoreMenuOpen(false)}
                          >
                            <CreditCard className="w-4 h-4 mr-3" />
                            {t('navigation.billing')}
                          </Link>
                        )}
                        <Link
                          to="/reports"
                          className={`flex items-center px-4 py-3 text-sm transition-colors duration-150 ${
                            isActive('/reports') 
                              ? 'bg-blue-50 text-blue-700' 
                              : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                          }`}
                          onClick={() => setIsMoreMenuOpen(false)}
                        >
                          <BarChart3 className="w-4 h-4 mr-3" />
                          {t('navigation.reports')}
                        </Link>
                        {(user.role === 'dentist' || user.role === 'staff' || user.role === 'admin') && (
                          <Link
                            to="/staff-scheduling"
                            className={`flex items-center px-4 py-3 text-sm transition-colors duration-150 ${
                              isActive('/staff-scheduling') 
                                ? 'bg-blue-50 text-blue-700' 
                                : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                            }`}
                            onClick={() => setIsMoreMenuOpen(false)}
                          >
                            <Clock className="w-4 h-4 mr-3" />
                            {t('navigation.staffScheduling')}
                          </Link>
                        )}
                        <Link
                          to="/search"
                          className={`flex items-center px-4 py-3 text-sm transition-colors duration-150 ${
                            isActive('/search') 
                              ? 'bg-blue-50 text-blue-700' 
                              : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                          }`}
                          onClick={() => setIsMoreMenuOpen(false)}
                        >
                          <Search className="w-4 h-4 mr-3" />
                          {t('navigation.search', 'Search')}
                        </Link>
                        {user.role === 'admin' && (
                          <>
                            <div className="border-t border-gray-100 my-2"></div>
                            <Link
                              to="/clinics"
                              className={`flex items-center px-4 py-3 text-sm transition-colors duration-150 ${
                                isActive('/clinics') 
                                  ? 'bg-blue-50 text-blue-700' 
                                  : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                              }`}
                              onClick={() => setIsMoreMenuOpen(false)}
                            >
                              <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                              {t('navigation.clinics')}
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
            <div className="flex items-center space-x-3">
              {/* Notifications */}
              {user && (
                <div className="relative" ref={notificationRef}>
                  <button 
                    onClick={toggleNotifications}
                    onKeyDown={(e) => handleDropdownKeyDown(e, 'notifications')}
                    className="relative p-2 rounded-xl text-gray-500 hover:text-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                    aria-label="Notifications"
                    aria-expanded={isNotificationOpen}
                    aria-haspopup="true"
                  >
                    <Bell className="h-5 w-5" />
                    {hasNotifications && (
                      <span className="absolute -top-1 -right-1 flex h-5 w-5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-5 w-5 bg-red-500 items-center justify-center">
                          <span className="text-xs font-medium text-white">3</span>
                        </span>
                      </span>
                    )}
                  </button>
                  
                  {/* Notification dropdown */}
                  {isNotificationOpen && (
                    <div 
                      className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50 transform transition-all duration-200 ease-out"
                      role="menu"
                      aria-orientation="vertical"
                      aria-labelledby="notifications-menu"
                    >
                      <div className="p-4 border-b border-gray-100">
                        <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        <div className="p-4 hover:bg-gray-50 border-b border-gray-100 cursor-pointer transition-colors duration-150">
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0">
                              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <Calendar className="h-4 w-4 text-blue-600" />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900">New appointment scheduled</p>
                              <p className="text-sm text-gray-500">John Doe - Tomorrow at 2:00 PM</p>
                              <p className="text-xs text-gray-400 mt-1">5 minutes ago</p>
                            </div>
                          </div>
                        </div>
                        <div className="p-4 hover:bg-gray-50 border-b border-gray-100 cursor-pointer transition-colors duration-150">
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0">
                              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                                <FileText className="h-4 w-4 text-green-600" />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900">Prescription ready</p>
                              <p className="text-sm text-gray-500">Patient: Sarah Wilson</p>
                              <p className="text-xs text-gray-400 mt-1">1 hour ago</p>
                            </div>
                          </div>
                        </div>
                        <div className="p-4 hover:bg-gray-50 cursor-pointer transition-colors duration-150">
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0">
                              <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
                                <Clock className="h-4 w-4 text-yellow-600" />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900">Appointment reminder</p>
                              <p className="text-sm text-gray-500">Mike Johnson - Today at 4:00 PM</p>
                              <p className="text-xs text-gray-400 mt-1">2 hours ago</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="p-4 border-t border-gray-100">
                        <button className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium">
                          View all notifications
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Language Switcher */}
              <div className="hidden sm:block">
                <LanguageSwitcher variant="menu" showIcon={true} showLabel={false} />
              </div>
              
              {/* Clinic Selector - Only for staff/admin/dentist */}
              {user && user.role !== 'patient' && clinics.length > 1 && (
                <div className="hidden sm:block">
                  <div className="relative inline-block">
                    <select
                      className="appearance-none pl-4 pr-10 py-2 text-sm border border-gray-200 bg-white rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer hover:border-gray-300 transition-colors duration-200"
                      value={selectedClinic?.id || ''}
                      onChange={(e) => handleClinicChange(e.target.value)}
                    >
                      {clinics.map((clinic) => (
                        <option key={clinic.id} value={clinic.id}>
                          {clinic.name}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                      <ChevronDown className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              )}

              {/* User Profile */}
              {user ? (
                <div className="relative" ref={profileRef}>
                  <button
                    onClick={toggleProfile}
                    onKeyDown={(e) => handleDropdownKeyDown(e, 'profile')}
                    className="flex items-center space-x-3 p-2 rounded-xl hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                    aria-label="User menu"
                    aria-expanded={isProfileOpen}
                    aria-haspopup="true"
                  >
                    <span className="sr-only">Open user menu</span>
                    <div className="relative">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 flex items-center justify-center text-white shadow-lg ring-2 ring-white">
                        <span className="text-sm font-semibold">
                          {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                        </span>
                      </div>
                      {user.role === 'admin' && (
                        <div className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center">
                          <span className="text-xs text-white font-bold">A</span>
                        </div>
                      )}
                    </div>
                    <div className="hidden md:block text-left">
                      <p className="text-sm font-medium text-gray-700">{user.firstName} {user.lastName}</p>
                      <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                    </div>
                    <ChevronDown className={`hidden md:block h-4 w-4 text-gray-400 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {/* Profile dropdown */}
                  {isProfileOpen && (
                    <div 
                      className="absolute right-0 mt-3 w-72 bg-white rounded-xl shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none z-50 transform transition-all duration-200 ease-out"
                      role="menu"
                      aria-orientation="vertical"
                      aria-labelledby="user-menu"
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
                          className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-150"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-medium">{t('navigation.profile')}</p>
                            <p className="text-xs text-gray-500">Manage your account</p>
                          </div>
                        </Link>
                        <Link
                          to="/settings"
                          className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-150"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                            <Settings className="w-4 h-4 text-gray-600" />
                          </div>
                          <div>
                            <p className="font-medium">{t('navigation.settings')}</p>
                            <p className="text-xs text-gray-500">Preferences & privacy</p>
                          </div>
                        </Link>
                      </div>
                      <div className="border-t border-gray-100 py-2">
                        <button
                          onClick={handleLogout}
                          className="flex items-center w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors duration-150"
                        >
                          <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mr-3">
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
                <div className="flex items-center md:hidden" ref={mobileMenuRef}>
                  <button
                    onClick={toggleMenu}
                    className="inline-flex items-center justify-center p-2 rounded-xl text-gray-500 hover:text-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-all duration-200"
                  >
                    <span className="sr-only">Open main menu</span>
                    <div className="relative">
                      {isMenuOpen ? (
                        <X className="block h-6 w-6 transform transition-transform duration-200" />
                      ) : (
                        <Menu className="block h-6 w-6 transform transition-transform duration-200" />
                      )}
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

      {/* Mobile menu */}
      {isMenuOpen && user && (
        <div className="md:hidden shadow-lg border-t">
          <div className="pt-2 pb-3 space-y-1 px-2">
            <Link
              to="/dashboard"
              className={`flex items-center px-3 py-2 rounded-md text-base font-medium ${isActive('/dashboard') ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'}`}
              onClick={() => setIsMenuOpen(false)}
            >
              <Home className="w-5 h-5 mr-3" />
              {t('navigation.dashboard')}
            </Link>
            <Link
              to="/appointments"
              className={`flex items-center px-3 py-2 rounded-md text-base font-medium ${isActive('/appointments') ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'}`}
              onClick={() => setIsMenuOpen(false)}
            >
              <Calendar className="w-5 h-5 mr-3" />
              {t('navigation.appointments')}
            </Link>
            {(user.role === 'dentist' || user.role === 'staff' || user.role === 'admin') && (
              <Link
                to="/patients"
                className={`flex items-center px-3 py-2 rounded-md text-base font-medium ${isActive('/patients') ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'}`}
                onClick={() => setIsMenuOpen(false)}
              >
                <Users className="w-5 h-5 mr-3" />
                {t('navigation.patients')}
              </Link>
            )}
            {(user.role === 'dentist' || user.role === 'admin') && (
              <Link
                to="/medications"
                className={`flex items-center px-3 py-2 rounded-md text-base font-medium ${isActive('/medications') ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'}`}
                onClick={() => setIsMenuOpen(false)}
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
                {t('navigation.medications')}
              </Link>
            )}
            <Link
              to="/prescriptions"
              className={`flex items-center px-3 py-2 rounded-md text-base font-medium ${isActive('/prescriptions') ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'}`}
              onClick={() => setIsMenuOpen(false)}
            >
              <FileText className="w-5 h-5 mr-3" />
              {t('navigation.prescriptions')}
            </Link>
            {(user.role === 'dentist' || user.role === 'staff' || user.role === 'admin') && (
              <Link
                to="/billing"
                className={`flex items-center px-3 py-2 rounded-md text-base font-medium ${isActive('/billing') ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'}`}
                onClick={() => setIsMenuOpen(false)}
              >
                <CreditCard className="w-5 h-5 mr-3" />
                {t('navigation.billing')}
              </Link>
            )}
            <Link
              to="/reports"
              className={`flex items-center px-3 py-2 rounded-md text-base font-medium ${isActive('/reports') ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'}`}
              onClick={() => setIsMenuOpen(false)}
            >
              <BarChart3 className="w-5 h-5 mr-3" />
              {t('navigation.reports')}
            </Link>
            {(user.role === 'dentist' || user.role === 'staff' || user.role === 'admin') && (
              <Link
                to="/staff-scheduling"
                className={`flex items-center px-3 py-2 rounded-md text-base font-medium ${isActive('/staff-scheduling') ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'}`}
                onClick={() => setIsMenuOpen(false)}
              >
                <Clock className="w-5 h-5 mr-3" />
                {t('navigation.staffScheduling')}
              </Link>
            )}
            <Link
              to="/search"
              className={`flex items-center px-3 py-2 rounded-md text-base font-medium ${isActive('/search') ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'}`}
              onClick={() => setIsMenuOpen(false)}
            >
              <Search className="w-5 h-5 mr-3" />
              {t('navigation.search', 'Search')}
            </Link>
            {user.role === 'admin' && (
              <Link
                to="/clinics"
                className={`flex items-center px-3 py-2 rounded-md text-base font-medium ${isActive('/clinics') ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'}`}
                onClick={() => setIsMenuOpen(false)}
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                {t('navigation.clinics')}
              </Link>
            )}
            
            <div className="pt-4 pb-3 border-t border-gray-200">
              <div className="flex items-center px-3">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-blue-700 flex items-center justify-center text-white">
                    {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                  </div>
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium text-gray-800">{user.firstName} {user.lastName}</div>
                  <div className="text-sm font-medium text-gray-500">{user.email}</div>
                </div>
              </div>
              <div className="mt-3 space-y-1 px-3">
                <Link
                  to="/profile"
                  className="flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:bg-gray-50 hover:text-blue-600"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  {t('navigation.profile')}
                </Link>
                <Link
                  to="/settings"
                  className="flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:bg-gray-50 hover:text-blue-600"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Settings className="w-5 h-5 mr-3" />
                  {t('navigation.settings')}
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:bg-gray-50 hover:text-blue-600"
                >
                  <LogOut className="w-5 h-5 mr-3" />
                  {t('auth.signOut')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>

    {/* Breadcrumb bar */}
    {user && breadcrumb && (
      <div className="bg-white/80 backdrop-blur-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <nav className="flex items-center text-sm text-gray-500 overflow-x-auto">
            <Link to="/dashboard" className="hover:text-blue-600 whitespace-nowrap">
              {t('navigation.dashboard')}
            </Link>
            {breadcrumb.map((item) => (
              <div key={item.path} className="flex items-center">
                <ChevronRight className="mx-2 h-4 w-4 text-gray-400 flex-shrink-0" />
                {item.isLast ? (
                  <span className="text-gray-700 font-medium truncate max-w-[200px] sm:max-w-none">{item.name}</span>
                ) : (
                  <Link to={item.path} className="hover:text-blue-600 whitespace-nowrap">{item.name}</Link>
                )}
              </div>
            ))}
          </nav>
        </div>
      </div>
    )}
    </>
  );
};

export default Header;