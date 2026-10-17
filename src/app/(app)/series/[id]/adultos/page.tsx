import type { Metadata } from 'next';
import { adultMetadata } from '@/lib/content-metadata';
import { parseIdFromSlug } from '@/lib/slug';
import { SeriesDetailView } from '../SeriesDetailView/SeriesDetailView';

interface AdultSeriesPageProps {
  params: Promise<{ id: string }>;
}

// El consentimiento es por navegador, asi que esta variante no se cachea.
// Solo llegan los titulos ADULT18; el resto redirige a la ficha comun.
export const dynamic = 'force-dynamic';

export function generateMetadata(): Promise<Metadata> {
  return adultMetadata();
}

export default async function AdultSeriesPage({
  params,
}: AdultSeriesPageProps) {
  const { id } = await params;
  return <SeriesDetailView seriesId={parseIdFromSlug(id)} adultRoute />;
}
