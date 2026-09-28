import { requireAuth } from '@/lib/auth-helpers';
import { markCommunityRead, setCommunityFollow } from '@/lib/database';
import { communityId, communityObject } from '@/lib/community-input';
import { communityBoolean } from '@/lib/community-library-input';
import {
  readCommunityMutation,
  communityResponse,
  communityFailure,
} from '@/lib/community-response';

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth();
    if (!auth.authorized) return auth.response;
    const topicId = communityId((await context.params).id);
    const data = communityObject(await readCommunityMutation(request));
    if (data.action === 'read') {
      await markCommunityRead(auth.userId, topicId, communityId(data.replyId));
    } else {
      await setCommunityFollow(auth.userId, topicId, {
        following: communityBoolean(data.following),
        notify: communityBoolean(data.notify),
        muted: communityBoolean(data.muted),
      });
    }
    return communityResponse({ ok: true });
  } catch (error) {
    return communityFailure(error);
  }
}
