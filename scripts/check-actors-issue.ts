import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function checkActorsIssue() {
  console.log('🔍 Investigando problema de actores...\n');

  // Verificar serie ID 1
  const serie = await prisma.series.findUnique({
    where: { id: 1 },
    include: {
      actors: {
        include: {
          actor: true,
        },
      },
      seasons: {
        include: {
          actors: {
            include: {
              actor: true,
            },
          },
        },
      },
    },
  });

  if (!serie) {
    console.log('Serie no encontrada');
    return;
  }

  console.log(`📺 Serie: ${serie.title}`);
  console.log(`Tipo: ${serie.type}`);
  console.log(`Actores a nivel de serie: ${serie.actors.length}`);
  console.log(`Temporadas: ${serie.seasons.length}`);

  serie.seasons.forEach((season, idx) => {
    console.log(`  Temporada ${season.seasonNumber}: ${season.actors.length} actores`);
  });

  // Contar actores únicos
  const uniqueActorIds = new Set();
  serie.actors.forEach((sa) => uniqueActorIds.add(sa.actorId));
  serie.seasons.forEach((season) => {
    season.actors.forEach((sa) => uniqueActorIds.add(sa.actorId));
  });

  console.log(`\n✅ Actores únicos totales: ${uniqueActorIds.size}`);

  // Verificar si hay duplicados en SeriesActor
  const duplicateCheck = await prisma.seriesActor.groupBy({
    by: ['seriesId', 'actorId'],
    _count: true,
    having: {
      seriesId: 1,
    },
  });

  const duplicates = duplicateCheck.filter((d) => d._count > 1);
  if (duplicates.length > 0) {
    console.log(`\n⚠️ Se encontraron ${duplicates.length} actores duplicados en SeriesActor`);
  }

  // Verificar total de actores en la DB
  const totalActors = await prisma.actor.count();
  console.log(`\n📊 Total de actores en la base de datos: ${totalActors}`);
}

checkActorsIssue()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
