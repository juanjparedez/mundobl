/* eslint-disable no-console */
import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

/**
 * Seed de series y cortometrajes oficiales de Vimeo para /ver.
 * Idempotente: busca por título o embedUrl y no duplica.
 *
 * Ejecución:
 *   npx tsx scripts/seed-vimeo-series.ts
 */
async function main() {
  const { prisma } = await import('../src/lib/database');

  console.log('🌱 Iniciando seed de series oficiales de Vimeo para /ver...');

  const vimeoSeriesData = [
    {
      title: 'Some More',
      originalTitle: '섬모어',
      year: 2018,
      type: 'corto',
      country: 'Corea del Sur',
      countryCode: 'kr',
      productionCompany: 'Strongberry',
      synopsis:
        'Dong-soo realiza un viaje en bicicleta por el campo después de una ruptura y termina hospedándose en una pintoresca granja donde conoce a In-pyo.',
      format: 'regular',
      catalogScope: 'WATCHABLE_ONLY',
      origin: 'USER_EMBED',
      visibility: 'VISIBLE',
      imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop',
      genres: ['Romance', 'Drama'],
      tags: ['Viaje', 'Campo', 'Slow burn'],
      episodes: [
        {
          episodeNumber: 1,
          seasonNumber: 1,
          title: 'Some More (Short Film)',
          embedUrl: 'https://vimeo.com/288421868',
          channelName: 'Strongberry Official',
          channelUrl: 'https://vimeo.com/strongberry',
        },
      ],
    },
    {
      title: 'Long Time No See',
      originalTitle: '롱타임노씨',
      year: 2017,
      type: 'serie',
      country: 'Corea del Sur',
      countryCode: 'kr',
      productionCompany: 'Strongberry',
      synopsis:
        'Un reconocido asesino a sueldo conocido como Flying Dagger conoce a Wild Dog a través de un foro en línea y pronto se enamoran sin conocer sus identidades secretas.',
      format: 'regular',
      catalogScope: 'WATCHABLE_ONLY',
      origin: 'USER_EMBED',
      visibility: 'VISIBLE',
      imageUrl: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=600&auto=format&fit=crop',
      genres: ['Acción', 'Romance', 'Thriller'],
      tags: ['Asesinos', 'Identidad secreta', 'Acción'],
      episodes: [
        {
          episodeNumber: 1,
          seasonNumber: 1,
          title: 'Episodio 1: Encuentro inesperado',
          embedUrl: 'https://vimeo.com/244304891',
          channelName: 'Strongberry Official',
          channelUrl: 'https://vimeo.com/strongberry',
        },
      ],
    },
    {
      title: 'Match Boy',
      originalTitle: '성냥팔이 소년',
      year: 2019,
      type: 'corto',
      country: 'Corea del Sur',
      countryCode: 'kr',
      productionCompany: 'Strongberry',
      synopsis:
        'Un joven solitario que vende fósforos en una noche fría se encuentra con alguien especial que cambiará su perspectiva.',
      format: 'regular',
      catalogScope: 'WATCHABLE_ONLY',
      origin: 'USER_EMBED',
      visibility: 'VISIBLE',
      imageUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&auto=format&fit=crop',
      genres: ['Drama', 'Romance', 'Fantasía'],
      tags: ['Cuento de hadas', 'Invierno'],
      episodes: [
        {
          episodeNumber: 1,
          seasonNumber: 1,
          title: 'Match Boy (Cortometraje)',
          embedUrl: 'https://vimeo.com/318991204',
          channelName: 'Strongberry Official',
          channelUrl: 'https://vimeo.com/strongberry',
        },
      ],
    },
  ];

  for (const s of vimeoSeriesData) {
    let countryId: number | null = null;
    if (s.country) {
      const countryRecord = await prisma.country.upsert({
        where: { name: s.country },
        update: { code: s.countryCode },
        create: { name: s.country, code: s.countryCode },
      });
      countryId = countryRecord.id;
    }

    let companyId: number | null = null;
    if (s.productionCompany) {
      const companyRecord = await prisma.productionCompany.upsert({
        where: { name: s.productionCompany },
        update: {},
        create: { name: s.productionCompany, country: s.country },
      });
      companyId = companyRecord.id;
    }

    let series = await prisma.series.findFirst({
      where: { title: s.title },
    });

    if (!series) {
      series = await prisma.series.create({
        data: {
          title: s.title,
          originalTitle: s.originalTitle,
          year: s.year,
          type: s.type,
          synopsis: s.synopsis,
          imageUrl: s.imageUrl,
          format: s.format,
          catalogScope: s.catalogScope,
          origin: s.origin,
          visibility: s.visibility,
          countryId,
          productionCompanyId: companyId,
        },
      });
      console.log(`✅ Creada serie "${s.title}" (ID: ${series.id})`);
    } else {
      console.log(`ℹ️ Serie "${s.title}" ya existe (ID: ${series.id})`);
    }

    for (const genreName of s.genres) {
      const g = await prisma.genre.upsert({
        where: { name: genreName },
        update: {},
        create: { name: genreName },
      });
      await prisma.seriesGenre.upsert({
        where: {
          seriesId_genreId: {
            seriesId: series.id,
            genreId: g.id,
          },
        },
        update: {},
        create: { seriesId: series.id, genreId: g.id },
      });
    }

    for (const tagName of s.tags) {
      const t = await prisma.tag.upsert({
        where: { name: tagName },
        update: {},
        create: { name: tagName },
      });
      await prisma.seriesTag.upsert({
        where: {
          seriesId_tagId: {
            seriesId: series.id,
            tagId: t.id,
          },
        },
        update: {},
        create: { seriesId: series.id, tagId: t.id },
      });
    }

    let season = await prisma.season.findFirst({
      where: { seriesId: series.id, number: 1 },
    });
    if (!season) {
      season = await prisma.season.create({
        data: {
          seriesId: series.id,
          number: 1,
          title: 'Temporada 1',
        },
      });
    }

    for (const ep of s.episodes) {
      const existingEp = await prisma.episode.findFirst({
        where: { seasonId: season.id, number: ep.episodeNumber },
      });
      if (!existingEp) {
        await prisma.episode.create({
          data: {
            seasonId: season.id,
            number: ep.episodeNumber,
            title: ep.title,
            embedUrl: ep.embedUrl,
            channelName: ep.channelName,
            channelUrl: ep.channelUrl,
          },
        });
        console.log(`   🎬 Episodio #${ep.episodeNumber} cargado (${ep.embedUrl})`);
      }
    }
  }

  console.log('✨ Seed de Vimeo completado exitosamente.');
}

main().catch((e) => {
  console.error('Error en seed de Vimeo:', e);
  process.exit(1);
});
