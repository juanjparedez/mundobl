export const CATEGORY_COLORS: Record<string, string> = {
  streaming: 'purple',
  oficiales: 'gold',
  productoras: 'orange',
  youtube: 'red',
  noticias: 'blue',
  info: 'cyan',
  comunidad: 'green',
  otro: 'default',
};

export const CATEGORY_LABELS: Record<string, string> = {
  streaming: 'Streaming',
  oficiales: 'Páginas Oficiales',
  productoras: 'Productoras',
  youtube: 'Canales de YouTube',
  noticias: 'Noticias',
  info: 'Información',
  comunidad: 'Comunidad',
  otro: 'Otros',
};

export const CATEGORY_ORDER = [
  'streaming',
  'oficiales',
  'productoras',
  'youtube',
  'noticias',
  'info',
  'comunidad',
  'otro',
];

export const CATEGORY_SELECT_OPTIONS = Object.entries(CATEGORY_LABELS).map(
  ([value, label]) => ({ value, label })
);

export const LANGUAGE_OPTIONS = [
  { label: 'Español', value: 'ES' },
  { label: 'Inglés', value: 'EN' },
  { label: 'Multi', value: 'Multi' },
  { label: 'Tailandés', value: 'TH' },
  { label: 'Japonés', value: 'JP' },
  { label: 'Coreano', value: 'KR' },
  { label: 'Chino', value: 'ZH' },
  { label: 'Portugués', value: 'PT' },
];
