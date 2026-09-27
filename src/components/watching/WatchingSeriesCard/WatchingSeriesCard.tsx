'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button, Progress, Tag } from 'antd';
import {
  CheckOutlined,
  PushpinOutlined,
  PushpinFilled,
  PlayCircleOutlined,
} from '@ant-design/icons';
import { PanelCard } from '@/components/design-system';
import { PosterPlaceholder } from '@/components/common/PosterPlaceholder/PosterPlaceholder';
import { cardImageUrl, isDirectServedImageUrl } from '@/lib/image-helpers';
import { getVerUrl } from '@/lib/slug';
import {
  watchingDetailsUrl,
  watchingProgress,
  type WatchingItem,
} from '@/lib/watching-collection';
import './WatchingSeriesCard.css';

interface WatchingSeriesCardProps {
  item: WatchingItem;
  pinned: boolean;
  pinDisabled?: boolean;
  busy: boolean;
  onPin: () => void;
  onManage: () => void;
  onMark: () => void;
  labels: {
    pin: string;
    manage: string;
    mark: string;
    watch: string;
    next: string;
    progress: string;
    status: string;
    source: string;
    lastActivity: string;
  };
}

export function WatchingSeriesCard({
  item,
  pinned,
  pinDisabled,
  busy,
  onPin,
  onManage,
  onMark,
  labels,
}: WatchingSeriesCardProps) {
  const progress = watchingProgress(item);
  const image = cardImageUrl(item.series);
  return (
    <PanelCard className="watching-series-card" padding="none">
      <article className="watching-series-card__layout">
        <Link
          href={watchingDetailsUrl(item)}
          className="watching-series-card__poster"
          tabIndex={-1}
          aria-hidden="true"
        >
          {image ? (
            <Image
              src={image}
              alt=""
              fill
              sizes="(max-width: 600px) 80px, 180px"
              unoptimized={isDirectServedImageUrl(image)}
            />
          ) : (
            <PosterPlaceholder title={item.series.title} variant="card" />
          )}
        </Link>
        <div className="watching-series-card__content">
          <div className="watching-series-card__heading">
            <div>
              <span className="watching-series-card__source">
                {labels.source}
              </span>
              <h2>
                <Link href={watchingDetailsUrl(item)}>{item.series.title}</Link>
              </h2>
            </div>
            <Button
              type="text"
              icon={pinned ? <PushpinFilled /> : <PushpinOutlined />}
              aria-label={labels.pin}
              aria-pressed={pinned}
              disabled={pinDisabled}
              onClick={onPin}
            />
          </div>
          <div className="watching-series-card__meta">
            <Tag>{labels.status}</Tag>
            {item.series.year && <span>{item.series.year}</span>}
            {item.series.country && <span>{item.series.country.name}</span>}
          </div>
          <div className="watching-series-card__progress">
            <span>{labels.progress}</span>
            {progress.total > 0 && (
              <Progress
                percent={Math.round((progress.watched / progress.total) * 100)}
                showInfo={false}
                size="small"
              />
            )}
            <strong>{labels.next}</strong>
            <span className="watching-series-card__date">
              {labels.lastActivity}
            </span>
          </div>
          <div className="watching-series-card__actions">
            {progress.next &&
              !['VISTA', 'ABANDONADA'].includes(item.status) && (
                <Button
                  type="primary"
                  icon={<CheckOutlined />}
                  disabled={busy}
                  onClick={onMark}
                >
                  {labels.mark}
                </Button>
              )}
            <Button onClick={onManage} disabled={busy}>
              {labels.manage}
            </Button>
            {item.series.hasWatchableEpisode && (
              <Link
                href={getVerUrl(
                  item.series.id,
                  item.series.title,
                  progress.next
                )}
                className="watching-series-card__watch"
              >
                <PlayCircleOutlined /> {labels.watch}
              </Link>
            )}
          </div>
        </div>
      </article>
    </PanelCard>
  );
}
