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
import { useLocale } from '@/lib/providers/LocaleProvider';

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
  const { t } = useLocale();

  if (isMobile) {
    const collapseItems = [
      {
        key: 'info',
        label: (
          <span>
            <InfoCircleOutlined /> {t('seriesDetail.tabInfo')}
          </span>
        ),
        children: <div className="series-info-tab">{infoSection}</div>,
      },
      {
        key: 'content',
        label: (
          <span>
            <PlaySquareOutlined /> {t('seriesDetail.tabContent')}
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
            <StarOutlined /> {t('seriesDetail.tabRatings')}
          </span>
        ),
        children: <div className="ratings-tab">{ratingsSection}</div>,
      },
      {
        key: 'comments',
        label: (
          <span>
            <CommentOutlined /> {t('seriesDetail.tabComments')}
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
      label: t('seriesDetail.tabInfo'),
      children: <div className="series-info-tab">{infoSection}</div>,
    },
    {
      key: 'content',
      label: t('seriesDetail.tabContent'),
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
      label: t('seriesDetail.tabRatings'),
      children: <div className="ratings-tab">{ratingsSection}</div>,
    },
    {
      key: 'comments',
      label: t('seriesDetail.tabComments'),
      children: <div className="comments-tab">{commentsSection}</div>,
    },
  ];

  return <Tabs defaultActiveKey="info" items={tabItems} size="large" />;
}
