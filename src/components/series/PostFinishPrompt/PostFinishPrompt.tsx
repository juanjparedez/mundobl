'use client';

import { useEffect, useState } from 'react';
import { Button } from 'antd';
import { EditOutlined, SlidersOutlined, StarFilled } from '@ant-design/icons';
import { signIn } from 'next-auth/react';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { useMessage } from '@/hooks/useMessage';
import { CategoryRater } from '../CategoryRater/CategoryRater';
import { FavoriteButton } from '../FavoriteButton/FavoriteButton';
import { useSeriesUserStatus } from '../SeriesUserStatusProvider';
import './PostFinishPrompt.css';

interface PostFinishPromptProps {
  seriesId: number;
  local: boolean;
}

export function PostFinishPrompt({ seriesId, local }: PostFinishPromptProps) {
  const { t } = useLocale();
  const message = useMessage();
  const {
    userRating: initialUserRating,
    hasReview,
    loaded,
    version,
    refetch,
  } = useSeriesUserStatus();

  const [score, setScore] = useState<number>(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (loaded) {
      setScore(initialUserRating ?? 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-sembrar en cada version (refetch)
  }, [version]);

  useEffect(() => {
    const onExternalUpdate = (event: Event) => {
      const detail = (
        event as CustomEvent<{ seriesId?: number; score?: number }>
      ).detail;
      if (detail?.seriesId && detail.seriesId !== seriesId) return;
      if (typeof detail?.score === 'number') {
        setScore(detail.score);
      } else {
        void refetch();
      }
    };
    window.addEventListener('mundobl:user-rating-updated', onExternalUpdate);
    return () =>
      window.removeEventListener(
        'mundobl:user-rating-updated',
        onExternalUpdate
      );
  }, [seriesId, refetch]);

  const handleRateChange = async (value: number) => {
    if (local) {
      void signIn('google', {
        callbackUrl: window.location.pathname + window.location.search,
      });
      return;
    }

    const previous = score;
    setScore(value);
    setSaving(true);
    try {
      const res = await fetch(`/api/series/${seriesId}/user-ratings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ratings: { general: value } }),
      });
      if (!res.ok) throw new Error();
      message.success(t('postViewing.savedScore'));
      window.dispatchEvent(
        new CustomEvent('mundobl:user-rating-updated', {
          detail: { seriesId, score: value },
        })
      );
      void refetch();
    } catch {
      setScore(previous);
      message.error(t('ratingSection.errorUser'));
    } finally {
      setSaving(false);
    }
  };

  const handleOpenReview = () => {
    if (local) {
      const url = new URL(window.location.href);
      url.searchParams.set('review', 'new');
      void signIn('google', {
        callbackUrl: url.pathname + url.search + '#series-section-reviews',
      });
      return;
    }

    const reviewsEl = document.getElementById('series-section-reviews');
    if (reviewsEl) {
      reviewsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    window.dispatchEvent(
      new CustomEvent('mundobl:open-review-modal', {
        detail: { seriesId },
      })
    );
  };

  return (
    <div className="post-finish-prompt">
      <div className="post-finish-prompt__header">
        <div>
          <h4 className="post-finish-prompt__title">
            {t('postViewing.finishTitle')}
          </h4>
          <p className="post-finish-prompt__subtitle">
            {t('postViewing.finishSubtitle')}
          </p>
        </div>
        <FavoriteButton />
      </div>

      <div
        className={`post-finish-prompt__rater${saving ? ' post-finish-prompt__rater--saving' : ''}`}
      >
        <CategoryRater
          label={
            score > 0 ? t('postViewing.yourScore') : t('postViewing.rateQuick')
          }
          icon={<StarFilled />}
          value={score}
          onChange={(v) => void handleRateChange(v)}
          tone="gold"
        />
      </div>

      <div className="post-finish-prompt__actions">
        <Button
          type="primary"
          icon={<EditOutlined />}
          onClick={handleOpenReview}
          className="post-finish-prompt__btn"
        >
          {hasReview
            ? t('postViewing.editReview')
            : t('postViewing.writeReview')}
        </Button>
        <a
          href="#series-section-ratings"
          className="post-finish-prompt__categories-link"
        >
          <SlidersOutlined aria-hidden /> {t('postViewing.rateByCategories')}
        </a>
      </div>

      {local && (
        <p className="post-finish-prompt__login-hint">
          {t('postViewing.loginToSave')}
        </p>
      )}
    </div>
  );
}
