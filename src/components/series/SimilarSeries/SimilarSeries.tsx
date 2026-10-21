'use client';

import { BulbOutlined } from '@ant-design/icons';
import { useLocale } from '@/lib/providers/LocaleProvider';
import type { RecommendedSeriesCard } from '@/lib/recommendations';
import { RecommendedSeriesGrid } from '../RecommendedSeriesGrid/RecommendedSeriesGrid';

/** Ancla a la que salta el panel de seguimiento al terminar la serie. */
export const SIMILAR_SERIES_ANCHOR = 'series-section-similar';

/** "Si te gusto esta", al pie de la ficha. Las series vienen del servidor. */
export function SimilarSeries({ series }: { series: RecommendedSeriesCard[] }) {
  const { t } = useLocale();
  return (
    <RecommendedSeriesGrid
      id={SIMILAR_SERIES_ANCHOR}
      icon={<BulbOutlined />}
      title={t('recommendations.similarTitle')}
      subtitle={t('recommendations.similarSubtitle')}
      series={series}
    />
  );
}
