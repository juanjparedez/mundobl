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
  MIN_EPISODE_SECONDS,
  PlayabilityApiError,
  probeViaApi,
  probeViaWatchPage,
  isPlayableIn,
  type PlaybackProbe,
  type PlaybackStatus,
} from '../src/lib/playability';
import { CORE_MARKETS } from '../src/lib/channel-fetcher';
import { WATCHABLE_EPISODE_WHERE } from '../src/lib/watchable';

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
        // Solo la fuente `api` trae duracion. Con --source watch-page
        // llega null y NO se escribe: un fallback sin el dato no debe
        // pisar una duracion buena que ya sondeamos antes.
        ...(probe.durationSeconds !== null && {
          durationSeconds: probe.durationSeconds,
        }),
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

  // ── Trailers cargados como episodios ──────────────────────────────
  // Distinto de la reproducibilidad: estos videos ANDAN perfecto, el
  // problema es que no son un capitulo. Caso real: /ver mostraba "Some
  // More" y "Long time no see" como mirables y su unico "episodio" era
  // el trailer oficial (43s y 69s).
  //
  // Se mide por DURACION y no por titulo: el titulo engania en los dos
  // sentidos — "clip" matchea dentro de "Eclipse", y un trailer coreano
  // se llama "예고편". La duracion solo la trae la fuente `api`.
  const shorts = episodes
    .map((ep) => ({ ep, probe: probes.get(ep.id) }))
    .filter(
      (x): x is { ep: (typeof episodes)[number]; probe: PlaybackProbe } =>
        !!x.probe &&
        x.probe.durationSeconds !== null &&
        x.probe.durationSeconds < MIN_EPISODE_SECONDS
    );

  if (shorts.length > 0) {
    console.log(
      `\n=== POSIBLES TRAILERS (${shorts.length} episodios de menos de ${MIN_EPISODE_SECONDS / 60} min) ===`
    );
    // Agrupado por serie: lo que importa es si a la serie le quedan
    // capitulos de verdad o si es TODA trailers.
    const porSerie = new Map<string, { cortos: number; total: number }>();
    for (const ep of episodes) {
      const key = ep.season.series.title;
      const acc = porSerie.get(key) ?? { cortos: 0, total: 0 };
      acc.total++;
      porSerie.set(key, acc);
    }
    for (const { ep } of shorts) {
      porSerie.get(ep.season.series.title)!.cortos++;
    }
    for (const [titulo, { cortos, total }] of porSerie) {
      if (cortos === 0) continue;
      const marca = cortos === total ? '❌ NO ES MIRABLE' : '⚠️';
      console.log(
        `  ${marca} ${titulo.slice(0, 40).padEnd(42)} ${cortos}/${total} episodios cortos`
      );
    }
    console.log(
      `  Estos episodios ya NO se publican en /ver: la duracion quedo\n` +
        `  guardada en Episode.durationSeconds y las consultas publicas\n` +
        `  filtran por debajo de ${MIN_EPISODE_SECONDS / 60} min (src/lib/watchable.ts).\n` +
        `  Las series marcadas ❌ desaparecen solas por quedarse sin\n` +
        `  episodios; su ficha queda intacta.`
    );
  }

  // ── Re-calculo de Series.geoRestrictedCore ────────────────────────
  // El flag es "esta serie esta bloqueada en el mercado core". Lo
  // derivamos de los episodios: si NINGUN episodio es reproducible en
  // ningun mercado core, la serie esta bloqueada para esa audiencia.
  // Solo se recalcula si sondeamos la serie entera, para no marcarla mal
  // por una corrida con --limit.
  //
  // Dos cosas que este calculo se equivocaba y apagaban el flag justo en
  // las series peores:
  //
  //   1. Contaba los trailers. GMMTV bloquea los capitulos en occidente
  //      pero deja el trailer abierto en todo el mundo, asi que "Bad
  //      Buddy" daba 12 episodios reproducibles sobre 60 — y los 12 eran
  //      los clips promocionales. La serie quedaba marcada como NO
  //      restringida porque lo unico que andaba era la publicidad.
  //   2. Miraba `playback` sin mirar `playbackBlockedMarkets`, asi que
  //      no distinguia "bloqueado en todos lados" de "bloqueado en un
  //      mercado y disponible en otro".
  if (!opts.dryRun && !opts.limit) {
    console.log('\n=== SERIES ===');
    for (const [seriesId, title] of touchedSeries) {
      const eps = await prisma.episode.findMany({
        // Solo capitulos de verdad: ver src/lib/watchable.ts.
        where: { season: { seriesId }, ...WATCHABLE_EPISODE_WHERE },
        select: { playback: true, playbackBlockedMarkets: true },
      });
      const playable = eps.filter((e) =>
        CORE_MARKETS.some((m) =>
          isPlayableIn(e.playback, e.playbackBlockedMarkets, m)
        )
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
      // Reportado sobre capitulos reales y contra el mercado por defecto
      // del sondeo, que es el que ve la mayoria de los visitantes.
      const enMercado = eps.filter((e) =>
        isPlayableIn(e.playback, e.playbackBlockedMarkets, opts.market)
      ).length;
      const broken = eps.length - enMercado;
      if (broken > 0) {
        console.log(
          `  ${enMercado === 0 ? '❌' : '⚠️ '} ${title.slice(0, 42).padEnd(44)} ${broken}/${eps.length} capitulos no reproducibles desde ${opts.market}`
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
