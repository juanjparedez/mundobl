'use client';

import { Descriptions, Tag } from 'antd';
import Link from 'next/link';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { CountryFlag } from '@/components/common/CountryFlag/CountryFlag';
import {
  MetadataChip,
  MetadataChipList,
  MetadataLink,
  MetadataLinkList,
} from './MetadataPrimitives/MetadataPrimitives';
import './SeriesInfo.css';

interface SeriesInfoProps {
  series: {
    title: string;
    originalTitle?: string | null;
    year?: number | null;
    type: string;
    basedOn?: string | null;
    format: string;
    synopsis?: string | null;
    soundtrack?: string | null;
    observations?: string | null;
    review?: string | null;
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
        year?: number | null;
        type: string;
      };
    }>;
    relatedSeriesTo?: Array<{
      mainSeries: {
        id: number;
        title: string;
        imageUrl?: string | null;
        year?: number | null;
        type: string;
      };
    }>;
  };
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

  const fullSpan = isMobile ? 1 : 2;

  const totalEpisodes = series.seasons?.reduce(
    (sum, season) => sum + (season.episodeCount || 0),
    0
  );

  return (
    <div className="series-info">
      <Descriptions
        bordered={!isMobile}
        column={isMobile ? 1 : 2}
        size="small"
        layout="horizontal"
      >
        <Descriptions.Item label="Título" span={fullSpan}>
          {series.title}
        </Descriptions.Item>

        {series.originalTitle && series.originalTitle !== series.title && (
          <Descriptions.Item label="Título Original" span={fullSpan}>
            {series.originalTitle}
          </Descriptions.Item>
        )}

        <Descriptions.Item label="Año">
          {series.year ? (
            <MetadataChip filter="year" value={series.year} />
          ) : (
            'N/A'
          )}
        </Descriptions.Item>

        <Descriptions.Item label="País">
          {series.country ? (
            <MetadataChip
              filter="country"
              value={series.country.name}
              icon={<CountryFlag code={series.country.code} size="small" />}
              label={series.country.name}
            />
          ) : (
            'N/A'
          )}
        </Descriptions.Item>

        <Descriptions.Item label="Tipo">
          <MetadataChip
            filter="type"
            value={series.type}
            color="blue"
            label={series.type}
          />
        </Descriptions.Item>

        <Descriptions.Item label="Formato">
          <MetadataChip
            filter="format"
            value={series.format}
            color={series.format === 'vertical' ? 'orange' : 'blue'}
            label={series.format === 'vertical' ? '📲 Vertical' : '📱 Regular'}
          />
        </Descriptions.Item>

        {series.basedOn && (
          <Descriptions.Item label="Basado en" span={fullSpan}>
            <Tag color="green">{getBasedOnLabel(series.basedOn)}</Tag>
          </Descriptions.Item>
        )}

        <Descriptions.Item label="Temporadas">
          {series.seasons?.length || 0}
        </Descriptions.Item>

        <Descriptions.Item label="Episodios">
          {totalEpisodes || 'N/A'}
        </Descriptions.Item>

        {series.soundtrack && (
          <Descriptions.Item label="BSO" span={fullSpan}>
            {series.soundtrack}
          </Descriptions.Item>
        )}

        {series.productionCompany && (
          <Descriptions.Item label="Productora" span={fullSpan}>
            <MetadataLink
              filter="productionCompany"
              value={series.productionCompany.name}
            >
              {series.productionCompany.name}
            </MetadataLink>
          </Descriptions.Item>
        )}

        {series.originalLanguage && (
          <Descriptions.Item label="Idioma Original" span={fullSpan}>
            <MetadataChip
              filter="language"
              value={series.originalLanguage.name}
              label={series.originalLanguage.name}
            />
          </Descriptions.Item>
        )}

        {series.dubbings && series.dubbings.length > 0 && (
          <Descriptions.Item label="Doblajes" span={fullSpan}>
            {series.dubbings.map((d) => (
              <Tag key={d.language.name}>{d.language.name}</Tag>
            ))}
          </Descriptions.Item>
        )}

        {series.genres && series.genres.length > 0 && (
          <Descriptions.Item label="Género" span={fullSpan}>
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
          <Descriptions.Item label="Director(es)" span={fullSpan}>
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
          <h4 className="series-info__section-title">Donde Ver</h4>
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
                      {!link.official && ' (no oficial)'}
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
                  como {sa.character}
                </span>
              )}
              {sa.isMain && (
                <span
                  className="series-info__cast-star"
                  title="Protagonista"
                  aria-label="Protagonista"
                >
                  ⭐
                </span>
              )}
            </div>
          );

          return (
            <div className="series-info__cast-section">
              <h4 className="series-info__section-title">👥 Reparto</h4>

              {pairings.size > 0 && (
                <div className="series-info__pairings">
                  {Array.from(pairings.entries())
                    .sort(([a], [b]) => a - b)
                    .map(([group, actors]) => (
                      <div key={group} className="series-info__pairing">
                        <span className="series-info__pairing-badge">
                          💕 Pareja
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
          <h4 className="series-info__section-title">📖 Sinopsis</h4>
          <div className="series-info__synopsis-content">{series.synopsis}</div>
        </div>
      )}

      {series.review && (
        <div className="series-info__review">
          <h4 className="series-info__section-title">⭐ Reseña Personal</h4>
          <div className="series-info__review-content">{series.review}</div>
        </div>
      )}

      {series.observations && (
        <div className="series-info__observations">
          <h4 className="series-info__section-title">📝 Observaciones</h4>
          <div className="series-info__observations-content">
            {series.observations}
          </div>
        </div>
      )}

      {(() => {
        const relatedSeries = [
          ...(series.relatedSeriesFrom?.map((r) => r.relatedSeries) ?? []),
          ...(series.relatedSeriesTo?.map((r) => r.mainSeries) ?? []),
        ];
        // Deduplicate by id
        const seen = new Set<number>();
        const unique = relatedSeries.filter((s) => {
          if (seen.has(s.id)) return false;
          seen.add(s.id);
          return true;
        });

        if (unique.length === 0) return null;

        return (
          <div className="series-info__related">
            <h4 className="series-info__section-title">
              🔗 Series Relacionadas
            </h4>
            <div className="series-info__related-list">
              {unique.map((s) => (
                <Link
                  key={s.id}
                  href={`/series/${s.id}`}
                  className="series-info__related-item"
                >
                  <Tag color="cyan">
                    {s.title}
                    {s.year ? ` (${s.year})` : ''}
                  </Tag>
                </Link>
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
