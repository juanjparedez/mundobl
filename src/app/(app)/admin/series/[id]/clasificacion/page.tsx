import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth-helpers';
import { prisma } from '@/lib/database';
import { ClassificationEditor } from '@/components/content/ClassificationEditor/ClassificationEditor';
export const dynamic = 'force-dynamic';
export default async function ClassificationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const auth = await requireRole(['ADMIN']);
  if (!auth.authorized) notFound();
  const id = Number((await params).id);
  if (!Number.isSafeInteger(id) || id < 1) notFound();
  const initial = await prisma.series.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      contentRating: true,
      contentWarnings: true,
      contentRatingSource: true,
      editVersion: true,
    },
  });
  if (!initial) notFound();
  return <ClassificationEditor initial={initial} />;
}
