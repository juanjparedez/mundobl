import { notFound } from 'next/navigation';
import { requireAuth } from '@/lib/auth-helpers';
import { getRecommendationLists } from '@/lib/database';
import { CommunityLists } from '@/components/community/CommunityLists/CommunityLists';
import { CommunityAccess } from '@/components/community/CommunityAccess/CommunityAccess';
export const dynamic = 'force-dynamic';
export const metadata = { robots: { index: false, follow: true } };
export default async function ListsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; mine?: string }>;
}) {
  const params = await searchParams;
  const raw = params.page ?? '1';
  if (
    typeof raw !== 'string' ||
    !/^[1-9]\d*$/.test(raw) ||
    Number(raw) > 10000 ||
    (params.q !== undefined &&
      (typeof params.q !== 'string' || params.q.length > 100))
  )
    notFound();
  const mine = params.mine === 'true',
    page = Number(raw),
    search = params.q?.trim() ?? '';
  const auth = await requireAuth();
  if (mine && !auth.authorized) return <CommunityAccess />;
  const data = await getRecommendationLists({
    mine,
    page,
    search,
    viewerId: auth.authorized ? auth.userId : undefined,
  });
  if (page > 1 && !data.items.length) notFound();
  return <CommunityLists {...data} mine={mine} page={page} search={search} />;
}
