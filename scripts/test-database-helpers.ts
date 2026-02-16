/**
 * Script de ejemplo para probar las funciones helper de la base de datos
 */

import { getAllSeries, getStats, getAllCountries, getAllActors, getViewStats, disconnect } from '../src/lib/database';

async function main() {
  console.log('\n🎬 ============================================');
  console.log('   PROBANDO FUNCIONES HELPER DE BASE DE DATOS');
  console.log('============================================\n');

  // Obtener estadísticas generales
  console.log('📊 ESTADÍSTICAS GENERALES:');
  const stats = await getStats();
  console.log(`  - Total de series: ${stats.totalSeries}`);
  console.log(`  - Total de temporadas: ${stats.totalSeasons}`);
  console.log(`  - Total de actores: ${stats.totalActors}`);
  console.log(`  - Total de países: ${stats.totalCountries}`);
  console.log(`  - Total de episodios: ${stats.totalEpisodes}\n`);

  // Obtener países
  console.log('🌍 PAÍSES:');
  const countries = await getAllCountries();
  countries.forEach((country) => {
    console.log(`  - ${country.name}: ${country._count.series} series`);
  });
  console.log('');

  // Obtener algunas series
  console.log('🎥 PRIMERAS 10 SERIES:');
  const series = await getAllSeries();
  series.slice(0, 10).forEach((s) => {
    const seasons = s.seasons.length > 0 ? ` (${s.seasons.length} temporadas)` : '';
    console.log(`  - ${s.title} (${s.year || '?'})${seasons} - ${s.country?.name || 'Sin país'}`);
  });
  console.log(`  ... y ${series.length - 10} series más\n`);

  // Obtener algunos actores
  console.log('👥 PRIMEROS 10 ACTORES:');
  const actors = await getAllActors();
  actors.slice(0, 10).forEach((actor) => {
    console.log(`  - ${actor.name}`);
  });
  console.log(`  ... y ${actors.length - 10} actores más\n`);

  console.log('✨ ¡Todas las funciones funcionan correctamente!\n');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await disconnect();
  });
