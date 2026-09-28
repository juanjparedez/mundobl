import { requireAuth } from '@/lib/auth-helpers';
import { getCommunityBlocks, setCommunityBlock } from '@/lib/database';
import { communityObject } from '@/lib/community-input';
import { communityBoolean, communityKey } from '@/lib/community-library-input';
import {
  readCommunityMutation,
  communityResponse,
  communityFailure,
} from '@/lib/community-response';

export async function GET() {
  try {
    const auth = await requireAuth();
    if (!auth.authorized) return auth.response;
    return communityResponse(await getCommunityBlocks(auth.userId));
  } catch (error) {
    return communityFailure(error);
  }
}
export async function PATCH(request: Request) {
  try {
    const auth = await requireAuth();
    if (!auth.authorized) return auth.response;
    const data = communityObject(await readCommunityMutation(request));
    await setCommunityBlock(
      auth.userId,
      communityKey(data.targetId),
      communityBoolean(data.blocked)
    );
    return communityResponse({ ok: true });
  } catch (error) {
    return communityFailure(error);
  }
}
