'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { CheckCircleFilled, ToolOutlined } from '@ant-design/icons';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { Chip } from '@/components/design-system';
import { canEditCatalog } from '@/lib/auth-client';
import {
  computeCompleteness,
  completenessTier,
  type CompletenessField,
} from '@/lib/series-completeness';
import './SeriesCompletenessBadge.css';

export interface SeriesCompletenessBadgeProps {
  seriesId: number;
  series: Parameters<typeof computeCompleteness>[0];
}

/** Sello público de completitud de la ficha de una serie (#112, fase 1).
 *
 *  - Público: render SOLO si la ficha está completa (tier high) — sello
 *    de confianza, no exponemos fichas pobres en cada serie.
 *  - Editor (moderador+): se muestra siempre, como link al editor con
 *    tooltip de qué campos faltan (nudge de curación accionable).
 *
 *  El rol se resuelve aca via useSession() (antes llegaba como prop
 *  `canEdit` calculada en el servidor con `await auth()`, pero
 *  /series/[id] dejo de llamarla para no forzar render dinamico). */
export function SeriesCompletenessBadge({
  seriesId,
  series,
}: SeriesCompletenessBadgeProps) {
  const { t } = useLocale();
  const { data: session } = useSession();
  const canEdit = canEditCatalog(session?.user?.role);
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
