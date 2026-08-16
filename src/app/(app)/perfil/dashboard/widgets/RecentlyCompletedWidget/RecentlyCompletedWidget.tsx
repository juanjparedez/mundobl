'use client';

import { useState } from 'react';
import { CheckCircleOutlined } from '@ant-design/icons';
import Image from 'next/image';
import Link from 'next/link';
import { Widget } from '@/components/dashboard';
import { EmptyState } from '@/components/design-system';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { interpolateMessage } from '@/lib/i18n-format';
import { isSupabaseImageUrl } from '@/lib/image-helpers';
import type { ProfileData } from '../../../types';
import './RecentlyCompletedWidget.css';

const COLLAPSED_COUNT = 3;

export interface RecentlyCompletedWidgetProps {
  items: ProfileData['recentlyCompleted'];
}

export function RecentlyCompletedWidget({
  items,
}: RecentlyCompletedWidgetProps) {
  const { t } = useLocale();
  const [showAll, setShowAll] = useState(false);

  const visible = showAll ? items : items.slice(0, COLLAPSED_COUNT);

  return (
    <Widget
      title={t('profileDashboard.widgetRecentlyCompleted')}
      icon={<CheckCircleOutlined />}
      noPadding
      fade={items.length > COLLAPSED_COUNT}
    >
      {items.length === 0 ? (
        <EmptyState
          title={t('profileDashboard.recentlyCompletedEmpty')}
          variant="soft"
          fullHeight={false}
        />
      ) : (
        <div className="mb-recently-completed-widget__wrap">
          <ul className="mb-recently-completed-widget">
            {visible.map(({ seriesId, series }) => {
              if (!series) return null;
              return (
                <li key={seriesId}>
                  <Link
                    href={`/series/${series.id}`}
                    className="mb-recently-completed-widget__item"
                  >
                    <span className="mb-recently-completed-widget__cover">
                      {series.imageUrl ? (
                        <Image
                          src={series.imageUrl}
                          alt=""
                          width={40}
                          height={56}
                          unoptimized={isSupabaseImageUrl(series.imageUrl)}
                        />
                      ) : (
                        <span className="mb-recently-completed-widget__cover-placeholder" />
                      )}
                    </span>
                    <span className="mb-recently-completed-widget__body">
                      <span className="mb-recently-completed-widget__title">
                        {series.title}
                      </span>
                      <span className="mb-recently-completed-widget__meta">
                        {series.year ?? ''}
                        {series.year && series.country?.name ? ' · ' : ''}
                        {series.country?.name ?? ''}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>

          {items.length > COLLAPSED_COUNT && (
            <button
              type="button"
              className="mb-recently-completed-widget__toggle"
              onClick={() => setShowAll((v) => !v)}
            >
              {showAll
                ? t('profile.overviewViewLess')
                : interpolateMessage(t('profile.overviewViewAllCount'), {
                    count: String(items.length),
                  })}
            </button>
          )}
        </div>
      )}
    </Widget>
  );
}
