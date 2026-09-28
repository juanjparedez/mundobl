import { requireAuth } from '@/lib/auth-helpers';
import {
  getCommunityProfileSettings,
  getCommunityBlocks,
} from '@/lib/database';
import { CommunityAccess } from '@/components/community/CommunityAccess/CommunityAccess';
import { CommunityProfileEditor } from '@/components/community/CommunityProfileEditor/CommunityProfileEditor';
export const dynamic = 'force-dynamic';
export const metadata = { robots: { index: false, follow: false } };
export default async function CommunitySettingsPage() {
  const auth = await requireAuth();
  if (!auth.authorized) return <CommunityAccess />;
  const [profile, blocks] = await Promise.all([
    getCommunityProfileSettings(auth.userId),
    getCommunityBlocks(auth.userId),
  ]);
  return <CommunityProfileEditor initial={profile} initialBlocks={blocks} />;
}
