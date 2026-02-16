/**
 * Tipos de contenido audiovisual
 */
export const ContentType = {
  SERIE: 'serie',
  PELICULA: 'pelicula',
  CORTO: 'corto',
  ESPECIAL: 'especial',
} as const;

export type ContentTypeValue = (typeof ContentType)[keyof typeof ContentType];

/**
 * Configuración de campos visibles por tipo de contenido
 */
export const ContentTypeConfig = {
  [ContentType.SERIE]: {
    label: 'Serie',
    hasSeasons: true,
    hasEpisodes: true,
    hasDuration: false,
    seasonLabel: 'Temporadas',
    episodeLabel: 'Episodios',
  },
  [ContentType.PELICULA]: {
    label: 'Película',
    hasSeasons: false,
    hasEpisodes: false,
    hasDuration: true,
    durationLabel: 'Duración (min)',
  },
  [ContentType.CORTO]: {
    label: 'Cortometraje',
    hasSeasons: false,
    hasEpisodes: false,
    hasDuration: true,
    durationLabel: 'Duración (min)',
  },
  [ContentType.ESPECIAL]: {
    label: 'Especial',
    hasSeasons: false,
    hasEpisodes: false,
    hasDuration: true,
    durationLabel: 'Duración (min)',
  },
} as const;

/**
 * Verifica si un tipo de contenido debe mostrar temporadas
 */
export function shouldShowSeasons(type: string): boolean {
  return ContentTypeConfig[type as ContentTypeValue]?.hasSeasons ?? false;
}

/**
 * Verifica si un tipo de contenido debe mostrar episodios
 */
export function shouldShowEpisodes(type: string): boolean {
  return ContentTypeConfig[type as ContentTypeValue]?.hasEpisodes ?? false;
}

/**
 * Verifica si un tipo de contenido debe mostrar duración
 */
export function shouldShowDuration(type: string): boolean {
  return ContentTypeConfig[type as ContentTypeValue]?.hasDuration ?? false;
}

/**
 * Obtiene la configuración para un tipo de contenido
 */
export function getContentTypeConfig(type: string) {
  return (
    ContentTypeConfig[type as ContentTypeValue] ?? ContentTypeConfig[ContentType.SERIE]
  );
}
