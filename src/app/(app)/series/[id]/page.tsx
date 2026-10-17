import { adultMetadata } from '@/lib/content-metadata';
import { loadLocaleMessages } from '@/i18n/messages';
import type { Metadata } from 'next';
import { getSeriesUrl, parseIdFromSlug } from '@/lib/slug';
import {
  SeriesDetailView,
  getSeriesByIdCached,
} from './SeriesDetailView/SeriesDetailView';

interface SeriesPageProps {
  params: Promise<{
    id: string;
  }>;
}

// ISR con revalidacion a demanda (ver src/lib/revalidate-series.ts): cada
// edicion de la serie invalida ESTA ficha al instante, asi que el TTL es
// solo red de seguridad, no el mecanismo de frescura. Con 900s, las ~650
// fichas se regeneraban hasta 96 veces por dia cada una mientras Googlebot
// las crawleaba — y cada regeneracion es un ISR write + el CPU de
// buildSeriesFullInclude (temporadas, episodios, reparto, ratings) mas los
// counts de abajo. Era el grueso de las dos cuotas que se pasaron de largo.
// Lo unico que queda viejo hasta 24h son los chips de conteo (reseñas,
// favoritos, "viendo"); las reseñas y comentarios en si son client-side.
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
}: SeriesPageProps): Promise<Metadata> {
  const { id } = await params;
  const seriesId = parseIdFromSlug(id);
  if (isNaN(seriesId)) return {};

  const serie = await getSeriesByIdCached(seriesId);
  if (!serie) return {};

  if (serie.contentRating === 'ADULT18') return adultMetadata();

  const labels = (await loadLocaleMessages('es')).contentMetadata;
  const year = serie.year ? ` (${serie.year})` : '';
  const origTitle =
    serie.originalTitle && serie.originalTitle.trim() !== serie.title.trim()
      ? ` (${serie.originalTitle.trim()})`
      : '';
  const title = `${serie.title}${origTitle}${year} | ${labels.catalogTitle} | MundoBL`;
  const synopsis = `${serie.title}. ${labels.catalogDescription}`;

  const canonicalUrl = getSeriesUrl(serie.id, serie.title);

  const keywords = [
    serie.title,
    serie.originalTitle,
    ...(serie.tags?.map((st) => st.tag.name) ?? []),
    ...(serie.genres?.map((sg) => sg.genre.name) ?? []),
  ].filter(Boolean) as string[];

  return {
    title: { absolute: title },
    description: synopsis,
    keywords,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${serie.title}${origTitle}${year}`,
      description: synopsis,
      type: 'video.tv_show',
      url: canonicalUrl,
      ...(serie.imageUrl && {
        images: [{ url: serie.imageUrl, alt: serie.title }],
      }),
    },
    twitter: {
      card: 'summary_large_image',
      title: `${serie.title}${origTitle}${year}`,
      description: synopsis,
      ...(serie.imageUrl && { images: [serie.imageUrl] }),
    },
  };
}

export default async function SeriesPage({ params }: SeriesPageProps) {
  const { id } = await params;
  return <SeriesDetailView seriesId={parseIdFromSlug(id)} />;
}
