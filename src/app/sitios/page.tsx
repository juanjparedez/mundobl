import type { Metadata } from 'next';
import { prisma } from '@/lib/database';
import { SitiosPage } from './SitiosPage';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Sitios Recomendados para Ver Series BL',
  description:
    'Lista de sitios y plataformas recomendadas para ver series BL (Boys Love), GL y doramas asiáticos online.',
  alternates: {
    canonical: '/sitios',
  },
};

export default async function Sitios() {
  const sites = await prisma.recommendedSite.findMany({
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
  });

  return <SitiosPage sites={sites} />;
}
