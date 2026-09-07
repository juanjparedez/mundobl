/* eslint-disable no-console */
import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

/**
 * Health-check de /ver: sondea cada episodio con embed y guarda si se
 * puede mirar de verdad (Episode.playback / playbackBlockedMarkets).
 *
 * El catalogo de /ver se pudre solo: las productoras licencian series a
 * Viki/iQIYI y geo-bloquean lo que antes estaba abierto, YouTube pone
 * age-gates, los uploaders borran videos. Sin este script nadie se
 * entera hasta que un usuario se come un "video no disponible".
 *
 * Ademas re-calcula Series.geoRestrictedCore a partir de los episodios,
 * asi el flag deja de ser un snapshot manual del import.
 *
 * Ejecucion:
 *   npx tsx scripts/audit-ver-playability.ts              # sondea todo
 *   npx tsx scripts/audit-ver-playability.ts --dry-run    # no escribe
 *   npx tsx scripts/audit-ver-playability.ts --limit 200  # solo N episodios
 *   npx tsx scripts/audit-ver-playability.ts --stale 7    # solo los no sondeados hace 7+ dias
 *   npx tsx scripts/audit-ver-playability.ts --source watch-page
 *
 * Fuentes (ver src/lib/playability.ts):
 *   api        (default) YouTube Data API. Sabe de TODOS los mercados en
 *              una llamada por cada 50 videos. Necesita YOUTUBE_API_KEY.
 *   watch-page Scrapea la watch page. Sin API key, pero solo sabe del
 *              pais desde donde corre el proceso (--market, default AR).
 */

import {
  API_BATCH_SIZE,
  PlayabilityApiError,
  probeViaApi,
  probeViaWatchPage,
  type PlaybackProbe,
  type PlaybackStatus,
} from '../src/lib/playability';

interface Options {
  dryRun: boolean;
  limit: number | null;
  staleDays: number | null;
  source: 'api' | 'watch-page';
  market: string;
}

function parseArgs(argv: string[]): Options {
  const get = (flag: string): string | null => {
    const i = argv.indexOf(flag);
    return i !== -1 && argv[i + 1] ? argv[i + 1] : null;
  };
  const source = get('--source') ?? 'api';
  if (source !== 'api' && source !== 'watch-page') {
    throw new Error(`--source invalido: "${source}". Usa api o watch-page.`);
  }
  const limitRaw = get('--limit');
  const staleRaw = get('--stale');
  return {
    dryRun: argv.includes('--dry-run'),
    limit: limitRaw ? Number.parseInt(limitRaw, 10) : null,
    staleDays: staleRaw ? Number.parseInt(staleRaw, 10) : null,
    source,
    market: (get('--market') ?? 'AR').toUpperCase(),
  };
}

const LABEL: Record<PlaybackStatus, string> = {
  OK: '✅ OK',
  GEO_BLOCKED: '🌎 GEO',
  AGE_RESTRICTED: '🔞 EDAD',
  REMOVED: '💀 BORRADO',
  NOT_EMBEDDABLE: '🚫 SIN EMBED',
  UNKNOWN: '❔ SIN DATO',
};

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const { prisma } = await import('../src/lib/database');

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (opts.source === 'api' && !apiKey) {
    console.error(
      '❌ Falta YOUTUBE_API_KEY. Renovala o corre con --source watch-page.'
    );
    process.exit(1);
  }

  const staleBefore =
    opts.staleDays !== null
      ? new Date(Date.now() - opts.staleDays * 24 * 60 * 60 * 1000)
      : null;

  const episodes = await prisma.episode.findMany({
    where: {
      embedUrl: { not: null },
      embedVideoId: { not: null },
      embedPlatform: 'YouTube',
      ...(staleBefore
        ? {
            OR: [
              { playbackCheckedAt: null },
              { playbackCheckedAt: { lt: staleBefore } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      embedVideoId: true,
      playback: true,
      season: { select: { series: { select: { id: true, title: true } } } },
    },
    // Los nunca sondeados primero, despues del sondeo mas viejo al mas nuevo.
    orderBy: [{ playbackCheckedAt: { sort: 'asc', nulls: 'first' } }],
    ...(opts.limit ? { take: opts.limit } : {}),
  });

  if (episodes.length === 0) {
    console.log('No hay episodios para sondear con esos filtros.');
    await prisma.$disconnect();
    return;
  }

  console.log(
    `Sondeando ${episodes.length} episodios via ${opts.source}` +
      (opts.source === 'watch-page' ? ` desde ${opts.market}` : '') +
      (opts.dryRun ? ' [DRY RUN, no escribe]' : '') +
      '\n'
  );

  const probes = new Map<number, PlaybackProbe>();
  const touchedSeries = new Map<number, string>();
  for (const ep of episodes) {
    touchedSeries.set(ep.season.series.id, ep.season.series.title);
  }

  if (opts.source === 'api') {
    for (let i = 0; i < episodes.length; i += API_BATCH_SIZE) {
      const batch = episodes.slice(i, i + API_BATCH_SIZE);
      const ids = batch.map((e) => e.embedVideoId!);
      try {
        const results = await probeViaApi(ids, apiKey!);
        results.forEach((probe, idx) => probes.set(batch[idx].id, probe));
      } catch (err) {
        if (err instanceof PlayabilityApiError) {
          console.error(`\n❌ ${err.message}`);
          if (err.statusCode === 400 || err.statusCode === 403) {
            console.error(
              '   La API key esta vencida, restringida o sin cuota.\n' +
                '   Reintenta con: --source watch-page'
            );
          }
          break;
        }
        throw err;
      }
      process.stdout.write(
        `\r  lote ${Math.floor(i / API_BATCH_SIZE) + 1}/${Math.ceil(episodes.length / API_BATCH_SIZE)}`
      );
    }
  } else {
    // Secuencial a proposito: es scraping de una pagina publica, no
    // conviene disparar cientos de requests en paralelo contra YouTube.
    for (const [idx, ep] of episodes.entries()) {
      probes.set(ep.id, await probeViaWatchPage(ep.embedVideoId!, opts.market));
      process.stdout.write(`\r  ${idx + 1}/${episodes.length}`);
    }
  }
  process.stdout.write('\r'.padEnd(40) + '\r');

  // ── Persistencia ──────────────────────────────────────────────────
  const counts: Record<string, number> = {};
  const changed: string[] = [];

  for (const ep of episodes) {
    const probe = probes.get(ep.id);
    if (!probe) continue;
    counts[probe.status] = (counts[probe.status] ?? 0) + 1;

    if (probe.status !== ep.playback) {
      changed.push(
        `  ${ep.season.series.title.slice(0, 38).padEnd(40)} ep#${ep.id} ${ep.playback} → ${probe.status}` +
          (probe.detail ? `  (${probe.detail.slice(0, 60)})` : '')
      );
    }

    if (opts.dryRun) continue;
    await prisma.episode.update({
      where: { id: ep.id },
      data: {
        playback: probe.status,
        playbackBlockedMarkets: probe.blockedMarkets,
        playbackCheckedAt: new Date(),
      },
    });
  }

  console.log('=== RESULTADO POR EPISODIO ===');
  for (const [status, n] of Object.entries(counts).sort(
    (a, b) => b[1] - a[1]
  )) {
    console.log(`  ${LABEL[status as PlaybackStatus] ?? status}  ${n}`);
  }

  if (changed.length > 0) {
    console.log(`\n=== CAMBIOS (${changed.length}) ===`);
    changed.slice(0, 60).forEach((l) => console.log(l));
    if (changed.length > 60) {
      console.log(`  ... y ${changed.length - 60} mas`);
    }
  } else {
    console.log('\nSin cambios respecto del sondeo anterior.');
  }

  // ── Re-calculo de Series.geoRestrictedCore ────────────────────────
  // El flag es "esta serie esta bloqueada en el mercado core". Lo
  // derivamos de los episodios: si NINGUN episodio es reproducible en
  // algun mercado core, la serie esta bloqueada para esa audiencia.
  // Solo se recalcula si sondeamos la serie entera, para no marcarla mal
  // por una corrida con --limit.
  if (!opts.dryRun && !opts.limit) {
    console.log('\n=== SERIES ===');
    for (const [seriesId, title] of touchedSeries) {
      const eps = await prisma.episode.findMany({
        where: { season: { seriesId }, embedUrl: { not: null } },
        select: { playback: true, playbackBlockedMarkets: true },
      });
      const playable = eps.filter(
        (e) => e.playback === 'OK' || e.playback === 'UNKNOWN'
      );
      const shouldFlag = playable.length === 0 && eps.length > 0;
      const current = await prisma.series.findUnique({
        where: { id: seriesId },
        select: { geoRestrictedCore: true },
      });
      if (current && current.geoRestrictedCore !== shouldFlag) {
        await prisma.series.update({
          where: { id: seriesId },
          data: { geoRestrictedCore: shouldFlag },
        });
        console.log(
          `  ${title.slice(0, 42).padEnd(44)} geoRestrictedCore ${current.geoRestrictedCore} → ${shouldFlag}`
        );
      }
      const broken = eps.length - playable.length;
      if (broken > 0) {
        console.log(
          `  ⚠️  ${title.slice(0, 42).padEnd(44)} ${broken}/${eps.length} episodios no reproducibles`
        );
      }
    }
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
