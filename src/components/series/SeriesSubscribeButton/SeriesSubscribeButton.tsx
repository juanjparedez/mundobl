'use client';

import { useState } from 'react';
import { Tooltip } from 'antd';
import { BellOutlined, BellFilled } from '@ant-design/icons';
import { useSession, signIn } from 'next-auth/react';
import { useMessage } from '@/hooks/useMessage';
import { useLocale } from '@/lib/providers/LocaleProvider';
import './SeriesSubscribeButton.css';

interface SeriesSubscribeButtonProps {
  seriesId: number;
  initialSubscribed: boolean;
}

export function SeriesSubscribeButton({
  seriesId,
  initialSubscribed,
}: SeriesSubscribeButtonProps) {
  const { t } = useLocale();
  const { status } = useSession();
  const message = useMessage();
  const [subscribed, setSubscribed] = useState(initialSubscribed);
  const [loading, setLoading] = useState(false);

  if (status !== 'authenticated') {
    return (
      <Tooltip title={t('seriesSubscribeButton.signInTooltip')}>
        <button
          type="button"
          className="series-quick-actions__item series-subscribe-btn"
          onClick={() => signIn()}
          aria-label={t('seriesSubscribeButton.subscribeAriaLabel')}
        >
          <BellOutlined />
        </button>
      </Tooltip>
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
      if (!res.ok) throw new Error(t('seriesSubscribeButton.subscribeFailedError'));
      message.success(
        next ? t('seriesSubscribeButton.subscribeSuccessMessage') : t('seriesSubscribeButton.unsubscribeSuccessMessage')
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
    <Tooltip title={tooltip}>
      <button
        type="button"
        className={`series-quick-actions__item series-subscribe-btn${
          subscribed ? ' series-subscribe-btn--active' : ''
        }`}
        onClick={handleToggle}
        disabled={loading}
        aria-label={tooltip}
        aria-pressed={subscribed}
      >
        {subscribed ? <BellFilled /> : <BellOutlined />}
      </button>
    </Tooltip>
  );
}