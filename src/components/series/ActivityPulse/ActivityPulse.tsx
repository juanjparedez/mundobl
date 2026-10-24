'use client';

import { useEffect, useState } from 'react';
import { FireOutlined } from '@ant-design/icons';
import { useLocale } from '@/lib/providers/LocaleProvider';
import './ActivityPulse.css';

interface ActivityPulseProps {
  seriesId: number;
}

/**
 * "23 capitulos vistos en MundoBL esta semana": actividad real y anonima
 * (series-activity.ts). Debajo del minimo no se muestra nada.
 */
export function ActivityPulse({ seriesId }: ActivityPulseProps) {
  const { t } = useLocale();
  const [chapters, setChapters] = useState<number | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/series/${seriesId}/activity`, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { chapters?: number | null } | null) => {
        setChapters(typeof data?.chapters === 'number' ? data.chapters : null);
      })
      .catch(() => null);
    return () => controller.abort();
  }, [seriesId]);

  if (chapters === null) return null;
  return (
    <span className="activity-pulse">
      <FireOutlined aria-hidden />{' '}
      {t('tracking.activityThisWeek', { n: chapters })}
    </span>
  );
}
