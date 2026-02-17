/**
 * Constantes relacionadas con series
 */

export const GENEROS = [
  'Acción',
  'Aventura',
  'Comedia',
  'Drama',
  'Ciencia Ficción',
  'Fantasía',
  'Terror',
  'Thriller',
  'Romance',
  'Misterio',
  'Animación',
  'Documental',
  'Crimen',
  'Histórico',
  'Musical',
] as const;

export const WATCH_STATUS = {
  SIN_VER: 'SIN_VER',
  VIENDO: 'VIENDO',
  VISTA: 'VISTA',
  ABANDONADA: 'ABANDONADA',
  RETOMAR: 'RETOMAR',
} as const;

export type WatchStatusValue = (typeof WATCH_STATUS)[keyof typeof WATCH_STATUS];

export const WATCH_STATUS_LABELS: Record<WatchStatusValue, string> = {
  [WATCH_STATUS.SIN_VER]: 'Sin ver',
  [WATCH_STATUS.VIENDO]: 'Viendo ahora',
  [WATCH_STATUS.VISTA]: 'Vista',
  [WATCH_STATUS.ABANDONADA]: 'Abandonada',
  [WATCH_STATUS.RETOMAR]: 'Retomar',
};

export const WATCH_STATUS_COLORS: Record<WatchStatusValue, string> = {
  [WATCH_STATUS.SIN_VER]: 'default',
  [WATCH_STATUS.VIENDO]: 'processing',
  [WATCH_STATUS.VISTA]: 'success',
  [WATCH_STATUS.ABANDONADA]: 'error',
  [WATCH_STATUS.RETOMAR]: 'warning',
};
