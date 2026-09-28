import { requireAuth } from '@/lib/auth-helpers';
import {
  getCommunityTopic,
  manageCommunityTopic,
  editCommunityTopic,
} from '@/lib/database';
import {
  CommunityError,
  communityId,
  communityObject,
  communityText,
  parseCommunityTopic,
} from '@/lib/community-input';
import { communityBoolean } from '@/lib/community-library-input';
import {
  readCommunityMutation,
  assertCommunityOrigin,
  communityResponse,
  communityFailure,
} from '@/lib/community-response';
type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: Context) {
  try {
    const id = communityId((await context.params).id);
    const page = communityId(
      new URL(request.url).searchParams.get('page') ?? '1'
    );
    const auth = await requireAuth();
    const topic = await getCommunityTopic(
      id,
      page,
      auth.authorized ? auth.userId : undefined
    );
    if (!topic) throw new CommunityError(404, 'unavailable');
    return communityResponse(topic);
  } catch (error) {
    return communityFailure(error);
  }
}
export async function PATCH(request: Request, context: Context) {
  try {
    const auth = await requireAuth();
    if (!auth.authorized) return auth.response;
    const data = communityObject(await readCommunityMutation(request));
    const id = communityId((await context.params).id);
    if (data.action === 'edit' || data.action === 'visibility') {
      await editCommunityTopic(
        auth.userId,
        id,
        communityText(data.updatedAt, 1, 40),
        data.action === 'edit'
          ? { input: parseCommunityTopic(data) }
          : { published: communityBoolean(data.published) }
      );
      return communityResponse(await getCommunityTopic(id, 1, auth.userId));
    }
    if (typeof data.closed !== 'boolean')
      throw new CommunityError(400, 'invalid');
    await manageCommunityTopic(id, auth.userId, data.closed);
    return communityResponse({ ok: true });
  } catch (error) {
    return communityFailure(error);
  }
}
export async function DELETE(request: Request, context: Context) {
  try {
    assertCommunityOrigin(request);
    const auth = await requireAuth();
    if (!auth.authorized) return auth.response;
    await manageCommunityTopic(
      communityId((await context.params).id),
      auth.userId
    );
    return communityResponse({ ok: true });
  } catch (error) {
    return communityFailure(error);
  }
}
