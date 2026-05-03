'use client';

import { useState, useEffect, useCallback } from 'react';
import { Slider, Button, Card, Row, Col } from 'antd';
import { StarFilled, TeamOutlined } from '@ant-design/icons';
import { useSession } from 'next-auth/react';
import './RatingSection.css';
import { useMessage } from '@/hooks/useMessage';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { interpolateMessage } from '@/lib/i18n-format';

interface RatingSectionProps {
  seriesId: number;
  existingRatings: Array<{
    category: string;
    score: number;
  }>;
}

const _RATING_CATEGORY_KEYS = [
  'trama',
  'casting',
  'direccion',
  'guion',
  'produccion',
  'fotografia',
  'bso',
  'quimica_principal',
  'quimica_secundaria',
] as const;
type RatingCategoryKey = (typeof _RATING_CATEGORY_KEYS)[number];

interface UserRatingsData {
  averages: Record<string, number>;
  overallAverage: number | null;
  totalVoters: number;
}

export function RatingSection({
  seriesId,
  existingRatings,
}: RatingSectionProps) {
  const message = useMessage();
  const { t } = useLocale();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'ADMIN';

  const ratingCategories: Array<{ key: RatingCategoryKey; label: string }> = [
    { key: 'trama', label: t('ratingSection.catTrama') },
    { key: 'casting', label: t('ratingSection.catCasting') },
    { key: 'direccion', label: t('ratingSection.catDireccion') },
    { key: 'guion', label: t('ratingSection.catGuion') },
    { key: 'produccion', label: t('ratingSection.catProduccion') },
    { key: 'fotografia', label: t('ratingSection.catFotografia') },
    { key: 'bso', label: t('ratingSection.catBso') },
    { key: 'quimica_principal', label: t('ratingSection.catQuimicaPrincipal') },
    {
      key: 'quimica_secundaria',
      label: t('ratingSection.catQuimicaSecundaria'),
    },
  ];

  // Official ratings (admin)
  const [ratings, setRatings] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    existingRatings.forEach((rating) => {
      initial[rating.category] = rating.score;
    });
    return initial;
  });
  const [isSaving, setIsSaving] = useState(false);

  // User ratings
  const [userRatings, setUserRatings] = useState<Record<string, number>>({});
  const [userRatingsData, setUserRatingsData] =
    useState<UserRatingsData | null>(null);
  const [isSavingUserRating, setIsSavingUserRating] = useState(false);

  const fetchUserRatings = useCallback(async () => {
    try {
      const response = await fetch(`/api/series/${seriesId}/user-ratings`);
      if (response.ok) {
        const data = await response.json();
        setUserRatingsData(data);

        // If the user has their own ratings, populate the sliders
        if (session?.user?.id && data.ratings) {
          const myRatings: Record<string, number> = {};
          for (const rating of data.ratings) {
            if (rating.userId === session.user.id) {
              myRatings[rating.category] = rating.score;
            }
          }
          if (Object.keys(myRatings).length > 0) {
            setUserRatings(myRatings);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching user ratings:', error);
    }
  }, [seriesId, session?.user?.id]);

  useEffect(() => {
    fetchUserRatings();
  }, [fetchUserRatings]);

  const handleRatingChange = (category: string, value: number) => {
    setRatings((prev) => ({ ...prev, [category]: value }));
  };

  const handleUserRatingChange = (category: string, value: number) => {
    setUserRatings((prev) => ({ ...prev, [category]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/series/${seriesId}/ratings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ratings }),
      });

      if (!response.ok) throw new Error('Error al guardar');
      message.success(t('ratingSection.successOfficial'));
    } catch (error) {
      message.error(t('ratingSection.errorOfficial'));
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveUserRating = async () => {
    setIsSavingUserRating(true);
    try {
      const response = await fetch(`/api/series/${seriesId}/user-ratings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ratings: userRatings }),
      });

      if (!response.ok) throw new Error('Error al guardar');
      message.success(t('ratingSection.successUser'));
      fetchUserRatings();
    } catch (error) {
      message.error(t('ratingSection.errorUser'));
      console.error(error);
    } finally {
      setIsSavingUserRating(false);
    }
  };

  const averageRating =
    Object.values(ratings).length > 0
      ? (
          Object.values(ratings).reduce((sum, score) => sum + score, 0) /
          Object.values(ratings).length
        ).toFixed(1)
      : null;

  return (
    <div className="rating-section">
      {/* Official Rating Average */}
      {averageRating && (
        <Card className="rating-section__average">
          <div className="rating-average">
            <StarFilled className="rating-average__icon" />
            <div className="rating-average__score">{averageRating}</div>
            <span style={{ color: 'var(--text-secondary)' }}>
              {t('ratingSection.officialLabel')}
            </span>
          </div>
        </Card>
      )}

      {/* User Rating Average */}
      {userRatingsData &&
        userRatingsData.totalVoters > 0 &&
        userRatingsData.overallAverage !== null && (
          <Card className="rating-section__average rating-section__user-average">
            <div className="rating-average">
              <TeamOutlined className="rating-average__icon" />
              <div className="rating-average__score">
                {userRatingsData.overallAverage}
              </div>
              <span style={{ color: 'var(--text-secondary)' }}>
                {interpolateMessage(
                  userRatingsData.totalVoters === 1
                    ? t('ratingSection.votesSingular')
                    : t('ratingSection.votesPlural'),
                  { n: String(userRatingsData.totalVoters) }
                )}{' '}
                {t('ratingSection.userAverageLabel')}
              </span>
            </div>
          </Card>
        )}

      {/* Official Rating Sliders (Admin only) */}
      {isAdmin && (
        <div className="rating-section__categories">
          <h4 className="rating-section__title">
            {t('ratingSection.officialTitle')}
          </h4>
          <span style={{ color: 'var(--text-secondary)' }}>
            {t('ratingSection.officialHint')}
          </span>

          <Row gutter={[16, 24]} style={{ marginTop: 24 }}>
            {ratingCategories.map((category) => (
              <Col xs={24} sm={12} key={category.key}>
                <Card className="rating-category">
                  <div className="rating-category__header">
                    <strong>{category.label}</strong>
                    <span className="rating-category__score">
                      {ratings[category.key] || 0}/10
                    </span>
                  </div>
                  <Slider
                    min={0}
                    max={10}
                    value={ratings[category.key] || 0}
                    onChange={(value) =>
                      handleRatingChange(category.key, value)
                    }
                    marks={{ 0: '0', 5: '5', 10: '10' }}
                    tooltip={{ formatter: (value) => `${value}/10` }}
                  />
                </Card>
              </Col>
            ))}
          </Row>

          <div className="rating-section__actions">
            <Button
              type="primary"
              size="large"
              onClick={handleSave}
              loading={isSaving}
            >
              {t('ratingSection.saveOfficialButton')}
            </Button>
          </div>
        </div>
      )}

      {/* User Rating Sliders (any logged-in user) */}
      {session?.user ? (
        <div className="rating-section__categories">
          <h4 className="rating-section__title">
            {t('ratingSection.userTitle')}
          </h4>
          <span style={{ color: 'var(--text-secondary)' }}>
            {t('ratingSection.userHint')}
          </span>

          <Row gutter={[16, 24]} style={{ marginTop: 24 }}>
            {ratingCategories.map((category) => (
              <Col xs={24} sm={12} key={`user-${category.key}`}>
                <Card className="rating-category">
                  <div className="rating-category__header">
                    <strong>{category.label}</strong>
                    <span className="rating-category__score">
                      {userRatings[category.key] || 0}/10
                    </span>
                  </div>
                  <Slider
                    min={0}
                    max={10}
                    value={userRatings[category.key] || 0}
                    onChange={(value) =>
                      handleUserRatingChange(category.key, value)
                    }
                    marks={{ 0: '0', 5: '5', 10: '10' }}
                    tooltip={{ formatter: (value) => `${value}/10` }}
                  />
                </Card>
              </Col>
            ))}
          </Row>

          <div className="rating-section__actions">
            <Button
              type="primary"
              size="large"
              onClick={handleSaveUserRating}
              loading={isSavingUserRating}
            >
              {t('ratingSection.saveUserButton')}
            </Button>
          </div>
        </div>
      ) : (
        <Card style={{ marginTop: 'var(--spacing-lg)' }}>
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>
            {t('ratingSection.loginPrompt')}
          </p>
        </Card>
      )}

      {/* User Rating Averages by Category */}
      {userRatingsData &&
        userRatingsData.totalVoters > 0 &&
        Object.keys(userRatingsData.averages).length > 0 && (
          <div className="rating-section__categories">
            <h4 className="rating-section__title">
              {t('ratingSection.userAverageTitle')}
            </h4>
            <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
              {ratingCategories.map((category) => {
                const avg = userRatingsData.averages[category.key];
                if (avg === undefined) return null;
                return (
                  <Col xs={12} sm={6} key={`avg-${category.key}`}>
                    <Card size="small" className="rating-category">
                      <div className="rating-category__header">
                        <strong>{category.label}</strong>
                        <span className="rating-category__score">{avg}/10</span>
                      </div>
                    </Card>
                  </Col>
                );
              })}
            </Row>
          </div>
        )}
    </div>
  );
}
