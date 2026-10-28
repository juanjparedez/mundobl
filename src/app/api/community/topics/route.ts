import { requireAuth } from '@/lib/auth-helpers';
import { createCommunityTopic } from '@/lib/database';
import { awardAchievementsAfterResponse } from '@/lib/achievement-store';
import { communityObject, parseCommunityTopic } from '@/lib/community-input';
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
    const topic = await createCommunityTopic(
      auth.userId,
      parseCommunityTopic(data),
      data.notify === true
    );
    awardAchievementsAfterResponse(auth.userId, ['communityTopics']);
    return communityResponse(topic, 201);
  } catch (error) {
    return communityFailure(error);
  }
}
