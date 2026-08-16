'use client';

import {
  Descriptions,
  Tag,
  Card,
  Row,
  Col,
  Space,
  Divider,
  Rate,
  List,
} from 'antd';
import {
  CalendarOutlined,
  GlobalOutlined,
  VideoCameraOutlined,
  StarOutlined,
  UserOutlined,
  ArrowLeftOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { PageTitleClient } from '@/components/common/PageTitle/PageTitleClient';
import { isSupabaseImageUrl } from '@/lib/image-helpers';
import { useLocale } from '@/lib/providers/LocaleProvider';
import './serie-detail.css';

interface ActorRelation {
  id: number;
  actor: {
    id: number;
    name: string;
  };
  character?: string | null;
}

interface SeasonData {
  seasonNumber: number;
  title?: string | null;
  episodeCount?: number | null;
  year?: number | null;
  observations?: string | null;
  actors?: ActorRelation[];
}

interface RatingData {
  id: number;
  category: string;
  score: number;
}

interface CommentData {
  id: number;
  content: string;
}

interface SerieDetail {
  id?: number;
  title: string;
  originalTitle?: string | null;
  type: string;
  year?: number | null;
  imageUrl?: string | null;
  synopsis?: string | null;
  observations?: string | null;
  review?: string | null;
  notesPrivate?: boolean;
  soundtrack?: string | null;
  isNovel?: boolean | null;
  overallRating?: number | null;
  country?: { name: string } | null;
  actors?: ActorRelation[];
  seasons: SeasonData[];
  ratings?: RatingData[];
  comments?: CommentData[];
  universe?: {
    name: string;
    description?: string | null;
  } | null;
}

interface SerieDetailProps {
  serie: SerieDetail;
}

export function SerieDetailClient({ serie }: SerieDetailProps) {
  const { t } = useLocale();
  const router = useRouter();
  const { data: session } = useSession();
  const canSeeNotes = !serie.notesPrivate || session?.user?.role === 'ADMIN';

  const getTypeColor = (type: string) => {
    const colorMap: Record<string, string> = {
      serie: 'blue',
      pelicula: 'purple',
      corto: 'cyan',
      especial: 'orange',
    };
    return colorMap[type] || 'default';
  };

  const getTranslatedType = (type: string) => {
    switch (type) {
      case 'serie':
        return t('serieDetail.typeSerie');
      case 'pelicula':
        return t('serieDetail.typeMovie');
      case 'corto':
        return t('serieDetail.typeShort');
      case 'especial':
        return t('serieDetail.typeSpecial');
      default:
        return type.toUpperCase();
    }
  };

  // Obtener actores únicos de toda la serie (evita duplicados)
  const getAllUniqueActors = () => {
    const actorsMap = new Map<
      number,
      { id: number; name: string; characters: string[] }
    >();

    const addActor = (sa: ActorRelation) => {
      const key = sa.actor.id;
      if (!actorsMap.has(key)) {
        actorsMap.set(key, {
          id: sa.actor.id,
          name: sa.actor.name,
          characters: sa.character ? [sa.character] : [],
        });
      } else {
        const existing = actorsMap.get(key)!;
        if (sa.character && !existing.characters.includes(sa.character)) {
          existing.characters.push(sa.character);
        }
      }
    };

    // Actores a nivel de serie
    if (serie.actors) {
      serie.actors.forEach(addActor);
    }

    // Actores de temporadas
    if (serie.seasons) {
      serie.seasons.forEach((season: SeasonData) => {
        if (season.actors) {
          season.actors.forEach(addActor);
        }
      });
    }

    return Array.from(actorsMap.values());
  };

  const uniqueActors = getAllUniqueActors();

  return (
    <div style={{ padding: '12px' }}>
      {/* Header con botón de volver */}
      <div
        style={{
          marginBottom: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '6px',
          flexWrap: 'wrap',
        }}
      >
        <a
          onClick={() => router.back()}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            color: 'var(--primary-color)',
          }}
        >
          <ArrowLeftOutlined />
          {t('serieDetail.backToCatalog')}
        </a>
        {serie.id && (
          <a
            href={`/catalogo/${serie.id}/dashboard`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: 'var(--border-radius-base)',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-spotlight)',
              color: 'var(--text-primary)',
              textDecoration: 'none',
              fontSize: 'var(--font-size-sm)',
            }}
          >
            <AppstoreOutlined />
            {t('serieDashboard.fromClassicLink')}
          </a>
        )}
      </div>

      {/* Título y tags principales */}
      <div style={{ marginBottom: '10px' }}>
        <PageTitleClient level={2}>{serie.title}</PageTitleClient>
        {serie.originalTitle && serie.originalTitle !== serie.title && (
          <div
            style={{
              fontSize: '13px',
              color: 'var(--text-secondary)',
              marginBottom: '8px',
            }}
          >
            {t('serieDetail.originalTitle')} {serie.originalTitle}
          </div>
        )}
        <Space size="middle" wrap>
          <Tag color={getTypeColor(serie.type)} icon={<VideoCameraOutlined />}>
            {getTranslatedType(serie.type)}
          </Tag>
          {serie.country && (
            <Tag icon={<GlobalOutlined />}>{serie.country.name}</Tag>
          )}
          {serie.year && <Tag icon={<CalendarOutlined />}>{serie.year}</Tag>}
          {serie.isNovel && (
            <Tag color="gold">{t('serieDetail.basedOnNovel')}</Tag>
          )}
          {serie.overallRating && (
            <Tag color="gold" icon={<StarOutlined />}>
              {t('serieDetail.overallRating', { rating: serie.overallRating })}
            </Tag>
          )}
        </Space>
      </div>

      <Row gutter={[12, 12]}>
        {/* Columna principal */}
        <Col xs={24} lg={16}>
          {/* Imagen de portada */}
          {serie.imageUrl && (
            <Card style={{ marginBottom: '10px' }}>
              <Image
                src={serie.imageUrl}
                alt={serie.title}
                width={800}
                height={400}
                sizes="(max-width: 768px) 100vw, 800px"
                quality={70}
                unoptimized={isSupabaseImageUrl(serie.imageUrl)}
                className="serie-detail__cover-img"
              />
            </Card>
          )}

          {/* Información básica */}
          <Card
            title={t('serieDetail.generalInformationTitle')}
            style={{ marginBottom: '10px' }}
          >
            <Descriptions column={1}>
              <Descriptions.Item label={t('serieDetail.typeLabel')}>
                {getTranslatedType(serie.type)}
              </Descriptions.Item>
              {serie.country && (
                <Descriptions.Item
                  label={t('serieDetail.countryOfOriginLabel')}
                >
                  {serie.country.name}
                </Descriptions.Item>
              )}
              {serie.year && (
                <Descriptions.Item label={t('serieDetail.yearLabel')}>
                  {serie.year}
                </Descriptions.Item>
              )}
              {/* Solo mostrar temporadas/episodios para series, no para películas/cortos */}
              {serie.type === 'serie' && serie.seasons.length > 0 && (
                <>
                  <Descriptions.Item label={t('serieDetail.seasonsLabel')}>
                    {serie.seasons.length}
                  </Descriptions.Item>
                  <Descriptions.Item
                    label={t('serieDetail.totalEpisodesLabel')}
                  >
                    {serie.seasons.reduce(
                      (acc: number, s: SeasonData) =>
                        acc + (s.episodeCount || 0),
                      0
                    )}
                  </Descriptions.Item>
                </>
              )}
              {serie.isNovel && (
                <Descriptions.Item label={t('serieDetail.basedOnLabel')}>
                  {t('serieDetail.novelValue')}
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>

          {/* Temporadas */}
          {serie.seasons.length > 0 && (
            <Card
              title={t('serieDetail.seasonsTitle')}
              style={{ marginBottom: '10px' }}
            >
              <div>
                {serie.seasons.map((season: SeasonData) => (
                  <div
                    key={season.seasonNumber}
                    style={{
                      padding: '12px 0',
                      borderBottom: '1px solid var(--border-color)',
                    }}
                  >
                    <div>
                      <Space>
                        <span>
                          {t('serieDetail.seasonNumber', {
                            number: season.seasonNumber,
                          })}
                        </span>
                        {season.title && (
                          <span style={{ color: 'var(--text-secondary)' }}>
                            - {season.title}
                          </span>
                        )}
                      </Space>
                    </div>
                    <Space
                      orientation="vertical"
                      size="small"
                      style={{ marginTop: '8px' }}
                    >
                      {season.episodeCount && (
                        <div>
                          {t('serieDetail.episodesCount', {
                            count: season.episodeCount,
                          })}
                        </div>
                      )}
                      {season.year && (
                        <div>
                          {t('serieDetail.yearValue', { year: season.year })}
                        </div>
                      )}
                      {season.observations && (
                        <div
                          style={{
                            fontSize: '12px',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          {season.observations}
                        </div>
                      )}
                      {season.actors && season.actors.length > 0 && (
                        <div>
                          <strong>{t('serieDetail.actorsLabel')}</strong>
                          <div style={{ marginTop: '8px' }}>
                            {season.actors.map((sa: ActorRelation) => (
                              <Tag
                                key={sa.actor.id}
                                style={{ marginBottom: '4px' }}
                              >
                                {sa.actor.name}
                                {sa.character && ` - ${sa.character}`}
                              </Tag>
                            ))}
                          </div>
                        </div>
                      )}
                    </Space>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Observaciones */}
          {serie.observations && canSeeNotes && (
            <Card
              title={t('serieDetail.observationsTitle')}
              style={{ marginBottom: '10px' }}
            >
              <p style={{ whiteSpace: 'pre-wrap' }}>{serie.observations}</p>
            </Card>
          )}

          {/* Synopsis */}
          {serie.synopsis && (
            <Card
              title={t('serieDetail.synopsisTitle')}
              style={{ marginBottom: '10px' }}
            >
              <p style={{ whiteSpace: 'pre-wrap' }}>{serie.synopsis}</p>
            </Card>
          )}

          {/* Reseña personal */}
          {serie.review && canSeeNotes && (
            <Card
              title={t('serieDetail.personalReviewTitle')}
              style={{ marginBottom: '10px' }}
            >
              <p style={{ whiteSpace: 'pre-wrap' }}>{serie.review}</p>
            </Card>
          )}
        </Col>

        {/* Columna lateral */}
        <Col xs={24} lg={8}>
          {/* Actores principales */}
          {uniqueActors.length > 0 && (
            <Card
              title={
                <Space>
                  <UserOutlined />
                  {t('serieDetail.actorsCountTitle', {
                    count: uniqueActors.length,
                  })}
                </Space>
              }
              style={{ marginBottom: '10px' }}
            >
              <div>
                {uniqueActors.map((actor) => (
                  <div
                    key={actor.id}
                    style={{
                      padding: '8px 0',
                      borderBottom: '1px solid var(--border-color)',
                    }}
                  >
                    <div>
                      <strong>{actor.name}</strong>
                    </div>
                    <div
                      style={{
                        color: 'var(--text-secondary)',
                        fontSize: '14px',
                      }}
                    >
                      {actor.characters.length > 0
                        ? actor.characters.join(', ')
                        : t('serieDetail.characterNotSpecified')}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Ratings por categoría */}
          {serie.ratings && serie.ratings.length > 0 && (
            <Card
              title={t('serieDetail.ratingsByCategoryTitle')}
              style={{ marginBottom: '10px' }}
            >
              <Space orientation="vertical" style={{ width: '100%' }}>
                {serie.ratings.map((rating: RatingData) => (
                  <div key={rating.id}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '8px',
                      }}
                    >
                      <span style={{ textTransform: 'capitalize' }}>
                        {rating.category}:
                      </span>
                      <Tag color="gold">
                        {t('serieDetail.ratingScore', { score: rating.score })}
                      </Tag>
                    </div>
                    <Rate disabled defaultValue={rating.score / 2} />
                    <Divider style={{ margin: '12px 0' }} />
                  </div>
                ))}
              </Space>
            </Card>
          )}

          {/* Comentarios */}
          {serie.comments && serie.comments.length > 0 && (
            <Card
              title={t('serieDetail.commentsTitle')}
              style={{ marginBottom: '10px' }}
            >
              <List
                dataSource={serie.comments}
                renderItem={(comment: CommentData) => (
                  <List.Item>
                    <div>{comment.content}</div>
                  </List.Item>
                )}
              />
            </Card>
          )}

          {/* Banda sonora */}
          {serie.soundtrack && (
            <Card
              title={t('serieDetail.soundtrackTitle')}
              style={{ marginBottom: '10px' }}
            >
              <p>{serie.soundtrack}</p>
            </Card>
          )}

          {/* Universo */}
          {serie.universe && (
            <Card
              title={t('serieDetail.universeTitle')}
              style={{ marginBottom: '10px' }}
            >
              <Tag color="purple" style={{ fontSize: '14px' }}>
                {serie.universe.name}
              </Tag>
              {serie.universe.description && (
                <p style={{ marginTop: '12px', fontSize: '12px' }}>
                  {serie.universe.description}
                </p>
              )}
            </Card>
          )}
        </Col>
      </Row>
    </div>
  );
}
