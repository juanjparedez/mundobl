'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Button, Spin, Tooltip } from 'antd';
import { ArrowLeftOutlined, ControlOutlined } from '@ant-design/icons';
import { AppLayout } from '@/components/layout/AppLayout/AppLayout';
import { SettingsPanel } from '@/components/layout/SettingsPanel/SettingsPanel';
import { ProfileStatsStrip } from '../dashboard/ProfileStatsStrip/ProfileStatsStrip';
import type { ProfileData } from '../types';
import { OverviewHeader } from './sections/Header';
import { OverviewWatchingShelf } from './sections/WatchingShelf';
import { OverviewMyStats } from './sections/MyStats';
import { OverviewReviewsActivity } from './sections/ReviewsActivity';
import { OverviewCountriesPanel } from './sections/CountriesPanel';
import { OverviewYearSummary } from './sections/YearSummary';
import { OverviewReviewsPanel } from './sections/ReviewsPanel';
import { OverviewCommentsPanel } from './sections/CommentsPanel';
import { OverviewCollections } from './sections/Collections';
import { OverviewFollowedTitles } from './sections/FollowedTitles';
import { OverviewNotifications } from './sections/Notifications';
import { OverviewCases } from './sections/Cases';
import { OverviewAchievements } from './sections/Achievements';
import { OverviewSettingsRow } from './sections/SettingsRow';
import { ProfileSettings } from '../ProfileSettings/ProfileSettings';
import { SubscriptionsSection } from '../SubscriptionsSection/SubscriptionsSection';
import { ClientVersionInfo } from '../ClientVersionInfo/ClientVersionInfo';
import { CustomizeDrawer } from './CustomizeDrawer';
import { useSectionVisibility } from './useSectionVisibility';
import './ProfileOverviewClient.css';

/** Vista por defecto de /perfil — composicion fija alineada al style-guide.
 *  Cada seccion puede ocultarse desde el drawer "Personalizar" (boton en
 *  el header) — la preferencia persiste en localStorage. La vista
 *  configurable con widgets reordenables vive en /perfil/dashboard. */
export function ProfileOverviewClient() {
  const { status } = useSession();
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const { isVisible, toggle, reset } = useSectionVisibility();

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
        /* manejo silencioso */
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [status]);

  const handleEditClick = () => {
    const target = document.getElementById('mb-profile-settings');
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (status === 'loading' || (loading && !data)) {
    return (
      <AppLayout>
        <div className="overview-page__state">
          <Spin size="large" />
        </div>
      </AppLayout>
    );
  }

  if (status === 'unauthenticated' || !data) {
    return (
      <AppLayout>
        <div className="overview-page__state">
          <p>No pudimos cargar tu perfil.</p>
          <Link href="/perfil/clasico">
            <Button icon={<ArrowLeftOutlined />}>Volver a la vista clásica</Button>
          </Link>
        </div>
      </AppLayout>
    );
  }

  // Helper para que el JSX abajo sea legible.
  const v = isVisible;

  // Cuento qué bloques de la izquierda (mystats / row3) estan visibles
  // para no dejar dead space.
  const row3Items = [
    v('reviewsActivity') && (
      <OverviewReviewsActivity key="ra" stats={data.stats} />
    ),
    v('countries') && (
      <OverviewCountriesPanel
        key="cp"
        topCountries={data.stats.topCountries}
      />
    ),
    v('yearSummary') && (
      <OverviewYearSummary key="ys" stats={data.stats} />
    ),
  ].filter(Boolean);

  return (
    <AppLayout>
      <div className="overview-page">
        <div className="overview-page__top">
          <OverviewHeader
            user={data.user}
            onEditClick={handleEditClick}
            onPreferencesClick={() => setSettingsOpen(true)}
          />
          <Tooltip title="Personalizar paneles visibles">
            <Button
              icon={<ControlOutlined />}
              onClick={() => setCustomizeOpen(true)}
              className="overview-page__customize-btn"
              size="small"
            >
              Personalizar
            </Button>
          </Tooltip>
        </div>

        <ProfileStatsStrip stats={data.stats} />

        {/* Bloque principal: 3 columnas */}
        <div className="overview-page__main">
          <div className="overview-page__col-left">
            {v('watching') && (
              <OverviewWatchingShelf items={data.currentlyWatching} />
            )}
            {v('mystats') && <OverviewMyStats stats={data.stats} />}
            {row3Items.length > 0 && (
              <div
                className="overview-page__row-3"
                data-cols={row3Items.length}
              >
                {row3Items}
              </div>
            )}
          </div>
          <div className="overview-page__col-mid">
            {v('reviews') && (
              <OverviewReviewsPanel recentReviews={data.recentReviews} />
            )}
            {v('collections') && <OverviewCollections stats={data.stats} />}
          </div>
          <div className="overview-page__col-right">
            {v('comments') && <OverviewCommentsPanel />}
          </div>
        </div>

        {/* Bloque secundario: 4 cells abajo (oculto si todas estan off) */}
        {(v('followed') ||
          v('notifications') ||
          v('cases') ||
          v('achievements')) && (
          <div className="overview-page__row-4">
            {v('followed') && (
              <OverviewFollowedTitles favorites={data.favorites} />
            )}
            {v('notifications') && <OverviewNotifications />}
            {v('cases') && <OverviewCases />}
            {v('achievements') && <OverviewAchievements stats={data.stats} />}
          </div>
        )}

        {/* Footer config + paneles existentes */}
        {v('settings') && (
          <div className="overview-page__footer" id="mb-profile-settings">
            <OverviewSettingsRow />
            <div className="overview-page__legacy-panels">
              <div className="overview-page__legacy-card">
                <ProfileSettings />
              </div>
              <div className="overview-page__legacy-card">
                <SubscriptionsSection />
              </div>
            </div>
            <ClientVersionInfo />
            <p className="overview-page__alt">
              <Link href="/perfil/dashboard">
                ¿Querés reordenar los paneles? Abrí la vista configurable →
              </Link>
            </p>
          </div>
        )}
      </div>

      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />

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
