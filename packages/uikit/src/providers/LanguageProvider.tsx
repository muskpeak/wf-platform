"use client";

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const LS_KEY = "wf-language";
export const DEFAULT_LOCALE = "en-US";

export type Language = {
  locale: string;
  language: string;
  code: string;
};

export const EN: Language = { locale: 'en-US', language: 'English', code: 'en' };
export const ZHCN: Language = { locale: 'zh-CN', language: '简体中文', code: 'zh-cn' };
export const JA: Language = { locale: 'ja-JP', language: '日本語', code: 'ja' };

export const SUPPORTED_LANGUAGES: Language[] = [EN, ZHCN, JA];

export interface LanguageContextApi {
  currentLanguage: Language;
  setLanguage: (lang: string) => void;
  supportedLanguages: Language[];
}

export const LanguageContext = createContext<LanguageContextApi | undefined>(undefined);

// Helper to get locale from local storage or fallback
function getInitialLocale(): string {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  
  // 1. Check URL query param (Uniswap style)
  const params = new URLSearchParams(window.location.search);
  const lngQuery = params.get("lng");
  if (lngQuery && SUPPORTED_LANGUAGES.some(l => l.locale === lngQuery)) {
    return lngQuery;
  }

  // 2. Check local storage (PancakeSwap style)
  const lsLang = localStorage.getItem(LS_KEY);
  if (lsLang && SUPPORTED_LANGUAGES.some(l => l.locale === lsLang)) {
    return lsLang;
  }

  // 3. Fallback
  return DEFAULT_LOCALE;
}

interface LanguageProviderProps {
  children: React.ReactNode;
  defaultTranslations?: Record<string, any>;
}

export function LanguageProvider({ children, defaultTranslations = {} }: LanguageProviderProps) {
  const [locale, setLocale] = useState<string>(DEFAULT_LOCALE);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize i18n once
  useEffect(() => {
    const initialLocale = getInitialLocale();
    
    if (!i18n.isInitialized) {
      i18n
        .use(initReactI18next)
        .init({
          resources: defaultTranslations,
          lng: initialLocale,
          fallbackLng: DEFAULT_LOCALE,
          interpolation: {
            escapeValue: false, // react already safes from xss
          },
        })
        .then(() => {
          setLocale(initialLocale);
          setIsInitialized(true);
          document.documentElement.setAttribute('lang', initialLocale);
        });
    } else {
      setLocale(initialLocale);
      setIsInitialized(true);
    }
  }, [defaultTranslations]);

  const setLanguage = useCallback((newLocale: string) => {
    if (!SUPPORTED_LANGUAGES.some(l => l.locale === newLocale)) return;

    // Persist to local storage
    if (typeof window !== "undefined") {
      localStorage.setItem(LS_KEY, newLocale);
      
      // Update HTML lang attribute
      document.documentElement.setAttribute('lang', newLocale);

      // Optionally, we could update the URL here without reloading
      const url = new URL(window.location.href);
      url.searchParams.set("lng", newLocale);
      window.history.replaceState({}, '', url);
    }

    // Tell i18next to switch
    i18n.changeLanguage(newLocale).then(() => {
      setLocale(newLocale);
    });
  }, []);

  const providerValue = useMemo(() => {
    const currentLanguage = SUPPORTED_LANGUAGES.find(l => l.locale === locale) || SUPPORTED_LANGUAGES[0];
    return { currentLanguage, setLanguage, supportedLanguages: SUPPORTED_LANGUAGES };
  }, [locale, setLanguage]);

  // Don't render until i18n is ready to avoid hydration mismatch
  if (!isInitialized) return null;

  return (
    <LanguageContext.Provider value={providerValue}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
