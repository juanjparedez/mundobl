import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/database';

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

type SitemapId = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export async function generateSitemaps(): Promise<{ id: SitemapId }[]> {
  return [
    { id: 0 },
    { id: 1 },
    { id: 2 },
    { id: 3 },
    { id: 4 },
    { id: 5 },
    { id: 6 },
  ];
}

export default async function sitemap({
  id,
}: {
  id: SitemapId;
}): Promise<MetadataRoute.Sitemap> {
  switch (id) {
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
    default:
      return [];
  }
}

function staticPages(): MetadataRoute.Sitemap {
  return [
    { url: BASE_URL, changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE_URL}/catalogo`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/ver`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/noticias`, changeFrequency: 'daily', priority: 0.85 },
    { url: `${BASE_URL}/novedades`, changeFrequency: 'daily', priority: 0.8 },
    {
      url: `${BASE_URL}/estadisticas`,
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    { url: `${BASE_URL}/sitios`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/creditos`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE_URL}/legal`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/feedback`, changeFrequency: 'monthly', priority: 0.3 },
  ];
}

async function seriesPages(): Promise<MetadataRoute.Sitemap> {
  const series = await prisma.series.findMany({
    where: { catalogScope: 'PERSONAL', origin: 'CURATED' },
    select: { id: true, updatedAt: true },
  });
  return series.map((s) => ({
    url: `${BASE_URL}/series/${s.id}`,
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
    select: { id: true, updatedAt: true },
  });
  return series.map((s) => ({
    url: `${BASE_URL}/ver/${s.id}`,
    lastModified: s.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.75,
  }));
}

async function actoresPages(): Promise<MetadataRoute.Sitemap> {
  const actors = await prisma.actor.findMany({
    select: { id: true, updatedAt: true },
  });
  return actors.map((a) => ({
    url: `${BASE_URL}/actores/${a.id}`,
    lastModified: a.updatedAt,
    changeFrequency: 'monthly',
    priority: 0.6,
  }));
}

async function directoresPages(): Promise<MetadataRoute.Sitemap> {
  const directors = await prisma.director.findMany({
    select: { id: true, updatedAt: true },
  });
  return directors.map((d) => ({
    url: `${BASE_URL}/directores/${d.id}`,
    lastModified: d.updatedAt,
    changeFrequency: 'monthly',
    priority: 0.6,
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
