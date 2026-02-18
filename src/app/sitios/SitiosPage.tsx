'use client';

import { AppLayout } from '@/components/layout/AppLayout/AppLayout';
import { Card, Tag, Row, Col, Empty } from 'antd';
import { LinkOutlined } from '@ant-design/icons';
import './sitios.css';

const CATEGORY_COLORS: Record<string, string> = {
  noticias: 'blue',
  comunidad: 'green',
  streaming: 'purple',
  info: 'cyan',
  otro: 'default',
};

const CATEGORY_LABELS: Record<string, string> = {
  noticias: 'Noticias',
  comunidad: 'Comunidad',
  streaming: 'Streaming',
  info: 'Información',
  otro: 'Otros',
};

interface Site {
  id: number;
  name: string;
  url: string;
  description: string | null;
  category: string | null;
  language: string | null;
  imageUrl: string | null;
  sortOrder: number;
}

interface SitiosPageProps {
  sites: Site[];
}

export function SitiosPage({ sites }: SitiosPageProps) {
  if (sites.length === 0) {
    return (
      <AppLayout>
        <div className="sitios-public">
          <h1 className="sitios-public__title">Sitios de Interés</h1>
          <Empty description="Aún no hay sitios recomendados" />
        </div>
      </AppLayout>
    );
  }

  // Group by category
  const grouped = sites.reduce<Record<string, Site[]>>((acc, site) => {
    const cat = site.category || 'otro';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(site);
    return acc;
  }, {});

  const categoryOrder = ['streaming', 'noticias', 'info', 'comunidad', 'otro'];
  const sortedCategories = Object.keys(grouped).sort(
    (a, b) => categoryOrder.indexOf(a) - categoryOrder.indexOf(b)
  );

  return (
    <AppLayout>
      <div className="sitios-public">
        <h1 className="sitios-public__title">Sitios de Interés</h1>
        <p className="sitios-public__subtitle">
          Sitios recomendados relacionados con el mundo BL
        </p>

        {sortedCategories.map((category) => (
          <div key={category}>
            <h2 className="sitios-public__category-title">
              {CATEGORY_LABELS[category] || category}
            </h2>
            <Row gutter={[16, 16]}>
              {grouped[category].map((site) => (
                <Col xs={24} sm={12} md={8} lg={6} key={site.id}>
                  <a
                    href={site.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: 'none' }}
                  >
                    <Card
                      className="sitios-card"
                      size="small"
                      title={
                        <>
                          <LinkOutlined /> {site.name}
                        </>
                      }
                      extra={
                        <Tag color={CATEGORY_COLORS[category] || 'default'}>
                          {CATEGORY_LABELS[category] || category}
                        </Tag>
                      }
                    >
                      {site.description && (
                        <p className="sitios-card__description">
                          {site.description}
                        </p>
                      )}
                      <div className="sitios-card__footer">
                        <span className="sitios-card__link">
                          {new URL(site.url).hostname}
                        </span>
                        {site.language && <Tag>{site.language}</Tag>}
                      </div>
                    </Card>
                  </a>
                </Col>
              ))}
            </Row>
          </div>
        ))}
      </div>
    </AppLayout>
  );
}
