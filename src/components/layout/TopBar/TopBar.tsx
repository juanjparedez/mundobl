'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Avatar, Button, Dropdown, Tooltip } from 'antd';
import {
  SearchOutlined,
  SettingOutlined,
  UserOutlined,
  LoginOutlined,
  LogoutOutlined,
  GlobalOutlined,
  SafetyOutlined,
} from '@ant-design/icons';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { LOCALE_LABELS, SUPPORTED_LOCALES } from '@/i18n/config';
import { ROUTES } from '@/constants/navigation';
import { NotificationsBell } from '../NotificationsBell/NotificationsBell';
import { SettingsPanel } from '../SettingsPanel/SettingsPanel';
import './TopBar.css';

function openCommandK() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('mb:open-command-k'));
  }
}

/** Rutas donde la search global tiene sentido (busca series). En el resto
 *  ocultamos el boton para que el user no se confunda al teclear y obtener
 *  resultados de series desde una pagina que no es de catalogo. */
const SEARCH_ROUTES = [
  '/catalogo',
  '/ver',
  '/watching',
  '/admin/series',
  '/admin/actores',
  '/admin/directores',
  '/admin/productoras',
  '/admin/contenido',
  '/admin/tags',
  '/admin/universos',
];

function shouldShowSearch(pathname: string | null): boolean {
  if (!pathname) return true;
  if (pathname === '/') return true;
  return SEARCH_ROUTES.some(
    (r) => pathname === r || pathname.startsWith(`${r}/`)
  );
}

export function TopBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { t, locale, setLocale } = useLocale();
  const { data: session, status } = useSession();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const isAdmin = session?.user?.role === 'ADMIN';
  const showSearch = shouldShowSearch(pathname);

  const localeItems = SUPPORTED_LOCALES.map((code) => ({
    key: code,
    label: LOCALE_LABELS[code],
    onClick: () => setLocale(code),
  }));

  const userMenuItems = session?.user
    ? [
        {
          key: 'profile',
          icon: <UserOutlined />,
          label: t('sidebar.profile'),
          onClick: () => router.push(ROUTES.PERFIL),
        },
        {
          key: 'settings',
          icon: <SettingOutlined />,
          label: t('bottomNav.settings'),
          onClick: () => setSettingsOpen(true),
        },
        { type: 'divider' as const },
        {
          key: 'logout',
          icon: <LogoutOutlined />,
          label: t('sidebar.logout'),
          onClick: () => signOut({ callbackUrl: '/' }),
          danger: true,
        },
      ]
    : [];

  return (
    <header className="app-topbar" role="banner">
      {showSearch ? (
        <button
          type="button"
          className="app-topbar__search"
          onClick={openCommandK}
          aria-label={t('searchBar.placeholder')}
        >
          <SearchOutlined className="app-topbar__search-icon" aria-hidden />
          <span className="app-topbar__search-text">
            {t('searchBar.placeholder')}
          </span>
          <kbd className="app-topbar__search-kbd" aria-hidden>
            ⌘K
          </kbd>
        </button>
      ) : (
        /* Spacer para mantener el layout cuando no hay search.
         * Si quitamos el button el cluster de actions colapsa al centro. */
        <div className="app-topbar__search-spacer" />
      )}

      <div className="app-topbar__actions">
        {isAdmin && (
          <span
            className="app-topbar__admin-pill"
            role="status"
            aria-label={t('header.adminModeLabel')}
          >
            <SafetyOutlined aria-hidden />
            <span className="app-topbar__admin-pill-text">
              {t('header.adminModeLabel')}
            </span>
          </span>
        )}
        <NotificationsBell variant="topbar" />

        <Dropdown
          menu={{ items: localeItems, selectedKeys: [locale] }}
          placement="bottomRight"
          trigger={['click']}
        >
          <Tooltip title={LOCALE_LABELS[locale]} placement="bottom">
            <button
              type="button"
              className="app-topbar__icon-btn"
              aria-label={LOCALE_LABELS[locale]}
            >
              <GlobalOutlined />
            </button>
          </Tooltip>
        </Dropdown>

        <Tooltip title={t('bottomNav.settings')} placement="bottom">
          <button
            type="button"
            className="app-topbar__icon-btn"
            onClick={() => setSettingsOpen(true)}
            aria-label={t('bottomNav.settings')}
            aria-haspopup="dialog"
          >
            <SettingOutlined />
          </button>
        </Tooltip>

        {status === 'loading' ? (
          <Avatar size={32} icon={<UserOutlined />} />
        ) : session?.user ? (
          <Dropdown
            menu={{ items: userMenuItems }}
            placement="bottomRight"
            trigger={['click']}
          >
            <button
              type="button"
              className="app-topbar__avatar-btn"
              aria-label={session.user.name ?? t('sidebar.profile')}
            >
              <Avatar
                src={session.user.image}
                icon={!session.user.image ? <UserOutlined /> : undefined}
                size={32}
              />
            </button>
          </Dropdown>
        ) : (
          <Button
            type="primary"
            size="small"
            icon={<LoginOutlined />}
            onClick={() =>
              signIn('google', {
                callbackUrl:
                  typeof window !== 'undefined' &&
                  window.location.pathname !== '/'
                    ? window.location.pathname + window.location.search
                    : '/catalogo',
              })
            }
          >
            {t('sidebar.login')}
          </Button>
        )}
      </div>

      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </header>
  );
}
