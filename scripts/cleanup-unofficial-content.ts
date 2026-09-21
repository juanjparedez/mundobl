/* eslint-disable no-console */
import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma';
import {
  classifyWatchLink,
  isOfficialChannelUrl,
} from '../src/lib/official-channels';

/**
 * Aplica la politica de contenido oficial (docs/politica-contenido-oficial.md)
 * sobre los datos existentes:
 *
 *  1. Episodios con embed de un canal fuera de la lista blanca → se vacian
 *     los campos de embed (la ficha y el episodio quedan como metadata; el
 *     tracking de los usuarios no se toca).
 *  2. Series USER_EMBED que quedan sin ningun episodio reproducible → se
 *     ocultan (visibility HIDDEN), no se borran: si la productora sube la
 *     serie a su canal, se reimporta.
 *  3. WatchLinks a hosts piratas conocidos → se borran.
 *  4. WatchLinks que no se pueden decidir solos (YouTube fuera de la lista,
 *     Telegram, sitios desconocidos) y clips sin canal → se listan para
 *     revision manual. No se tocan.
 *
 * Uso:
 *   npx tsx scripts/cleanup-unofficial-content.ts            # dry-run (default)
 *   npx tsx scripts/cleanup-unofficial-content.ts --apply    # escribe en DB
 *
 * Tras --apply, las fichas afectadas (ISR 15 min) y /ver se actualizan
 * solas; para forzarlo, redeploy o esperar.
 */
const APPLY = process.argv.includes('--apply');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function pad(value: string | number, width: number): string {
  return String(value).padEnd(width);
}

async function main() {
  console.log(APPLY ? '== MODO APPLY ==' : '== DRY-RUN (sin cambios) ==');

  // ── 1. Episodios embebidos ─────────────────────────────────────────
  const episodes = await prisma.episode.findMany({
    where: { embedUrl: { not: null } },
    select: {
      id: true,
      embedUrl: true,
      embedPlatform: true,
      embedChannelName: true,
      embedChannelUrl: true,
      season: {
        select: {
          seriesId: true,
          series: {
            select: { id: true, title: true, origin: true, visibility: true },
          },
        },
      },
    },
  });

  const unofficial = episodes.filter(
    (ep) =>
      ep.embedUrl &&
      (ep.embedPlatform !== 'YouTube' ||
        !isOfficialChannelUrl(ep.embedChannelUrl))
  );

  interface SeriesGroup {
    id: number;
    title: string;
    origin: string;
    visibility: string;
    channels: Set<string>;
    episodeIds: number[];
  }
  const bySeries = new Map<number, SeriesGroup>();
  for (const ep of unofficial) {
    const s = ep.season.series;
    const group = bySeries.get(s.id) ?? {
      id: s.id,
      title: s.title,
      origin: s.origin,
      visibility: s.visibility,
      channels: new Set<string>(),
      episodeIds: [],
    };
    group.channels.add(ep.embedChannelName ?? '(sin canal)');
    group.episodeIds.push(ep.id);
    bySeries.set(s.id, group);
  }

  console.log(
    `\n1) Episodios con embed: ${episodes.length} · fuera de la lista blanca: ${unofficial.length} en ${bySeries.size} series`
  );
  console.log(
    `   ${pad('id', 5)} ${pad('origen', 11)} ${pad('eps', 4)} ${pad('titulo', 45)} canal`
  );
  for (const g of bySeries.values()) {
    console.log(
      `   ${pad(g.id, 5)} ${pad(g.origin, 11)} ${pad(g.episodeIds.length, 4)} ${pad(g.title.slice(0, 44), 45)} ${Array.from(g.channels).join(' | ')}`
    );
  }

  // ── 2. Series USER_EMBED que quedan vacias ─────────────────────────
  const unofficialIds = new Set(unofficial.map((ep) => ep.id));
  const toHide: SeriesGroup[] = [];
  for (const g of bySeries.values()) {
    if (g.origin !== 'USER_EMBED' || g.visibility === 'HIDDEN') continue;
    const remaining = episodes.filter(
      (ep) => ep.season.seriesId === g.id && !unofficialIds.has(ep.id)
    );
    if (remaining.length === 0) toHide.push(g);
  }
  console.log(
    `\n2) Series USER_EMBED que quedan sin nada reproducible → HIDDEN: ${toHide.length}`
  );
  for (const g of toHide) console.log(`   ${pad(g.id, 5)} ${g.title}`);

  // ── 3 y 4. WatchLinks ──────────────────────────────────────────────
  const watchLinks = await prisma.watchLink.findMany({
    select: {
      id: true,
      platform: true,
      url: true,
      series: { select: { id: true, title: true } },
    },
  });
  const blocked = watchLinks.filter(
    (w) => classifyWatchLink(w.url) === 'blocked'
  );
  const review = watchLinks.filter(
    (w) => classifyWatchLink(w.url) === 'review'
  );

  console.log(
    `\n3) WatchLinks a hosts piratas conocidos → borrar: ${blocked.length}`
  );
  for (const w of blocked) {
    console.log(
      `   ${pad(w.id, 5)} serie ${pad(w.series.id, 4)} ${pad(w.platform, 10)} ${w.url}`
    );
  }

  console.log(
    `\n4) WatchLinks para revisar a mano (no se tocan): ${review.length}`
  );
  for (const w of review) {
    console.log(
      `   ${pad(w.id, 5)} serie ${pad(w.series.id, 4)} ${pad(w.platform, 10)} ${pad(w.series.title.slice(0, 30), 31)} ${w.url}`
    );
  }

  const clipsWithoutChannel = await prisma.embeddableContent.count({
    where: { OR: [{ channelName: null }, { channelName: '' }] },
  });
  console.log(
    `\n   Clips/trailers sin canal registrado (revisar en /admin/contenido): ${clipsWithoutChannel}`
  );

  // ── Apply ──────────────────────────────────────────────────────────
  if (!APPLY) {
    console.log('\nDry-run terminado. Para escribir: --apply');
    return;
  }

  const result = await prisma.$transaction(async (tx) => {
    const cleared = await tx.episode.updateMany({
      where: { id: { in: Array.from(unofficialIds) } },
      data: {
        embedUrl: null,
        embedPlatform: null,
        embedVideoId: null,
        embedChannelName: null,
        embedChannelUrl: null,
        playback: 'UNKNOWN',
        playbackCheckedAt: null,
        playbackBlockedMarkets: [],
      },
    });
    const hidden = await tx.series.updateMany({
      where: { id: { in: toHide.map((g) => g.id) } },
      data: { visibility: 'HIDDEN' },
    });
    const deleted = await tx.watchLink.deleteMany({
      where: { id: { in: blocked.map((w) => w.id) } },
    });
    return {
      cleared: cleared.count,
      hidden: hidden.count,
      deleted: deleted.count,
    };
  });

  console.log(
    `\nListo: ${result.cleared} embeds vaciados, ${result.hidden} series ocultas, ${result.deleted} links borrados.`
  );
  console.log(
    'Volver a correr sin --apply tiene que listar 0 en los puntos 1, 2 y 3.'
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
