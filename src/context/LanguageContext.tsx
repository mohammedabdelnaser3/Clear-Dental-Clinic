import React, { createContext, useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface LanguageContextType {
  language: string;
  isRTL: boolean;
  changeLanguage: (lang: string) => void;
  t: (key: string, options?: any) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

interface LanguageProviderProps {
  children: React.ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const { i18n, t } = useTranslation();
  const [language, setLanguage] = useState(i18n.language || 'en');
  const [isRTL, setIsRTL] = useState(false);

  const changeLanguage = async (lang: string) => {
    try {
      await i18n.changeLanguage(lang);
      setLanguage(lang);
      localStorage.setItem('language', lang);
      
      // Update RTL state
      const rtlLanguages = ['ar', 'he', 'fa', 'ur'];
      const isRightToLeft = rtlLanguages.includes(lang);
      setIsRTL(isRightToLeft);
      
      // Update document direction and language
      document.documentElement.dir = isRightToLeft ? 'rtl' : 'ltr';
      document.documentElement.lang = lang;
      
      // Update body class for RTL styling
      if (isRightToLeft) {
        document.body.classList.add('rtl');
      } else {
        document.body.classList.remove('rtl');
      }
    } catch (_error) {
      console.error('Error changing language:', _error);
    }
  };

  useEffect(() => {
    // Initialize RTL state based on current language
    const rtlLanguages = ['ar', 'he', 'fa', 'ur'];
    const isRightToLeft = rtlLanguages.includes(language);
    setIsRTL(isRightToLeft);
    
    // Set initial document direction
    document.documentElement.dir = isRightToLeft ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    
    if (isRightToLeft) {
      document.body.classList.add('rtl');
    } else {
      document.body.classList.remove('rtl');
    }
  }, [language]);

  useEffect(() => {
    // Listen for language changes from i18n
    const handleLanguageChange = (lng: string) => {
      setLanguage(lng);
    };

    i18n.on('languageChanged', handleLanguageChange);
    
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n]);

  const value: LanguageContextType = {
    language,
    isRTL,
    changeLanguage,
    t
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export default LanguageContext;