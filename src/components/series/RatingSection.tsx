'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button, Card } from 'antd';
import {
  StarFilled,
  TeamOutlined,
  BookOutlined,
  UserOutlined,
  VideoCameraOutlined,
  EditOutlined,
  BulbOutlined,
  CameraOutlined,
  SoundOutlined,
  HeartOutlined,
  FireOutlined,
} from '@ant-design/icons';
import { useSession } from 'next-auth/react';
import './RatingSection.css';
import { useMessage } from '@/hooks/useMessage';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { interpolateMessage } from '@/lib/i18n-format';
import { CategoryRater } from './CategoryRater/CategoryRater';

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

const CATEGORY_ICONS: Record<RatingCategoryKey, React.ReactNode> = {
  trama: <BookOutlined />,
  casting: <UserOutlined />,
  direccion: <VideoCameraOutlined />,
  guion: <EditOutlined />,
  produccion: <BulbOutlined />,
  fotografia: <CameraOutlined />,
  bso: <SoundOutlined />,
  quimica_principal: <HeartOutlined />,
  quimica_secundaria: <FireOutlined />,
};

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

  const [ratings, setRatings] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    existingRatings.forEach((rating) => {
      initial[rating.category] = rating.score;
    });
    return initial;
  });
  const [isSaving, setIsSaving] = useState(false);

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
      {/* Hero combo: oficial + comunidad lado a lado si ambos existen */}
      <div className="rating-hero">
        {averageRating && (
          <div className="rating-hero__card rating-hero__card--official">
            <StarFilled className="rating-hero__icon" />
            <div className="rating-hero__score">{averageRating}</div>
            <div className="rating-hero__label">
              {t('ratingSection.officialLabel')}
            </div>
          </div>
        )}

        {userRatingsData &&
          userRatingsData.totalVoters > 0 &&
          userRatingsData.overallAverage !== null && (
            <div className="rating-hero__card rating-hero__card--user">
              <TeamOutlined className="rating-hero__icon" />
              <div className="rating-hero__score">
                {userRatingsData.overallAverage}
              </div>
              <div className="rating-hero__label">
                {interpolateMessage(
                  userRatingsData.totalVoters === 1
                    ? t('ratingSection.votesSingular')
                    : t('ratingSection.votesPlural'),
                  { n: String(userRatingsData.totalVoters) }
                )}
              </div>
            </div>
          )}
      </div>

      {/* Rating oficial (solo admin) */}
      {isAdmin && (
        <section className="rating-block">
          <header className="rating-block__header">
            <div>
              <h4 className="rating-block__title">
                {t('ratingSection.officialTitle')}
              </h4>
              <p className="rating-block__hint">
                {t('ratingSection.officialHint')}
              </p>
            </div>
            <Button
              type="primary"
              onClick={handleSave}
              loading={isSaving}
              size="middle"
            >
              {t('ratingSection.saveOfficialButton')}
            </Button>
          </header>
          <div className="rating-block__grid">
            {ratingCategories.map((category) => (
              <CategoryRater
                key={category.key}
                label={category.label}
                icon={CATEGORY_ICONS[category.key]}
                value={ratings[category.key] || 0}
                onChange={(v) => handleRatingChange(category.key, v)}
                tone="gold"
              />
            ))}
          </div>
        </section>
      )}

      {/* Rating del usuario (cualquier logueado) */}
      {session?.user ? (
        <section className="rating-block">
          <header className="rating-block__header">
            <div>
              <h4 className="rating-block__title">
                {t('ratingSection.userTitle')}
              </h4>
              <p className="rating-block__hint">
                {t('ratingSection.userHint')}
              </p>
            </div>
            <Button
              type="primary"
              onClick={handleSaveUserRating}
              loading={isSavingUserRating}
              size="middle"
            >
              {t('ratingSection.saveUserButton')}
            </Button>
          </header>
          <div className="rating-block__grid">
            {ratingCategories.map((category) => (
              <CategoryRater
                key={`user-${category.key}`}
                label={category.label}
                icon={CATEGORY_ICONS[category.key]}
                value={userRatings[category.key] || 0}
                onChange={(v) => handleUserRatingChange(category.key, v)}
                tone="primary"
              />
            ))}
          </div>
        </section>
      ) : (
        <Card className="rating-block__login">
          <p>{t('ratingSection.loginPrompt')}</p>
        </Card>
      )}

      {/* Promedios de la comunidad por categoria (solo lectura) */}
      {userRatingsData &&
        userRatingsData.totalVoters > 0 &&
        Object.keys(userRatingsData.averages).length > 0 && (
          <section className="rating-block">
            <header className="rating-block__header">
              <div>
                <h4 className="rating-block__title">
                  {t('ratingSection.userAverageTitle')}
                </h4>
              </div>
            </header>
            <div className="rating-block__grid">
              {ratingCategories.map((category) => {
                const avg = userRatingsData.averages[category.key];
                if (avg === undefined) return null;
                return (
                  <CategoryRater
                    key={`avg-${category.key}`}
                    label={category.label}
                    icon={CATEGORY_ICONS[category.key]}
                    value={avg}
                    readonly
                    tone="neutral"
                  />
                );
              })}
            </div>
          </section>
        )}
    </div>
  );
}
