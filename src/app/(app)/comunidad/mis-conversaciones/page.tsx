import { notFound } from 'next/navigation';
import { requireAuth } from '@/lib/auth-helpers';
import { getPersonalCommunityTopics } from '@/lib/database';
import { CommunityAccess } from '@/components/community/CommunityAccess/CommunityAccess';
import { PersonalCommunityTopics } from '@/components/community/PersonalCommunityTopics/PersonalCommunityTopics';
export const dynamic = 'force-dynamic';
export const metadata = { robots: { index: false, follow: false } };
export default async function PersonalTopicsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; page?: string }>;
}) {
  const auth = await requireAuth();
  if (!auth.authorized) return <CommunityAccess />;
  const { view = 'own', page: rawPage = '1' } = await searchParams;
  if (
    !['own', 'drafts', 'following'].includes(view) ||
    typeof rawPage !== 'string' ||
    !/^[1-9]\d*$/.test(rawPage) ||
    Number(rawPage) > 10000
  )
    notFound();
  const tab = view as 'own' | 'drafts' | 'following';
  const page = Number(rawPage);
  const data = await getPersonalCommunityTopics(auth.userId, tab, page);
  if (page > 1 && !data.items.length) notFound();
  return <PersonalCommunityTopics {...data} view={tab} page={page} />;
}
