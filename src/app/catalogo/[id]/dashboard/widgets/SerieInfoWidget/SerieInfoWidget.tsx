'use client';

import { Descriptions } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { Widget } from '@/components/dashboard';
import { useLocale } from '@/lib/providers/LocaleProvider';
import type { SerieDetailData } from '../../../types';

export interface SerieInfoWidgetProps {
  serie: SerieDetailData;
}

export function SerieInfoWidget({ serie }: SerieInfoWidgetProps) {
  const { t } = useLocale();
  const totalSeasons = serie.seasons?.length ?? 0;
  const totalEpisodes =
    serie.seasons?.reduce(
      (sum, season) => sum + (season.episodeCount ?? 0),
      0
    ) ?? 0;

  return (
    <Widget
      title={t('serieDetail.generalInformationTitle')}
      icon={<InfoCircleOutlined />}
    >
      <Descriptions column={1} size="small">
        <Descriptions.Item label={t('serieDetail.typeLabel')}>
          {serie.type}
        </Descriptions.Item>
        {serie.originalTitle && (
          <Descriptions.Item label={t('serieDetail.originalTitle')}>
            {serie.originalTitle}
          </Descriptions.Item>
        )}
        {serie.year && (
          <Descriptions.Item label={t('serieDetail.yearLabel')}>
            {serie.year}
          </Descriptions.Item>
        )}
        {totalSeasons > 0 && (
          <Descriptions.Item label={t('serieDetail.seasonsLabel')}>
            {totalSeasons}
          </Descriptions.Item>
        )}
        {totalEpisodes > 0 && (
          <Descriptions.Item label={t('serieDetail.totalEpisodesLabel')}>
            {totalEpisodes}
          </Descriptions.Item>
        )}
        {serie.isNovel && (
          <Descriptions.Item label={t('serieDetail.basedOnLabel')}>
            {t('serieDetail.basedOnNovel')}
          </Descriptions.Item>
        )}
      </Descriptions>
    </Widget>
  );
}
