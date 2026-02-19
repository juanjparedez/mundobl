'use client';

import { ReactNode } from 'react';
import { Tabs, Collapse } from 'antd';
import {
  InfoCircleOutlined,
  PlayCircleOutlined,
  PlaySquareOutlined,
  StarOutlined,
  CommentOutlined,
} from '@ant-design/icons';
import { useMediaQuery } from '@/hooks/useMediaQuery';

interface SeriesDetailClientProps {
  seriesId: number;
  showSeasons: boolean;
  seasonLabel: string;
  seasonCount: number;
  infoSection: ReactNode;
  contentSection: ReactNode;
  seasonsSection: ReactNode;
  ratingsSection: ReactNode;
  commentsSection: ReactNode;
}

export function SeriesDetailClient({
  showSeasons,
  seasonLabel,
  seasonCount,
  infoSection,
  contentSection,
  seasonsSection,
  ratingsSection,
  commentsSection,
}: SeriesDetailClientProps) {
  const isMobile = useMediaQuery('(max-width: 768px)');

  if (isMobile) {
    const collapseItems = [
      {
        key: 'info',
        label: (
          <span>
            <InfoCircleOutlined /> Información
          </span>
        ),
        children: <div className="series-info-tab">{infoSection}</div>,
      },
      {
        key: 'content',
        label: (
          <span>
            <PlaySquareOutlined /> Contenido
          </span>
        ),
        children: <div className="content-tab">{contentSection}</div>,
      },
      ...(showSeasons
        ? [
            {
              key: 'seasons',
              label: (
                <span>
                  <PlayCircleOutlined /> {seasonLabel} ({seasonCount})
                </span>
              ),
              children: <div className="seasons-tab">{seasonsSection}</div>,
            },
          ]
        : []),
      {
        key: 'ratings',
        label: (
          <span>
            <StarOutlined /> Puntuación
          </span>
        ),
        children: <div className="ratings-tab">{ratingsSection}</div>,
      },
      {
        key: 'comments',
        label: (
          <span>
            <CommentOutlined /> Comentarios
          </span>
        ),
        children: <div className="comments-tab">{commentsSection}</div>,
      },
    ];

    return (
      <Collapse
        defaultActiveKey={['info']}
        className="series-detail-sections"
        items={collapseItems}
        accordion={false}
      />
    );
  }

  // Desktop: tabs
  const tabItems = [
    {
      key: 'info',
      label: 'Información',
      children: <div className="series-info-tab">{infoSection}</div>,
    },
    {
      key: 'content',
      label: 'Contenido',
      children: <div className="content-tab">{contentSection}</div>,
    },
    ...(showSeasons
      ? [
          {
            key: 'seasons',
            label: `${seasonLabel} (${seasonCount})`,
            children: <div className="seasons-tab">{seasonsSection}</div>,
          },
        ]
      : []),
    {
      key: 'ratings',
      label: 'Puntuación',
      children: <div className="ratings-tab">{ratingsSection}</div>,
    },
    {
      key: 'comments',
      label: 'Comentarios',
      children: <div className="comments-tab">{commentsSection}</div>,
    },
  ];

  return <Tabs defaultActiveKey="info" items={tabItems} size="large" />;
}
