import type { AppTransactionClient } from './prisma-client';
import { Prisma } from '@prisma/client';

export class TrackingPreservationError extends Error {
  constructor() {
    super('TRACKING_PRESERVATION_REQUIRED');
  }
}

/*
 * Borrar contenido sin llevarse el seguimiento privado de nadie.
 *
 * En Postgres esto era "bloquear filas (FOR UPDATE), contar, borrar" dentro
 * de una transaccion. D1 no tiene transacciones ni bloqueos, asi que el
 * chequeo va DENTRO del mismo DELETE: una sentencia de SQLite es atomica, y
 * el ON DELETE CASCADE corre en esa misma sentencia. Si entre que se pidio y
 * que se ejecuto alguien marco un capitulo, el DELETE no borra nada y se
 * avisa con TrackingPreservationError, igual que antes.
 */

/** Episodios de las temporadas elegidas (o de toda la serie). */
function episodesOf(seriesId: number, seasonIds?: number[]) {
  return seasonIds
    ? Prisma.sql`SELECT id FROM "Episode" WHERE "seasonId" IN (${Prisma.join(seasonIds)})`
    : Prisma.sql`SELECT e.id FROM "Episode" e JOIN "Season" se ON se.id = e."seasonId" WHERE se."seriesId" = ${seriesId}`;
}

function seasonsOf(seriesId: number, seasonIds?: number[]) {
  return seasonIds
    ? Prisma.sql`SELECT id FROM "Season" WHERE "seriesId" = ${seriesId} AND id IN (${Prisma.join(seasonIds)})`
    : Prisma.sql`SELECT id FROM "Season" WHERE "seriesId" = ${seriesId}`;
}

/** Verdadero si nadie tiene seguimiento, historial ni notas en ese contenido. */
function untrackedSql(seriesId: number, seasonIds?: number[]) {
  const seasons = seasonsOf(seriesId, seasonIds);
  const episodes = episodesOf(seriesId, seasonIds);
  const target = (table: string) =>
    Prisma.sql`NOT EXISTS (SELECT 1 FROM ${Prisma.raw(`"${table}"`)} t WHERE ${
      seasonIds ? Prisma.sql`FALSE` : Prisma.sql`t."seriesId" = ${seriesId}`
    } OR t."seasonId" IN (${seasons}) OR t."episodeId" IN (${episodes}))`;
  return Prisma.sql`${target('ViewStatus')} AND ${target('TrackingEvent')}
    ${
      seasonIds
        ? Prisma.empty
        : Prisma.sql`AND NOT EXISTS (SELECT 1 FROM "SeriesNote" WHERE "seriesId" = ${seriesId})`
    }
    AND NOT EXISTS (SELECT 1 FROM "EpisodeNote" WHERE "episodeId" IN (${episodes}))`;
}

function untrackedEpisodeSql(episodeId: number) {
  return Prisma.sql`NOT EXISTS (SELECT 1 FROM "ViewStatus" WHERE "episodeId" = ${episodeId})
    AND NOT EXISTS (SELECT 1 FROM "TrackingEvent" WHERE "episodeId" = ${episodeId})
    AND NOT EXISTS (SELECT 1 FROM "EpisodeNote" WHERE "episodeId" = ${episodeId})`;
}

/** Chequeo previo (sin bloquear): para cortar antes de hacer otros cambios. */
export async function assertTrackingCanBeRemoved(
  db: AppTransactionClient,
  seriesId: number,
  seasonIds?: number[]
) {
  if (seasonIds?.length === 0) return;
  const [row] = await db.$queryRaw<Array<{ untracked: number }>>(
    Prisma.sql`SELECT (${untrackedSql(seriesId, seasonIds)}) AS untracked`
  );
  if (!row?.untracked) throw new TrackingPreservationError();
}

/** Borra la serie (y en cascada todo lo suyo) solo si nadie la sigue. */
export async function deleteSeriesIfUntracked(
  db: AppTransactionClient,
  seriesId: number
): Promise<void> {
  const deleted = await db.$executeRaw(Prisma.sql`
    DELETE FROM "Series" WHERE id = ${seriesId} AND ${untrackedSql(seriesId)}`);
  if (deleted) return;
  const exists = await db.series.count({ where: { id: seriesId } });
  if (exists) throw new TrackingPreservationError();
}

/** Borra esas temporadas, todas o ninguna, solo si nadie sigue ninguna. */
export async function deleteSeasonsIfUntracked(
  db: AppTransactionClient,
  seriesId: number,
  seasonIds: number[]
): Promise<void> {
  if (!seasonIds.length) return;
  const deleted = await db.$executeRaw(Prisma.sql`
    DELETE FROM "Season"
    WHERE "seriesId" = ${seriesId} AND id IN (${Prisma.join(seasonIds)})
      AND ${untrackedSql(seriesId, seasonIds)}`);
  if (deleted) return;
  const remaining = await db.season.count({
    where: { seriesId, id: { in: seasonIds } },
  });
  if (remaining) throw new TrackingPreservationError();
}

/** Borra el episodio solo si nadie lo marco ni le dejo notas. */
export async function deleteEpisodeIfUntracked(
  db: AppTransactionClient,
  episodeId: number
): Promise<void> {
  const deleted = await db.$executeRaw(Prisma.sql`
    DELETE FROM "Episode" WHERE id = ${episodeId} AND ${untrackedEpisodeSql(episodeId)}`);
  if (deleted) return;
  const exists = await db.episode.count({ where: { id: episodeId } });
  if (exists) throw new TrackingPreservationError();
}
