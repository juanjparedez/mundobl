'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  type SupportedLocale,
  isSupportedLocale,
} from '@/i18n/config';
import { MESSAGES, type TranslationKey } from '@/i18n/messages';

interface LocaleContextType {
  locale: SupportedLocale;
  setLocale: (newLocale: SupportedLocale) => void;
  t: (key: TranslationKey) => string;
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

interface LocaleProviderProps {
  children: React.ReactNode;
}

function getByPath(
  source: Record<string, unknown>,
  path: string
): string | null {
  const segments = path.split('.');
  let current: unknown = source;

  for (const segment of segments) {
    if (!current || typeof current !== 'object' || !(segment in current)) {
      return null;
    }
    current = (current as Record<string, unknown>)[segment];
  }

  return typeof current === 'string' ? current : null;
}

export function LocaleProvider({ children }: LocaleProviderProps) {
  const [locale, setLocaleState] = useState<SupportedLocale>(DEFAULT_LOCALE);

  useEffect(() => {
    const storedLocale = localStorage.getItem(LOCALE_STORAGE_KEY);

    if (storedLocale && isSupportedLocale(storedLocale)) {
      setLocaleState(storedLocale);
      document.documentElement.lang = storedLocale;
      return;
    }

    const browserLanguage = navigator.language;
    const matchedLocale = isSupportedLocale(browserLanguage)
      ? browserLanguage
      : (DEFAULT_LOCALE as SupportedLocale);

    setLocaleState(matchedLocale);
    document.documentElement.lang = matchedLocale;
  }, []);

  const setLocale = useCallback((newLocale: SupportedLocale) => {
    setLocaleState(newLocale);
    localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
    document.documentElement.lang = newLocale;
  }, []);

  const t = useCallback(
    (key: TranslationKey) => {
      const localized = getByPath(MESSAGES[locale], key);
      if (localized) return localized;

      const fallback = getByPath(MESSAGES[DEFAULT_LOCALE], key);
      return fallback ?? key;
    },
    [locale]
  );

  const contextValue = useMemo(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t]
  );

  return (
    <LocaleContext.Provider value={contextValue}>{children}</LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocale debe usarse dentro de LocaleProvider');
  }
  return context;
}
