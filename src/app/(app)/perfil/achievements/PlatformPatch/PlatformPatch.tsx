'use client';

import type { PatchTier } from '@/lib/platform-patches';
import './PlatformPatch.css';

export interface PlatformPatchProps {
  /** Id de la plataforma (clase CSS). */
  patchKey: string;
  platform: string;
  initials: string;
  tier: PatchTier | null;
  /** Nivel ya traducido ("Oro", "Sin parche"...). */
  tierLabel: string;
  /** Lineas de progreso ya traducidas. */
  progressLabel: string;
  nextLabel: string;
}

/** Parche bordado de una plataforma. Arte propio (siglas + color del nivel),
 *  sin logos de terceros. Sin nivel se ve apagado con borde punteado. */
export function PlatformPatch({
  patchKey,
  platform,
  initials,
  tier,
  tierLabel,
  progressLabel,
  nextLabel,
}: PlatformPatchProps) {
  return (
    <li
      className={`mb-platform-patch mb-platform-patch--${tier ?? 'none'} mb-platform-patch--${patchKey}`}
    >
      <span
        className="mb-platform-patch__badge"
        role="img"
        aria-label={`${platform}: ${tierLabel}`}
      >
        <span className="mb-platform-patch__initials" aria-hidden>
          {initials}
        </span>
      </span>
      <span className="mb-platform-patch__name">{platform}</span>
      <span className="mb-platform-patch__tier">{tierLabel}</span>
      <span className="mb-platform-patch__meta">{progressLabel}</span>
      <span className="mb-platform-patch__meta">{nextLabel}</span>
    </li>
  );
}
