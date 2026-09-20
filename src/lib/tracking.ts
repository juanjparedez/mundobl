/**
 * Reglas de tracking compartidas entre el endpoint de episodios y el
 * endpoint de progreso masivo (T05), para no duplicar la lógica de
 * "marcar episodio promueve la serie a VIENDO".
 */

import type { Prisma, PrismaClient, ViewStatus } from '../generated/prisma';

export type TrackingClient = PrismaClient | Prisma.TransactionClient;

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

  const episode = await client.viewStatus.upsert({
    where: { userId_episodeId: { userId, episodeId } },
    update: { status, watchedDate: status === 'VISTA' ? new Date() : null },
    create: {
      userId,
      episodeId,
      status,
      watchedDate: status === 'VISTA' ? new Date() : null,
    },
  });

  if (status === 'SIN_VER') {
    return { episode, series: null, allWatched: false };
  }

  const { seriesId } = episodeDetail.season;
  const now = new Date();

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
