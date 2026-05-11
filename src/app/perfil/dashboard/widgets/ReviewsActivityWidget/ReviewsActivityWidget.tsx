'use client';

import { ReadOutlined } from '@ant-design/icons';
import { Widget } from '@/components/dashboard';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { OverviewReviewsActivity } from '../../../overview/sections/ReviewsActivity';
import type { ProfileData } from '../../../types';

export interface ReviewsActivityWidgetProps {
  stats: ProfileData['stats'];
}

/** Widget "Actividad de reseñas". Total de reseñas publicadas en
 *  formato big number. */
export function ReviewsActivityWidget({ stats }: ReviewsActivityWidgetProps) {
  const { t } = useLocale();
  return (
    <Widget
      title={t('profile.sectionReviewsActivity')}
      icon={<ReadOutlined />}
      noPadding
    >
      <OverviewReviewsActivity stats={stats} />
    </Widget>
  );
}
