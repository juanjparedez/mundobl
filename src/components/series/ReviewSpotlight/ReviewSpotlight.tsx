'use client';

import { startTransition, useEffect, useState } from 'react';
import { Avatar, Tag } from 'antd';
import {
  StarFilled,
  UserOutlined,
  ArrowRightOutlined,
  LikeOutlined,
} from '@ant-design/icons';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { LOCALE_LABELS } from '@/i18n/config';
import './ReviewSpotlight.css';

type Verdict = 'RECOMMENDED' | 'MIXED' | 'SKIP';

interface ReviewSpotlightItem {
  id: number;
  title: string;
  body: string;
  verdict: Verdict | null;
  language: string;
  status: 'DRAFT' | 'PUBLISHED' | 'HIDDEN';
  isFeatured: boolean;
  helpfulCount: number;
  hasSpoilers: boolean;
  publishedAt: string | null;
  user: { id: string; name: string | null; image: string | null } | null;
}

interface ReviewSpotlightProps {
  seriesId: number;
}

// Spotlight: muestra la mejor reseña publicada de la serie debajo de la
// sinopsis para darle visibilidad. Si no hay reseña publicada, no renderiza
// nada. Click en "Leer más" salta al tab Reseñas.
export function ReviewSpotlight({ seriesId }: ReviewSpotlightProps) {
  const { t, locale } = useLocale();
  const [review, setReview] = useState<ReviewSpotlightItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/reviews?seriesId=${seriesId}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data: ReviewSpotlightItem[]) => {
        if (cancelled) return;
        // El endpoint ya viene ordenado por isFeatured > helpfulCount > fecha.
        // Filtramos a publicadas y, si hay match en idioma, preferimos esa.
        const published = data.filter((r) => r.status === 'PUBLISHED');
        const next =
          published.length === 0
            ? null
            : (published.find((r) => r.language === locale) ?? published[0]);
        startTransition(() => setReview(next));
      })
      .catch(() => {
        if (!cancelled) startTransition(() => setReview(null));
      })
      .finally(() => {
        if (!cancelled) startTransition(() => setLoading(false));
      });
    return () => {
      cancelled = true;
    };
  }, [seriesId, locale]);

  if (loading || !review) return null;

  const verdictMap: Record<Verdict, { color: string; key: string }> = {
    RECOMMENDED: { color: 'green', key: 'reviews.verdictRecommended' },
    MIXED: { color: 'gold', key: 'reviews.verdictMixed' },
    SKIP: { color: 'red', key: 'reviews.verdictSkip' },
  };
  const verdictTag = review.verdict ? verdictMap[review.verdict] : null;

  // Excerpt: primeros ~280 chars hasta el final de oración o palabra.
  const truncate = (text: string, max = 280): string => {
    if (text.length <= max) return text;
    const slice = text.slice(0, max);
    const lastDot = slice.lastIndexOf('. ');
    const lastSpace = slice.lastIndexOf(' ');
    const cut = lastDot > max - 80 ? lastDot + 1 : lastSpace;
    return slice.slice(0, cut > 0 ? cut : max).trim() + '…';
  };

  return (
    <a
      href="#series-section-reviews"
      className={`review-spotlight${review.isFeatured ? ' review-spotlight--featured' : ''}`}
    >
      <div className="review-spotlight__head">
        <div className="review-spotlight__author">
          <Avatar
            src={review.user?.image}
            icon={!review.user?.image ? <UserOutlined /> : undefined}
            size={36}
          />
          <div>
            <div className="review-spotlight__author-name">
              {review.user?.name ?? t('reviews.anonymous')}
            </div>
            <div className="review-spotlight__meta">
              {review.isFeatured && (
                <Tag color="gold" icon={<StarFilled />}>
                  {t('reviews.featuredTag')}
                </Tag>
              )}
              {verdictTag && (
                <Tag color={verdictTag.color}>
                  {t(verdictTag.key as Parameters<typeof t>[0])}
                </Tag>
              )}
              {review.helpfulCount > 0 && (
                <span className="review-spotlight__helpful">
                  <LikeOutlined /> {review.helpfulCount}
                </span>
              )}
              <span className="review-spotlight__lang">
                {LOCALE_LABELS[review.language as never] ?? review.language}
              </span>
            </div>
          </div>
        </div>
      </div>

      <h3 className="review-spotlight__title">{review.title}</h3>
      <p className="review-spotlight__body">{truncate(review.body)}</p>

      <div className="review-spotlight__footer">
        <span className="review-spotlight__cta">
          {t('reviews.spotlightReadMore')}
          <ArrowRightOutlined />
        </span>
      </div>
    </a>
  );
}
