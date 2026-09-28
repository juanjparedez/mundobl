'use client';
import Link from 'next/link';
import { StatCard } from '@/components/design-system';
import { useLocale } from '@/lib/providers/LocaleProvider';
import type { CommunityMetrics as Metrics } from '@/types/community';
import './CommunityMetrics.css';
export function CommunityMetrics({ metrics }: { metrics: Metrics }) {
  const { t, locale } = useLocale();
  const format = new Intl.NumberFormat(locale);
  return (
    <section
      className="community-metrics"
      aria-label={t('communitySpace.publicParticipation')}
    >
      <h2>{t('communitySpace.publicParticipation')}</h2>
      <p>{t('communitySpace.metricsHint')}</p>
      <div className="community-metrics__grid">
        <StatCard
          label={t('communityHub.conversations')}
          value={format.format(metrics.conversations)}
        />
        <StatCard
          label={t('communityHub.replies')}
          value={format.format(metrics.replies)}
        />
        <StatCard
          label={t('communitySpace.lists')}
          value={format.format(metrics.lists)}
        />
        <StatCard
          label={t('communitySpace.unansweredRequests')}
          value={format.format(metrics.unansweredRequests)}
        />
      </div>
      <Link href="/comunidad?view=unanswered">
        {t('communitySpace.helpSomeone')}
      </Link>
    </section>
  );
}
