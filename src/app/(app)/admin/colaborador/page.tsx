import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma, getCollaboratorStats } from '@/lib/database';
import { ColaboradorClient } from './ColaboradorClient';
import './colaborador.css';

export const metadata: Metadata = {
  title: 'Mi panel de colaborador | MundoBL',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function ColaboradorPage() {
  const session = await auth();
  // src/proxy.ts ya bloquea esto para cualquier otro rol — doble chequeo
  // server-side por si se accede directo (ej. SSR sin pasar por el proxy).
  if (
    !session?.user ||
    (session.user.role !== 'COLLABORATOR' && session.user.role !== 'ADMIN')
  ) {
    redirect('/catalogo');
  }

  const [items, stats] = await Promise.all([
    prisma.series.findMany({
      where: { origin: 'USER_EMBED', submittedById: session.user.id },
      include: {
        country: true,
        seasons: {
          include: {
            episodes: {
              where: { embedUrl: { not: null } },
              select: { id: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    getCollaboratorStats(session.user.id),
  ]);

  const rows = items.map((s) => ({
    id: s.id,
    title: s.title,
    year: s.year,
    type: s.type,
    imageUrl: s.imageUrl,
    visibility: s.visibility,
    createdAt: s.createdAt.toISOString(),
    countryName: s.country?.name ?? null,
    episodeCount: s.seasons.reduce((acc, sn) => acc + sn.episodes.length, 0),
  }));

  return <ColaboradorClient items={rows} stats={stats} />;
}
