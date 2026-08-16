'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Spin, Tag, Avatar } from 'antd';
import { ReadOutlined, StarFilled, UserOutlined } from '@ant-design/icons';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { formatPublicName } from '@/lib/user-display';
import './RightRail.css';

interface ReviewItem {
  id: number;
  title: string;
  body: string;
  verdict: 'RECOMMENDED' | 'MIXED' | 'SKIP' | null;
  helpfulCount: number;
  isFeatured: boolean;
  publishedAt: string | null;
  user: {
    name: string | null;
    nickname: string | null;
    image: string | null;
  } | null;
}

export interface RightRailProps {
  seriesId: number;
}

/** RightRail del workspace admin: lista de reseñas vinculadas a esta
 *  serie (Review con seriesId = X y status PUBLISHED). Fetch client-side
 *  a /api/reviews?seriesId=X. Muestra hasta 8 reviews con avatar, nombre
 *  publico, verdict tag y excerpt corto. */
export function RightRail({ seriesId }: RightRailProps) {
  const { t, locale } = useLocale();
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/reviews?seriesId=${seriesId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((payload: { reviews?: ReviewItem[] } | null) => {
        if (cancelled) return;
        if (payload?.reviews) setReviews(payload.reviews);
        setLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [seriesId]);

  return (
    <aside className="mb-rightrail">
      <header className="mb-rightrail__header">
        <ReadOutlined />
        <h3 className="mb-rightrail__title">
          {t('workspace.rightRailLinkedReviews')}
        </h3>
        <span className="mb-rightrail__count">{reviews.length}</span>
      </header>

      {!loaded ? (
        <div className="mb-rightrail__loading">
          <Spin size="small" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="mb-rightrail__empty">
          {t('workspace.rightRailEmpty')}
        </div>
      ) : (
        <ul className="mb-rightrail__list">
          {reviews.slice(0, 8).map((r) => {
            const author = r.user
              ? formatPublicName(r.user)
              : t('workspace.rightRailAnonymous');
            const date = r.publishedAt
              ? new Date(r.publishedAt).toLocaleDateString(locale)
              : null;
            return (
              <li key={r.id} className="mb-rightrail__item">
                <div className="mb-rightrail__row">
                  <Avatar
                    src={r.user?.image}
                    icon={!r.user?.image ? <UserOutlined /> : undefined}
                    size={24}
                  />
                  <span className="mb-rightrail__author">{author}</span>
                  {r.isFeatured && (
                    <Tag color="gold" icon={<StarFilled />}>
                      ★
                    </Tag>
                  )}
                  {r.verdict === 'RECOMMENDED' && (
                    <Tag color="green">{t('reviews.verdictRecommended')}</Tag>
                  )}
                  {r.verdict === 'MIXED' && (
                    <Tag color="gold">{t('reviews.verdictMixed')}</Tag>
                  )}
                  {r.verdict === 'SKIP' && (
                    <Tag color="red">{t('reviews.verdictSkip')}</Tag>
                  )}
                </div>
                {r.title && (
                  <Link
                    href={`/series/${seriesId}#series-section-reviews`}
                    className="mb-rightrail__rev-title"
                  >
                    {r.title}
                  </Link>
                )}
                <p className="mb-rightrail__excerpt">
                  {r.body.slice(0, 100)}
                  {r.body.length > 100 ? '…' : ''}
                </p>
                <div className="mb-rightrail__meta">
                  {date && <span>{date}</span>}
                  {r.helpfulCount > 0 && <span>👍 {r.helpfulCount}</span>}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
}
