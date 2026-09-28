import { requireAuth } from '@/lib/auth-helpers';
import { saveCommunityRecommendation } from '@/lib/database';
import { communityId, communityObject } from '@/lib/community-input';
import {
  readCommunityMutation,
  communityResponse,
  communityFailure,
} from '@/lib/community-response';

export async function POST(request: Request) {
  try {
    const auth = await requireAuth();
    if (!auth.authorized) return auth.response;
    const data = communityObject(await readCommunityMutation(request));
    return communityResponse(
      await saveCommunityRecommendation(auth.userId, communityId(data.seriesId))
    );
  } catch (error) {
    return communityFailure(error);
  }
}
