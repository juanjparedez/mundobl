'use client';
import Image from 'next/image';
import Link from 'next/link';
import { BookOutlined, LockOutlined, GlobalOutlined } from '@ant-design/icons';
import { Chip, PanelCard } from '@/components/design-system';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { isDirectServedImageUrl } from '@/lib/image-helpers';
import type { RecommendationListSummary } from '@/types/community-library';
import './RecommendationCard.css';

export function RecommendationCard({
  list,
}: {
  list: RecommendationListSummary;
}) {
  const { t } = useLocale();
  return (
    <PanelCard className="recommendation-card" padding="none">
      <Link
        className="recommendation-card__covers"
        href={`/comunidad/listas/${list.id}`}
        tabIndex={-1}
        aria-hidden
      >
        {list.items.slice(0, 5).map((item) => (
          <span key={item.seriesId}>
            {item.series.imageUrl ? (
              <Image
                src={item.series.imageUrl}
                alt=""
                fill
                sizes="100px"
                unoptimized={isDirectServedImageUrl(item.series.imageUrl)}
              />
            ) : (
              <BookOutlined />
            )}
          </span>
        ))}
        {!list.items.length && (
          <span>
            <BookOutlined />
          </span>
        )}
      </Link>
      <div className="recommendation-card__body">
        <div className="recommendation-card__meta">
          <Chip>
            {list.visibility === 'PRIVATE' ? (
              <>
                <LockOutlined /> {t('communitySpace.private')}
              </>
            ) : (
              <>
                <GlobalOutlined /> {t('communitySpace.public')}
              </>
            )}
          </Chip>
          {list.kind === 'TOP_FIVE' && (
            <Chip>{t('communitySpace.topFive')}</Chip>
          )}
        </div>
        <h2>
          <Link href={`/comunidad/listas/${list.id}`}>{list.title}</Link>
        </h2>
        {list.description && <p>{list.description}</p>}
        <div className="recommendation-card__footer">
          {list.author.profileId ? (
            <Link href={`/comunidad/perfiles/${list.author.profileId}`}>
              {list.author.name}
            </Link>
          ) : (
            <span>{list.author.name}</span>
          )}
          <span>
            {list.itemCount} <BookOutlined aria-hidden />
          </span>
        </div>
      </div>
    </PanelCard>
  );
}
