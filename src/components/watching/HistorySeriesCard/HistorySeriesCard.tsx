'use client';

import { useState, type ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from 'antd';
import { PanelCard } from '@/components/design-system/PanelCard/PanelCard';
import { PosterPlaceholder } from '@/components/common/PosterPlaceholder/PosterPlaceholder';
import { isDirectServedImageUrl } from '@/lib/image-helpers';
import './HistorySeriesCard.css';

export function HistorySeriesCard({
  title,
  href,
  imageUrl,
  children,
  labels,
  expanded,
  onToggle,
}: {
  title: string;
  href: string;
  imageUrl?: string | null;
  children: ReactNode[];
  labels: { expand: string; collapse: string; loaded: string };
  expanded: boolean;
  onToggle: () => void;
}) {
  const [failedImage, setFailedImage] = useState<string | null>(null);
  return (
    <PanelCard className="history-series-card" padding="md">
      <header className="history-series-card__header">
        <Link
          href={href}
          className="history-series-card__poster"
          tabIndex={-1}
          aria-hidden="true"
        >
          {imageUrl && imageUrl !== failedImage ? (
            <Image
              src={imageUrl}
              alt=""
              fill
              sizes="120px"
              loading="lazy"
              unoptimized={isDirectServedImageUrl(imageUrl)}
              onError={() => setFailedImage(imageUrl)}
            />
          ) : (
            <PosterPlaceholder title={title} />
          )}
        </Link>
        <div>
          <h2>
            <Link href={href}>{title}</Link>
          </h2>
          <p>{labels.loaded.replace('{count}', String(children.length))}</p>
        </div>
      </header>
      <ol className="tracking-history__list">
        {expanded ? children : children.slice(0, 2)}
      </ol>
      {children.length > 2 && (
        <Button
          className="history-series-card__toggle"
          block
          aria-expanded={expanded}
          onClick={onToggle}
        >
          {expanded
            ? labels.collapse
            : labels.expand.replace('{count}', String(children.length - 2))}
        </Button>
      )}
    </PanelCard>
  );
}
