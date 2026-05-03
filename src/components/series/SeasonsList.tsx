'use client';

import { Collapse, Tag, Row, Col, Avatar, Button } from 'antd';
import {
  CalendarOutlined,
  PlayCircleOutlined,
  EditOutlined,
} from '@ant-design/icons';
import Link from 'next/link';
import { EpisodesList } from './EpisodesList';
import { CommentsList } from '@/components/common/CommentsList';
import './SeasonsList.css';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { interpolateMessage } from '@/lib/i18n-format';

interface SeasonsListProps {
  seasons: Array<{
    id: number;
    seasonNumber: number;
    title?: string | null;
    episodeCount?: number | null;
    year?: number | null;
    synopsis?: string | null;
    observations?: string | null;
    actors?: Array<{
      actor: {
        id: number;
        name: string;
        imageUrl?: string | null;
      };
      character?: string | null;
      isMain: boolean;
    }>;
    ratings?: Array<{
      category: string;
      score: number;
    }>;
    comments?: Array<{
      id: number;
      content: string;
      createdAt: Date;
      updatedAt: Date;
    }>;
    viewStatus?: Array<{
      status: string;
      watchedDate?: Date | null;
    }>;
    episodes?: Array<{
      id: number;
      episodeNumber: number;
      title?: string | null;
      duration?: number | null;
      synopsis?: string | null;
      viewStatus?: Array<{
        status: string;
        watchedDate?: Date | null;
      }> | null;
      comments?: Array<{
        id: number;
        content: string;
        createdAt: Date;
        updatedAt: Date;
      }> | null;
    }>;
  }>;
}

export function SeasonsList({ seasons }: SeasonsListProps) {
  const { t } = useLocale();
  if (!seasons || seasons.length === 0) {
    return (
      <div className="seasons-empty">
        <span style={{ color: 'var(--text-secondary)' }}>
          {t('seasonsList.emptyText')}
        </span>
      </div>
    );
  }

  const sortedSeasons = [...seasons].sort(
    (a, b) => a.seasonNumber - b.seasonNumber
  );

  const getEpisodeWatchProgress = (season: (typeof seasons)[0]) => {
    if (!season.episodes || season.episodes.length === 0) return null;
    const watchedCount = season.episodes.filter(
      (ep) => ep.viewStatus?.[0]?.status === 'VISTA'
    ).length;
    const totalCount = season.episodes.length;
    return { watchedCount, totalCount };
  };

  const collapseItems = sortedSeasons.map((season) => {
    const episodeProgress = getEpisodeWatchProgress(season);
    return {
      key: season.id.toString(),
      label: (
        <div className="season-header">
          <span className="season-header__title">
            <strong>{interpolateMessage(t('seasonsList.seasonLabel'), { n: String(season.seasonNumber) })}</strong>
            {season.title && ` - ${season.title}`}
          </span>
          <div className="season-header__meta">
            {season.year && (
              <Tag icon={<CalendarOutlined />} color="blue">
                {season.year}
              </Tag>
            )}
            {season.episodeCount && (
              <Tag icon={<PlayCircleOutlined />} color="green">
                {interpolateMessage(t('seasonsList.capsTag'), { n: String(season.episodeCount) })}
              </Tag>
            )}
            {season.viewStatus?.[0]?.status === 'VISTA' && (
              <Tag color="success">✓ {t('seasonsList.watchedTag')}</Tag>
            )}
            {episodeProgress && episodeProgress.totalCount > 0 && (
              <Tag
                color={
                  episodeProgress.watchedCount === episodeProgress.totalCount
                    ? 'success'
                    : 'default'
                }
              >
                📺 {episodeProgress.watchedCount}/{episodeProgress.totalCount}{' '}
                {t('seasonsList.watchedTag').toLowerCase()}
              </Tag>
            )}
            <Link
              href={`/admin/seasons/${season.id}/editar`}
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={(e) => e.stopPropagation()}
              >
                {t('seasonsList.editButton')}
              </Button>
            </Link>
          </div>
        </div>
      ),
      children: (
        <div className="season-content">
          {season.synopsis && (
            <div className="season-content__synopsis">
              <h5 className="season-section-title">
                📖 {t('seasonsList.synopsisTitle')}
              </h5>
              <p>{season.synopsis}</p>
            </div>
          )}

          {season.observations && (
            <div className="season-content__observations">
              <h5 className="season-section-title">📝 {t('seasonsList.observationsTitle')}</h5>
              <p
                style={{
                  color: 'var(--text-secondary)',
                  margin: 0,
                  lineHeight: 1.6,
                }}
              >
                {season.observations}
              </p>
            </div>
          )}

          {/* Comentarios de la temporada */}
          <div className="season-content__comments">
            <h5 className="season-section-title">
              💬 {t('seasonsList.commentsTitle')}
            </h5>
            <CommentsList
              seasonId={season.id}
              initialComments={season.comments || []}
              compact={true}
              placeholder="Escribe tus comentarios sobre esta temporada, arcos narrativos, desarrollo de personajes..."
            />
          </div>

          {season.ratings && season.ratings.length > 0 && (
            <div className="season-content__ratings">
              <h5 className="season-section-title">
                ⭐ {t('seasonsList.ratingsTitle')}
              </h5>
              <div className="ratings-grid">
                {season.ratings.map((rating) => (
                  <div key={rating.category} className="rating-item">
                    <strong>{capitalizeFirst(rating.category)}:</strong>
                    <Tag color={getRatingColor(rating.score)}>
                      {rating.score}/10
                    </Tag>
                  </div>
                ))}
              </div>
            </div>
          )}

          {season.actors && season.actors.length > 0 && (
            <div className="season-content__actors">
              <h5 className="season-section-title">
                👥 {interpolateMessage(t('seasonsList.castTitle'), { n: String(season.actors.length) })}
              </h5>
              <Row gutter={[16, 16]}>
                {season.actors.map((actorInfo) => (
                  <Col
                    key={`${actorInfo.actor.name}-${actorInfo.character}`}
                    xs={24}
                    sm={12}
                    md={8}
                    lg={6}
                  >
                    <div className="actor-card">
                      {actorInfo.actor.imageUrl && (
                        <Avatar src={actorInfo.actor.imageUrl} size={64} />
                      )}
                      <div className="actor-card__info">
                        <Link href={`/actores/${actorInfo.actor.id}`}>
                          <strong>{actorInfo.actor.name}</strong>
                        </Link>
                        {actorInfo.character && (
                          <span
                            style={{ color: 'var(--text-secondary)' }}
                            className="actor-card__character"
                          >
                            → {actorInfo.character}
                          </span>
                        )}
                        {actorInfo.isMain && (
                          <Tag color="red">{t('seasonsList.protagonistTag')}</Tag>
                        )}
                      </div>
                    </div>
                  </Col>
                ))}
              </Row>
            </div>
          )}

          {/* Episodios de la temporada */}
          <EpisodesList
            seasonId={season.id}
            initialEpisodes={season.episodes || []}
          />
        </div>
      ),
    };
  });

  return (
    <Collapse
      defaultActiveKey={[sortedSeasons[0]?.id.toString()]}
      className="seasons-list"
      items={collapseItems}
    />
  );
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function getRatingColor(score: number): string {
  if (score >= 9) return 'green';
  if (score >= 7) return 'blue';
  if (score >= 5) return 'orange';
  return 'red';
}
