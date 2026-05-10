'use client';

import { ReadOutlined } from '@ant-design/icons';
import type { ProfileData } from '../../types';
import './ReviewsActivity.css';

interface Props {
  stats: ProfileData['stats'];
}

/** "Actividad de reseñas" del style-guide. Sin chart mensual porque la API
 *  no devuelve el breakdown por mes — mostramos el total real y una nota
 *  honesta. Cuando el backend exponga stats.reviewsByMonth, agregamos el
 *  chart aca. */
export function OverviewReviewsActivity({ stats }: Props) {
  return (
    <section className="overview-reviews-activity">
      <header className="overview-reviews-activity__head">
        <h3 className="overview-reviews-activity__title">
          <ReadOutlined /> Actividad de reseñas
        </h3>
      </header>
      <div className="overview-reviews-activity__big">{stats.reviews}</div>
      <div className="overview-reviews-activity__sub">Reseñas publicadas</div>
    </section>
  );
}
