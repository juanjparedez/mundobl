'use client';

import { ReadOutlined, StarOutlined } from '@ant-design/icons';
import { Tag } from 'antd';
import Link from 'next/link';
import { Widget } from '@/components/dashboard';
import { EmptyState } from '@/components/design-system';
import { useLocale } from '@/lib/providers/LocaleProvider';
import type { ProfileData, ProfileReview } from '../../../types';
import './MyReviewsWidget.css';

export interface MyReviewsWidgetProps {
  recentReviews: ProfileData['recentReviews'];
}

/** Lista de resenas recientes del usuario, con badges para status
 *  (DRAFT/PUBLISHED/HIDDEN), verdict (RECOMMENDED/MIXED/SKIP), featured
 *  y un excerpt corto del cuerpo. Click va a la serie/seccion reviews. */
export function MyReviewsWidget({ recentReviews }: MyReviewsWidgetProps) {
  const { t, locale } = useLocale();

  if (!recentReviews || recentReviews.length === 0) {
    return (
      <Widget
        title={t('profileDashboard.widgetMyReviews')}
        icon={<ReadOutlined />}
      >
        <EmptyState
          title={t('profileDashboard.myReviewsEmpty')}
          variant="soft"
          fullHeight={false}
        />
      </Widget>
    );
  }

  return (
    <Widget
      title={t('profileDashboard.widgetMyReviews')}
      icon={<ReadOutlined />}
      noPadding
      fade={recentReviews.length > 3}
    >
      <ul className="mb-my-reviews">
        {recentReviews.map((r) => (
          <li key={r.id}>
            <ReviewRow review={r} locale={locale} t={t} />
          </li>
        ))}
      </ul>
    </Widget>
  );
}

interface ReviewRowProps {
  review: ProfileReview;
  locale: string;
  t: (key: Parameters<ReturnType<typeof useLocale>['t']>[0]) => string;
}

function ReviewRow({ review, locale, t }: ReviewRowProps) {
  const href = review.series
    ? `/series/${review.series.id}#series-section-reviews`
    : '#';
  const date = new Date(
    review.publishedAt ?? review.updatedAt
  ).toLocaleDateString(locale);

  return (
    <Link href={href} className="mb-my-reviews__item">
      <div className="mb-my-reviews__head">
        <span className="mb-my-reviews__series">
          {review.series?.title ?? '—'}
          {review.series?.year && (
            <span className="mb-my-reviews__year"> ({review.series.year})</span>
          )}
        </span>
        <div className="mb-my-reviews__badges">
          {review.isFeatured && (
            <Tag color="gold" icon={<StarOutlined />}>
              ★
            </Tag>
          )}
          {review.status === 'DRAFT' && (
            <Tag color="default">{t('profile.reviewStatusDraft')}</Tag>
          )}
          {review.status === 'HIDDEN' && (
            <Tag color="warning">{t('profile.reviewStatusHidden')}</Tag>
          )}
          {review.verdict === 'RECOMMENDED' && (
            <Tag color="green">{t('reviews.verdictRecommended')}</Tag>
          )}
          {review.verdict === 'MIXED' && (
            <Tag color="gold">{t('reviews.verdictMixed')}</Tag>
          )}
          {review.verdict === 'SKIP' && (
            <Tag color="red">{t('reviews.verdictSkip')}</Tag>
          )}
        </div>
      </div>
      {review.title && (
        <div className="mb-my-reviews__title">{review.title}</div>
      )}
      <p className="mb-my-reviews__excerpt">
        {review.body.slice(0, 140)}
        {review.body.length > 140 ? '…' : ''}
      </p>
      <div className="mb-my-reviews__footer">
        <span>{date}</span>
        {review.helpfulCount > 0 && <span>👍 {review.helpfulCount}</span>}
      </div>
    </Link>
  );
}
