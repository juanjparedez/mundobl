// Logros del perfil. Todos salen de datos que la app ya registra (nada de
// contadores cosmeticos): series terminadas, capitulos y horas marcados,
// dias en que se abrio el sitio, opiniones publicadas, votos "util" que
// recibieron, comunidad, series compartidas y aportes aprobados.
//
// Es un modulo puro (sin React ni Prisma) para que lo usen el endpoint del
// perfil, los widgets, el guardado (achievement-store.ts) y las pruebas con
// la misma definicion. Lo obtenido se guarda en UserAchievement: un logro
// obtenido queda aunque despues baje su numero.

import type { TranslationShape } from '@/i18n/messages';
import {
  PLATFORM_PATCH_TIERS_TOTAL,
  evaluatePlatformPatches,
  patchAchievementKey,
  type AchievementUnlocks,
  type PlatformPatchProgress,
} from './platform-patches';

export type { AchievementUnlocks } from './platform-patches';

/** Cada logro tiene `achievements.<key>Name` y `achievements.<key>Desc`. */
export type AchievementKey =
  keyof TranslationShape['achievements'] extends infer K
    ? K extends `${infer Base}Name`
      ? Base
      : never
    : never;

export const ACHIEVEMENT_METRICS = [
  'seriesCompleted',
  'episodes',
  'hours',
  'countries',
  'genres',
  'streak',
  'activeDays',
  'ratings',
  'publishedReviews',
  'helpfulVotes',
  'featuredReviews',
  'favorites',
  'comments',
  'communityTopics',
  'communityReplies',
  'publicLists',
  'sharedSeries',
  'approvedSuggestions',
  'glossaryTerms',
  'triviaScore',
] as const;

export type AchievementMetric = (typeof ACHIEVEMENT_METRICS)[number];

/** Lo que mueve marcar capitulos o series: tambien recalcula los parches
 *  de plataforma (dependen de las series terminadas). */
export const WATCHING_METRICS: readonly AchievementMetric[] = [
  'seriesCompleted',
  'episodes',
  'hours',
  'countries',
  'genres',
  'streak',
];

export type AchievementMetricValues = Partial<
  Record<AchievementMetric, number>
>;

export type AchievementCategory =
  | 'watching'
  | 'habits'
  | 'opinions'
  | 'community'
  | 'sharing'
  | 'contributions';

export type AchievementIcon =
  | 'check'
  | 'fire'
  | 'compass'
  | 'heart'
  | 'crown'
  | 'trophy'
  | 'play'
  | 'clock'
  | 'global'
  | 'tags'
  | 'thunder'
  | 'calendar'
  | 'star'
  | 'read'
  | 'like'
  | 'pushpin'
  | 'comment'
  | 'team'
  | 'ordered'
  | 'share'
  | 'bulb'
  | 'book'
  | 'edit';

export type AchievementTone = 'gold' | 'purple' | 'red' | 'blue' | 'green';

export interface AchievementDefinition {
  /** Id estable (tambien prefijo de las keys i18n `achievements.<key>Name`). */
  key: AchievementKey;
  metric: AchievementMetric;
  goal: number;
  category: AchievementCategory;
  icon: AchievementIcon;
  tone: AchievementTone;
}

/** Numeros que alimentan los logros. Es un subconjunto de
 *  `ProfileData['stats']` (GET /api/user/profile). */
export interface AchievementStats {
  watched: number;
  totalEpisodes: number;
  hoursWatched: number;
  countriesWatched: number;
  genresWatched: number;
  longestStreakEver: number;
  activeDays: number;
  ratings: number;
  publishedReviews: number;
  helpfulVotesReceived: number;
  featuredReviews: number;
  favorites: number;
  comments: number;
  communityTopics: number;
  communityReplies: number;
  publicLists: number;
  sharedSeries: number;
  approvedSuggestions: number;
  approvedGlossaryTerms: number;
  glossaryQuizBestScore: number | null;
  completedByPlatform: Array<{ platform: string; count: number }>;
  /** Logros guardados (key → fecha ISO en que se obtuvo). */
  achievementUnlocks: AchievementUnlocks;
}

// Cantidad de preguntas de la trivia del Glosario Cultural. Debe coincidir
// con QUIZ_LENGTH en GlosarioQuiz.tsx (no se importa: es un client component
// con dependencias propias que no tiene sentido arrastrar hasta aca).
export const GLOSSARY_QUIZ_LENGTH = 8;

export const ACHIEVEMENT_CATEGORIES: readonly AchievementCategory[] = [
  'watching',
  'habits',
  'opinions',
  'community',
  'sharing',
  'contributions',
];

export const ACHIEVEMENTS: readonly AchievementDefinition[] = [
  // Ver: series terminadas
  {
    key: 'firstStep',
    metric: 'seriesCompleted',
    goal: 1,
    category: 'watching',
    icon: 'check',
    tone: 'green',
  },
  {
    key: 'onARoll',
    metric: 'seriesCompleted',
    goal: 3,
    category: 'watching',
    icon: 'check',
    tone: 'green',
  },
  {
    key: 'hooked',
    metric: 'seriesCompleted',
    goal: 5,
    category: 'watching',
    icon: 'fire',
    tone: 'green',
  },
  {
    key: 'starter',
    metric: 'seriesCompleted',
    goal: 10,
    category: 'watching',
    icon: 'compass',
    tone: 'green',
  },
  {
    key: 'devotee',
    metric: 'seriesCompleted',
    goal: 25,
    category: 'watching',
    icon: 'heart',
    tone: 'purple',
  },
  {
    key: 'explorer',
    metric: 'seriesCompleted',
    goal: 50,
    category: 'watching',
    icon: 'compass',
    tone: 'gold',
  },
  {
    key: 'completionist',
    metric: 'seriesCompleted',
    goal: 100,
    category: 'watching',
    icon: 'crown',
    tone: 'gold',
  },
  {
    key: 'legend',
    metric: 'seriesCompleted',
    goal: 250,
    category: 'watching',
    icon: 'trophy',
    tone: 'gold',
  },
  // Ver: capitulos, horas y variedad
  {
    key: 'episodes50',
    metric: 'episodes',
    goal: 50,
    category: 'watching',
    icon: 'play',
    tone: 'blue',
  },
  {
    key: 'episodes250',
    metric: 'episodes',
    goal: 250,
    category: 'watching',
    icon: 'play',
    tone: 'purple',
  },
  {
    key: 'episodes1000',
    metric: 'episodes',
    goal: 1000,
    category: 'watching',
    icon: 'play',
    tone: 'gold',
  },
  {
    key: 'hours10',
    metric: 'hours',
    goal: 10,
    category: 'watching',
    icon: 'clock',
    tone: 'blue',
  },
  {
    key: 'binger',
    metric: 'hours',
    goal: 100,
    category: 'watching',
    icon: 'clock',
    tone: 'purple',
  },
  {
    key: 'hours500',
    metric: 'hours',
    goal: 500,
    category: 'watching',
    icon: 'clock',
    tone: 'gold',
  },
  {
    key: 'countries3',
    metric: 'countries',
    goal: 3,
    category: 'watching',
    icon: 'global',
    tone: 'blue',
  },
  {
    key: 'countries6',
    metric: 'countries',
    goal: 6,
    category: 'watching',
    icon: 'global',
    tone: 'gold',
  },
  {
    key: 'genres10',
    metric: 'genres',
    goal: 10,
    category: 'watching',
    icon: 'tags',
    tone: 'purple',
  },
  // Constancia
  {
    key: 'streak3',
    metric: 'streak',
    goal: 3,
    category: 'habits',
    icon: 'fire',
    tone: 'red',
  },
  {
    key: 'streak7',
    metric: 'streak',
    goal: 7,
    category: 'habits',
    icon: 'fire',
    tone: 'red',
  },
  {
    key: 'streak30',
    metric: 'streak',
    goal: 30,
    category: 'habits',
    icon: 'thunder',
    tone: 'gold',
  },
  {
    key: 'activeDays7',
    metric: 'activeDays',
    goal: 7,
    category: 'habits',
    icon: 'calendar',
    tone: 'blue',
  },
  {
    key: 'activeDays30',
    metric: 'activeDays',
    goal: 30,
    category: 'habits',
    icon: 'calendar',
    tone: 'purple',
  },
  {
    key: 'activeDays100',
    metric: 'activeDays',
    goal: 100,
    category: 'habits',
    icon: 'calendar',
    tone: 'gold',
  },
  // Opiniones: valoraciones y reseñas publicadas
  {
    key: 'firstRating',
    metric: 'ratings',
    goal: 1,
    category: 'opinions',
    icon: 'star',
    tone: 'green',
  },
  {
    key: 'rater',
    metric: 'ratings',
    goal: 25,
    category: 'opinions',
    icon: 'star',
    tone: 'gold',
  },
  {
    key: 'ratings100',
    metric: 'ratings',
    goal: 100,
    category: 'opinions',
    icon: 'star',
    tone: 'purple',
  },
  {
    key: 'firstReview',
    metric: 'publishedReviews',
    goal: 1,
    category: 'opinions',
    icon: 'read',
    tone: 'green',
  },
  {
    key: 'reviews5',
    metric: 'publishedReviews',
    goal: 5,
    category: 'opinions',
    icon: 'read',
    tone: 'blue',
  },
  {
    key: 'critic',
    metric: 'publishedReviews',
    goal: 10,
    category: 'opinions',
    icon: 'read',
    tone: 'purple',
  },
  {
    key: 'reviews25',
    metric: 'publishedReviews',
    goal: 25,
    category: 'opinions',
    icon: 'read',
    tone: 'gold',
  },
  {
    key: 'helpful10',
    metric: 'helpfulVotes',
    goal: 10,
    category: 'opinions',
    icon: 'like',
    tone: 'blue',
  },
  {
    key: 'helpful50',
    metric: 'helpfulVotes',
    goal: 50,
    category: 'opinions',
    icon: 'like',
    tone: 'gold',
  },
  {
    key: 'featuredReview',
    metric: 'featuredReviews',
    goal: 1,
    category: 'opinions',
    icon: 'pushpin',
    tone: 'gold',
  },
  {
    key: 'fan',
    metric: 'favorites',
    goal: 25,
    category: 'opinions',
    icon: 'heart',
    tone: 'red',
  },
  // Comunidad
  {
    key: 'firstComment',
    metric: 'comments',
    goal: 1,
    category: 'community',
    icon: 'comment',
    tone: 'green',
  },
  {
    key: 'comments10',
    metric: 'comments',
    goal: 10,
    category: 'community',
    icon: 'comment',
    tone: 'blue',
  },
  {
    key: 'voice',
    metric: 'comments',
    goal: 50,
    category: 'community',
    icon: 'comment',
    tone: 'purple',
  },
  {
    key: 'firstTopic',
    metric: 'communityTopics',
    goal: 1,
    category: 'community',
    icon: 'team',
    tone: 'green',
  },
  {
    key: 'replies10',
    metric: 'communityReplies',
    goal: 10,
    category: 'community',
    icon: 'team',
    tone: 'blue',
  },
  {
    key: 'publicList',
    metric: 'publicLists',
    goal: 1,
    category: 'community',
    icon: 'ordered',
    tone: 'purple',
  },
  // Compartir
  {
    key: 'firstShare',
    metric: 'sharedSeries',
    goal: 1,
    category: 'sharing',
    icon: 'share',
    tone: 'green',
  },
  {
    key: 'shares5',
    metric: 'sharedSeries',
    goal: 5,
    category: 'sharing',
    icon: 'share',
    tone: 'blue',
  },
  {
    key: 'shares20',
    metric: 'sharedSeries',
    goal: 20,
    category: 'sharing',
    icon: 'share',
    tone: 'gold',
  },
  // Aportes al catalogo y al glosario
  {
    key: 'firstSuggestion',
    metric: 'approvedSuggestions',
    goal: 1,
    category: 'contributions',
    icon: 'edit',
    tone: 'green',
  },
  {
    key: 'suggestions5',
    metric: 'approvedSuggestions',
    goal: 5,
    category: 'contributions',
    icon: 'edit',
    tone: 'gold',
  },
  {
    key: 'glossaryContributor',
    metric: 'glossaryTerms',
    goal: 1,
    category: 'contributions',
    icon: 'book',
    tone: 'blue',
  },
  {
    key: 'glossaryScholar',
    metric: 'glossaryTerms',
    goal: 5,
    category: 'contributions',
    icon: 'book',
    tone: 'purple',
  },
  {
    key: 'triviaMaster',
    metric: 'triviaScore',
    goal: GLOSSARY_QUIZ_LENGTH,
    category: 'contributions',
    icon: 'bulb',
    tone: 'gold',
  },
];

export function achievementMetricValue(
  stats: Omit<AchievementStats, 'achievementUnlocks'>,
  metric: AchievementMetric
): number {
  switch (metric) {
    case 'seriesCompleted':
      return stats.watched;
    case 'episodes':
      return stats.totalEpisodes;
    case 'hours':
      return Math.floor(stats.hoursWatched);
    case 'countries':
      return stats.countriesWatched;
    case 'genres':
      return stats.genresWatched;
    case 'streak':
      return stats.longestStreakEver;
    case 'activeDays':
      return stats.activeDays;
    case 'ratings':
      return stats.ratings;
    case 'publishedReviews':
      return stats.publishedReviews;
    case 'helpfulVotes':
      return stats.helpfulVotesReceived;
    case 'featuredReviews':
      return stats.featuredReviews;
    case 'favorites':
      return stats.favorites;
    case 'comments':
      return stats.comments;
    case 'communityTopics':
      return stats.communityTopics;
    case 'communityReplies':
      return stats.communityReplies;
    case 'publicLists':
      return stats.publicLists;
    case 'sharedSeries':
      return stats.sharedSeries;
    case 'approvedSuggestions':
      return stats.approvedSuggestions;
    case 'glossaryTerms':
      return stats.approvedGlossaryTerms;
    case 'triviaScore':
      return stats.glossaryQuizBestScore ?? 0;
  }
}

export function achievementMetricValues(
  stats: Omit<AchievementStats, 'achievementUnlocks'>
): Required<AchievementMetricValues> {
  return Object.fromEntries(
    ACHIEVEMENT_METRICS.map((metric) => [
      metric,
      achievementMetricValue(stats, metric),
    ])
  ) as Required<AchievementMetricValues>;
}

/** Keys que hoy se cumplen con estos numeros, para guardar en
 *  UserAchievement. Solo mira las metricas presentes en `values`; los
 *  parches solo si vienen `completedByPlatform`. */
export function achievementKeysMet(
  values: AchievementMetricValues,
  completedByPlatform?: ReadonlyArray<{ platform: string; count: number }>
): string[] {
  const keys: string[] = ACHIEVEMENTS.filter((definition) => {
    const value = values[definition.metric];
    return value !== undefined && value >= definition.goal;
  }).map((definition) => definition.key);
  if (completedByPlatform) {
    for (const patch of evaluatePlatformPatches(completedByPlatform)) {
      for (const tier of patch.tiersReached) {
        keys.push(patchAchievementKey(patch.key, tier));
      }
    }
  }
  return keys;
}

export interface AchievementProgress extends AchievementDefinition {
  current: number;
  unlocked: boolean;
  /** Fecha ISO en que se obtuvo, o null si esta pendiente. */
  unlockedAt: string | null;
}

export function evaluateAchievements(
  stats: AchievementStats
): AchievementProgress[] {
  return ACHIEVEMENTS.map((definition) => {
    const current = achievementMetricValue(stats, definition.metric);
    const unlockedAt = stats.achievementUnlocks[definition.key] ?? null;
    return {
      ...definition,
      current,
      unlocked: unlockedAt !== null || current >= definition.goal,
      unlockedAt,
    };
  });
}

/** Obtenidos primero (el mas reciente arriba); los pendientes, de mas cerca
 *  a mas lejos de la meta. */
export function sortAchievementsForDisplay(
  items: AchievementProgress[]
): AchievementProgress[] {
  const ratio = (item: AchievementProgress) =>
    Math.min(1, item.current / item.goal);
  return [
    ...items
      .filter((item) => item.unlocked)
      .sort((a, b) => (b.unlockedAt ?? '').localeCompare(a.unlockedAt ?? '')),
    ...items
      .filter((item) => !item.unlocked)
      .sort((a, b) => ratio(b) - ratio(a)),
  ];
}

export interface AchievementSummary {
  items: AchievementProgress[];
  patches: PlatformPatchProgress[];
  /** Logros obtenidos + niveles de parche obtenidos. */
  unlocked: number;
  total: number;
}

/** Logros + parches de plataforma, con el contador que muestra el perfil
 *  (cada nivel de parche cuenta como un logro). */
export function summarizeAchievements(
  stats: AchievementStats
): AchievementSummary {
  const items = evaluateAchievements(stats);
  const patches = evaluatePlatformPatches(
    stats.completedByPlatform,
    stats.achievementUnlocks
  );
  return {
    items,
    patches,
    unlocked:
      items.filter((item) => item.unlocked).length +
      patches.reduce((sum, patch) => sum + patch.tiersUnlocked, 0),
    total: ACHIEVEMENTS.length + PLATFORM_PATCH_TIERS_TOTAL,
  };
}
