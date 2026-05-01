'use client';

import { Card, Tag, Row, Col, Empty } from 'antd';
import Image from 'next/image';
import Link from 'next/link';
import { CountryFlag } from '@/components/common/CountryFlag/CountryFlag';
import './tag-page.css';

interface TagSeriesEntry {
  series: {
    id: number;
    title: string;
    year?: number | null;
    type: string;
    imageUrl?: string | null;
    country?: { name: string; code?: string | null } | null;
    universe?: { name: string } | null;
  };
}

interface TagData {
  id: number;
  name: string;
  category?: string | null;
  series: TagSeriesEntry[];
}

interface TagPageClientProps {
  tag: TagData;
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

function getTypeLabel(type: string): string {
  switch (type.toLowerCase()) {
    case 'serie':
      return 'Serie';
    case 'pelicula':
      return 'Película';
    case 'corto':
      return 'Corto';
    case 'especial':
      return 'Especial';
    case 'anime':
      return 'Animé';
    case 'reality':
      return 'Reality';
    default:
      return type;
  }
}

export function TagPageClient({ tag }: TagPageClientProps) {
  const series = [...tag.series]
    .map((entry) => entry.series)
    .sort((a, b) => {
      if (a.year && b.year) return b.year - a.year;
      if (a.year) return -1;
      if (b.year) return 1;
      return a.title.localeCompare(b.title);
    });

  return (
    <div className="tag-page">
      <Card>
        <div className="tag-page__header">
          <Tag color="blue" className="tag-page__tag">
            {tag.name}
          </Tag>
          {tag.category && (
            <span className="tag-page__category">{tag.category}</span>
          )}
          <span className="tag-page__count">
            {series.length} título{series.length === 1 ? '' : 's'}
          </span>
        </div>
      </Card>

      <Card
        title={`Series con este tag (${series.length})`}
        className="tag-page__list"
      >
        {series.length === 0 ? (
          <Empty description="No hay series con este tag" />
        ) : (
          <Row gutter={[16, 16]}>
            {series.map((entry) => (
              <Col xs={24} sm={12} md={8} lg={6} key={entry.id}>
                <Link href={`/series/${entry.id}`}>
                  <Card
                    hoverable
                    size="small"
                    className="tag-page__card"
                    cover={
                      entry.imageUrl ? (
                        <Image
                          alt={entry.title}
                          src={entry.imageUrl}
                          width={200}
                          height={300}
                          className="tag-page__card-image"
                        />
                      ) : undefined
                    }
                  >
                    <Card.Meta
                      title={entry.title}
                      description={
                        <div className="tag-page__card-meta">
                          <div className="tag-page__card-tags">
                            <Tag color={getTypeColor(entry.type)}>
                              {getTypeLabel(entry.type)}
                            </Tag>
                            {entry.year && <Tag>{entry.year}</Tag>}
                          </div>
                          {entry.country && (
                            <span className="tag-page__card-country">
                              <CountryFlag code={entry.country.code} />{' '}
                              {entry.country.name}
                            </span>
                          )}
                          {entry.universe && (
                            <span className="tag-page__card-universe">
                              {entry.universe.name}
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
