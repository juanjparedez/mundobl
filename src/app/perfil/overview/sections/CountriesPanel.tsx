'use client';

import { GlobalOutlined } from '@ant-design/icons';
import { CountryFlag } from '@/components/common/CountryFlag/CountryFlag';
import type { ProfileData } from '../../types';
import './CountriesPanel.css';

interface Props {
  topCountries: ProfileData['stats']['topCountries'];
}

/** "Países favoritos" del style-guide: lista compacta con flag + nombre +
 *  porcentaje real respecto al total. Sin world map (no hay lib y no
 *  quiero agregar dependencia solo por la decoracion). */
export function OverviewCountriesPanel({ topCountries }: Props) {
  const total = topCountries.reduce((s, c) => s + c.count, 0);
  const visible = topCountries.slice(0, 5);

  return (
    <section className="overview-countries">
      <header className="overview-countries__head">
        <h3 className="overview-countries__title">
          <GlobalOutlined /> Países favoritos
        </h3>
      </header>
      {visible.length === 0 ? (
        <div className="overview-countries__empty">Sin datos aún</div>
      ) : (
        <ul className="overview-countries__list">
          {visible.map((c, idx) => {
            const pct = total > 0 ? Math.round((c.count / total) * 100) : 0;
            return (
              <li key={`${c.name}-${idx}`} className="overview-countries__item">
                <span className="overview-countries__flag">
                  {c.code ? (
                    <CountryFlag code={c.code} size="medium" />
                  ) : (
                    <GlobalOutlined />
                  )}
                </span>
                <span className="overview-countries__name">{c.name}</span>
                <span className="overview-countries__pct">{pct}%</span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
