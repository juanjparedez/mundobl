'use client';

import { useEffect, useState } from 'react';
import { Tooltip } from 'antd';
import { BellOutlined, BellFilled } from '@ant-design/icons';
import { useSession, signIn } from 'next-auth/react';
import { useMessage } from '@/hooks/useMessage';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { useSeriesUserStatus } from '../SeriesUserStatusProvider';
import './SeriesSubscribeButton.css';

interface SeriesSubscribeButtonProps {
  seriesId: number;
}

// El estado inicial de suscripcion ya no llega como prop calculada en el
// servidor con `await auth()` (/series/[id] dejo de llamarla): se hidrata
// aca via SeriesUserStatusProvider. Fuera de esa pagina (p.ej. /ver/[id])
// no hay Provider ancestro y el context cae al default `subscribed: false`
// — misma semantica que ese caller ya usaba antes (hardcodeaba `false`).
export function SeriesSubscribeButton({
  seriesId,
}: SeriesSubscribeButtonProps) {
  const { t } = useLocale();
  const { status } = useSession();
  const message = useMessage();
  const { subscribed: initialSubscribed, loaded } = useSeriesUserStatus();
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (loaded) setSubscribed(initialSubscribed);
  }, [loaded, initialSubscribed]);

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
