/* eslint-disable no-console */
import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

/**
 * Rellena `Episode.title` desde el titulo real del video de YouTube.
 *
 * Por que importa: la UI de /ver/[id] deduce "Capitulo N · Parte X/Y" a
 * partir del titulo. Cuando el titulo es null cae en una heuristica que
 * ADIVINA la numeracion asumiendo 4 partes por capitulo
 * (`floor((n-1)/4)+1`), y entonces muestra "Capitulo 5 · Parte 0" encima
 * de un video que en realidad es "EP.2 [1/4]".
 *
 * Caso real: Hidden Agenda (#251) y Cutie Pie (#141) tenian los primeros
 * 12 episodios sin titulo, cargados por un seed viejo. YouTube sí tiene
 * el titulo correcto ("[Eng Sub] วาระซ่อนเร้น Hidden Agenda | EP.2 [1/4]"),
 * asi que no hay que adivinar nada: hay que ir a buscarlo.
 *
 * Solo toca episodios con `title = null`. Nunca pisa un titulo existente.
 *
 * Ejecucion:
 *   npx tsx scripts/backfill-episode-titles.ts --dry-run
 *   npx tsx scripts/backfill-episode-titles.ts
 */

const API_BATCH = 50;

/** Marcador de episodio en un titulo ("EP.4", "Episodio 4", "Cap 4"). */
const EP_MARKER = /\b(?:ep|episodio|cap|capitulo)\.?\s*(\d{1,3})\b/i;

/**
 * Decide si vale la pena pisar el titulo guardado con el de YouTube.
 *
 * Solo se pisa cuando el guardado NO tiene marcador de episodio y el de
 * YouTube SI. Eso cubre los placeholders del seed viejo (guardaba el
 * nombre de la serie repetido en los 53 episodios: "วาระซ่อนเร้น Hidden
 * Agenda") sin tocar nunca un titulo escrito a mano, porque uno escrito
 * a mano que diga "Capitulo 3" ya matchea el marcador y se saltea.
 */
function shouldReplace(stored: string | null, youtube: string): boolean {
  if (!stored) return true;
  if (EP_MARKER.test(stored)) return false;
  return EP_MARKER.test(youtube);
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    console.error('❌ Falta YOUTUBE_API_KEY.');
    process.exit(1);
  }

  const { prisma } = await import('../src/lib/database');
  const { getYouTubeId } = await import('../src/lib/embed-helpers');

  // ── Paso 0: reparar embedVideoId ──────────────────────────────────
  // Varias series viejas guardaron embedUrl pero dejaron embedVideoId en
  // null. Como todo lo que consulta a la API filtra por embedVideoId,
  // esas series quedaban invisibles para el audit de reproducibilidad Y
  // para este backfill (My School President tenia los 64 episodios asi).
  // El id ya esta dentro de la URL: no hay que pedirlo, hay que extraerlo.
  const sinVideoId = await prisma.episode.findMany({
    where: {
      embedUrl: { not: null },
      embedVideoId: null,
      embedPlatform: 'YouTube',
    },
    select: { id: true, embedUrl: true },
  });

  if (sinVideoId.length > 0) {
    let reparados = 0;
    for (const ep of sinVideoId) {
      const videoId = getYouTubeId(ep.embedUrl!);
      if (!videoId) continue;
      if (!dryRun) {
        await prisma.episode.update({
          where: { id: ep.id },
          data: { embedVideoId: videoId },
        });
      }
      reparados++;
    }
    console.log(
      `Paso 0: ${reparados} de ${sinVideoId.length} embedVideoId recuperados desde la URL.\n`
    );
    if (dryRun && reparados > 0) {
      console.log(
        '  (en dry-run el paso 1 no los ve todavia; volve a correr sin --dry-run)\n'
      );
    }
  }

  // Se miran TODOS los episodios embebidos, no solo los de titulo null:
  // el seed viejo tambien guardo placeholders (el nombre de la serie
  // repetido) que son igual de inutiles para numerar. `shouldReplace`
  // decide cual se pisa.
  const eps = await prisma.episode.findMany({
    where: {
      embedVideoId: { not: null },
      embedPlatform: 'YouTube',
    },
    select: {
      id: true,
      episodeNumber: true,
      title: true,
      embedVideoId: true,
      season: { select: { series: { select: { id: true, title: true } } } },
    },
    orderBy: { id: 'asc' },
  });

  if (eps.length === 0) {
    console.log('No hay episodios con embed de YouTube. Nada que hacer.');
    await prisma.$disconnect();
    return;
  }

  console.log(
    `Revisando ${eps.length} episodios${dryRun ? ' [DRY RUN, no escribe]' : ''}\n`
  );

  const titles = new Map<string, string>();
  for (let i = 0; i < eps.length; i += API_BATCH) {
    const ids = eps
      .slice(i, i + API_BATCH)
      .map((e) => e.embedVideoId!)
      .join(',');
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${ids}&key=${apiKey}`
    );
    if (!res.ok) {
      console.error(`❌ API respondio ${res.status}: ${await res.text()}`);
      process.exit(1);
    }
    const data = (await res.json()) as {
      items?: Array<{ id: string; snippet: { title: string } }>;
    };
    for (const item of data.items ?? []) {
      titles.set(item.id, item.snippet.title);
    }
  }

  let ok = 0;
  let missing = 0;
  let skipped = 0;
  const porSerie = new Map<string, number>();

  for (const ep of eps) {
    const title = titles.get(ep.embedVideoId!);
    if (!title) {
      // El video ya no existe: no inventamos un titulo. Que lo agarre el
      // audit de reproducibilidad como REMOVED.
      missing++;
      continue;
    }
    if (!shouldReplace(ep.title, title)) {
      skipped++;
      continue;
    }
    console.log(
      `  ✅ #${ep.season.series.id} ${ep.season.series.title.slice(0, 20).padEnd(22)} ep${String(ep.episodeNumber).padStart(3)}  ${title.slice(0, 58)}`
    );
    porSerie.set(
      ep.season.series.title,
      (porSerie.get(ep.season.series.title) ?? 0) + 1
    );
    if (!dryRun) {
      await prisma.episode.update({ where: { id: ep.id }, data: { title } });
    }
    ok++;
  }

  console.log(`\n=== RESUMEN POR SERIE ===`);
  for (const [serie, n] of [...porSerie].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${serie.slice(0, 44).padEnd(46)} ${n}`);
  }
  console.log(
    `\n${dryRun ? 'Se corregirian' : 'Corregidos'}: ${ok}. Ya estaban bien: ${skipped}. Sin video en YouTube: ${missing}.`
  );
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
