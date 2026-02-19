'use client';

import { useState, useEffect, useCallback } from 'react';
import { Tag, Spin, Empty, Card } from 'antd';
import { PlayCircleOutlined } from '@ant-design/icons';
import { EmbedPlayer } from '@/components/common/EmbedPlayer/EmbedPlayer';
import {
  CATEGORY_LABELS,
  PLATFORM_COLORS,
  type Platform,
} from '@/lib/embed-helpers';
import './SeriesContent.css';

interface ContentItem {
  id: number;
  title: string;
  description: string | null;
  platform: string;
  url: string;
  videoId: string | null;
  category: string;
  thumbnailUrl: string | null;
  channelName: string | null;
  sortOrder: number;
  featured: boolean;
}

interface SeriesContentProps {
  seriesId: number;
}

// Category sort order for consistent display
const CATEGORY_ORDER = [
  'trailer',
  'clip',
  'behind_scenes',
  'ost',
  'interview',
  'live',
  'serie',
  'pelicula',
  'corto',
  'other',
];

export function SeriesContent({ seriesId }: SeriesContentProps) {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const fetchContent = useCallback(async () => {
    try {
      const res = await fetch(`/api/contenido?seriesId=${seriesId}`);
      if (!res.ok) return;
      const data = await res.json();
      setItems(data);
      if (data.length > 0) setSelectedId(data[0].id);
    } finally {
      setLoading(false);
    }
  }, [seriesId]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  if (loading) {
    return (
      <div className="series-content__loading">
        <Spin size="large" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <Empty
        description="No hay contenido disponible para esta serie"
        className="series-content__empty"
      />
    );
  }

  // Group by category, sorted by CATEGORY_ORDER
  const grouped = items.reduce<Record<string, ContentItem[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  const sortedCategories = Object.keys(grouped).sort((a, b) => {
    const ai = CATEGORY_ORDER.indexOf(a);
    const bi = CATEGORY_ORDER.indexOf(b);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  const selectedItem = items.find((i) => i.id === selectedId) ?? null;

  return (
    <div className="series-content">
      {/* Active player */}
      {selectedItem && (
        <div className="series-content__player">
          <EmbedPlayer
            platform={selectedItem.platform}
            url={selectedItem.url}
            videoId={selectedItem.videoId}
            title={selectedItem.title}
          />
          <div className="series-content__player-meta">
            <span className="series-content__player-title">
              {selectedItem.title}
            </span>
            {selectedItem.description && (
              <p className="series-content__player-desc">
                {selectedItem.description}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Content grid grouped by category */}
      <div className="series-content__groups">
        {sortedCategories.map((category) => (
          <div key={category} className="series-content__group">
            <h3 className="series-content__group-title">
              {CATEGORY_LABELS[category] ?? category}
            </h3>
            <div className="series-content__grid">
              {grouped[category].map((item) => (
                <Card
                  key={item.id}
                  hoverable
                  className={`series-content__card${selectedId === item.id ? ' series-content__card--active' : ''}`}
                  onClick={() => setSelectedId(item.id)}
                  cover={
                    item.thumbnailUrl ? (
                      <div className="series-content__thumb">
                        <img
                          src={item.thumbnailUrl}
                          alt={item.title}
                          className="series-content__thumb-img"
                        />
                        <div className="series-content__thumb-overlay">
                          <PlayCircleOutlined className="series-content__play-icon" />
                        </div>
                      </div>
                    ) : (
                      <div className="series-content__thumb series-content__thumb--placeholder">
                        <PlayCircleOutlined className="series-content__play-icon series-content__play-icon--lg" />
                      </div>
                    )
                  }
                >
                  <Card.Meta
                    title={
                      <span className="series-content__card-title">
                        {item.title}
                      </span>
                    }
                    description={
                      <Tag
                        color={
                          PLATFORM_COLORS[item.platform as Platform] ??
                          'default'
                        }
                      >
                        {item.platform}
                      </Tag>
                    }
                  />
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
