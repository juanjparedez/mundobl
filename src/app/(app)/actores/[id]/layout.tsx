import { notFound } from 'next/navigation';
import { loadPublicActor } from '@/lib/detail-loaders';

// El 404 va aca y no en la pagina: el layout corre antes del loading.tsx.
export default async function ActorIdLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  if (!(await loadPublicActor((await params).id))) notFound();
  return children;
}
