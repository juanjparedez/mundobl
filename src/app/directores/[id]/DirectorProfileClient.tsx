'use client';

import { Avatar, Card, Tag, Row, Col, Empty } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import Image from 'next/image';
import Link from 'next/link';
import './director-profile.css';

interface DirectorData {
  id: number;
  name: string;
  nationality?: string | null;
  imageUrl?: string | null;
  biography?: string | null;
  series: Array<{
    series: {
      id: number;
      title: string;
      year?: number | null;
      type: string;
      imageUrl?: string | null;
      country?: { name: string } | null;
    };
  }>;
}

interface DirectorProfileClientProps {
  director: DirectorData;
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

export function DirectorProfileClient({
  director,
}: DirectorProfileClientProps) {
  const filmography = director.series
    .map((entry) => entry.series)
    .sort((a, b) => {
      if (a.year && b.year) return b.year - a.year;
      if (a.year) return -1;
      if (b.year) return 1;
      return a.title.localeCompare(b.title);
    });

  return (
    <div className="director-profile">
      <Card>
        <div className="director-profile__header">
          {director.imageUrl ? (
            <Avatar
              src={director.imageUrl}
              size={120}
              className="director-profile__avatar"
            />
          ) : (
            <Avatar
              icon={<UserOutlined />}
              size={120}
              className="director-profile__avatar"
            />
          )}
          <div className="director-profile__info">
            <h1 className="director-profile__name">{director.name}</h1>
            <div className="director-profile__meta">
              {director.nationality && (
                <Tag color="blue">{director.nationality}</Tag>
              )}
              <Tag>{filmography.length} series dirigidas</Tag>
            </div>
          </div>
        </div>

        {director.biography && (
          <div className="director-profile__biography">
            <h3>Biografía</h3>
            <p>{director.biography}</p>
          </div>
        )}
      </Card>

      <Card
        title={`Filmografía (${filmography.length})`}
        className="director-profile__filmography"
      >
        {filmography.length === 0 ? (
          <Empty description="No hay series registradas" />
        ) : (
          <Row gutter={[16, 16]}>
            {filmography.map((entry) => (
              <Col xs={24} sm={12} md={8} lg={6} key={entry.id}>
                <Link href={`/series/${entry.id}`}>
                  <Card
                    hoverable
                    size="small"
                    className="director-profile__film-card"
                    cover={
                      entry.imageUrl ? (
                        <Image
                          alt={entry.title}
                          src={entry.imageUrl}
                          width={300}
                          height={180}
                          className="director-profile__film-image"
                          style={{
                            objectFit: 'cover',
                            width: '100%',
                            height: 'auto',
                          }}
                        />
                      ) : undefined
                    }
                  >
                    <Card.Meta
                      title={entry.title}
                      description={
                        <div className="director-profile__film-tags">
                          <Tag color={getTypeColor(entry.type)}>
                            {entry.type}
                          </Tag>
                          {entry.year && <Tag>{entry.year}</Tag>}
                          {entry.country && (
                            <span className="director-profile__country">
                              {entry.country.name}
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
