import { requireAuth } from '@/lib/auth-helpers';
import { getCommunityTopic, manageCommunityTopic } from '@/lib/database';
import {
  CommunityError,
  communityId,
  communityObject,
} from '@/lib/community-input';
import { communityResponse, communityFailure } from '@/lib/community-response';
type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: Context) {
  try {
    const id = communityId((await context.params).id);
    const page = communityId(
      new URL(request.url).searchParams.get('page') ?? '1'
    );
    const topic = await getCommunityTopic(id, page);
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
    const data = communityObject(await request.json());
    if (typeof data.closed !== 'boolean')
      throw new CommunityError(400, 'invalid');
    await manageCommunityTopic(
      communityId((await context.params).id),
      auth.userId,
      ['ADMIN', 'MODERATOR'].includes(auth.role),
      data.closed
    );
    return communityResponse({ ok: true });
  } catch (error) {
    return communityFailure(error);
  }
}
export async function DELETE(_request: Request, context: Context) {
  try {
    const auth = await requireAuth();
    if (!auth.authorized) return auth.response;
    await manageCommunityTopic(
      communityId((await context.params).id),
      auth.userId,
      ['ADMIN', 'MODERATOR'].includes(auth.role)
    );
    return communityResponse({ ok: true });
  } catch (error) {
    return communityFailure(error);
  }
}
