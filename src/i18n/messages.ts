import type { SupportedLocale } from './config';

type TranslationShape = {
  common: {
    language: string;
  };
  appLayout: {
    skipToContent: string;
  };
  sidebar: {
    catalog: string;
    watching: string;
    feedback: string;
    sites: string;
    content: string;
    administration: string;
    series: string;
    tags: string;
    universes: string;
    actors: string;
    directors: string;
    users: string;
    comments: string;
    info: string;
    logs: string;
    collapseMenu: string;
    expandMenu: string;
    login: string;
    logout: string;
    switchToLight: string;
    switchToDark: string;
    dark: string;
    light: string;
  };
  bottomNav: {
    mainNavigation: string;
    catalog: string;
    watching: string;
    feedback: string;
    admin: string;
    loading: string;
    login: string;
    logout: string;
    theme: string;
    switchToLight: string;
    switchToDark: string;
  };
};

const es: TranslationShape = {
  common: {
    language: 'Idioma',
  },
  appLayout: {
    skipToContent: 'Saltar al contenido principal',
  },
  sidebar: {
    catalog: 'Catalogo',
    watching: 'Viendo Ahora',
    feedback: 'Feedback',
    sites: 'Sitios de Interes',
    content: 'Contenido',
    administration: 'Administracion',
    series: 'Series',
    tags: 'Tags',
    universes: 'Universos',
    actors: 'Actores',
    directors: 'Directores',
    users: 'Usuarios',
    comments: 'Comentarios',
    info: 'Info',
    logs: 'Logs',
    collapseMenu: 'Colapsar menu',
    expandMenu: 'Expandir menu',
    login: 'Iniciar sesion',
    logout: 'Cerrar sesion',
    switchToLight: 'Cambiar a modo claro',
    switchToDark: 'Cambiar a modo oscuro',
    dark: 'Oscuro',
    light: 'Claro',
  },
  bottomNav: {
    mainNavigation: 'Navegacion principal',
    catalog: 'Catalogo',
    watching: 'Viendo',
    feedback: 'Feedback',
    admin: 'Admin',
    loading: 'Cargando',
    login: 'Entrar',
    logout: 'Salir',
    theme: 'Tema',
    switchToLight: 'Cambiar a modo claro',
    switchToDark: 'Cambiar a modo oscuro',
  },
};

const en: TranslationShape = {
  common: {
    language: 'Language',
  },
  appLayout: {
    skipToContent: 'Skip to main content',
  },
  sidebar: {
    catalog: 'Catalog',
    watching: 'Watching Now',
    feedback: 'Feedback',
    sites: 'Useful Sites',
    content: 'Content',
    administration: 'Administration',
    series: 'Series',
    tags: 'Tags',
    universes: 'Universes',
    actors: 'Actors',
    directors: 'Directors',
    users: 'Users',
    comments: 'Comments',
    info: 'Info',
    logs: 'Logs',
    collapseMenu: 'Collapse menu',
    expandMenu: 'Expand menu',
    login: 'Sign in',
    logout: 'Sign out',
    switchToLight: 'Switch to light mode',
    switchToDark: 'Switch to dark mode',
    dark: 'Dark',
    light: 'Light',
  },
  bottomNav: {
    mainNavigation: 'Main navigation',
    catalog: 'Catalog',
    watching: 'Watching',
    feedback: 'Feedback',
    admin: 'Admin',
    loading: 'Loading',
    login: 'Sign in',
    logout: 'Sign out',
    theme: 'Theme',
    switchToLight: 'Switch to light mode',
    switchToDark: 'Switch to dark mode',
  },
};

const it: TranslationShape = {
  ...en,
  common: { language: 'Lingua' },
};

const de: TranslationShape = {
  ...en,
  common: { language: 'Sprache' },
};

const fr: TranslationShape = {
  ...en,
  common: { language: 'Langue' },
};

const ja: TranslationShape = {
  ...en,
  common: { language: '言語' },
};

const ko: TranslationShape = {
  ...en,
  common: { language: '언어' },
};

const zhCN: TranslationShape = {
  ...en,
  common: { language: '语言' },
};

const zhTW: TranslationShape = {
  ...en,
  common: { language: '語言' },
};

const th: TranslationShape = {
  ...en,
  common: { language: 'ภาษา' },
};

export const MESSAGES: Record<SupportedLocale, TranslationShape> = {
  es,
  en,
  it,
  de,
  fr,
  ja,
  ko,
  'zh-CN': zhCN,
  'zh-TW': zhTW,
  th,
};

type Join<K extends string, P extends string> = `${K}.${P}`;

type Leaves<T> = T extends string
  ? never
  : {
      [K in keyof T & string]: T[K] extends string
        ? K
        : Join<K, Leaves<T[K]>>;
    }[keyof T & string];

export type TranslationKey = Leaves<TranslationShape>;
