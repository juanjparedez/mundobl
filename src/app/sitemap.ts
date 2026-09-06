import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/database';
import { EXCLUDE_PLACEHOLDER_ACTOR } from '@/lib/placeholder-actor';
import {
  isIndexablePerson,
  isIndexableCompany,
} from '@/lib/person-completeness';
import { getSeriesUrl, getVerUrl } from '@/lib/slug';

export const revalidate = 3600;

const BASE_URL = 'https://mundobl.com.ar';

// Sitemap segmentado por dominio de contenido. Next.js genera
// automaticamente:
//   - /sitemap.xml      (sitemap-index)
//   - /sitemap/0.xml    (cada `id` de generateSitemaps)
//   - /sitemap/1.xml
//   - ...
//
// Beneficio: los crawlers pueden priorizar dominios distintos (catalogo
// vs noticias vs gente) y `lastmod` en cada subsitemap deja claro que
// rutas tuvieron cambios recientes — acelera el re-crawl de lo que cambia.
//
// IDs:
//   0 = static    (paginas fijas: home, /catalogo, /noticias, etc.)
//   1 = series    (/series/[id])
//   2 = noticias  (/noticias/[id])  — solo PUBLISHED
//   3 = ver       (/ver/[id])       — series con embedUrl
//   4 = actores   (/actores/[id])
//   5 = directores (/directores/[id])
//   6 = tags      (/tags/[id])
//   7 = productoras (/productoras/[id])

type SitemapId = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export async function generateSitemaps(): Promise<{ id: SitemapId }[]> {
  return [
    { id: 0 },
    { id: 1 },
    { id: 2 },
    { id: 3 },
    { id: 4 },
    { id: 5 },
    { id: 6 },
    { id: 7 },
  ];
}

export default async function sitemap({
  id,
}: {
  id: SitemapId | Promise<SitemapId>;
}): Promise<MetadataRoute.Sitemap> {
  // Next entrega el `id` del shard como STRING en runtime, aunque el tipo diga
  // number. Con `switch (id)` (comparacion estricta) '0' nunca matcheaba
  // `case 0` y TODOS los shards caian en `default: []` — el sitemap entero se
  // servia vacio, incluido el de paginas estaticas, que ni siquiera toca la DB.
  // `id` llega como Promise en Next 16 (los params de rutas de metadata se
  // volvieron asincronos). El codigo lo usaba directo en un `switch`, asi que
  // ningun `case` matcheaba y TODOS los shards devolvian [] — el sitemap
  // entero se servia vacio, incluido el de paginas estaticas, que ni siquiera
  // consulta la base. Por eso hay que await-earlo antes de comparar.
  const shard = Number(await id) as SitemapId;
  switch (shard) {
    case 0:
      return staticPages();
    case 1:
      return seriesPages();
    case 2:
      return noticiasPages();
    case 3:
      return verPages();
    case 4:
      return actoresPages();
    case 5:
      return directoresPages();
    case 6:
      return tagsPages();
    case 7:
      return productorasPages();
    default:
      return [];
  }
}

function staticPages(): MetadataRoute.Sitemap {
  return [
    { url: BASE_URL, changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE_URL}/catalogo`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/ver`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/actores`, changeFrequency: 'weekly', priority: 0.7 },
    {
      url: `${BASE_URL}/directores`,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/productoras`,
      changeFrequency: 'weekly',
      priority: 0.65,
    },
    { url: `${BASE_URL}/noticias`, changeFrequency: 'daily', priority: 0.85 },
    { url: `${BASE_URL}/novedades`, changeFrequency: 'daily', priority: 0.8 },
    {
      url: `${BASE_URL}/estadisticas`,
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    // Contenido informacional. Son las paginas de long-tail (busquedas del
    // tipo "que significa seme", "donde ver BL tailandes") y estaban fuera
    // del sitemap aunque robots.ts las deja crawlear: existian, se podian
    // indexar, pero nunca se le ofrecieron a Google.
    { url: `${BASE_URL}/glosario`, changeFrequency: 'weekly', priority: 0.7 },
    {
      url: `${BASE_URL}/plataformas`,
      changeFrequency: 'weekly',
      priority: 0.65,
    },
    { url: `${BASE_URL}/contenido`, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${BASE_URL}/sitios`, changeFrequency: 'monthly', priority: 0.5 },
    {
      url: `${BASE_URL}/privacidad`,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    { url: `${BASE_URL}/creditos`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE_URL}/legal`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/feedback`, changeFrequency: 'monthly', priority: 0.3 },
  ];
}

async function seriesPages(): Promise<MetadataRoute.Sitemap> {
  const series = await prisma.series.findMany({
    where: { catalogScope: 'PERSONAL', origin: 'CURATED' },
    select: { id: true, title: true, updatedAt: true },
  });
  return series.map((s) => ({
    url: `${BASE_URL}${getSeriesUrl(s.id, s.title)}`,
    lastModified: s.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));
}

async function noticiasPages(): Promise<MetadataRoute.Sitemap> {
  const news = await prisma.news.findMany({
    where: { status: 'PUBLISHED' },
    select: { id: true, updatedAt: true },
  });
  return news.map((n) => ({
    url: `${BASE_URL}/noticias/${n.id}`,
    lastModified: n.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));
}

// Series mirables: las que tienen al menos un episodio con embedUrl.
// Incluye CURATED (PERSONAL+WATCHABLE_ONLY) y USER_EMBED si visibility=VISIBLE.
async function verPages(): Promise<MetadataRoute.Sitemap> {
  const series = await prisma.series.findMany({
    where: {
      visibility: 'VISIBLE',
      seasons: {
        some: { episodes: { some: { embedUrl: { not: null } } } },
      },
    },
    select: { id: true, title: true, updatedAt: true },
  });
  return series.map((s) => ({
    url: `${BASE_URL}${getVerUrl(s.id, s.title)}`,
    lastModified: s.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.75,
  }));
}

// Solo se publican las fichas que superan el umbral de calidad de
// `person-completeness`: aportan algo propio (foto o biografia) o su
// filmografia ya es util (2+ creditos). Hoy el 100% de actores y directores no
// tiene foto ni bio, asi que antes se ofrecian ~1500 fichas practicamente
// vacias — thin content, que Google penaliza a nivel dominio y no solo por
// pagina. Las que quedan afuera siguen navegables desde /actores y linkeadas
// internamente; entran solas al poblarse.
async function actoresPages(): Promise<MetadataRoute.Sitemap> {
  const actors = await prisma.actor.findMany({
    where: EXCLUDE_PLACEHOLDER_ACTOR,
    select: {
      id: true,
      updatedAt: true,
      imageUrl: true,
      biography: true,
      _count: {
        select: {
          series: {
            where: {
              series: { origin: 'CURATED', catalogScope: 'PERSONAL' },
            },
          },
          seasons: {
            where: {
              season: {
                series: { origin: 'CURATED', catalogScope: 'PERSONAL' },
              },
            },
          },
        },
      },
    },
  });
  return actors
    .filter((a) =>
      isIndexablePerson({
        imageUrl: a.imageUrl,
        biography: a.biography,
        creditCount: a._count.series + a._count.seasons,
      })
    )
    .map((a) => ({
      url: `${BASE_URL}/actores/${a.id}`,
      lastModified: a.updatedAt,
      changeFrequency: 'monthly',
      priority: 0.6,
    }));
}

async function directoresPages(): Promise<MetadataRoute.Sitemap> {
  const directors = await prisma.director.findMany({
    select: {
      id: true,
      updatedAt: true,
      imageUrl: true,
      biography: true,
      _count: {
        select: {
          series: {
            where: {
              series: { origin: 'CURATED', catalogScope: 'PERSONAL' },
            },
          },
        },
      },
    },
  });
  return directors
    .filter((d) =>
      isIndexablePerson({
        imageUrl: d.imageUrl,
        biography: d.biography,
        creditCount: d._count.series,
      })
    )
    .map((d) => ({
      url: `${BASE_URL}/directores/${d.id}`,
      lastModified: d.updatedAt,
      changeFrequency: 'monthly',
      priority: 0.6,
    }));
}

/** Productoras: mismo umbral de calidad que personas. */
async function productorasPages(): Promise<MetadataRoute.Sitemap> {
  const companies = await prisma.productionCompany.findMany({
    select: {
      id: true,
      updatedAt: true,
      imageUrl: true,
      description: true,
      _count: {
        select: {
          seriesLinks: {
            where: {
              series: { origin: 'CURATED', catalogScope: 'PERSONAL' },
            },
          },
        },
      },
    },
  });
  return companies
    .filter((c) =>
      isIndexableCompany({
        imageUrl: c.imageUrl,
        description: c.description,
        seriesCount: c._count.seriesLinks,
      })
    )
    .map((c) => ({
      url: `${BASE_URL}/productoras/${c.id}`,
      lastModified: c.updatedAt,
      changeFrequency: 'monthly',
      priority: 0.55,
    }));
}

async function tagsPages(): Promise<MetadataRoute.Sitemap> {
  const tags = await prisma.tag.findMany({
    select: { id: true, updatedAt: true },
  });
  return tags.map((t) => ({
    url: `${BASE_URL}/tags/${t.id}`,
    lastModified: t.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.5,
  }));
}
