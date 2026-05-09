// Locales soportados con traduccion completa.
//
// IMPORTANTE: agregar un locale aca SOLO cuando todas las claves de
// `TranslationShape` esten traducidas en `messages.ts` (via archivos
// en `locales/`). Las traducciones generadas por IA viven en
// `src/i18n/locales/{code}.ts` y se pueden regenerar con:
//   npx tsx scripts/translate-locales.ts {code}
//
// Para agregar un idioma nuevo:
//   1. Agregar a TARGETS en `scripts/translate-locales.ts`
//   2. Correr el script para generar `locales/{code}.ts`
//   3. Agregar a `SUPPORTED_LOCALES` aqui + `LOCALE_LABELS`
//   4. Importar en `messages.ts` y agregar a `MESSAGES`
//   5. Agregar import + entry en `antdLocaleMap` de
//      `ThemeProvider.tsx` para componentes de antd

export const SUPPORTED_LOCALES = [
  'es',
  'en',
  'it',
  'de',
  'fr',
  'ja',
  'ko',
  'zh-CN',
  'zh-TW',
  'th',
] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: SupportedLocale = 'es';

export const LOCALE_STORAGE_KEY = 'app-locale';

export const LOCALE_LABELS: Record<SupportedLocale, string> = {
  es: 'Espanol',
  en: 'English',
  it: 'Italiano',
  de: 'Deutsch',
  fr: 'Francais',
  ja: '日本語',
  ko: '한국어',
  'zh-CN': '简体中文',
  'zh-TW': '繁體中文',
  th: 'ไทย',
};

export function isSupportedLocale(locale: string): locale is SupportedLocale {
  return SUPPORTED_LOCALES.includes(locale as SupportedLocale);
}
