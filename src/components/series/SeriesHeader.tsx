import { Tag } from 'antd';
import { CalendarOutlined, GlobalOutlined, BookOutlined, MobileOutlined } from '@ant-design/icons';
import './SeriesHeader.css';

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
        name: string;
        category?: string | null;
      };
    }>;
  };
}

export function SeriesHeader({ series }: SeriesHeaderProps) {
  return (
    <div className="series-header">
      {series.imageUrl && (
        <div className="series-header__image">
          <img src={series.imageUrl} alt={series.title} />
        </div>
      )}

      <div className="series-header__content">
        {series.universe && (
          <div className="series-header__universe">
            <span style={{ color: 'var(--text-secondary)' }}>
              Universo: <strong>{series.universe.name}</strong>
            </span>
          </div>
        )}

        <h1 className="series-header__title">{series.title}</h1>

        {series.originalTitle && series.originalTitle !== series.title && (
          <span
            className="series-header__original-title"
            style={{ color: 'var(--text-secondary)' }}
          >
            Título original: {series.originalTitle}
          </span>
        )}

        <div className="series-header__meta">
          {series.year && (
            <span className="series-header__meta-item">
              <CalendarOutlined /> {series.year}
            </span>
          )}

          {series.country && (
            <span className="series-header__meta-item">
              <GlobalOutlined /> {series.country.name}
            </span>
          )}

          {series.basedOn && (
            <span className="series-header__meta-item">
              <BookOutlined /> Basado en {getBasedOnLabel(series.basedOn)}
            </span>
          )}

          {series.format === 'vertical' && (
            <span className="series-header__meta-item">
              <MobileOutlined /> Formato Vertical
            </span>
          )}

          <Tag color={getTypeColor(series.type)}>{getTypeLabel(series.type)}</Tag>

          {series.overallRating && (
            <Tag color="gold">★ {series.overallRating}/10</Tag>
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
              <Tag key={st.tag.name} color="blue">
                {st.tag.name}
              </Tag>
            ))}
          </div>
        )}
      </div>
    </div>
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
    default:
      return type;
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
