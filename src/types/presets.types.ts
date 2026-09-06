import type { DensityKey } from './theme.types';

export type ViewPresetKey =
  | 'cinema'
  | 'tracker'
  | 'encyclopedia'
  | 'blind'
  | 'custom';

export interface ViewPresetConfig {
  id: ViewPresetKey;
  emoji: string;
  nameKey: string;
  nameFallback: string;
  taglineKey: string;
  taglineFallback: string;
  descriptionKey: string;
  descriptionFallback: string;
  targetViewMode: 'grid' | 'list' | 'carousel';
  targetDensity: DensityKey;
  spoilerFree: boolean;
  cardStyle: 'cinema' | 'tracker' | 'encyclopedia' | 'blind';
}

export const VIEW_PRESETS: Record<ViewPresetKey, ViewPresetConfig> = {
  cinema: {
    id: 'cinema',
    emoji: '🎬',
    nameKey: 'presets.cinemaName',
    nameFallback: 'Cine & Streaming',
    taglineKey: 'presets.cinemaTagline',
    taglineFallback:
      'Pósters grandes y descubrimiento visual sin distracciones',
    descriptionKey: 'presets.cinemaDesc',
    descriptionFallback:
      'Diseñado para maratonear y explorar visualmente. Destaca carátulas limpias, sinopsis concisas y acceso directo a reproducir.',
    targetViewMode: 'grid',
    targetDensity: 'comfortable',
    spoilerFree: false,
    cardStyle: 'cinema',
  },
  tracker: {
    id: 'tracker',
    emoji: '📋',
    nameKey: 'presets.trackerName',
    nameFallback: 'Tracker & Cuaderno',
    taglineKey: 'presets.trackerTagline',
    taglineFallback: 'Foco en avance, próximos estrenos y notas personales',
    descriptionKey: 'presets.trackerDesc',
    descriptionFallback:
      'Ideal para el espectador organizado. Muestra barras de progreso, alertas de días de emisión y acceso rápido a notas privadas.',
    targetViewMode: 'grid',
    targetDensity: 'compact',
    spoilerFree: false,
    cardStyle: 'tracker',
  },
  encyclopedia: {
    id: 'encyclopedia',
    emoji: '📚',
    nameKey: 'presets.encyclopediaName',
    nameFallback: 'Enciclopedia & Curaduría',
    taglineKey: 'presets.encyclopediaTagline',
    taglineFallback:
      'Máxima información: elenco, tropos, productoras y enlaces',
    descriptionKey: 'presets.encyclopediaDesc',
    descriptionFallback:
      'Para fans investigadores y curiosos. Despliega tags de tropos, equipo de producción, universo conectado y contexto cultural.',
    targetViewMode: 'list',
    targetDensity: 'compact',
    spoilerFree: false,
    cardStyle: 'encyclopedia',
  },
  blind: {
    id: 'blind',
    emoji: '🙈',
    nameKey: 'presets.blindName',
    nameFallback: 'Cero Spoilers',
    taglineKey: 'presets.blindTagline',
    taglineFallback: 'Miniaturas con desenfoque y sinopsis protegidas',
    descriptionKey: 'presets.blindDesc',
    descriptionFallback:
      'Para disfrutar estrenos a ciegas. Difumina portadas de capítulos, tapa giros argumentales y colapsa sinopsis.',
    targetViewMode: 'grid',
    targetDensity: 'comfortable',
    spoilerFree: true,
    cardStyle: 'blind',
  },
  custom: {
    id: 'custom',
    emoji: '⚙️',
    nameKey: 'presets.customName',
    nameFallback: 'Personalizado',
    taglineKey: 'presets.customTagline',
    taglineFallback: 'Control granular de densidad, vista y comportamiento',
    descriptionKey: 'presets.customDesc',
    descriptionFallback:
      'Tu propia combinación manual configurada desde los ajustes avanzados.',
    targetViewMode: 'grid',
    targetDensity: 'comfortable',
    spoilerFree: false,
    cardStyle: 'cinema',
  },
};
