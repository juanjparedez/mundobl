'use client';

import Image from 'next/image';
import Link from 'next/link';
import { BellFilled } from '@ant-design/icons';
import { isSupabaseImageUrl } from '@/lib/image-helpers';
import type { ProfileData } from '../../types';
import './FollowedTitles.css';

interface Props {
  favorites: ProfileData['favorites'];
}

/** "Títulos seguidos" del style-guide: strip de posters chicos con
 *  bell icon. Usa stats.favorites real (no inventa). */
export function OverviewFollowedTitles({ favorites }: Props) {
  const visible = (favorites ?? []).filter((f) => f.series).slice(0, 5);

  // Header + "Ver todos" los rendea el Widget wrapper.
  return (
    <section className="overview-followed">
      {visible.length === 0 ? (
        <div className="overview-followed__empty">
          Aún no tenés títulos en favoritos.
        </div>
      ) : (
        <ul className="overview-followed__strip">
          {visible.map(({ seriesId, series }) => {
            if (!series) return null;
            return (
              <li key={seriesId} className="overview-followed__item">
                <Link
                  href={`/series/${series.id}`}
                  className="overview-followed__link"
                >
                  <div className="overview-followed__poster">
                    {series.imageUrl ? (
                      <Image
                        src={series.imageUrl}
                        alt=""
                        width={88}
                        height={132}
                        sizes="88px"
                        unoptimized={!isSupabaseImageUrl(series.imageUrl)}
                      />
                    ) : null}
                    <span
                      className="overview-followed__bell"
                      aria-label="Seguido"
                    >
                      <BellFilled />
                    </span>
                  </div>
                  <span
                    className="overview-followed__name"
                    title={series.title}
                  >
                    {series.title}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
