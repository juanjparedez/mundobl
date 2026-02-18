import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const sitios = [
  // === STREAMING ===
  {
    name: 'Viki (Rakuten)',
    url: 'https://www.viki.com/',
    description: 'Dramas asiáticos BL con subtítulos en 200+ idiomas. Una de las mayores bibliotecas BL legales.',
    category: 'streaming',
    sortOrder: 1,
  },
  {
    name: 'GagaOOLala',
    url: 'https://www.gagaoolala.com/en/home',
    description: 'Plataforma streaming LGBTQ+ taiwanesa con 1,600+ títulos. La plataforma BL premier de Asia.',
    category: 'streaming',
    sortOrder: 2,
  },
  {
    name: 'iQIYI',
    url: 'https://www.iq.com/',
    description: 'BL tailandés y dangai chino, incluyendo versiones "Uncut".',
    category: 'streaming',
    sortOrder: 3,
  },
  {
    name: 'WeTV',
    url: 'https://wetv.vip/',
    description: 'BL tailandés, chino y taiwanés. Plataforma de Tencent Video internacional.',
    category: 'streaming',
    sortOrder: 4,
  },

  // === INFO / BASES DE DATOS ===
  {
    name: 'MyDramaList',
    url: 'https://mydramalist.com/',
    description: 'La base de datos de dramas asiáticos más completa. 31M+ visitas/mes. Fichas, cast, tags y listas de usuarios.',
    category: 'info',
    sortOrder: 1,
  },
  {
    name: 'World of BL',
    url: 'https://world-of-bl.com/',
    description: 'Directorio y calendario BL con listados por país, año y día. Ideal para seguir estrenos.',
    category: 'info',
    sortOrder: 2,
  },
  {
    name: 'BL Watcher',
    url: 'https://blwatcher.com/',
    description: 'Reseñas detalladas con puntuaciones separadas para historia, romance y actuación. Listas por año y país.',
    category: 'info',
    sortOrder: 3,
  },
  {
    name: 'BL Dramas',
    url: 'https://bldramas.com/',
    description: 'Base de datos BL dedicada organizada por país y año (2016-2026), con info de cast, música y adaptaciones.',
    category: 'info',
    sortOrder: 4,
  },
  {
    name: 'AniList',
    url: 'https://anilist.co/',
    description: 'Base de datos de anime/manga con 500K+ entradas. Filtrable por género Boys\' Love. API GraphQL pública.',
    category: 'info',
    sortOrder: 5,
  },

  // === NOTICIAS ===
  {
    name: 'BoysLoveTalk',
    url: 'https://www.boyslovetalk.com/',
    description: 'El primer newsletter sobre Boys Love en español. Cobertura de industria, estrenos, licencias y guías.',
    category: 'noticias',
    sortOrder: 1,
  },
  {
    name: 'Mundo Asia',
    url: 'https://mundoasia.es/',
    description: 'Portal de contenido asiático en español con sección BL activa. Noticias sobre productoras, estrenos y opiniones.',
    category: 'noticias',
    sortOrder: 2,
  },
  {
    name: 'BL Bliss',
    url: 'https://blbliss.com/',
    description: 'Reseñas, historia del género y glosario BL. Referencia editorial útil.',
    category: 'noticias',
    sortOrder: 3,
  },
  {
    name: 'Soompi',
    url: 'https://www.soompi.com/',
    description: 'Cubre BL regularmente dentro de su cobertura K-drama/K-pop. Noticias y rankings.',
    category: 'noticias',
    sortOrder: 4,
  },

  // === COMUNIDAD ===
  {
    name: 'r/boyslove (Reddit)',
    url: 'https://www.reddit.com/r/boyslove/',
    description: 'Comunidad general BL más activa en Reddit (~152K miembros). Discusiones, recomendaciones y noticias.',
    category: 'comunidad',
    sortOrder: 1,
  },
  {
    name: 'Hablemos de BL (Podcast)',
    url: 'https://www.ivoox.com/podcast-hablemos-bl_sq_f11228168_1.html',
    description: 'Podcast en español sobre BL con más de 64 episodios. Análisis y conversación sobre series y novedades.',
    category: 'comunidad',
    sortOrder: 2,
  },
  {
    name: 'El Rincón BL (Podcast)',
    url: 'https://www.ivoox.com/podcast-rincon-bl_sq_f11516428_1.html',
    description: 'Podcast en español con 34+ episodios. Reseñas y discusiones sobre series BL.',
    category: 'comunidad',
    sortOrder: 3,
  },
  {
    name: 'Bibimbap Dramas',
    url: 'https://bibimbapdramas.blogspot.com/',
    description: 'Blog en español dedicado a dramas asiáticos con cobertura significativa de BL tailandés y coreano.',
    category: 'comunidad',
    sortOrder: 4,
  },
  {
    name: 'Listado Manga',
    url: 'https://listadomanga.es/',
    description: 'Seguimiento de publicaciones manga en español. Fundamental para novedades y fechas de lanzamiento de editoriales BL.',
    category: 'comunidad',
    sortOrder: 5,
  },

  // === OTRO (Editoriales / Manga) ===
  {
    name: 'Milky Way Ediciones',
    url: 'https://www.milkywayediciones.com/collections/all/yaoi',
    description: 'Catálogo BL/Yaoi extenso. Editorial española especializada en manga con sección dedicada.',
    category: 'otro',
    sortOrder: 1,
  },
  {
    name: 'Editorial Ivrea Argentina',
    url: 'https://www.ivrea.com.ar/yaoi-bl/',
    description: 'Línea BL/Yaoi de la editorial argentina. Catálogo de manga BL disponible en la región.',
    category: 'otro',
    sortOrder: 2,
  },
  {
    name: 'Ediciones Tomodomo',
    url: 'https://www.ediciones-tomodomo.com/',
    description: 'Editorial española con títulos filtrables por Manga BL. Fuente primaria de licencias BL en español.',
    category: 'otro',
    sortOrder: 3,
  },
  {
    name: 'Lezhin Comics',
    url: 'https://www.lezhinus.com/',
    description: 'Plataforma #1 para BL manhwa. Títulos populares como Painter of the Night y Jinx.',
    category: 'otro',
    sortOrder: 4,
  },
  {
    name: 'MangaDex',
    url: 'https://mangadex.org/',
    description: 'Plataforma de manga con API pública. Filtrable por tag Boys\' Love. Comunidad de scanlation.',
    category: 'otro',
    sortOrder: 5,
  },
];

async function main() {
  console.log(`Insertando ${sitios.length} sitios de interés...`);

  for (const sitio of sitios) {
    const created = await prisma.recommendedSite.create({
      data: sitio,
    });
    console.log(`  OK [${sitio.category}] ${created.name}`);
  }

  console.log(`\nListo! ${sitios.length} sitios insertados.`);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
