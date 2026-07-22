'use client';

import {
  CalendarOutlined,
  GlobalOutlined,
  StarOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons';
import Image from 'next/image';
import { Tag } from 'antd';
import { Widget } from '@/components/dashboard';
import { Chip } from '@/components/design-system';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { isSupabaseImageUrl } from '@/lib/image-helpers';
import type { SerieDetailData } from '../../../types';
import './SerieHeroWidget.css';

export interface SerieHeroWidgetProps {
  serie: SerieDetailData;
}

function getTypeColor(type: string): string {
  const map: Record<string, string> = {
    SERIE: 'blue',
    PELICULA: 'purple',
    CORTO: 'cyan',
    ESPECIAL: 'magenta',
  };
  return map[type] ?? 'default';
}

export function SerieHeroWidget({ serie }: SerieHeroWidgetProps) {
  const { t } = useLocale();

  return (
    <Widget noPadding>
      <div className="mb-serie-hero-widget">
        {serie.imageUrl ? (
          <div className="mb-serie-hero-widget__cover">
            <Image
              src={serie.imageUrl}
              alt={serie.title}
              width={180}
              height={260}
              unoptimized={isSupabaseImageUrl(serie.imageUrl)}
            />
          </div>
        ) : (
          <div className="mb-serie-hero-widget__cover mb-serie-hero-widget__cover--placeholder" />
        )}

        <div className="mb-serie-hero-widget__body">
          <h1 className="mb-serie-hero-widget__title">{serie.title}</h1>
          {serie.originalTitle && (
            <p className="mb-serie-hero-widget__original">
              {serie.originalTitle}
            </p>
          )}

          <div className="mb-serie-hero-widget__tags">
            <Tag
              color={getTypeColor(serie.type)}
              icon={<VideoCameraOutlined />}
            >
              {serie.type}
            </Tag>
            {serie.country?.name && (
              <Tag icon={<GlobalOutlined />}>{serie.country.name}</Tag>
            )}
            {serie.year && <Tag icon={<CalendarOutlined />}>{serie.year}</Tag>}
            {serie.isNovel && (
              <Chip tone="accent">{t('serieDetail.basedOnNovel')}</Chip>
            )}
            {serie.overallRating != null && (
              <Chip tone="warning" icon={<StarOutlined />}>
                {serie.overallRating}
              </Chip>
            )}
          </div>

          {serie.synopsis && (
            <p className="mb-serie-hero-widget__synopsis">{serie.synopsis}</p>
          )}
        </div>
      </div>
    </Widget>
  );
}
