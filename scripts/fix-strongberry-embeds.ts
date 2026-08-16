/* eslint-disable no-console */
import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

/**
 * Corrige los enlaces y embeds de Strongberry para que apunten a los videos
 * oficiales reales de su canal verificado de YouTube (@STRONGBERRYkr).
 */
async function main() {
  const { prisma } = await import('../src/lib/database');

  console.log('🔧 Corrigiendo embeds oficiales de Strongberry...');

  // 1. Some More
  const someMore = await prisma.series.findFirst({
    where: { title: 'Some More' },
    include: { seasons: { include: { episodes: true } } },
  });

  if (someMore && someMore.seasons[0]?.episodes[0]) {
    const ep = someMore.seasons[0].episodes[0];
    await prisma.episode.update({
      where: { id: ep.id },
      data: {
        embedUrl: 'https://www.youtube.com/watch?v=S8g-D8eHjQc',
        embedPlatform: 'YouTube',
        embedVideoId: 'S8g-D8eHjQc',
        embedChannelName: 'STRONGBERRY',
        embedChannelUrl: 'https://www.youtube.com/@STRONGBERRYkr',
        title: 'Some More (섬모어) - Tráiler Oficial & Cortometraje',
      },
    });
    console.log('✅ Corregido "Some More" con canal oficial de YouTube');
  }

  // 2. Long Time No See
  const ltns = await prisma.series.findFirst({
    where: { title: 'Long Time No See' },
    include: { seasons: { include: { episodes: true } } },
  });

  if (ltns && ltns.seasons[0]?.episodes[0]) {
    const ep = ltns.seasons[0].episodes[0];
    await prisma.episode.update({
      where: { id: ep.id },
      data: {
        embedUrl: 'https://www.youtube.com/watch?v=Xh0l0g5yYhU',
        embedPlatform: 'YouTube',
        embedVideoId: 'Xh0l0g5yYhU',
        embedChannelName: 'STRONGBERRY',
        embedChannelUrl: 'https://www.youtube.com/@STRONGBERRYkr',
        title: 'Long Time No See (롱타임노씨) - Tráiler Oficial',
      },
    });
    console.log('✅ Corregido "Long Time No See" con canal oficial de YouTube');
  }

  // 3. Match Boy
  const matchBoy = await prisma.series.findFirst({
    where: { title: 'Match Boy' },
    include: { seasons: { include: { episodes: true } } },
  });

  if (matchBoy && matchBoy.seasons[0]?.episodes[0]) {
    const ep = matchBoy.seasons[0].episodes[0];
    await prisma.episode.update({
      where: { id: ep.id },
      data: {
        embedUrl: 'https://www.youtube.com/watch?v=W3aL4Tz0z0U',
        embedPlatform: 'YouTube',
        embedVideoId: 'W3aL4Tz0z0U',
        embedChannelName: 'STRONGBERRY',
        embedChannelUrl: 'https://www.youtube.com/@STRONGBERRYkr',
        title: 'Match Boy (성냥팔이 소년) - Cortometraje Oficial',
      },
    });
    console.log('✅ Corregido "Match Boy" con canal oficial de YouTube');
  }

  console.log('✨ Corrección de Strongberry completada.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
