'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { RiseOutlined, TrophyOutlined } from '@ant-design/icons';
import { PanelCard } from '@/components/design-system';
import type { TrackingInsights } from '@/lib/tracking-insights';
import type { OwnRankingPosition } from '@/lib/community-ranking';
import './MonthlyRecap.css';

interface MonthlyRecapProps {
  labels: {
    title: string;
    summary: (chapters: number, hours: number, finished: number) => string;
    previous: (chapters: number) => string;
    top: (title: string) => string;
    rank: (rank: number, ranked: number, count: number) => string;
    link: string;
  };
}

/**
 * Resumen de los ultimos 30 dias arriba de Mi seguimiento. Los datos ya
 * existian en /perfil/estadisticas, pero ahi casi nadie entra: aca se ve
 * cada vez que alguien vuelve a seguir una serie.
 */
export function MonthlyRecap({ labels }: MonthlyRecapProps) {
  const [insights, setInsights] = useState<TrackingInsights | null>(null);
  const [rank, setRank] = useState<
    (OwnRankingPosition & { staff: boolean }) | null
  >(null);

  useEffect(() => {
    const controller = new AbortController();
    const get = <T,>(url: string, set: (value: T) => void) =>
      fetch(url, { signal: controller.signal, cache: 'no-store' })
        .then((response) => (response.ok ? response.json() : null))
        .then((data: T | null) => {
          if (data) set(data);
        })
        .catch(() => null);
    void get<TrackingInsights>('/api/user/tracking-stats?days=30', setInsights);
    void get<OwnRankingPosition & { staff: boolean }>(
      '/api/user/ranking',
      setRank
    );
    return () => controller.abort();
  }, []);

  if (
    !insights ||
    (insights.current.chapters === 0 && insights.previous.chapters === 0)
  )
    return null;

  const { current, previous } = insights;
  const top = insights.rows.find((row) => row.chapters > 0);
  return (
    <PanelCard className="monthly-recap">
      <h2 className="monthly-recap__title">{labels.title}</h2>
      <p className="monthly-recap__summary">
        {labels.summary(
          current.chapters,
          Math.round(current.minutes / 60),
          current.series
        )}
      </p>
      <p className="monthly-recap__line">
        <RiseOutlined aria-hidden /> {labels.previous(previous.chapters)}
      </p>
      {top && <p className="monthly-recap__line">{labels.top(top.title)}</p>}
      {rank && !rank.staff && rank.rank !== null && (
        <p className="monthly-recap__line">
          <TrophyOutlined aria-hidden />{' '}
          <Link href="/estadisticas">
            {labels.rank(rank.rank, rank.ranked, rank.count)}
          </Link>
        </p>
      )}
      <Link href="/perfil/estadisticas" className="monthly-recap__link">
        {labels.link}
      </Link>
    </PanelCard>
  );
}
