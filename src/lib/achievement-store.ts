// Guardado de logros (UserAchievement). Cada accion que mueve una metrica
// llama a awardAchievements con las metricas que toco: se recalculan solo
// esas, para ese usuario, y se guarda lo que se cumple con la fecha de ese
// momento. El perfil ademas sincroniza todo con sus estadisticas
// (syncAchievementUnlocks), lo que cubre cambios que no hace el usuario,
// como que se carguen duraciones de capitulos.
//
// Un logro guardado no se borra: si baja el numero que lo dio, queda.

import { after } from 'next/server';
import { loadLocaleMessages } from '@/i18n/messages';
import {
  ACHIEVEMENTS,
  ACHIEVEMENT_METRICS,
  WATCHING_METRICS,
  achievementKeysMet,
  achievementMetricValues,
  type AchievementMetric,
  type AchievementMetricValues,
  type AchievementStats,
  type AchievementUnlocks,
} from './achievements';
import {
  PATCH_PLATFORMS,
  PLATFORM_PATCHES,
  type PatchTier,
} from './platform-patches';
import { countUserWatchedChapters, getWatchedTime, prisma } from './database';
import type { Prisma } from '../generated/prisma';
import { interpolateMessage } from './i18n-format';
import { notifyUser } from './notifications';

type PlatformCompletions = Array<{ platform: string; count: number }>;

async function countDistinct(rows: Promise<Array<{ count: bigint }>>) {
  return Number((await rows)[0]?.count ?? 0);
}

/** Racha mas larga de dias seguidos marcando capitulos, de toda la vida (el
 *  longestStreak del perfil mira solo las ultimas 12 semanas). */
async function longestStreakEver(userId: string): Promise<number> {
  const rows = await prisma.$queryRaw<Array<{ longest: bigint | null }>>`
    WITH days AS (
      SELECT DISTINCT DATE(vs."watchedDate") AS day
      FROM "ViewStatus" vs
      WHERE vs."userId" = ${userId}
        AND vs.status = 'VISTA'
        AND vs."episodeId" IS NOT NULL
        AND vs."watchedDate" <= NOW()
    ),
    runs AS (
      SELECT day - (ROW_NUMBER() OVER (ORDER BY day))::int AS run
      FROM days
    )
    SELECT MAX(length) AS longest
    FROM (SELECT COUNT(*) AS length FROM runs GROUP BY run) AS lengths
  `;
  return Number(rows[0]?.longest ?? 0);
}

/** Reseñas publicadas y votos "util" que recibieron (borradores y ocultas no
 *  suman). */
async function publishedReviewTotals(userId: string) {
  const reviews = await prisma.review.aggregate({
    where: { userId, status: 'PUBLISHED' },
    _count: { _all: true },
    _sum: { helpfulCount: true },
  });
  return {
    count: reviews._count._all,
    helpful: reviews._sum.helpfulCount ?? 0,
  };
}

/** Series terminadas con link oficial en cada plataforma con parche. */
async function loadCompletedByPlatform(
  userId: string
): Promise<PlatformCompletions> {
  const rows = await prisma.$queryRaw<
    Array<{ platform: string; count: bigint }>
  >`
    SELECT wl.platform, COUNT(DISTINCT vs."seriesId") AS count
    FROM "ViewStatus" vs
    JOIN "WatchLink" wl ON wl."seriesId" = vs."seriesId"
    WHERE vs."userId" = ${userId}
      AND vs.status = 'VISTA'
      AND wl.official = true
      AND wl.platform = ANY(${PATCH_PLATFORMS})
    GROUP BY wl.platform
  `;
  return rows.map((row) => ({
    platform: row.platform,
    count: Number(row.count),
  }));
}

/** Valor actual de cada metrica, con los mismos criterios que las
 *  estadisticas del perfil. Solo cuenta lo que otros pueden ver o lo que se
 *  aprobo: borradores, reseñas ocultas y contenido moderado no suman. */
const METRIC_LOADERS: Record<
  AchievementMetric,
  (userId: string) => Promise<number>
> = {
  seriesCompleted: (userId) =>
    prisma.viewStatus.count({
      where: { userId, status: 'VISTA', seriesId: { not: null } },
    }),
  episodes: countUserWatchedChapters,
  hours: async (userId) =>
    Math.floor((await getWatchedTime(userId)).hoursWatched),
  countries: (userId) =>
    countDistinct(prisma.$queryRaw`
      SELECT COUNT(DISTINCT (c.name, c.code)) AS count
      FROM "ViewStatus" vs
      JOIN "Series" s ON vs."seriesId" = s.id
      JOIN "Country" c ON s."countryId" = c.id
      WHERE vs."userId" = ${userId}
        AND vs.status = 'VISTA'
        AND vs."seriesId" IS NOT NULL
    `),
  genres: (userId) =>
    countDistinct(prisma.$queryRaw`
      SELECT COUNT(DISTINCT g.name) AS count
      FROM "ViewStatus" vs
      JOIN "SeriesGenre" sg ON sg."seriesId" = vs."seriesId"
      JOIN "Genre" g ON sg."genreId" = g.id
      WHERE vs."userId" = ${userId}
        AND vs.status = 'VISTA'
        AND vs."seriesId" IS NOT NULL
    `),
  streak: longestStreakEver,
  activeDays: (userId) => prisma.userActiveDay.count({ where: { userId } }),
  ratings: (userId) =>
    countDistinct(prisma.$queryRaw`
      SELECT COUNT(DISTINCT "seriesId") AS count
      FROM "UserRating"
      WHERE "userId" = ${userId}
    `),
  publishedReviews: async (userId) =>
    (await publishedReviewTotals(userId)).count,
  helpfulVotes: async (userId) => (await publishedReviewTotals(userId)).helpful,
  featuredReviews: (userId) =>
    prisma.review.count({
      where: { userId, status: 'PUBLISHED', isFeatured: true },
    }),
  favorites: (userId) => prisma.userFavorite.count({ where: { userId } }),
  comments: (userId) => prisma.comment.count({ where: { userId } }),
  communityTopics: (userId) =>
    prisma.communityTopic.count({
      where: { userId, moderationHidden: false },
    }),
  communityReplies: (userId) =>
    prisma.communityReply.count({
      where: { userId, moderationHidden: false },
    }),
  publicLists: (userId) =>
    prisma.recommendationList.count({
      where: {
        userId,
        visibility: 'PUBLIC',
        moderationHidden: false,
        items: { some: {} },
      },
    }),
  sharedSeries: (userId) => prisma.seriesShare.count({ where: { userId } }),
  approvedSuggestions: (userId) =>
    prisma.seriesSuggestion.count({ where: { userId, status: 'APPROVED' } }),
  glossaryTerms: (userId) =>
    prisma.glossarySuggestion.count({ where: { userId, status: 'APPROVED' } }),
  triviaScore: async (userId) => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { glossaryQuizBestScore: true },
    });
    return user?.glossaryQuizBestScore ?? 0;
  },
};

export interface AchievementCounts {
  activeDays: number;
  /** Racha mas larga de toda la vida: un logro no puede perderse por el
   *  paso del tiempo. */
  longestStreakEver: number;
  publishedReviews: number;
  helpfulVotesReceived: number;
  featuredReviews: number;
  communityTopics: number;
  communityReplies: number;
  publicLists: number;
  sharedSeries: number;
  approvedSuggestions: number;
  completedByPlatform: PlatformCompletions;
}

/** Contadores que solo usan los logros (el resto sale de las estadisticas
 *  del perfil). */
export async function getAchievementCounts(
  userId: string
): Promise<AchievementCounts> {
  const [
    activeDays,
    longestStreak,
    reviews,
    featuredReviews,
    communityTopics,
    communityReplies,
    publicLists,
    sharedSeries,
    approvedSuggestions,
    completedByPlatform,
  ] = await Promise.all([
    METRIC_LOADERS.activeDays(userId),
    METRIC_LOADERS.streak(userId),
    publishedReviewTotals(userId),
    METRIC_LOADERS.featuredReviews(userId),
    METRIC_LOADERS.communityTopics(userId),
    METRIC_LOADERS.communityReplies(userId),
    METRIC_LOADERS.publicLists(userId),
    METRIC_LOADERS.sharedSeries(userId),
    METRIC_LOADERS.approvedSuggestions(userId),
    loadCompletedByPlatform(userId),
  ]);
  return {
    activeDays,
    longestStreakEver: longestStreak,
    publishedReviews: reviews.count,
    helpfulVotesReceived: reviews.helpful,
    featuredReviews,
    communityTopics,
    communityReplies,
    publicLists,
    sharedSeries,
    approvedSuggestions,
    completedByPlatform,
  };
}

/** Logros guardados del usuario: key → fecha ISO. */
export async function getAchievementUnlocks(
  userId: string
): Promise<AchievementUnlocks> {
  const rows = await prisma.userAchievement.findMany({
    where: { userId },
    select: { key: true, unlockedAt: true },
  });
  return Object.fromEntries(
    rows.map((row) => [row.key, row.unlockedAt.toISOString()])
  );
}

const TIER_LABEL_KEYS = {
  bronze: 'patchBronze',
  silver: 'patchSilver',
  gold: 'patchGold',
} as const satisfies Record<PatchTier, string>;

const PATCH_KEY = /^patch:([^:]+):(bronze|silver|gold)$/;

/** Aviso en el inbox (sin push) con los logros recien obtenidos. Se guarda
 *  en español, como el resto de los avisos. */
async function notifyAchievementsUnlocked(userId: string, keys: string[]) {
  const { achievements: messages } = await loadLocaleMessages('es');
  const names = keys.map((key) => {
    const patch = PATCH_KEY.exec(key);
    if (patch) {
      const definition = PLATFORM_PATCHES.find((p) => p.key === patch[1]);
      return interpolateMessage(messages.patchUnlockedLabel, {
        platform: definition?.platform ?? patch[1],
        tier: messages[TIER_LABEL_KEYS[patch[2] as PatchTier]],
      });
    }
    const definition = ACHIEVEMENTS.find((a) => a.key === key);
    return definition ? messages[`${definition.key}Name`] : key;
  });
  await notifyUser({
    userId,
    type: 'achievement_unlocked',
    title:
      names.length === 1
        ? interpolateMessage(messages.unlockedNotificationTitle, {
            name: names[0],
          })
        : interpolateMessage(messages.unlockedNotificationTitleMany, {
            count: names.length,
          }),
    body: names.length === 1 ? undefined : names.join(', '),
    linkPath: '/perfil?tab=logros',
    refType: 'achievement',
    refId: [...keys].sort().join(','),
    push: false,
  });
}

interface StoreOptions {
  /** false en el backfill: lo ya cumplido antes del deploy no se avisa. */
  notify?: boolean;
}

/** Guarda las keys que falten y devuelve las recien guardadas. Inserta de a
 *  una con skipDuplicates: si dos requests otorgan lo mismo a la vez, solo
 *  una la guarda (y avisa). */
async function storeUnlocks(
  userId: string,
  keys: string[],
  { notify = true }: StoreOptions = {}
): Promise<string[]> {
  if (keys.length === 0) return [];
  const existing = await prisma.userAchievement.findMany({
    where: { userId, key: { in: keys } },
    select: { key: true },
  });
  const stored = new Set(existing.map((row) => row.key));
  const inserted: string[] = [];
  for (const key of keys.filter((k) => !stored.has(k))) {
    const { count } = await prisma.userAchievement.createMany({
      data: [{ userId, key }],
      skipDuplicates: true,
    });
    if (count > 0) inserted.push(key);
  }
  if (notify && inserted.length > 0) {
    await notifyAchievementsUnlocked(userId, inserted);
  }
  return inserted;
}

/** Recalcula estas metricas del usuario y guarda lo que ahora cumple.
 *  Devuelve las keys recien obtenidas. */
export async function awardAchievements(
  userId: string,
  metrics: readonly AchievementMetric[],
  options?: StoreOptions
): Promise<string[]> {
  const unique = [...new Set(metrics)];
  const [entries, completedByPlatform] = await Promise.all([
    Promise.all(
      unique.map(
        async (metric) =>
          [metric, await METRIC_LOADERS[metric](userId)] as const
      )
    ),
    unique.includes('seriesCompleted')
      ? loadCompletedByPlatform(userId)
      : undefined,
  ]);
  const values: AchievementMetricValues = Object.fromEntries(entries);
  return storeUnlocks(
    userId,
    achievementKeysMet(values, completedByPlatform),
    options
  );
}

/** Todas las metricas (backfill y otorgamientos sin metrica puntual). */
export function awardAllAchievements(userId: string, options?: StoreOptions) {
  return awardAchievements(userId, ACHIEVEMENT_METRICS, options);
}

/** Desde las estadisticas que ya calculo el perfil (sin queries extra):
 *  guarda lo que se cumpla y devuelve todo lo guardado. */
export async function syncAchievementUnlocks(
  userId: string,
  stats: Omit<AchievementStats, 'achievementUnlocks'>
): Promise<AchievementUnlocks> {
  await storeUnlocks(
    userId,
    achievementKeysMet(
      achievementMetricValues(stats),
      stats.completedByPlatform
    )
  );
  return getAchievementUnlocks(userId);
}

// Lo que borra "Reiniciar datos" (ViewStatus, UserRating, UserFavorite).
const TRACKING_METRICS: ReadonlySet<AchievementMetric> = new Set([
  ...WATCHING_METRICS,
  'ratings',
  'favorites',
]);

/** Filtro de los logros que salen del seguimiento (y los parches): al
 *  reiniciar el historial se vuelven a ganar desde cero. Reseñas, comunidad
 *  y aportes siguen ahi, asi que sus logros quedan. */
export function trackingAchievementsWhere(
  userId: string
): Prisma.UserAchievementWhereInput {
  return {
    userId,
    OR: [
      {
        key: {
          in: ACHIEVEMENTS.filter((a) => TRACKING_METRICS.has(a.metric)).map(
            (a) => a.key
          ),
        },
      },
      { key: { startsWith: 'patch:' } },
    ],
  };
}

/** Para route handlers: otorga despues de responder, asi la accion no
 *  espera el recalculo. Un fallo se registra y no rompe la accion. Fuera de
 *  un request (scripts, pruebas que llaman al handler directo) `after` no
 *  existe: ahi otorga en el momento, sin esperar. */
export function awardAchievementsAfterResponse(
  userId: string,
  metrics: readonly AchievementMetric[]
): void {
  const award = () =>
    awardAchievements(userId, metrics).then(
      () => undefined,
      (error: unknown) => console.error('Error al otorgar logros:', error)
    );
  try {
    after(award);
  } catch {
    void award();
  }
}
