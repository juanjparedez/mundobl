import { Descriptions, Tag } from 'antd';
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
    } | null;
    seasons?: Array<{
      seasonNumber: number;
      episodeCount?: number | null;
    }>;
  };
}

function getBasedOnLabel(basedOn: string): string {
  const labels: Record<string, string> = {
    libro: '📖 Libro',
    novela: '📚 Novela',
    corto: '📄 Cuento/Relato',
    manga: '🎌 Manga',
    anime: '🎨 Anime',
  };
  return labels[basedOn.toLowerCase()] || basedOn;
}

export function SeriesInfo({ series }: SeriesInfoProps) {
  const totalEpisodes = series.seasons?.reduce(
    (sum, season) => sum + (season.episodeCount || 0),
    0
  );

  return (
    <div className="series-info">
      <Descriptions bordered column={2} size="middle">
        <Descriptions.Item label="Título" span={2}>
          {series.title}
        </Descriptions.Item>

        {series.originalTitle && series.originalTitle !== series.title && (
          <Descriptions.Item label="Título Original" span={2}>
            {series.originalTitle}
          </Descriptions.Item>
        )}

        <Descriptions.Item label="Año">
          {series.year || 'N/A'}
        </Descriptions.Item>

        <Descriptions.Item label="País">
          {series.country?.name || 'N/A'}
        </Descriptions.Item>

        <Descriptions.Item label="Tipo">
          <Tag color="blue">{series.type}</Tag>
        </Descriptions.Item>

        <Descriptions.Item label="Formato">
          <Tag color={series.format === 'vertical' ? 'orange' : 'blue'}>
            {series.format === 'vertical' ? '📲 Vertical' : '📱 Regular'}
          </Tag>
        </Descriptions.Item>

        {series.basedOn && (
          <Descriptions.Item label="Basado en" span={2}>
            <Tag color="green">{getBasedOnLabel(series.basedOn)}</Tag>
          </Descriptions.Item>
        )}

        <Descriptions.Item label="Temporadas">
          {series.seasons?.length || 0}
        </Descriptions.Item>

        <Descriptions.Item label="Episodios Totales">
          {totalEpisodes || 'N/A'}
        </Descriptions.Item>

        {series.soundtrack && (
          <Descriptions.Item label="Banda Sonora" span={2}>
            {series.soundtrack}
          </Descriptions.Item>
        )}
      </Descriptions>

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
    </div>
  );
}
