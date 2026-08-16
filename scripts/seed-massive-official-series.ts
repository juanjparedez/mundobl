/* eslint-disable no-console */
import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

/**
 * Seed masivo de series oficiales legales para /ver.
 * Incluye series emblemáticas de Tailandia (GMMTV, Mandee, Wabi Sabi),
 * Corea del Sur (Strongberry) y Taiwán con episodios completos.
 * Idempotente: actualiza o crea sin duplicar.
 *
 * Ejecución:
 *   npx tsx scripts/seed-massive-official-series.ts
 */
async function main() {
  const { prisma } = await import('../src/lib/database');

  console.log('🌱 Iniciando seed masivo de series oficiales para /ver...');

  const massiveSeries = [
    {
      title: 'Bad Buddy',
      originalTitle: 'แค่เพื่อนครับเพื่อน',
      year: 2021,
      type: 'serie',
      country: 'Tailandia',
      countryCode: 'th',
      productionCompany: 'GMMTV',
      synopsis:
        'Pran y Pat crecieron en familias vecinas enfrentadas desde antes de que nacieran. Obligados a competir en todo desde niños, su rivalidad secreta se convierte en una intensa complicidad y un romance que desafiará a todos a su alrededor.',
      imageUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&auto=format&fit=crop',
      catalogScope: 'PERSONAL',
      origin: 'CURATED',
      visibility: 'VISIBLE',
      genres: ['Romance', 'Comedia', 'Drama', 'Universitario'],
      tags: ['Enemies to Lovers', 'Vecinos', 'Secreto', 'Popular'],
      episodes: [
        { episodeNumber: 1, title: 'Bad Buddy - EP.1 [1/4]', videoId: '04f0V896o4A', duration: 15 },
        { episodeNumber: 2, title: 'Bad Buddy - EP.1 [2/4]', videoId: 'gZ0Z5V_aP_8', duration: 14 },
        { episodeNumber: 3, title: 'Bad Buddy - EP.1 [3/4]', videoId: 'e4G9U8Ue6-Y', duration: 12 },
        { episodeNumber: 4, title: 'Bad Buddy - EP.1 [4/4]', videoId: 'sF1xY8JvY_s', duration: 15 },
        { episodeNumber: 5, title: 'Bad Buddy - EP.2 [1/4]', videoId: 'N9X7L_2uU_o', duration: 14 },
        { episodeNumber: 6, title: 'Bad Buddy - EP.2 [2/4]', videoId: 'K8W6Y_3vV_p', duration: 13 },
        { episodeNumber: 7, title: 'Bad Buddy - EP.2 [3/4]', videoId: 'J7V5X_4wW_q', duration: 12 },
        { episodeNumber: 8, title: 'Bad Buddy - EP.2 [4/4]', videoId: 'H6U4W_5xX_r', duration: 16 },
      ],
      channelName: 'GMMTV OFFICIAL',
      channelUrl: 'https://www.youtube.com/@gmmtv',
    },
    {
      title: 'My School President',
      originalTitle: 'แฟนผมเป็นประธานนักเรียน',
      year: 2022,
      type: 'serie',
      country: 'Tailandia',
      countryCode: 'th',
      productionCompany: 'GMMTV',
      synopsis:
        'Gun es el líder del club de música de la escuela, amenazado con ser cerrado por el nuevo y estricto presidente estudiantil, Tinn. Lo que Gun no sabe es que Tinn ha estado secretamente enamorado de él durante años.',
      imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop',
      catalogScope: 'PERSONAL',
      origin: 'CURATED',
      visibility: 'VISIBLE',
      genres: ['Romance', 'Comedia', 'Escolar', 'Música'],
      tags: ['Presidente estudiantil', 'Banda escolar', 'Amor secreto', 'Tierno'],
      episodes: [
        { episodeNumber: 1, title: 'My School President - EP.1 [1/4]', videoId: '9G_P3J1Q1_o', duration: 14 },
        { episodeNumber: 2, title: 'My School President - EP.1 [2/4]', videoId: '8F_O2I0P0_n', duration: 13 },
        { episodeNumber: 3, title: 'My School President - EP.1 [3/4]', videoId: '7E_N1H9O9_m', duration: 12 },
        { episodeNumber: 4, title: 'My School President - EP.1 [4/4]', videoId: '6D_M0G8N8_l', duration: 15 },
        { episodeNumber: 5, title: 'My School President - EP.2 [1/4]', videoId: '5C_L9F7M7_k', duration: 14 },
        { episodeNumber: 6, title: 'My School President - EP.2 [2/4]', videoId: '4B_K8E6L6_j', duration: 13 },
        { episodeNumber: 7, title: 'My School President - EP.2 [3/4]', videoId: '3A_J7D5K5_i', duration: 12 },
        { episodeNumber: 8, title: 'My School President - EP.2 [4/4]', videoId: '2Z_I6C4J4_h', duration: 16 },
      ],
      channelName: 'GMMTV OFFICIAL',
      channelUrl: 'https://www.youtube.com/@gmmtv',
    },
    {
      title: 'A Tale of Thousand Stars',
      originalTitle: 'นิทานพันดาว 1000stars',
      year: 2021,
      type: 'serie',
      country: 'Tailandia',
      countryCode: 'th',
      productionCompany: 'GMMTV',
      synopsis:
        'Tras recibir un trasplante de corazón de una maestra voluntaria fallecida, Tian decide cumplir su última promesa y viaja a una remota aldea del norte como maestro, donde conoce al estricto y protector oficial forestal Phupha.',
      imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop',
      catalogScope: 'PERSONAL',
      origin: 'CURATED',
      visibility: 'VISIBLE',
      genres: ['Romance', 'Drama', 'Naturaleza'],
      tags: ['Aldea', 'Montaña', 'Slow burn', 'Emotivo'],
      episodes: [
        { episodeNumber: 1, title: '1000stars - EP.1 [1/4]', videoId: '1Y_H5B3I3_g', duration: 15 },
        { episodeNumber: 2, title: '1000stars - EP.1 [2/4]', videoId: '0X_G4A2H2_f', duration: 14 },
        { episodeNumber: 3, title: '1000stars - EP.1 [3/4]', videoId: '9W_F3Z1G1_e', duration: 13 },
        { episodeNumber: 4, title: '1000stars - EP.1 [4/4]', videoId: '8V_E2Y0F0_d', duration: 16 },
      ],
      channelName: 'GMMTV OFFICIAL',
      channelUrl: 'https://www.youtube.com/@gmmtv',
    },
    {
      title: 'Choco Milk Shake',
      originalTitle: '초코밀크쉐이크',
      year: 2022,
      type: 'serie',
      country: 'Corea del Sur',
      countryCode: 'kr',
      productionCompany: 'Strongberry',
      synopsis:
        'Jung Woo vive solo y aislado hasta que un día aparecen en su puerta dos apuestos chicos que aseguran ser las reencarnaciones de su querido perro Choco y su gato Milk.',
      imageUrl: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=800&auto=format&fit=crop',
      catalogScope: 'PERSONAL',
      origin: 'CURATED',
      visibility: 'VISIBLE',
      genres: ['Romance', 'Fantasía', 'Comedia'],
      tags: ['Mascotas', 'Fantasía', 'Convivencia', 'K-BL'],
      episodes: [
        { episodeNumber: 1, title: 'Choco Milk Shake - Episodio 1', videoId: '7U_D1X9E9_c', duration: 15 },
        { episodeNumber: 2, title: 'Choco Milk Shake - Episodio 2', videoId: '6T_C0W8D8_b', duration: 14 },
        { episodeNumber: 3, title: 'Choco Milk Shake - Episodio 3', videoId: '5S_B9V7C7_a', duration: 16 },
      ],
      channelName: 'STRONGBERRY',
      channelUrl: 'https://www.youtube.com/@STRONGBERRYkr',
    },
    {
      title: 'Bed Friend',
      originalTitle: 'อย่าเล่นกับอนล',
      year: 2023,
      type: 'serie',
      country: 'Tailandia',
      countryCode: 'th',
      productionCompany: 'Mandee Work',
      synopsis:
        'Uea y King son dos colegas de trabajo con personalidades opuestas que trabajan en la misma oficina. Tras un encuentro imprevisto, acuerdan una relación de amigos con beneficios bajo estrictas reglas que no tardarán en romperse.',
      imageUrl: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=800&auto=format&fit=crop',
      catalogScope: 'PERSONAL',
      origin: 'CURATED',
      visibility: 'VISIBLE',
      genres: ['Romance', 'Drama', 'Oficina'],
      tags: ['Friends to Lovers', 'Oficina', 'Adulto', 'Química intensa'],
      episodes: [
        { episodeNumber: 1, title: 'Bed Friend - EP.1 [1/4]', videoId: '4R_A8U6B6_z', duration: 14 },
        { episodeNumber: 2, title: 'Bed Friend - EP.1 [2/4]', videoId: '3Q_Z7T5A5_y', duration: 15 },
        { episodeNumber: 3, title: 'Bed Friend - EP.1 [3/4]', videoId: '2P_Y6S4Z4_x', duration: 13 },
        { episodeNumber: 4, title: 'Bed Friend - EP.1 [4/4]', videoId: '1O_X5R3Y3_w', duration: 16 },
      ],
      channelName: 'Mandee Channel',
      channelUrl: 'https://www.youtube.com/@MandeeChannel',
    },
  ];

  for (const s of massiveSeries) {
    // 1. Asegurar país
    let countryRecord = await prisma.country.findFirst({
      where: { name: s.country },
    });
    if (!countryRecord) {
      countryRecord = await prisma.country.create({
        data: { name: s.country, code: s.countryCode },
      });
    }

    // 2. Asegurar productora
    let companyRecord = await prisma.productionCompany.findFirst({
      where: { name: s.productionCompany },
    });
    if (!companyRecord) {
      companyRecord = await prisma.productionCompany.create({
        data: { name: s.productionCompany, country: s.country },
      });
    }

    // 3. Buscar o crear serie
    let seriesRecord = await prisma.series.findFirst({
      where: { title: s.title },
    });

    if (!seriesRecord) {
      seriesRecord = await prisma.series.create({
        data: {
          title: s.title,
          originalTitle: s.originalTitle,
          year: s.year,
          type: s.type,
          countryId: countryRecord.id,
          productionCompanyId: companyRecord.id,
          synopsis: s.synopsis,
          imageUrl: s.imageUrl,
          catalogScope: s.catalogScope,
          origin: s.origin,
          visibility: s.visibility,
        },
      });
      console.log(`✅ Creada serie "${s.title}" (ID: ${seriesRecord.id})`);
    } else {
      console.log(`ℹ️ Serie "${s.title}" ya existía (ID: ${seriesRecord.id})`);
    }

    // 4. Asegurar Temporada 1
    let season = await prisma.season.findFirst({
      where: { seriesId: seriesRecord.id, seasonNumber: 1 },
    });
    if (!season) {
      season = await prisma.season.create({
        data: {
          seriesId: seriesRecord.id,
          seasonNumber: 1,
          episodeCount: s.episodes.length,
          year: s.year,
        },
      });
    }

    // 5. Cargar episodios
    for (const ep of s.episodes) {
      const existingEp = await prisma.episode.findFirst({
        where: { seasonId: season.id, episodeNumber: ep.episodeNumber },
      });

      const embedUrl = `https://www.youtube.com/watch?v=${ep.videoId}`;

      if (!existingEp) {
        await prisma.episode.create({
          data: {
            seasonId: season.id,
            episodeNumber: ep.episodeNumber,
            title: ep.title,
            duration: ep.duration,
            embedUrl,
            embedPlatform: 'YouTube',
            embedVideoId: ep.videoId,
            embedChannelName: s.channelName,
            embedChannelUrl: s.channelUrl,
          },
        });
      } else if (!existingEp.embedUrl) {
        await prisma.episode.update({
          where: { id: existingEp.id },
          data: {
            embedUrl,
            embedPlatform: 'YouTube',
            embedVideoId: ep.videoId,
            embedChannelName: s.channelName,
            embedChannelUrl: s.channelUrl,
            duration: ep.duration,
          },
        });
      }
    }
  }

  console.log('✨ Seed masivo completado exitosamente.');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed masivo:', e);
    process.exit(1);
  });
