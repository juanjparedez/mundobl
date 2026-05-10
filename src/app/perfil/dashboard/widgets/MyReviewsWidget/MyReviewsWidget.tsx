'use client';

import { useState } from 'react';
import { ReadOutlined, StarOutlined, DeleteOutlined } from '@ant-design/icons';
import { Tag, Popconfirm, Button } from 'antd';
import Link from 'next/link';
import { Widget } from '@/components/dashboard';
import { EmptyState } from '@/components/design-system';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { useMessage } from '@/hooks/useMessage';
import type { ProfileData, ProfileReview } from '../../../types';
import './MyReviewsWidget.css';

export interface MyReviewsWidgetProps {
  recentReviews: ProfileData['recentReviews'];
}

/** Lista de resenas recientes del usuario, con badges para status
 *  (DRAFT/PUBLISHED/HIDDEN), verdict (RECOMMENDED/MIXED/SKIP), featured
 *  y un excerpt corto del cuerpo. Click va a la serie/seccion reviews.
 *  Delete inline con confirm + optimistic hide (no recarga todo el
 *  ProfileData). Restaurado del OverviewReviewsPanel — antes del refactor
 *  a grid esta funcionalidad estaba en el overview y se habia perdido. */
export function MyReviewsWidget({ recentReviews }: MyReviewsWidgetProps) {
  const { t, locale } = useLocale();
  const message = useMessage();
  const [hidden, setHidden] = useState<Set<number>>(new Set());
  const [busyId, setBusyId] = useState<number | null>(null);

  const visible = recentReviews?.filter((r) => !hidden.has(r.id)) ?? [];

  const handleDelete = async (id: number) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/reviews?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('failed');
      setHidden((prev) => new Set(prev).add(id));
      message.success(t('profile.reviewDeletedSuccess'));
    } catch {
      message.error(t('profile.reviewDeletedError'));
    } finally {
      setBusyId(null);
    }
  };

  if (!visible || visible.length === 0) {
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
      fade={visible.length > 3}
    >
      <ul className="mb-my-reviews">
        {visible.map((r) => (
          <li key={r.id}>
            <ReviewRow
              review={r}
              locale={locale}
              t={t}
              onDelete={handleDelete}
              busy={busyId === r.id}
            />
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
  onDelete: (id: number) => Promise<void>;
  busy: boolean;
}

function ReviewRow({ review, locale, t, onDelete, busy }: ReviewRowProps) {
  const href = review.series
    ? `/series/${review.series.id}#series-section-reviews`
    : '#';
  const date = new Date(
    review.publishedAt ?? review.updatedAt
  ).toLocaleDateString(locale);

  return (
    <div className="mb-my-reviews__item">
      <Link href={href} className="mb-my-reviews__link">
        <div className="mb-my-reviews__head">
          <span className="mb-my-reviews__series">
            {review.series?.title ?? '—'}
            {review.series?.year && (
              <span className="mb-my-reviews__year">
                {' '}
                ({review.series.year})
              </span>
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
      {/* Boton delete inline con confirm — fuera del Link para que el
       *  click no navegue. Restaura funcionalidad del overview previo. */}
      <Popconfirm
        title={t('profile.reviewDeleteConfirm')}
        onConfirm={(e) => {
          e?.stopPropagation();
          onDelete(review.id);
        }}
        okText={t('profile.reviewDeleteOk')}
        cancelText={t('profile.reviewDeleteCancel')}
        okButtonProps={{ danger: true }}
      >
        <Button
          type="text"
          danger
          size="small"
          icon={<DeleteOutlined />}
          loading={busy}
          className="mb-my-reviews__delete"
          onClick={(e) => e.stopPropagation()}
          aria-label={t('profile.reviewDeleteAriaLabel')}
        />
      </Popconfirm>
    </div>
  );
}
