import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth-helpers';
import {
  getCommunityModerationQueue,
  getCommunitySettings,
} from '@/lib/database';
import { CommunityModeration } from '@/components/community/CommunityModeration/CommunityModeration';
export const dynamic = 'force-dynamic';
export const metadata = { robots: { index: false, follow: false } };
export default async function CommunityModerationPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; resolved?: string }>;
}) {
  const auth = await requireRole(['ADMIN', 'MODERATOR']);
  if (!auth.authorized) notFound();
  const query = await searchParams;
  const rawPage = query.page ?? '1';
  if (
    typeof rawPage !== 'string' ||
    !/^[1-9]\d*$/.test(rawPage) ||
    Number(rawPage) > 10000
  )
    notFound();
  const page = Number(rawPage),
    resolved = query.resolved === 'true';
  const [queue, settings] = await Promise.all([
    getCommunityModerationQueue(auth.userId, page, resolved),
    getCommunitySettings(),
  ]);
  return (
    <CommunityModeration
      key={`${page}:${resolved}`}
      initial={queue}
      settings={settings}
      canConfigure={auth.role === 'ADMIN'}
      page={page}
      resolved={resolved}
    />
  );
}
