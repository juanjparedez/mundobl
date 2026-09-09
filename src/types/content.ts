/**
 * Tipos de contenido audiovisual
 */
export const ContentType = {
  SERIE: 'serie',
  PELICULA: 'pelicula',
  CORTO: 'corto',
  ESPECIAL: 'especial',
  ANIME: 'anime',
  REALITY: 'reality',
} as const;

export type ContentTypeValue = (typeof ContentType)[keyof typeof ContentType];

/**
 * Configuración de campos visibles por tipo de contenido
 *
 * `hasDuration` cambia de significado segun `hasEpisodes`: en pelicula y
 * corto es la duracion TOTAL de la pieza; en los tipos con episodios es la
 * duracion POR EPISODIO. La UI elige la etiqueta mirando `hasEpisodes`, asi
 * que no hay forma de mostrar "Duracion" a secas en una serie y que se
 * confunda con el total.
 */
export const ContentTypeConfig = {
  [ContentType.SERIE]: {
    label: 'Serie',
    hasSeasons: true,
    hasEpisodes: true,
    hasDuration: true,
    seasonLabel: 'Temporadas',
    episodeLabel: 'Episodios',
    durationLabel: 'Duración por episodio (min)',
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
    hasSeasons: true,
    hasEpisodes: true,
    hasDuration: true,
    seasonLabel: 'Temporadas',
    episodeLabel: 'Episodios',
    durationLabel: 'Duración por episodio (min)',
  },
  [ContentType.ANIME]: {
    label: 'Animé',
    hasSeasons: true,
    hasEpisodes: true,
    hasDuration: true,
    seasonLabel: 'Temporadas',
    episodeLabel: 'Episodios',
    durationLabel: 'Duración por episodio (min)',
  },
  [ContentType.REALITY]: {
    label: 'Reality',
    hasSeasons: true,
    hasEpisodes: true,
    hasDuration: true,
    seasonLabel: 'Temporadas',
    episodeLabel: 'Episodios',
    durationLabel: 'Duración por episodio (min)',
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
    ContentTypeConfig[type as ContentTypeValue] ??
    ContentTypeConfig[ContentType.SERIE]
  );
}
