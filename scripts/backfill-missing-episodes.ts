/* eslint-disable no-console */
import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

/**
 * Genera las filas faltantes de Episode (1..episodeCount) para todas las
 * temporadas del catalogo curado que tienen `episodeCount > 0` pero no tienen
 * ningun episodio creado en la tabla Episode (tipico de series importadas desde el
 * Excel original antes de que series-save.ts los generara al guardar).
 *
 * Idempotente: usa createMany con skipDuplicates y nunca modifica ni borra
 * episodios existentes.
 *
 * Uso:
 *   npx tsx scripts/backfill-missing-episodes.ts           # dry-run (solo informa)
 *   npx tsx scripts/backfill-missing-episodes.ts --apply   # inserta las filas faltantes
 */
async function main() {
  const apply = process.argv.includes('--apply');
  const { prisma } = await import('../src/lib/database');

  const seasons = await prisma.season.findMany({
    where: {
      episodeCount: { gt: 0 },
    },
    select: {
      id: true,
      seasonNumber: true,
      episodeCount: true,
      series: {
        select: {
          id: true,
          title: true,
          type: true,
        },
      },
      episodes: {
        select: {
          episodeNumber: true,
        },
      },
    },
    orderBy: [{ seriesId: 'asc' }, { seasonNumber: 'asc' }],
  });

  let affectedSeasons = 0;
  let totalMissing = 0;
  const rowsToInsert: Array<{ seasonId: number; episodeNumber: number }> = [];

  for (const season of seasons) {
    const target = season.episodeCount ?? 0;
    if (target <= 0 || target > 500) continue;
    // Solo temporadas sin ningun capitulo: si ya tiene filas, la numeracion
    // puede ser propia (aportes con saltos) y completar huecos crearia
    // capitulos fantasma sin video en /ver.
    if (season.episodes.length > 0) continue;

    const existingNums = new Set(season.episodes.map((e) => e.episodeNumber));
    const missingForSeason: number[] = [];
    for (let ep = 1; ep <= target; ep++) {
      if (!existingNums.has(ep)) {
        missingForSeason.push(ep);
        rowsToInsert.push({ seasonId: season.id, episodeNumber: ep });
      }
    }

    if (missingForSeason.length > 0) {
      affectedSeasons++;
      totalMissing += missingForSeason.length;
      console.log(
        `[Serie #${season.series.id}] "${season.series.title}" T${season.seasonNumber}: ` +
          `declarados=${target}, actuales=${season.episodes.length}, a crear=${missingForSeason.length}`
      );
    }
  }

  console.log(
    `\nResumen: ${affectedSeasons} temporada(s) con capítulos faltantes (${totalMissing} filas de Episode en total).`
  );

  if (!apply) {
    console.log(
      'Modo dry-run (no se modificó la base). Ejecutá con --apply para crear los capítulos faltantes.'
    );
    return;
  }

  if (rowsToInsert.length > 0) {
    const res = await prisma.episode.createMany({
      data: rowsToInsert,
      skipDuplicates: true,
    });
    console.log(`✅ Creados ${res.count} capítulos en la tabla Episode.`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
