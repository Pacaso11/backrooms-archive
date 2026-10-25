import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { StorageService } from '../services/storageService';

export type Language = 'es' | 'en';

export interface LanguageContextType {
  language: Language;
  setLanguage: (l: Language) => Promise<void>;
  isEs: boolean;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({
  children,
  initialLanguage,
}: {
  children: ReactNode;
  initialLanguage?: Language;
}) {
  const [language, setLanguageState] = useState<Language>(initialLanguage || 'es');

  useEffect(() => {
    let mounted = true;
    if (initialLanguage) {
      return;
    }
    StorageService.getLanguage()
      .then((stored) => {
        if (mounted && (stored === 'es' || stored === 'en')) {
          setLanguageState(stored);
        }
      })
      .catch((err) => {
        console.warn('LanguageProvider: failed to load initial language', err);
      });
    return () => {
      mounted = false;
    };
  }, [initialLanguage]);

  const setLanguage = useCallback(async (newLang: Language) => {
    setLanguageState(newLang);
    try {
      await StorageService.setLanguage(newLang);
    } catch (err) {
      console.warn('LanguageProvider: failed to persist language', err);
    }
  }, []);

  const value: LanguageContextType = {
    language,
    setLanguage,
    isEs: language === 'es',
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
