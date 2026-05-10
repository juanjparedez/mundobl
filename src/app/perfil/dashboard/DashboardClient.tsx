'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Button, Spin } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { AppLayout } from '@/components/layout/AppLayout/AppLayout';
import { useLocale } from '@/lib/providers/LocaleProvider';
import type { ProfileData } from '../types';
import { ProfileDashboardHeader } from './ProfileDashboardHeader/ProfileDashboardHeader';
import { ProfileStatsStrip } from './ProfileStatsStrip/ProfileStatsStrip';
import { ProfileAdminLayout } from './ProfileAdminLayout/ProfileAdminLayout';
import { ProfileUserLayout } from './ProfileUserLayout/ProfileUserLayout';
import { ProfileSettings } from '../ProfileSettings/ProfileSettings';
import { SubscriptionsSection } from '../SubscriptionsSection/SubscriptionsSection';
import { ClientVersionInfo } from '../ClientVersionInfo/ClientVersionInfo';
import './dashboard.css';

/** Render del perfil — header + stats strip + layout fijo segun rol +
 *  footer (settings + subs + version). El layout central NO es un grid
 *  reordenable; cada rol tiene su composicion bespoke alineada al mock. */
export function DashboardClient() {
  const { t } = useLocale();
  const { status, data: session } = useSession();
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  const isAdmin =
    (data?.user.role ?? (session?.user as { role?: string })?.role) === 'ADMIN';

  useEffect(() => {
    if (status !== 'authenticated') return;
    let cancelled = false;
    setLoading(true);
    fetch('/api/user/profile')
      .then((res) => (res.ok ? res.json() : null))
      .then((profile: ProfileData | null) => {
        if (cancelled) return;
        setData(profile);
      })
      .catch(() => {
        /* manejo silencioso — el render muestra estado de error */
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [status]);

  if (status === 'loading' || (loading && !data)) {
    return (
      <AppLayout>
        <div className="mb-perfil-dashboard__loading">
          <Spin size="large" />
        </div>
      </AppLayout>
    );
  }

  if (status === 'unauthenticated' || !data) {
    return (
      <AppLayout>
        <div className="mb-perfil-dashboard__error">
          <p>{t('profileDashboard.loadError')}</p>
          <Link href="/perfil/clasico">
            <Button icon={<ArrowLeftOutlined />}>
              {t('profileDashboard.backToClassic')}
            </Button>
          </Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mb-perfil-dashboard">
        <ProfileDashboardHeader user={data.user} />
        <ProfileStatsStrip stats={data.stats} />

        {isAdmin ? (
          <ProfileAdminLayout data={data} />
        ) : (
          <ProfileUserLayout data={data} />
        )}

        {/* Footer: settings + subs + version. id mb-profile-settings es el
         * target del scroll del boton "Editar perfil" del header. */}
        <div className="mb-perfil-dashboard__footer" id="mb-profile-settings">
          <div className="mb-perfil-dashboard__footer-grid">
            <div className="mb-perfil-dashboard__footer-panel">
              <ProfileSettings />
            </div>
            <div className="mb-perfil-dashboard__footer-panel">
              <SubscriptionsSection />
            </div>
          </div>
          <ClientVersionInfo />
        </div>
      </div>
    </AppLayout>
  );
}
