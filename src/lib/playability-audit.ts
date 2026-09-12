import { API_BATCH_SIZE, probeViaApi, type PlaybackProbe } from './playability';
import { CORE_MARKETS } from './channel-fetcher';
import { prisma } from './database';
import { WATCHABLE_EPISODE_WHERE } from './watchable';
import { isPlayableIn } from './playability';

const DEFAULT_STALE_DAYS = 1;
const MAX_EPISODES_PER_RUN = 500;

export interface PlayabilityAuditResult {
  scanned: number;
  probed: number;
  changed: number;
  removed: number;
  geoBlocked: number;
  ageRestricted: number;
  notEmbeddable: number;
  seriesRecalculated: number;
}

/**
 * Audita los embeds de YouTube vencidos y actualiza su estado de reproduccion.
 *
 * El limite protege la ejecucion del cron y deja que las siguientes corridas
 * alcancen el resto del catalogo ordenando siempre por el sondeo mas antiguo.
 */
export async function runPlayabilityAudit(
  staleDays = DEFAULT_STALE_DAYS
): Promise<PlayabilityAuditResult> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) throw new Error('Falta YOUTUBE_API_KEY.');

  const staleBefore = new Date(Date.now() - staleDays * 24 * 60 * 60 * 1000);
  const episodes = await prisma.episode.findMany({
    where: {
      embedUrl: { not: null },
      embedVideoId: { not: null },
      embedPlatform: 'YouTube',
      OR: [
        { playbackCheckedAt: null },
        { playbackCheckedAt: { lt: staleBefore } },
      ],
    },
    select: {
      id: true,
      embedVideoId: true,
      playback: true,
      season: { select: { series: { select: { id: true } } } },
    },
    orderBy: [{ playbackCheckedAt: { sort: 'asc', nulls: 'first' } }],
    take: MAX_EPISODES_PER_RUN,
  });

  const result: PlayabilityAuditResult = {
    scanned: episodes.length,
    probed: 0,
    changed: 0,
    removed: 0,
    geoBlocked: 0,
    ageRestricted: 0,
    notEmbeddable: 0,
    seriesRecalculated: 0,
  };
  const touchedSeries = new Set<number>();

  for (let index = 0; index < episodes.length; index += API_BATCH_SIZE) {
    const batch = episodes.slice(index, index + API_BATCH_SIZE);
    const probes = await probeViaApi(
      batch.map((episode) => episode.embedVideoId!),
      apiKey
    );

    for (const [batchIndex, probe] of probes.entries()) {
      const episode = batch[batchIndex];
      if (!episode) continue;

      result.probed++;
      touchedSeries.add(episode.season.series.id);
      if (probe.status !== episode.playback) result.changed++;
      if (probe.status === 'REMOVED') result.removed++;
      if (probe.status === 'GEO_BLOCKED') result.geoBlocked++;
      if (probe.status === 'AGE_RESTRICTED') result.ageRestricted++;
      if (probe.status === 'NOT_EMBEDDABLE') result.notEmbeddable++;

      await prisma.episode.update({
        where: { id: episode.id },
        data: {
          playback: probe.status,
          playbackBlockedMarkets: probe.blockedMarkets,
          playbackCheckedAt: new Date(),
          ...(probe.durationSeconds !== null && {
            durationSeconds: probe.durationSeconds,
          }),
        },
      });
    }
  }

  for (const seriesId of touchedSeries) {
    const episodesForSeries = await prisma.episode.findMany({
      where: { season: { seriesId }, ...WATCHABLE_EPISODE_WHERE },
      select: { playback: true, playbackBlockedMarkets: true },
    });
    const hasPlayableEpisode = episodesForSeries.some((episode) =>
      CORE_MARKETS.some((market) =>
        isPlayableIn(episode.playback, episode.playbackBlockedMarkets, market)
      )
    );
    const geoRestrictedCore =
      episodesForSeries.length > 0 && !hasPlayableEpisode;

    await prisma.series.update({
      where: { id: seriesId },
      data: { geoRestrictedCore },
    });
    result.seriesRecalculated++;
  }

  return result;
}

export type { PlaybackProbe };
