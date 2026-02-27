import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/database';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://mundobl.win';

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/catalogo`,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/sitios`,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/feedback`,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ];

  const series = await prisma.series.findMany({
    select: { id: true, updatedAt: true },
  });

  const seriesPages: MetadataRoute.Sitemap = series.map((serie) => ({
    url: `${baseUrl}/series/${serie.id}`,
    lastModified: serie.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const actors = await prisma.actor.findMany({
    select: { id: true, updatedAt: true },
  });

  const actorPages: MetadataRoute.Sitemap = actors.map((actor) => ({
    url: `${baseUrl}/actores/${actor.id}`,
    lastModified: actor.updatedAt,
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  const directors = await prisma.director.findMany({
    select: { id: true, updatedAt: true },
  });

  const directorPages: MetadataRoute.Sitemap = directors.map((director) => ({
    url: `${baseUrl}/directores/${director.id}`,
    lastModified: director.updatedAt,
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  return [...staticPages, ...seriesPages, ...actorPages, ...directorPages];
}
