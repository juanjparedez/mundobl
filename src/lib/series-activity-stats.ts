import { prisma } from '@/lib/database';
import {
  PUBLIC_ACTIVITY_MINIMUM,
  PUBLIC_ACTIVITY_WINDOW_DAYS,
  utcDay,
} from '@/lib/series-activity';
import { getVerUrl } from '@/lib/slug';

const DAY_MS = 24 * 60 * 60 * 1000;

function daysAgo(days: number, now: Date): Date {
  return utcDay(new Date(now.getTime() - days * DAY_MS));
}

export interface WatchSectionStats {
  /** Ventana de días analizada (por ej. 30 días). */
  windowDays: number;
  /** Métricas acumuladas en la ventana. */
  totals: {
    /** Aperturas del hub o reproductor /ver */
    playerVisits: number;
    /** Reproducciones iniciadas */
    playStarts: number;
    /** Reproducciones completadas o que alcanzaron el 80% */
    completedPlays: number;
    /** Tasa de retención/finalización (completedPlays / playStarts * 100), redondeada */
    completionRate: number;
    /** Me gusta comunitarios agregados */
    communityLikes: number;
    /** Clics salientes a productoras y canales oficiales */
    outboundClicks: number;
  };
  /** Serie temporal diaria para graficar el pulso */
  playsByDay: Array<{
    day: string;
    starts: number;
    completions: number;
  }>;
  /** Series más reproducidas en la ventana */
  topSeries: Array<{
    seriesId: number;
    title: string;
    href: string;
    starts: number;
    completions: number;
  }>;
}

/**
 * Capitulos vistos de una serie en la ultima semana (cuentas y navegadores),
 * o null si no llega al minimo: un contador publico en 1 se lee como vacio.
 */
export async function getPublicSeriesActivity(
  seriesId: number,
  now: Date = new Date()
): Promise<number | null> {
  const result = await prisma.seriesActivityDaily.aggregate({
    where: {
      seriesId,
      kind: 'chapter',
      day: { gte: daysAgo(PUBLIC_ACTIVITY_WINDOW_DAYS - 1, now) },
    },
    _sum: { count: true },
  });
  const chapters = result._sum.count ?? 0;
  return chapters >= PUBLIC_ACTIVITY_MINIMUM ? chapters : null;
}

/** Capitulos vistos en todo el sitio en los ultimos `days` dias. */
export async function getSiteChapterActivity(
  days: number,
  now: Date = new Date()
): Promise<{ total: number; browser: number }> {
  const rows = await prisma.seriesActivityDaily.groupBy({
    by: ['source'],
    where: { kind: 'chapter', day: { gte: daysAgo(days - 1, now) } },
    _sum: { count: true },
  });
  const bySource = new Map(
    rows.map((row) => [row.source, row._sum.count ?? 0])
  );
  const browser = bySource.get('browser') ?? 0;
  return { total: browser + (bySource.get('account') ?? 0), browser };
}

/**
 * Métricas públicas agregadas del reproductor y hub de streaming legal (/ver).
 * Totalmente anónimo: cero IPs, cero identificadores de usuario, agrupadas por día UTC.
 */
export async function getPublicWatchStats(
  windowDays: number = 30,
  now: Date = new Date()
): Promise<WatchSectionStats> {
  const from = daysAgo(windowDays - 1, now);

  const [kindRows, dailyRows, topSeriesRows, siteTrafficRows] =
    await Promise.all([
      prisma.seriesActivityDaily.groupBy({
        by: ['kind'],
        where: { day: { gte: from } },
        _sum: { count: true },
      }),
      prisma.seriesActivityDaily.groupBy({
        by: ['day', 'kind'],
        where: {
          day: { gte: from },
          kind: { in: ['play_start', 'chapter'] },
        },
        _sum: { count: true },
        orderBy: { day: 'asc' },
      }),
      prisma.seriesActivityDaily.groupBy({
        by: ['seriesId'],
        where: {
          day: { gte: from },
          kind: { in: ['play_start', 'chapter'] },
        },
        _sum: { count: true },
        orderBy: { _sum: { count: 'desc' } },
        take: 10,
      }),
      prisma.siteTrafficDaily.groupBy({
        by: ['section'],
        where: {
          day: { gte: from },
          section: { in: ['ver', 'ver_player'] },
        },
        _sum: { count: true },
      }),
    ]);

  const kindSum = (kindName: string) => {
    const row = kindRows.find((r) => r.kind === kindName);
    return row?._sum.count ?? 0;
  };

  const playStarts = kindSum('play_start');
  const completedPlays = kindSum('chapter');
  const communityLikes = kindSum('like');
  const outboundClicks = kindSum('outbound_click');
  const openVerFromActivity = kindSum('open_ver');
  const trafficVer = siteTrafficRows.reduce(
    (acc, r) => acc + (r._sum.count ?? 0),
    0
  );
  const playerVisits = Math.max(openVerFromActivity, trafficVer);

  const completionRate =
    playStarts > 0
      ? Math.min(100, Math.round((completedPlays / playStarts) * 100))
      : 0;

  const startsByDay = new Map<string, number>();
  const completionsByDay = new Map<string, number>();

  for (const r of dailyRows) {
    const d = r.day.toISOString().slice(0, 10);
    const count = r._sum.count ?? 0;
    if (r.kind === 'play_start') {
      startsByDay.set(d, (startsByDay.get(d) ?? 0) + count);
    } else if (r.kind === 'chapter') {
      completionsByDay.set(d, (completionsByDay.get(d) ?? 0) + count);
    }
  }

  const playsByDay = Array.from({ length: windowDays }, (_, i) => {
    const day = new Date(now.getTime() - (windowDays - 1 - i) * DAY_MS)
      .toISOString()
      .slice(0, 10);
    return {
      day,
      starts: startsByDay.get(day) ?? 0,
      completions: completionsByDay.get(day) ?? 0,
    };
  });

  const seriesIds = topSeriesRows.map((r) => r.seriesId);
  const seriesList =
    seriesIds.length > 0
      ? await prisma.series.findMany({
          where: { id: { in: seriesIds }, visibility: { not: 'ARCHIVED' } },
          select: { id: true, title: true },
        })
      : [];
  const seriesMap = new Map(seriesList.map((s) => [s.id, s]));

  const topBreakdowns =
    seriesIds.length > 0
      ? await prisma.seriesActivityDaily.groupBy({
          by: ['seriesId', 'kind'],
          where: {
            day: { gte: from },
            seriesId: { in: seriesIds },
            kind: { in: ['play_start', 'chapter'] },
          },
          _sum: { count: true },
        })
      : [];

  const breakdownMap = new Map<string, number>();
  for (const b of topBreakdowns) {
    breakdownMap.set(`${b.seriesId}:${b.kind}`, b._sum.count ?? 0);
  }

  const topSeries = seriesIds
    .map((id) => {
      const meta = seriesMap.get(id);
      const starts = breakdownMap.get(`${id}:play_start`) ?? 0;
      const completions = breakdownMap.get(`${id}:chapter`) ?? 0;
      return {
        seriesId: id,
        title: meta?.title ?? `Serie #${id}`,
        href: meta ? getVerUrl(meta.id, meta.title) : `/ver/${id}`,
        starts,
        completions,
      };
    })
    .filter((s) => s.starts > 0 || s.completions > 0)
    .slice(0, 8);

  return {
    windowDays,
    totals: {
      playerVisits,
      playStarts,
      completedPlays,
      completionRate,
      communityLikes,
      outboundClicks,
    },
    playsByDay,
    topSeries,
  };
}
