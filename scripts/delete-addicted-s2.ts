/**
 * Borra la temporada 2 de "Addicted Heroin" en produccion.
 *
 * Uso:
 *   npx tsx scripts/delete-addicted-s2.ts          # dry-run (default)
 *   npx tsx scripts/delete-addicted-s2.ts --apply  # ejecuta el borrado
 *
 * Por cascade del schema, borra tambien:
 *   - episodes de esa temporada
 *   - ratings, comments, viewStatus, seasonActors asociados
 */
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const APPLY = process.argv.includes('--apply');

async function main() {
  const candidates = await prisma.series.findMany({
    where: { title: { contains: 'Addicted', mode: 'insensitive' } },
    select: {
      id: true,
      title: true,
      type: true,
      seasons: {
        orderBy: { seasonNumber: 'asc' },
        select: {
          id: true,
          seasonNumber: true,
          title: true,
          year: true,
          episodeCount: true,
          _count: {
            select: {
              episodes: true,
              comments: true,
              ratings: true,
              viewStatus: true,
              actors: true,
            },
          },
        },
      },
    },
  });

  if (candidates.length === 0) {
    console.log('No se encontro ninguna serie con titulo "Addicted".');
    return;
  }

  console.log(
    `\nSeries que matchean "Addicted":\n${JSON.stringify(candidates, null, 2)}\n`
  );

  const targets: Array<{
    seasonId: number;
    seriesTitle: string;
    counts: Record<string, number>;
  }> = [];

  for (const s of candidates) {
    const s2 = s.seasons.find((x) => x.seasonNumber === 2);
    if (s2) {
      targets.push({
        seasonId: s2.id,
        seriesTitle: s.title,
        counts: {
          episodes: s2._count.episodes,
          comments: s2._count.comments,
          ratings: s2._count.ratings,
          viewStatus: s2._count.viewStatus,
          actors: s2._count.actors,
        },
      });
    }
  }

  if (targets.length === 0) {
    console.log('Ninguna de las series matcheadas tiene temporada 2.');
    return;
  }

  console.log('\nTemporadas 2 que se borrarian (cascade):');
  for (const t of targets) {
    console.log(
      `  - "${t.seriesTitle}" (seasonId=${t.seasonId}) — cascade: ${JSON.stringify(t.counts)}`
    );
  }

  if (!APPLY) {
    console.log('\n[DRY RUN] No se borro nada. Re-ejecutar con --apply para confirmar.');
    return;
  }

  if (targets.length > 1) {
    console.log(
      '\nABORT: hay mas de una serie matcheada con S2. Desambigua antes de --apply.'
    );
    process.exitCode = 1;
    return;
  }

  const target = targets[0];
  console.log(`\n[APPLY] Borrando seasonId=${target.seasonId}...`);
  await prisma.season.delete({ where: { id: target.seasonId } });
  console.log('OK. Temporada borrada.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
