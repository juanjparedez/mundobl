import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Step 1: Update existing sites with language info
const languageUpdates: Record<string, string> = {
  'Viki (Rakuten)': 'Multi',
  'GagaOOLala': 'Multi',
  'iQIYI': 'Multi',
  'WeTV': 'Multi',
  'MyDramaList': 'EN',
  'World of BL': 'EN',
  'BL Watcher': 'EN',
  'BL Dramas': 'EN',
  'AniList': 'EN',
  'BoysLoveTalk': 'ES',
  'Mundo Asia': 'ES',
  'BL Bliss': 'EN',
  'Soompi': 'EN',
  'r/boyslove (Reddit)': 'EN',
  'Hablemos de BL (Podcast)': 'ES',
  'El Rincón BL (Podcast)': 'ES',
  'Bibimbap Dramas': 'ES',
  'Listado Manga': 'ES',
  'Milky Way Ediciones': 'ES',
  'Editorial Ivrea Argentina': 'ES',
  'Ediciones Tomodomo': 'ES',
  'Lezhin Comics': 'Multi',
  'MangaDex': 'Multi',
};

// Step 2: All new sites to add
const nuevosSitios = [
  // === STREAMING ===
  {
    name: 'Crunchyroll',
    url: 'https://www.crunchyroll.com/',
    description: 'Mayor plataforma legal de anime BL. Given, Sasaki and Miyano, Cherry Magic!, Twilight Out of Focus y más.',
    category: 'streaming',
    language: 'Multi',
    sortOrder: 5,
  },
  {
    name: 'Netflix',
    url: 'https://www.netflix.com/',
    description: 'Series BL selectas: Heartstopper, The Untamed, Young Royals. Licencias puntuales de BL asiático.',
    category: 'streaming',
    language: 'Multi',
    sortOrder: 6,
  },
  {
    name: 'Bilibili',
    url: 'https://www.bilibili.com/',
    description: 'Plataforma china con adaptaciones dangai como The Untamed y Word of Honor. Permite embed vía player propio.',
    category: 'streaming',
    language: 'ZH',
    sortOrder: 7,
  },
  {
    name: 'Viu',
    url: 'https://www.viu.com/',
    description: 'Series BL tailandesas con versiones Uncut. Clips y avances promocionales disponibles.',
    category: 'streaming',
    language: 'Multi',
    sortOrder: 8,
  },
  {
    name: 'GMMTV (YouTube)',
    url: 'https://www.youtube.com/@GMMTV',
    description: 'Canal oficial de la productora BL más grande. 20M+ suscriptores. Episodios completos gratis con subs en inglés.',
    category: 'streaming',
    language: 'TH',
    sortOrder: 9,
  },
  {
    name: 'Be On Cloud (YouTube)',
    url: 'https://www.youtube.com/@beoncloudofficial',
    description: 'Productora de KinnPorsche y Dead Friend Forever. 1M+ suscriptores. Contenido oficial gratuito.',
    category: 'streaming',
    language: 'TH',
    sortOrder: 10,
  },
  {
    name: 'Studio Wabi Sabi (YouTube)',
    url: 'https://www.youtube.com/c/studiowabisabi',
    description: 'Productora de Love By Chance y Until We Meet Again. 2.67M suscriptores.',
    category: 'streaming',
    language: 'TH',
    sortOrder: 11,
  },
  {
    name: 'Mandee Channel (YouTube)',
    url: 'https://www.youtube.com/channel/UC_HtEPrXQYKJ9Pihwg0u1Rw',
    description: 'Canal oficial con series como Pit Babe y My Stand-In. 2.94M suscriptores.',
    category: 'streaming',
    language: 'TH',
    sortOrder: 12,
  },
  {
    name: 'Domundi TV (YouTube)',
    url: 'https://www.youtube.com/@DomundiBoys',
    description: 'Productora de Why R U?, Cutie Pie y Bed Friend. Contenido BL oficial.',
    category: 'streaming',
    language: 'TH',
    sortOrder: 13,
  },
  {
    name: 'Idol Factory (YouTube)',
    url: 'https://www.youtube.com/@IDOLFACTORYOFFICIAL',
    description: 'Productora de The Sign y GAP The Series. Calidad técnica destacada.',
    category: 'streaming',
    language: 'TH',
    sortOrder: 14,
  },
  {
    name: 'Dee Hup House (YouTube)',
    url: 'https://www.youtube.com/@DeeHupHouse',
    description: 'Productora de Manner of Death y Not Me. Contenido BL tailandés.',
    category: 'streaming',
    language: 'TH',
    sortOrder: 15,
  },
  {
    name: 'Star Hunter (YouTube)',
    url: 'https://www.youtube.com/@StarHunterStudio',
    description: 'Estudio tailandés de BL con contenido oficial en YouTube.',
    category: 'streaming',
    language: 'TH',
    sortOrder: 16,
  },
  {
    name: 'The IdeaFirst Company (YouTube)',
    url: 'https://www.youtube.com/@TheIdeaFirstCompany',
    description: 'Productora filipina de Gameboys (nominado International Emmy). Primer BL filipino.',
    category: 'streaming',
    language: 'EN',
    sortOrder: 17,
  },
  {
    name: 'Strongberry (YouTube)',
    url: 'https://www.youtube.com/@Strongberry',
    description: 'Pionero del K-BL. Where Your Eyes Linger, Color Rush y Choco Milk Shake.',
    category: 'streaming',
    language: 'KR',
    sortOrder: 18,
  },
  {
    name: 'iWantTFC',
    url: 'https://www.iwanttfc.com/',
    description: 'BL tailandés y coreano para audiencia filipina. Distribución de contenido GMMTV.',
    category: 'streaming',
    language: 'Multi',
    sortOrder: 19,
  },

  // === INFO / BASES DE DATOS ===
  {
    name: 'Absolute BL',
    url: 'https://absolutebl.tumblr.com/',
    description: 'Considerada la autoridad en la comunidad BL anglófona. Sistema de ratings detallado y análisis de tropos.',
    category: 'info',
    language: 'EN',
    sortOrder: 6,
  },
  {
    name: 'Boys Love Factory',
    url: 'https://boyslovefactory.com/',
    description: 'Directorio y agregador de contenido BL. Taxonomía útil como referencia.',
    category: 'info',
    language: 'EN',
    sortOrder: 7,
  },
  {
    name: 'Yaoi Wiki',
    url: 'https://yaoi.fandom.com/es/wiki/Yaoi_Wiki',
    description: 'Wiki en español con glosario y vocabulario del fandom BL. Útil para entender terminología.',
    category: 'info',
    language: 'ES',
    sortOrder: 8,
  },
  {
    name: 'NovelUpdates',
    url: 'https://www.novelupdates.com/',
    description: 'Índice de referencia para traducciones de novelas asiáticas. Tags BL/Yaoi cubren novelas danmei. Feeds RSS.',
    category: 'info',
    language: 'EN',
    sortOrder: 9,
  },
  {
    name: 'VNDB',
    url: 'https://vndb.org/',
    description: 'Base de datos de visual novels con tag BL. API pública disponible.',
    category: 'info',
    language: 'EN',
    sortOrder: 10,
  },
  {
    name: 'MangaUpdates',
    url: 'https://www.mangaupdates.com/',
    description: 'Base de datos de manga con géneros Yaoi/Shounen Ai. API REST pública.',
    category: 'info',
    language: 'EN',
    sortOrder: 11,
  },
  {
    name: 'Kitsu',
    url: 'https://kitsu.io/',
    description: 'Base de datos de anime/manga con filtro boys-love. API REST pública y comunidad activa.',
    category: 'info',
    language: 'EN',
    sortOrder: 12,
  },
  {
    name: 'TMDB',
    url: 'https://www.themoviedb.org/',
    description: 'Base de datos de películas y series con keyword "boys love". API gratuita para desarrolladores.',
    category: 'info',
    language: 'Multi',
    sortOrder: 13,
  },

  // === NOTICIAS ===
  {
    name: 'Koreaboo',
    url: 'https://www.koreaboo.com/',
    description: 'Noticias K-drama/K-pop con rankings y cobertura de series BL coreanas.',
    category: 'noticias',
    language: 'EN',
    sortOrder: 5,
  },
  {
    name: 'The BL Xpress',
    url: 'https://the-bl-xpress.com/',
    description: 'Noticias y reviews de BL adaptados de CafeBL. Cobertura de estrenos y reseñas.',
    category: 'noticias',
    language: 'EN',
    sortOrder: 6,
  },
  {
    name: 'BoysLove Insider',
    url: 'https://boysloveinsider.com/',
    description: 'Primera plataforma de medios en inglés dedicada a noticias BL diarias. Fundada en marzo 2025.',
    category: 'noticias',
    language: 'EN',
    sortOrder: 7,
  },
  {
    name: 'Subtitle Dreams',
    url: 'https://subtitledreams.com/',
    description: 'Reviews BL en profundidad desde 2018. Análisis detallados de series asiáticas.',
    category: 'noticias',
    language: 'EN',
    sortOrder: 8,
  },
  {
    name: 'Pop Journal',
    url: 'https://popjournalofficial.com/',
    description: 'Cobertura de BL con enfoque filipino. Noticias, reviews y entrevistas.',
    category: 'noticias',
    language: 'EN',
    sortOrder: 9,
  },
  {
    name: 'CafeBL',
    url: 'https://cafebl.com/',
    description: 'Portal de noticias BL en indonesio. Cobertura de BL tailandés y asiático.',
    category: 'noticias',
    language: 'ID',
    sortOrder: 10,
  },
  {
    name: 'BLTai',
    url: 'https://bltai.com/',
    description: 'Noticias y cobertura de contenido BL tailandés.',
    category: 'noticias',
    language: 'TH',
    sortOrder: 11,
  },
  {
    name: 'BLUPDATE',
    url: 'https://twitter.com/BLUPDATE2022',
    description: 'Distribución de noticias BL vía Twitter/X. Actualizaciones diarias del género.',
    category: 'noticias',
    language: 'EN',
    sortOrder: 12,
  },

  // === COMUNIDAD ===
  {
    name: 'r/yaoi (Reddit)',
    url: 'https://www.reddit.com/r/yaoi/',
    description: 'Comunidad Reddit de manga/anime BL. 100K+ miembros. Recomendaciones y discusiones.',
    category: 'comunidad',
    language: 'EN',
    sortOrder: 6,
  },
  {
    name: 'r/danmei (Reddit)',
    url: 'https://www.reddit.com/r/danmei/',
    description: 'Comunidad Reddit de novelas chinas BL (danmei). Traducciones, recomendaciones y discusiones.',
    category: 'comunidad',
    language: 'EN',
    sortOrder: 7,
  },
  {
    name: 'r/ThaiBL (Reddit)',
    url: 'https://www.reddit.com/r/ThaiBL/',
    description: 'Comunidad Reddit especializada en dramas BL tailandeses. Discusiones de episodios y recomendaciones.',
    category: 'comunidad',
    language: 'EN',
    sortOrder: 8,
  },
  {
    name: 'Fujoshi Senpai (Podcast)',
    url: 'https://www.spreaker.com/podcast/fujoshi-senpai-boys-love-yaoi-shojo--4601507',
    description: 'Podcast en español. Recomendaciones de mangas, manhwas, novelas y series BL.',
    category: 'comunidad',
    language: 'ES',
    sortOrder: 9,
  },
  {
    name: 'Boys Love Boys Love (Podcast)',
    url: 'https://podcasts.apple.com/podcast/boys-love-boys-love/id1234567890',
    description: 'Podcast en inglés con 277 episodios (2023-2025). Recaps semanales de BL.',
    category: 'comunidad',
    language: 'EN',
    sortOrder: 10,
  },
  {
    name: 'LoveCast The BL Podcast',
    url: 'https://open.spotify.com/show/14fmUcNC9zHxXPdYhHmjFR',
    description: 'Podcast en Spotify. Entrevistas con actores y creadores de BL.',
    category: 'comunidad',
    language: 'EN',
    sortOrder: 11,
  },
  {
    name: 'Mis Novelicas',
    url: 'https://misnovelicasblog.wordpress.com/',
    description: 'Blog desde España con extensas reseñas y críticas de K-dramas y series BL.',
    category: 'comunidad',
    language: 'ES',
    sortOrder: 12,
  },
  {
    name: 'Fujoshi Video Blog',
    url: 'https://www.youtube.com/@fujoshivideoblog',
    description: 'Video reseñas y unboxing de manga/manhwa BL en español. Tutoriales sobre plataformas legales.',
    category: 'comunidad',
    language: 'ES',
    sortOrder: 13,
  },
  {
    name: 'Archive of Our Own (AO3)',
    url: 'https://archiveofourown.org/',
    description: 'El repositorio más grande de fan fiction M/M. Gratuito, sin ánimo de lucro. Feeds Atom disponibles.',
    category: 'comunidad',
    language: 'Multi',
    sortOrder: 14,
  },
  {
    name: 'Pi Fansub',
    url: 'https://pifansubs.club/',
    description: 'Mayor comunidad de fansub BL en portugués. Brasil es un mercado BL enorme.',
    category: 'comunidad',
    language: 'PT',
    sortOrder: 15,
  },
  {
    name: 'Meow Fansub',
    url: 'https://meowbls.com/',
    description: 'Comunidad de fansub BL en portugués brasileño. Subtítulos de series BL asiáticas.',
    category: 'comunidad',
    language: 'PT',
    sortOrder: 16,
  },
  {
    name: 'manga_abierto (LiveJournal)',
    url: 'https://manga-abierto.livejournal.com/tag/yaoi',
    description: 'Archivo histórico de reseñas BL en español. Referencia de taxonomía y tono editorial.',
    category: 'comunidad',
    language: 'ES',
    sortOrder: 17,
  },

  // === OTRO (Editoriales / Manga / Novelas / Lecturas) ===
  {
    name: 'Panini España (BL)',
    url: 'https://www.panini.es/shp_esp_es/comics/manga/bl.html',
    description: 'Sección BL/Yaoi de la editorial Panini en España. Catálogo de manga y guías de compra.',
    category: 'otro',
    language: 'ES',
    sortOrder: 6,
  },
  {
    name: 'Manta',
    url: 'https://manta.net/',
    description: 'Catálogo BL fuerte: Semantic Error, Love Jinx, No Love Zone. Suscripción $4.99/mes lectura ilimitada.',
    category: 'otro',
    language: 'EN',
    sortOrder: 7,
  },
  {
    name: 'Tappytoon',
    url: 'https://www.tappytoon.com/',
    description: 'Manhwa BL popular: Cherry Blossoms After Winter, DEAR. DOOR. Primeros 5 episodios gratis. 241+ países.',
    category: 'otro',
    language: 'EN',
    sortOrder: 8,
  },
  {
    name: 'Tapas',
    url: 'https://tapas.io/',
    description: 'Plataforma de webtoons con sistema "Wait Until Free". Contenido BL disponible.',
    category: 'otro',
    language: 'EN',
    sortOrder: 9,
  },
  {
    name: 'Renta!',
    url: 'https://www.ebookrenta.com/',
    description: 'Yaoi manga licenciado con sistema de alquiler (48h) o compra. Catálogo extenso de publishers japoneses.',
    category: 'otro',
    language: 'EN',
    sortOrder: 10,
  },
  {
    name: 'WEBTOON',
    url: 'https://www.webtoons.com/',
    description: 'Webtoons BL en Canvas y Originals (Heartstopper). Una de las mayores plataformas de cómics digitales.',
    category: 'otro',
    language: 'Multi',
    sortOrder: 11,
  },
  {
    name: 'Coolmic',
    url: 'https://coolmic.me/',
    description: 'Manga BL de ComicFesta/WWWave. Distribución digital de manga japonés para adultos.',
    category: 'otro',
    language: 'EN',
    sortOrder: 12,
  },
  {
    name: 'JJWXC (晋江文学城)',
    url: 'https://www.jjwxc.net/',
    description: 'Plataforma más importante del mundo para novelas danmei/BL. Fuente original de MDZS, TGCF, 2HA. 7M+ usuarios.',
    category: 'otro',
    language: 'ZH',
    sortOrder: 13,
  },
  {
    name: 'Wattpad',
    url: 'https://www.wattpad.com/',
    description: 'Comunidad BL masiva con 90M+ usuarios. Muchas novelas BL publicadas empezaron aquí.',
    category: 'otro',
    language: 'Multi',
    sortOrder: 14,
  },
  {
    name: 'Seven Seas Entertainment',
    url: 'https://sevenseasentertainment.com/',
    description: 'Editorial líder en traducción oficial de novelas danmei y manga BL al inglés.',
    category: 'otro',
    language: 'EN',
    sortOrder: 15,
  },
  {
    name: 'MangaToon',
    url: 'https://mangatoon.mobi/',
    description: 'Plataforma de webtoons y manga con sección BL activa. Interfaz amigable y episodios gratuitos semanales.',
    category: 'otro',
    language: 'Multi',
    sortOrder: 16,
  },
  {
    name: 'Me Mind Y',
    url: 'https://memindy.com/',
    description: 'Productora tailandesa de TharnType y Love in The Air. Adaptaciones de novelas BL exitosas.',
    category: 'otro',
    language: 'TH',
    sortOrder: 17,
  },
];

async function main() {
  // Step 1: Update existing sites with language
  console.log('=== Actualizando idioma en sitios existentes ===');
  for (const [name, language] of Object.entries(languageUpdates)) {
    const updated = await prisma.recommendedSite.updateMany({
      where: { name },
      data: { language },
    });
    if (updated.count > 0) {
      console.log(`  OK [${language}] ${name}`);
    } else {
      console.log(`  SKIP (no encontrado) ${name}`);
    }
  }

  // Step 2: Insert new sites (skip if URL already exists)
  console.log(`\n=== Insertando ${nuevosSitios.length} sitios nuevos ===`);
  let inserted = 0;
  let skipped = 0;

  for (const sitio of nuevosSitios) {
    const existing = await prisma.recommendedSite.findFirst({
      where: { url: sitio.url },
    });
    if (existing) {
      console.log(`  SKIP (ya existe) ${sitio.name}`);
      skipped++;
      continue;
    }

    await prisma.recommendedSite.create({ data: sitio });
    console.log(`  OK [${sitio.category}] ${sitio.name}`);
    inserted++;
  }

  console.log(`\nResumen: ${inserted} insertados, ${skipped} omitidos (ya existían).`);
  console.log(`Total actualizado con idioma: ${Object.keys(languageUpdates).length}`);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
