'use client';

import { Descriptions, Tag } from 'antd';
import Image from 'next/image';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { LockOutlined } from '@ant-design/icons';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { CountryFlag } from '@/components/common/CountryFlag/CountryFlag';
import { isSupabaseImageUrl } from '@/lib/image-helpers';
import {
  MetadataChip,
  MetadataChipList,
  MetadataLink,
  MetadataLinkList,
} from './MetadataPrimitives/MetadataPrimitives';
import { ReviewSpotlight } from './ReviewSpotlight/ReviewSpotlight';
import './SeriesInfo.css';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { interpolateMessage } from '@/lib/i18n-format';

interface SeriesInfoProps {
  series: {
    id: number;
    title: string;
    originalTitle?: string | null;
    year?: number | null;
    type: string;
    basedOn?: string | null;
    format: string;
    notesPrivate?: boolean;
    synopsis?: string | null;
    soundtrack?: string | null;
    observations?: string | null;
    review?: string | null;
    infoBlocks?: Array<{
      id: number;
      label: string;
      body: string;
      sortOrder: number;
    }>;
    country?: {
      name: string;
      code?: string | null;
    } | null;
    productionCompany?: {
      name: string;
    } | null;
    originalLanguage?: {
      name: string;
    } | null;
    dubbings?: Array<{
      language: {
        name: string;
      };
    }>;
    directors?: Array<{
      director: {
        name: string;
      };
    }>;
    actors?: Array<{
      character?: string | null;
      isMain: boolean;
      pairingGroup?: number | null;
      actor: {
        id: number;
        name: string;
      };
    }>;
    genres?: Array<{
      genre: {
        name: string;
      };
    }>;
    seasons?: Array<{
      seasonNumber: number;
      episodeCount?: number | null;
    }>;
    watchLinks?: Array<{
      id: number;
      platform: string;
      url: string;
      official: boolean;
    }>;
    relatedSeriesFrom?: Array<{
      relatedSeries: {
        id: number;
        title: string;
        imageUrl?: string | null;
        imagePosition?: string | null;
        year?: number | null;
        type: string;
      };
    }>;
    relatedSeriesTo?: Array<{
      mainSeries: {
        id: number;
        title: string;
        imageUrl?: string | null;
        imagePosition?: string | null;
        year?: number | null;
        type: string;
      };
    }>;
    universe?: {
      id?: number;
      name: string;
    } | null;
    universeSeries?: Array<{
      id: number;
      title: string;
      imageUrl?: string | null;
      imagePosition?: string | null;
      year?: number | null;
      type: string;
    }>;
  };
}

interface PreviewSeries {
  id: number;
  title: string;
  imageUrl?: string | null;
  imagePosition?: string | null;
  year?: number | null;
  type: string;
}

function getYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/))([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
}

function getBasedOnLabel(basedOn: string): string {
  // Legacy labels for backwards compatibility
  const labels: Record<string, string> = {
    libro: 'Libro',
    novela: 'Novela',
    corto: 'Cuento/Relato',
    manga: 'Manga',
    anime: 'Anime',
  };
  return labels[basedOn.toLowerCase()] || basedOn;
}

export function SeriesInfo({ series }: SeriesInfoProps) {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const { t } = useLocale();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'ADMIN';
  const canSeeNotes = !series.notesPrivate || isAdmin;

  const fullSpan = isMobile ? 1 : 2;

  const totalEpisodes = series.seasons?.reduce(
    (sum, season) => sum + (season.episodeCount || 0),
    0
  );

  const relatedSeries: PreviewSeries[] = [
    ...(series.relatedSeriesFrom?.map((r) => r.relatedSeries) ?? []),
    ...(series.relatedSeriesTo?.map((r) => r.mainSeries) ?? []),
  ];

  const uniqueRelatedSeries = relatedSeries.filter((item, index, arr) => {
    return arr.findIndex((candidate) => candidate.id === item.id) === index;
  });

  const uniqueUniverseSeries = (series.universeSeries ?? []).filter(
    (item, index, arr) => {
      if (item.id === series.id) return false;
      return arr.findIndex((candidate) => candidate.id === item.id) === index;
    }
  );

  return (
    <div className="series-info">
      <Descriptions
        bordered={!isMobile}
        column={isMobile ? 1 : 2}
        size="small"
        layout="horizontal"
      >
        <Descriptions.Item label={t('seriesInfo.fieldTitle')} span={fullSpan}>
          {series.title}
        </Descriptions.Item>

        {series.originalTitle && series.originalTitle !== series.title && (
          <Descriptions.Item
            label={t('seriesInfo.fieldOriginalTitle')}
            span={fullSpan}
          >
            {series.originalTitle}
          </Descriptions.Item>
        )}

        <Descriptions.Item label={t('seriesInfo.fieldYear')}>
          {series.year ? (
            <MetadataChip filter="year" value={series.year} />
          ) : (
            t('common.na')
          )}
        </Descriptions.Item>

        <Descriptions.Item label={t('seriesInfo.fieldCountry')}>
          {series.country ? (
            <MetadataChip
              filter="country"
              value={series.country.name}
              icon={<CountryFlag code={series.country.code} size="small" />}
              label={series.country.name}
            />
          ) : (
            t('common.na')
          )}
        </Descriptions.Item>

        <Descriptions.Item label={t('seriesInfo.fieldType')}>
          <MetadataChip
            filter="type"
            value={series.type}
            color="blue"
            label={series.type}
          />
        </Descriptions.Item>

        <Descriptions.Item label={t('seriesInfo.fieldFormat')}>
          <MetadataChip
            filter="format"
            value={series.format}
            color={series.format === 'vertical' ? 'orange' : 'blue'}
            label={
              series.format === 'vertical'
                ? `📲 ${t('seriesInfo.formatVertical')}`
                : `📱 ${t('seriesInfo.formatRegular')}`
            }
          />
        </Descriptions.Item>

        {series.basedOn && (
          <Descriptions.Item
            label={t('seriesInfo.fieldBasedOn')}
            span={fullSpan}
          >
            <Tag color="green">{getBasedOnLabel(series.basedOn)}</Tag>
          </Descriptions.Item>
        )}

        <Descriptions.Item label={t('seriesInfo.fieldSeasons')}>
          {series.seasons?.length || 0}
        </Descriptions.Item>

        <Descriptions.Item label={t('seriesInfo.fieldEpisodes')}>
          {totalEpisodes || t('common.na')}
        </Descriptions.Item>

        {series.soundtrack && (
          <Descriptions.Item
            label={t('seriesInfo.fieldSoundtrack')}
            span={fullSpan}
          >
            {series.soundtrack}
          </Descriptions.Item>
        )}

        {series.productionCompany && (
          <Descriptions.Item
            label={t('seriesInfo.fieldProduction')}
            span={fullSpan}
          >
            <MetadataLink
              filter="productionCompany"
              value={series.productionCompany.name}
            >
              {series.productionCompany.name}
            </MetadataLink>
          </Descriptions.Item>
        )}

        {series.originalLanguage && (
          <Descriptions.Item
            label={t('seriesInfo.fieldLanguage')}
            span={fullSpan}
          >
            <MetadataChip
              filter="language"
              value={series.originalLanguage.name}
              label={series.originalLanguage.name}
            />
          </Descriptions.Item>
        )}

        {series.dubbings && series.dubbings.length > 0 && (
          <Descriptions.Item
            label={t('seriesInfo.fieldDubbings')}
            span={fullSpan}
          >
            {series.dubbings.map((d) => (
              <Tag key={d.language.name}>{d.language.name}</Tag>
            ))}
          </Descriptions.Item>
        )}

        {series.genres && series.genres.length > 0 && (
          <Descriptions.Item label={t('seriesInfo.fieldGenre')} span={fullSpan}>
            <MetadataChipList
              filter="genre"
              items={series.genres.map((g) => ({
                key: g.genre.name,
                value: g.genre.name,
                label: g.genre.name,
                color: 'purple',
              }))}
            />
          </Descriptions.Item>
        )}

        {series.directors && series.directors.length > 0 && (
          <Descriptions.Item
            label={t('seriesInfo.fieldDirectors')}
            span={fullSpan}
          >
            <MetadataLinkList
              filter="director"
              items={series.directors.map((d) => ({
                key: d.director.name,
                value: d.director.name,
                label: d.director.name,
              }))}
            />
          </Descriptions.Item>
        )}
      </Descriptions>

      {series.watchLinks && series.watchLinks.length > 0 && (
        <div className="series-info__watch-links">
          <h4 className="series-info__section-title">
            {t('seriesInfo.whereToWatch')}
          </h4>
          <div className="series-info__watch-links-list">
            {series.watchLinks.map((link) => {
              const youtubeId =
                link.platform === 'YouTube' ? getYouTubeId(link.url) : null;

              return (
                <div key={link.id} className="series-info__watch-link">
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="series-info__watch-link-btn"
                  >
                    <Tag color={link.official ? 'green' : 'default'}>
                      {link.platform}
                      {!link.official && t('seriesInfo.unofficial')}
                    </Tag>
                  </a>
                  {youtubeId && (
                    <div className="series-info__youtube-embed">
                      <iframe
                        src={`https://www.youtube-nocookie.com/embed/${youtubeId}`}
                        title={`${series.title} - YouTube`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="series-info__youtube-iframe"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {series.actors &&
        series.actors.length > 0 &&
        (() => {
          const pairings = new Map<number, typeof series.actors>();
          const unpaired: typeof series.actors = [];

          for (const sa of series.actors!) {
            if (sa.pairingGroup) {
              if (!pairings.has(sa.pairingGroup)) {
                pairings.set(sa.pairingGroup, []);
              }
              pairings.get(sa.pairingGroup)!.push(sa);
            } else {
              unpaired.push(sa);
            }
          }

          const renderActor = (sa: (typeof series.actors)[0]) => (
            <div
              key={`${sa.actor.id}-${sa.character}`}
              className="series-info__cast-actor"
            >
              <MetadataLink filter="actor" value={sa.actor.name}>
                {sa.actor.name}
              </MetadataLink>
              {sa.character && (
                <span className="series-info__cast-character">
                  {interpolateMessage(t('seriesInfo.asCharacter'), {
                    character: sa.character,
                  })}
                </span>
              )}
              {sa.isMain && (
                <span
                  className="series-info__cast-star"
                  title={t('seriesInfo.protagonist')}
                  aria-label={t('seriesInfo.protagonist')}
                >
                  ⭐
                </span>
              )}
            </div>
          );

          return (
            <div className="series-info__cast-section">
              <h4 className="series-info__section-title">
                👥 {t('seriesInfo.castSection')}
              </h4>

              {pairings.size > 0 && (
                <div className="series-info__pairings">
                  {Array.from(pairings.entries())
                    .sort(([a], [b]) => a - b)
                    .map(([group, actors]) => (
                      <div key={group} className="series-info__pairing">
                        <span className="series-info__pairing-badge">
                          💕 {t('seriesInfo.couplebadge')}
                        </span>
                        <div className="series-info__pairing-actors">
                          {actors!.map(renderActor)}
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {unpaired.length > 0 && (
                <div className="series-info__cast-others">
                  {unpaired.map(renderActor)}
                </div>
              )}
            </div>
          );
        })()}

      {series.synopsis && (
        <div className="series-info__synopsis">
          <h4 className="series-info__section-title">
            📖 {t('seriesInfo.synopsisSection')}
          </h4>
          <div className="series-info__synopsis-content">{series.synopsis}</div>
        </div>
      )}

      {series.infoBlocks && series.infoBlocks.length > 0 && (
        <div className="series-info__blocks">
          {series.infoBlocks.map((block) => (
            <div key={block.id} className="series-info__block">
              <h4 className="series-info__section-title">{block.label}</h4>
              <div className="series-info__block-body">{block.body}</div>
            </div>
          ))}
        </div>
      )}

      <ReviewSpotlight seriesId={series.id} />

      {series.review && canSeeNotes && (
        <div className="series-info__review">
          <h4 className="series-info__section-title">
            ⭐ {t('seriesInfo.reviewSection')}
            {series.notesPrivate && (
              <Tag color="default" className="series-info__private-tag">
                <LockOutlined /> {t('seriesInfo.privateLabel')}
              </Tag>
            )}
          </h4>
          <div className="series-info__review-content">{series.review}</div>
        </div>
      )}

      {series.observations && canSeeNotes && (
        <div className="series-info__observations">
          <h4 className="series-info__section-title">
            📝 {t('seriesInfo.observationsSection')}
            {series.notesPrivate && (
              <Tag color="default" className="series-info__private-tag">
                <LockOutlined /> {t('seriesInfo.privateLabel')}
              </Tag>
            )}
          </h4>
          <div className="series-info__observations-content">
            {series.observations}
          </div>
        </div>
      )}

      {uniqueRelatedSeries.length > 0 && (
        <div className="series-info__related">
          <h4 className="series-info__section-title">
            🔗 {t('seriesInfo.relatedSection')}
          </h4>
          <div className="series-info__preview-track">
            {uniqueRelatedSeries.map((item) => (
              <Link
                key={item.id}
                href={`/series/${item.id}`}
                className="series-info__preview-card"
              >
                <div className="series-info__preview-cover">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.title}
                      fill
                      sizes="(max-width: 640px) 120px, 140px"
                      unoptimized={isSupabaseImageUrl(item.imageUrl)}
                      style={{
                        objectFit: 'cover',
                        objectPosition: item.imagePosition ?? 'center',
                      }}
                    />
                  ) : (
                    <div className="series-info__preview-placeholder">
                      <span className="series-info__preview-placeholder-title">
                        {item.title}
                      </span>
                    </div>
                  )}
                </div>
                <div className="series-info__preview-meta">
                  <span className="series-info__preview-title">
                    {item.title}
                  </span>
                  <span className="series-info__preview-subtitle">
                    {item.type.toUpperCase()}
                    {item.year ? ` · ${item.year}` : ''}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {uniqueUniverseSeries.length > 0 && (
        <div className="series-info__universe">
          <h4 className="series-info__section-title">
            🌌 {t('seriesInfo.universeSection')}
            {series.universe?.name ? ` · ${series.universe.name}` : ''}
          </h4>
          <div className="series-info__preview-track">
            {uniqueUniverseSeries.map((item) => (
              <Link
                key={item.id}
                href={`/series/${item.id}`}
                className="series-info__preview-card"
              >
                <div className="series-info__preview-cover">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.title}
                      fill
                      sizes="(max-width: 640px) 120px, 140px"
                      unoptimized={isSupabaseImageUrl(item.imageUrl)}
                      style={{
                        objectFit: 'cover',
                        objectPosition: item.imagePosition ?? 'center',
                      }}
                    />
                  ) : (
                    <div className="series-info__preview-placeholder">
                      <span className="series-info__preview-placeholder-title">
                        {item.title}
                      </span>
                    </div>
                  )}
                </div>
                <div className="series-info__preview-meta">
                  <span className="series-info__preview-title">
                    {item.title}
                  </span>
                  <span className="series-info__preview-subtitle">
                    {item.type.toUpperCase()}
                    {item.year ? ` · ${item.year}` : ''}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
