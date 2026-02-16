import 'dotenv/config'; // Cargar variables de entorno
import * as XLSX from 'xlsx';
import { PrismaClient } from '../src/generated/prisma';

// Initialize Prisma Client (Prisma 5 usa el engine tradicional)
const prisma = new PrismaClient({
  log: ['warn', 'error'],
});

interface ExcelRow {
  'Serie/película': string;
  'Origen': string;
  'Año': number;
  'Temp': number;
  'Capítulos': string | number;
  'Novela': boolean;
  '10': boolean;
  'Actores': string;
  'Personaje': string;
  'Puntos': number;
  'Observaciones': string;
}

async function main() {
  console.log('🚀 Iniciando importación desde Excel...\n');

  // Leer el archivo Excel
  const workbook = XLSX.readFile('data/Series Asiáticas.xlsx');
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  // Convertir a JSON
  const rows: any[] = XLSX.utils.sheet_to_json(worksheet);

  console.log(`📊 Se encontraron ${rows.length} filas en el Excel\n`);

  // Agrupar filas por serie (las series tienen múltiples filas para múltiples actores)
  const seriesMap = new Map<string, any[]>();

  rows.forEach((row) => {
    const serieKey = `${row['Serie/película']}_${row['Año']}_${row['Temp']}`;
    if (!seriesMap.has(serieKey)) {
      seriesMap.set(serieKey, []);
    }
    seriesMap.get(serieKey)!.push(row);
  });

  console.log(`🎬 Se identificaron ${seriesMap.size} series únicas\n`);

  let seriesCount = 0;
  let actorsCount = 0;
  let countriesSet = new Set<string>();

  // Procesar cada serie
  for (const [serieKey, serieRows] of seriesMap) {
    const firstRow = serieRows[0];
    const title = firstRow['Serie/película'];
    const origen = firstRow['Origen'];
    const year = firstRow['Año'];
    const tempNumber = firstRow['Temp'];
    const chapters = firstRow['Capítulos'];
    const basedOn = firstRow['Novela'] === true || firstRow['Novela'] === 'TRUE' ? 'novela' : null;
    const rating = firstRow['Puntos'];
    const observations = firstRow['Observaciones'];

    console.log(`\n📝 Procesando: ${title} (${year}) - Temp ${tempNumber}`);

    try {
      // Crear o encontrar país
      let country = null;
      if (origen) {
        country = await prisma.country.upsert({
          where: { name: origen },
          update: {},
          create: { name: origen },
        });
        countriesSet.add(origen);
      }

      // Determinar tipo de contenido
      let contentType = 'serie';
      let episodeCount: number | null = null;

      if (typeof chapters === 'string') {
        const chaptersLower = chapters.toLowerCase();
        if (chaptersLower.includes('corto')) {
          contentType = 'corto';
        } else if (chaptersLower.includes('peli')) {
          contentType = 'pelicula';
        }
      } else if (typeof chapters === 'number') {
        episodeCount = chapters;
      }

      // Crear o encontrar la serie
      let series = await prisma.series.findFirst({
        where: {
          title,
          year,
        },
      });

      if (!series) {
        series = await prisma.series.create({
          data: {
            title,
            year,
            type: contentType,
            basedOn,
            overallRating: rating,
            observations,
            countryId: country?.id,
          },
        });
        seriesCount++;
        console.log(`  ✅ Serie creada: ${title}`);
      }

      // Crear temporada si aplica
      let season = null;
      if (tempNumber && tempNumber > 0) {
        season = await prisma.season.upsert({
          where: {
            seriesId_seasonNumber: {
              seriesId: series.id,
              seasonNumber: tempNumber,
            },
          },
          update: {},
          create: {
            seriesId: series.id,
            seasonNumber: tempNumber,
            episodeCount,
            year,
            observations,
          },
        });
        console.log(`  📺 Temporada ${tempNumber} creada/actualizada`);
      }

      // Procesar actores de esta serie
      for (const row of serieRows) {
        const actorName = row['Actores'];
        const character = row['Personaje'];

        if (actorName && actorName.trim()) {
          // Crear o encontrar actor
          const actor = await prisma.actor.upsert({
            where: { name: actorName.trim() },
            update: {},
            create: {
              name: actorName.trim(),
            },
          });

          // Vincular actor con la temporada (si existe) o con la serie
          if (season) {
            await prisma.seasonActor.upsert({
              where: {
                seasonId_actorId_character: {
                  seasonId: season.id,
                  actorId: actor.id,
                  character: character || '',
                },
              },
              update: {},
              create: {
                seasonId: season.id,
                actorId: actor.id,
                character: character || '',
              },
            });
          } else {
            await prisma.seriesActor.upsert({
              where: {
                seriesId_actorId_character: {
                  seriesId: series.id,
                  actorId: actor.id,
                  character: character || '',
                },
              },
              update: {},
              create: {
                seriesId: series.id,
                actorId: actor.id,
                character: character || '',
              },
            });
          }

          actorsCount++;
        }
      }

      console.log(`  👥 ${serieRows.length} actores vinculados`);

    } catch (error) {
      console.error(`  ❌ Error procesando ${title}:`, error);
    }
  }

  console.log('\n\n✨ Importación completada!\n');
  console.log(`📊 Resumen:`);
  console.log(`  - Series creadas: ${seriesCount}`);
  console.log(`  - Países únicos: ${countriesSet.size}`);
  console.log(`  - Actores vinculados: ${actorsCount}`);
}

main()
  .catch((e) => {
    console.error('❌ Error fatal:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
