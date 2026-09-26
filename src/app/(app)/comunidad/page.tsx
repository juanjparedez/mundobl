import { getCommunityUrl } from '@/lib/community-url';
import { notFound } from 'next/navigation';
import { getCommunityReviews } from '@/lib/database';
import { loadLocaleMessages } from '@/i18n/messages';
import { CommunityFeed } from './CommunityFeed/CommunityFeed';

// Public review visibility must be checked for each request.
export const dynamic = 'force-dynamic';
interface CommunityPageProps {
  searchParams: Promise<{ page?: string | string[]; q?: string | string[] }>;
}
async function readPage({ searchParams }: CommunityPageProps) {
  const params = await searchParams;
  const raw = params.page ?? '1';
  const query = params.q ?? '';
  if (typeof query !== 'string' || query.length > 100) notFound();
  const search = query.trim();
  if (typeof raw !== 'string' || !/^[1-9]\d*$/.test(raw)) notFound();
  const page = Number(raw);
  if (!Number.isSafeInteger(page) || page > 71582788) notFound();
  return { page, search };
}
export async function generateMetadata(props: CommunityPageProps) {
  const { page, search } = await readPage(props);
  const { community } = await loadLocaleMessages('es');
  return {
    title: community.title,
    ...(search ? { robots: { index: false, follow: true } } : {}),
    description: community.description,
    alternates: {
      canonical: getCommunityUrl(page, search),
    },
  };
}
export default async function CommunityPage(props: CommunityPageProps) {
  const { page, search } = await readPage(props);
  const result = await getCommunityReviews(page, search);
  if (page > 1 && result.items.length === 0) notFound();
  return (
    <CommunityFeed
      items={result.items}
      page={page}
      search={search}
      hasNext={result.hasNext}
    />
  );
}
