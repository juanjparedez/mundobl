'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { AppLayout } from '@/components/layout/AppLayout/AppLayout';
import { Card, Col, Row, Select, Space, Tag, Modal, Button, Empty } from 'antd';
import { LinkOutlined, PlayCircleOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { ContentDisclaimer } from '@/components/common/ContentDisclaimer/ContentDisclaimer';
import { EmbedPlayer } from '@/components/common/EmbedPlayer/EmbedPlayer';
import {
  PLATFORM_OPTIONS,
  CATEGORY_OPTIONS,
  CATEGORY_LABELS,
  PLATFORM_COLORS,
} from '@/lib/embed-helpers';
import './contenido.css';

interface EmbeddableContentItem {
  id: number;
  title: string;
  description: string | null;
  platform: string;
  url: string;
  videoId: string | null;
  category: string;
  language: string | null;
  thumbnailUrl: string | null;
  channelName: string | null;
  channelUrl: string | null;
  official: boolean;
  sortOrder: number;
  featured: boolean;
  seriesId: number | null;
  series: { id: number; title: string } | null;
}

interface ContenidoPageProps {
  items: EmbeddableContentItem[];
}

export function ContenidoPage({ items }: ContenidoPageProps) {
  const [platformFilter, setPlatformFilter] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [channelFilter, setChannelFilter] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] =
    useState<EmbeddableContentItem | null>(null);

  const channelOptions = useMemo(
    () =>
      [...new Set(items.map((i) => i.channelName).filter(Boolean))].map(
        (name) => ({ label: name as string, value: name as string })
      ),
    [items]
  );

  const filtered = useMemo(
    () =>
      items.filter((item) => {
        if (platformFilter && item.platform !== platformFilter) return false;
        if (categoryFilter && item.category !== categoryFilter) return false;
        if (channelFilter && item.channelName !== channelFilter) return false;
        return true;
      }),
    [items, platformFilter, categoryFilter, channelFilter]
  );

  if (items.length === 0) {
    return (
      <AppLayout>
        <div className="contenido-page">
          <h1 className="contenido-page__title">Contenido</h1>
          <Empty description="Aún no hay contenido disponible" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="contenido-page">
        <h1 className="contenido-page__title">Contenido</h1>
        <p className="contenido-page__subtitle">
          Trailers, OSTs, entrevistas y más desde plataformas oficiales
        </p>

        <ContentDisclaimer />

        <div className="contenido-page__filters">
          <Space wrap>
            <Select
              placeholder="Plataforma"
              options={PLATFORM_OPTIONS}
              allowClear
              style={{ width: 160 }}
              onChange={(val: string | undefined) =>
                setPlatformFilter(val ?? null)
              }
            />
            <Select
              placeholder="Categoría"
              options={CATEGORY_OPTIONS}
              allowClear
              style={{ width: 180 }}
              onChange={(val: string | undefined) =>
                setCategoryFilter(val ?? null)
              }
            />
            {channelOptions.length > 0 && (
              <Select
                placeholder="Canal / Fuente"
                options={channelOptions}
                allowClear
                showSearch
                style={{ width: 200 }}
                filterOption={(input, option) =>
                  (option?.label as string)
                    ?.toLowerCase()
                    .includes(input.toLowerCase())
                }
                onChange={(val: string | undefined) =>
                  setChannelFilter(val ?? null)
                }
              />
            )}
          </Space>
        </div>

        {filtered.length === 0 ? (
          <Empty description="No hay contenido con estos filtros" />
        ) : (
          <Row gutter={[16, 16]}>
            {filtered.map((item) => (
              <Col xs={24} sm={12} lg={8} key={item.id}>
                <Card
                  className={`contenido-card ${item.featured ? 'contenido-card--featured' : ''}`}
                  cover={
                    item.thumbnailUrl ? (
                      <Image
                        alt={item.title}
                        src={item.thumbnailUrl}
                        className="contenido-card__thumbnail"
                        width={480}
                        height={270}
                        unoptimized
                      />
                    ) : (
                      <div className="contenido-card__thumbnail-placeholder">
                        <PlayCircleOutlined className="contenido-card__play-icon" />
                      </div>
                    )
                  }
                  actions={[
                    <Button
                      key="play"
                      type="primary"
                      icon={<PlayCircleOutlined />}
                      onClick={() => setSelectedItem(item)}
                      block
                    >
                      Ver
                    </Button>,
                  ]}
                >
                  <Card.Meta
                    title={item.title}
                    description={
                      <Space
                        direction="vertical"
                        size={4}
                        style={{ width: '100%' }}
                      >
                        <Space wrap>
                          <Tag
                            color={PLATFORM_COLORS[item.platform] || 'default'}
                          >
                            {item.platform}
                          </Tag>
                          <Tag>
                            {CATEGORY_LABELS[item.category] || item.category}
                          </Tag>
                          {item.language && <Tag>{item.language}</Tag>}
                          {!item.official && (
                            <Tag color="orange">No oficial</Tag>
                          )}
                        </Space>
                        {item.channelName && (
                          <span className="contenido-card__channel">
                            {item.channelUrl ? (
                              <a
                                href={item.channelUrl}
                                target="_blank"
                                rel="noopener noreferrer nofollow"
                                onClick={(e) => e.stopPropagation()}
                                className="contenido-card__channel-link"
                              >
                                {item.channelName}
                              </a>
                            ) : (
                              item.channelName
                            )}
                          </span>
                        )}
                        {item.series && (
                          <Link
                            href={`/series/${item.series.id}`}
                            className="contenido-card__series-link"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <LinkOutlined /> {item.series.title}
                          </Link>
                        )}
                      </Space>
                    }
                  />
                </Card>
              </Col>
            ))}
          </Row>
        )}

        <Modal
          open={selectedItem !== null}
          onCancel={() => setSelectedItem(null)}
          footer={null}
          title={selectedItem?.title}
          width={720}
          destroyOnClose
          centered
        >
          {selectedItem && (
            <div className="contenido-modal">
              <EmbedPlayer
                platform={selectedItem.platform}
                url={selectedItem.url}
                videoId={selectedItem.videoId}
                title={selectedItem.title}
              />

              <div className="contenido-modal__credit-bar">
                <span>
                  Fuente: {selectedItem.platform}
                  {selectedItem.channelName && ` · ${selectedItem.channelName}`}
                </span>
                <a
                  href={selectedItem.url}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="contenido-modal__external-link"
                >
                  Ver en {selectedItem.platform} <LinkOutlined />
                </a>
              </div>

              {selectedItem.description && (
                <p className="contenido-modal__description">
                  {selectedItem.description}
                </p>
              )}

              {selectedItem.series && (
                <div className="contenido-modal__series-ref">
                  Serie relacionada:{' '}
                  <Link href={`/series/${selectedItem.series.id}`}>
                    {selectedItem.series.title}
                  </Link>
                </div>
              )}
            </div>
          )}
        </Modal>
      </div>
    </AppLayout>
  );
}
