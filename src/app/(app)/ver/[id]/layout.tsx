import { notFound } from 'next/navigation';
import { getWatchableSeriesByIdCached } from '@/lib/detail-loaders';
import { parseIdFromSlug } from '@/lib/slug';
import { isWatchableEpisode } from '@/lib/watchable';

// El 404 va aca y no en la pagina: el layout corre antes del loading.tsx.
export default async function VerIdLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const seriesId = parseIdFromSlug((await params).id);
  if (isNaN(seriesId)) notFound();
  const serie = await getWatchableSeriesByIdCached(seriesId);
  if (!serie?.seasons.some((s) => s.episodes.some(isWatchableEpisode))) {
    notFound();
  }
  return children;
}
