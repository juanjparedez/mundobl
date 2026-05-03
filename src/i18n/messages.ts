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
  adminComments: {
    title: string;
    subtitle: string;
    statsTotal: string;
    statsReported: string;
    statsPage: string;
    filterAll: string;
    filterSeries: string;
    filterSeasons: string;
    filterEpisodes: string;
    searchPlaceholder: string;
    reportedOnly: string;
    columnUser: string;
    columnComment: string;
    columnAbout: string;
    columnDate: string;
    columnActions: string;
    targetEpisode: string;
    targetSeason: string;
    targetSeries: string;
    targetSeriesFallback: string;
    targetUnknown: string;
    deletedUser: string;
    unnamedUser: string;
    edited: string;
    reportsSuffixOne: string;
    reportsSuffixMany: string;
    actionView: string;
    actionIgnore: string;
    actionEdit: string;
    actionDelete: string;
    dismissReportsTitle: string;
    dismissReportsDescription: string;
    dismissReportsConfirm: string;
    cancel: string;
    deleteTitle: string;
    deleteDescription: string;
    deleteConfirm: string;
    modalEditTitle: string;
    modalEditPlaceholder: string;
    save: string;
    noReason: string;
    loadError: string;
    deleteSuccess: string;
    deleteError: string;
    dismissSuccess: string;
    dismissError: string;
    editEmptyWarning: string;
    editLengthWarning: string;
    editSuccess: string;
    editError: string;
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
  adminComments: {
    title: 'Comentarios publicos',
    subtitle: 'Moderacion y curaduria editorial de comentarios de la comunidad.',
    statsTotal: 'Total',
    statsReported: 'Reportados',
    statsPage: 'En pagina',
    filterAll: 'Todos',
    filterSeries: 'Series',
    filterSeasons: 'Temporadas',
    filterEpisodes: 'Episodios',
    searchPlaceholder: 'Buscar contenido...',
    reportedOnly: 'Solo reportados',
    columnUser: 'Usuario',
    columnComment: 'Comentario',
    columnAbout: 'Sobre',
    columnDate: 'Fecha',
    columnActions: 'Acciones',
    targetEpisode: 'Episodio',
    targetSeason: 'Temporada',
    targetSeries: 'Serie',
    targetSeriesFallback: 'Serie',
    targetUnknown: 'Sin objetivo',
    deletedUser: 'Usuario eliminado',
    unnamedUser: 'Sin nombre',
    edited: 'Editado',
    reportsSuffixOne: 'reporte',
    reportsSuffixMany: 'reportes',
    actionView: 'Ver',
    actionIgnore: 'Ignorar',
    actionEdit: 'Editar',
    actionDelete: 'Eliminar',
    dismissReportsTitle: 'Descartar reportes?',
    dismissReportsDescription:
      'Se eliminan los reportes y el contador vuelve a cero',
    dismissReportsConfirm: 'Descartar',
    cancel: 'Cancelar',
    deleteTitle: 'Eliminar comentario?',
    deleteDescription: 'Esta accion no se puede deshacer',
    deleteConfirm: 'Eliminar',
    modalEditTitle: 'Editar comentario',
    modalEditPlaceholder: 'Edita el comentario...',
    save: 'Guardar',
    noReason: 'Sin razon',
    loadError: 'Error al cargar comentarios',
    deleteSuccess: 'Comentario eliminado',
    deleteError: 'Error al eliminar comentario',
    dismissSuccess: 'Reportes descartados',
    dismissError: 'Error al descartar reportes',
    editEmptyWarning: 'El contenido no puede estar vacio',
    editLengthWarning: 'El comentario no puede superar 2000 caracteres',
    editSuccess: 'Comentario editado',
    editError: 'Error al editar comentario',
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
  adminComments: {
    title: 'Public comments',
    subtitle: 'Moderation and editorial curation for community comments.',
    statsTotal: 'Total',
    statsReported: 'Reported',
    statsPage: 'On page',
    filterAll: 'All',
    filterSeries: 'Series',
    filterSeasons: 'Seasons',
    filterEpisodes: 'Episodes',
    searchPlaceholder: 'Search content...',
    reportedOnly: 'Reported only',
    columnUser: 'User',
    columnComment: 'Comment',
    columnAbout: 'About',
    columnDate: 'Date',
    columnActions: 'Actions',
    targetEpisode: 'Episode',
    targetSeason: 'Season',
    targetSeries: 'Series',
    targetSeriesFallback: 'Series',
    targetUnknown: 'No target',
    deletedUser: 'Deleted user',
    unnamedUser: 'Unnamed',
    edited: 'Edited',
    reportsSuffixOne: 'report',
    reportsSuffixMany: 'reports',
    actionView: 'View',
    actionIgnore: 'Ignore',
    actionEdit: 'Edit',
    actionDelete: 'Delete',
    dismissReportsTitle: 'Dismiss reports?',
    dismissReportsDescription: 'Reports will be deleted and counter reset to zero',
    dismissReportsConfirm: 'Dismiss',
    cancel: 'Cancel',
    deleteTitle: 'Delete comment?',
    deleteDescription: 'This action cannot be undone',
    deleteConfirm: 'Delete',
    modalEditTitle: 'Edit comment',
    modalEditPlaceholder: 'Edit the comment...',
    save: 'Save',
    noReason: 'No reason',
    loadError: 'Error loading comments',
    deleteSuccess: 'Comment deleted',
    deleteError: 'Error deleting comment',
    dismissSuccess: 'Reports dismissed',
    dismissError: 'Error dismissing reports',
    editEmptyWarning: 'Content cannot be empty',
    editLengthWarning: 'Comment cannot exceed 2000 characters',
    editSuccess: 'Comment updated',
    editError: 'Error updating comment',
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
