import { getCommunityUrl } from '@/lib/community-url';
import { requireAuth } from '@/lib/auth-helpers';
import { notFound } from 'next/navigation';
import {
  getCommunityReviews,
  getCommunityTopics,
  getCommunityMetrics,
} from '@/lib/database';
import { COMMUNITY_KINDS } from '@/types/community';
import { loadLocaleMessages } from '@/i18n/messages';
import { CommunityFeed } from './CommunityFeed/CommunityFeed';

// Public review visibility must be checked for each request.
export const dynamic = 'force-dynamic';
interface CommunityPageProps {
  searchParams: Promise<{
    page?: string | string[];
    q?: string | string[];
    view?: string | string[];
  }>;
}
async function readPage({ searchParams }: CommunityPageProps) {
  const params = await searchParams;
  const raw = params.page ?? '1';
  const query = params.q ?? '';
  if (typeof query !== 'string' || query.length > 100) notFound();
  const search = query.trim();
  if (typeof raw !== 'string' || !/^[1-9]\d*$/.test(raw)) notFound();
  const page = Number(raw);
  if (!Number.isSafeInteger(page) || page > 10000) notFound();
  const view = (
    ['all', 'reviews', 'unanswered', ...COMMUNITY_KINDS] as const
  ).find((value) => value === (params.view ?? 'all'));
  if (!view) notFound();
  return { page, search, view };
}
export async function generateMetadata(props: CommunityPageProps) {
  const { page, search, view } = await readPage(props);
  const { community } = await loadLocaleMessages('es');
  return {
    title: community.title,
    ...(search ? { robots: { index: false, follow: true } } : {}),
    description: community.description,
    alternates: {
      canonical: getCommunityUrl(page, search, view),
    },
  };
}
export default async function CommunityPage(props: CommunityPageProps) {
  const { page, search, view } = await readPage(props);
  const auth = await requireAuth();
  const viewerId = auth.authorized ? auth.userId : undefined;
  const [reviews, topics, metrics] = await Promise.all([
    view === 'all' || view === 'reviews'
      ? getCommunityReviews(view === 'all' ? 1 : page, search, viewerId)
      : Promise.resolve({ items: [], hasNext: false }),
    view === 'reviews'
      ? Promise.resolve({ items: [], hasNext: false })
      : getCommunityTopics(page, search, view, viewerId),
    view === 'all' && page === 1 && !search
      ? getCommunityMetrics(viewerId)
      : Promise.resolve(undefined),
  ]);
  const result = view === 'reviews' ? reviews : topics;
  if (page > 1 && result.items.length === 0) notFound();
  return (
    <CommunityFeed
      items={view === 'all' ? reviews.items.slice(0, 3) : reviews.items}
      topics={topics.items}
      view={view}
      page={page}
      search={search}
      hasNext={result.hasNext}
      metrics={metrics}
    />
  );
}
