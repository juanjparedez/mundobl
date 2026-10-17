import { notFound } from 'next/navigation';
import { getSeriesByIdCached } from '@/lib/detail-loaders';

// El 404 va aca y no en la pagina: el layout corre antes del loading.tsx.
export default async function CatalogoIdLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const seriesId = Number.parseInt((await params).id, 10);
  if (Number.isNaN(seriesId) || !(await getSeriesByIdCached(seriesId))) {
    notFound();
  }
  return children;
}
