'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Button } from 'antd';
import { AppstoreOutlined } from '@ant-design/icons';
import { useLocale } from '@/lib/providers/LocaleProvider';

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
  const { t } = useLocale();
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
        <div style={{ marginTop: 'var(--spacing-sm)' }}>
          <Link href="/admin/dashboard">
            <Button type="primary" icon={<AppstoreOutlined />}>
              {t('adminDashboard.fromClassicLink')}
            </Button>
          </Link>
        </div>
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
