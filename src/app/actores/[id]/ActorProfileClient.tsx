'use client';

import { Avatar, Card, Tag, Row, Col, Empty } from 'antd';
import { UserOutlined, CalendarOutlined } from '@ant-design/icons';
import Image from 'next/image';
import Link from 'next/link';
import './actor-profile.css';

interface ActorData {
  id: number;
  name: string;
  stageName?: string | null;
  birthDate?: Date | string | null;
  nationality?: string | null;
  imageUrl?: string | null;
  biography?: string | null;
  series: Array<{
    character?: string | null;
    isMain: boolean;
    series: {
      id: number;
      title: string;
      year?: number | null;
      type: string;
      imageUrl?: string | null;
      country?: { name: string } | null;
    };
  }>;
  seasons: Array<{
    character?: string | null;
    isMain: boolean;
    season: {
      seasonNumber: number;
      series: {
        id: number;
        title: string;
        year?: number | null;
        type: string;
        imageUrl?: string | null;
        country?: { name: string } | null;
      };
    };
  }>;
}

interface ActorProfileClientProps {
  actor: ActorData;
}

function getTypeColor(type: string): string {
  switch (type) {
    case 'serie':
      return 'blue';
    case 'pelicula':
      return 'purple';
    case 'corto':
      return 'cyan';
    case 'especial':
      return 'orange';
    default:
      return 'default';
  }
}

function formatDate(date: Date | string | null | undefined): string | null {
  if (!date) return null;
  const d = new Date(date);
  return d.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function ActorProfileClient({ actor }: ActorProfileClientProps) {
  // Build unique filmography entries from series + seasons
  const filmographyMap = new Map<
    number,
    {
      seriesId: number;
      title: string;
      year?: number | null;
      type: string;
      imageUrl?: string | null;
      countryName?: string | null;
      characters: string[];
      isMain: boolean;
    }
  >();

  // Add series-level entries
  actor.series.forEach((entry) => {
    const key = entry.series.id;
    const existing = filmographyMap.get(key);
    if (existing) {
      if (entry.character && !existing.characters.includes(entry.character)) {
        existing.characters.push(entry.character);
      }
      if (entry.isMain) existing.isMain = true;
    } else {
      filmographyMap.set(key, {
        seriesId: entry.series.id,
        title: entry.series.title,
        year: entry.series.year,
        type: entry.series.type,
        imageUrl: entry.series.imageUrl,
        countryName: entry.series.country?.name,
        characters: entry.character ? [entry.character] : [],
        isMain: entry.isMain,
      });
    }
  });

  // Add season-level entries
  actor.seasons.forEach((entry) => {
    const key = entry.season.series.id;
    const existing = filmographyMap.get(key);
    if (existing) {
      if (entry.character && !existing.characters.includes(entry.character)) {
        existing.characters.push(entry.character);
      }
      if (entry.isMain) existing.isMain = true;
    } else {
      filmographyMap.set(key, {
        seriesId: entry.season.series.id,
        title: entry.season.series.title,
        year: entry.season.series.year,
        type: entry.season.series.type,
        imageUrl: entry.season.series.imageUrl,
        countryName: entry.season.series.country?.name,
        characters: entry.character ? [entry.character] : [],
        isMain: entry.isMain,
      });
    }
  });

  const filmography = Array.from(filmographyMap.values()).sort((a, b) => {
    if (a.year && b.year) return b.year - a.year;
    if (a.year) return -1;
    if (b.year) return 1;
    return a.title.localeCompare(b.title);
  });

  return (
    <div className="actor-profile">
      <Card>
        <div className="actor-profile__header">
          {actor.imageUrl ? (
            <Avatar
              src={actor.imageUrl}
              size={120}
              className="actor-profile__avatar"
            />
          ) : (
            <Avatar
              icon={<UserOutlined />}
              size={120}
              className="actor-profile__avatar"
            />
          )}
          <div className="actor-profile__info">
            <h1 className="actor-profile__name">{actor.name}</h1>
            {actor.stageName && (
              <p className="actor-profile__stage-name">{actor.stageName}</p>
            )}
            <div className="actor-profile__meta">
              {actor.nationality && <Tag color="blue">{actor.nationality}</Tag>}
              {actor.birthDate && (
                <Tag icon={<CalendarOutlined />}>
                  {formatDate(actor.birthDate)}
                </Tag>
              )}
              <Tag>{filmography.length} participaciones</Tag>
            </div>
          </div>
        </div>

        {actor.biography && (
          <div className="actor-profile__biography">
            <h3>Biografía</h3>
            <p>{actor.biography}</p>
          </div>
        )}
      </Card>

      <Card
        title={`Filmografía (${filmography.length})`}
        className="actor-profile__filmography"
      >
        {filmography.length === 0 ? (
          <Empty description="No hay participaciones registradas" />
        ) : (
          <Row gutter={[16, 16]}>
            {filmography.map((entry) => (
              <Col xs={24} sm={12} md={8} lg={6} key={entry.seriesId}>
                <Link href={`/series/${entry.seriesId}`}>
                  <Card
                    hoverable
                    size="small"
                    className="actor-profile__film-card"
                    cover={
                      entry.imageUrl ? (
                        <Image
                          alt={entry.title}
                          src={entry.imageUrl}
                          width={200}
                          height={300}
                          className="actor-profile__film-image"
                        />
                      ) : undefined
                    }
                  >
                    <Card.Meta
                      title={entry.title}
                      description={
                        <div className="actor-profile__film-meta">
                          <div className="actor-profile__film-tags">
                            <Tag color={getTypeColor(entry.type)}>
                              {entry.type}
                            </Tag>
                            {entry.year && <Tag>{entry.year}</Tag>}
                            {entry.isMain && (
                              <Tag color="red">Protagonista</Tag>
                            )}
                          </div>
                          {entry.characters.length > 0 && (
                            <span className="actor-profile__character">
                              {entry.characters.join(', ')}
                            </span>
                          )}
                          {entry.countryName && (
                            <span className="actor-profile__country">
                              {entry.countryName}
                            </span>
                          )}
                        </div>
                      }
                    />
                  </Card>
                </Link>
              </Col>
            ))}
          </Row>
        )}
      </Card>
    </div>
  );
}
