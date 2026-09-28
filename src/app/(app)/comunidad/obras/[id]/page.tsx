import { notFound } from 'next/navigation';
import { requireAuth } from '@/lib/auth-helpers';
import {
  getCommunityConversationContext,
  getCommunityTopics,
} from '@/lib/database';
import { communityId } from '@/lib/community-input';
import { COMMUNITY_KINDS } from '@/types/community';
import { CommunityFeed } from '../../CommunityFeed/CommunityFeed';
export const dynamic = 'force-dynamic';
export const metadata = { robots: { index: false, follow: true } };
export default async function WorkConversationsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    page?: string;
    q?: string;
    view?: string;
    episodeId?: string;
  }>;
}) {
  const query = await searchParams;
  let seriesId: number, episodeId: number | undefined, page: number;
  try {
    seriesId = communityId((await params).id);
    episodeId =
      query.episodeId === undefined ? undefined : communityId(query.episodeId);
    page = communityId(query.page ?? '1');
  } catch {
    notFound();
  }
  const view = (['all', 'unanswered', ...COMMUNITY_KINDS] as const).find(
    (value) => value === (query.view ?? 'all')
  );
  if (
    !view ||
    page > 10000 ||
    (query.q !== undefined &&
      (typeof query.q !== 'string' || query.q.length > 100))
  )
    notFound();
  const context = await getCommunityConversationContext(seriesId, episodeId);
  if (!context) notFound();
  const auth = await requireAuth();
  const search = query.q?.trim() ?? '';
  const data = await getCommunityTopics(
    page,
    search,
    view,
    auth.authorized ? auth.userId : undefined,
    { seriesId, episodeId }
  );
  if (page > 1 && !data.items.length) notFound();
  return (
    <CommunityFeed
      items={[]}
      topics={data.items}
      hasNext={data.hasNext}
      page={page}
      search={search}
      view={view}
      context={{
        series: context.series,
        episodeId,
        episode: context.episode
          ? {
              seasonNumber: context.episode.season.seasonNumber,
              episodeNumber: context.episode.episodeNumber,
            }
          : undefined,
      }}
    />
  );
}
