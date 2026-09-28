import { requireAuth } from '@/lib/auth-helpers';
import { createCommunityTopic } from '@/lib/database';
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
    return communityResponse(
      await createCommunityTopic(
        auth.userId,
        parseCommunityTopic(data),
        data.notify === true
      ),
      201
    );
  } catch (error) {
    return communityFailure(error);
  }
}
