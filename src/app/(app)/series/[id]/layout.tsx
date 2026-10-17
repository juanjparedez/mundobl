import { notFound, redirect } from 'next/navigation';
import { getWatchOnlySeries } from '@/lib/database';
import { getSeriesByIdCached } from '@/lib/detail-loaders';
import { getVerUrl, parseIdFromSlug } from '@/lib/slug';

// El 404 va aca y no en la pagina: el layout corre antes del loading.tsx,
// asi que el status sale bien (404, o 307 a /ver).
export default async function SeriesIdLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const seriesId = parseIdFromSlug((await params).id);
  if (isNaN(seriesId)) notFound();
  if (!(await getSeriesByIdCached(seriesId))) {
    // Lo que solo se ve aca no tiene ficha de catalogo: su pagina es /ver.
    // Redireccion temporal, porque la serie puede pasar al catalogo.
    const watchOnly = await getWatchOnlySeries(seriesId);
    if (watchOnly) redirect(getVerUrl(watchOnly.id, watchOnly.title));
    notFound();
  }
  return children;
}
