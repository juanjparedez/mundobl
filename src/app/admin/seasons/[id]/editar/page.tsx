import { notFound } from 'next/navigation';
import { prisma } from '@/lib/database';
import { SeasonForm } from '@/components/admin/SeasonForm';
import { AppLayout } from '@/components/layout/AppLayout/AppLayout';

interface EditSeasonPageProps {
  params: Promise<{
    id: string;
  }>;
}

export const dynamic = 'force-dynamic';

export default async function EditSeasonPage({ params }: EditSeasonPageProps) {
  const resolvedParams = await params;
  const seasonId = parseInt(resolvedParams.id, 10);

  if (isNaN(seasonId)) {
    notFound();
  }

  const season = await prisma.season.findUnique({
    where: { id: seasonId },
    include: {
      series: {
        select: {
          id: true,
          title: true,
        },
      },
      actors: {
        include: {
          actor: true,
        },
      },
    },
  });

  if (!season) {
    notFound();
  }

  // Transformar datos para el formulario
  const formData = {
    id: season.id,
    seriesId: season.seriesId,
    seriesTitle: season.series.title,
    seasonNumber: season.seasonNumber,
    title: season.title,
    episodeCount: season.episodeCount,
    year: season.year,
    synopsis: season.synopsis,
    observations: season.observations,
    imageUrl: season.imageUrl,
    actors: season.actors?.map((sa) => ({
      name: sa.actor.name,
      character: sa.character || '',
      isMain: sa.isMain,
    })) || [],
  };

  return (
    <AppLayout>
      <SeasonForm initialData={formData} />
    </AppLayout>
  );
}
