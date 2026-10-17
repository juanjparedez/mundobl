import { ContentGate } from '@/components/content/ContentGate/ContentGate';
import { ContentNotice } from '@/components/content/ContentNotice/ContentNotice';
import { hasContentConsent } from '@/lib/content-consent';
import { adultMetadata } from '@/lib/content-metadata';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getSeriesById } from '@/lib/database';
import { getSeriesByIdCached } from '@/lib/detail-loaders';
import { stripPrivateNotes } from '@/lib/privacy';
import { SerieDashboardClient } from './DashboardClient';

interface PageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const serieId = parseInt(id, 10);
  if (isNaN(serieId)) return {};
  const serie = await getSeriesByIdCached(serieId);
  if (!serie) return {};
  if (serie.contentRating === 'ADULT18') return adultMetadata();
  return {
    title: `${serie.title} — Dashboard`,
    description: 'Vista dashboard personalizable de la ficha del titulo.',
    robots: { index: false, follow: false },
  };
}

export default async function SerieDetailDashboardPage({ params }: PageProps) {
  const { id } = await params;
  const serieId = parseInt(id, 10);
  if (isNaN(serieId)) notFound();

  const session = await auth();
  const serieRaw = await getSeriesById(serieId, session?.user?.id ?? undefined);
  if (!serieRaw) notFound();
  if (serieRaw.contentRating === 'ADULT18' && !(await hasContentConsent()))
    return <ContentGate warnings={serieRaw.contentWarnings} />;

  // Compuerta de notas privadas en el servidor (SerieDashboardClient es
  // 'use client': sus props viajan en el payload RSC).
  const serie = stripPrivateNotes(serieRaw, session?.user?.role === 'ADMIN');

  return (
    <>
      <ContentNotice
        rating={serie.contentRating}
        warnings={serie.contentWarnings}
      />
      <SerieDashboardClient serie={serie} />
    </>
  );
}
