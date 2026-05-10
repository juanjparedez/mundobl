import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout/AppLayout';
import { getSeriesById } from '@/lib/database';
import { WorkspaceClient } from './WorkspaceClient/WorkspaceClient';

interface WorkspacePageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Workspace serie — Admin',
  description: 'Vista densa de administración de una serie.',
  robots: { index: false, follow: false },
};

// Acceso restringido a ADMIN + MODERATOR por proxy.ts (regex
// /^\/admin\/series\/\d+$/). Aca asumimos que la sesion ya esta validada.
export default async function WorkspacePage({ params }: WorkspacePageProps) {
  const { id } = await params;
  const seriesId = parseInt(id, 10);

  if (isNaN(seriesId)) {
    notFound();
  }

  const serie = await getSeriesById(seriesId);

  if (!serie) {
    notFound();
  }

  return (
    <AppLayout>
      <WorkspaceClient serie={serie} />
    </AppLayout>
  );
}
