import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { useClinic } from '../../hooks/useClinic';
import LanguageSwitcher from '../common/LanguageSwitcher';
import { Bell, Menu, X, ChevronDown, Home, Calendar, Users, FileText, CreditCard, BarChart3, Clock, Settings, LogOut } from 'lucide-react';
import { Badge } from '../ui';
import { Button } from '../ui';

const Header = () => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { clinics, selectedClinic, setSelectedClinicById } = useClinic();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [hasNotifications, setHasNotifications] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  
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

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleProfile = () => {
    setIsProfileOpen(!isProfileOpen);
  };

  const handleClinicChange = (clinicId: string) => {
    setSelectedClinicById(clinicId);
  };

  const handleLogout = async () => {
    await logout();
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <header className={`bg-white ${isScrolled ? 'shadow-md' : ''} sticky top-0 z-50 transition-shadow duration-300`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Navigation */}
          <div className="flex">
            <div className="flex-shrink-0 flex items-center space-x-2">
              <Link to="/" className="flex items-center">
                <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-md mr-2">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 4.75L19.25 9L12 13.25L4.75 9L12 4.75Z" fill="currentColor" />
                    <path d="M12 13.25V19.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M19.25 9V16.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M4.75 9V16.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M12 19.25L19.25 15.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M12 19.25L4.75 15.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                  Clear
                </span>
              </Link>
            </div>
            
            {/* Desktop Navigation */}
            {user && (
              <nav className="hidden md:ml-6 md:flex md:space-x-6">
                <Link
                  to="/dashboard"
                  className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 ${isActive('/dashboard') ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'}`}
                >
                  <Home className="w-4 h-4 mr-2" />
                  {t('navigation.dashboard')}
                </Link>
                <Link
                  to="/appointments"
                  className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 ${isActive('/appointments') ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'}`}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  {t('navigation.appointments')}
                </Link>
                {(user.role === 'dentist' || user.role === 'staff' || user.role === 'admin') && (
                  <Link
                    to="/patients"
                    className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 ${isActive('/patients') ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'}`}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    {t('navigation.patients')}
                  </Link>
                )}
                {(user.role === 'dentist' || user.role === 'admin') && (
                  <Link
                    to="/medications"
                    className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 ${isActive('/medications') ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'}`}
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                    {t('navigation.medications')}
                  </Link>
                )}
                <Link
                  to="/prescriptions"
                  className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 ${isActive('/prescriptions') ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'}`}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  {t('navigation.prescriptions')}
                </Link>
                {(user.role === 'dentist' || user.role === 'staff' || user.role === 'admin') && (
                  <Link
                    to="/billing"
                    className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 ${isActive('/billing') ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'}`}
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    {t('navigation.billing')}
                  </Link>
                )}
                <Link
                  to="/reports"
                  className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 ${isActive('/reports') ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'}`}
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  {t('navigation.reports')}
                </Link>
                {(user.role === 'dentist' || user.role === 'staff' || user.role === 'admin') && (
                  <Link
                    to="/staff-scheduling"
                    className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 ${isActive('/staff-scheduling') ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'}`}
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    {t('navigation.staffScheduling')}
                  </Link>
                )}
              </nav>
            )}
          </div>

          {/* Right side controls */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            {user && (
              <div className="relative">
                <button 
                  className="p-1 rounded-full text-gray-500 hover:text-blue-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  aria-label="Notifications"
                >
                  <Bell className="h-6 w-6" />
                  {hasNotifications && (
                    <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
                  )}
                </button>
              </div>
            )}
            
            {/* Language Switcher */}
            <div className="">
              <LanguageSwitcher variant="menu" showIcon={true} showLabel={false} />
            </div>
            
            {/* Clinic Selector - Only for staff/admin/dentist */}
            {user && user.role !== 'patient' && clinics.length > 1 && (
              <div className="">
                <div className="relative inline-block">
                  <select
                    className="appearance-none pl-3 pr-10 py-2 text-sm border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                    value={selectedClinic?.id || ''}
                    onChange={(e) => handleClinicChange(e.target.value)}
                  >
                    {clinics.map((clinic) => (
                      <option key={clinic.id} value={clinic.id}>
                        {clinic.name}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                    <ChevronDown className="h-4 w-4" />
                  </div>
                </div>
              </div>
            )}

            {/* User Profile */}
            {user ? (
              <div className="relative">
                <button
                  onClick={toggleProfile}
                  className="flex items-center space-x-2 p-1 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                >
                  <span className="sr-only">Open user menu</span>
                  <div className="relative">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-r from-blue-500 to-blue-700 flex items-center justify-center text-white shadow-sm">
                      {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                    </div>
                    {user.role === 'admin' && (
                      <Badge variant="danger" size="sm" className="absolute -top-1 -right-1">
                        Admin
                      </Badge>
                    )}
                  </div>
                  <span className="hidden md:block text-sm font-medium text-gray-700">
                    {user.firstName}
                  </span>
                  <ChevronDown className="hidden md:block h-4 w-4 text-gray-500" />
                </button>
                
                {/* Profile dropdown */}
                {isProfileOpen && (
                  <div className="z-50 origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="px-4 py-3 text-sm text-gray-700 border-b border-gray-200 bg-gray-50">
                      <p className="font-medium">{user.firstName} {user.lastName}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      <Badge variant={user.role === 'admin' ? 'danger' : user.role === 'dentist' ? 'success' : 'primary'} size="sm" className="mt-1">
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </Badge>
                    </div>
                    <Link
                      to="/profile"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      {t('navigation.profile')}
                    </Link>
                    <Link
                      to="/settings"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      {t('navigation.settings')}
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      {t('auth.signOut')}
                    </button>
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
              <div className="-mr-2 flex items-center md:hidden">
                <button
                  onClick={toggleMenu}
                  className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-blue-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-colors duration-200"
                >
                  <span className="sr-only">Open main menu</span>
                  {isMenuOpen ? (
                    <X className="block h-6 w-6" />
                  ) : (
                    <Menu className="block h-6 w-6" />
                  )}
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
  );
};

export default Header;