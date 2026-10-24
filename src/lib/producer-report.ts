import { prisma } from '@/lib/database';
import { utcDay } from '@/lib/series-activity';
import type {
  ActivityTotals,
  ProducerReport,
  ProducerReportWindow,
} from '@/lib/producer-report-shape';

/**
 * Informe para productoras y plataformas: cuanta gente ve que, con numeros
 * agregados y anonimos (SeriesActivityDaily, UserActiveDay,
 * WatchLinkClickDaily). Nada de aca identifica a nadie; el equipo
 * (ADMIN/MODERATOR) no suma en los contadores de actividad.
 */
const DAY_MS = 24 * 60 * 60 * 1000;
const TOP_SERIES = 30;

interface SeriesRow {
  seriesId: number;
  title: string;
  channel: string | null;
  views: bigint;
  chapters: bigint;
  wants: bigint;
  finishes: bigint;
  trackers: bigint;
}

interface ChannelRow {
  channel: string;
  series: bigint;
  views: bigint;
  chapters: bigint;
  wants: bigint;
  finishes: bigint;
}

const toTotals = (row: {
  views: bigint;
  chapters: bigint;
  wants: bigint;
  finishes: bigint;
}): ActivityTotals => ({
  views: Number(row.views),
  chapters: Number(row.chapters),
  wants: Number(row.wants),
  finishes: Number(row.finishes),
});

export async function getProducerReport(
  days: ProducerReportWindow,
  now: Date = new Date()
): Promise<ProducerReport> {
  const to = utcDay(now);
  const from = new Date(to.getTime() - (days - 1) * DAY_MS);

  const [
    accounts,
    activeRows,
    sourceRows,
    kindRows,
    seriesRows,
    channelRows,
    countryRows,
    outboundRows,
  ] = await Promise.all([
    prisma.user.count({
      where: { banned: false, role: { notIn: ['ADMIN', 'MODERATOR'] } },
    }),
    prisma.userActiveDay.groupBy({
      by: ['userId'],
      where: {
        day: { gte: from },
        user: { banned: false, role: { notIn: ['ADMIN', 'MODERATOR'] } },
      },
    }),
    prisma.seriesActivityDaily.groupBy({
      by: ['source'],
      where: { kind: 'chapter', day: { gte: from } },
      _sum: { count: true },
    }),
    prisma.seriesActivityDaily.groupBy({
      by: ['kind'],
      where: { day: { gte: from } },
      _sum: { count: true },
    }),
    // El canal de una serie es el que mas episodios embebidos le aporta.
    prisma.$queryRaw<SeriesRow[]>`
      WITH activity AS (
        SELECT a."seriesId",
               SUM(a.count) FILTER (WHERE a.kind = 'view') AS views,
               SUM(a.count) FILTER (WHERE a.kind = 'chapter') AS chapters,
               SUM(a.count) FILTER (WHERE a.kind = 'want') AS wants,
               SUM(a.count) FILTER (WHERE a.kind = 'finish') AS finishes
        FROM "SeriesActivityDaily" a
        WHERE a.day >= ${from}
        GROUP BY a."seriesId"
      ),
      channel AS (
        SELECT DISTINCT ON (se."seriesId") se."seriesId", e."embedChannelName" AS channel
        FROM "Episode" e
        JOIN "Season" se ON se.id = e."seasonId"
        WHERE e."embedChannelName" IS NOT NULL
        GROUP BY se."seriesId", e."embedChannelName"
        ORDER BY se."seriesId", COUNT(*) DESC, e."embedChannelName"
      ),
      trackers AS (
        SELECT vs."seriesId", COUNT(DISTINCT vs."userId") AS trackers
        FROM "ViewStatus" vs
        JOIN "User" u ON u.id = vs."userId"
        WHERE vs."seriesId" IS NOT NULL
          AND vs.status <> 'SIN_VER'
          AND u.role NOT IN ('ADMIN', 'MODERATOR')
          AND u.banned = false
        GROUP BY vs."seriesId"
      )
      SELECT s.id AS "seriesId", s.title, c.channel,
             COALESCE(a.views, 0) AS views,
             COALESCE(a.chapters, 0) AS chapters,
             COALESCE(a.wants, 0) AS wants,
             COALESCE(a.finishes, 0) AS finishes,
             COALESCE(t.trackers, 0) AS trackers
      FROM activity a
      JOIN "Series" s ON s.id = a."seriesId"
      LEFT JOIN channel c ON c."seriesId" = s.id
      LEFT JOIN trackers t ON t."seriesId" = s.id
      ORDER BY COALESCE(a.chapters, 0) + COALESCE(a.views, 0) DESC, s.id
      LIMIT ${TOP_SERIES}
    `,
    prisma.$queryRaw<ChannelRow[]>`
      WITH channel AS (
        SELECT DISTINCT ON (se."seriesId") se."seriesId", e."embedChannelName" AS channel
        FROM "Episode" e
        JOIN "Season" se ON se.id = e."seasonId"
        WHERE e."embedChannelName" IS NOT NULL
        GROUP BY se."seriesId", e."embedChannelName"
        ORDER BY se."seriesId", COUNT(*) DESC, e."embedChannelName"
      )
      SELECT c.channel,
             COUNT(DISTINCT a."seriesId") AS series,
             COALESCE(SUM(a.count) FILTER (WHERE a.kind = 'view'), 0) AS views,
             COALESCE(SUM(a.count) FILTER (WHERE a.kind = 'chapter'), 0) AS chapters,
             COALESCE(SUM(a.count) FILTER (WHERE a.kind = 'want'), 0) AS wants,
             COALESCE(SUM(a.count) FILTER (WHERE a.kind = 'finish'), 0) AS finishes
      FROM "SeriesActivityDaily" a
      JOIN channel c ON c."seriesId" = a."seriesId"
      WHERE a.day >= ${from}
      GROUP BY c.channel
      ORDER BY chapters DESC, views DESC, c.channel
      LIMIT 30
    `,
    prisma.seriesActivityDaily.groupBy({
      by: ['country'],
      where: { kind: 'chapter', day: { gte: from } },
      _sum: { count: true },
      orderBy: { _sum: { count: 'desc' } },
      take: 20,
    }),
    prisma.$queryRaw<Array<{ platform: string; clicks: bigint }>>`
      SELECT w.platform, SUM(c.clicks) AS clicks
      FROM "WatchLinkClickDaily" c
      JOIN "WatchLink" w ON w.id = c."watchLinkId"
      WHERE c.day >= ${from}
      GROUP BY w.platform
      ORDER BY clicks DESC
      LIMIT 20
    `,
  ]);

  const sum = (rows: Array<{ _sum: { count: number | null } }>) =>
    rows.reduce((total, row) => total + (row._sum.count ?? 0), 0);
  const kind = (name: string) =>
    sum(kindRows.filter((row) => row.kind === name));
  const source = (name: string) =>
    sum(sourceRows.filter((row) => row.source === name));

  return {
    days,
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
    accounts,
    activeAccounts: activeRows.length,
    chaptersBySource: {
      account: source('account'),
      browser: source('browser'),
    },
    totals: {
      views: kind('view'),
      chapters: kind('chapter'),
      wants: kind('want'),
      finishes: kind('finish'),
    },
    series: seriesRows.map((row) => ({
      seriesId: row.seriesId,
      title: row.title,
      channel: row.channel,
      trackers: Number(row.trackers),
      ...toTotals(row),
    })),
    channels: channelRows.map((row) => ({
      channel: row.channel,
      series: Number(row.series),
      ...toTotals(row),
    })),
    countries: countryRows.map((row) => ({
      country: row.country,
      chapters: row._sum.count ?? 0,
    })),
    outbound: outboundRows.map((row) => ({
      platform: row.platform,
      clicks: Number(row.clicks),
    })),
  };
}
