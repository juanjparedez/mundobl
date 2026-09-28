import { notFound } from 'next/navigation';
import { requireAuth } from '@/lib/auth-helpers';
import { getRecommendationList } from '@/lib/database';
import { RecommendationPage } from '@/components/community/RecommendationPage/RecommendationPage';
export const dynamic = 'force-dynamic';
export const metadata = { robots: { index: false, follow: true } };
export default async function ListPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!/^[a-zA-Z0-9_-]{1,100}$/.test(id)) notFound();
  const auth = await requireAuth();
  const list = await getRecommendationList(
    id,
    auth.authorized ? auth.userId : undefined
  );
  if (!list) notFound();
  return (
    <RecommendationPage
      key={`${id}-${list.revision}-${list.updatedAt}`}
      initial={list}
    />
  );
}
