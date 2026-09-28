import { requireAuth } from '@/lib/auth-helpers';
import { CommunityAccess } from '@/components/community/CommunityAccess/CommunityAccess';
import { NewRecommendation } from '@/components/community/NewRecommendation/NewRecommendation';
export const dynamic = 'force-dynamic';
export const metadata = { robots: { index: false, follow: false } };
export default async function NewListPage() {
  const auth = await requireAuth();
  return auth.authorized ? <NewRecommendation /> : <CommunityAccess />;
}
