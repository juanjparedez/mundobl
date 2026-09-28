import { requireAuth } from '@/lib/auth-helpers';
import {
  createRecommendationList,
  getRecommendationLists,
} from '@/lib/database';
import {
  CommunityError,
  communityId,
  communityObject,
} from '@/lib/community-input';
import { parseRecommendationList } from '@/lib/community-library-input';
import {
  readCommunityMutation,
  communityResponse,
  communityFailure,
} from '@/lib/community-response';

export async function GET(request: Request) {
  try {
    const auth = await requireAuth();
    const query = new URL(request.url).searchParams;
    const mine = query.get('mine') === 'true';
    if (mine && !auth.authorized) return auth.response;
    return communityResponse(
      await getRecommendationLists({
        viewerId: auth.authorized ? auth.userId : undefined,
        mine,
        search: query.get('q') ?? '',
        page: communityId(query.get('page') ?? '1'),
      })
    );
  } catch (error) {
    return communityFailure(error);
  }
}
export async function POST(request: Request) {
  try {
    const auth = await requireAuth();
    if (!auth.authorized) return auth.response;
    const data = communityObject(await readCommunityMutation(request));
    if (
      data.kind !== undefined &&
      data.kind !== 'STANDARD' &&
      data.kind !== 'TOP_FIVE'
    )
      throw new CommunityError(400, 'invalid');
    return communityResponse(
      await createRecommendationList(
        auth.userId,
        parseRecommendationList(data),
        data.kind ?? 'STANDARD'
      ),
      201
    );
  } catch (error) {
    return communityFailure(error);
  }
}
