'use client';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from 'antd';
import { BookOutlined } from '@ant-design/icons';
import { PanelCard, EmptyState } from '@/components/design-system';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { isDirectServedImageUrl } from '@/lib/image-helpers';
import { getContentUrl } from '@/lib/slug';
import type { RecommendationItem } from '@/types/community-library';
import { SaveCommunityRecommendation } from '../SaveCommunityRecommendation/SaveCommunityRecommendation';
import './RecommendationContents.css';

export function RecommendationContents({
  items,
}: {
  items: RecommendationItem[];
}) {
  const { t } = useLocale();
  const [revealed, setRevealed] = useState<number[]>([]);
  if (!items.length)
    return <EmptyState title={t('communitySpace.emptyList')} />;
  return (
    <ol className="recommendation-contents">
      {items.map((item, index) => (
        <li key={item.seriesId}>
          <PanelCard>
            <div className="recommendation-contents__row">
              <span className="recommendation-contents__rank" aria-hidden>
                {index + 1}
              </span>
              <Link
                href={getContentUrl(item.series)}
                className="recommendation-contents__cover"
                tabIndex={-1}
                aria-hidden
              >
                {item.series.imageUrl ? (
                  <Image
                    src={item.series.imageUrl}
                    alt=""
                    fill
                    sizes="80px"
                    unoptimized={isDirectServedImageUrl(item.series.imageUrl)}
                  />
                ) : (
                  <BookOutlined />
                )}
              </Link>
              <div className="recommendation-contents__body">
                <h2>
                  <Link href={getContentUrl(item.series)}>
                    {item.series.title}
                  </Link>
                </h2>
                {item.hasSpoilers && !revealed.includes(item.seriesId) ? (
                  <Button
                    onClick={() =>
                      setRevealed((previous) => [...previous, item.seriesId])
                    }
                  >
                    {t('communityHub.showSpoilers')}
                  </Button>
                ) : (
                  item.note && <p>{item.note}</p>
                )}
                <SaveCommunityRecommendation seriesId={item.seriesId} />
              </div>
            </div>
          </PanelCard>
        </li>
      ))}
    </ol>
  );
}
