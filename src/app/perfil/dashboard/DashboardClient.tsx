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
import { useSectionVisibility } from '../overview/useSectionVisibility';
import { CustomizeDrawer } from '../overview/CustomizeDrawer';
import './dashboard.css';

export function DashboardClient() {
  const { t } = useLocale();
  const { status, data: session } = useSession();
  const [data, setData] = useState<ProfileData | null>(null);
  const [errored, setErrored] = useState(false);
  const [customizeOpen, setCustomizeOpen] = useState(false);

  // Customizacion por section: persiste hidden keys en localStorage. El
  // mismo hook que usaba el overview, reusado aca para no duplicar la
  // logica de visibilidad (regla: codigo reusable, no dashboards en
  // paralelo).
  const { isVisible, toggle, reset } = useSectionVisibility();

  // Layout por rol — copia literal de los mocks (style-guide/my-profile.png
  // y my-.profile2.png). Composicion fija con cells togglables via
  // CustomizeDrawer.
  const isAdmin =
    (data?.user.role ?? (session?.user as { role?: string })?.role) === 'ADMIN';

  useEffect(() => {
    if (status !== 'authenticated') return;
    let cancelled = false;
    fetch('/api/user/profile')
      .then((res) => (res.ok ? res.json() : null))
      .then((profile: ProfileData | null) => {
        if (cancelled) return;
        if (profile) setData(profile);
        else setErrored(true);
      })
      .catch(() => {
        if (!cancelled) setErrored(true);
      });
    return () => {
      cancelled = true;
    };
  }, [status]);

  if (
    status === 'loading' ||
    (status === 'authenticated' && !data && !errored)
  ) {
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
        <ProfileDashboardHeader
          user={data.user}
          onCustomizeClick={() => setCustomizeOpen(true)}
        />
        <ProfileStatsStrip stats={data.stats} />

        {isAdmin ? (
          <ProfileAdminLayout data={data} isVisible={isVisible} />
        ) : (
          <ProfileUserLayout data={data} isVisible={isVisible} />
        )}

        {/* Settings + suscripciones + version info — togglable via key
         *  'settings'. El id mb-profile-settings es target de scroll del
         *  boton "Editar perfil" del header. */}
        {isVisible('settings') && (
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
        )}
      </div>

      <CustomizeDrawer
        open={customizeOpen}
        onClose={() => setCustomizeOpen(false)}
        isVisible={isVisible}
        onToggle={toggle}
        onReset={reset}
      />
    </AppLayout>
  );
}
