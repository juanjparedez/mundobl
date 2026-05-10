'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Button, Spin } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
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
import './ProfileOverviewClient.css';

/** Vista por defecto de /perfil — composicion fija alineada al style-guide
 *  (style-guide/my-profile.png + my-.profile2.png). Toda la data viene de
 *  /api/user/profile + endpoints satelite (/api/notifications,
 *  /api/feedback/my-cases, /api/user/comments). Sin data sintetizada.
 *
 *  La vista configurable con widgets reordenables vive en /perfil/dashboard. */
export function ProfileOverviewClient() {
  const { status } = useSession();
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);

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

  return (
    <AppLayout>
      <div className="overview-page">
        <OverviewHeader
          user={data.user}
          onEditClick={handleEditClick}
          onPreferencesClick={() => setSettingsOpen(true)}
        />

        <ProfileStatsStrip stats={data.stats} />

        {/* Bloque principal: 3 columnas alineadas al style-guide */}
        <div className="overview-page__main">
          <div className="overview-page__col-left">
            <OverviewWatchingShelf items={data.currentlyWatching} />
            <OverviewMyStats stats={data.stats} />
            <div className="overview-page__row-3">
              <OverviewReviewsActivity stats={data.stats} />
              <OverviewCountriesPanel topCountries={data.stats.topCountries} />
              <OverviewYearSummary stats={data.stats} />
            </div>
          </div>
          <div className="overview-page__col-mid">
            <OverviewReviewsPanel recentReviews={data.recentReviews} />
            <OverviewCollections stats={data.stats} />
          </div>
          <div className="overview-page__col-right">
            <OverviewCommentsPanel />
          </div>
        </div>

        {/* Bloque secundario: 4 cells abajo */}
        <div className="overview-page__row-4">
          <OverviewFollowedTitles favorites={data.favorites} />
          <OverviewNotifications />
          <OverviewCases />
          <OverviewAchievements stats={data.stats} />
        </div>

        {/* Footer config + paneles existentes (Settings + Subs + Version) */}
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
      </div>

      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </AppLayout>
  );
}
