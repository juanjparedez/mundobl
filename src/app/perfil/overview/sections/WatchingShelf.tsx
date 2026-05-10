'use client';

import Image from 'next/image';
import Link from 'next/link';
import { PlayCircleOutlined } from '@ant-design/icons';
import { isSupabaseImageUrl } from '@/lib/image-helpers';
import type { ProfileData } from '../../types';
import './WatchingShelf.css';

interface Props {
  items: ProfileData['currentlyWatching'];
}

/** Shelf "Seguir viendo" overview-aligned: 4 cards horizontales con poster
 *  16:9, badge En emision/Finalizada, titulo, season-episode, progress. */
export function OverviewWatchingShelf({ items }: Props) {
  const visible = (items ?? []).slice(0, 4);

  return (
    <section className="overview-shelf">
      <header className="overview-shelf__header">
        <h3 className="overview-shelf__title">
          <PlayCircleOutlined /> Seguir viendo
        </h3>
        <Link href="/watching" className="overview-shelf__see-all">
          Ver todo
        </Link>
      </header>

      {visible.length === 0 ? (
        <div className="overview-shelf__empty">
          No estás siguiendo ninguna serie. Empezá a ver para que aparezcan acá.
        </div>
      ) : (
        <ul className="overview-shelf__grid">
          {visible.map(({ seriesId, series, progress, nextEpisode }) => {
            if (!series) return null;
            const pct =
              progress.totalEpisodes > 0
                ? Math.round(
                    (progress.watchedEpisodes / progress.totalEpisodes) * 100
                  )
                : 0;
            const isFinished = pct >= 100;
            return (
              <li key={seriesId} className="overview-shelf__card">
                <Link
                  href={`/series/${series.id}`}
                  className="overview-shelf__link"
                >
                  <div className="overview-shelf__cover">
                    {series.imageUrl ? (
                      <Image
                        src={series.imageUrl}
                        alt=""
                        width={240}
                        height={135}
                        sizes="240px"
                        quality={70}
                        unoptimized={!isSupabaseImageUrl(series.imageUrl)}
                      />
                    ) : (
                      <span className="overview-shelf__cover-placeholder">
                        <PlayCircleOutlined />
                      </span>
                    )}
                    <span
                      className={`overview-shelf__badge overview-shelf__badge--${isFinished ? 'done' : 'live'}`}
                    >
                      {isFinished ? 'Finalizada' : 'En emisión'}
                    </span>
                    <button
                      type="button"
                      className="overview-shelf__play"
                      aria-label="Continuar"
                      onClick={(e) => e.preventDefault()}
                    >
                      <PlayCircleOutlined />
                    </button>
                  </div>
                  <div className="overview-shelf__body">
                    <h4 className="overview-shelf__name" title={series.title}>
                      {series.title}
                    </h4>
                    <div className="overview-shelf__row">
                      <span className="overview-shelf__sub">
                        {nextEpisode
                          ? `T${nextEpisode.seasonNumber} · E${String(nextEpisode.episodeNumber).padStart(2, '0')}`
                          : `${progress.watchedEpisodes}/${progress.totalEpisodes}`}
                      </span>
                      <span className="overview-shelf__pct">{pct}%</span>
                    </div>
                    <div className="overview-shelf__progress">
                      <span
                        className="overview-shelf__progress-fill"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
