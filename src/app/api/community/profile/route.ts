import { requireAuth } from '@/lib/auth-helpers';
import {
  getCommunityProfileSettings,
  saveCommunityProfile,
  setCommunityPrompt,
} from '@/lib/database';
import { CommunityError, communityObject } from '@/lib/community-input';
import { parseCommunityProfile } from '@/lib/community-library-input';
import {
  readCommunityMutation,
  communityResponse,
  communityFailure,
} from '@/lib/community-response';

export async function GET() {
  try {
    const auth = await requireAuth();
    if (!auth.authorized) return auth.response;
    return communityResponse(await getCommunityProfileSettings(auth.userId));
  } catch (error) {
    return communityFailure(error);
  }
}
export async function PATCH(request: Request) {
  try {
    const auth = await requireAuth();
    if (!auth.authorized) return auth.response;
    const data = communityObject(await readCommunityMutation(request));
    if (data.action === 'prompt') {
      if (data.choice !== 'LATER' && data.choice !== 'DISMISSED')
        throw new CommunityError(400, 'invalid');
      await setCommunityPrompt(auth.userId, data.choice);
      return communityResponse({ ok: true });
    }
    if (data.action !== 'profile') throw new CommunityError(400, 'invalid');
    return communityResponse(
      await saveCommunityProfile(auth.userId, parseCommunityProfile(data))
    );
  } catch (error) {
    return communityFailure(error);
  }
}
