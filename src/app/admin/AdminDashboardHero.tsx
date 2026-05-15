'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { Button } from 'antd';
import {
  LineChartOutlined,
  FileTextOutlined,
  BellOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import { useSession } from 'next-auth/react';
import { useLocale } from '@/lib/providers/LocaleProvider';

interface Stat {
  label: string;
  value: number;
  icon?: ReactNode;
}

interface AdminDashboardHeroProps {
  stats: Stat[];
  /** Toolbar de edicion de layout. Se renderiza pegado al hero, debajo
   *  de stats, para evitar que el control de layout quede flotando. */
  editToolbar?: ReactNode;
}

// Hero del dashboard admin: saludo personalizado + acciones rapidas
// top-right (mock-aligned con style-guide/admin.png) + 4 KPIs.
// Las acciones linkean a rutas que ya existen (/admin/stats, /admin/logs,
// /admin/changelog, /admin/usuarios) — no se inventan features. Es
// client porque usa session para el saludo.
export function AdminDashboardHero({
  stats,
  editToolbar,
}: AdminDashboardHeroProps) {
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
      </div>
      <div className="admin-dashboard__hero-stats">
        {stats.map((s) => (
          <div key={s.label} className="admin-dashboard__hero-stat">
            {s.icon && (
              <span className="admin-dashboard__hero-stat-icon" aria-hidden>
                {s.icon}
              </span>
            )}
            <div className="admin-dashboard__hero-stat-body">
              <div className="admin-dashboard__hero-stat-value">{s.value}</div>
              <div className="admin-dashboard__hero-stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>
      {/* Acciones rapidas top-right (mock-aligned). Linkean a rutas
       *  existentes — no agregan funcionalidad nueva, solo shortcuts. */}
      <div className="admin-dashboard__hero-actions">
        <Link href="/admin/stats">
          <Button size="small" icon={<LineChartOutlined />}>
            {t('adminHero.actionInsights')}
          </Button>
        </Link>
        <Link href="/admin/logs">
          <Button size="small" icon={<FileTextOutlined />}>
            {t('adminHero.actionAuditLog')}
          </Button>
        </Link>
        <Link href="/admin/changelog">
          <Button size="small" icon={<BellOutlined />}>
            {t('adminHero.actionChangelog')}
          </Button>
        </Link>
        <Link href="/admin/usuarios">
          <Button size="small" icon={<AppstoreOutlined />}>
            {t('adminHero.actionUsers')}
          </Button>
        </Link>
      </div>
      {editToolbar && (
        <div className="admin-dashboard__hero-tools">{editToolbar}</div>
      )}
    </header>
  );
}
