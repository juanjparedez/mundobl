import { notFound, permanentRedirect, redirect } from 'next/navigation';
import { getWatchOnlySeries } from '@/lib/database';
import { getSeriesByIdCached } from '@/lib/detail-loaders';
import { getSeriesUrl, getVerUrl, parseIdFromSlug } from '@/lib/slug';

// El 404 va aca y no en la pagina: el layout corre antes del loading.tsx,
// asi que el status sale bien (404, o 307 a /ver).
export default async function SeriesIdLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const seriesId = parseIdFromSlug(id);
  if (isNaN(seriesId)) notFound();
  const serie = await getSeriesByIdCached(seriesId);
  if (!serie) {
    // Lo que solo se ve aca no tiene ficha de catalogo: su pagina es /ver.
    // Redireccion temporal, porque la serie puede pasar al catalogo.
    const watchOnly = await getWatchOnlySeries(seriesId);
    if (watchOnly) redirect(getVerUrl(watchOnly.id, watchOnly.title));
    notFound();
  }
  // Una sola URL por serie. `/series/648` y `/series/648-titulo-viejo`
  // renderizaban la ficha entera como entradas ISR aparte (~480 KB cada
  // una), asi que crawlers y links sin slug duplicaban las regeneraciones
  // (cuotas de Vercel, nov 2026). Ahora esas variantes guardan solo un 308.
  // Va en el layout por lo mismo que el 404: antes del loading.tsx.
  const canonical = getSeriesUrl(serie.id, serie.title);
  if (`/series/${decodeURIComponent(id)}` !== canonical) {
    permanentRedirect(canonical);
  }
  return children;
}
