'use client';
import { CommunityNavigation } from '@/components/community/CommunityNavigation/CommunityNavigation';
import { CommunityMetrics } from '@/components/community/CommunityMetrics/CommunityMetrics';
import { TopFiveInvitation } from '@/components/community/TopFiveInvitation/TopFiveInvitation';
import type { CommunityMetrics as Metrics } from '@/types/community';
import Link from 'next/link';
import { useState } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { Input, Button } from 'antd';
import {
  SearchOutlined,
  CommentOutlined,
  StarOutlined,
  CompassOutlined,
} from '@ant-design/icons';
import { EmptyState } from '@/components/design-system';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { getCommunityUrl, getCommunityReviewUrl } from '@/lib/community-url';
import { CommunityCard } from '@/components/community/CommunityCard/CommunityCard';
import { CommunityComposer } from '@/components/community/CommunityComposer/CommunityComposer';
import {
  COMMUNITY_KINDS,
  type CommunityKind,
  type CommunityTopicItem,
  type CommunityReviewItem,
  type CommunityFilter,
} from '@/types/community';
import './CommunityFeed.css';

export function CommunityFeed({
  items,
  topics = [],
  view = 'all',
  page = 1,
  hasNext = false,
  search = '',
  context,
  metrics,
}: {
  items: CommunityReviewItem[];
  topics?: CommunityTopicItem[];
  view?: CommunityFilter | 'reviews';
  page?: number;
  hasNext?: boolean;
  search?: string;
  metrics?: Metrics;
  context?: {
    series: { id: number; title: string };
    episodeId?: number;
    episode?: { seasonNumber: number; episodeNumber: number };
  };
}) {
  const { t, locale } = useLocale();
  const { data: session, status } = useSession();
  const [compose, setCompose] = useState<CommunityKind | null>(null);
  const scope = context
    ? { seriesId: context.series.id, episodeId: context.episodeId }
    : undefined;
  const icons = [
    <CommentOutlined key="discussion" aria-hidden />,
    <StarOutlined key="review" aria-hidden />,
    <CompassOutlined key="recommendation" aria-hidden />,
  ];
  function start(kind: CommunityKind) {
    if (status === 'loading') return;
    if (!session?.user) {
      void signIn('google', { callbackUrl: window.location.href });
      return;
    }
    setCompose(kind);
  }
  return (
    <section className="community-feed">
      <CommunityNavigation active="conversations" />
      <header className="community-feed__hero">
        <span className="community-feed__eyebrow">
          {t('communityHub.eyebrow')}
        </span>
        <h1>{context?.series.title ?? t('communityHub.welcome')}</h1>
        {context?.episode && (
          <p>
            {t('communityHub.episodeFormat', {
              season: context.episode.seasonNumber,
              episode: context.episode.episodeNumber,
            })}
          </p>
        )}
        <p>{t('communityHub.intro')}</p>
        <div className="community-feed__actions">
          {COMMUNITY_KINDS.map((kind, i) => (
            <Button
              key={kind}
              icon={icons[i]}
              type={i === 0 ? 'primary' : 'default'}
              onClick={() => start(kind)}
              disabled={status === 'loading'}
            >
              {t(`communityHub.${kind}`)}
            </Button>
          ))}
        </div>
      </header>
      {!context && <TopFiveInvitation />}
      {metrics && <CommunityMetrics metrics={metrics} />}
      <nav
        className="community-feed__filters"
        aria-label={t('communityHub.conversations')}
      >
        {(['all', 'reviews', ...COMMUNITY_KINDS, 'unanswered'] as const).map(
          (filter) =>
            (!context || filter !== 'reviews') && (
              <Link
                key={filter}
                href={getCommunityUrl(1, search, filter, scope)}
                aria-current={filter === view ? 'page' : undefined}
              >
                {t(`communityHub.${filter}`)}
              </Link>
            )
        )}
      </nav>
      <form
        className="community-feed__search"
        action={scope ? `/comunidad/obras/${scope.seriesId}` : '/comunidad'}
        method="get"
      >
        <input type="hidden" name="view" value={view} />
        {scope?.episodeId && (
          <input type="hidden" name="episodeId" value={scope.episodeId} />
        )}
        <Input
          key={search}
          name="q"
          defaultValue={search}
          maxLength={100}
          aria-label={t('community.search')}
          placeholder={t('community.search')}
        />
        <Button
          htmlType="submit"
          icon={<SearchOutlined />}
          aria-label={t('community.search')}
        />
      </form>
      {!context && (view === 'all' || view === 'reviews') && (
        <section>
          <div className="community-feed__section-heading">
            <h2>{t('communityHub.recentReviews')}</h2>
            {view === 'all' && (
              <Link href={getCommunityUrl(1, search, 'reviews')}>
                {t('communityHub.reviews')}
              </Link>
            )}
          </div>
          {items.length ? (
            <ul className="community-feed__cards">
              {items.map((item) => (
                <li key={item.id}>
                  <CommunityCard
                    href={getCommunityReviewUrl(item.series)}
                    title={item.title ?? t('community.spoilers')}
                    excerpt={item.excerpt}
                    series={item.series}
                    author={item.author}
                    date={item.publishedAt}
                    badge={t('communityHub.reviews')}
                    readLabel={t('community.read')}
                    anonymous={t('communityHub.anonymous')}
                    locale={locale}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title={t('community.empty')} />
          )}
        </section>
      )}
      {view !== 'reviews' && (
        <section>
          <h2>{t('communityHub.conversations')}</h2>
          {topics.length ? (
            <ul className="community-feed__cards">
              {topics.map((topic) => (
                <li key={topic.id}>
                  <CommunityCard
                    href={`/comunidad/${topic.id}`}
                    title={topic.title ?? t('community.spoilers')}
                    excerpt={topic.excerpt}
                    series={topic.series}
                    author={topic.author}
                    date={topic.createdAt}
                    badge={t(`communityHub.${topic.kind}`)}
                    meta={
                      topic.closed
                        ? t('communityHub.closed')
                        : `${topic.replyCount} ${t('communityHub.replies')}`
                    }
                    readLabel={t('communityHub.open')}
                    anonymous={t('communityHub.anonymous')}
                    locale={locale}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title={t('communityHub.noTopics')}
              description={t('communityHub.noTopicsHint')}
            />
          )}
        </section>
      )}
      {(page > 1 || hasNext) && (
        <nav className="community-feed__pagination">
          {page > 1 && (
            <Link href={getCommunityUrl(page - 1, search, view, scope)}>
              {t('peopleIndex.prevPage')}
            </Link>
          )}
          {hasNext && (
            <Link href={getCommunityUrl(page + 1, search, view, scope)}>
              {t('peopleIndex.nextPage')}
            </Link>
          )}
        </nav>
      )}
      {compose && (
        <CommunityComposer
          key={compose}
          kind={compose}
          context={context}
          onClose={() => setCompose(null)}
        />
      )}
    </section>
  );
}
