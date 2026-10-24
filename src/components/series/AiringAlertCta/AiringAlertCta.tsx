'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from 'antd';
import {
  BellOutlined,
  CheckCircleOutlined,
  MailOutlined,
} from '@ant-design/icons';
import { signIn, useSession } from 'next-auth/react';
import { useMessage } from '@/hooks/useMessage';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { recordSeriesActivity } from '@/lib/activity-beacon';
import { savePendingAlert, takePendingAlert } from '@/lib/pending-alert';
import { useWeeklyScheduleLabels } from '@/components/estrenos/WeeklySchedule/useWeeklyScheduleLabels';
import { useSeriesUserStatus } from '../SeriesUserStatusProvider';
import './AiringAlertCta.css';

interface AiringAlertCtaProps {
  seriesId: number;
  /** Dias de emision (0 = domingo). Vacio = la serie no esta en emision. */
  airWeekdays: number[];
}

type Phase = 'offer' | 'email' | 'done' | 'hidden';

/**
 * "Avisame cuando salga el proximo capitulo", solo en series en emision.
 *
 * Por que: casi todo el seguimiento pasa en la primera hora y despues nadie
 * vuelve, porque los avisos de capitulo dependian de que alguien subiera el
 * video. Este boton junta la cuenta (Google) con la suscripcion, y el cron de
 * alertas avisa el dia de estreno segun `Series.airDays`. Despues ofrece,
 * una vez, el resumen semanal por mail: el opt-in sigue siendo explicito.
 *
 * Cuenta su propio embudo (alert_offer / alert_click / alert_on) con los
 * contadores anonimos de series-activity: sin usuario, IP ni cookie.
 */
export function AiringAlertCta({ seriesId, airWeekdays }: AiringAlertCtaProps) {
  const { t, locale } = useLocale();
  const { weekdays } = useWeeklyScheduleLabels();
  const { status: sessionStatus } = useSession();
  const { subscribed, loaded, refetch } = useSeriesUserStatus();
  const message = useMessage();
  const [phase, setPhase] = useState<Phase>('hidden');
  const [busy, setBusy] = useState(false);
  const pendingCheckedRef = useRef(false);
  const offerCountedRef = useRef(false);

  const days = new Intl.ListFormat(locale, { type: 'conjunction' }).format(
    airWeekdays.map((day) => weekdays[day])
  );

  const activate = async (): Promise<void> => {
    setBusy(true);
    try {
      const res = await fetch(`/api/series/${seriesId}/subscribe`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('subscribe');
      recordSeriesActivity(seriesId, 'alert_on');
      void refetch();
      const prefs = await fetch('/api/notifications/prefs')
        .then((r) =>
          r.ok ? (r.json() as Promise<{ emailEnabled?: boolean }>) : null
        )
        .catch(() => null);
      setPhase(prefs?.emailEnabled ? 'done' : 'email');
    } catch {
      message.error(t('airingAlert.error'));
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (sessionStatus === 'loading' || !loaded || airWeekdays.length === 0)
      return;
    // Vuelta del login con el aviso pedido: se aplica una sola vez.
    if (sessionStatus === 'authenticated' && !pendingCheckedRef.current) {
      pendingCheckedRef.current = true;
      if (takePendingAlert(seriesId)) {
        void activate();
        return;
      }
    }
    setPhase((current) =>
      current === 'hidden' || current === 'offer'
        ? subscribed
          ? 'hidden'
          : 'offer'
        : current
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- activate cambia en cada render; el guard es pendingCheckedRef
  }, [sessionStatus, loaded, subscribed, seriesId, airWeekdays.length]);

  useEffect(() => {
    if (phase !== 'offer' || offerCountedRef.current) return;
    offerCountedRef.current = true;
    recordSeriesActivity(seriesId, 'alert_offer');
  }, [phase, seriesId]);

  if (phase === 'hidden') return null;

  const handleOffer = () => {
    recordSeriesActivity(seriesId, 'alert_click');
    if (sessionStatus !== 'authenticated') {
      savePendingAlert(seriesId);
      void signIn('google', {
        callbackUrl: window.location.pathname + window.location.search,
      });
      return;
    }
    void activate();
  };

  const handleEmail = async () => {
    setBusy(true);
    try {
      const res = await fetch('/api/notifications/prefs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailEnabled: true }),
      });
      if (!res.ok) throw new Error('prefs');
      message.success(t('airingAlert.emailDone'));
      setPhase('done');
    } catch {
      message.error(t('airingAlert.error'));
    } finally {
      setBusy(false);
    }
  };

  if (phase === 'done') {
    return (
      <aside className="airing-alert airing-alert--done" aria-live="polite">
        <p className="airing-alert__title">
          <CheckCircleOutlined aria-hidden /> {t('airingAlert.done', { days })}
        </p>
      </aside>
    );
  }

  if (phase === 'email') {
    return (
      <aside className="airing-alert" aria-live="polite">
        <p className="airing-alert__title">
          <CheckCircleOutlined aria-hidden /> {t('airingAlert.done', { days })}
        </p>
        <p className="airing-alert__body">{t('airingAlert.emailOffer')}</p>
        <div className="airing-alert__actions">
          <Button
            icon={<MailOutlined />}
            loading={busy}
            onClick={() => void handleEmail()}
          >
            {t('airingAlert.emailAction')}
          </Button>
          <Button type="text" onClick={() => setPhase('done')}>
            {t('airingAlert.emailSkip')}
          </Button>
        </div>
      </aside>
    );
  }

  return (
    <aside className="airing-alert" aria-label={t('airingAlert.action')}>
      <p className="airing-alert__title">
        <BellOutlined aria-hidden /> {t('airingAlert.schedule', { days })}
      </p>
      <p className="airing-alert__body">{t('airingAlert.body')}</p>
      <div className="airing-alert__actions">
        <Button type="primary" loading={busy} onClick={handleOffer}>
          {t('airingAlert.action')}
        </Button>
        {sessionStatus !== 'authenticated' && (
          <span className="airing-alert__hint">
            {t('airingAlert.loginHint')}
          </span>
        )}
      </div>
    </aside>
  );
}
