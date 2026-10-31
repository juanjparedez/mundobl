import { prisma } from '@/lib/database';
import { statsWindowStart } from '@/lib/statistics-scope';
import { utcDay } from '@/lib/series-activity';
import { PILOT_PLACEMENTS } from '@/lib/pilot-clicks';

export async function getPilotReport(now: Date = new Date()) {
  const from = statsWindowStart(60, now);
  const to = utcDay(now);
  const rows = await prisma.pilotClickDaily.findMany({
    where: {
      day: { gte: from, lte: to },
      placement: { in: [...PILOT_PLACEMENTS] },
    },
    orderBy: [{ day: 'desc' }, { placement: 'asc' }],
  });
  return {
    generatedAt: now.toISOString(),
    rows: rows.map((row) => ({
      ...row,
      day: row.day.toISOString().slice(0, 10),
    })),
  };
}
