'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Button } from 'antd';
import { Chip, EmptyState } from '@/components/design-system';
import { CommunitySpace } from '../CommunitySpace/CommunitySpace';
import { CommunityCard } from '../CommunityCard/CommunityCard';
import { CommunityComposer } from '../CommunityComposer/CommunityComposer';
import { useLocale } from '@/lib/providers/LocaleProvider';
import type { PersonalCommunityTopic } from '@/types/community';
import './PersonalCommunityTopics.css';

export function PersonalCommunityTopics({
  items,
  hasNext,
  page,
  view,
}: {
  items: PersonalCommunityTopic[];
  hasNext: boolean;
  page: number;
  view: 'own' | 'drafts' | 'following';
}) {
  const { t, locale } = useLocale();
  const [creating, setCreating] = useState(false);
  const href = (tab: string, targetPage = 1) =>
    `/comunidad/mis-conversaciones?view=${tab}&page=${targetPage}`;
  return (
    <CommunitySpace
      active="myTopics"
      title={t('communitySpace.myTopics')}
      intro={t('communitySpace.draftHint')}
      actions={
        <Button type="primary" onClick={() => setCreating(true)}>
          {t('communityHub.newTopic')}
        </Button>
      }
    >
      <nav
        className="personal-topics__tabs"
        aria-label={t('communitySpace.myTopics')}
      >
        {(['own', 'drafts', 'following'] as const).map((tab) => (
          <Link
            key={tab}
            href={href(tab)}
            aria-current={view === tab ? 'page' : undefined}
          >
            {t(`communitySpace.${tab}`)}
          </Link>
        ))}
      </nav>
      {!items.length ? (
        <EmptyState
          title={t('communityHub.noTopics')}
          description={t(
            view === 'following'
              ? 'communitySpace.followHint'
              : 'communitySpace.draftHint'
          )}
        />
      ) : (
        <ul className="personal-topics__items">
          {items.map((topic) => (
            <li key={topic.id}>
              <div className="personal-topics__badges">
                <Chip>
                  {t(
                    topic.visibility === 'PRIVATE'
                      ? 'communitySpace.private'
                      : 'communitySpace.public'
                  )}
                </Chip>
                {topic.unread && <Chip>{t('communitySpace.newReplies')}</Chip>}
                {topic.muted && <Chip>{t('communitySpace.mute')}</Chip>}
                {topic.moderationHidden && (
                  <Chip>{t('communitySpace.moderated')}</Chip>
                )}
              </div>
              <CommunityCard
                href={`/comunidad/${topic.id}`}
                title={topic.title ?? t('community.spoilers')}
                excerpt={topic.excerpt}
                series={topic.series}
                author={topic.author}
                date={topic.createdAt}
                badge={t(`communityHub.${topic.kind}`)}
                meta={`${topic.replyCount} ${t('communityHub.replies')}`}
                readLabel={t('communityHub.open')}
                anonymous={t('communityHub.anonymous')}
                locale={locale}
              />
            </li>
          ))}
        </ul>
      )}
      {(page > 1 || hasNext) && (
        <nav className="personal-topics__tabs">
          {page > 1 && (
            <Link href={href(view, page - 1)}>{t('peopleIndex.prevPage')}</Link>
          )}
          {hasNext && (
            <Link href={href(view, page + 1)}>{t('peopleIndex.nextPage')}</Link>
          )}
        </nav>
      )}
      {creating && (
        <CommunityComposer
          kind="DISCUSSION"
          onClose={() => setCreating(false)}
        />
      )}
    </CommunitySpace>
  );
}
