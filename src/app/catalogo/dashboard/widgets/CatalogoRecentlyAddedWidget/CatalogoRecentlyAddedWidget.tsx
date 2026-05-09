'use client';

import { ClockCircleOutlined } from '@ant-design/icons';
import { Widget } from '@/components/dashboard';
import { MediaCard, EmptyState } from '@/components/design-system';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { isSupabaseImageUrl } from '@/lib/image-helpers';
import './CatalogoRecentlyAddedWidget.css';

export interface RecentSeriesItem {
  id: number;
  title: string;
  imageUrl: string | null;
  year: number | null;
  country: string | null;
}

export interface CatalogoRecentlyAddedWidgetProps {
  items: RecentSeriesItem[];
}

export function CatalogoRecentlyAddedWidget({
  items,
}: CatalogoRecentlyAddedWidgetProps) {
  const { t } = useLocale();

  if (items.length === 0) {
    return (
      <Widget
        title={t('catalogoDashboard.recentlyAddedTitle')}
        icon={<ClockCircleOutlined />}
      >
        <EmptyState
          title={t('catalogoDashboard.recentlyAddedEmpty')}
          variant="soft"
          fullHeight={false}
        />
      </Widget>
    );
  }

  return (
    <Widget
      title={t('catalogoDashboard.recentlyAddedTitle')}
      icon={<ClockCircleOutlined />}
      noPadding
    >
      <div className="mb-catalogo-recently-added">
        {items.map((item) => (
          <MediaCard
            key={item.id}
            href={`/catalogo/${item.id}`}
            imageUrl={item.imageUrl}
            imageAlt={item.title}
            unoptimizedImage={
              !!item.imageUrl && !isSupabaseImageUrl(item.imageUrl)
            }
            title={item.title}
            subtitle={
              [item.year, item.country].filter(Boolean).join(' · ') || undefined
            }
          />
        ))}
      </div>
    </Widget>
  );
}
