'use client';

import { ReactNode } from 'react';
import { Tag } from 'antd';
import { BookOutlined } from '@ant-design/icons';
import Image from 'next/image';
import { CountryFlag } from '@/components/common/CountryFlag/CountryFlag';
import { MetadataChip } from './MetadataPrimitives/MetadataPrimitives';
import './SeriesHeader.css';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { interpolateMessage } from '@/lib/i18n-format';
import type { TranslationKey } from '@/i18n/messages';

interface SeriesHeaderProps {
  series: {
    id: number;
    title: string;
    originalTitle?: string | null;
    year?: number | null;
    type: string;
    basedOn?: string | null;
    format: string;
    imageUrl?: string | null;
    synopsis?: string | null;
    overallRating?: number | null;
    country?: {
      name: string;
      code?: string | null;
    } | null;
    universe?: {
      name: string;
    } | null;
    tags?: Array<{
      tag: {
        id: number;
        name: string;
        category?: string | null;
      };
    }>;
  };
  actionsSlot?: ReactNode;
}

export function SeriesHeader({ series, actionsSlot }: SeriesHeaderProps) {
  const { t } = useLocale();
  return (
    <section className="series-hero">
      {series.imageUrl && (
        <div className="series-hero__backdrop" aria-hidden="true">
          <Image
            src={series.imageUrl}
            alt={series.title}
            fill
            sizes="100vw"
            style={{ objectFit: 'cover', objectPosition: 'center 22%' }}
          />
        </div>
      )}
      <div className="series-hero__veil" aria-hidden="true" />

      <div className="series-header">
        <aside className="series-header__aside">
          {series.imageUrl && (
            <div className="series-header__image">
              <Image
                src={series.imageUrl}
                alt={series.title}
                width={300}
                height={450}
                style={{ objectFit: 'cover' }}
              />
            </div>
          )}

          {actionsSlot && (
            <div className="series-header__quick-actions">{actionsSlot}</div>
          )}
        </aside>

        <div className="series-header__content">
          {series.universe && (
            <div className="series-header__universe">
              <span className="series-header__muted">
                {t('seriesHeader.universe')}: <strong>{series.universe.name}</strong>
              </span>
            </div>
          )}

          <h1 className="series-header__title">{series.title}</h1>

          {series.originalTitle && series.originalTitle !== series.title && (
            <span className="series-header__original-title">
              {t('seriesHeader.originalTitle')}: {series.originalTitle}
            </span>
          )}

          <div className="series-header__meta">
            {series.country && (
              <MetadataChip
                filter="country"
                value={series.country.name}
                icon={<CountryFlag code={series.country.code} />}
                label={series.country.name}
              />
            )}

            {series.year && <MetadataChip filter="year" value={series.year} />}

            <MetadataChip
              filter="type"
              value={series.type}
              color={getTypeColor(series.type)}
              label={getTypeLabel(series.type, t)}
            />

            {series.format === 'vertical' && (
              <MetadataChip
                filter="format"
                value="vertical"
                color="orange"
                label={`📲 ${t('seriesHeader.formatVertical')}`}
              />
            )}

            {series.basedOn && (
              <span className="series-header__meta-item">
                <BookOutlined />{' '}
                {interpolateMessage(t('seriesHeader.basedOn'), {
                  label: getBasedOnLabel(series.basedOn),
                })}
              </span>
            )}

            {series.overallRating && (
              <Tag color="gold" className="series-header__rating-tag">
                ★ {series.overallRating}/10
              </Tag>
            )}
          </div>

          {series.synopsis && (
            <div className="series-header__synopsis">
              <p>{series.synopsis}</p>
            </div>
          )}

          {series.tags && series.tags.length > 0 && (
            <div className="series-header__tags">
              {series.tags.map((st) => (
                <MetadataChip
                  key={st.tag.id}
                  filter="tag"
                  value={st.tag.id}
                  color="purple"
                  label={st.tag.name}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function getTypeColor(type: string): string {
  switch (type.toLowerCase()) {
    case 'serie':
      return 'blue';
    case 'pelicula':
      return 'purple';
    case 'corto':
      return 'orange';
    case 'especial':
      return 'green';
    case 'anime':
      return 'magenta';
    case 'reality':
      return 'gold';
    default:
      return 'default';
  }
}

function getTypeLabel(type: string, t: (key: TranslationKey) => string): string {
  switch (type.toLowerCase()) {
    case 'serie': return t('seriesHeader.typeSerie');
    case 'pelicula': return t('seriesHeader.typePelicula');
    case 'corto': return t('seriesHeader.typeCorto');
    case 'especial': return t('seriesHeader.typeEspecial');
    case 'anime': return t('seriesHeader.typeAnime');
    case 'reality': return t('seriesHeader.typeReality');
    default: return type;
  }
}

function getBasedOnLabel(basedOn: string): string {
  switch (basedOn.toLowerCase()) {
    case 'libro':
      return 'libro';
    case 'novela':
      return 'novela';
    case 'corto':
      return 'cuento';
    case 'manga':
      return 'manga';
    case 'anime':
      return 'anime';
    default:
      return basedOn;
  }
}
