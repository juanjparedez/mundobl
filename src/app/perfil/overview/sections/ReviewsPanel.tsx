'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ReadOutlined, StarFilled } from '@ant-design/icons';
import { isSupabaseImageUrl } from '@/lib/image-helpers';
import type { ProfileData } from '../../types';
import './ReviewsPanel.css';

interface Props {
  recentReviews: ProfileData['recentReviews'];
}

function formatDate(iso: string | null): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('es', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

/** "Mis reseñas" del style-guide: cards con poster + titulo + stars +
 *  cuerpo + fecha. Usa solo data real de stats.recentReviews. */
export function OverviewReviewsPanel({ recentReviews }: Props) {
  const visible = recentReviews.slice(0, 2);
  const total = recentReviews.length;

  return (
    <section className="overview-reviews">
      <header className="overview-reviews__head">
        <h3 className="overview-reviews__title">
          <ReadOutlined /> Mis reseñas
        </h3>
        <Link href="/perfil/clasico" className="overview-reviews__see-all">
          Ver todas
        </Link>
      </header>

      {visible.length === 0 ? (
        <div className="overview-reviews__empty">
          Aún no escribiste reseñas. Vas a poder publicarlas desde el detalle de cada serie.
        </div>
      ) : (
        <ul className="overview-reviews__list">
          {visible.map((r) => {
            const rating = r.helpfulCount; // proxy mientras no haya rating en review
            const stars = Math.min(5, Math.max(0, Math.round(rating)));
            return (
              <li key={r.id} className="overview-reviews__item">
                {r.series ? (
                  <div className="overview-reviews__poster">
                    {r.series.imageUrl ? (
                      <Image
                        src={r.series.imageUrl}
                        alt=""
                        width={56}
                        height={84}
                        sizes="56px"
                        unoptimized={!isSupabaseImageUrl(r.series.imageUrl)}
                      />
                    ) : null}
                  </div>
                ) : null}
                <div className="overview-reviews__body">
                  <div className="overview-reviews__row">
                    <Link
                      href={r.series ? `/series/${r.series.id}` : '#'}
                      className="overview-reviews__series"
                    >
                      {r.series?.title ?? r.title}
                    </Link>
                    <span className="overview-reviews__date">
                      {formatDate(r.publishedAt ?? r.updatedAt)}
                    </span>
                  </div>
                  {stars > 0 && (
                    <div className="overview-reviews__stars" aria-hidden>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <StarFilled
                          key={i}
                          className={
                            i < stars
                              ? 'overview-reviews__star overview-reviews__star--on'
                              : 'overview-reviews__star'
                          }
                        />
                      ))}
                    </div>
                  )}
                  <p className="overview-reviews__text">{r.body}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {total > 2 && (
        <Link href="/perfil/clasico" className="overview-reviews__more">
          Ver todas mis reseñas ({total})
        </Link>
      )}
    </section>
  );
}
