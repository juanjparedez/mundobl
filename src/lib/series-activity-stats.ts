import { prisma } from '@/lib/database';
import {
  PUBLIC_ACTIVITY_MINIMUM,
  PUBLIC_ACTIVITY_WINDOW_DAYS,
  utcDay,
} from '@/lib/series-activity';

const DAY_MS = 24 * 60 * 60 * 1000;

function daysAgo(days: number, now: Date): Date {
  return utcDay(new Date(now.getTime() - days * DAY_MS));
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
