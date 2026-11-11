import { prisma } from '@/lib/database';
import {
  resolveFacts,
  type ResolvedFacts,
  type SeriesFactKey,
} from '@/lib/series-facts';

export interface SeriesFactsView {
  facts: ResolvedFacts;
  /** Votos de quien pide (vacio sin sesion). */
  mine: Partial<Record<SeriesFactKey, string>>;
}

export async function getSeriesFacts(
  seriesId: number,
  userId: string | null
): Promise<SeriesFactsView> {
  const [groups, overrides, own] = await Promise.all([
    prisma.seriesFactVote.groupBy({
      by: ['fact', 'value'],
      where: { seriesId },
      _count: { _all: true },
    }),
    prisma.seriesFactOverride.findMany({
      where: { seriesId },
      select: { fact: true, value: true },
    }),
    userId
      ? prisma.seriesFactVote.findMany({
          where: { seriesId, userId },
          select: { fact: true, value: true },
        })
      : Promise.resolve([]),
  ]);
  const facts = resolveFacts(
    groups.map((g) => ({ fact: g.fact, value: g.value, count: g._count._all })),
    overrides
  );
  const mine: SeriesFactsView['mine'] = {};
  for (const row of own) {
    if (row.fact in facts) mine[row.fact as SeriesFactKey] = row.value;
  }
  return { facts, mine };
}

/** Voto de una cuenta; value null lo borra. */
export async function setSeriesFactVote(
  seriesId: number,
  userId: string,
  fact: SeriesFactKey,
  value: string | null
): Promise<void> {
  if (value === null) {
    await prisma.seriesFactVote.deleteMany({
      where: { seriesId, userId, fact },
    });
    return;
  }
  await prisma.seriesFactVote.upsert({
    where: { seriesId_userId_fact: { seriesId, userId, fact } },
    create: { seriesId, userId, fact, value },
    update: { value },
  });
}

/** Valor oficial del equipo; value null vuelve al consenso de la comunidad. */
export async function setSeriesFactOverride(
  seriesId: number,
  setById: string,
  fact: SeriesFactKey,
  value: string | null
): Promise<void> {
  if (value === null) {
    await prisma.seriesFactOverride.deleteMany({ where: { seriesId, fact } });
    return;
  }
  await prisma.seriesFactOverride.upsert({
    where: { seriesId_fact: { seriesId, fact } },
    create: { seriesId, fact, value, setById },
    update: { value, setById },
  });
}
