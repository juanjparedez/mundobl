'use client';

import {
  createContext,
  startTransition,
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
import {
  MESSAGES,
  loadLocaleMessages,
  type TranslationKey,
  type TranslationShape,
} from '@/i18n/messages';
import { trackEvent } from '@/lib/analytics';

interface LocaleContextType {
  locale: SupportedLocale;
  setLocale: (newLocale: SupportedLocale) => void;
  // `t(key)` devuelve la traduccion. `t(key, { var: value })` interpola
  // placeholders {var} en la traduccion. Ej: `t('paginationTotal', { total: 42 })`
  // sobre la string "Total: {total}" → "Total: 42".
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
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
  // Traducciones de los 8 locales NO bundleados (ver messages.ts), cargadas
  // bajo demanda. `es`/`en` nunca pasan por aca — ya viven en `MESSAGES`.
  const [extraMessages, setExtraMessages] = useState<
    Partial<Record<SupportedLocale, TranslationShape>>
  >({});

  // Dispara el `import()` dinamico si el locale no esta bundleado ni ya
  // cargado. No es memoizado a proposito: cada call site lee el estado
  // vigente en su propio render, y `loadLocaleMessages` resuelve del cache
  // del modulo si ya se pidio antes — pedirlo de nuevo no vuelve a bajar nada.
  const ensureLocaleLoaded = (loc: SupportedLocale) => {
    if (loc === 'es' || loc === 'en') return;
    loadLocaleMessages(loc).then((msgs) => {
      setExtraMessages((prev) => (prev[loc] ? prev : { ...prev, [loc]: msgs }));
    });
  };

  useEffect(() => {
    const storedLocale = localStorage.getItem(LOCALE_STORAGE_KEY);

    if (storedLocale && isSupportedLocale(storedLocale)) {
      startTransition(() => {
        setLocaleState(storedLocale);
      });
      document.documentElement.lang = storedLocale;
      ensureLocaleLoaded(storedLocale);
      return;
    }

    const browserLanguage = navigator.language;
    const matchedLocale = isSupportedLocale(browserLanguage)
      ? browserLanguage
      : (DEFAULT_LOCALE as SupportedLocale);

    startTransition(() => {
      setLocaleState(matchedLocale);
    });
    document.documentElement.lang = matchedLocale;
    ensureLocaleLoaded(matchedLocale);
  }, []);

  const setLocale = useCallback((newLocale: SupportedLocale) => {
    // Se lee ANTES de pisarlo. Sirve para distinguir "eligio ingles
    // saliendo del default" de "volvio al español".
    const previous = localStorage.getItem(LOCALE_STORAGE_KEY);

    setLocaleState(newLocale);
    localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
    document.documentElement.lang = newLocale;
    ensureLocaleLoaded(newLocale);

    // El unico dato duro para decidir si vale la pena poner los locales en
    // la URL (rutas /en, hreflang) o no: hoy los 10 idiomas estan
    // traducidos pero Google solo ve el español, y no hay forma de saber
    // cuales pide la gente. Sin PII: solo dos codigos de idioma.
    trackEvent('locale_switch', {
      to: newLocale,
      from: previous ?? 'default',
    });
  }, []);

  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>) => {
      // Mientras el locale elegido termina de cargar (los 8 lazy), `t()`
      // sigue resolviendo en `en` en vez de trabar el render o mostrar la
      // key cruda — el mismo fallback que ya existia para keys faltantes.
      const source = MESSAGES[locale as 'es' | 'en'] ?? extraMessages[locale];
      const localized = source ? getByPath(source, key) : null;
      const fallback =
        localized ??
        getByPath(
          MESSAGES[DEFAULT_LOCALE as 'es' | 'en'] as TranslationShape,
          key
        ) ??
        key;
      if (!params) return fallback;
      let out = fallback;
      for (const [k, v] of Object.entries(params)) {
        out = out.replaceAll(`{${k}}`, String(v));
      }
      return out;
    },
    [locale, extraMessages]
  );

  const contextValue = useMemo(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t]
  );

  return (
    <LocaleContext.Provider value={contextValue}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextType {
  const context = useContext(LocaleContext);
  if (!context) {
    return {
      locale: DEFAULT_LOCALE,
      setLocale: () => {},
      t: (key: TranslationKey, params?: Record<string, string | number>) => {
        const localized =
          getByPath(
            MESSAGES[DEFAULT_LOCALE as 'es' | 'en'] as TranslationShape,
            key
          ) ?? key;
        if (!params) return localized;
        let out = localized;
        for (const [k, v] of Object.entries(params)) {
          out = out.replaceAll(`{${k}}`, String(v));
        }
        return out;
      },
    };
  }
  return context;
}
