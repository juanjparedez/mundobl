import { notFound } from 'next/navigation';
import { requireAuth } from '@/lib/auth-helpers';
import { getPublicCommunityProfile } from '@/lib/database';
import { PublicCommunityProfile } from '@/components/community/PublicCommunityProfile/PublicCommunityProfile';
export const dynamic = 'force-dynamic';
export const metadata = { robots: { index: false, follow: true } };
export default async function PublicProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { id } = await params;
  const { page: rawPage = '1' } = await searchParams;
  if (
    typeof rawPage !== 'string' ||
    !/^[1-9]\d*$/.test(rawPage) ||
    Number(rawPage) > 10000
  )
    notFound();
  const page = Number(rawPage);
  if (!/^[a-zA-Z0-9_-]{1,100}$/.test(id)) notFound();
  const auth = await requireAuth();
  const profile = await getPublicCommunityProfile(
    id,
    auth.authorized ? auth.userId : undefined,
    page
  );
  if (!profile || (page > 1 && !profile.lists.items.length)) notFound();
  return <PublicCommunityProfile profile={profile} page={page} />;
}
