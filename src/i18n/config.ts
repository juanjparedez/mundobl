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
