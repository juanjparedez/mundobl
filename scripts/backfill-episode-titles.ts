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

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    console.error('❌ Falta YOUTUBE_API_KEY.');
    process.exit(1);
  }

  const { prisma } = await import('../src/lib/database');

  const eps = await prisma.episode.findMany({
    where: {
      title: null,
      embedVideoId: { not: null },
      embedPlatform: 'YouTube',
    },
    select: {
      id: true,
      episodeNumber: true,
      embedVideoId: true,
      season: { select: { series: { select: { id: true, title: true } } } },
    },
    orderBy: { id: 'asc' },
  });

  if (eps.length === 0) {
    console.log('No hay episodios sin titulo. Nada que hacer.');
    await prisma.$disconnect();
    return;
  }

  console.log(
    `${eps.length} episodios sin titulo${dryRun ? ' [DRY RUN, no escribe]' : ''}\n`
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
  for (const ep of eps) {
    const title = titles.get(ep.embedVideoId!);
    if (!title) {
      // El video ya no existe: no inventamos un titulo, se deja null y
      // que lo agarre el audit de reproducibilidad como REMOVED.
      console.log(
        `  ⚠️  #${ep.season.series.id} ep${ep.episodeNumber} — el video ya no existe en YouTube`
      );
      missing++;
      continue;
    }
    console.log(
      `  ✅ #${ep.season.series.id} ${ep.season.series.title.slice(0, 20).padEnd(22)} ep${String(ep.episodeNumber).padStart(3)}  ${title.slice(0, 60)}`
    );
    if (!dryRun) {
      await prisma.episode.update({ where: { id: ep.id }, data: { title } });
    }
    ok++;
  }

  console.log(
    `\n${dryRun ? 'Se rellenarian' : 'Rellenados'}: ${ok}. Sin video en YouTube: ${missing}.`
  );
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
