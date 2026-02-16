import 'dotenv/config';
import * as XLSX from 'xlsx';
import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient({
  log: ['warn', 'error'],
});

async function main() {
  console.log('🚀 Iniciando importación CORREGIDA desde Excel...\n');

  // Leer el archivo Excel
  const workbook = XLSX.readFile('data/Series Asiáticas.xlsx');
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  // Convertir a JSON
  const rows: any[] = XLSX.utils.sheet_to_json(worksheet);

  console.log(`📊 Se encontraron ${rows.length} filas en el Excel\n`);

  // PASO 1: Propagar valores de celdas combinadas hacia abajo
  console.log('🔄 Propagando valores de celdas combinadas...');

  let lastSerieData = {
    title: null as any,
    year: null as any,
    temp: null as any,
    origen: null as any,
    chapters: null as any,
    novela: null as any,
    puntos: null as any,
    observaciones: null as any,
  };

  const normalizedRows = rows.map((row) => {
    // Si la fila tiene datos de serie, actualizar lastSerieData
    if (row['Serie/película']) {
      lastSerieData = {
        title: row['Serie/película'],
        year: row['Año'],
        temp: row['Temp'],
        origen: row['Origen'],
        chapters: row['Capítulos'],
        novela: row['Novela'],
        puntos: row['Puntos'],
        observaciones: row['Observaciones'],
      };
    }

    // Retornar fila normalizada con datos propagados
    return {
      'Serie/película': lastSerieData.title,
      Año: lastSerieData.year,
      Temp: lastSerieData.temp,
      Origen: lastSerieData.origen,
      Capítulos: lastSerieData.chapters,
      Novela: lastSerieData.novela,
      Puntos: lastSerieData.puntos,
      Observaciones: lastSerieData.observaciones,
      // Los datos de actor/personaje son únicos por fila
      Actores: row['Actores'],
      Personaje: row['Personaje'],
    };
  });

  console.log(`✅ ${normalizedRows.length} filas normalizadas\n`);

  // PASO 2: Agrupar filas por serie (ahora con datos propagados)
  const seriesMap = new Map<string, any[]>();

  normalizedRows.forEach((row) => {
    // Saltar filas sin título
    if (!row['Serie/película'] || row['Serie/película'].trim() === '') {
      return;
    }

    // Agrupar por título y temporada (el año puede variar entre temporadas)
    const serieKey = `${row['Serie/película']}_${row['Temp']}`;
    if (!seriesMap.has(serieKey)) {
      seriesMap.set(serieKey, []);
    }
    seriesMap.get(serieKey)!.push(row);
  });

  console.log(`🎬 Se identificaron ${seriesMap.size} series únicas\n`);

  let seriesProcessed = 0;
  let actorsLinked = 0;

  // Procesar cada serie
  for (const [serieKey, serieRows] of seriesMap) {
    const firstRow = serieRows[0];
    const title = firstRow['Serie/película'];

    if (!title || title.trim() === '') {
      continue; // Saltar filas sin título
    }

    const origen = firstRow['Origen'];
    const year = firstRow['Año'];
    const tempNumber = firstRow['Temp'];
    const chapters = firstRow['Capítulos'];
    const basedOn =
      firstRow['Novela'] === true || firstRow['Novela'] === 'TRUE'
        ? 'novela'
        : null;

    // Parse rating - convert to int or null
    let rating: number | null = null;
    if (firstRow['Puntos']) {
      const ratingStr = String(firstRow['Puntos']).trim();
      const parsed = parseInt(ratingStr, 10);
      if (!isNaN(parsed)) {
        rating = parsed;
      }
    }

    const observations = firstRow['Observaciones'];

    try {
      // Crear o encontrar país
      let country = null;
      if (origen) {
        country = await prisma.country.upsert({
          where: { name: origen },
          update: {},
          create: { name: origen },
        });
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

      // Crear o encontrar la serie (buscar solo por título)
      // El año se guarda a nivel de temporada, no de serie
      let serie = await prisma.series.findFirst({
        where: { title },
      });

      if (!serie) {
        serie = await prisma.series.create({
          data: {
            title,
            year, // Año de la primera temporada como referencia
            type: contentType,
            basedOn,
            overallRating: rating,
            observations,
            countryId: country?.id,
          },
        });
        seriesProcessed++;
        console.log(`✅ Serie creada: ${title}`);
      }

      // Crear temporada si aplica (solo si tempNumber es válido)
      let season = null;
      if (tempNumber && tempNumber > 0) {
        season = await prisma.season.upsert({
          where: {
            seriesId_seasonNumber: {
              seriesId: serie.id,
              seasonNumber: tempNumber,
            },
          },
          update: {},
          create: {
            seriesId: serie.id,
            seasonNumber: tempNumber,
            episodeCount,
            year,
            observations,
          },
        });
      }

      // AQUÍ ESTÁ EL FIX: Procesar actores solo UNA VEZ por serie/temporada
      // Agrupar actores únicos de esta serie
      const uniqueActors = new Map<
        string,
        { name: string; character: string }
      >();

      for (const row of serieRows) {
        const actorName = row['Actores'];
        const character = row['Personaje'];

        if (actorName && actorName.trim()) {
          // Usar el nombre del actor como key para evitar duplicados
          if (!uniqueActors.has(actorName.trim())) {
            uniqueActors.set(actorName.trim(), {
              name: actorName.trim(),
              character: character || '',
            });
          }
        }
      }

      // Ahora vincular cada actor único UNA SOLA VEZ
      for (const [actorName, actorData] of uniqueActors) {
        // Crear o encontrar actor
        const actor = await prisma.actor.upsert({
          where: { name: actorName },
          update: {},
          create: { name: actorName },
        });

        // Vincular actor con la temporada (si existe) o con la serie
        if (season) {
          await prisma.seasonActor.upsert({
            where: {
              seasonId_actorId_character: {
                seasonId: season.id,
                actorId: actor.id,
                character: actorData.character,
              },
            },
            update: {},
            create: {
              seasonId: season.id,
              actorId: actor.id,
              character: actorData.character,
            },
          });
          actorsLinked++;
        }
      }

      // Log de progreso
      if (season && uniqueActors.size > 0) {
        console.log(
          `   📺 ${title} - Temp ${tempNumber} (${year}): ${uniqueActors.size} actores vinculados`
        );
      }
    } catch (error) {
      console.error(`❌ Error procesando ${title}:`, error);
    }
  }

  console.log('\n✨ Importación completada!\n');
  console.log(`📊 Resumen:`);
  console.log(`  - Series procesadas: ${seriesProcessed}`);
  console.log(`  - Actores vinculados: ${actorsLinked}`);
}

main()
  .catch((e) => {
    console.error('❌ Error fatal:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
