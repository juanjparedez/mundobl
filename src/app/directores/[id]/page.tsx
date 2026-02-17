export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout/AppLayout';
import { getDirectorById } from '@/lib/database';
import { DirectorProfileClient } from './DirectorProfileClient';

interface DirectorPageProps {
  params: Promise<{ id: string }>;
}

export default async function DirectorPage({ params }: DirectorPageProps) {
  const { id } = await params;
  const directorId = parseInt(id, 10);

  if (isNaN(directorId)) {
    notFound();
  }

  const director = await getDirectorById(directorId);

  if (!director) {
    notFound();
  }

  return (
    <AppLayout>
      <DirectorProfileClient director={director} />
    </AppLayout>
  );
}
