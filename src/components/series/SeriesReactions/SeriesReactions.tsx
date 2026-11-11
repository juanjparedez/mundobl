'use client';

import { useCallback, useState, useSyncExternalStore } from 'react';
import { Tooltip } from 'antd';
import { Chip } from '@/components/design-system';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { useSeriesPageStats } from '@/hooks/useSeriesPageStats';
import { recordSeriesActivity } from '@/lib/activity-beacon';
import {
  SERIES_REACTIONS,
  type SeriesReactionKey,
} from '@/lib/series-reactions';
import {
  getOwnReactions,
  sendReaction,
  setOwnReactions,
  subscribeOwnReactions,
} from '@/lib/series-reactions-client';
import './SeriesReactions.css';

interface SeriesReactionsProps {
  seriesId: number;
}

const NO_REACTIONS: SeriesReactionKey[] = [];

/**
 * Barra de reacciones con emoji de la serie (ficha y /ver). Anda con y sin
 * cuenta: el navegador recuerda las propias y la base suma totales.
 */
export function SeriesReactions({ seriesId }: SeriesReactionsProps) {
  const { t, locale } = useLocale();
  const stats = useSeriesPageStats(seriesId);
  const getOwn = useCallback(() => getOwnReactions(seriesId), [seriesId]);
  const own = useSyncExternalStore(
    subscribeOwnReactions,
    getOwn,
    () => NO_REACTIONS
  );
  // Lo que este navegador sumo o resto desde que cargo la pagina: los totales
  // vienen de una cache de unos minutos y todavia no lo incluyen.
  const [delta, setDelta] = useState<{
    seriesId: number;
    values: Partial<Record<SeriesReactionKey, number>>;
  }>({ seriesId, values: {} });
  const deltas = delta.seriesId === seriesId ? delta.values : {};

  const bump = (key: SeriesReactionKey, by: number) =>
    setDelta((prev) => {
      const values = prev.seriesId === seriesId ? prev.values : {};
      return {
        seriesId,
        values: { ...values, [key]: (values[key] ?? 0) + by },
      };
    });

  const toggle = async (key: SeriesReactionKey) => {
    const active = !own.includes(key);
    const next = active ? [...own, key] : own.filter((k) => k !== key);
    setOwnReactions(seriesId, next);
    bump(key, active ? 1 : -1);
    // El corazon sigue alimentando los "Me gusta" de las estadisticas.
    if (active && key === 'love') recordSeriesActivity(seriesId, 'like');
    const saved = await sendReaction(seriesId, key, active);
    if (!saved) {
      // No se guardo: vuelve a como estaba.
      const current = getOwnReactions(seriesId).filter((k) => k !== key);
      setOwnReactions(seriesId, active ? current : [...current, key]);
      bump(key, active ? -1 : 1);
    }
  };

  return (
    <div
      className="series-reactions"
      role="group"
      aria-label={t('reactions.groupLabel')}
    >
      {SERIES_REACTIONS.map(({ key, emoji }) => {
        const mine = own.includes(key);
        const base = (stats?.reactions[key] ?? 0) + (deltas[key] ?? 0);
        const count = Math.max(base, mine ? 1 : 0);
        const name = t(`reactions.names.${key}`);
        return (
          <Tooltip key={key} title={name}>
            <Chip
              tone={mine ? 'accent' : 'neutral'}
              outline={!mine}
              pressed={mine}
              ariaLabel={t(
                mine ? 'reactions.removeLabel' : 'reactions.addLabel',
                { name, n: count }
              )}
              className="series-reactions__chip"
              icon={<span className="series-reactions__emoji">{emoji}</span>}
              onClick={() => void toggle(key)}
            >
              {count > 0 ? count.toLocaleString(locale) : null}
            </Chip>
          </Tooltip>
        );
      })}
    </div>
  );
}
