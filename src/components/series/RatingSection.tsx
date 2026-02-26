'use client';

import { useState, useEffect, useCallback } from 'react';
import { Slider, Button, Card, Row, Col } from 'antd';
import { StarFilled, TeamOutlined } from '@ant-design/icons';
import { useSession } from 'next-auth/react';
import './RatingSection.css';
import { useMessage } from '@/hooks/useMessage';

interface RatingSectionProps {
  seriesId: number;
  existingRatings: Array<{
    category: string;
    score: number;
  }>;
}

const RATING_CATEGORIES = [
  { key: 'trama', label: 'Trama' },
  { key: 'casting', label: 'Casting' },
  { key: 'direccion', label: 'Dirección' },
  { key: 'guion', label: 'Guión' },
  { key: 'produccion', label: 'Producción' },
  { key: 'fotografia', label: 'Fotografía' },
  { key: 'bso', label: 'Banda Sonora' },
  { key: 'quimica_principal', label: 'Química de pareja principal' },
  { key: 'quimica_secundaria', label: 'Química de pareja secundaria' },
];

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
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'ADMIN';

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
      message.success('Puntuaciones oficiales guardadas');
    } catch (error) {
      message.error('Error al guardar las puntuaciones');
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
      message.success('Tu puntuación fue guardada');
      fetchUserRatings();
    } catch (error) {
      message.error('Error al guardar tu puntuación');
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
              Puntuación oficial
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
                Puntuación de usuarios ({userRatingsData.totalVoters}{' '}
                {userRatingsData.totalVoters === 1 ? 'voto' : 'votos'})
              </span>
            </div>
          </Card>
        )}

      {/* Official Rating Sliders (Admin only) */}
      {isAdmin && (
        <div className="rating-section__categories">
          <h4 className="rating-section__title">Puntuación Oficial</h4>
          <span style={{ color: 'var(--text-secondary)' }}>
            Evalúa cada aspecto de la serie del 1 al 10
          </span>

          <Row gutter={[16, 24]} style={{ marginTop: 24 }}>
            {RATING_CATEGORIES.map((category) => (
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
              Guardar Puntuación Oficial
            </Button>
          </div>
        </div>
      )}

      {/* User Rating Sliders (any logged-in user) */}
      {session?.user ? (
        <div className="rating-section__categories">
          <h4 className="rating-section__title">Tu Puntuación</h4>
          <span style={{ color: 'var(--text-secondary)' }}>
            Tu puntuación será pública y contribuirá al promedio de usuarios
          </span>

          <Row gutter={[16, 24]} style={{ marginTop: 24 }}>
            {RATING_CATEGORIES.map((category) => (
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
              Guardar Mi Puntuación
            </Button>
          </div>
        </div>
      ) : (
        <Card style={{ marginTop: 'var(--spacing-lg)' }}>
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>
            Inicia sesión para puntuar esta serie
          </p>
        </Card>
      )}

      {/* User Rating Averages by Category */}
      {userRatingsData &&
        userRatingsData.totalVoters > 0 &&
        Object.keys(userRatingsData.averages).length > 0 && (
          <div className="rating-section__categories">
            <h4 className="rating-section__title">
              Promedio de Usuarios por Categoría
            </h4>
            <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
              {RATING_CATEGORIES.map((category) => {
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
