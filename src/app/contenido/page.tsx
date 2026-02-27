import type { Metadata } from 'next';
import { prisma } from '@/lib/database';
import { ContenidoPage } from './ContenidoPage';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Contenido BL - Videos, Trailers y Clips',
  description:
    'Videos, trailers, clips y contenido embebido de series BL (Boys Love), GL y doramas asiáticos.',
  alternates: {
    canonical: '/contenido',
  },
};

export default async function Contenido() {
  const items = await prisma.embeddableContent.findMany({
    include: {
      series: { select: { id: true, title: true } },
    },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
  });

  return <ContenidoPage items={items} />;
}
