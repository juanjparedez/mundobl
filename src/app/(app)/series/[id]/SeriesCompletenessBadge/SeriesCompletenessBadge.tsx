'use client';

import Link from 'next/link';
import { CheckCircleFilled, ToolOutlined } from '@ant-design/icons';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { Chip } from '@/components/design-system';
import {
  computeCompleteness,
  completenessTier,
  type CompletenessField,
} from '@/lib/series-completeness';
import './SeriesCompletenessBadge.css';

export interface SeriesCompletenessBadgeProps {
  seriesId: number;
  series: Parameters<typeof computeCompleteness>[0];
  /** Solo moderador+ ve el detalle accionable (qué falta + link al
   *  editor). Para el público es una métrica de curación interna: solo
   *  se muestra el sello cuando la ficha está completa (señal positiva). */
  canEdit: boolean;
}

/** Sello público de completitud de la ficha de una serie (#112, fase 1).
 *
 *  - Público: render SOLO si la ficha está completa (tier high) — sello
 *    de confianza, no exponemos fichas pobres en cada serie.
 *  - Editor (moderador+): se muestra siempre, como link al editor con
 *    tooltip de qué campos faltan (nudge de curación accionable). */
export function SeriesCompletenessBadge({
  seriesId,
  series,
  canEdit,
}: SeriesCompletenessBadgeProps) {
  const { t } = useLocale();
  const { score, missing } = computeCompleteness(series);
  const tier = completenessTier(score);

  // Público: solo el sello positivo. Editores: siempre (accionable).
  if (!canEdit && tier !== 'high') return null;

  if (!canEdit) {
    return (
      <div className="mb-series-completeness mb-series-completeness--public">
        <CheckCircleFilled className="mb-series-completeness__icon" />
        <span className="mb-series-completeness__text">
          {t('completeness.tier.high')}
        </span>
      </div>
    );
  }

  const missingText =
    missing.length > 0
      ? `${t('completeness.missingLabel')}: ${missing
          .map((f) =>
            t(
              `completeness.field.${f}` as `completeness.field.${CompletenessField}`
            )
          )
          .join(', ')}`
      : t('completeness.tier.high');

  return (
    <Link
      href={`/admin/series/${seriesId}/editar`}
      prefetch={false}
      className={`mb-series-completeness mb-series-completeness--edit mb-series-completeness--${tier}`}
      title={missingText}
    >
      <ToolOutlined className="mb-series-completeness__icon" />
      <span className="mb-series-completeness__text">
        {t('completeness.title')}
      </span>
      <Chip
        tone={
          tier === 'high' ? 'success' : tier === 'mid' ? 'warning' : 'error'
        }
        size="sm"
      >
        {score}
      </Chip>
    </Link>
  );
}
