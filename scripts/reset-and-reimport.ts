import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function resetDatabase() {
  console.log('🗑️  Limpiando base de datos...\n');

  // Eliminar en orden para respetar las relaciones
  console.log('1️⃣ Eliminando vínculos de actores...');
  const deletedSeasonActors = await prisma.seasonActor.deleteMany({});
  const deletedSeriesActors = await prisma.seriesActor.deleteMany({});
  console.log(`   ✅ ${deletedSeasonActors.count} vínculos SeasonActor eliminados`);
  console.log(`   ✅ ${deletedSeriesActors.count} vínculos SeriesActor eliminados\n`);

  console.log('2️⃣ Eliminando temporadas...');
  const deletedSeasons = await prisma.season.deleteMany({});
  console.log(`   ✅ ${deletedSeasons.count} temporadas eliminadas\n`);

  console.log('3️⃣ Eliminando series...');
  const deletedSeries = await prisma.series.deleteMany({});
  console.log(`   ✅ ${deletedSeries.count} series eliminadas\n`);

  console.log('4️⃣ Eliminando actores...');
  const deletedActors = await prisma.actor.deleteMany({});
  console.log(`   ✅ ${deletedActors.count} actores eliminados\n`);

  console.log('5️⃣ Eliminando países...');
  const deletedCountries = await prisma.country.deleteMany({});
  console.log(`   ✅ ${deletedCountries.count} países eliminados\n`);

  console.log('✨ Base de datos limpiada!\n');
}

resetDatabase()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
