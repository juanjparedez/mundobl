import { prisma } from '@/lib/database';
import { SitiosPage } from './SitiosPage';

export const dynamic = 'force-dynamic';

export default async function Sitios() {
  const sites = await prisma.recommendedSite.findMany({
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
  });

  return <SitiosPage sites={sites} />;
}
