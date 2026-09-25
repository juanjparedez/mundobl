'use client';

import { Tooltip } from 'antd';
import { LikeOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { interpolateMessage } from '@/lib/i18n-format';
import './SeriesStats.css';

export interface SeriesStatsProps {
  /** Reproducciones sumadas de los videos oficiales en YouTube. */
  views?: number | null;
  /** "Me gusta" sumados de esos mismos videos. */
  likes?: number | null;
  className?: string;
}

/**
 * Contadores publicos de YouTube de una serie, compactos ("2,3 M").
 *
 * Son los numeros de los videos oficiales, no vistas de MundoBL, y el
 * tooltip lo dice. Sin datos no se renderiza nada: mejor ningun numero que
 * un "0" que nadie midio.
 */
export function SeriesStats({ views, likes, className }: SeriesStatsProps) {
  const { t, locale } = useLocale();
  if (!views && !likes) return null;

  const compact = new Intl.NumberFormat(locale, {
    notation: 'compact',
    maximumFractionDigits: 1,
  });

  return (
    <Tooltip title={t('seriesStats.source')}>
      <span className={['series-stats', className].filter(Boolean).join(' ')}>
        {views ? (
          <span
            className="series-stats__item"
            aria-label={interpolateMessage(t('seriesStats.views'), {
              n: compact.format(views),
            })}
          >
            <PlayCircleOutlined aria-hidden /> {compact.format(views)}
          </span>
        ) : null}
        {likes ? (
          <span
            className="series-stats__item"
            aria-label={interpolateMessage(t('seriesStats.likes'), {
              n: compact.format(likes),
            })}
          >
            <LikeOutlined aria-hidden /> {compact.format(likes)}
          </span>
        ) : null}
      </span>
    </Tooltip>
  );
}
