import { requireAuth } from '@/lib/auth-helpers';
import {
  replyToCommunityTopic,
  deleteCommunityReply,
  getCommunityReplyRecipients,
} from '@/lib/database';
import {
  communityId,
  communityObject,
  communityText,
} from '@/lib/community-input';
import {
  readCommunityMutation,
  assertCommunityOrigin,
  communityResponse,
  communityFailure,
} from '@/lib/community-response';
import { notifyUser } from '@/lib/notifications';
import { loadLocaleMessages } from '@/i18n/messages';
type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context) {
  try {
    const auth = await requireAuth();
    if (!auth.authorized) return auth.response;
    const id = communityId((await context.params).id);
    const data = communityObject(await readCommunityMutation(request));
    const reply = await replyToCommunityTopic(
      id,
      auth.userId,
      communityText(data.body, 1, 5000),
      data.hasSpoilers === true,
      data.recommendedSeriesId == null
        ? null
        : communityId(data.recommendedSeriesId)
    );
    try {
      const recipients = await getCommunityReplyRecipients(
        id,
        reply.id,
        auth.userId
      );
      const { communityHub } = await loadLocaleMessages('es');
      await Promise.all(
        recipients.map((userId) =>
          notifyUser({
            userId,
            type: 'comment_thread',
            title: communityHub.replyNotification,
            linkPath: `/comunidad/${id}`,
            refType: 'community_reply',
            refId: id,
          }).catch((error) =>
            console.error('Community notification failed', error)
          )
        )
      );
    } catch (error) {
      console.error('Community recipient lookup failed', error);
    }
    return communityResponse({ id: reply.id }, 201);
  } catch (error) {
    return communityFailure(error);
  }
}
export async function DELETE(request: Request, context: Context) {
  try {
    assertCommunityOrigin(request);
    const auth = await requireAuth();
    if (!auth.authorized) return auth.response;
    await deleteCommunityReply(
      communityId((await context.params).id),
      communityId(new URL(request.url).searchParams.get('replyId')),
      auth.userId
    );
    return communityResponse({ ok: true });
  } catch (error) {
    return communityFailure(error);
  }
}
