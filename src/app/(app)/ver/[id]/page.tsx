import { adultMetadata } from '@/lib/content-metadata';
import { loadLocaleMessages } from '@/i18n/messages';
import type { Metadata } from 'next';
import { getVerUrl, parseIdFromSlug } from '@/lib/slug';
import { getWatchableSeriesByIdCached } from '@/lib/detail-loaders';
import { VerSerieView } from './VerSerieView/VerSerieView';

interface PageProps {
  params: Promise<{ id: string }>;
}

// Igual que /series/[id]: el contenido (embeds de los episodios) solo cambia
// cuando lo edita un admin/colaborador, y esas rutas ya invalidan esta ficha
// por URL. A 120s, las ~650 paginas se regeneraban cada 2 minutos mientras
// hubiera crawl — por lejos el mayor generador de ISR writes del proyecto.
// Los titulos +18 no se renderizan aca: redirigen a ./adultos, que es dinamica.
export const revalidate = 604800;
// Sin generateStaticParams, Next renderiza esta ruta en cada visita aunque
// tenga revalidate. Con la lista vacia, la primera visita la genera y las
// siguientes salen de la cache hasta el proximo revalidate.
export function generateStaticParams(): { id: string }[] {
  return [];
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const seriesId = parseIdFromSlug(id);
  if (isNaN(seriesId)) return {};
  const serie = await getWatchableSeriesByIdCached(seriesId);
  // Que exista y tenga algo para ver ya lo chequeo el layout.
  if (!serie) return {};
  if (serie.contentRating === 'ADULT18') return adultMetadata();
  const labels = (await loadLocaleMessages('es')).contentMetadata;

  const origTitle =
    serie.originalTitle && serie.originalTitle.trim() !== serie.title.trim()
      ? ` (${serie.originalTitle.trim()})`
      : '';
  const yearPart = serie.year ? ` (${serie.year})` : '';

  const title = `${serie.title}${origTitle}${yearPart} | ${labels.watchTitle} | MundoBL`;
  const description = `${serie.title}. ${labels.watchDescription}`;

  const canonicalUrl = getVerUrl(serie.id, serie.title);

  const keywords = [serie.title, serie.originalTitle].filter(
    Boolean
  ) as string[];

  return {
    title: { absolute: title },
    description,
    keywords,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      ...(serie.imageUrl && { images: [{ url: serie.imageUrl }] }),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(serie.imageUrl && { images: [serie.imageUrl] }),
    },
  };
}

export default async function VerSeriePage({ params }: PageProps) {
  const { id } = await params;
  return <VerSerieView seriesId={parseIdFromSlug(id)} />;
}
