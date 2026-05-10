'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Popconfirm } from 'antd';
import {
  ReadOutlined,
  StarFilled,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { isSupabaseImageUrl } from '@/lib/image-helpers';
import { useMessage } from '@/hooks/useMessage';
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

/** "Mis reseñas" del overview: cards con poster + titulo + stars +
 *  cuerpo + fecha. Editar lleva al detalle de la serie (donde vive el
 *  formulario). Eliminar es inline con confirm — DELETE /api/reviews?id=N. */
export function OverviewReviewsPanel({ recentReviews }: Props) {
  const message = useMessage();
  const [hidden, setHidden] = useState<Set<number>>(new Set());
  const [busyId, setBusyId] = useState<number | null>(null);

  const visible = recentReviews.filter((r) => !hidden.has(r.id)).slice(0, 2);
  const total = recentReviews.filter((r) => !hidden.has(r.id)).length;

  const handleDelete = async (id: number) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/reviews?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('failed');
      // Optimistic local removal: ocultamos para no recargar todo el
      // ProfileData (refetch lo hace la siguiente navegacion).
      setHidden((prev) => new Set(prev).add(id));
      message.success('Reseña eliminada');
    } catch {
      message.error('No pudimos eliminar la reseña');
    } finally {
      setBusyId(null);
    }
  };

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
          {recentReviews.length === 0
            ? 'Aún no escribiste reseñas. Vas a poder publicarlas desde el detalle de cada serie.'
            : 'No tenés reseñas visibles.'}
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
                  <div className="overview-reviews__actions">
                    {r.series && (
                      <Link
                        href={`/series/${r.series.id}#mi-resena`}
                        className="overview-reviews__action"
                        title="Editar reseña"
                      >
                        <EditOutlined /> Editar
                      </Link>
                    )}
                    <Popconfirm
                      title="¿Eliminar esta reseña?"
                      description="Se borra para siempre."
                      okText="Eliminar"
                      cancelText="Cancelar"
                      okButtonProps={{
                        danger: true,
                        loading: busyId === r.id,
                      }}
                      onConfirm={() => handleDelete(r.id)}
                    >
                      <button
                        type="button"
                        className="overview-reviews__action overview-reviews__action--danger"
                        title="Eliminar reseña"
                        disabled={busyId === r.id}
                      >
                        <DeleteOutlined /> Eliminar
                      </button>
                    </Popconfirm>
                  </div>
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
