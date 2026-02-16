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

export const ESTADOS_SERIE = {
  ACTIVA: 'activa',
  FINALIZADA: 'finalizada',
  CANCELADA: 'cancelada',
  EN_PAUSA: 'en_pausa',
} as const;

export const ESTADOS_LABELS = {
  [ESTADOS_SERIE.ACTIVA]: 'Activa',
  [ESTADOS_SERIE.FINALIZADA]: 'Finalizada',
  [ESTADOS_SERIE.CANCELADA]: 'Cancelada',
  [ESTADOS_SERIE.EN_PAUSA]: 'En Pausa',
} as const;
