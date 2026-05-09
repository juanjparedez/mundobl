// Locales soportados con traduccion completa.
//
// IMPORTANTE: agregar un locale aca SOLO cuando todas las claves de
// `TranslationShape` esten traducidas en `messages.ts`. Antes habia
// 10 locales declarados pero 8 eran aliases de `en` con solo la
// palabra "Idioma" traducida — eso generaba la falsa expectativa de
// soporte multi-idioma cuando en realidad mostraba ingles.
//
// Para agregar un idioma nuevo:
//   1. Crear el bloque `const xx: TranslationShape = { ... }` en
//      `messages.ts` con TODAS las claves traducidas.
//   2. Agregar a `SUPPORTED_LOCALES` aqui.
//   3. Agregar el label legible en `LOCALE_LABELS`.
//   4. Agregar el import + entry en `antdLocaleMap` de
//      `ThemeProvider.tsx` para que componentes de antd (DatePicker,
//      Calendar, etc.) usen el locale correcto.

export const SUPPORTED_LOCALES = ['es', 'en'] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: SupportedLocale = 'es';

export const LOCALE_STORAGE_KEY = 'app-locale';

export const LOCALE_LABELS: Record<SupportedLocale, string> = {
  es: 'Espanol',
  en: 'English',
};

export function isSupportedLocale(locale: string): locale is SupportedLocale {
  return SUPPORTED_LOCALES.includes(locale as SupportedLocale);
}
