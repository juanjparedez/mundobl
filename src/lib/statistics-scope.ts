import { Prisma } from '../generated/prisma';
import { HAS_WATCHABLE_EPISODE } from './watchable';
import { MIN_EPISODE_SECONDS } from './playability';

export const COMMUNITY_MEMBER = {
  banned: false,
  role: { notIn: ['ADMIN', 'MODERATOR', 'COLLABORATOR'] },
} satisfies Prisma.UserWhereInput;
export const COMMUNITY = { user: COMMUNITY_MEMBER };
export const PUBLIC_STATS_SERIES = {
  visibility: 'VISIBLE',
  OR: [{ origin: 'CURATED', catalogScope: 'PERSONAL' }, HAS_WATCHABLE_EPISODE],
} satisfies Prisma.SeriesWhereInput;
export const PUBLIC_CATALOG_SERIES = {
  visibility: 'VISIBLE',
  origin: 'CURATED',
  catalogScope: 'PERSONAL',
} satisfies Prisma.SeriesWhereInput;
export const FAVORITE_MEMBER = COMMUNITY_MEMBER;

// SQL aliases are fixed by the queries that use these fragments.
export const COMMUNITY_SQL = Prisma.sql`u.banned = false AND u.role NOT IN ('ADMIN', 'MODERATOR', 'COLLABORATOR')`;
export const PUBLIC_SERIES_SQL = Prisma.sql`s.visibility = 'VISIBLE' AND (
  (s.origin = 'CURATED' AND s."catalogScope" = 'PERSONAL') OR EXISTS (
    SELECT 1 FROM "Season" season JOIN "Episode" e ON e."seasonId" = season.id
    WHERE season."seriesId" = s.id AND e."embedUrl" IS NOT NULL
      AND (e."durationSeconds" IS NULL OR e."durationSeconds" >= ${MIN_EPISODE_SECONDS})
  )
)`;
export function statsWindowStart(days: number, now: Date): Date {
  const start = new Date(now);
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() - days + 1);
  return start;
}

/** A member has one vote per work: explicit general score, otherwise category average. */
export const COMMUNITY_RATINGS_SQL = Prisma.sql`
  SELECT ur."seriesId", ur."userId",
    COALESCE(MAX(ur.score) FILTER (WHERE ur.category = 'general'), AVG(ur.score))::float8 AS score,
    MAX(ur."updatedAt") AS "updatedAt"
  FROM "UserRating" ur
  JOIN "User" u ON u.id = ur."userId"
  JOIN "Series" s ON s.id = ur."seriesId"
  WHERE ${PUBLIC_SERIES_SQL} AND ${COMMUNITY_SQL}
  GROUP BY ur."seriesId", ur."userId"
`;

export const COMMUNITY_COMMENTS = {
  OR: [{ userId: null }, COMMUNITY],
  AND: [
    {
      OR: [
        { series: PUBLIC_STATS_SERIES },
        { season: { series: PUBLIC_STATS_SERIES } },
        { episode: { season: { series: PUBLIC_STATS_SERIES } } },
      ],
    },
  ],
};

/** Player metrics share this population in public and administrative reports. */
export const PUBLIC_WATCH_SERIES = {
  visibility: 'VISIBLE',
  ...HAS_WATCHABLE_EPISODE,
} satisfies Prisma.SeriesWhereInput;
export const WATCH_ACTIVITY_KINDS = [
  'open_ver',
  'play_start',
  'view',
  'like',
  'outbound_click',
];
export const WATCHABLE_SERIES_SQL = Prisma.sql`EXISTS (
  SELECT 1 FROM "Season" season JOIN "Episode" e ON e."seasonId" = season.id
  WHERE season."seriesId" = s.id AND e."embedUrl" IS NOT NULL
    AND (e."durationSeconds" IS NULL OR e."durationSeconds" >= ${MIN_EPISODE_SECONDS})
)`;
