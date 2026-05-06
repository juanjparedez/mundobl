import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/database';

const BASE_URL = 'https://mundobl.com.ar';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${BASE_URL}/catalogo`,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/noticias`,
      changeFrequency: 'daily',
      priority: 0.85,
    },
    {
      url: `${BASE_URL}/novedades`,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/estadisticas`,
      changeFrequency: 'daily',
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/sitios`,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/feedback`,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ];

  const [series, actors, directors, tags, news] = await Promise.all([
    prisma.series.findMany({ select: { id: true, updatedAt: true } }),
    prisma.actor.findMany({ select: { id: true, updatedAt: true } }),
    prisma.director.findMany({ select: { id: true, updatedAt: true } }),
    prisma.tag.findMany({ select: { id: true, updatedAt: true } }),
    prisma.news.findMany({
      where: { status: 'PUBLISHED' },
      select: { id: true, updatedAt: true, publishedAt: true },
    }),
  ]);

  const seriesPages: MetadataRoute.Sitemap = series.map((serie) => ({
    url: `${BASE_URL}/series/${serie.id}`,
    lastModified: serie.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const actorPages: MetadataRoute.Sitemap = actors.map((actor) => ({
    url: `${BASE_URL}/actores/${actor.id}`,
    lastModified: actor.updatedAt,
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  const directorPages: MetadataRoute.Sitemap = directors.map((director) => ({
    url: `${BASE_URL}/directores/${director.id}`,
    lastModified: director.updatedAt,
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  const tagPages: MetadataRoute.Sitemap = tags.map((tag) => ({
    url: `${BASE_URL}/tags/${tag.id}`,
    lastModified: tag.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.5,
  }));

  const newsPages: MetadataRoute.Sitemap = news.map((n) => ({
    url: `${BASE_URL}/noticias/${n.id}`,
    lastModified: n.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  return [
    ...staticPages,
    ...seriesPages,
    ...newsPages,
    ...actorPages,
    ...directorPages,
    ...tagPages,
  ];
}
