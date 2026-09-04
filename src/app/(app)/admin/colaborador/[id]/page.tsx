import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/database';
import { ColaboradorNav } from '../ColaboradorNav';
import { CollaboratorSeriesForm } from './CollaboratorSeriesForm';
import '../colaborador.css';

export const metadata: Metadata = {
  title: 'Editar ficha | Mi panel de colaborador',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ColaboradorEditarPage({ params }: PageProps) {
  const session = await auth();
  if (
    !session?.user ||
    (session.user.role !== 'COLLABORATOR' && session.user.role !== 'ADMIN')
  ) {
    redirect('/catalogo');
  }

  const { id } = await params;
  const seriesId = parseInt(id, 10);
  if (isNaN(seriesId)) notFound();

  const series = await prisma.series.findUnique({
    where: { id: seriesId },
    include: {
      country: true,
      productionCompany: true,
      actors: { include: { actor: true } },
      tags: { include: { tag: true } },
      genres: { include: { genre: true } },
      seasons: {
        orderBy: { seasonNumber: 'asc' },
        include: {
          episodes: {
            orderBy: { episodeNumber: 'asc' },
            select: {
              id: true,
              episodeNumber: true,
              title: true,
              embedUrl: true,
            },
          },
        },
      },
    },
  });

  if (!series || series.origin !== 'USER_EMBED') notFound();
  // Un COLLABORATOR solo entra a su propio aporte — ADMIN puede ver
  // cualquiera (ej. para ayudar a resolver un problema puntual).
  if (
    session.user.role === 'COLLABORATOR' &&
    series.submittedById !== session.user.id
  ) {
    notFound();
  }

  return (
    <div className="colaborador-page">
      <ColaboradorNav />
      <CollaboratorSeriesForm
        series={{
          id: series.id,
          title: series.title,
          originalTitle: series.originalTitle,
          year: series.year,
          type: series.type,
          synopsis: series.synopsis,
          imageUrl: series.imageUrl,
          countryCode: series.country?.code ?? null,
          productionCompanyName: series.productionCompany?.name ?? null,
          actorNames: series.actors.map((a) => a.actor.name),
          tagNames: series.tags.map((t) => t.tag.name),
          genreNames: series.genres.map((g) => g.genre.name),
          visibility: series.visibility,
        }}
        seasons={series.seasons.map((s) => ({
          seasonNumber: s.seasonNumber,
          episodes: s.episodes.map((e) => ({
            id: e.id,
            episodeNumber: e.episodeNumber,
            title: e.title,
            hasEmbed: e.embedUrl !== null,
          })),
        }))}
      />
    </div>
  );
}
