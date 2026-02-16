'use client';

import { Descriptions, Tag, Card, Row, Col, Space, Divider, List, Rate } from 'antd';
import {
  CalendarOutlined,
  GlobalOutlined,
  VideoCameraOutlined,
  StarOutlined,
  UserOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { PageTitleClient } from '@/components/common/PageTitle/PageTitleClient';

interface SerieDetailProps {
  serie: any; // Usaremos el tipo completo de Prisma
}

export function SerieDetailClient({ serie }: SerieDetailProps) {
  const router = useRouter();

  const getTypeColor = (type: string) => {
    const colorMap: Record<string, string> = {
      serie: 'blue',
      pelicula: 'purple',
      corto: 'cyan',
      especial: 'orange',
    };
    return colorMap[type] || 'default';
  };

  // Obtener actores únicos de toda la serie (evita duplicados)
  const getAllUniqueActors = () => {
    const actorsMap = new Map();

    // Actores a nivel de serie
    if (serie.actors) {
      serie.actors.forEach((sa: any) => {
        const key = sa.actor.id;
        if (!actorsMap.has(key)) {
          actorsMap.set(key, {
            id: sa.actor.id,
            name: sa.actor.name,
            characters: [sa.character].filter(Boolean),
          });
        } else {
          const existing = actorsMap.get(key);
          if (sa.character && !existing.characters.includes(sa.character)) {
            existing.characters.push(sa.character);
          }
        }
      });
    }

    // Actores de temporadas
    if (serie.seasons) {
      serie.seasons.forEach((season: any) => {
        if (season.actors) {
          season.actors.forEach((sa: any) => {
            const key = sa.actor.id;
            if (!actorsMap.has(key)) {
              actorsMap.set(key, {
                id: sa.actor.id,
                name: sa.actor.name,
                characters: [sa.character].filter(Boolean),
              });
            } else {
              const existing = actorsMap.get(key);
              if (sa.character && !existing.characters.includes(sa.character)) {
                existing.characters.push(sa.character);
              }
            }
          });
        }
      });
    }

    return Array.from(actorsMap.values());
  };

  const uniqueActors = getAllUniqueActors();

  return (
    <div style={{ padding: '24px' }}>
      {/* Header con botón de volver */}
      <div style={{ marginBottom: '24px' }}>
        <a
          onClick={() => router.back()}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            color: 'var(--primary-color)',
          }}
        >
          <ArrowLeftOutlined />
          Volver al catálogo
        </a>
      </div>

      {/* Título y tags principales */}
      <div style={{ marginBottom: '24px' }}>
        <PageTitleClient level={2}>{serie.title}</PageTitleClient>
        {serie.originalTitle && serie.originalTitle !== serie.title && (
          <div
            style={{
              fontSize: '16px',
              color: 'var(--text-secondary)',
              marginBottom: '16px',
            }}
          >
            Título original: {serie.originalTitle}
          </div>
        )}
        <Space size="middle" wrap>
          <Tag color={getTypeColor(serie.type)} icon={<VideoCameraOutlined />}>
            {serie.type.toUpperCase()}
          </Tag>
          {serie.country && (
            <Tag icon={<GlobalOutlined />}>{serie.country.name}</Tag>
          )}
          {serie.year && <Tag icon={<CalendarOutlined />}>{serie.year}</Tag>}
          {serie.isNovel && <Tag color="gold">Basado en novela</Tag>}
          {serie.overallRating && (
            <Tag color="gold" icon={<StarOutlined />}>
              {serie.overallRating}/10
            </Tag>
          )}
        </Space>
      </div>

      <Row gutter={[24, 24]}>
        {/* Columna principal */}
        <Col xs={24} lg={16}>
          {/* Imagen de portada */}
          {serie.imageUrl && (
            <Card style={{ marginBottom: '24px' }}>
              <img
                src={serie.imageUrl}
                alt={serie.title}
                style={{
                  width: '100%',
                  maxHeight: '400px',
                  objectFit: 'cover',
                  borderRadius: '8px',
                }}
              />
            </Card>
          )}

          {/* Información básica */}
          <Card title="Información General" style={{ marginBottom: '24px' }}>
            <Descriptions column={1}>
              <Descriptions.Item label="Tipo">{serie.type}</Descriptions.Item>
              {serie.country && (
                <Descriptions.Item label="País de origen">
                  {serie.country.name}
                </Descriptions.Item>
              )}
              {serie.year && (
                <Descriptions.Item label="Año">{serie.year}</Descriptions.Item>
              )}
              {/* Solo mostrar temporadas/episodios para series, no para películas/cortos */}
              {serie.type === 'serie' && serie.seasons.length > 0 && (
                <>
                  <Descriptions.Item label="Temporadas">
                    {serie.seasons.length}
                  </Descriptions.Item>
                  <Descriptions.Item label="Total de episodios">
                    {serie.seasons.reduce(
                      (acc: number, s: any) => acc + (s.episodeCount || 0),
                      0
                    )}
                  </Descriptions.Item>
                </>
              )}
              {serie.isNovel && (
                <Descriptions.Item label="Basado en">
                  Novela
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>

          {/* Temporadas */}
          {serie.seasons.length > 0 && (
            <Card title="Temporadas" style={{ marginBottom: '24px' }}>
              <List
                dataSource={serie.seasons}
                renderItem={(season: any) => (
                  <List.Item>
                    <List.Item.Meta
                      title={
                        <Space>
                          <span>Temporada {season.seasonNumber}</span>
                          {season.title && (
                            <span style={{ color: 'var(--text-secondary)' }}>
                              - {season.title}
                            </span>
                          )}
                        </Space>
                      }
                      description={
                        <Space direction="vertical" size="small">
                          {season.episodeCount && (
                            <div>Episodios: {season.episodeCount}</div>
                          )}
                          {season.year && <div>Año: {season.year}</div>}
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
                          {/* Actores de esta temporada */}
                          {season.actors && season.actors.length > 0 && (
                            <div>
                              <strong>Actores:</strong>
                              <div style={{ marginTop: '8px' }}>
                                {season.actors.map((sa: any) => (
                                  <Tag key={sa.id} style={{ marginBottom: '4px' }}>
                                    {sa.actor.name}
                                    {sa.character && ` - ${sa.character}`}
                                  </Tag>
                                ))}
                              </div>
                            </div>
                          )}
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>
          )}

          {/* Observaciones */}
          {serie.observations && (
            <Card title="Observaciones" style={{ marginBottom: '24px' }}>
              <p style={{ whiteSpace: 'pre-wrap' }}>{serie.observations}</p>
            </Card>
          )}

          {/* Synopsis */}
          {serie.synopsis && (
            <Card title="Sinopsis" style={{ marginBottom: '24px' }}>
              <p style={{ whiteSpace: 'pre-wrap' }}>{serie.synopsis}</p>
            </Card>
          )}

          {/* Reseña personal */}
          {serie.review && (
            <Card title="Reseña Personal" style={{ marginBottom: '24px' }}>
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
                  Actores ({uniqueActors.length})
                </Space>
              }
              style={{ marginBottom: '24px' }}
            >
              <List
                dataSource={uniqueActors}
                renderItem={(actor: any) => (
                  <List.Item>
                    <List.Item.Meta
                      title={actor.name}
                      description={
                        actor.characters.length > 0
                          ? actor.characters.join(', ')
                          : 'Personaje no especificado'
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>
          )}

          {/* Ratings por categoría */}
          {serie.ratings && serie.ratings.length > 0 && (
            <Card title="Ratings por Categoría" style={{ marginBottom: '24px' }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                {serie.ratings.map((rating: any) => (
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
                      <Tag color="gold">{rating.score}/10</Tag>
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
            <Card title="Comentarios" style={{ marginBottom: '24px' }}>
              <List
                dataSource={serie.comments}
                renderItem={(comment: any) => (
                  <List.Item>
                    <div>{comment.content}</div>
                  </List.Item>
                )}
              />
            </Card>
          )}

          {/* Banda sonora */}
          {serie.soundtrack && (
            <Card title="Banda Sonora" style={{ marginBottom: '24px' }}>
              <p>{serie.soundtrack}</p>
            </Card>
          )}

          {/* Universo */}
          {serie.universe && (
            <Card title="Universo" style={{ marginBottom: '24px' }}>
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
