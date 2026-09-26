'use client';

import Link from 'next/link';
import { Input, Button } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { getCommunityUrl } from '@/lib/community-url';
import { PanelCard, EmptyState } from '@/components/design-system';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { getContentUrl } from '@/lib/slug';
import './CommunityFeed.css';

interface CommunityItem {
  id: number;
  title: string | null;
  series: { id: number; title: string; origin: string; catalogScope: string };
}
export function CommunityFeed({
  items,
  page = 1,
  hasNext = false,
  search = '',
}: {
  items: CommunityItem[];
  page?: number;
  hasNext?: boolean;
  search?: string;
}) {
  const { t } = useLocale();
  return (
    <section className="community-feed">
      <header>
        <h1>{t('community.title')}</h1>
        <p>{t('community.description')}</p>
        <Link href="/catalogo">{t('sidebar.catalog')}</Link>
      </header>
      <form className="community-feed__search" action="/comunidad" method="get">
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
      {items.length === 0 ? (
        <EmptyState title={t('community.empty')} />
      ) : (
        <ul>
          {items.map((item) => {
            const href = getContentUrl(item.series);
            return (
              <li key={item.id}>
                <PanelCard>
                  <h2>{item.series.title}</h2>
                  <p>{item.title ?? t('community.spoilers')}</p>
                  <Link
                    aria-label={`${t('community.read')}: ${item.series.title}`}
                    href={
                      href.startsWith('/series/')
                        ? `${href}#series-section-reviews`
                        : href
                    }
                  >
                    {t('community.read')}
                  </Link>
                </PanelCard>
              </li>
            );
          })}
        </ul>
      )}
      {(page > 1 || hasNext) && (
        <nav className="community-feed__pagination">
          {page > 1 && (
            <Link href={getCommunityUrl(page - 1, search)}>
              {t('peopleIndex.prevPage')}
            </Link>
          )}
          {hasNext && (
            <Link href={getCommunityUrl(page + 1, search)}>
              {t('peopleIndex.nextPage')}
            </Link>
          )}
        </nav>
      )}
    </section>
  );
}
