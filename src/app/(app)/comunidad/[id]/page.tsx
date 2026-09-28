import { notFound } from 'next/navigation';
import { requireAuth } from '@/lib/auth-helpers';
import { getCommunityTopic } from '@/lib/database';
import { CommunityThread } from './CommunityThread/CommunityThread';
export const dynamic = 'force-dynamic';
export const metadata = { robots: { index: false, follow: true } };
export default async function CommunityTopicPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { id } = await params;
  const { page: rawPage = '1' } = await searchParams;
  if (!/^[1-9]\d*$/.test(id) || !/^[1-9]\d*$/.test(rawPage)) notFound();
  const topicId = Number(id),
    page = Number(rawPage);
  if (!Number.isSafeInteger(topicId) || topicId > 2147483647 || page > 10000)
    notFound();
  const auth = await requireAuth();
  const topic = await getCommunityTopic(
    topicId,
    page,
    auth.authorized ? auth.userId : undefined
  );
  if (!topic || (page > 1 && !topic.replies.length)) notFound();
  return <CommunityThread key={topic.id} topic={topic} page={page} />;
}
