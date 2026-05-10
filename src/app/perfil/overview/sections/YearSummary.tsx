'use client';

import { CalendarOutlined } from '@ant-design/icons';
import type { ProfileData } from '../../types';
import './YearSummary.css';

interface Props {
  stats: ProfileData['stats'];
}

/** "Resumen anual" del style-guide. Muestra el total real del año en
 *  curso (derivado de stats.completedByYear si existe ese año) y los
 *  KPIs del usuario (vistos, horas, reseñas, ratings). Sin chart por
 *  mes porque la API no lo devuelve — todo data real. */
export function OverviewYearSummary({ stats }: Props) {
  const currentYear = new Date().getFullYear();
  const yearWatched =
    stats.completedByYear.find((y) => y.year === currentYear)?.count ?? 0;

  return (
    <section className="overview-year">
      <header className="overview-year__head">
        <h3 className="overview-year__title">
          <CalendarOutlined /> Resumen anual
        </h3>
        <span className="overview-year__year">{currentYear}</span>
      </header>
      <ul className="overview-year__kpis">
        <li className="overview-year__kpi">
          <span className="overview-year__kpi-value">{yearWatched}</span>
          <span className="overview-year__kpi-label">
            Vistos en {currentYear}
          </span>
        </li>
        <li className="overview-year__kpi">
          <span className="overview-year__kpi-value">
            {Math.round(stats.hoursWatched)}h
          </span>
          <span className="overview-year__kpi-label">Horas totales</span>
        </li>
        <li className="overview-year__kpi">
          <span className="overview-year__kpi-value">{stats.reviews}</span>
          <span className="overview-year__kpi-label">Reseñas</span>
        </li>
        <li className="overview-year__kpi">
          <span className="overview-year__kpi-value">{stats.ratings}</span>
          <span className="overview-year__kpi-label">Valoraciones</span>
        </li>
      </ul>
    </section>
  );
}
