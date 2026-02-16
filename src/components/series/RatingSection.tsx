'use client';

import { useState } from 'react';
import { Slider, Button, Card, Row, Col } from 'antd';
import { StarFilled } from '@ant-design/icons';
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
  { key: 'originalidad', label: 'Originalidad' },
  { key: 'bso', label: 'Banda Sonora (BSO)' },
  { key: 'fotografia', label: 'Fotografía' },
  { key: 'actuacion', label: 'Actuación' },
  { key: 'quimica', label: 'Química' },
  { key: 'ritmo', label: 'Ritmo' },
];

export function RatingSection({
  seriesId,
  existingRatings,
}: RatingSectionProps) {
  const message = useMessage();
  const [ratings, setRatings] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    existingRatings.forEach((rating) => {
      initial[rating.category] = rating.score;
    });
    return initial;
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleRatingChange = (category: string, value: number) => {
    setRatings((prev) => ({
      ...prev,
      [category]: value,
    }));
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

      message.success('Puntuaciones guardadas correctamente');
    } catch (error) {
      message.error('Error al guardar las puntuaciones');
      console.error(error);
    } finally {
      setIsSaving(false);
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
      {averageRating && (
        <Card className="rating-section__average">
          <div className="rating-average">
            <StarFilled className="rating-average__icon" />
            <div className="rating-average__score">{averageRating}</div>
            <span style={{ color: 'var(--text-secondary)' }}>
              Puntuación promedio
            </span>
          </div>
        </Card>
      )}

      <div className="rating-section__categories">
        <h4 className="rating-section__title">Puntuar por categorías</h4>
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
                  onChange={(value) => handleRatingChange(category.key, value)}
                  marks={{
                    0: '0',
                    5: '5',
                    10: '10',
                  }}
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
            Guardar Puntuaciones
          </Button>
        </div>
      </div>
    </div>
  );
}
