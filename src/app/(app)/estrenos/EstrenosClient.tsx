'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from 'antd';
import { CalendarOutlined } from '@ant-design/icons';
import { PageTitle } from '@/components/common/PageTitle/PageTitle';
import { EmptyState } from '@/components/design-system';
import { WeeklySchedule } from '@/components/estrenos/WeeklySchedule/WeeklySchedule';
import { useWeeklyScheduleLabels } from '@/components/estrenos/WeeklySchedule/useWeeklyScheduleLabels';
import { ScheduleSubscribeToggle } from '@/components/estrenos/ScheduleSubscribeToggle/ScheduleSubscribeToggle';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { ROUTES } from '@/constants/navigation';
import type { AiringScheduleRow } from '@/lib/database';

interface EstrenosClientProps {
  rows: AiringScheduleRow[];
}

export function EstrenosClient({ rows }: EstrenosClientProps) {
  const { t } = useLocale();
  const labels = useWeeklyScheduleLabels();

  // Un solo fetch para las N series de la parrilla, en vez de que cada campanita
  // pregunte por la suya. Sin sesion el endpoint responde 401 y el set queda
  // vacio: las campanitas no se renderizan.
  const [subscribed, setSubscribed] = useState<Set<number> | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/user/subscriptions')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { seriesIds: number[] } | null) => {
        if (!cancelled && data) setSubscribed(new Set(data.seriesIds));
      })
      .catch(() => {
        /* sin sesion o sin red: la parrilla se muestra igual, sin campanitas */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const renderCardAction = useCallback(
    (seriesId: number) =>
      subscribed === null ? null : (
        <ScheduleSubscribeToggle
          seriesId={seriesId}
          subscribed={subscribed.has(seriesId)}
          onChange={(next) =>
            setSubscribed((prev) => {
              const copy = new Set(prev ?? []);
              if (next) copy.add(seriesId);
              else copy.delete(seriesId);
              return copy;
            })
          }
        />
      ),
    [subscribed]
  );

  return (
    <div className="estrenos-content">
      <PageTitle
        title={t('estrenos.title')}
        subtitle={t('estrenos.subtitle')}
      />

      {rows.length === 0 ? (
        <EmptyState
          icon={<CalendarOutlined />}
          title={t('estrenos.emptyTitle')}
          description={t('estrenos.emptyDescription')}
          action={
            <Link href={ROUTES.CATALOGO}>
              <Button type="primary">{t('estrenos.emptyAction')}</Button>
            </Link>
          }
        />
      ) : (
        <>
          <WeeklySchedule
            rows={rows}
            labels={labels}
            renderCardAction={renderCardAction}
          />
          <p className="estrenos-disclaimer">{t('estrenos.disclaimer')}</p>
        </>
      )}
    </div>
  );
}
