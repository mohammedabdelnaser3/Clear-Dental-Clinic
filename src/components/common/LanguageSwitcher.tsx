import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { GlobeAltIcon, CheckIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';

interface LanguageSwitcherProps {
  className?: string;
  showIcon?: boolean;
  variant?: 'dropdown' | 'toggle' | 'menu';
  showLabel?: boolean;
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ 
  className = '', 
  showIcon = true, 
  variant = 'dropdown',
  showLabel = false
}) => {
  const { language, changeLanguage } = useLanguage();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const languages = [
    { code: 'en', name: t('languages.english', 'English'), nativeName: 'English', flag: '🇺🇸' },
    { code: 'ar', name: t('languages.arabic', 'Arabic'), nativeName: 'العربية', flag: '🇦🇪' }
  ];

  const handleLanguageChange = (langCode: string) => {
    changeLanguage(langCode);
    setIsOpen(false);
  };
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setIsOpen(false);
    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isOpen]);

  if (variant === 'menu') {
    return (
      <div className={`relative ${className}`}>
        <button 
          onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
          className="flex items-center space-x-2 rtl:space-x-reverse px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          {showIcon && <GlobeAltIcon className="h-5 w-5 text-gray-500 mr-2 rtl:ml-2 rtl:mr-0" />}
          <span>{languages.find(lang => lang.code === language)?.flag}</span>
          {showLabel && <span className="mx-1">{languages.find(lang => lang.code === language)?.name}</span>}
          <span className="sr-only">{t('common.selectLanguage', 'Select language')}</span>
        </button>
        
        {isOpen && (
          <div 
            className="absolute z-10 mt-1 w-48 bg-white shadow-lg rounded-md py-1 ring-1 ring-black ring-opacity-5 focus:outline-none"
            role="menu"
            aria-orientation="vertical"
            onClick={(e) => e.stopPropagation()}
          >
            {languages.map((lang) => (
              <button
                key={lang.code}
                className={`flex items-center w-full text-left px-4 py-2 text-sm ${language === lang.code ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}
                onClick={() => handleLanguageChange(lang.code)}
                role="menuitem"
              >
                <span className="mr-2 rtl:ml-2 rtl:mr-0">{lang.flag}</span>
                <span>{lang.name}</span>
                {language === lang.code && (
                  <CheckIcon className="ml-auto h-4 w-4 text-blue-500" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }
  
  if (variant === 'toggle') {
    return (
      <div className={`flex items-center space-x-2 rtl:space-x-reverse ${className}`}>
        {showIcon && (
          <GlobeAltIcon className="h-5 w-5 text-gray-500" />
        )}
        <button
          onClick={() => handleLanguageChange(language === 'en' ? 'ar' : 'en')}
          className="flex items-center px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          aria-label={t('common.switchLanguage', 'Switch language')}
        >
          <span className="mr-1 rtl:ml-1 rtl:mr-0">
            {language === 'en' ? '🇦🇪' : '🇺🇸'}
          </span>
          {language === 'en' ? 'العربية' : 'English'}
        </button>
      </div>
    );
  }

  return (
    <div className={`relative inline-block text-left ${className}`}>
      <div className="flex items-center space-x-2 rtl:space-x-reverse">
        {showIcon && (
          <GlobeAltIcon className="h-5 w-5 text-gray-500" />
        )}
        <div className="relative">
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="block w-full appearance-none pl-8 pr-10 py-2 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 transition-colors"
            aria-label={t('common.selectLanguage', 'Select language')}
          >
            {languages.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.flag} {showLabel ? lang.name : lang.nativeName}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 left-0 rtl:left-auto rtl:right-0 flex items-center pl-2 rtl:pr-2 rtl:pl-0">
            <span className="text-lg">
              {language === 'en' ? '🇺🇸' : '🇦🇪'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LanguageSwitcher;