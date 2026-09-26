'use client';

import { useEffect, useState } from 'react';
import { BellOutlined, BellFilled } from '@ant-design/icons';
import { useSession, signIn } from 'next-auth/react';
import { useMessage } from '@/hooks/useMessage';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { IconToggle } from '@/components/design-system';
import { useSeriesUserStatus } from '../SeriesUserStatusProvider';

interface SeriesSubscribeButtonProps {
  seriesId: number;
}

// El estado de suscripcion se hidrata via SeriesUserStatusProvider, que
// montan la ficha y /ver/[id] (ninguna de las dos llama `await auth()`).
export function SeriesSubscribeButton({
  seriesId,
}: SeriesSubscribeButtonProps) {
  const { t } = useLocale();
  const { status } = useSession();
  const message = useMessage();
  const {
    subscribed: initialSubscribed,
    loaded,
    version,
  } = useSeriesUserStatus();
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (loaded) setSubscribed(initialSubscribed);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-sembrar en cada version (refetch), no solo cuando cambia initialSubscribed/loaded en si
  }, [version]);

  if (status !== 'authenticated') {
    return (
      <IconToggle
        label={t('seriesSubscribeButton.signInTooltip')}
        icon={<BellOutlined />}
        onClick={() =>
          void signIn('google', {
            callbackUrl: window.location.pathname + window.location.search,
          })
        }
      />
    );
  }

  const handleToggle = async () => {
    if (loading) return;
    const next = !subscribed;
    setLoading(true);
    setSubscribed(next);
    try {
      const res = await fetch(`/api/series/${seriesId}/subscribe`, {
        method: next ? 'POST' : 'DELETE',
      });
      if (!res.ok)
        throw new Error(t('seriesSubscribeButton.subscribeFailedError'));
      message.success(
        next
          ? t('seriesSubscribeButton.subscribeSuccessMessage')
          : t('seriesSubscribeButton.unsubscribeSuccessMessage')
      );
    } catch {
      setSubscribed(!next);
      message.error(t('seriesSubscribeButton.updateSubscriptionErrorMessage'));
    } finally {
      setLoading(false);
    }
  };

  const tooltip = subscribed
    ? t('seriesSubscribeButton.subscribedTooltip')
    : t('seriesSubscribeButton.unsubscribedTooltip');

  return (
    <IconToggle
      label={tooltip}
      icon={subscribed ? <BellFilled /> : <BellOutlined />}
      pressed={subscribed}
      disabled={loading}
      onClick={() => void handleToggle()}
    />
  );
}
