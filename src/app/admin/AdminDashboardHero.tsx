'use client';

import { useSession } from 'next-auth/react';

interface Stat {
  label: string;
  value: number;
}

interface AdminDashboardHeroProps {
  stats: Stat[];
}

// Hero del dashboard admin: saludo personalizado + tarjetas de stats
// resumen de la app. Es client porque usa la sesion para el saludo.
export function AdminDashboardHero({ stats }: AdminDashboardHeroProps) {
  const { data: session } = useSession();
  const firstName = session?.user?.name?.split(' ')[0] ?? null;

  return (
    <header className="admin-dashboard__hero">
      <div className="admin-dashboard__hero-text">
        <h1 className="admin-dashboard__hero-title">
          {firstName ? `Hola, ${firstName}` : 'Panel de administración'}
        </h1>
        <p className="admin-dashboard__hero-subtitle">
          Atajos a todas las herramientas de gestión.
        </p>
      </div>
      <div className="admin-dashboard__hero-stats">
        {stats.map((s) => (
          <div key={s.label} className="admin-dashboard__hero-stat">
            <div className="admin-dashboard__hero-stat-value">{s.value}</div>
            <div className="admin-dashboard__hero-stat-label">{s.label}</div>
          </div>
        ))}
      </div>
    </header>
  );
}
