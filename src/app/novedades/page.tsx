import type { Metadata } from 'next';
import { unstable_cache } from 'next/cache';
import { AppLayout } from '@/components/layout/AppLayout/AppLayout';
import { prisma } from '@/lib/database';
import { NovedadesClient } from './NovedadesClient';
import './novedades.css';

export const dynamic = 'force-dynamic';

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

    const [newSeries, newSeasons] = await Promise.all([
      prisma.series.findMany({
        where: { createdAt: { gte: since } },
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
        where: { createdAt: { gte: since } },
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
    ]);

    return { newSeries, newSeasons };
  },
  ['novedades-data-v1'],
  { revalidate: 600 }
);

export default async function NovedadesPage() {
  const data = await getNovedadesData();
  return (
    <AppLayout>
      <NovedadesClient {...data} />
    </AppLayout>
  );
}
