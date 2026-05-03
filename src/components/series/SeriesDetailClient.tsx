'use client';

import { ReactNode } from 'react';
import {
  InfoCircleOutlined,
  PlayCircleOutlined,
  PlaySquareOutlined,
  StarOutlined,
  CommentOutlined,
} from '@ant-design/icons';
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
  const { t } = useLocale();

  const sectionItems = [
    {
      key: 'info',
      label: t('seriesDetail.tabInfo'),
      icon: <InfoCircleOutlined />,
      content: <div className="series-info-tab">{infoSection}</div>,
    },
    {
      key: 'content',
      label: t('seriesDetail.tabContent'),
      icon: <PlaySquareOutlined />,
      content: <div className="content-tab">{contentSection}</div>,
    },
    ...(showSeasons
      ? [
          {
            key: 'seasons',
            label: `${seasonLabel} (${seasonCount})`,
            icon: <PlayCircleOutlined />,
            content: <div className="seasons-tab">{seasonsSection}</div>,
          },
        ]
      : []),
    {
      key: 'ratings',
      label: t('seriesDetail.tabRatings'),
      icon: <StarOutlined />,
      content: <div className="ratings-tab">{ratingsSection}</div>,
    },
    {
      key: 'comments',
      label: t('seriesDetail.tabComments'),
      icon: <CommentOutlined />,
      content: <div className="comments-tab">{commentsSection}</div>,
    },
  ];

  return (
    <div className="series-detail-sections">
      <nav className="series-detail-sections__nav" aria-label="Series sections">
        {sectionItems.map((section) => (
          <a
            key={section.key}
            href={`#series-section-${section.key}`}
            className="series-detail-sections__link"
          >
            {section.icon} <span>{section.label}</span>
          </a>
        ))}
      </nav>

      <div className="series-detail-sections__content">
        {sectionItems.map((section) => (
          <section
            key={section.key}
            id={`series-section-${section.key}`}
            className="series-detail-section"
          >
            <header className="series-detail-section__header">
              {section.icon}
              <h2 className="series-detail-section__title">{section.label}</h2>
            </header>
            <div className="series-detail-section__body">{section.content}</div>
          </section>
        ))}
      </div>
    </div>
  );
}
