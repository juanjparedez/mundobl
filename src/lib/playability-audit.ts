import { API_BATCH_SIZE, probeViaApi, type PlaybackProbe } from './playability';
import { CORE_MARKETS } from './channel-fetcher';
import { prisma } from './database';
import { Prisma } from '../generated/prisma';
import { WATCHABLE_EPISODE_WHERE } from './watchable';
import { isPlayableIn } from './playability';

const DEFAULT_STALE_DAYS = 1;
const MAX_EPISODES_PER_RUN = 500;

// Las escrituras van agrupadas en vez de un update suelto por episodio: el
// pooler de Supabase esta en sa-east-1 y de a una cada fila paga su propio
// round-trip. Es la misma leccion que ya habia aprendido
// scripts/backfill-episode-airdate.ts, que el cron no habia aplicado.
const WRITE_BATCH = 100;

/**
 * Presupuesto de tiempo del audit, en ms.
 *
 * La ruta declara `maxDuration = 60`, asi que pasarse no devuelve un error
 * util: Vercel corta la funcion y el cron ve un 504 sin saber que hizo. Con
 * presupuesto, el audit termina siempre por las suyas — procesa lo que entra,
 * guarda, y deja el resto para la corrida siguiente (el `orderBy` por sondeo
 * mas viejo garantiza que el backlog avanza y no se queda girando sobre los
 * mismos episodios).
 *
 * 45s deja ~15s de colchon para el recalculo de series y la respuesta.
 */
const TIME_BUDGET_MS = 45_000;

export interface PlayabilityAuditResult {
  scanned: number;
  probed: number;
  /** True si el audit corto por presupuesto de tiempo y quedo backlog. */
  budgetExhausted: boolean;
  /** Milisegundos que tardo la corrida. */
  elapsedMs: number;
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

  const startedAt = Date.now();
  const deadline = startedAt + TIME_BUDGET_MS;

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
    budgetExhausted: false,
    elapsedMs: 0,
    changed: 0,
    removed: 0,
    geoBlocked: 0,
    ageRestricted: 0,
    notEmbeddable: 0,
    seriesRecalculated: 0,
  };
  const touchedSeries = new Set<number>();

  // Updates acumulados, se descargan de a WRITE_BATCH.
  let pendingWrites: Prisma.PrismaPromise<unknown>[] = [];
  const flushWrites = async () => {
    if (pendingWrites.length === 0) return;
    await prisma.$transaction(pendingWrites);
    pendingWrites = [];
  };

  for (let index = 0; index < episodes.length; index += API_BATCH_SIZE) {
    // El corte va ANTES de pedirle otra tanda a YouTube: si no entra el
    // sondeo tampoco entra su escritura, y gastar cuota para tirarla es peor
    // que dejar el backlog para maniana.
    if (Date.now() >= deadline) {
      result.budgetExhausted = true;
      break;
    }

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

      pendingWrites.push(
        prisma.episode.update({
          where: { id: episode.id },
          data: {
            playback: probe.status,
            playbackBlockedMarkets: probe.blockedMarkets,
            playbackCheckedAt: new Date(),
            ...(probe.durationSeconds !== null && {
              durationSeconds: probe.durationSeconds,
            }),
          },
        })
      );

      if (pendingWrites.length >= WRITE_BATCH) await flushWrites();
    }
  }

  await flushWrites();

  // Recalculo de `Series.geoRestrictedCore` para las series tocadas.
  //
  // Antes esto era un N+1: un findMany MAS un update por serie, o sea ~60
  // round-trips extra a sa-east-1 despues de los 500 de arriba. Ahora es UNA
  // query para todos los episodios de todas las series tocadas, el agrupado
  // en memoria, y los updates en lote.
  const seriesIds = [...touchedSeries];
  if (seriesIds.length > 0) {
    const episodesForSeries = await prisma.episode.findMany({
      where: {
        season: { seriesId: { in: seriesIds } },
        ...WATCHABLE_EPISODE_WHERE,
      },
      select: {
        playback: true,
        playbackBlockedMarkets: true,
        season: { select: { seriesId: true } },
      },
    });

    const bySeries = new Map<number, { total: number; playable: number }>();
    for (const seriesId of seriesIds) {
      bySeries.set(seriesId, { total: 0, playable: 0 });
    }
    for (const episode of episodesForSeries) {
      const bucket = bySeries.get(episode.season.seriesId);
      if (!bucket) continue;
      bucket.total++;
      const playable = CORE_MARKETS.some((market) =>
        isPlayableIn(episode.playback, episode.playbackBlockedMarkets, market)
      );
      if (playable) bucket.playable++;
    }

    for (const [seriesId, counts] of bySeries) {
      pendingWrites.push(
        prisma.series.update({
          where: { id: seriesId },
          data: {
            geoRestrictedCore: counts.total > 0 && counts.playable === 0,
          },
        })
      );
      result.seriesRecalculated++;
      if (pendingWrites.length >= WRITE_BATCH) await flushWrites();
    }
    await flushWrites();
  }

  result.elapsedMs = Date.now() - startedAt;
  return result;
}

export type { PlaybackProbe };
