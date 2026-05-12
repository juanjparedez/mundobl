import type { Metadata } from 'next';
import { AppLayout } from '@/components/layout/AppLayout/AppLayout';
import { getStats, prisma } from '@/lib/database';
import { CatalogoDashboardClient } from './DashboardClient';
import type { RecentSeriesItem } from './widgets/CatalogoRecentlyAddedWidget/CatalogoRecentlyAddedWidget';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Catalogo — Dashboard',
  description: 'Dashboard del catalogo con widgets reordenables.',
  robots: { index: false, follow: false },
};

export default async function CatalogoDashboardPage() {
  const [stats, recentSeries] = await Promise.all([
    getStats(),
    prisma.series.findMany({
      where: { catalogScope: 'PERSONAL', origin: 'CURATED' },
      orderBy: { createdAt: 'desc' },
      take: 12,
      select: {
        id: true,
        title: true,
        imageUrl: true,
        year: true,
        country: { select: { name: true } },
      },
    }),
  ]);

  const recentlyAdded: RecentSeriesItem[] = recentSeries.map((s) => ({
    id: s.id,
    title: s.title,
    imageUrl: s.imageUrl,
    year: s.year,
    country: s.country?.name ?? null,
  }));

  return (
    <AppLayout>
      <CatalogoDashboardClient
        totalSeries={stats.totalSeries}
        totalSeasons={stats.totalSeasons}
        totalEpisodes={stats.totalEpisodes}
        totalActors={stats.totalActors}
        totalCountries={stats.totalCountries}
        recentlyAdded={recentlyAdded}
      />
    </AppLayout>
  );
}
