import { requireAuth } from '@/lib/auth-helpers';
import { getPublicCommunityProfile } from '@/lib/database';
import { CommunityError, communityId } from '@/lib/community-input';
import { communityKey } from '@/lib/community-library-input';
import { communityResponse, communityFailure } from '@/lib/community-response';

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth();
    const profile = await getPublicCommunityProfile(
      communityKey((await context.params).id),
      auth.authorized ? auth.userId : undefined,
      communityId(new URL(request.url).searchParams.get('page') ?? '1')
    );
    if (!profile) throw new CommunityError(404, 'unavailable');
    return communityResponse(profile);
  } catch (error) {
    return communityFailure(error);
  }
}
