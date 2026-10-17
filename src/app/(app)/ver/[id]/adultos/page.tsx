import type { Metadata } from 'next';
import { adultMetadata } from '@/lib/content-metadata';
import { parseIdFromSlug } from '@/lib/slug';
import { VerSerieView } from '../VerSerieView/VerSerieView';

interface AdultVerPageProps {
  params: Promise<{ id: string }>;
}

// El consentimiento es por navegador, asi que esta variante no se cachea.
// Solo llegan los titulos ADULT18; el resto redirige a /ver/[id].
export const dynamic = 'force-dynamic';

export function generateMetadata(): Promise<Metadata> {
  return adultMetadata();
}

export default async function AdultVerPage({ params }: AdultVerPageProps) {
  const { id } = await params;
  return <VerSerieView seriesId={parseIdFromSlug(id)} adultRoute />;
}
