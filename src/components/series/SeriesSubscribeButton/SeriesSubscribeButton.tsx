'use client';

import { useState } from 'react';
import { Tooltip } from 'antd';
import { BellOutlined, BellFilled } from '@ant-design/icons';
import { useSession, signIn } from 'next-auth/react';
import { useMessage } from '@/hooks/useMessage';
import './SeriesSubscribeButton.css';

interface SeriesSubscribeButtonProps {
  seriesId: number;
  initialSubscribed: boolean;
}

export function SeriesSubscribeButton({
  seriesId,
  initialSubscribed,
}: SeriesSubscribeButtonProps) {
  const { status } = useSession();
  const message = useMessage();
  const [subscribed, setSubscribed] = useState(initialSubscribed);
  const [loading, setLoading] = useState(false);

  if (status !== 'authenticated') {
    return (
      <Tooltip title="Inicia sesion para suscribirte a cambios">
        <button
          type="button"
          className="series-quick-actions__item series-subscribe-btn"
          onClick={() => signIn()}
          aria-label="Suscribirse"
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
      if (!res.ok) throw new Error('subscribe-failed');
      message.success(
        next ? 'Te avisaremos cuando haya novedades' : 'Suscripcion cancelada'
      );
    } catch {
      setSubscribed(!next);
      message.error('No pudimos actualizar la suscripcion');
    } finally {
      setLoading(false);
    }
  };

  const tooltip = subscribed
    ? 'Suscrito: cancelar avisos de esta serie'
    : 'Suscribirse para recibir avisos de cambios';

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
