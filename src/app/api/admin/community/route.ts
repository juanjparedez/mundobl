import { requireRole } from '@/lib/auth-helpers';
import {
  getCommunityModerationQueue,
  getCommunitySettings,
  moderateCommunityReport,
  saveCommunitySettings,
} from '@/lib/database';
import {
  CommunityError,
  communityId,
  communityObject,
  communityText,
} from '@/lib/community-input';
import { communityBoolean, communityKey } from '@/lib/community-library-input';
import {
  readCommunityMutation,
  communityResponse,
  communityFailure,
} from '@/lib/community-response';

export async function GET(request: Request) {
  try {
    const auth = await requireRole(['ADMIN', 'MODERATOR']);
    if (!auth.authorized) return auth.response;
    const query = new URL(request.url).searchParams;
    const [queue, settings] = await Promise.all([
      getCommunityModerationQueue(
        auth.userId,
        communityId(query.get('page') ?? '1'),
        query.get('resolved') === 'true'
      ),
      getCommunitySettings(),
    ]);
    return communityResponse({
      ...queue,
      settings,
      canConfigure: auth.role === 'ADMIN',
    });
  } catch (error) {
    return communityFailure(error);
  }
}
export async function PATCH(request: Request) {
  try {
    const auth = await requireRole(['ADMIN', 'MODERATOR']);
    if (!auth.authorized) return auth.response;
    const data = communityObject(await readCommunityMutation(request));
    if (data.action === 'settings') {
      if (auth.role !== 'ADMIN') throw new CommunityError(403, 'unavailable');
      await saveCommunitySettings(auth.userId, {
        conversationsEnabled: communityBoolean(data.conversationsEnabled),
        listsEnabled: communityBoolean(data.listsEnabled),
        profilesEnabled: communityBoolean(data.profilesEnabled),
        promptEnabled: communityBoolean(data.promptEnabled),
      });
    } else {
      const action = (['HIDE', 'RESTORE', 'RESOLVE', 'DISMISS'] as const).find(
        (value) => value === data.action
      );
      if (!action) throw new CommunityError(400, 'invalid');
      await moderateCommunityReport(
        auth.userId,
        communityKey(data.reportId),
        action,
        communityText(data.reason, 5, 1000)
      );
    }
    return communityResponse({ ok: true });
  } catch (error) {
    return communityFailure(error);
  }
}
