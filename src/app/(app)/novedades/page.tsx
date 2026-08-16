import type { Metadata } from 'next';
import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/database';
import { getAutoThumbnailUrl, type Platform } from '@/lib/embed-helpers';
import { NovedadesClient } from './NovedadesClient';
import './novedades.css';

export const revalidate = 600;

export const metadata: Metadata = {
  title: 'Novedades',
  description:
    'Series recién agregadas, nuevas temporadas y cambios recientes en MundoBL.',
  alternates: { canonical: '/novedades' },
};

const RECENT_DAYS = 30;

const getNovedadesData = unstable_cache(
  async () => {
    const since = new Date(Date.now() - RECENT_DAYS * 24 * 60 * 60 * 1000);

    const [newSeries, newSeasons, watchableSeries] = await Promise.all([
      prisma.series.findMany({
        where: { createdAt: { gte: since }, origin: 'CURATED' },
        orderBy: { createdAt: 'desc' },
        take: 24,
        select: {
          id: true,
          title: true,
          imageUrl: true,
          imagePosition: true,
          year: true,
          type: true,
          createdAt: true,
          country: { select: { name: true, code: true } },
        },
      }),
      prisma.season.findMany({
        where: {
          createdAt: { gte: since },
          series: { origin: 'CURATED' },
        },
        orderBy: { createdAt: 'desc' },
        take: 24,
        select: {
          id: true,
          seasonNumber: true,
          createdAt: true,
          series: {
            select: {
              id: true,
              title: true,
              imageUrl: true,
              type: true,
            },
          },
        },
      }),
      // Series watchable: series con al menos un episodio con embedUrl.
      // Para el carousel "Series completas para ver" (item 17 fine_tunning_1).
      prisma.series.findMany({
        where: {
          visibility: 'VISIBLE',
          seasons: {
            some: { episodes: { some: { embedUrl: { not: null } } } },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 12,
        select: {
          id: true,
          title: true,
          imageUrl: true,
          imagePosition: true,
          year: true,
          type: true,
          country: { select: { name: true, code: true } },
          seasons: {
            select: {
              episodes: {
                where: { embedUrl: { not: null } },
                select: { embedPlatform: true, embedUrl: true },
                take: 1,
              },
            },
          },
        },
      }),
    ]);

    const formattedWatchable = watchableSeries.map((s) => {
      let imageUrl = s.imageUrl;
      if (!imageUrl) {
        const firstWithEmbed = s.seasons
          .flatMap((season) => season.episodes)
          .find((e) => e.embedPlatform && e.embedUrl);
        if (firstWithEmbed) {
          imageUrl = getAutoThumbnailUrl(
            firstWithEmbed.embedPlatform as Platform,
            firstWithEmbed.embedUrl as string
          );
        }
      }
      return {
        id: s.id,
        title: s.title,
        imageUrl,
        imagePosition: s.imagePosition,
        year: s.year,
        type: s.type,
        country: s.country,
      };
    });

    return { newSeries, newSeasons, watchableSeries: formattedWatchable };
  },
  ['novedades-data-v2'],
  { revalidate: 600 }
);

export default async function NovedadesPage() {
  const data = await getNovedadesData();
  return (
    <>
      <NovedadesClient {...data} />
    </>
  );
}
