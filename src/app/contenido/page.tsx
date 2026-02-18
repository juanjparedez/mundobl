import { prisma } from '@/lib/database';
import { ContenidoPage } from './ContenidoPage';

export const dynamic = 'force-dynamic';

export default async function Contenido() {
  const items = await prisma.embeddableContent.findMany({
    include: {
      series: { select: { id: true, title: true } },
    },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
  });

  return <ContenidoPage items={items} />;
}
