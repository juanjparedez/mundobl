import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout/AppLayout';
import { auth } from '@/lib/auth';
import { getSeriesById } from '@/lib/database';
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
  const serie = await getSeriesById(serieId);
  if (!serie) return {};
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
  const serie = await getSeriesById(serieId, session?.user?.id ?? undefined);
  if (!serie) notFound();

  return (
    <AppLayout>
      <SerieDashboardClient serie={serie} />
    </AppLayout>
  );
}
