import { notFound } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout/AppLayout';
import { getSeriesById } from '@/lib/database';
import { SerieDetailClient } from './SerieDetailClient';

interface SerieDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function SerieDetailPage({
  params,
}: SerieDetailPageProps) {
  const { id } = await params;
  const serieId = parseInt(id, 10);

  if (isNaN(serieId)) {
    notFound();
  }

  const serie = await getSeriesById(serieId);

  if (!serie) {
    notFound();
  }

  return (
    <AppLayout>
      <SerieDetailClient serie={serie} />
    </AppLayout>
  );
}
