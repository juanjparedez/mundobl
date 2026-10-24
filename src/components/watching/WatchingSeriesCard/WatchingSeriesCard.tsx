'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button, Progress, Tag } from 'antd';
import {
  CheckOutlined,
  CheckCircleOutlined,
  PushpinOutlined,
  PushpinFilled,
  PlayCircleOutlined,
  LinkOutlined,
} from '@ant-design/icons';
import { PanelCard } from '@/components/design-system';
import { PosterPlaceholder } from '@/components/common/PosterPlaceholder/PosterPlaceholder';
import { cardImageUrl, isDirectServedImageUrl } from '@/lib/image-helpers';
import { isGagaUrl, recordPilotClick } from '@/lib/pilot-clicks';
import {
  outboundRel,
  recordWatchLinkClick,
  withOutboundUtm,
} from '@/lib/outbound-links';
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
  /** Todos los capitulos vistos y la serie ya no sale: ofrece cerrarla. */
  canFinish?: boolean;
  onFinish?: () => void;
  /** Dias sin actividad en "Viendo" (ver staleWatchingDays); null = no preguntar. */
  staleDays?: number | null;
  onPause?: () => void;
  onDrop?: () => void;
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
    finish: string;
    stale: string;
    pause: string;
    drop: string;
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
  canFinish = false,
  onFinish,
  staleDays = null,
  onPause,
  onDrop,
  labels,
}: WatchingSeriesCardProps) {
  const progress = watchingProgress(item);
  const image = cardImageUrl(item.series);
  const externalLinks = (item.series.watchLinks ?? []).slice(0, 2);

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
              sizes="(max-width: 600px) 36vw, 240px"
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
            <div className="watching-series-card__progress-row">
              <span>{labels.progress}</span>
              <span className="watching-series-card__date">
                {labels.lastActivity}
              </span>
            </div>
            {progress.total > 0 && (
              <Progress
                percent={Math.round((progress.watched / progress.total) * 100)}
                showInfo={false}
                size="small"
              />
            )}
            <strong>{labels.next}</strong>
          </div>
          {staleDays !== null && (
            <div className="watching-series-card__stale" role="status">
              <span>{labels.stale}</span>
              <div className="watching-series-card__stale-actions">
                <Button size="small" disabled={busy} onClick={onPause}>
                  {labels.pause}
                </Button>
                <Button size="small" disabled={busy} onClick={onDrop}>
                  {labels.drop}
                </Button>
              </div>
            </div>
          )}
          <div className="watching-series-card__actions">
            {canFinish && (
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                disabled={busy}
                onClick={onFinish}
              >
                {labels.finish}
              </Button>
            )}
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
                href={
                  item.series.watchTarget
                    ? getVerUrl(
                        item.series.watchTarget.id,
                        item.series.watchTarget.title,
                        item.series.watchTarget.episode
                      )
                    : getVerUrl(
                        item.series.id,
                        item.series.title,
                        progress.next
                      )
                }
                className="watching-series-card__watch"
              >
                <PlayCircleOutlined /> {labels.watch}
              </Link>
            )}
            {!item.series.hasWatchableEpisode &&
              externalLinks.map((link) => (
                <a
                  key={link.id}
                  // La consulta ya trae solo links oficiales.
                  href={withOutboundUtm(link.url, true)}
                  target="_blank"
                  rel={outboundRel(true)}
                  className="watching-series-card__platform-link"
                  onClick={() => {
                    recordWatchLinkClick(link.id, 'watching');
                    if (isGagaUrl(link.url)) {
                      recordPilotClick('series', link.id);
                    }
                  }}
                >
                  {link.platform} <LinkOutlined aria-hidden />
                </a>
              ))}
          </div>
        </div>
      </article>
    </PanelCard>
  );
}
