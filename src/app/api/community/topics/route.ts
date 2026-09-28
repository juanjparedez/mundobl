import { requireAuth } from '@/lib/auth-helpers';
import { createCommunityTopic } from '@/lib/database';
import { parseCommunityTopic } from '@/lib/community-input';
import { communityResponse, communityFailure } from '@/lib/community-response';

export async function POST(request: Request) {
  try {
    const auth = await requireAuth();
    if (!auth.authorized) return auth.response;
    const input = parseCommunityTopic(await request.json());
    return communityResponse(
      await createCommunityTopic(auth.userId, input),
      201
    );
  } catch (error) {
    return communityFailure(error);
  }
}
