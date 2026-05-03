'use client';

import './AdminPageHero.css';

interface AdminStatItem {
  label: string;
  value: number | string;
}

interface AdminPageHeroProps {
  title: string;
  subtitle?: string;
  stats?: AdminStatItem[];
}

export function AdminPageHero({ title, subtitle, stats = [] }: AdminPageHeroProps) {
  return (
    <header className="admin-page-hero">
      <div>
        <h2 className="admin-page-hero__title">{title}</h2>
        {subtitle && <p className="admin-page-hero__subtitle">{subtitle}</p>}
      </div>

      {stats.length > 0 && (
        <div className="admin-page-hero__stats">
          {stats.map((item) => (
            <div className="admin-page-hero__stat-card" key={item.label}>
              <span className="admin-page-hero__stat-label">{item.label}</span>
              <strong>{item.value}</strong>
            </div>
          ))}
        </div>
      )}
    </header>
  );
}
