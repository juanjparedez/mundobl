'use client';
import Link from 'next/link';
import { Button, Input } from 'antd';
import { useSession } from 'next-auth/react';
import { EmptyState } from '@/components/design-system';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { CommunitySpace } from '../CommunitySpace/CommunitySpace';
import { RecommendationCard } from '../RecommendationCard/RecommendationCard';
import type { RecommendationListSummary } from '@/types/community-library';
import './CommunityLists.css';

export function CommunityLists({
  items,
  mine,
  page,
  hasNext,
  search,
}: {
  items: RecommendationListSummary[];
  mine: boolean;
  page: number;
  hasNext: boolean;
  search: string;
}) {
  const { t } = useLocale();
  const { data: session } = useSession();
  const pageUrl = (value: number) =>
    `/comunidad/listas?${new URLSearchParams({ page: String(value), q: search, ...(mine ? { mine: 'true' } : {}) })}`;
  return (
    <CommunitySpace
      active={mine ? 'mine' : 'lists'}
      title={t(mine ? 'communitySpace.myLists' : 'communitySpace.lists')}
      intro={t(
        mine ? 'communitySpace.emptyListsHint' : 'communitySpace.listsIntro'
      )}
      actions={
        session?.user && (
          <Button type="primary" href="/comunidad/listas/nueva">
            {t('communitySpace.newList')}
          </Button>
        )
      }
    >
      <form
        action="/comunidad/listas"
        method="get"
        className="community-lists__search"
      >
        {mine && <input type="hidden" name="mine" value="true" />}
        <Input
          name="q"
          defaultValue={search}
          maxLength={100}
          aria-label={t('communitySpace.title')}
          placeholder={t('communitySpace.title')}
        />
        <Button htmlType="submit">{t('communitySpace.searchLists')}</Button>
      </form>
      {items.length ? (
        <ul className="community-space__grid">
          {items.map((list) => (
            <li key={list.id}>
              <RecommendationCard list={list} />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          title={t('communitySpace.emptyLists')}
          description={t('communitySpace.emptyListsHint')}
        />
      )}
      <nav className="community-space__actions">
        {page > 1 && (
          <Link href={pageUrl(page - 1)}>{t('peopleIndex.prevPage')}</Link>
        )}
        {hasNext && (
          <Link href={pageUrl(page + 1)}>{t('peopleIndex.nextPage')}</Link>
        )}
      </nav>
    </CommunitySpace>
  );
}
