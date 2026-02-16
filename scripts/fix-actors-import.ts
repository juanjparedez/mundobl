import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function fixActorsImport() {
  console.log('🔧 Limpiando actores duplicados...\n');

  // 1. Eliminar TODOS los actores vinculados (SeriesActor y SeasonActor)
  console.log('1️⃣ Eliminando vínculos de actores...');
  const deletedSeriesActors = await prisma.seriesActor.deleteMany({});
  const deletedSeasonActors = await prisma.seasonActor.deleteMany({});
  console.log(`   ✅ ${deletedSeriesActors.count} vínculos SeriesActor eliminados`);
  console.log(`   ✅ ${deletedSeasonActors.count} vínculos SeasonActor eliminados\n`);

  console.log('✨ Limpieza completada!');
  console.log('\n⚠️ IMPORTANTE: Ahora debes re-importar los datos del Excel correctamente.');
  console.log('   Ejecuta: npx tsx scripts/import-excel-fixed.ts\n');
}

fixActorsImport()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
