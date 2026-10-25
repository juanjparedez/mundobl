'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button, Spin, Tabs } from 'antd';
import {
  ArrowLeftOutlined,
  BarChartOutlined,
  HomeOutlined,
  MessageOutlined,
  SafetyOutlined,
  SettingOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { TrackingInsightsPage } from '@/components/watching/TrackingInsightsPage/TrackingInsightsPage';
import type { ProfileData } from '../types';
import { ProfileDashboardHeader } from './ProfileDashboardHeader/ProfileDashboardHeader';
import {
  ProfileListCountControl,
  ProfileListPreferences,
} from './ProfileListPreferences/ProfileListPreferences';
import { ProfileSettings } from '../ProfileSettings/ProfileSettings';
import { SubscriptionsSection } from '../SubscriptionsSection/SubscriptionsSection';
import { AchievementsBoard } from '../achievements/AchievementsBoard/AchievementsBoard';
import { ProfileGridTab } from './ProfileGridTab/ProfileGridTab';
import { WIDGET_IDS, registerProfileWidgets } from './profileWidgets';
import './dashboard.css';

export type ProfileTab =
  | 'resumen'
  | 'estadisticas'
  | 'logros'
  | 'actividad'
  | 'ajustes'
  | 'admin';

const TABS: ProfileTab[] = [
  'resumen',
  'estadisticas',
  'logros',
  'actividad',
  'ajustes',
  'admin',
];

export const profileTabHref = (tab: ProfileTab) =>
  tab === 'resumen' ? '/perfil' : `/perfil?tab=${tab}`;

/** /perfil en pestañas: Resumen, Estadisticas, Logros, Actividad, Ajustes
 *  (y Admin para el staff). La pestaña activa vive en ?tab= para poder
 *  linkearla y volver con el boton atras. */
export function DashboardClient() {
  const { t } = useLocale();
  const { status, data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [data, setData] = useState<ProfileData | null>(null);
  const [errored, setErrored] = useState(false);

  const role = data?.user.role ?? (session?.user as { role?: string })?.role;
  const isStaff = role === 'ADMIN' || role === 'MODERATOR';
  const requested = searchParams.get('tab') as ProfileTab | null;
  const activeTab: ProfileTab =
    requested && TABS.includes(requested) && (requested !== 'admin' || isStaff)
      ? requested
      : 'resumen';

  const goToTab = useCallback(
    (tab: ProfileTab) => {
      const params = new URLSearchParams(searchParams.toString());
      if (tab === 'resumen') params.delete('tab');
      else params.set('tab', tab);
      const query = params.toString();
      router.push(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams]
  );

  // El registry es un singleton y register() es idempotente por id.
  useMemo(() => registerProfileWidgets(), []);

  useEffect(() => {
    if (status !== 'authenticated') return;
    let cancelled = false;
    // topN=20: margen para el "ver mas" de las listas (actores, productoras,
    // mejor puntuadas); el default del server es 5.
    fetch('/api/user/profile?topN=20')
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

  // Props inyectadas a cada widget por id.
  const widgetProps = useMemo((): Record<string, Record<string, unknown>> => {
    if (!data) return {};
    return {
      [WIDGET_IDS.heatmap]: { heatmap: data.stats.heatmap },
      [WIDGET_IDS.genres]: { topGenres: data.stats.topGenres },
      [WIDGET_IDS.completedByYear]: {
        completedByYear: data.stats.completedByYear,
      },
      [WIDGET_IDS.topGenresList]: { topGenres: data.stats.topGenres },
      [WIDGET_IDS.topCountries]: { topCountries: data.stats.topCountries },
      [WIDGET_IDS.topActors]: { topActors: data.stats.topActors },
      [WIDGET_IDS.topCompanies]: {
        topProductionCompanies: data.stats.topProductionCompanies,
      },
      [WIDGET_IDS.currentlyWatching]: { items: data.currentlyWatching },
      [WIDGET_IDS.recentlyCompleted]: { items: data.recentlyCompleted },
      [WIDGET_IDS.favorites]: { favorites: data.favorites },
      [WIDGET_IDS.topRated]: { topRatedSeries: data.stats.topRatedSeries },
      [WIDGET_IDS.myReviews]: { recentReviews: data.recentReviews },
      [WIDGET_IDS.achievements]: {
        stats: data.stats,
        boardHref: profileTabHref('logros'),
      },
      [WIDGET_IDS.collections]: { stats: data.stats },
      [WIDGET_IDS.worldMap]: { topCountries: data.stats.topCountries },
      [WIDGET_IDS.socials]: { socials: data.user.socials },
      [WIDGET_IDS.statsStrip]: { stats: data.stats },
      [WIDGET_IDS.profileCompleteness]: {
        user: data.user,
        stats: data.stats,
        settingsHref: profileTabHref('ajustes'),
      },
    };
  }, [data]);

  if (
    status === 'loading' ||
    (status === 'authenticated' && !data && !errored)
  ) {
    return (
      <div className="mb-perfil-dashboard__loading">
        <Spin size="large" />
      </div>
    );
  }

  if (status === 'unauthenticated' || !data) {
    return (
      <div className="mb-perfil-dashboard__error">
        <p>{t('profileDashboard.loadError')}</p>
        <Link href="/">
          <Button icon={<ArrowLeftOutlined />}>{t('common.backToHome')}</Button>
        </Link>
      </div>
    );
  }

  const audience = isStaff ? 'admin' : 'user';
  const grid = (tab: 'resumen' | 'estadisticas' | 'actividad' | 'admin') => (
    <ProfileGridTab tab={tab} audience={audience} widgetProps={widgetProps} />
  );

  const items = [
    {
      key: 'resumen',
      icon: <HomeOutlined />,
      label: t('profileTabs.summary'),
      children: grid('resumen'),
    },
    {
      key: 'estadisticas',
      icon: <BarChartOutlined />,
      label: t('profileTabs.stats'),
      children: (
        <div className="mb-perfil-dashboard__stack">
          <TrackingInsightsPage embedded />
          <h2 className="mb-perfil-dashboard__section-title">
            {t('profileTabs.statsAllTime')}
          </h2>
          {grid('estadisticas')}
        </div>
      ),
    },
    {
      key: 'logros',
      icon: <TrophyOutlined />,
      label: t('profileTabs.achievements'),
      children: <AchievementsBoard stats={data.stats} />,
    },
    {
      key: 'actividad',
      icon: <MessageOutlined />,
      label: t('profileTabs.activity'),
      children: grid('actividad'),
    },
    {
      key: 'ajustes',
      icon: <SettingOutlined />,
      label: t('profileTabs.settings'),
      children: (
        <div className="mb-perfil-dashboard__settings-grid">
          <div className="mb-perfil-dashboard__panel">
            <ProfileSettings />
          </div>
          <div className="mb-perfil-dashboard__panel">
            <SubscriptionsSection />
          </div>
          <div className="mb-perfil-dashboard__panel">
            <h2 className="mb-perfil-dashboard__section-title">
              {t('profileTabs.listsTitle')}
            </h2>
            <ProfileListCountControl />
            <p className="mb-perfil-dashboard__hint">
              {t('profileTabs.layoutHint')}
            </p>
          </div>
        </div>
      ),
    },
    ...(isStaff
      ? [
          {
            key: 'admin',
            icon: <SafetyOutlined />,
            label: t('profileTabs.admin'),
            children: grid('admin'),
          },
        ]
      : []),
  ];

  return (
    <div className="mb-perfil-dashboard">
      <ProfileDashboardHeader
        user={data.user}
        onEditProfile={() => goToTab('ajustes')}
      />
      <ProfileListPreferences
        key={data.user.id}
        userId={data.user.id}
        showControl={false}
      >
        <Tabs
          className="mb-perfil-dashboard__tabs"
          aria-label={t('profileTabs.label')}
          activeKey={activeTab}
          onChange={(key) => goToTab(key as ProfileTab)}
          items={items}
          destroyOnHidden
        />
      </ProfileListPreferences>
    </div>
  );
}
