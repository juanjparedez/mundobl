import { requireAuth } from '@/lib/auth-helpers';
import { reportCommunityContent } from '@/lib/database';
import {
  CommunityError,
  communityObject,
  communityText,
} from '@/lib/community-input';
import { communityKey } from '@/lib/community-library-input';
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
    const type = (['TOPIC', 'REPLY', 'LIST', 'PROFILE'] as const).find(
      (value) => value === data.targetType
    );
    const reason = (['SPAM', 'HARASSMENT', 'SPOILERS', 'OTHER'] as const).find(
      (value) => value === data.reason
    );
    if (!type || !reason) throw new CommunityError(400, 'invalid');
    return communityResponse(
      await reportCommunityContent(
        auth.userId,
        type,
        communityKey(data.targetId),
        reason,
        communityText(data.detail ?? '', 0, 2000)
      ),
      201
    );
  } catch (error) {
    return communityFailure(error);
  }
}
