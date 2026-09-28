'use client';
import { useState } from 'react';
import { Alert, Button, Switch } from 'antd';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { useCommunityAction } from '@/hooks/useCommunityAction';
import { communityFetch } from '@/lib/community-client';
import type { CommunityTopicDetail } from '@/types/community';
import './CommunityFollowControls.css';

export function CommunityFollowControls({
  topicId,
  initial,
  lastReplyId,
}: {
  topicId: number;
  initial: CommunityTopicDetail['follow'];
  lastReplyId?: number;
}) {
  const { t } = useLocale();
  const [follow, setFollow] = useState(initial);
  const [readReplyId, setReadReplyId] = useState<number>();
  const { busy, error, run } = useCommunityAction();
  function update(next: CommunityTopicDetail['follow']) {
    void run(async () => {
      await communityFetch(`/api/community/topics/${topicId}/follow`, 'PATCH', {
        following: next !== null,
        notify: next?.notify ?? false,
        muted: next?.muted ?? false,
      });
      setFollow(next);
    });
  }
  return (
    <div className="community-follow">
      {error && <Alert type="error" title={error} showIcon />}
      <div className="community-follow__controls">
        <Button
          disabled={busy}
          onClick={() =>
            update(follow ? null : { notify: false, muted: false })
          }
        >
          {t(follow ? 'communitySpace.unfollow' : 'communitySpace.follow')}
        </Button>
        {follow && (
          <>
            <label className="community-follow__option">
              <Switch
                checked={follow.notify}
                disabled={busy}
                aria-label={t('communitySpace.notifyReplies')}
                onChange={(notify) => update({ ...follow, notify })}
              />
              {t('communitySpace.notifyReplies')}
            </label>
            {lastReplyId && (
              <Button
                disabled={busy || readReplyId === lastReplyId}
                onClick={() =>
                  void run(async () => {
                    await communityFetch(
                      `/api/community/topics/${topicId}/follow`,
                      'PATCH',
                      { action: 'read', replyId: lastReplyId }
                    );
                    setReadReplyId(lastReplyId);
                  })
                }
              >
                {t('communitySpace.markRead')}
              </Button>
            )}
            <label className="community-follow__option">
              <Switch
                checked={follow.muted}
                disabled={busy}
                aria-label={t('communitySpace.mute')}
                onChange={(muted) => update({ ...follow, muted })}
              />
              {t('communitySpace.mute')}
            </label>
          </>
        )}
      </div>
      <p className="community-follow__hint">{t('communitySpace.followHint')}</p>
    </div>
  );
}
