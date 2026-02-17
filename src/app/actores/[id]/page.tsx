export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout/AppLayout';
import { getActorById } from '@/lib/database';
import { ActorProfileClient } from './ActorProfileClient';

interface ActorPageProps {
  params: Promise<{ id: string }>;
}

export default async function ActorPage({ params }: ActorPageProps) {
  const { id } = await params;
  const actorId = parseInt(id, 10);

  if (isNaN(actorId)) {
    notFound();
  }

  const actor = await getActorById(actorId);

  if (!actor) {
    notFound();
  }

  return (
    <AppLayout>
      <ActorProfileClient actor={actor} />
    </AppLayout>
  );
}
