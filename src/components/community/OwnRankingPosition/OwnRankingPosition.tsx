'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { TrophyOutlined, LockOutlined } from '@ant-design/icons';
import type { OwnRankingPosition as Position } from '@/lib/community-ranking';
import './OwnRankingPosition.css';

interface OwnRankingPositionProps {
  /** Solo se pide con sesion: el ranking de cada uno es privado. */
  enabled: boolean;
  labels: {
    position: (rank: number, ranked: number, count: number) => string;
    empty: string;
    staff: string;
    privacy: string;
    privacyLink: string;
  };
}

/**
 * "Este mes vas #N": la parte personal del ranking mensual. Va aparte del
 * ranking publico porque /estadisticas se sirve con ISR para todos.
 */
export function OwnRankingPosition({
  enabled,
  labels,
}: OwnRankingPositionProps) {
  const [position, setPosition] = useState<
    (Position & { staff: boolean }) | null
  >(null);

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    fetch('/api/user/ranking', { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: (Position & { staff: boolean }) | null) => {
        if (data) setPosition(data);
      })
      .catch(() => null);
    return () => controller.abort();
  }, [enabled]);

  return (
    <div className="own-ranking-position">
      {position && (
        <p className="own-ranking-position__mine">
          <TrophyOutlined aria-hidden />{' '}
          {position.staff
            ? labels.staff
            : position.rank !== null
              ? labels.position(position.rank, position.ranked, position.count)
              : labels.empty}
        </p>
      )}
      <p className="own-ranking-position__privacy">
        <LockOutlined aria-hidden /> {labels.privacy}{' '}
        <Link href="/comunidad/mi-espacio">{labels.privacyLink}</Link>
      </p>
    </div>
  );
}
