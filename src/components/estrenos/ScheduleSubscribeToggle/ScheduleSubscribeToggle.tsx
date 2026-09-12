'use client';

import { useState } from 'react';
import { Tooltip } from 'antd';
import { BellOutlined, BellFilled } from '@ant-design/icons';
import { useLocale } from '@/lib/providers/LocaleProvider';
import './ScheduleSubscribeToggle.css';

export interface ScheduleSubscribeToggleProps {
  seriesId: number;
  subscribed: boolean;
  onChange: (subscribed: boolean) => void;
}

/**
 * Campanita de "avisame" sobre una card de la parrilla.
 *
 * Por que no reusa `SeriesSubscribeButton`: ese depende de `SeriesUserStatusProvider`,
 * que es per-serie. Fuera de /series/[id] no hay provider, asi que cae al default
 * `subscribed: false` — en una parrilla de 38 series serian 38 campanitas mintiendo
 * sobre el estado real. Este toggle recibe el estado del fetch unico de la vista.
 *
 * Hoy las suscripciones solo alimentan la notificacion in-app y el push que ya
 * existen; el aviso automatico de capitulo nuevo todavia no esta cableado (ver
 * context.md). Por eso el texto dice "avisarme de esta serie" y no promete
 * un aviso semanal que no mandamos.
 */
export function ScheduleSubscribeToggle({
  seriesId,
  subscribed,
  onChange,
}: ScheduleSubscribeToggleProps) {
  const { t } = useLocale();
  const [saving, setSaving] = useState(false);

  const toggle = async () => {
    if (saving) return;
    const next = !subscribed;
    setSaving(true);
    // Optimista: la campanita responde ya y se revierte si el server dice que no.
    onChange(next);
    try {
      const res = await fetch(`/api/series/${seriesId}/subscribe`, {
        method: next ? 'POST' : 'DELETE',
      });
      if (!res.ok) onChange(!next);
    } catch {
      onChange(!next);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Tooltip
      title={
        subscribed
          ? t('estrenos.unsubscribeTooltip')
          : t('estrenos.subscribeTooltip')
      }
    >
      <button
        type="button"
        className={`schedule-subscribe${
          subscribed ? ' schedule-subscribe--on' : ''
        }`}
        onClick={toggle}
        disabled={saving}
        aria-pressed={subscribed}
        aria-label={
          subscribed
            ? t('estrenos.unsubscribeTooltip')
            : t('estrenos.subscribeTooltip')
        }
      >
        {subscribed ? <BellFilled /> : <BellOutlined />}
      </button>
    </Tooltip>
  );
}
