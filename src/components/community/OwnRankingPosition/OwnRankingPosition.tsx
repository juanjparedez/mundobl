'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from 'antd';
import { TrophyOutlined, LockOutlined, SyncOutlined } from '@ant-design/icons';
import type { OwnRankingPosition as Position } from '@/lib/community-ranking';
import type { AliasParts } from '@/lib/community-alias';
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
    appearsAs: (alias: string) => string;
    changeAlias: string;
    changeAliasLater: string;
  };
  formatAlias: (parts: AliasParts) => string;
}

/**
 * "Este mes vas #N": la parte personal del ranking mensual. Va aparte del
 * ranking publico porque /estadisticas se sirve con ISR para todos.
 */
export function OwnRankingPosition({
  enabled,
  labels,
  formatAlias,
}: OwnRankingPositionProps) {
  const [position, setPosition] = useState<
    (Position & { staff: boolean }) | null
  >(null);
  const [rerolling, setRerolling] = useState(false);
  const [cooldown, setCooldown] = useState(false);

  // El alias nuevo se ve aca enseguida; en el ranking publico, cuando la
  // pagina se regenere (ISR).
  const rerollAlias = async () => {
    setRerolling(true);
    try {
      const response = await fetch('/api/community/alias', { method: 'POST' });
      if (response.status === 429) setCooldown(true);
      if (!response.ok) return;
      const { alias } = (await response.json()) as { alias: AliasParts };
      setPosition((current) => (current ? { ...current, alias } : current));
      setCooldown(true);
    } catch {
      // Sin red queda el alias de antes; se puede volver a intentar.
    } finally {
      setRerolling(false);
    }
  };

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
      {position && !position.staff && !position.published && (
        <p className="own-ranking-position__alias">
          {labels.appearsAs(formatAlias(position.alias))}{' '}
          <Button
            type="link"
            size="small"
            icon={<SyncOutlined />}
            loading={rerolling}
            disabled={cooldown}
            title={cooldown ? labels.changeAliasLater : undefined}
            onClick={() => void rerollAlias()}
          >
            {labels.changeAlias}
          </Button>
        </p>
      )}
      <p className="own-ranking-position__privacy">
        <LockOutlined aria-hidden /> {labels.privacy}{' '}
        <Link href="/comunidad/mi-espacio">{labels.privacyLink}</Link>
      </p>
    </div>
  );
}
