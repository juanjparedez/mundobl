import { requireAuth } from '@/lib/auth-helpers';
import { awardAchievementsAfterResponse } from '@/lib/achievement-store';
import {
  getRecommendationList,
  updateRecommendationList,
  publishRecommendationList,
  deleteRecommendationList,
} from '@/lib/database';
import {
  CommunityError,
  communityId,
  communityObject,
} from '@/lib/community-input';
import {
  communityBoolean,
  communityKey,
  parseRecommendationList,
} from '@/lib/community-library-input';
import {
  readCommunityMutation,
  assertCommunityOrigin,
  communityResponse,
  communityFailure,
} from '@/lib/community-response';

type Context = { params: Promise<{ id: string }> };
export async function GET(_request: Request, context: Context) {
  try {
    const auth = await requireAuth();
    const list = await getRecommendationList(
      communityKey((await context.params).id),
      auth.authorized ? auth.userId : undefined
    );
    if (!list) throw new CommunityError(404, 'unavailable');
    return communityResponse(list);
  } catch (error) {
    return communityFailure(error);
  }
}
export async function PATCH(request: Request, context: Context) {
  try {
    const auth = await requireAuth();
    if (!auth.authorized) return auth.response;
    const id = communityKey((await context.params).id);
    const data = communityObject(await readCommunityMutation(request));
    const revision = communityId(data.revision);
    if (data.action !== 'visibility' && data.action !== 'edit')
      throw new CommunityError(400, 'invalid');
    const list =
      data.action === 'visibility'
        ? await publishRecommendationList(
            auth.userId,
            id,
            revision,
            communityBoolean(data.published)
          )
        : await updateRecommendationList(
            auth.userId,
            id,
            revision,
            parseRecommendationList(data)
          );
    // Publicar la lista o sumarle la primera serie cuenta para el logro.
    awardAchievementsAfterResponse(auth.userId, ['publicLists']);
    return communityResponse(list);
  } catch (error) {
    return communityFailure(error);
  }
}
export async function DELETE(request: Request, context: Context) {
  try {
    assertCommunityOrigin(request);
    const auth = await requireAuth();
    if (!auth.authorized) return auth.response;
    await deleteRecommendationList(
      auth.userId,
      communityKey((await context.params).id)
    );
    return communityResponse({ ok: true });
  } catch (error) {
    return communityFailure(error);
  }
}
