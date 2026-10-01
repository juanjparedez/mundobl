/**
 * Reglas de tracking compartidas entre el endpoint de episodios y el
 * endpoint de progreso masivo (T05), para no duplicar la lógica de
 * "marcar episodio promueve la serie a VIENDO".
 */

import type {
  Prisma,
  PrismaClient,
  ViewStatus,
  WatchStatus,
} from '../generated/prisma';
import { getSeriesEpisodesOrdered, type SeriesEpisodeOrder } from './database';

export type TrackingClient = PrismaClient | Prisma.TransactionClient;

const CURATOR_ROLES: ReadonlySet<string> = new Set(['ADMIN', 'MODERATOR']);

/**
 * Seguir una serie te suscribe a sus avisos (capitulo disponible, nueva
 * temporada). Solo cuando se crea la fila de la serie por PRIMERA vez: si
 * despues el usuario apaga la campanita, marcar mas episodios no lo vuelve
 * a suscribir. La campanita queda a la vista en la ficha y en /ver.
 *
 * Antes eran cosas separadas: quien marcaba episodios no recibia ni los
 * avisos que si existian, salvo que encontrara la campanita por su cuenta.
 */
export async function subscribeOnFirstTrack(
  client: TrackingClient,
  userId: string,
  seriesId: number
): Promise<void> {
  // Curaduria no: Flor marca "viendo" casi todo lo que carga y cada serie le
  // quedaba con la campanita prendida (reporte del 27/09). Si quiere avisos de
  // una serie, la campanita sigue a mano.
  const user = await client.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (user && CURATOR_ROLES.has(user.role)) return;
  await client.seriesSubscription.createMany({
    data: [{ userId, seriesId }],
    skipDuplicates: true,
  });
}

/** upToEpisodeId de otra serie, o serie/episodio inexistente. */
export class ProgressNotFoundError extends Error {}

export interface MarkEpisodeResult {
  episode: ViewStatus;
  series: ViewStatus | null;
  allWatched: boolean;
}

export async function markEpisode(
  client: TrackingClient,
  userId: string,
  episodeId: number,
  status: 'VISTA' | 'SIN_VER'
): Promise<MarkEpisodeResult> {
  const episodeDetail = await client.episode.findUnique({
    where: { id: episodeId },
    select: { season: { select: { seriesId: true } } },
  });

  if (!episodeDetail) {
    throw new Error('Episodio no encontrado');
  }

  if (status === 'SIN_VER') {
    const episode = await client.viewStatus.upsert({
      where: { userId_episodeId: { userId, episodeId } },
      update: { status, watchedDate: null },
      create: { userId, episodeId, status, watchedDate: null },
    });
    return { episode, series: null, allWatched: false };
  }

  const { seriesId } = episodeDetail.season;
  const now = new Date();
  const changed = await markManyWatched(client, userId, [episodeId], now);
  const episode = await client.viewStatus.findUniqueOrThrow({
    where: { userId_episodeId: { userId, episodeId } },
  });
  const series =
    changed > 0
      ? await updateSeriesAfterWatch(client, userId, seriesId, now)
      : await client.viewStatus.findUnique({
          where: { userId_seriesId: { userId, seriesId } },
        });

  const [totalEpisodes, watchedEpisodes] = await Promise.all([
    client.episode.count({ where: { season: { seriesId } } }),
    client.viewStatus.count({
      where: { userId, status: 'VISTA', episode: { season: { seriesId } } },
    }),
  ]);
  return {
    episode,
    series,
    allWatched: totalEpisodes > 0 && totalEpisodes === watchedEpisodes,
  };
}

/** Only actual newly-watched episodes advance last activity or resume a paused series. */
async function updateSeriesAfterWatch(
  client: TrackingClient,
  userId: string,
  seriesId: number,
  now: Date
): Promise<ViewStatus> {
  const existingSeries = await client.viewStatus.findUnique({
    where: { userId_seriesId: { userId, seriesId } },
  });

  let series: ViewStatus;
  if (!existingSeries || existingSeries.status === 'SIN_VER') {
    series = await client.viewStatus.upsert({
      where: { userId_seriesId: { userId, seriesId } },
      update: { status: 'VIENDO', lastWatchedAt: now },
      create: { userId, seriesId, status: 'VIENDO', lastWatchedAt: now },
    });
    if (!existingSeries) await subscribeOnFirstTrack(client, userId, seriesId);
  } else if (
    existingSeries.status === 'VIENDO' ||
    existingSeries.status === 'RETOMAR'
  ) {
    series = await client.viewStatus.update({
      where: { userId_seriesId: { userId, seriesId } },
      data: { status: 'VIENDO', lastWatchedAt: now },
    });
  } else {
    // VISTA o ABANDONADA: el usuario lo decidió a mano, no se pisa el status.
    series = await client.viewStatus.update({
      where: { userId_seriesId: { userId, seriesId } },
      data: { lastWatchedAt: now },
    });
  }

  return series;
}

export interface ProgressTarget {
  upToEpisodeId?: number;
  seasonNumber?: number;
  episodeNumber?: number;
}

export interface ProgressOptions {
  /** Pone en SIN_VER los episodios posteriores al objetivo; no toca la fila de serie. */
  direction?: 'unmark';
  /** Con 'unmark': tambien desmarca el objetivo (para volver a "ninguno visto"). */
  inclusive?: boolean;
  /** Si tras marcar quedan todos los episodios vistos, pasa la serie a VISTA. */
  completeIfAll?: boolean;
}

export interface ProgressResult {
  seriesStatus: string;
  episodeStatus: Record<number, 'VISTA' | 'SIN_VER'>;
  watched: number;
  total: number;
  allWatched: boolean;
}

/**
 * "Voy por el episodio N": marca ese episodio y todos los anteriores como
 * VISTA (o, con direction: 'unmark', pone en SIN_VER los posteriores) y
 * devuelve el estado completo de la serie. Usado por T06, T07, T11b y T13.
 */
export async function setProgress(
  client: TrackingClient,
  userId: string,
  seriesId: number,
  target: ProgressTarget,
  options: ProgressOptions = {}
): Promise<ProgressResult> {
  const episodes = await getSeriesEpisodesOrdered(client, seriesId);
  if (episodes.length === 0) {
    throw new ProgressNotFoundError('La serie no tiene episodios');
  }

  const targetEpisode =
    target.upToEpisodeId !== undefined
      ? episodes.find((ep) => ep.id === target.upToEpisodeId)
      : episodes.find(
          (ep) =>
            ep.seasonNumber === target.seasonNumber &&
            ep.episodeNumber === target.episodeNumber
        );

  if (!targetEpisode) {
    throw new ProgressNotFoundError('Episodio no encontrado en esta serie');
  }

  const targetIndex = episodes.findIndex((ep) => ep.id === targetEpisode.id);
  const now = new Date();

  if (options.direction === 'unmark') {
    const afterIds = episodes
      .slice(options.inclusive ? targetIndex : targetIndex + 1)
      .map((ep) => ep.id);
    if (afterIds.length > 0) {
      await client.viewStatus.updateMany({
        where: { userId, episodeId: { in: afterIds } },
        data: { status: 'SIN_VER', watchedDate: null },
      });
    }
    return buildProgressResult(client, userId, seriesId, episodes);
  }

  const upToIds = episodes.slice(0, targetIndex + 1).map((ep) => ep.id);

  const changed = await markManyWatched(client, userId, upToIds, now);
  if (changed > 0) await updateSeriesAfterWatch(client, userId, seriesId, now);
  const result = await buildProgressResult(client, userId, seriesId, episodes);

  if (
    options.completeIfAll &&
    result.allWatched &&
    result.seriesStatus !== 'VISTA'
  ) {
    await client.viewStatus.upsert({
      where: { userId_seriesId: { userId, seriesId } },
      update: { status: 'VISTA', watchedDate: now },
      create: { userId, seriesId, status: 'VISTA', watchedDate: now },
    });
    result.seriesStatus = 'VISTA';
  }

  return result;
}

/** Marca como vistos sin pisar la fecha de los que ya lo estaban. */
async function markManyWatched(
  client: TrackingClient,
  userId: string,
  episodeIds: number[],
  now: Date
): Promise<number> {
  const created = await client.viewStatus.createMany({
    data: episodeIds.map((episodeId) => ({
      userId,
      episodeId,
      status: 'VISTA',
      watchedDate: now,
    })),
    skipDuplicates: true,
  });
  const updated = await client.viewStatus.updateMany({
    where: { userId, episodeId: { in: episodeIds }, status: { not: 'VISTA' } },
    data: { status: 'VISTA', watchedDate: now },
  });
  return created.count + updated.count;
}

/**
 * Marca o desmarca episodios puntuales de una serie, como las partes de un
 * capitulo en /ver. La fila de la serie sigue la regla de markEpisode.
 */
export async function setEpisodesWatched(
  client: TrackingClient,
  userId: string,
  seriesId: number,
  episodeIds: number[],
  watched: boolean
): Promise<ProgressResult> {
  const episodes = await getSeriesEpisodesOrdered(client, seriesId);
  const requested = new Set(episodeIds);
  const ids = episodes.filter((ep) => requested.has(ep.id)).map((ep) => ep.id);
  if (ids.length === 0) {
    throw new ProgressNotFoundError('Episodios no encontrados en esta serie');
  }

  if (watched) {
    const now = new Date();
    const changed = await markManyWatched(client, userId, ids, now);
    if (changed > 0)
      await updateSeriesAfterWatch(client, userId, seriesId, now);
  } else {
    await client.viewStatus.updateMany({
      where: { userId, episodeId: { in: ids } },
      data: { status: 'SIN_VER', watchedDate: null },
    });
  }

  return buildProgressResult(client, userId, seriesId, episodes);
}

async function buildProgressResult(
  client: TrackingClient,
  userId: string,
  seriesId: number,
  episodes: SeriesEpisodeOrder[]
): Promise<ProgressResult> {
  const episodeIds = episodes.map((ep) => ep.id);
  const [seriesRow, watchedRows] = await Promise.all([
    client.viewStatus.findUnique({
      where: { userId_seriesId: { userId, seriesId } },
      select: { status: true },
    }),
    client.viewStatus.findMany({
      where: { userId, episodeId: { in: episodeIds }, status: 'VISTA' },
      select: { episodeId: true },
    }),
  ]);

  const watchedIds = new Set(watchedRows.map((row) => row.episodeId));
  const episodeStatus: Record<number, 'VISTA' | 'SIN_VER'> = {};
  for (const id of episodeIds) {
    episodeStatus[id] = watchedIds.has(id) ? 'VISTA' : 'SIN_VER';
  }

  const total = episodeIds.length;
  const watched = watchedIds.size;

  return {
    seriesStatus: seriesRow?.status ?? 'SIN_VER',
    episodeStatus,
    watched,
    total,
    allWatched: total > 0 && watched === total,
  };
}

/** Use inside a transaction. Identical commands preserve dates, including unknown ones. */
export async function setSeriesTrackingStatus(
  client: Prisma.TransactionClient,
  userId: string,
  seriesId: number,
  status: WatchStatus
): Promise<ViewStatus> {
  const now = new Date();
  const dates = {
    ...(status === 'VISTA' ? { watchedDate: now } : {}),
    ...(status === 'SIN_VER' ? { watchedDate: null } : {}),
    ...(status === 'VIENDO' ? { lastWatchedAt: now } : {}),
  };
  const inserted = await client.viewStatus.createMany({
    data: [{ userId, seriesId, status, ...dates }],
    skipDuplicates: true,
  });
  await client.viewStatus.updateMany({
    where: { userId, seriesId, status: { not: status } },
    data: { status, ...dates },
  });
  if (inserted.count > 0 && (status === 'VIENDO' || status === 'RETOMAR')) {
    await subscribeOnFirstTrack(client, userId, seriesId);
  }
  return client.viewStatus.findUniqueOrThrow({
    where: { userId_seriesId: { userId, seriesId } },
  });
}
