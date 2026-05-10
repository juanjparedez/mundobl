'use client';

import { BarChartOutlined, FireOutlined, StarFilled } from '@ant-design/icons';
import { DonutChart } from '@/components/charts';
import type { ProfileData } from '../../types';
import './MyStats.css';

interface Props {
  stats: ProfileData['stats'];
}

/** Panel "Mis estadísticas" del style-guide: grilla 2x2 con
 *  - Horas vistas (numero grande)
 *  - Racha más larga (numero + dots derivados de stats.heatmap)
 *  - Géneros favoritos (bar list real desde stats.topGenres)
 *  - Rating promedio (donut + stars desde stats.avgRating)
 *
 *  Sin data sintetizada: si la API no devuelve algo, se muestra "—"
 *  o un empty state honesto. */
export function OverviewMyStats({ stats }: Props) {
  const totalGenres = stats.topGenres.reduce((s, g) => s + g.count, 0);
  const topGenres5 = stats.topGenres.slice(0, 5).map((g) => ({
    name: g.name,
    pct: totalGenres > 0 ? Math.round((g.count / totalGenres) * 100) : 0,
  }));

  const ratingPct =
    stats.avgRating != null ? Math.min(100, (stats.avgRating / 5) * 100) : 0;

  // Para los dots de la racha: usamos los ultimos 28 dias del heatmap real.
  // stats.heatmap es un string[] de fechas con actividad (api/user/profile).
  const heatmapSet = new Set(stats.heatmap ?? []);
  const last28: boolean[] = [];
  const today = new Date();
  for (let i = 27; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    last28.push(heatmapSet.has(iso));
  }

  return (
    <section className="overview-mystats">
      <header className="overview-mystats__header">
        <h3 className="overview-mystats__title">
          <BarChartOutlined /> Mis estadísticas
        </h3>
        <a className="overview-mystats__link" href="/estadisticas">
          Ver informe completo →
        </a>
      </header>

      <div className="overview-mystats__grid">
        {/* Horas vistas — solo el total real, sin chart sintetizado */}
        <article className="overview-mystats__panel">
          <div className="overview-mystats__panel-head">
            <span className="overview-mystats__label">Horas vistas</span>
          </div>
          <div className="overview-mystats__big-value">
            {Math.round(stats.hoursWatched)}h
          </div>
          <div className="overview-mystats__sub">Total acumulado</div>
        </article>

        {/* Racha mas larga — dots reales desde heatmap */}
        <article className="overview-mystats__panel">
          <div className="overview-mystats__panel-head">
            <span className="overview-mystats__label">Racha más larga</span>
            <FireOutlined className="overview-mystats__streak-icon" />
          </div>
          <div className="overview-mystats__big-value">
            {stats.longestStreak} días
          </div>
          <div className="overview-mystats__sub">Últimos 28 días</div>
          <div className="overview-mystats__streak-mini">
            {last28.map((active, i) => (
              <span
                key={i}
                className={`overview-mystats__streak-dot${active ? ' overview-mystats__streak-dot--on' : ''}`}
              />
            ))}
          </div>
        </article>

        {/* Géneros favoritos — datos reales */}
        <article className="overview-mystats__panel">
          <div className="overview-mystats__panel-head">
            <span className="overview-mystats__label">Géneros favoritos</span>
          </div>
          {topGenres5.length === 0 ? (
            <div className="overview-mystats__empty">Sin datos aún</div>
          ) : (
            <ul className="overview-mystats__bars">
              {topGenres5.map((g) => (
                <li key={g.name} className="overview-mystats__bar-row">
                  <span className="overview-mystats__bar-name">{g.name}</span>
                  <span className="overview-mystats__bar-track">
                    <span
                      className="overview-mystats__bar-fill"
                      style={{ width: `${g.pct}%` }}
                    />
                  </span>
                  <span className="overview-mystats__bar-pct">{g.pct}%</span>
                </li>
              ))}
            </ul>
          )}
        </article>

        {/* Rating promedio — donut + stars reales */}
        <article className="overview-mystats__panel overview-mystats__panel--rating">
          <div className="overview-mystats__panel-head">
            <span className="overview-mystats__label">Rating promedio</span>
          </div>
          <div className="overview-mystats__rating-row">
            <div className="overview-mystats__rating-donut">
              <DonutChart
                data={[
                  {
                    name: 'rating',
                    value: ratingPct,
                    color: 'var(--primary-color)',
                  },
                  {
                    name: 'rest',
                    value: 100 - ratingPct,
                    color: 'rgba(255,255,255,0.08)',
                  },
                ]}
                height={84}
                innerRadius={26}
                outerRadius={40}
                showLegend={false}
              />
            </div>
            <div className="overview-mystats__rating-info">
              <div className="overview-mystats__rating-value">
                {stats.avgRating != null ? stats.avgRating.toFixed(1) : '—'}
                <span className="overview-mystats__rating-of">/5</span>
              </div>
              <div className="overview-mystats__rating-stars" aria-hidden>
                {Array.from({ length: 5 }).map((_, i) => (
                  <StarFilled
                    key={i}
                    className={
                      i < Math.round(stats.avgRating ?? 0)
                        ? 'overview-mystats__star overview-mystats__star--on'
                        : 'overview-mystats__star'
                    }
                  />
                ))}
              </div>
              <div className="overview-mystats__rating-sub">
                Basado en {stats.ratings} valoraciones
              </div>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
