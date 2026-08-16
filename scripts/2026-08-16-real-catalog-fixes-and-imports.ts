/* eslint-disable no-console */
import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

/**
 * Sesion 2026-08-16: corrige 5 series de /ver que tenian embeds de YouTube
 * INVENTADOS (IDs de video que no existen, generados por sesiones previas de
 * IA sin verificar contra la API real) y agrega series nuevas verificadas
 * con la API real de YouTube (via buildImportPreview), tomadas de canales
 * oficiales confirmados (chequeados 1 a 1 via oEmbed cuando el dueño de la
 * playlist no coincidia con el canal real del video).
 *
 * Idempotente: se puede correr de nuevo sin duplicar (busca por titulo antes
 * de crear, y en los fixes borra los episodios previos del season 1 antes
 * de re-insertar los reales).
 *
 * Ejecucion:
 *   npx tsx scripts/2026-08-16-real-catalog-fixes-and-imports.ts
 */

interface EpisodeInput {
  episodeNumber: number;
  title: string | null;
  videoId: string;
  channelName: string;
  channelUrl: string;
}

async function ensureCountry(
  prisma: import('@prisma/client').PrismaClient,
  name: string,
  code: string
) {
  const existing = await prisma.country.findFirst({ where: { name } });
  if (existing) return existing;
  return prisma.country.create({ data: { name, code } });
}

async function ensureCompany(
  prisma: import('@prisma/client').PrismaClient,
  name: string,
  country: string
) {
  const existing = await prisma.productionCompany.findFirst({
    where: { name },
  });
  if (existing) return existing;
  return prisma.productionCompany.create({ data: { name, country } });
}

async function ensureGenres(
  prisma: import('@prisma/client').PrismaClient,
  seriesId: number,
  names: string[]
) {
  for (const name of names) {
    const genre = await prisma.genre.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    await prisma.seriesGenre.upsert({
      where: { seriesId_genreId: { seriesId, genreId: genre.id } },
      update: {},
      create: { seriesId, genreId: genre.id },
    });
  }
}

async function ensureTags(
  prisma: import('@prisma/client').PrismaClient,
  seriesId: number,
  names: string[]
) {
  for (const name of names) {
    const tag = await prisma.tag.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    await prisma.seriesTag.upsert({
      where: { seriesId_tagId: { seriesId, tagId: tag.id } },
      update: {},
      create: { seriesId, tagId: tag.id },
    });
  }
}

async function replaceSeasonOneEpisodes(
  prisma: import('@prisma/client').PrismaClient,
  seriesId: number,
  episodes: EpisodeInput[]
) {
  let season = await prisma.season.findFirst({
    where: { seriesId, seasonNumber: 1 },
  });
  if (!season) {
    season = await prisma.season.create({
      data: { seriesId, seasonNumber: 1, episodeCount: episodes.length },
    });
  } else {
    await prisma.episode.deleteMany({ where: { seasonId: season.id } });
    await prisma.season.update({
      where: { id: season.id },
      data: { episodeCount: episodes.length },
    });
  }

  await prisma.episode.createMany({
    data: episodes.map((ep) => ({
      seasonId: season!.id,
      episodeNumber: ep.episodeNumber,
      title: ep.title,
      embedUrl: `https://www.youtube.com/watch?v=${ep.videoId}`,
      embedPlatform: 'YouTube',
      embedVideoId: ep.videoId,
      embedChannelName: ep.channelName,
      embedChannelUrl: ep.channelUrl,
    })),
  });
}

async function importPlaylistAsNewSeries(opts: {
  prisma: import('@prisma/client').PrismaClient;
  buildImportPreview: typeof import('../src/lib/playlist-importer').buildImportPreview;
  title: string;
  playlistUrl: string;
  synopsis: string;
  year: number;
  countryName: string;
  countryCode: string;
  companyName: string;
  genres: string[];
  tags: string[];
  // Si la playlist no pertenece al canal oficial (curada por un fan que
  // reordena videos reales), forzar el nombre/url de canal real verificado
  // via oEmbed en vez de confiar en el "channelName" del dueño de la playlist.
  overrideChannel?: { name: string; url: string };
}) {
  const {
    prisma,
    buildImportPreview,
    title,
    playlistUrl,
    synopsis,
    year,
    countryName,
    countryCode,
    companyName,
    genres,
    tags,
    overrideChannel,
  } = opts;

  const already = await prisma.series.findFirst({
    where: { origin: 'CURATED', title: { equals: title, mode: 'insensitive' } },
  });
  if (already) {
    console.log(`ℹ️  "${title}" ya existe (ID: ${already.id}) — se omite.`);
    return;
  }

  const preview = await buildImportPreview({ url: playlistUrl, maxPages: 10 });
  const allEpisodes = preview.seasons.flatMap((s) => s.episodes);
  if (allEpisodes.length === 0) {
    console.log(`⚠️  "${title}": la playlist no devolvio videos, se omite.`);
    return;
  }

  const country = await ensureCountry(prisma, countryName, countryCode);
  const company = await ensureCompany(prisma, companyName, countryName);

  const series = await prisma.series.create({
    data: {
      title,
      synopsis,
      year,
      type: 'serie',
      catalogScope: 'WATCHABLE_ONLY',
      origin: 'CURATED',
      visibility: 'VISIBLE',
      countryId: country.id,
      productionCompanyId: company.id,
    },
  });

  const episodeInputs: EpisodeInput[] = allEpisodes.map((ep, idx) => ({
    episodeNumber: idx + 1,
    title: ep.rawTitle,
    videoId: ep.videoId,
    channelName: overrideChannel?.name ?? ep.embedChannelName,
    channelUrl: overrideChannel?.url ?? ep.embedChannelUrl,
  }));

  await replaceSeasonOneEpisodes(prisma, series.id, episodeInputs);
  await ensureGenres(prisma, series.id, genres);
  await ensureTags(prisma, series.id, tags);

  console.log(
    `✅ Creada "${title}" (ID: ${series.id}) con ${episodeInputs.length} videos reales de ${overrideChannel?.name ?? preview.source.channelName}.`
  );
}

async function main() {
  const { prisma } = await import('../src/lib/database');
  const { buildImportPreview } = await import('../src/lib/playlist-importer');

  console.log('== PARTE A: corrigiendo series con embeds inventados ==\n');

  // --- Bed Friend: reemplazar por videos reales del canal oficial Mandee ---
  {
    const series = await prisma.series.findFirst({ where: { title: 'Bed Friend' } });
    if (series) {
      const preview = await buildImportPreview({
        url: 'https://www.youtube.com/playlist?list=PL9Vw4vfeTUbsSFrg9cX8MNf7JTOuoqnLp',
        maxPages: 5,
      });
      const eps = preview.seasons.flatMap((s) => s.episodes);
      const episodeInputs: EpisodeInput[] = eps.map((ep, idx) => ({
        episodeNumber: idx + 1,
        title: ep.rawTitle,
        videoId: ep.videoId,
        // La playlist es curada por un fan channel; los videos son reales
        // del canal oficial Mandee Channel (verificado 1 a 1 via oEmbed).
        channelName: 'Mandee Channel',
        channelUrl: 'https://www.youtube.com/@MandeeWork',
      }));
      await replaceSeasonOneEpisodes(prisma, series.id, episodeInputs);
      console.log(`✅ "Bed Friend" (ID: ${series.id}) corregida con ${episodeInputs.length} videos reales de Mandee Channel.`);
    } else {
      console.log('⚠️  "Bed Friend" no encontrada en DB.');
    }
  }

  // --- Choco Milk Shake: reemplazar por videos reales de STRONGBERRY ---
  {
    const series = await prisma.series.findFirst({ where: { title: 'Choco Milk Shake' } });
    if (series) {
      const preview = await buildImportPreview({
        url: 'https://www.youtube.com/playlist?list=PLa6HxdVh8zgn9MhucgT28OmYXH_12NYi8',
        maxPages: 5,
      });
      const eps = preview.seasons.flatMap((s) => s.episodes);
      const episodeInputs: EpisodeInput[] = eps.map((ep, idx) => ({
        episodeNumber: idx + 1,
        title: ep.rawTitle,
        videoId: ep.videoId,
        channelName: 'STRONGBERRY',
        channelUrl: 'https://www.youtube.com/@StrongberryKr',
      }));
      await replaceSeasonOneEpisodes(prisma, series.id, episodeInputs);
      console.log(`✅ "Choco Milk Shake" (ID: ${series.id}) corregida con ${episodeInputs.length} videos reales de STRONGBERRY.`);
    } else {
      console.log('⚠️  "Choco Milk Shake" no encontrada en DB.');
    }
  }

  // --- Some More / Long Time No See: STRONGBERRY las vende como alquiler en
  // Vimeo On Demand, no hay episodio completo gratis. Reemplazamos el embed
  // inventado por el trailer oficial real (mejor un trailer real que un
  // link roto o un capitulo completo falso).
  {
    const fixes: { title: string; videoId: string; label: string }[] = [
      { title: 'Some More', videoId: 'k4v22UhlI88', label: 'Some More (Tráiler Oficial)' },
      { title: 'Long Time No See', videoId: 'TT1UfnlqNic', label: 'Long Time No See (Tráiler Oficial)' },
    ];
    for (const fix of fixes) {
      const series = await prisma.series.findFirst({ where: { title: fix.title } });
      if (!series) {
        console.log(`⚠️  "${fix.title}" no encontrada en DB.`);
        continue;
      }
      await replaceSeasonOneEpisodes(prisma, series.id, [
        {
          episodeNumber: 1,
          title: fix.label,
          videoId: fix.videoId,
          channelName: 'STRONGBERRY',
          channelUrl: 'https://www.youtube.com/@StrongberryKr',
        },
      ]);
      console.log(`✅ "${fix.title}" (ID: ${series.id}) corregida con el tráiler oficial real de STRONGBERRY.`);
    }
  }

  // --- Match Boy: no se encontro ningun titulo real de STRONGBERRY (ni en
  // su catalogo publico ni en busquedas) que corresponda a esta serie —
  // todo indica que el titulo fue inventado en una sesion anterior. Se borra
  // en vez de inventar un reemplazo.
  {
    const series = await prisma.series.findFirst({ where: { title: 'Match Boy' } });
    if (series) {
      await prisma.series.delete({ where: { id: series.id } });
      console.log(`🗑️  "Match Boy" (ID: ${series.id}) borrada — no se encontro evidencia de que sea un titulo real de STRONGBERRY.`);
    } else {
      console.log('ℹ️  "Match Boy" ya no existe en DB.');
    }
  }

  console.log('\n== PARTE B: agregando series nuevas verificadas ==\n');

  await importPlaylistAsNewSeries({
    prisma,
    buildImportPreview,
    title: 'SOTUS: The Series',
    playlistUrl: 'https://www.youtube.com/playlist?list=PLszepnkojZI5tID5gmStSvLef-eKcZxO-',
    synopsis:
      'Kongpob, un novato de primer año de Ingeniería, se enfrenta al riguroso sistema de "hazing" (SOTUS) liderado por Arthit, el temido líder de los mayores. Entre choques de poder y disciplina nace un romance inesperado que se extiende en la secuela SOTUS S.',
    year: 2016,
    countryName: 'Tailandia',
    countryCode: 'th',
    companyName: 'GMMTV',
    genres: ['Romance', 'Drama', 'Universitario', 'Comedia'],
    tags: ['Clásico BL', 'Sistema de hazing', 'Ingeniería'],
  });

  await importPlaylistAsNewSeries({
    prisma,
    buildImportPreview,
    title: 'The Eclipse',
    playlistUrl: 'https://www.youtube.com/playlist?list=PLszepnkojZI4cCpcFB24EWUXV6ZN0NTt7',
    synopsis:
      'En el prestigioso internado Sirisaeng, la fusión con otra institución desata una serie de sucesos sobrenaturales ligados a Akk, un estudiante con un pasado misterioso, y Ayan, quien queda atrapado en la trama entre poder, rebeldía y romance.',
    year: 2022,
    countryName: 'Tailandia',
    countryCode: 'th',
    companyName: 'GMMTV',
    genres: ['Romance', 'Drama', 'Misterio', 'Escolar'],
    tags: ['Internado', 'Sobrenatural', 'Enemies to Lovers'],
  });

  await importPlaylistAsNewSeries({
    prisma,
    buildImportPreview,
    title: 'Fish Upon the Sky',
    playlistUrl: 'https://www.youtube.com/playlist?list=PLszepnkojZI4rYdmvANDXm4Dx6_xi4Xfi',
    synopsis:
      'Mork idolatra en secreto al cantante Prom desde hace años. Un accidente que lo deja al cuidado del ídolo los obliga a convivir de cerca, revelando quién es realmente la persona detrás del escenario.',
    year: 2021,
    countryName: 'Tailandia',
    countryCode: 'th',
    companyName: 'GMMTV',
    genres: ['Romance', 'Comedia', 'Música', 'Drama'],
    tags: ['Idol', 'Fama', 'Fan secreto'],
  });

  await importPlaylistAsNewSeries({
    prisma,
    buildImportPreview,
    title: 'Only Friends',
    playlistUrl: 'https://www.youtube.com/playlist?list=PL9yvw9MtkKspLVrMvEwu3STybvRrPxQ7Q',
    synopsis:
      'Un grupo de amigos comparte una casa cerca de la playa, donde la amistad, los triángulos amorosos, el dinero y las traiciones se entrelazan a lo largo de una temporada marcada por la lealtad puesta a prueba.',
    year: 2023,
    countryName: 'Tailandia',
    countryCode: 'th',
    companyName: 'GMMTV',
    genres: ['Romance', 'Drama'],
    tags: ['Amigos', 'Triángulo amoroso', 'Adulto'],
    // Playlist curada por un fan channel; videos verificados 1 a 1 como
    // reales del canal oficial GMMTV.
    overrideChannel: { name: 'GMMTV OFFICIAL', url: 'https://www.youtube.com/@gmmtv' },
  });

  await importPlaylistAsNewSeries({
    prisma,
    buildImportPreview,
    title: 'Gameboys',
    playlistUrl: 'https://www.youtube.com/playlist?list=PLEr9FH7oPOQ60QPmaIbofYnS6OKR3H5g-',
    synopsis:
      'Cairo, un gamer profesional que transmite en vivo durante la cuarentena, conecta con Gav, un espectador que se convierte en algo más que un fan. La primera serie BL filipina producida por un estudio profesional.',
    year: 2020,
    countryName: 'Filipinas',
    countryCode: 'ph',
    companyName: 'The IdeaFirst Company',
    genres: ['Romance', 'Drama', 'Slice of Life'],
    tags: ['Gamer', 'Cuarentena', 'Filipinas', 'Pionero BL'],
  });

  await importPlaylistAsNewSeries({
    prisma,
    buildImportPreview,
    title: 'Kiseki: Dear to Me',
    playlistUrl: 'https://www.youtube.com/playlist?list=PLk2gvyPpHLRfpyBmdMhePR2ntRNk3GqGs',
    synopsis:
      'Yu Fan, un joven que aspira a ser médico, se cruza con Sang Yang, un miembro de una banda herido. Entre el destino y las segundas oportunidades, nace una historia de amor marcada por el pasado de ambos.',
    year: 2023,
    countryName: 'Taiwan',
    countryCode: 'tw',
    companyName: 'GTV DRAMA',
    genres: ['Romance', 'Drama'],
    tags: ['Taiwán', 'Segunda oportunidad', 'Slow burn'],
  });

  await importPlaylistAsNewSeries({
    prisma,
    buildImportPreview,
    title: "The Middleman's Love",
    playlistUrl: 'https://www.youtube.com/playlist?list=PLjbUWOU8c0yx1Yfqjg4tI5dFdQg-fcxM9',
    synopsis:
      'Jet trabaja como mediador profesional, resolviendo conflictos ajenos con frialdad, hasta que su propia vida amorosa se cruza con la de un cliente que lo obliga a replantearse todo lo que creía saber sobre el amor.',
    year: 2023,
    countryName: 'Tailandia',
    countryCode: 'th',
    companyName: 'Mandee Work',
    genres: ['Romance', 'Comedia', 'Drama'],
    tags: ['Oficina', 'Mediador', 'Slow burn'],
    overrideChannel: { name: 'Mandee Channel', url: 'https://www.youtube.com/@MandeeWork' },
  });

  console.log('\n✨ Listo.');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(() => process.exit(0));
