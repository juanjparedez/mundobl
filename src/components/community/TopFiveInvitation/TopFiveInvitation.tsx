'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Alert, Button } from 'antd';
import { HeartOutlined } from '@ant-design/icons';
import { PanelCard } from '@/components/design-system';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { useCommunityAction } from '@/hooks/useCommunityAction';
import { communityFetch } from '@/lib/community-client';
import type { CommunityProfileSettings } from '@/types/community-library';
import './TopFiveInvitation.css';

export function TopFiveInvitation() {
  const { data: session, status } = useSession();
  const { t } = useLocale();
  const router = useRouter();
  const [eligibleUser, setEligibleUser] = useState<string | null>(null);
  const { busy, error, run } = useCommunityAction();
  const userId = session?.user?.id;
  useEffect(() => {
    if (status !== 'authenticated' || !userId) return;
    const controller = new AbortController();
    communityFetch<CommunityProfileSettings>(
      '/api/community/profile',
      'GET',
      undefined,
      controller.signal
    )
      .then((profile) => {
        if (!controller.signal.aborted)
          setEligibleUser(profile.promptEligible ? userId : null);
      })
      .catch(() => {
        /* An optional invitation never interrupts the main page. */
      });
    return () => controller.abort();
  }, [userId, status]);
  if (!userId || eligibleUser !== userId) return null;
  async function dismiss(choice: 'LATER' | 'DISMISSED') {
    await communityFetch('/api/community/profile', 'PATCH', {
      action: 'prompt',
      choice,
    });
    setEligibleUser(null);
  }
  return (
    <aside
      className="top-five-invitation"
      aria-label={t('communitySpace.topFive')}
    >
      <PanelCard variant="soft">
        <div className="top-five-invitation__layout">
          <HeartOutlined className="top-five-invitation__icon" aria-hidden />
          <div>
            <h2>{t('communitySpace.topFiveInvite')}</h2>
            <p>{t('communitySpace.topFiveHint')}</p>
            {error && <Alert type="error" title={error} />}
            <div className="top-five-invitation__actions">
              <Button
                type="primary"
                loading={busy}
                onClick={() =>
                  run(async () => {
                    const result = await communityFetch<{ id: string }>(
                      '/api/community/lists',
                      'POST',
                      {
                        title: t('communitySpace.topFive'),
                        description: '',
                        items: [],
                        kind: 'TOP_FIVE',
                      }
                    );
                    setEligibleUser(null);
                    router.push(`/comunidad/listas/${result.id}`);
                  })
                }
              >
                {t('communitySpace.topFive')}
              </Button>
              <Button
                type="text"
                disabled={busy}
                onClick={() => run(() => dismiss('LATER'))}
              >
                {t('communitySpace.later')}
              </Button>
              <Button
                type="text"
                disabled={busy}
                onClick={() => run(() => dismiss('DISMISSED'))}
              >
                {t('communitySpace.dismiss')}
              </Button>
            </div>
          </div>
        </div>
      </PanelCard>
    </aside>
  );
}
