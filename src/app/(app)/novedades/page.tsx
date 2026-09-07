import type { Metadata } from 'next';
import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/database';
import { getAutoThumbnailUrl, type Platform } from '@/lib/embed-helpers';
import {
  HAS_WATCHABLE_EPISODE,
  WATCHABLE_EPISODE_WHERE,
} from '@/lib/watchable';
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
          imageThumbUrl: true,
          imagePosition: true,
          year: true,
          type: true,
          synopsis: true,
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
              imageThumbUrl: true,
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
          // Mismo criterio que /ver: con embed Y que no sea un trailer.
          ...HAS_WATCHABLE_EPISODE,
        },
        orderBy: { createdAt: 'desc' },
        take: 12,
        select: {
          id: true,
          title: true,
          imageUrl: true,
          imageThumbUrl: true,
          imagePosition: true,
          year: true,
          type: true,
          country: { select: { name: true, code: true } },
          seasons: {
            select: {
              episodes: {
                where: WATCHABLE_EPISODE_WHERE,
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
      // El auto-thumbnail de YouTube reemplaza al poster propio cuando no hay
      // uno cargado — en ese caso no hay miniatura nuestra que ofrecer.
      let imageThumbUrl: string | null = s.imageThumbUrl;
      if (!imageUrl) {
        const firstWithEmbed = s.seasons
          .flatMap((season) => season.episodes)
          .find((e) => e.embedPlatform && e.embedUrl);
        if (firstWithEmbed) {
          imageUrl = getAutoThumbnailUrl(
            firstWithEmbed.embedPlatform as Platform,
            firstWithEmbed.embedUrl as string
          );
          imageThumbUrl = null;
        }
      }
      return {
        id: s.id,
        title: s.title,
        imageUrl,
        imageThumbUrl,
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
