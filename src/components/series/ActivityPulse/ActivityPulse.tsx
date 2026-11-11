'use client';

import { useEffect } from 'react';
import { EyeOutlined, FireOutlined } from '@ant-design/icons';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { useSeriesPageStats } from '@/hooks/useSeriesPageStats';
import { recordSeriesVisit } from '@/lib/activity-beacon';
import './ActivityPulse.css';

interface ActivityPulseProps {
  seriesId: number;
  /** En la ficha: cuenta esta apertura como visita (/ver cuenta la suya). */
  countVisit?: boolean;
}

/**
 * "1.234 visitas · 23 capitulos vistos esta semana": actividad real y
 * anonima (series-activity.ts). Debajo del minimo cada dato no se muestra.
 */
export function ActivityPulse({
  seriesId,
  countVisit = false,
}: ActivityPulseProps) {
  const { t, locale } = useLocale();
  const stats = useSeriesPageStats(seriesId);
  useEffect(() => {
    if (countVisit) recordSeriesVisit(seriesId, 'series_view');
  }, [seriesId, countVisit]);
  if (!stats || (stats.views === null && stats.chapters === null)) return null;
  const format = (n: number) => n.toLocaleString(locale);
  return (
    <span className="activity-pulse">
      {stats.views !== null && (
        <span className="activity-pulse__item">
          <EyeOutlined aria-hidden />{' '}
          {t('tracking.pageViews', { n: format(stats.views) })}
        </span>
      )}
      {stats.chapters !== null && (
        <span className="activity-pulse__item activity-pulse__item--hot">
          <FireOutlined aria-hidden />{' '}
          {t('tracking.activityThisWeek', { n: format(stats.chapters) })}
        </span>
      )}
    </span>
  );
}
