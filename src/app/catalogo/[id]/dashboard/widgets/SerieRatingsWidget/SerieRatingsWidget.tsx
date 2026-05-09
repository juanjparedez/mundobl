'use client';

import { Rate } from 'antd';
import { StarOutlined } from '@ant-design/icons';
import { Widget } from '@/components/dashboard';
import { Chip, EmptyState } from '@/components/design-system';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { interpolateMessage } from '@/lib/i18n-format';
import type { SerieDetailData } from '../../../types';
import './SerieRatingsWidget.css';

export interface SerieRatingsWidgetProps {
  serie: SerieDetailData;
}

export function SerieRatingsWidget({ serie }: SerieRatingsWidgetProps) {
  const { t } = useLocale();

  if (!serie.ratings || serie.ratings.length === 0) {
    return (
      <Widget
        title={t('serieDetail.ratingsByCategoryTitle')}
        icon={<StarOutlined />}
      >
        <EmptyState
          title={t('serieDashboard.ratingsEmpty')}
          variant="soft"
          fullHeight={false}
        />
      </Widget>
    );
  }

  return (
    <Widget
      title={t('serieDetail.ratingsByCategoryTitle')}
      icon={<StarOutlined />}
    >
      <ul className="mb-serie-ratings-widget">
        {serie.ratings.map((rating) => (
          <li key={rating.id} className="mb-serie-ratings-widget__item">
            <div className="mb-serie-ratings-widget__row">
              <span className="mb-serie-ratings-widget__category">
                {rating.category}
              </span>
              <Chip tone="warning">
                {interpolateMessage(t('serieDetail.ratingScore'), {
                  score: rating.score,
                })}
              </Chip>
            </div>
            <Rate disabled defaultValue={rating.score / 2} allowHalf />
          </li>
        ))}
      </ul>
    </Widget>
  );
}
