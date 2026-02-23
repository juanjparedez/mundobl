import { notFound } from 'next/navigation';
import { getSeriesById } from '@/lib/database';
import { SeriesForm } from '@/components/admin/SeriesForm';
import { AppLayout } from '@/components/layout/AppLayout/AppLayout';

interface EditPageProps {
  params: Promise<{
    id: string;
  }>;
}

export const dynamic = 'force-dynamic';

export default async function EditSeriesPage({ params }: EditPageProps) {
  const resolvedParams = await params;
  const seriesId = parseInt(resolvedParams.id, 10);

  if (isNaN(seriesId)) {
    notFound();
  }

  const serie = await getSeriesById(seriesId);

  if (!serie) {
    notFound();
  }

  // Transformar datos para el formulario
  const formData = {
    id: serie.id,
    title: serie.title,
    originalTitle: serie.originalTitle,
    year: serie.year,
    type: serie.type,
    basedOn: serie.basedOn,
    format: serie.format,
    synopsis: serie.synopsis,
    soundtrack: serie.soundtrack,
    overallRating: serie.overallRating,
    observations: serie.observations,
    countryName: serie.country?.name,
    universeId: serie.universeId,
    tags: serie.tags?.map((st) => st.tag.name) || [],
    actors:
      serie.actors?.map((sa) => ({
        name: sa.actor.name,
        character: sa.character || '',
        isMain: sa.isMain || false,
        pairingGroup: sa.pairingGroup ?? null,
      })) || [],
    directors:
      serie.directors?.map((sd) => ({
        name: sd.director.name,
      })) || [],
    seasons:
      serie.seasons?.map((s) => ({
        id: s.id,
        seasonNumber: s.seasonNumber,
        episodeCount: s.episodeCount,
        year: s.year,
      })) || [],
    imageUrl: serie.imageUrl,
    isFavorite: serie.isFavorite ?? false,
    productionCompanyName: serie.productionCompany?.name || undefined,
    originalLanguageName: serie.originalLanguage?.name || undefined,
    genres: serie.genres?.map((sg) => sg.genre.name) || [],
    relatedSeriesIds:
      serie.relatedSeriesFrom?.map(
        (rs: { relatedSeries: { id: number } }) => rs.relatedSeries.id
      ) || [],
    watchLinks:
      serie.watchLinks?.map(
        (wl: { platform: string; url: string; official: boolean }) => ({
          platform: wl.platform,
          url: wl.url,
          official: wl.official,
        })
      ) || [],
  };

  return (
    <AppLayout>
      <SeriesForm mode="edit" initialData={formData} />
    </AppLayout>
  );
}
