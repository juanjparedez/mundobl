import { Prisma } from '@/generated/prisma';

export class TrackingPreservationError extends Error {
  constructor() {
    super('TRACKING_PRESERVATION_REQUIRED');
  }
}

/** Lock parent rows before checking: new FK-backed private records cannot race a cascade. */
export async function assertTrackingCanBeRemoved(
  tx: Prisma.TransactionClient,
  seriesId: number,
  seasonIds?: number[]
) {
  if (!seasonIds)
    await tx.$queryRaw`SELECT id FROM "Series" WHERE id = ${seriesId} FOR UPDATE`;
  const seasons = await tx.$queryRaw<Array<{ id: number }>>`
    SELECT id FROM "Season" WHERE "seriesId" = ${seriesId}
    ${seasonIds ? Prisma.sql`AND id IN (${Prisma.join(seasonIds)})` : Prisma.empty} FOR UPDATE`;
  const ids = seasons.map((s) => s.id);
  const episodes = ids.length
    ? await tx.$queryRaw<Array<{ id: number }>>`
    SELECT id FROM "Episode" WHERE "seasonId" IN (${Prisma.join(ids)}) FOR UPDATE`
    : [];
  const episodeIds = episodes.map((e) => e.id);
  const targets = [
    ...(!seasonIds ? [{ seriesId }] : []),
    { seasonId: { in: ids } },
    { episodeId: { in: episodeIds } },
  ];
  const [statuses, history, notes, episodeNotes] = await Promise.all([
    tx.viewStatus.count({ where: { OR: targets } }),
    tx.trackingEvent.count({ where: { OR: targets } }),
    seasonIds
      ? Promise.resolve(0)
      : tx.seriesNote.count({ where: { seriesId } }),
    tx.episodeNote.count({ where: { episodeId: { in: episodeIds } } }),
  ]);
  if (statuses || history || notes || episodeNotes)
    throw new TrackingPreservationError();
}
