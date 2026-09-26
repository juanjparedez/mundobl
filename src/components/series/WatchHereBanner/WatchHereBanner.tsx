'use client';

import Link from 'next/link';
import { PlayCircleFilled } from '@ant-design/icons';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { interpolateMessage } from '@/lib/i18n-format';
import './WatchHereBanner.css';

interface WatchHereBannerProps {
  href: string;
  /** Cuantos aportes de la comunidad la tienen, si no hay episodios propios. */
  contributions?: number;
}

/** Aviso de la ficha: esta serie tambien se ve en /ver. */
export function WatchHereBanner({ href, contributions }: WatchHereBannerProps) {
  const { t } = useLocale();
  const label =
    contributions === undefined
      ? t('watchHereBanner.own')
      : contributions > 1
        ? interpolateMessage(t('watchHereBanner.contributions'), {
            n: String(contributions),
          })
        : t('watchHereBanner.contribution');

  return (
    <div className="watch-here-banner">
      <Link href={href} className="watch-here-banner__link">
        <PlayCircleFilled aria-hidden="true" />
        {label}
      </Link>
    </div>
  );
}
