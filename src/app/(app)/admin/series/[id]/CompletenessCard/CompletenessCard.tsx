'use client';

import { Progress } from 'antd';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { PanelCard, Chip } from '@/components/design-system';
import {
  computeCompleteness,
  completenessTier,
  type CompletenessField,
} from '@/lib/series-completeness';
import './CompletenessCard.css';

interface CompletenessSeries {
  synopsis?: string | null;
  imageUrl?: string | null;
  year?: number | null;
  originalTitle?: string | null;
  review?: string | null;
  soundtrack?: string | null;
  country?: { id: number } | null;
  directors?: Array<{ directorId: number } | { director?: { id: number } }>;
  tags?: Array<{ tagId: number } | { tag?: { id: number } }>;
  actors?: Array<{ actorId: number } | { actor?: { id: number } }>;
}

export interface CompletenessCardProps {
  series: CompletenessSeries;
}

const TONE_BY_TIER: Record<
  'low' | 'mid' | 'high',
  'error' | 'warning' | 'success'
> = {
  low: 'error',
  mid: 'warning',
  high: 'success',
};

export function CompletenessCard({ series }: CompletenessCardProps) {
  const { t } = useLocale();
  const { score, missing, weights } = computeCompleteness(series);
  const tier = completenessTier(score);

  // Ant Progress strokeColor lo dejamos por defecto (toma el primary). El
  // tono semantico se transmite con el chip de tier y con la clase wrapper
  // que aplica fondo/borde sutil acorde.
  return (
    <PanelCard
      padding="md"
      className={`mb-completeness-card mb-completeness-card--${tier}`}
    >
      <div className="mb-completeness-card__head">
        <span className="mb-completeness-card__label">
          {t('completeness.title')}
        </span>
        <Chip tone={TONE_BY_TIER[tier]} size="sm">
          {t(`completeness.tier.${tier}`)}
        </Chip>
      </div>

      <div className="mb-completeness-card__bar">
        <Progress
          percent={score}
          showInfo={false}
          size={['100%', 8]}
          status={
            tier === 'low'
              ? 'exception'
              : tier === 'high'
                ? 'success'
                : 'normal'
          }
        />
        <span className="mb-completeness-card__score">{score}</span>
      </div>

      {missing.length > 0 && (
        <div className="mb-completeness-card__missing">
          <span className="mb-completeness-card__missing-label">
            {t('completeness.missingLabel')}
          </span>
          <ul className="mb-completeness-card__missing-list">
            {missing.map((field) => (
              <li key={field}>
                <Chip tone="neutral" size="sm">
                  {t(
                    `completeness.field.${field}` as `completeness.field.${CompletenessField}`
                  )}{' '}
                  <span className="mb-completeness-card__weight">
                    +{weights[field]}
                  </span>
                </Chip>
              </li>
            ))}
          </ul>
        </div>
      )}
    </PanelCard>
  );
}
